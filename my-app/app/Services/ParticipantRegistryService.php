<?php

namespace App\Services;

use App\Models\AiScenarioAttempt;
use App\Models\CampaignRegistration;
use App\Models\CampaignRequest;
use App\Models\Certificate;
use App\Models\EvaluationResult;
use App\Models\LessonCompletion;
use App\Models\TrainingModule;
use App\Models\User;
use Illuminate\Support\Collection;

class ParticipantRegistryService
{
    public function enrichParticipant(User $user): User
    {
        $statuses = $this->computeStatuses($user);
        $user->training_status = $statuses['training_status'];
        $user->attendance_status = $statuses['attendance_status'];
        $user->evaluation_status = $statuses['evaluation_status'];
        $user->certificate_status = $statuses['certificate_status'];
        $user->municipality = $user->city;
        $user->participant_source = $this->resolveSource($user);
        $user->registered_modules = $this->loadRegisteredModulesForUser($user->id);

        return $user;
    }

    /**
     * @param  Collection<int, User>|array<int, User>  $participants
     */
    public function enrichMany(Collection|array $participants): Collection
    {
        $collection = $participants instanceof Collection ? $participants : collect($participants);
        $ids = $collection->pluck('id')->filter()->all();

        if ($ids === []) {
            return $collection;
        }

        $lessonCounts = LessonCompletion::query()
            ->whereIn('user_id', $ids)
            ->selectRaw('user_id, COUNT(*) as total')
            ->groupBy('user_id')
            ->pluck('total', 'user_id');

        $aiCompletedCounts = AiScenarioAttempt::query()
            ->whereIn('user_id', $ids)
            ->where('status', AiScenarioAttempt::STATUS_COMPLETED)
            ->selectRaw('user_id, COUNT(*) as total')
            ->groupBy('user_id')
            ->pluck('total', 'user_id');

        $evaluationCounts = EvaluationResult::query()
            ->whereIn('participant_id', $ids)
            ->selectRaw('participant_id, COUNT(*) as total')
            ->groupBy('participant_id')
            ->pluck('total', 'participant_id');

        $certificateCounts = Certificate::query()
            ->whereIn('user_id', $ids)
            ->whereNull('revoked_at')
            ->selectRaw('user_id, COUNT(*) as total')
            ->groupBy('user_id')
            ->pluck('total', 'user_id');

        $registrationsByUser = CampaignRegistration::query()
            ->with(['trainingModule:id,title', 'campaignRequest:id,proposed_session_label,session_index'])
            ->whereIn('user_id', $ids)
            ->where('registration_status', CampaignRegistration::STATUS_REGISTERED)
            ->orderByDesc('registered_at')
            ->get()
            ->groupBy('user_id');

        return $collection->map(function (User $user) use (
            $lessonCounts,
            $aiCompletedCounts,
            $evaluationCounts,
            $certificateCounts,
            $registrationsByUser,
        ) {
            $user->municipality = $user->city;
            $user->participant_source = $this->resolveSource($user);

            $regs = $registrationsByUser->get($user->id, collect());
            $user->registered_modules = $regs
                ->map(fn (CampaignRegistration $reg) => $this->mapRegistrationRow($reg))
                ->unique(fn ($row) => $row['campaign_request_id'])
                ->values()
                ->all();

            $user->training_status = $this->resolveTrainingStatus(
                (int) ($lessonCounts[$user->id] ?? 0),
                (int) ($aiCompletedCounts[$user->id] ?? 0),
            );
            $user->attendance_status = $this->resolveAttendanceStatus($user);
            $user->evaluation_status = ((int) ($evaluationCounts[$user->id] ?? 0)) > 0
                ? 'Completed'
                : 'Not Evaluated';
            $user->certificate_status = ((int) ($certificateCounts[$user->id] ?? 0)) > 0
                ? 'Issued'
                : 'None';

            return $user;
        });
    }

    /**
     * @return array{training_status: string, attendance_status: string, evaluation_status: string, certificate_status: string}
     */
    public function computeStatuses(User $user): array
    {
        $lessonCount = LessonCompletion::where('user_id', $user->id)->count();
        $aiCompleted = AiScenarioAttempt::where('user_id', $user->id)
            ->where('status', AiScenarioAttempt::STATUS_COMPLETED)
            ->count();
        $evaluationCount = EvaluationResult::where('participant_id', $user->id)->count();
        $certificateCount = Certificate::where('user_id', $user->id)->whereNull('revoked_at')->count();

        return [
            'training_status' => $this->resolveTrainingStatus($lessonCount, $aiCompleted),
            'attendance_status' => $this->resolveAttendanceStatus($user),
            'evaluation_status' => $evaluationCount > 0 ? 'Completed' : 'Not Evaluated',
            'certificate_status' => $certificateCount > 0 ? 'Issued' : 'None',
        ];
    }

    public function buildFilterOptions(): array
    {
        $base = User::where('role', 'PARTICIPANT');

        $modules = TrainingModule::query()
            ->whereIn('id', CampaignRegistration::query()
                ->where('registration_status', CampaignRegistration::STATUS_REGISTERED)
                ->whereNotNull('training_module_id')
                ->distinct()
                ->pluck('training_module_id'))
            ->orderBy('title')
            ->get(['id', 'title'])
            ->map(fn (TrainingModule $module) => [
                'id' => (int) $module->id,
                'title' => $module->title,
            ])
            ->values()
            ->all();

        $batches = CampaignRequest::query()
            ->with('trainingModule:id,title')
            ->whereIn('id', CampaignRegistration::query()
                ->where('registration_status', CampaignRegistration::STATUS_REGISTERED)
                ->distinct()
                ->pluck('campaign_request_id'))
            ->orderByDesc('id')
            ->get()
            ->map(fn (CampaignRequest $request) => [
                'id' => (int) $request->id,
                'training_module_id' => (int) $request->training_module_id,
                'label' => $this->formatBatchLabel($request),
                'module_title' => $request->trainingModule?->title,
            ])
            ->values()
            ->all();

        return [
            'barangays' => (clone $base)->whereNotNull('barangay')->distinct()->orderBy('barangay')->pluck('barangay')->filter()->values()->all(),
            'municipalities' => (clone $base)->whereNotNull('city')->distinct()->orderBy('city')->pluck('city')->filter()->values()->all(),
            'sources' => ['local', 'campaign'],
            'modules' => $modules,
            'batches' => $batches,
        ];
    }

    public function resolveSource(User $user): string
    {
        if (
            $user->registration_source === 'synced'
            || $user->registration_source === 'campaign_planning_scheduling'
            || ! empty($user->group6_external_id)
        ) {
            return 'campaign';
        }

        return 'local';
    }

    protected function formatBatchLabel(?CampaignRequest $request): string
    {
        if (! $request) {
            return 'Batch';
        }

        $label = trim((string) ($request->proposed_session_label ?? ''));
        if ($label !== '') {
            return $label;
        }

        $session = $request->session_index;
        if ($session !== null && $session !== '') {
            return 'Batch '.$session.' (Campaign #'.$request->id.')';
        }

        return 'Batch / Campaign #'.$request->id;
    }

    /**
     * @return list<array{training_module_id: int, module_title: ?string, campaign_request_id: int, batch_label: string}>
     */
    protected function loadRegisteredModulesForUser(int $userId): array
    {
        return CampaignRegistration::query()
            ->with(['trainingModule:id,title', 'campaignRequest:id,proposed_session_label,session_index'])
            ->where('user_id', $userId)
            ->where('registration_status', CampaignRegistration::STATUS_REGISTERED)
            ->orderByDesc('registered_at')
            ->get()
            ->map(fn (CampaignRegistration $reg) => $this->mapRegistrationRow($reg))
            ->unique(fn ($row) => $row['campaign_request_id'])
            ->values()
            ->all();
    }

    /**
     * @return array{training_module_id: int, module_title: ?string, campaign_request_id: int, batch_label: string}
     */
    protected function mapRegistrationRow(CampaignRegistration $reg): array
    {
        return [
            'training_module_id' => (int) $reg->training_module_id,
            'module_title' => $reg->trainingModule?->title,
            'campaign_request_id' => (int) $reg->campaign_request_id,
            'batch_label' => $this->formatBatchLabel($reg->campaignRequest),
        ];
    }

    protected function resolveTrainingStatus(int $lessonCount, int $aiCompleted): string
    {
        if ($lessonCount === 0 && $aiCompleted === 0) {
            return 'Not Started';
        }

        if ($aiCompleted > 0 || $lessonCount >= 3) {
            return 'Completed';
        }

        return 'In Progress';
    }

    protected function resolveAttendanceStatus(User $user): string
    {
        $attendances = $user->relationLoaded('attendances')
            ? $user->attendances
            : $user->attendances()->get();

        if ($attendances->isEmpty()) {
            return 'No Records';
        }

        $present = $attendances->whereIn('status', ['present', 'late', 'completed'])->count();
        $total = $attendances->count();

        if ($present === 0) {
            return 'Absent';
        }

        if ($present >= $total) {
            return 'Active';
        }

        return 'Partial';
    }
}
