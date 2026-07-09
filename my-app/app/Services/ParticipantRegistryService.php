<?php

namespace App\Services;

use App\Models\AiScenarioAttempt;
use App\Models\Certificate;
use App\Models\EvaluationResult;
use App\Models\LessonCompletion;
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

        return $collection->map(function (User $user) use ($lessonCounts, $aiCompletedCounts, $evaluationCounts, $certificateCounts) {
            $user->municipality = $user->city;
            $user->participant_source = $this->resolveSource($user);
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

        return [
            'barangays' => (clone $base)->whereNotNull('barangay')->distinct()->orderBy('barangay')->pluck('barangay')->filter()->values()->all(),
            'municipalities' => (clone $base)->whereNotNull('city')->distinct()->orderBy('city')->pluck('city')->filter()->values()->all(),
            'sources' => ['local', 'synced'],
        ];
    }

    public function resolveSource(User $user): string
    {
        if ($user->registration_source === 'synced' || ! empty($user->group6_external_id)) {
            return 'synced';
        }

        return 'local';
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
