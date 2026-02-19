<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class RoleController extends Controller
{
    public function index(Request $request)
    {
        $user = Auth::user();

        if (! $user || $user->role !== 'LGU_ADMIN') {
            abort(403);
        }

        $roles = collect([]);

        try {
            // Check if roles table exists
            if (DB::getSchemaBuilder()->hasTable('roles')) {
                $query = DB::table('roles');

                // Search by name
                if ($search = $request->query('search')) {
                    $query->where('name', 'like', '%' . $search . '%');
                }

                $roles = $query->get();

                // Get permission counts for each role
                if (DB::getSchemaBuilder()->hasTable('role_has_permissions')) {
                    foreach ($roles as $role) {
                        $permissionCount = DB::table('role_has_permissions')
                            ->where('role_id', $role->id)
                            ->count();
                        $role->permissions_count = $permissionCount;
                    }
                } else {
                    foreach ($roles as $role) {
                        $role->permissions_count = 0;
                    }
                }
            }
        } catch (\Exception $e) {
            // If table doesn't exist or any error occurs, return empty collection
            Log::warning('Roles table not found or error accessing it: ' . $e->getMessage());
            $roles = collect([]);
        }

        return view('app', [
            'section' => 'admin_roles',
            'roles' => $roles,
        ]);
    }

    public function store(Request $request)
    {
        $user = Auth::user();

        if (! $user || $user->role !== 'LGU_ADMIN') {
            abort(403);
        }

        if (! DB::getSchemaBuilder()->hasTable('roles')) {
            return response()->json([
                'success' => false,
                'message' => 'Roles table does not exist. Please run migrations first.',
            ], 500);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:roles,name',
            'guard_name' => 'nullable|string|max:255',
        ]);

        try {
            $role = DB::table('roles')->insertGetId([
                'name' => $validated['name'],
                'guard_name' => $validated['guard_name'] ?? 'web',
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Role created successfully',
                'role' => ['id' => $role, 'name' => $validated['name']],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create role: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function edit($id)
    {
        $user = Auth::user();

        if (! $user || $user->role !== 'LGU_ADMIN') {
            abort(403);
        }

        try {
            if (! DB::getSchemaBuilder()->hasTable('roles')) {
                abort(404, 'Roles table does not exist');
            }

            $role = DB::table('roles')->where('id', $id)->first();

            if (! $role) {
                abort(404, 'Role not found');
            }

            // Get all permissions grouped by module
            $allPermissions = collect([]);
            if (DB::getSchemaBuilder()->hasTable('permissions')) {
                $allPermissions = DB::table('permissions')
                    ->orderBy('name')
                    ->get();
            }

            // Get role's assigned permissions
            $assignedPermissionIds = collect([]);
            if (DB::getSchemaBuilder()->hasTable('role_has_permissions')) {
                $assignedPermissionIds = DB::table('role_has_permissions')
                    ->where('role_id', $id)
                    ->pluck('permission_id');
            }

            // Define category mapping
            $categoryMapping = [
                'operations' => [
                    'dashboard',
                    'training-modules',
                    'scenarios',
                    'simulation-events',
                    'participants',
                    'resources',
                    'evaluations',
                    'certifications',
                    'barangay-profile',
                ],
                'review-reporting' => [
                    'audit-logs',
                    'reports',
                ],
                'administration' => [
                    'users',
                    'roles',
                    'permissions',
                ],
            ];

            // Group permissions by category first, then by module
            $groupedPermissions = collect();
            
            foreach ($categoryMapping as $category => $modules) {
                $categoryPermissions = $allPermissions->filter(function ($permission) use ($modules) {
                    $parts = explode('.', $permission->name);
                    $module = $parts[0] ?? 'other';
                    return in_array($module, $modules);
                });

                if ($categoryPermissions->isEmpty()) {
                    continue;
                }

                // Group by module within this category
                $modulesInCategory = $categoryPermissions->groupBy(function ($permission) {
                    $parts = explode('.', $permission->name);
                    return $parts[0] ?? 'other';
                })->map(function ($permissions, $module) {
                    return [
                        'module' => $module,
                        'permissions' => $permissions->map(function ($perm) {
                            return [
                                'id' => $perm->id,
                                'name' => $perm->name,
                                'display_name' => str_replace('.', ' ', $perm->name),
                            ];
                        })->values(),
                    ];
                })->values();

                // Format category display name
                $categoryDisplayNames = [
                    'operations' => 'Operations',
                    'review-reporting' => 'Review & Reporting',
                    'administration' => 'Administration',
                ];

                $groupedPermissions->push([
                    'category' => $category,
                    'category_display' => $categoryDisplayNames[$category] ?? ucfirst(str_replace('-', ' & ', $category)),
                    'modules' => $modulesInCategory,
                ]);
            }

            return view('app', [
                'section' => 'admin_roles_edit',
                'role' => $role,
                'groupedPermissions' => $groupedPermissions,
                'assignedPermissionIds' => $assignedPermissionIds,
            ]);
        } catch (\Exception $e) {
            Log::error('Error loading role for edit: ' . $e->getMessage());
            abort(500, 'Error loading role');
        }
    }

    public function update(Request $request, $id)
    {
        $user = Auth::user();

        if (! $user || $user->role !== 'LGU_ADMIN') {
            abort(403);
        }

        if (! DB::getSchemaBuilder()->hasTable('roles')) {
            if ($request->expectsJson() || $request->ajax()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Roles table does not exist',
                ], 500);
            }
            abort(500, 'Roles table does not exist');
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:roles,name,' . $id,
            'guard_name' => 'nullable|string|max:255',
            'permissions' => 'nullable|array',
            'permissions.*' => 'integer|exists:permissions,id',
        ]);

        // Convert permission IDs to integers
        if (isset($validated['permissions']) && is_array($validated['permissions'])) {
            $validated['permissions'] = array_map('intval', $validated['permissions']);
        }

        try {
            if (! DB::getSchemaBuilder()->hasTable('roles')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Roles table does not exist',
                ], 500);
            }

            // Update role
            DB::table('roles')
                ->where('id', $id)
                ->update([
                    'name' => $validated['name'],
                    'guard_name' => $validated['guard_name'] ?? 'web',
                    'updated_at' => now(),
                ]);

            // Sync permissions
            if (DB::getSchemaBuilder()->hasTable('role_has_permissions')) {
                // Remove all existing permissions
                DB::table('role_has_permissions')
                    ->where('role_id', $id)
                    ->delete();

                // Add new permissions
                if (!empty($validated['permissions'])) {
                    $permissionsToInsert = array_map(function ($permissionId) use ($id) {
                        return [
                            'role_id' => $id,
                            'permission_id' => $permissionId,
                        ];
                    }, $validated['permissions']);

                    DB::table('role_has_permissions')->insert($permissionsToInsert);
                }
            }

            if ($request->expectsJson() || $request->ajax()) {
                return response()->json([
                    'success' => true,
                    'message' => 'Role updated successfully',
                ]);
            }

            return redirect()->route('admin.roles.index')
                ->with('success', 'Role updated successfully');
        } catch (\Exception $e) {
            Log::error('Error updating role: ' . $e->getMessage());
            
            if ($request->expectsJson() || $request->ajax()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to update role: ' . $e->getMessage(),
                ], 500);
            }

            return back()->withErrors(['error' => 'Failed to update role']);
        }
    }
}
