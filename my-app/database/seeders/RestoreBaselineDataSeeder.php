<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

/**
 * One-command restore of baseline data from the Inventory.sql snapshot.
 *
 * Usage: php artisan db:seed --class=RestoreBaselineDataSeeder
 */
class RestoreBaselineDataSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            AdminUserSeeder::class,
            RolesSeeder::class,
            PermissionsSeeder::class,
            CertificateTemplateSeeder::class,
            QualifiedTrainerSeeder::class,
            PhilippinesLocationSeeder::class,
            ScenarioSeeder::class,
            ParticipantSeeder::class,
            InventoryParticipantSeeder::class,
            SimulationEventSeeder::class,
            DemoEvaluationAndCertificationSeeder::class,
            RandomParticipantAttendanceSeeder::class,
            FireSafetyEmergencyResponseSeeder::class,
            InventoryEventRegistrationSeeder::class,
            HazardAssessmentSeeder::class,
        ]);

        $this->command?->info('Baseline inventory data restore complete.');
        $this->command?->info('Admin login: brogada.reymon09@gmail.com / admin123');
        $this->command?->info('Fire Safety module: /admin/training-modules (look for "Fire Safety and Emergency Response")');
        $this->command?->info('Hazard profiles: /admin/hazard-assessment-profiles');
    }
}
