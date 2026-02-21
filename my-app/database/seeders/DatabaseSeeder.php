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
        // You can add additional seeders here as needed.
        $this->call([
            AdminUserSeeder::class,
            RolesSeeder::class,
            PermissionsSeeder::class,
            EdrillParticipantSeeder::class,
            RegisteredParticipantForEvaluationSeeder::class,
        ]);
    }
}
