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
            RolesSeeder::class,
            PermissionsSeeder::class,
            CertificateTemplateSeeder::class,
            TrainingModuleSeeder::class,
            ScenarioSeeder::class,
            SimulationEventSeeder::class,
            ResourceSeeder::class,
            BarangayProfileSeeder::class,
            ParticipantSeeder::class,
            EdrillParticipantSeeder::class,
            RegisteredParticipantForEvaluationSeeder::class,
            DemoEvaluationAndCertificationSeeder::class,
            RandomParticipantAttendanceSeeder::class,
        ]);
    }
}
