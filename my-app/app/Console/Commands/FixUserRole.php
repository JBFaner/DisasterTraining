<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;

class FixUserRole extends Command
{
    protected $signature = 'user:fix-role {email} {role}';
    protected $description = 'Fix a user\'s role in the database';

    public function handle()
    {
        $email = $this->argument('email');
        $role = strtoupper($this->argument('role'));
        
        $validRoles = ['LGU_ADMIN', 'LGU_TRAINER', 'STAFF', 'PARTICIPANT'];
        
        if (!in_array($role, $validRoles)) {
            $this->error("Invalid role. Valid roles are: " . implode(', ', $validRoles));
            return 1;
        }
        
        $user = User::where('email', $email)->first();
        
        if (!$user) {
            $this->error("User with email '{$email}' not found.");
            return 1;
        }
        
        $oldRole = $user->role;
        $user->role = $role;
        $user->save();
        
        $this->info("✅ Successfully updated user role!");
        $this->table(
            ['Field', 'Value'],
            [
                ['Email', $user->email],
                ['Old Role', $oldRole],
                ['New Role', $user->role],
            ]
        );
        
        return 0;
    }
}
