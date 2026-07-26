<?php

namespace Database\Seeders;

use App\Models\User;
use App\Services\StaffTrainerBridgeService;
use Illuminate\Database\Seeder;

/**
 * Realistic Medical Team STAFF for Simulation Readiness assignment.
 *
 * No Group 5 partner API — Medical Team is assigned from local Users & Roles
 * where position = "Medical Team". Scoped to Novaliches / Quezon City
 * (Barangay San Agustin and nearby areas) for the capstone demo.
 *
 * Password for all: trainer123
 */
class MedicalTeamSeeder extends Seeder
{
    public function run(): void
    {
        $bridge = app(StaffTrainerBridgeService::class);

        $team = [
            [
                'email' => 'patricia.lim@lgu.local',
                'name' => 'Dra. Patricia Lim',
                'phone' => '09178124501',
                'barangay' => 'Barangay Fairview',
                'organization' => 'Quezon City Health Department — Novaliches District',
            ],
            [
                'email' => 'angelica.dizon@lgu.local',
                'name' => 'Nurse Angelica Dizon, RN',
                'phone' => '09188234512',
                'barangay' => 'Barangay Sauyo',
                'organization' => 'Quezon City Health Department',
            ],
            [
                'email' => 'mark.santos.emt@lgu.local',
                'name' => 'Mark Anthony Santos, EMT',
                'phone' => '09199345623',
                'barangay' => 'Barangay San Agustin',
                'organization' => 'Quezon City DRRMO — Medical Response Unit',
            ],
            [
                'email' => 'rosa.villanueva.bhw@lgu.local',
                'name' => 'Rosa Mae Villanueva, BHW',
                'phone' => '09201456734',
                'barangay' => 'Barangay San Agustin',
                'organization' => 'Barangay San Agustin Health Station',
            ],
            [
                'email' => 'jose.ramos.emt@lgu.local',
                'name' => 'Jose Miguel Ramos, EMT',
                'phone' => '09212567845',
                'barangay' => 'Barangay Novaliches Proper',
                'organization' => 'Philippine Red Cross — Quezon City Chapter',
            ],
            [
                'email' => 'catherine.uy.rn@lgu.local',
                'name' => 'Catherine Uy, RN',
                'phone' => '09223678956',
                'barangay' => 'Barangay Santa Monica',
                'organization' => 'Quezon City Health Department',
            ],
            [
                'email' => 'daniel.garcia.fa@lgu.local',
                'name' => 'Daniel Garcia',
                'phone' => '09234789067',
                'barangay' => 'Barangay Capri',
                'organization' => 'Quezon City DRRMO — Volunteer First Aiders',
            ],
            [
                'email' => 'marites.cruz.midwife@lgu.local',
                'name' => 'Marites Cruz, RM',
                'phone' => '09245890178',
                'barangay' => 'Barangay San Agustin',
                'organization' => 'Barangay San Agustin Health Station',
            ],
        ];

        foreach ($team as $row) {
            $user = User::updateOrCreate(
                ['email' => $row['email']],
                [
                    'name' => $row['name'],
                    'password' => 'trainer123',
                    'role' => 'STAFF',
                    'position' => 'Medical Team',
                    'status' => 'active',
                    'assignment_status' => User::ASSIGNMENT_AVAILABLE,
                    'phone' => $row['phone'],
                    'barangay' => $row['barangay'],
                    'organization' => $row['organization'],
                    'registered_at' => now(),
                    'email_verified_at' => now(),
                ]
            );

            // STAFF should not keep an active trainer mirror.
            $bridge->ensureMirror($user);
        }

        $count = User::query()
            ->where('role', 'STAFF')
            ->where('position', 'Medical Team')
            ->where('status', 'active')
            ->count();

        $this->command?->info("Medical Team seeded ({$count} active STAFF). Password: trainer123");
    }
}
