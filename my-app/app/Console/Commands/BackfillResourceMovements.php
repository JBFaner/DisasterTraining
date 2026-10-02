<?php

namespace App\Console\Commands;

use App\Models\ResourceEventAssignment;
use App\Models\ResourceMovement;
use Illuminate\Console\Command;

class BackfillResourceMovements extends Command
{
    protected $signature = 'resources:backfill-movements {--dry-run : Preview without writing rows}';

    protected $description = 'Backfill resource_movements from existing event assignments';

    public function handle(): int
    {
        $dryRun = (bool) $this->option('dry-run');
        $created = 0;
        $skipped = 0;

        ResourceEventAssignment::query()
            ->with(['resource:id,name', 'event:id,title'])
            ->orderBy('id')
            ->chunkById(100, function ($assignments) use ($dryRun, &$created, &$skipped) {
                foreach ($assignments as $assignment) {
                    $status = match ($assignment->status) {
                        'Returned' => 'Returned',
                        'Reserved' => 'Reserved',
                        default => 'In Use',
                    };

                    $exists = ResourceMovement::query()
                        ->where('resource_id', $assignment->resource_id)
                        ->where('simulation_event_id', $assignment->event_id)
                        ->where('status', $status)
                        ->exists();

                    if ($exists) {
                        $skipped++;

                        continue;
                    }

                    if ($dryRun) {
                        $this->line("Would create: {$assignment->resource?->name} → {$assignment->event?->title} ({$status})");
                        $created++;

                        continue;
                    }

                    ResourceMovement::create([
                        'resource_id' => $assignment->resource_id,
                        'simulation_event_id' => $assignment->event_id,
                        'requested_by' => 'Inventory Admin',
                        'source_module' => 'Resource Inventory',
                        'quantity' => max(1, (int) ($assignment->quantity_assigned ?? 1)),
                        'status' => $status,
                        'notes' => 'Backfilled from event assignment',
                        'created_at' => $assignment->assigned_at ?? $assignment->created_at,
                        'updated_at' => $assignment->updated_at,
                    ]);
                    $created++;
                }
            });

        $this->info(($dryRun ? 'Would create' : 'Created')." {$created} movement row(s); skipped {$skipped} existing.");

        return self::SUCCESS;
    }
}
