<?php

namespace Database\Seeders;

use App\Models\Scenario;
use App\Support\SimulationEvaluationCriteria;
use Illuminate\Database\Seeder;

/**
 * Refresh scenario scoring criteria using PH-aligned defaults.
 *
 * Run: php artisan db:seed --class=SimulationEvaluationCriteriaSeeder
 */
class SimulationEvaluationCriteriaSeeder extends Seeder
{
    public function run(): void
    {
        $updated = 0;

        Scenario::query()->orderBy('id')->each(function (Scenario $scenario) use (&$updated) {
            $criteria = SimulationEvaluationCriteria::resolve(null, $scenario->disaster_type);
            $scenario->update(['criteria' => $criteria]);
            $updated++;
        });

        $this->command?->info("Updated scoring criteria on {$updated} scenario(s).");
        $this->command?->line('Source: config/simulation_evaluation.php (BFP / NSED-aligned).');
    }
}
