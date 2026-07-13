<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

/**
 * Seeds all simulation planning test campaigns in one run.
 *
 * Run: php artisan db:seed --class=SimulationPlanningTestDataSeeder
 */
class SimulationPlanningTestDataSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            SimulationPlanningReadyCampaignSeeder::class,
            SimulationPlanningUnderQuotaCampaignsSeeder::class,
        ]);
    }
}
