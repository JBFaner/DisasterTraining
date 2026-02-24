<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class ParticipantSeeder extends Seeder
{
    public function run(): void
    {
        if (User::where('role', 'PARTICIPANT')->count() >= 10) {
            $this->command?->info('At least 10 participants already exist; skipping ParticipantSeeder.');
            return;
        }

        $baseParticipants = [
            [
                'name' => 'Juan Dela Cruz',
                'email' => 'juan.delacruz@example.com',
                'phone' => '+63 9123456780',
                'street' => 'Blk 1 Lot 10, Barangay Commonwealth, Quezon City',
            ],
            [
                'name' => 'Maria Santos',
                'email' => 'maria.santos@example.com',
                'phone' => '+63 9123456781',
                'street' => 'Blk 2 Lot 5, Barangay Batasan Hills, Quezon City',
            ],
            [
                'name' => 'Josefa Reyes',
                'email' => 'josefa.reyes@example.com',
                'phone' => '+63 9123456782',
                'street' => 'Unit 3C, Commonwealth Heights Condominium, Quezon City',
            ],
            [
                'name' => 'Pedro Ramirez',
                'email' => 'pedro.ramirez@example.com',
                'phone' => '+63 9123456783',
                'street' => 'Purok 4, Riverside, Barangay Bagong Silangan, Quezon City',
            ],
            [
                'name' => 'Ana Bautista',
                'email' => 'ana.bautista@example.com',
                'phone' => '+63 9123456784',
                'street' => 'No. 25, Don Antonio Heights, Quezon City',
            ],
            [
                'name' => 'Ramon Garcia',
                'email' => 'ramon.garcia@example.com',
                'phone' => '+63 9123456785',
                'street' => 'Blk 7 Lot 2, Barangay Holy Spirit, Quezon City',
            ],
            [
                'name' => 'Luzviminda Cruz',
                'email' => 'luz.cruz@example.com',
                'phone' => '+63 9123456786',
                'street' => '27 Dahlia Street, Barangay Fairview, Quezon City',
            ],
            [
                'name' => 'Carlos Fernandez',
                'email' => 'carlos.fernandez@example.com',
                'phone' => '+63 9123456787',
                'street' => '11 Masaya Street, Barangay Central, Quezon City',
            ],
            [
                'name' => 'Elena Mendoza',
                'email' => 'elena.mendoza@example.com',
                'phone' => '+63 9123456788',
                'street' => '15 Kalayaan Avenue, Barangay Kamuning, Quezon City',
            ],
            [
                'name' => 'Roberto Aquino',
                'email' => 'roberto.aquino@example.com',
                'phone' => '+63 9123456789',
                'street' => '3 Scout Tobias Street, Barangay Laging Handa, Quezon City',
            ],
        ];

        foreach ($baseParticipants as $participant) {
            User::firstOrCreate(
                ['email' => $participant['email']],
                [
                    'name' => $participant['name'],
                    'password' => Hash::make('password'),
                    'role' => 'PARTICIPANT',
                    'status' => 'active',
                    'phone' => $participant['phone'],
                    'street' => $participant['street'],
                ]
            );
        }
    }
}

