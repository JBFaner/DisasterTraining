<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class AdminUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Default LGU admin account for JB.
        User::updateOrCreate(
            ['email' => 'jbcursor@gmail.com'],
            [
                'name' => 'JB',
                // Password is hashed automatically by the User model's casts.
                'password' => 'admin123',
                'role' => 'LGU_ADMIN',
                'status' => 'active',
                'registered_at' => now(),
                'email_verified_at' => now(), // mark as verified so admin login works
            ]
        );

        // Additional verified LGU admin account for Rey.
        User::updateOrCreate(
            ['email' => 'reyreyko2@gmail.com'],
            [
                'name' => 'Rey',
                // Uses same default password for now; change after first login.
                'password' => 'admin123',
                'role' => 'LGU_ADMIN',
                'status' => 'active',
                'registered_at' => now(),
                'email_verified_at' => now(), // Fully verified
            ]
        );

        // Admin account for Reymon.
        User::updateOrCreate(
            ['email' => 'brogada.reymon09@gmail.com'],
            [
                'name' => 'Reymon',
                'password' => 'admin123',
                'role' => 'LGU_ADMIN',
                'status' => 'active',
                'registered_at' => now(),
                'email_verified_at' => now(), // Fully verified
            ]
        );

        // LGU Trainer accounts (Trainer List source of truth via Users & Roles).
        $trainers = [
            [
                'email' => 'maria.santos.trainer@lgu.local',
                'name' => 'Maria Santos',
                'phone' => '09171234567',
                'barangay' => 'Barangay San Jose',
            ],
            [
                'email' => 'juan.delacruz.trainer@lgu.local',
                'name' => 'Juan Dela Cruz',
                'phone' => '09189876543',
                'barangay' => 'Barangay Poblacion',
            ],
            [
                'email' => 'ana.reyes.trainer@lgu.local',
                'name' => 'Ana Reyes',
                'phone' => '09201112233',
                'barangay' => 'Barangay Riverside',
            ],
        ];

        $bridge = app(\App\Services\StaffTrainerBridgeService::class);

        foreach ($trainers as $trainer) {
            $user = User::updateOrCreate(
                ['email' => $trainer['email']],
                [
                    'name' => $trainer['name'],
                    'password' => 'trainer123',
                    'role' => 'LGU_TRAINER',
                    'status' => 'active',
                    'phone' => $trainer['phone'],
                    'barangay' => $trainer['barangay'],
                    'registered_at' => now(),
                    'email_verified_at' => now(),
                ]
            );
            $bridge->ensureMirror($user);
        }
    }
}

