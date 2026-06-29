<?php

namespace App\Services;

use App\Models\AiScenarioAttempt;
use App\Models\EvaluationResult;
use App\Models\TrainingModule;
use App\Models\TrainingProgressReset;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class TrainingResetService
{
    public const STATUS_CANCELLED = 'cancelled';

    public function __construct(
        private readonly LessonProgressionService $lessonProgressionService,
    ) {}

    public function currentCycleNumber(int $participantId, int $moduleId): int
    {
        $active = $this->activeReset($participantId, $moduleId);

        return $active?->cycle_number ?? 1;
    }

    public function activeReset(int $participantId, int $moduleId): ?TrainingProgressReset
    {
        return TrainingProgressReset::query()
            ->where('participant_id', $participantId)
            ->where('training_module_id', $moduleId)
            ->where('is_active', true)
            ->latest('id')
            ->first();
    }

    public function hasAdminRetrainingApproved(User $participant, TrainingModule $module): bool
    {
        $reset = $this->activeReset($participant->id, $module->id);

        if (! $reset || $reset->cycle_number <= 1) {
            return false;
        }

        if ($module->participantHasCompletedAllContents($participant->id)) {
            return false;
        }

        return ! $this->hasPassedInCurrentCycle($participant->id, $module->id);
    }

    public function canResetEvaluation(EvaluationResult $result): bool
    {
        return $result->status === EvaluationResult::STATUS_NEEDS_IMPROVEMENT;
    }

    public function resetFromEvaluation(EvaluationResult $result, User $admin, ?string $reason = null): TrainingProgressReset
    {
        $result->loadMissing(['participant', 'trainingModule']);

        if (! $this->canResetEvaluation($result)) {
            throw ValidationException::withMessages([
                'evaluation' => 'Only failed evaluations can be reset for a new training attempt.',
            ]);
        }

        return $this->resetParticipantModule(
            $result->participant,
            $result->trainingModule,
            $admin,
            $result,
            $reason,
        );
    }

    /**
     * @param  list<int>  $evaluationResultIds
     * @return array{reset_count: int, resets: list<TrainingProgressReset>}
     */
    public function bulkResetFromEvaluations(array $evaluationResultIds, User $admin, ?string $reason = null): array
    {
        $results = EvaluationResult::query()
            ->with(['participant', 'trainingModule'])
            ->whereIn('id', $evaluationResultIds)
            ->get();

        if ($results->isEmpty()) {
            throw ValidationException::withMessages([
                'evaluation_result_ids' => 'No evaluation records were selected.',
            ]);
        }

        $nonFailed = $results->filter(fn (EvaluationResult $r) => ! $this->canResetEvaluation($r));
        if ($nonFailed->isNotEmpty()) {
            throw ValidationException::withMessages([
                'evaluation_result_ids' => 'Only failed participants can be reset. Remove passed or in-progress selections.',
            ]);
        }

        $unique = $results->unique(fn (EvaluationResult $r) => $r->participant_id.'-'.$r->training_module_id);

        $resets = [];

        DB::transaction(function () use ($unique, $admin, $reason, &$resets) {
            foreach ($unique as $result) {
                $resets[] = $this->resetParticipantModule(
                    $result->participant,
                    $result->trainingModule,
                    $admin,
                    $result,
                    $reason,
                    false,
                );
            }
        });

        AuditLogger::log([
            'user' => $admin,
            'action' => 'Bulk reset training progress',
            'module' => 'Evaluation & Scoring',
            'status' => 'success',
            'description' => 'Administrator authorized re-training for '.count($resets).' participant(s).',
            'metadata' => [
                'reset_count' => count($resets),
                'evaluation_result_ids' => $unique->pluck('id')->values()->all(),
                'reason' => $reason,
            ],
        ]);

        return [
            'reset_count' => count($resets),
            'resets' => $resets,
        ];
    }

    public function resetParticipantModule(
        User $participant,
        TrainingModule $module,
        User $admin,
        ?EvaluationResult $evaluationResult = null,
        ?string $reason = null,
        bool $logIndividually = true,
    ): TrainingProgressReset {
        if ($participant->role !== 'PARTICIPANT') {
            throw ValidationException::withMessages([
                'participant' => 'Training progress can only be reset for participants.',
            ]);
        }

        return DB::transaction(function () use ($participant, $module, $admin, $evaluationResult, $reason, $logIndividually) {
            $currentCycle = $this->currentCycleNumber($participant->id, $module->id);
            $newCycle = $currentCycle + 1;

            TrainingProgressReset::query()
                ->where('participant_id', $participant->id)
                ->where('training_module_id', $module->id)
                ->where('is_active', true)
                ->update(['is_active' => false]);

            $this->cancelInProgressAttempts($participant->id, $module->id);
            $lessonsCleared = $this->lessonProgressionService->resetParticipantProgress($participant, $module);

            $reset = TrainingProgressReset::create([
                'participant_id' => $participant->id,
                'training_module_id' => $module->id,
                'reset_by_user_id' => $admin->id,
                'evaluation_result_id' => $evaluationResult?->id,
                'cycle_number' => $newCycle,
                'reason' => $reason,
                'reset_at' => now(),
                'is_active' => true,
            ]);

            if ($logIndividually) {
                AuditLogger::log([
                    'user' => $admin,
                    'action' => 'Reset training for re-attempt',
                    'module' => 'Evaluation & Scoring',
                    'status' => 'success',
                    'description' => sprintf(
                        'Reset training progress for %s on module "%s".',
                        $participant->name,
                        $module->title,
                    ),
                    'metadata' => [
                        'participant_id' => $participant->id,
                        'participant_name' => $participant->name,
                        'training_module_id' => $module->id,
                        'training_module_title' => $module->title,
                        'evaluation_result_id' => $evaluationResult?->id,
                        'cycle_number' => $newCycle,
                        'lessons_cleared' => $lessonsCleared,
                        'reason' => $reason,
                    ],
                ]);
            }

            return $reset;
        });
    }

    public function cancelInProgressAttempts(int $participantId, int $moduleId): int
    {
        return AiScenarioAttempt::query()
            ->where('user_id', $participantId)
            ->where('training_module_id', $moduleId)
            ->where('status', AiScenarioAttempt::STATUS_IN_PROGRESS)
            ->update([
                'status' => self::STATUS_CANCELLED,
                'completed_at' => now(),
                'submitted_at' => now(),
                'time_remaining_seconds' => 0,
            ]);
    }

    public function hasPassedInCurrentCycle(int $participantId, int $moduleId): bool
    {
        $cycle = $this->currentCycleNumber($participantId, $moduleId);

        return AiScenarioAttempt::query()
            ->where('user_id', $participantId)
            ->where('training_module_id', $moduleId)
            ->where('training_cycle', $cycle)
            ->where('passed', true)
            ->whereIn('status', [
                AiScenarioAttempt::STATUS_COMPLETED,
                AiScenarioAttempt::STATUS_EXPIRED,
            ])
            ->exists();
    }

    /**
     * @return Collection<int, AiScenarioAttempt>
     */
    public function completedAttemptsInCycle(int $participantId, int $moduleId, ?int $cycle = null): Collection
    {
        $cycle ??= $this->currentCycleNumber($participantId, $moduleId);

        return AiScenarioAttempt::query()
            ->where('user_id', $participantId)
            ->where('training_module_id', $moduleId)
            ->where('training_cycle', $cycle)
            ->whereIn('status', [
                AiScenarioAttempt::STATUS_COMPLETED,
                AiScenarioAttempt::STATUS_EXPIRED,
            ])
            ->orderBy('attempt_number')
            ->get();
    }
}
