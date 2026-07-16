<?php

namespace App\Services;

use App\Http\Controllers\Admin\CampaignRequestController;
use App\Models\CampaignRegistration;
use App\Models\CampaignRequest;
use App\Models\AiScenarioAttempt;
use App\Models\Certificate;
use App\Models\EvaluationResult;
use App\Models\LessonCompletion;
use App\Models\TrainingModule;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Validation\ValidationException;

class CampaignRegistrationService
{
    /**
     * @return array<string, mixed>|null
     */
    public function buildContext(CampaignRequest $campaignRequest): ?array
    {
        $campaignRequest->loadMissing('trainingModule');
        $planning = CampaignRequestController::campaignPlanningFieldsFromPayload($campaignRequest->payload ?? []);
        $registeredCount = $this->registeredCount($campaignRequest);
        $maximumParticipants = (int) ($planning['maximum_participants'] ?? 0);
        $isApproved = (string) $campaignRequest->status === 'approved';
        $registrationEnabled = $maximumParticipants > 0
            ? $registeredCount < $maximumParticipants
            : true;

        if (! $isApproved || ! $registrationEnabled) {
            return null;
        }

        return [
            'campaign_request_id' => $campaignRequest->id,
            'training_module_id' => $campaignRequest->training_module_id,
            'training_title' => $planning['training_title'] ?? $campaignRequest->trainingModule?->title,
            'short_description' => $planning['short_description'] ?? null,
            'registration_opens' => $planning['registration_opens'] ?? null,
            'registration_deadline' => $planning['registration_deadline'] ?? null,
            'training_completion_deadline' => $planning['training_completion_deadline'] ?? null,
            'maximum_participants' => $planning['maximum_participants'] ?? null,
            'expected_participants' => $planning['expected_participants'] ?? null,
            'registered_participants_count' => $registeredCount,
            'scheduled_date' => $planning['scheduled_date'] ?? $planning['registration_deadline'] ?? $planning['registration_opens'] ?? null,
            'start_time' => $planning['start_time'] ?? null,
            'end_time' => $planning['end_time'] ?? null,
            'venue' => $planning['venue'] ?? null,
        ];
    }

    public function isRegistrationOpen(CampaignRequest $campaignRequest): bool
    {
        return $this->buildContext($campaignRequest) !== null;
    }

    public function registeredCount(CampaignRequest $campaignRequest): int
    {
        return CampaignRegistration::query()
            ->where('campaign_request_id', $campaignRequest->id)
            ->where('registration_status', CampaignRegistration::STATUS_REGISTERED)
            ->count();
    }

    public function isAlreadyRegistered(User $user, CampaignRequest $campaignRequest): bool
    {
        return CampaignRegistration::query()
            ->where('user_id', $user->id)
            ->where('campaign_request_id', $campaignRequest->id)
            ->where('registration_status', CampaignRegistration::STATUS_REGISTERED)
            ->exists();
    }

    public function register(User $user, CampaignRequest $campaignRequest): CampaignRegistration
    {
        if (! $this->isRegistrationOpen($campaignRequest)) {
            throw ValidationException::withMessages([
                'form' => 'Registration is not open for this campaign.',
            ]);
        }

        if ($this->isAlreadyRegistered($user, $campaignRequest)) {
            throw ValidationException::withMessages([
                'form' => 'You are already registered for this campaign.',
            ]);
        }

        return CampaignRegistration::create([
            'user_id' => $user->id,
            'campaign_request_id' => $campaignRequest->id,
            'training_module_id' => $campaignRequest->training_module_id,
            'registration_status' => CampaignRegistration::STATUS_REGISTERED,
            'registered_at' => now(),
            'attendance_status' => CampaignRegistration::ATTENDANCE_NOT_STARTED,
            'evaluation_status' => CampaignRegistration::EVALUATION_NOT_STARTED,
            'certificate_status' => CampaignRegistration::CERTIFICATE_NOT_ISSUED,
        ]);
    }

    /**
     * @return Collection<int, array<string, mixed>>
     */
    public function trainingHistoryFor(User $user): Collection
    {
        $registrations = CampaignRegistration::query()
            ->with(['campaignRequest.trainingModule', 'trainingModule'])
            ->where('user_id', $user->id)
            ->where('registration_status', CampaignRegistration::STATUS_REGISTERED)
            ->orderByDesc('registered_at')
            ->get();

        return $registrations->map(function (CampaignRegistration $registration) use ($user) {
            $module = $registration->trainingModule;
            $moduleId = (int) ($module?->id ?? $registration->training_module_id);
            $planning = CampaignRequestController::campaignPlanningFieldsFromPayload(
                $registration->campaignRequest?->payload ?? [],
            );

            return [
                'id' => $registration->id,
                'campaign_request_id' => $registration->campaign_request_id,
                'training_module_id' => $moduleId,
                'title' => $planning['training_title'] ?? $module?->title ?? 'Training Campaign',
                'registered_at' => $registration->registered_at?->toIso8601String(),
                'registration_deadline' => $planning['registration_deadline'] ?? null,
                'scheduled_date' => $planning['scheduled_date'] ?? $planning['registration_deadline'] ?? null,
                'venue' => $planning['venue'] ?? null,
                'training_status' => $this->resolveTrainingStatusLabel($user, $module),
                'attendance_status' => $this->resolveAttendanceStatusLabel($registration),
                'evaluation_status' => $this->resolveEvaluationStatusLabel($user, $moduleId),
                'certificate_status' => $this->resolveCertificateStatusLabel($user, $moduleId),
            ];
        });
    }

    private function resolveTrainingStatusLabel(User $user, ?TrainingModule $module): string
    {
        if (! $module) {
            return 'Registered';
        }

        $moduleId = (int) $module->id;
        $totalLessons = $module->contents()->count();
        $lessonCount = LessonCompletion::query()
            ->where('user_id', $user->id)
            ->where('training_module_id', $moduleId)
            ->count();

        $aiCompleted = AiScenarioAttempt::query()
            ->where('user_id', $user->id)
            ->where('training_module_id', $moduleId)
            ->where('status', AiScenarioAttempt::STATUS_COMPLETED)
            ->exists();

        if ($lessonCount === 0 && ! $aiCompleted) {
            return 'Registered';
        }

        if ($aiCompleted || ($totalLessons > 0 && $lessonCount >= $totalLessons) || $lessonCount >= 3) {
            return 'Completed';
        }

        return 'In Progress';
    }

    private function resolveAttendanceStatusLabel(CampaignRegistration $registration): string
    {
        return match ($registration->attendance_status) {
            'present' => 'Present',
            'absent' => 'Absent',
            'partial' => 'Partial',
            default => 'Not Started',
        };
    }

    private function resolveEvaluationStatusLabel(User $user, int $moduleId): string
    {
        $hasEvaluation = EvaluationResult::query()
            ->where('participant_id', $user->id)
            ->where('training_module_id', $moduleId)
            ->exists();

        return $hasEvaluation ? 'Completed' : 'Not Started';
    }

    private function resolveCertificateStatusLabel(User $user, int $moduleId): string
    {
        $hasCertificate = Certificate::query()
            ->where('user_id', $user->id)
            ->where('training_module_id', $moduleId)
            ->exists();

        return $hasCertificate ? 'Issued' : 'Not Issued';
    }
}
