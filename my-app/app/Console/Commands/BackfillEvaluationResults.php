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

        if ($attempts->isEmpty()) {
            $this->info('No completed attempts need backfilling.');

            return self::SUCCESS;
        }

        $this->info(sprintf('Found %d completed attempt(s) without evaluation records.', $attempts->count()));

        $created = 0;
        foreach ($attempts as $attempt) {
            if ($dryRun) {
                $this->line("Would backfill attempt #{$attempt->id} (user {$attempt->user_id})");
                continue;
            }

            $scoringService->createFromAttempt($attempt);
            $created++;
            $this->line("Created evaluation for attempt #{$attempt->id}");
        }

        if ($dryRun) {
            $this->info('Dry run complete. Re-run without --dry-run to create records.');
        } else {
            $this->info("Backfill complete. Created {$created} evaluation record(s).");
        }

        return self::SUCCESS;
    }
}
