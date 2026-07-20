<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            AdminUserSeeder::class,
            PersonnelSeeder::class,
            RolesSeeder::class,
            PermissionsSeeder::class,
            CertificateTemplateSeeder::class,
            QualifiedTrainerSeeder::class,
            TrainingModuleSeeder::class,
            FireSafetyEmergencyResponseSeeder::class,
            ScenarioSeeder::class,
            SimulationEventSeeder::class,
            ResourceSeeder::class,
            PhilippinesLocationSeeder::class,
            HazardAssessmentSeeder::class,
            ParticipantSeeder::class,
            EdrillParticipantSeeder::class,
            RegisteredParticipantForEvaluationSeeder::class,
            DemoEvaluationAndCertificationSeeder::class,
            RandomParticipantAttendanceSeeder::class,
        ]);
    }
}
