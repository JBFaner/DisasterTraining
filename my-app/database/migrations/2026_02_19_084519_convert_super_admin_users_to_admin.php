<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Convert all SUPER_ADMIN users to LGU_ADMIN
        DB::table('users')
            ->where('role', 'SUPER_ADMIN')
            ->update(['role' => 'LGU_ADMIN']);

        // Delete SUPER_ADMIN role from roles table if it exists
        DB::table('roles')
            ->where('name', 'SUPER_ADMIN')
            ->delete();

        // Delete all permissions assigned to SUPER_ADMIN role
        $superAdminRole = DB::table('roles')->where('name', 'SUPER_ADMIN')->first();
        if ($superAdminRole) {
            DB::table('role_has_permissions')
                ->where('role_id', $superAdminRole->id)
                ->delete();
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Note: This migration cannot be fully reversed as we don't know
        // which users were originally SUPER_ADMIN vs LGU_ADMIN
        // We'll recreate the SUPER_ADMIN role but won't convert users back
        
        // Recreate SUPER_ADMIN role
        DB::table('roles')->updateOrInsert(
            ['name' => 'SUPER_ADMIN'],
            [
                'name' => 'SUPER_ADMIN',
                'guard_name' => 'web',
                'created_at' => now(),
                'updated_at' => now(),
            ]
        );
    }
};
