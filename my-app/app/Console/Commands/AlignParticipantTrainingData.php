<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Services\ParticipantTrainingSummaryService;
use Illuminate\Console\Command;

class AlignParticipantTrainingData extends Command
{
    protected $signature = 'participants:align-training-data {--user-id= : Limit to one participant user id} {--dry-run : Preview removals only}';

    protected $description = 'Remove stale and out-of-order lesson completions / quiz attempts';

    public function handle(ParticipantTrainingSummaryService $trainingSummary): int
    {
        $userId = $this->option('user-id') ? (int) $this->option('user-id') : null;
        $dryRun = (bool) $this->option('dry-run');

        if ($dryRun) {
            $this->warn('Dry run only — no rows will be deleted.');
        }

        if ($userId) {
            $counts = $dryRun
                ? $trainingSummary->countAllParticipantTrainingData($userId)
                : $trainingSummary->alignAllParticipantTrainingData($userId);
            $this->reportCounts("Participant #{$userId}", $counts, $dryRun);

            return self::SUCCESS;
        }

        $totals = ['stale_completions' => 0, 'out_of_order' => 0];
        User::query()
            ->where('role', 'PARTICIPANT')
            ->orderBy('id')
            ->chunkById(100, function ($users) use ($trainingSummary, $dryRun, &$totals) {
                foreach ($users as $user) {
                    $counts = $dryRun
                        ? $trainingSummary->countAllParticipantTrainingData((int) $user->id)
                        : $trainingSummary->alignAllParticipantTrainingData((int) $user->id);

                    if (($counts['stale_completions'] ?? 0) > 0 || ($counts['out_of_order'] ?? 0) > 0) {
                        $this->reportCounts("User #{$user->id} ({$user->name})", $counts, $dryRun);
                    }

                    $totals['stale_completions'] += (int) ($counts['stale_completions'] ?? 0);
                    $totals['out_of_order'] += (int) ($counts['out_of_order'] ?? 0);
                }
            });

        $this->info(
            'Done. '
            .($totals['stale_completions']).' stale completion(s), '
            .($totals['out_of_order']).' out-of-order row(s) '
            .($dryRun ? 'would be removed' : 'removed').'.'
        );

        return self::SUCCESS;
    }

    /**
     * @param  array{stale_completions?: int, out_of_order?: int}  $counts
     */
    protected function reportCounts(string $label, array $counts, bool $dryRun): void
    {
        $suffix = $dryRun ? 'would be removed' : 'removed';
        $this->line(sprintf(
            '%s: %d stale completion(s), %d out-of-order row(s) %s.',
            $label,
            (int) ($counts['stale_completions'] ?? 0),
            (int) ($counts['out_of_order'] ?? 0),
            $suffix,
        ));
    }
}
