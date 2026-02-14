<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class PermissionsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $permissions = [
            // Dashboard
            ['name' => 'dashboard.view', 'guard_name' => 'web'],
            
            // Training Modules
            ['name' => 'training-modules.view', 'guard_name' => 'web'],
            ['name' => 'training-modules.create', 'guard_name' => 'web'],
            ['name' => 'training-modules.edit', 'guard_name' => 'web'],
            ['name' => 'training-modules.delete', 'guard_name' => 'web'],
            ['name' => 'training-modules.publish', 'guard_name' => 'web'],
            
            // Scenarios
            ['name' => 'scenarios.view', 'guard_name' => 'web'],
            ['name' => 'scenarios.create', 'guard_name' => 'web'],
            ['name' => 'scenarios.edit', 'guard_name' => 'web'],
            ['name' => 'scenarios.delete', 'guard_name' => 'web'],
            
            // Simulation Events
            ['name' => 'simulation-events.view', 'guard_name' => 'web'],
            ['name' => 'simulation-events.create', 'guard_name' => 'web'],
            ['name' => 'simulation-events.edit', 'guard_name' => 'web'],
            ['name' => 'simulation-events.delete', 'guard_name' => 'web'],
            ['name' => 'simulation-events.approve', 'guard_name' => 'web'],
            
            // Participants
            ['name' => 'participants.view', 'guard_name' => 'web'],
            ['name' => 'participants.create', 'guard_name' => 'web'],
            ['name' => 'participants.edit', 'guard_name' => 'web'],
            ['name' => 'participants.delete', 'guard_name' => 'web'],
            ['name' => 'participants.manage-attendance', 'guard_name' => 'web'],
            
            // Resources
            ['name' => 'resources.view', 'guard_name' => 'web'],
            ['name' => 'resources.create', 'guard_name' => 'web'],
            ['name' => 'resources.edit', 'guard_name' => 'web'],
            ['name' => 'resources.delete', 'guard_name' => 'web'],
            ['name' => 'resources.assign', 'guard_name' => 'web'],
            
            // Evaluations
            ['name' => 'evaluations.view', 'guard_name' => 'web'],
            ['name' => 'evaluations.create', 'guard_name' => 'web'],
            ['name' => 'evaluations.edit', 'guard_name' => 'web'],
            ['name' => 'evaluations.delete', 'guard_name' => 'web'],
            ['name' => 'evaluations.score', 'guard_name' => 'web'],
            ['name' => 'evaluations.lock', 'guard_name' => 'web'],
            
            // Certifications
            ['name' => 'certifications.view', 'guard_name' => 'web'],
            ['name' => 'certifications.issue', 'guard_name' => 'web'],
            ['name' => 'certifications.revoke', 'guard_name' => 'web'],
            
            // Barangay Profile
            ['name' => 'barangay-profile.view', 'guard_name' => 'web'],
            ['name' => 'barangay-profile.edit', 'guard_name' => 'web'],
            
            // Users & Roles
            ['name' => 'users.view', 'guard_name' => 'web'],
            ['name' => 'users.create', 'guard_name' => 'web'],
            ['name' => 'users.edit', 'guard_name' => 'web'],
            ['name' => 'users.delete', 'guard_name' => 'web'],
            ['name' => 'users.manage', 'guard_name' => 'web'],
            ['name' => 'roles.view', 'guard_name' => 'web'],
            ['name' => 'roles.create', 'guard_name' => 'web'],
            ['name' => 'roles.edit', 'guard_name' => 'web'],
            ['name' => 'roles.delete', 'guard_name' => 'web'],
            ['name' => 'permissions.view', 'guard_name' => 'web'],
            ['name' => 'permissions.create', 'guard_name' => 'web'],
            ['name' => 'permissions.edit', 'guard_name' => 'web'],
            ['name' => 'permissions.delete', 'guard_name' => 'web'],
            
            // Audit Logs
            ['name' => 'audit-logs.view', 'guard_name' => 'web'],
            ['name' => 'audit-logs.export', 'guard_name' => 'web'],
            
            // Reports
            ['name' => 'reports.view', 'guard_name' => 'web'],
            ['name' => 'reports.export', 'guard_name' => 'web'],
        ];

        // Insert permissions if they don't exist
        foreach ($permissions as $permission) {
            DB::table('permissions')->updateOrInsert(
                ['name' => $permission['name']],
                array_merge($permission, [
                    'created_at' => now(),
                    'updated_at' => now(),
                ])
            );
        }

        // Assign permissions to roles
        $this->assignPermissionsToRoles();
    }

    /**
     * Assign permissions to roles based on their access levels
     */
    private function assignPermissionsToRoles(): void
    {
        // Get role IDs
        $superAdmin = DB::table('roles')->where('name', 'SUPER_ADMIN')->first();
        $admin = DB::table('roles')->where('name', 'LGU_ADMIN')->first();
        $trainer = DB::table('roles')->where('name', 'LGU_TRAINER')->first();
        $staff = DB::table('roles')->where('name', 'STAFF')->first();
        $participant = DB::table('roles')->where('name', 'PARTICIPANT')->first();

        if (!$superAdmin || !$admin || !$trainer || !$staff || !$participant) {
            return; // Roles not found, skip assignment
        }

        // Get all permissions
        $allPermissions = DB::table('permissions')->get();

        // Super Admin - All permissions
        foreach ($allPermissions as $permission) {
            DB::table('role_has_permissions')->updateOrInsert(
                [
                    'role_id' => $superAdmin->id,
                    'permission_id' => $permission->id,
                ],
                [
                    'role_id' => $superAdmin->id,
                    'permission_id' => $permission->id,
                ]
            );
        }

        // Admin (LGU_ADMIN) - Most permissions except user/role management
        $adminPermissions = [
            'dashboard.view',
            'training-modules.view', 'training-modules.create', 'training-modules.edit', 'training-modules.delete', 'training-modules.publish',
            'scenarios.view', 'scenarios.create', 'scenarios.edit', 'scenarios.delete',
            'simulation-events.view', 'simulation-events.create', 'simulation-events.edit', 'simulation-events.delete', 'simulation-events.approve',
            'participants.view', 'participants.create', 'participants.edit', 'participants.delete', 'participants.manage-attendance',
            'resources.view', 'resources.create', 'resources.edit', 'resources.delete', 'resources.assign',
            'evaluations.view', 'evaluations.create', 'evaluations.edit', 'evaluations.delete', 'evaluations.score', 'evaluations.lock',
            'certifications.view', 'certifications.issue', 'certifications.revoke',
            'barangay-profile.view', 'barangay-profile.edit',
            'users.view', 'users.create', 'users.edit', // Limited user management
            'audit-logs.view', 'audit-logs.export',
            'reports.view', 'reports.export',
        ];

        foreach ($adminPermissions as $permName) {
            $permission = DB::table('permissions')->where('name', $permName)->first();
            if ($permission) {
                DB::table('role_has_permissions')->updateOrInsert(
                    [
                        'role_id' => $admin->id,
                        'permission_id' => $permission->id,
                    ],
                    [
                        'role_id' => $admin->id,
                        'permission_id' => $permission->id,
                    ]
                );
            }
        }

        // Trainer (LGU_TRAINER) - Training and event management
        $trainerPermissions = [
            'dashboard.view',
            'training-modules.view', 'training-modules.create', 'training-modules.edit',
            'scenarios.view', 'scenarios.create', 'scenarios.edit',
            'simulation-events.view', 'simulation-events.create', 'simulation-events.edit',
            'participants.view', 'participants.manage-attendance',
            'resources.view', 'resources.assign',
            'evaluations.view', 'evaluations.create', 'evaluations.edit', 'evaluations.score',
            'certifications.view', 'certifications.issue',
        ];

        foreach ($trainerPermissions as $permName) {
            $permission = DB::table('permissions')->where('name', $permName)->first();
            if ($permission) {
                DB::table('role_has_permissions')->updateOrInsert(
                    [
                        'role_id' => $trainer->id,
                        'permission_id' => $permission->id,
                    ],
                    [
                        'role_id' => $trainer->id,
                        'permission_id' => $permission->id,
                    ]
                );
            }
        }

        // Staff - Limited view and basic operations
        $staffPermissions = [
            'dashboard.view',
            'training-modules.view',
            'scenarios.view',
            'simulation-events.view',
            'participants.view',
            'resources.view',
            'evaluations.view',
        ];

        foreach ($staffPermissions as $permName) {
            $permission = DB::table('permissions')->where('name', $permName)->first();
            if ($permission) {
                DB::table('role_has_permissions')->updateOrInsert(
                    [
                        'role_id' => $staff->id,
                        'permission_id' => $permission->id,
                    ],
                    [
                        'role_id' => $staff->id,
                        'permission_id' => $permission->id,
                    ]
                );
            }
        }

        // Participant - View only permissions
        $participantPermissions = [
            'dashboard.view',
            'training-modules.view',
            'simulation-events.view',
            'evaluations.view',
            'certifications.view',
        ];

        foreach ($participantPermissions as $permName) {
            $permission = DB::table('permissions')->where('name', $permName)->first();
            if ($permission) {
                DB::table('role_has_permissions')->updateOrInsert(
                    [
                        'role_id' => $participant->id,
                        'permission_id' => $permission->id,
                    ],
                    [
                        'role_id' => $participant->id,
                        'permission_id' => $permission->id,
                    ]
                );
            }
        }
    }
}
