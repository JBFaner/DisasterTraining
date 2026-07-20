<?php

namespace Database\Seeders;

use App\Models\User;
use App\Services\StaffTrainerBridgeService;
use Illuminate\Database\Seeder;

/**
 * Example LGU DRRM personnel for Users & Roles + exercise-plan assignment.
 *
 * Account role rules:
 * - LGU_TRAINER — only people who train (Lead / Assistant Trainer)
 * - STAFF — Evaluator, Safety, Marshal, Medical, Comm, Attendance, etc.
 *
 * Trainers are mirrored to qualified_trainers.
 * Staff appear in the exercise-plan pool via Users (source_group: lgu_staff).
 *
 * Password for all: trainer123
 */
class PersonnelSeeder extends Seeder
{
    public function run(): void
    {
        $bridge = app(StaffTrainerBridgeService::class);

        $personnel = [
            // --- Trainers (actually train) ---
            [
                'email' => 'miguel.villanueva@lgu.local',
                'name' => 'Engr. Miguel Villanueva',
                'phone' => '09171234001',
                'barangay' => 'Barangay Commonwealth',
                'position' => 'Lead Trainer',
                'role' => 'LGU_TRAINER',
            ],
            [
                'email' => 'diego.francisco@lgu.local',
                'name' => 'Capt. Diego Francisco',
                'phone' => '09241234008',
                'barangay' => 'Barangay Bagong Silangan',
                'position' => 'Lead Trainer',
                'role' => 'LGU_TRAINER',
            ],
            [
                'email' => 'carla.mendoza@lgu.local',
                'name' => 'Carla Mae Mendoza',
                'phone' => '09181234002',
                'barangay' => 'Barangay Batasan Hills',
                'position' => 'Assistant Trainer',
                'role' => 'LGU_TRAINER',
            ],
            [
                'email' => 'paolo.enriquez@lgu.local',
                'name' => 'Paolo Enriquez',
                'phone' => '09281234012',
                'barangay' => 'Barangay New Era',
                'position' => 'Assistant Trainer',
                'role' => 'LGU_TRAINER',
            ],

            // --- Staff (support roles; do not train) ---
            [
                'email' => 'elena.navarro@lgu.local',
                'name' => 'Prof. Elena Navarro',
                'phone' => '09221234006',
                'barangay' => 'Barangay Culiat',
                'position' => 'Evaluator',
                'role' => 'STAFF',
            ],
            [
                'email' => 'sofia.manalo@lgu.local',
                'name' => 'Atty. Sofia Manalo',
                'phone' => '09271234011',
                'barangay' => 'Barangay Matandang Balara',
                'position' => 'Evaluator',
                'role' => 'STAFF',
            ],
            [
                'email' => 'ramon.bautista@lgu.local',
                'name' => 'SPO1 Ramon Bautista',
                'phone' => '09191234003',
                'barangay' => 'Barangay Holy Spirit',
                'position' => 'Safety Officer',
                'role' => 'STAFF',
            ],
            [
                'email' => 'nestor.quiambao@lgu.local',
                'name' => 'Nestor Quiambao',
                'phone' => '09251234009',
                'barangay' => 'Barangay Pasong Tamo',
                'position' => 'Safety Officer',
                'role' => 'STAFF',
            ],
            [
                'email' => 'julius.capistrano@lgu.local',
                'name' => 'Julius Capistrano',
                'phone' => '09201234004',
                'barangay' => 'Barangay Payatas',
                'position' => 'Marshal',
                'role' => 'STAFF',
            ],
            [
                'email' => 'benedicto.ramos.staff@lgu.local',
                'name' => 'Benedicto Ramos',
                'phone' => '09311234014',
                'barangay' => 'Barangay Holy Spirit',
                'position' => 'Marshal',
                'role' => 'STAFF',
            ],
            [
                'email' => 'patricia.lim@lgu.local',
                'name' => 'Dra. Patricia Lim',
                'phone' => '09211234005',
                'barangay' => 'Barangay Fairview',
                'position' => 'Medical Team',
                'role' => 'STAFF',
            ],
            [
                'email' => 'angelica.dizon@lgu.local',
                'name' => 'Nurse Angelica Dizon',
                'phone' => '09261234010',
                'barangay' => 'Barangay Sauyo',
                'position' => 'Medical Team',
                'role' => 'STAFF',
            ],
            [
                'email' => 'kristine.alonzo@lgu.local',
                'name' => 'Kristine Mae Alonzo',
                'phone' => '09231234007',
                'barangay' => 'Barangay Tandang Sora',
                'position' => 'Communication Officer',
                'role' => 'STAFF',
            ],
            [
                'email' => 'lia.torres.staff@lgu.local',
                'name' => 'Lia Camille Torres',
                'phone' => '09301234013',
                'barangay' => 'Barangay Commonwealth',
                'position' => 'Communication Officer',
                'role' => 'STAFF',
            ],
            [
                'email' => 'rowena.castillo.staff@lgu.local',
                'name' => 'Rowena Castillo',
                'phone' => '09321234015',
                'barangay' => 'Barangay Fairview',
                'position' => 'Attendance Officer',
                'role' => 'STAFF',
            ],
        ];

        foreach ($personnel as $row) {
            $user = User::updateOrCreate(
                ['email' => $row['email']],
                [
                    'name' => $row['name'],
                    'password' => 'trainer123',
                    'role' => $row['role'],
                    'position' => $row['position'],
                    'status' => 'active',
                    'phone' => $row['phone'],
                    'barangay' => $row['barangay'],
                    'registered_at' => now(),
                    'email_verified_at' => now(),
                ]
            );

            // Trainers get assignment mirrors; former trainers flipped to STAFF get deactivated.
            $mirror = $bridge->ensureMirror($user);
            if ($mirror) {
                $mirror->update([
                    'specialization' => $row['position'],
                    'barangay' => $row['barangay'],
                    'metadata' => array_merge($mirror->metadata ?? [], [
                        'source' => 'personnel_seeder',
                        'position' => $row['position'],
                    ]),
                ]);
            }
        }

        // Legacy sample accounts from AdminUserSeeder
        $legacy = [
            'maria.santos.trainer@lgu.local' => ['position' => 'Lead Trainer', 'role' => 'LGU_TRAINER'],
            'juan.delacruz.trainer@lgu.local' => ['position' => 'Assistant Trainer', 'role' => 'LGU_TRAINER'],
            'ana.reyes.trainer@lgu.local' => ['position' => 'Evaluator', 'role' => 'STAFF'],
        ];

        foreach ($legacy as $email => $meta) {
            $user = User::query()->where('email', $email)->first();
            if (! $user) {
                continue;
            }
            $user->update([
                'position' => $meta['position'],
                'role' => $meta['role'],
            ]);
            $bridge->ensureMirror($user->fresh());
        }

        $bridge->syncAllTrainerMirrors();

        $this->command?->info('Personnel seeded (4 Lead/Assistant trainers + 11 staff support). Password: trainer123');
    }
}
