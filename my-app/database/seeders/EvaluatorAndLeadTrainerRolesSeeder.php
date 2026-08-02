<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * Creates LEAD_TRAINER and EVALUATOR roles with sensible permission sets.
 */
class EvaluatorAndLeadTrainerRolesSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();

        foreach (['LEAD_TRAINER', 'EVALUATOR'] as $name) {
            DB::table('roles')->updateOrInsert(
                ['name' => $name],
                [
                    'name' => $name,
                    'guard_name' => 'web',
                    'created_at' => $now,
                    'updated_at' => $now,
                ]
            );
        }

        $lead = DB::table('roles')->where('name', 'LEAD_TRAINER')->first();
        $evaluator = DB::table('roles')->where('name', 'EVALUATOR')->first();

        if (! $lead || ! $evaluator) {
            return;
        }

        $leadPermissions = [
            'dashboard.view',
            'training-modules.view', 'training-modules.create', 'training-modules.edit', 'training-modules.publish',
            'training-modules.archive', 'training-modules.lessons.manage', 'training-modules.materials.manage',
            'scenarios.view', 'scenarios.create', 'scenarios.edit', 'scenarios.publish', 'scenarios.archive',
            'simulation-events.view', 'simulation-events.create', 'simulation-events.edit', 'simulation-events.publish',
            'simulation-events.unpublish', 'simulation-events.start', 'simulation-events.complete', 'simulation-events.cancel',
            'simulation-events.archive', 'simulation-events.registrations.manage', 'simulation-events.attendance.manage',
            'participants.view', 'participants.create', 'participants.edit', 'participants.manage-attendance', 'participants.export',
            'resources.view', 'resources.create', 'resources.edit', 'resources.assign', 'resources.maintenance',
            'evaluations.view', 'evaluations.create', 'evaluations.edit', 'evaluations.score', 'evaluations.lock', 'evaluations.export',
            'certifications.view', 'certifications.issue', 'certifications.revoke', 'certifications.templates.manage',
            'hazard-assessment-profile.view', 'hazard-assessment-profile.edit',
        ];

        $evaluatorPermissions = [
            'dashboard.view',
            'training-modules.view',
            'scenarios.view',
            'simulation-events.view',
            'participants.view',
            'evaluations.view', 'evaluations.create', 'evaluations.edit', 'evaluations.score', 'evaluations.lock', 'evaluations.export',
            'certifications.view',
        ];

        $this->syncRolePermissions((int) $lead->id, $leadPermissions);
        $this->syncRolePermissions((int) $evaluator->id, $evaluatorPermissions);

        $this->command?->info('Roles ready: LEAD_TRAINER, EVALUATOR');
    }

    /**
     * @param  list<string>  $permissionNames
     */
    private function syncRolePermissions(int $roleId, array $permissionNames): void
    {
        foreach ($permissionNames as $permName) {
            $permission = DB::table('permissions')->where('name', $permName)->first();
            if (! $permission) {
                continue;
            }

            DB::table('role_has_permissions')->updateOrInsert(
                [
                    'role_id' => $roleId,
                    'permission_id' => $permission->id,
                ],
                [
                    'role_id' => $roleId,
                    'permission_id' => $permission->id,
                ]
            );
        }
    }
}
