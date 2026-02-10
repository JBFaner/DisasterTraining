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
        // Create or update a default LGU admin account for testing.
        // You can change the email/password later as needed.
        User::updateOrCreate(
            ['email' => 'remosyne12@gmail.com'],
            [
                'name' => 'System Administrator',
                // Password is hashed automatically by the User model's casts.
                'password' => 'Admin12345!',
                'role' => 'LGU_ADMIN',
                'status' => 'active',
                'registered_at' => now(),
            ]
        );
    }
}

