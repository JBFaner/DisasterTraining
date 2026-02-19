<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class CheckSuperAdmin extends Command
{
    protected $signature = 'check:super-admin {email=brogada.reymon09@gmail.com}';
    protected $description = 'Check if Super Admin account exists and is verified';

    public function handle()
    {
        $email = $this->argument('email');
        
        $this->info("\n=== Checking Super Admin Account ===");
        $this->line("Email: {$email}");
        $this->line(str_repeat('-', 50));
        
        $user = User::where('email', $email)->first();
        
        if (!$user) {
            $this->error("❌ Account NOT FOUND in database");
            $this->warn("\nStatus: Account does not exist");
            $this->info("Action: Run seeder to create account");
            $this->line("Command: php artisan db:seed --class=AdminUserSeeder --force");
            return 1;
        }
        
        $this->info("✅ Account EXISTS\n");
        $this->table(
            ['Field', 'Value'],
            [
                ['ID', $user->id],
                ['Name', $user->name],
                ['Email', $user->email],
                ['Role', $user->role],
                ['Status', $user->status],
                ['Email Verified', $user->email_verified_at ? "✅ YES ({$user->email_verified_at})" : "❌ NO"],
                ['Registered At', $user->registered_at ? $user->registered_at->format('Y-m-d H:i:s') : 'N/A'],
                ['Last Login', $user->last_login ? $user->last_login->format('Y-m-d H:i:s') : 'Never'],
                ['USB Key Enabled', $user->usb_key_enabled ? 'Yes' : 'No'],
            ]
        );
        
        $this->line(str_repeat('-', 50));
        
        $issues = [];
        if ($user->role !== 'SUPER_ADMIN') {
            $issues[] = "⚠️  WARNING: Account role is '{$user->role}', not 'SUPER_ADMIN'";
        }
        
        if (!$user->email_verified_at) {
            $issues[] = "⚠️  WARNING: Email is NOT verified - Account cannot log in";
        }
        
        if ($user->status !== 'active') {
            $issues[] = "⚠️  WARNING: Account status is '{$user->status}', not 'active'";
        }
        
        if (!empty($issues)) {
            $this->warn("\nIssues Found:");
            foreach ($issues as $issue) {
                $this->warn("  {$issue}");
            }
        }
        
        if ($user->role === 'SUPER_ADMIN' && $user->email_verified_at && $user->status === 'active') {
            $this->info("\n✅ Account is READY and can log in");
        }
        
        // Check roles table
        $this->line("\n" . str_repeat('=', 50));
        $this->info("=== Checking Roles Table ===");
        
        $rolesCount = DB::table('roles')->count();
        $this->line("Total roles in database: {$rolesCount}");
        
        if ($rolesCount === 0) {
            $this->warn("⚠️  WARNING: No roles found. Run: php artisan db:seed --class=RolesSeeder --force");
        } else {
            $roles = DB::table('roles')->get(['name']);
            $this->table(['Role Name'], $roles->map(fn($r) => [$r->name])->toArray());
        }
        
        // Check permissions table
        $this->line("\n" . str_repeat('=', 50));
        $this->info("=== Checking Permissions Table ===");
        
        $permissionsCount = DB::table('permissions')->count();
        $this->line("Total permissions in database: {$permissionsCount}");
        
        if ($permissionsCount === 0) {
            $this->warn("⚠️  WARNING: No permissions found. Run: php artisan db:seed --class=PermissionsSeeder --force");
        }
        
        $this->line("\n" . str_repeat('=', 50));
        $this->info("Check complete!");
        
        return 0;
    }
}
