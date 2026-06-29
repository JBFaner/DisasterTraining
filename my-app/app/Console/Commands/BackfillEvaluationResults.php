<?php

namespace App\Console\Commands;

use App\Models\AiScenarioAttempt;
use App\Services\EvaluationScoringService;
use Illuminate\Console\Command;

class BackfillEvaluationResults extends Command
{
    protected $signature = 'evaluations:backfill {--dry-run : Preview without creating records}';

    protected $description = 'Create evaluation_results records from completed AI scenario attempts';

    public function handle(EvaluationScoringService $scoringService): int
    {
        $dryRun = (bool) $this->option('dry-run');

        $attempts = AiScenarioAttempt::query()
            ->whereNotNull('completed_at')
            ->whereDoesntHave('evaluationResult')
            ->orderBy('id')
            ->get();

        $created = 0;
        $synced = 0;

        if ($attempts->isNotEmpty()) {
            $this->info(sprintf('Found %d completed attempt(s) without evaluation records.', $attempts->count()));

            foreach ($attempts as $attempt) {
                if ($dryRun) {
                    $this->line("Would backfill attempt #{$attempt->id} (user {$attempt->user_id})");
                    continue;
                }

                $scoringService->createFromAttempt($attempt);
                $created++;
                $this->line("Created evaluation for attempt #{$attempt->id}");
            }
        } else {
            $this->info('No completed attempts need backfilling.');
        }

        $existing = \App\Models\EvaluationResult::query()
            ->whereNotNull('ai_scenario_attempt_id')
            ->where(function ($query) {
                $query->whereNull('attempt_number')->orWhereNull('duration_seconds');
            })
            ->with('aiScenarioAttempt')
            ->get();

        foreach ($existing as $evaluation) {
            $attempt = $evaluation->aiScenarioAttempt;
            if (! $attempt) {
                continue;
            }

            $durationSeconds = null;
            if ($attempt->started_at && $attempt->completed_at) {
                $durationSeconds = max(0, (int) $attempt->started_at->diffInSeconds($attempt->completed_at));
            }

            if ($dryRun) {
                $this->line("Would sync meta for evaluation #{$evaluation->id}");
                continue;
            }

            $evaluation->update([
                'attempt_number' => $evaluation->attempt_number ?? $attempt->attempt_number,
                'duration_seconds' => $evaluation->duration_seconds ?? $durationSeconds,
            ]);
            $synced++;
        }

        if ($synced > 0) {
            $this->info("Synced attempt metadata for {$synced} evaluation record(s).");
        }

        if ($dryRun) {
            $this->info('Dry run complete. Re-run without --dry-run to create records.');
        } else {
            $this->info("Backfill complete. Created {$created} evaluation record(s). Synced {$synced} attempt metadata record(s).");
        }

        return self::SUCCESS;
    }
}
