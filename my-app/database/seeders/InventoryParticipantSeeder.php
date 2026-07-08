<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

/**
 * Restores participant accounts from the Inventory.sql backup snapshot.
 */
class InventoryParticipantSeeder extends Seeder
{
    public function run(): void
    {
        $participants = [
            [
                'name' => 'Reymon Brogada',
                'email' => 'brogadareymon12@gmail.com',
                'phone' => '+63 9633405152',
                'street' => 'blk 49 lot 3 kaong st. Caloocan city',
                'participant_id' => 'PART-ERXRZS5Y',
                'status' => 'active',
                'password' => 'password',
            ],
        ];

        foreach ($participants as $participant) {
            User::updateOrCreate(
                ['email' => $participant['email']],
                [
                    'name' => $participant['name'],
                    'password' => Hash::make($participant['password']),
                    'role' => 'PARTICIPANT',
                    'status' => $participant['status'],
                    'phone' => $participant['phone'] ?? null,
                    'street' => $participant['street'] ?? null,
                    'participant_id' => $participant['participant_id'],
                    'registered_at' => now()->subDays(10),
                    'email_verified_at' => now(),
                ]
            );
        }

        $this->command?->info('Inventory participant accounts seeded.');
    }
}
