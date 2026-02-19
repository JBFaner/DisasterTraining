<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class PermissionController extends Controller
{
    public function index(Request $request)
    {
        $user = Auth::user();

        if (! $user || $user->role !== 'LGU_ADMIN') {
            abort(403);
        }

        $permissions = collect([]);

        try {
            // Check if permissions table exists
            if (DB::getSchemaBuilder()->hasTable('permissions')) {
                $query = DB::table('permissions');

                // Search by name
                if ($search = $request->query('search')) {
                    $query->where('name', 'like', '%' . $search . '%');
                }

                $permissions = $query->get();

                // Get role counts for each permission
                if (DB::getSchemaBuilder()->hasTable('role_has_permissions')) {
                    foreach ($permissions as $permission) {
                        $roleCount = DB::table('role_has_permissions')
                            ->where('permission_id', $permission->id)
                            ->count();
                        $permission->roles_count = $roleCount;
                    }
                } else {
                    foreach ($permissions as $permission) {
                        $permission->roles_count = 0;
                    }
                }
            }
        } catch (\Exception $e) {
            // If table doesn't exist or any error occurs, return empty collection
            Log::warning('Permissions table not found or error accessing it: ' . $e->getMessage());
            $permissions = collect([]);
        }

        return view('app', [
            'section' => 'admin_permissions',
            'permissions' => $permissions,
        ]);
    }

    public function store(Request $request)
    {
        $user = Auth::user();

        if (! $user || $user->role !== 'LGU_ADMIN') {
            abort(403);
        }

        if (! DB::getSchemaBuilder()->hasTable('permissions')) {
            return response()->json([
                'success' => false,
                'message' => 'Permissions table does not exist. Please run migrations first.',
            ], 500);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:permissions,name',
            'guard_name' => 'nullable|string|max:255',
        ]);

        try {
            $permission = DB::table('permissions')->insertGetId([
                'name' => $validated['name'],
                'guard_name' => $validated['guard_name'] ?? 'web',
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Permission created successfully',
                'permission' => ['id' => $permission, 'name' => $validated['name']],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create permission: ' . $e->getMessage(),
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
            if (! DB::getSchemaBuilder()->hasTable('permissions')) {
                abort(404, 'Permissions table does not exist');
            }

            $permission = DB::table('permissions')->where('id', $id)->first();

            if (! $permission) {
                abort(404, 'Permission not found');
            }

            // Get all roles
            $allRoles = collect([]);
            if (DB::getSchemaBuilder()->hasTable('roles')) {
                $allRoles = DB::table('roles')
                    ->orderBy('name')
                    ->get();
            }

            // Get permission's assigned roles
            $assignedRoleIds = collect([]);
            if (DB::getSchemaBuilder()->hasTable('role_has_permissions')) {
                $assignedRoleIds = DB::table('role_has_permissions')
                    ->where('permission_id', $id)
                    ->pluck('role_id');
            }

            return view('app', [
                'section' => 'admin_permissions_edit',
                'permission' => $permission,
                'roles' => $allRoles,
                'assignedRoleIds' => $assignedRoleIds,
            ]);
        } catch (\Exception $e) {
            Log::error('Error loading permission for edit: ' . $e->getMessage());
            abort(500, 'Error loading permission');
        }
    }

    public function update(Request $request, $id)
    {
        $user = Auth::user();

        if (! $user || $user->role !== 'LGU_ADMIN') {
            abort(403);
        }

        if (! DB::getSchemaBuilder()->hasTable('permissions')) {
            if ($request->expectsJson() || $request->ajax()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Permissions table does not exist',
                ], 500);
            }
            abort(500, 'Permissions table does not exist');
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:permissions,name,' . $id,
            'guard_name' => 'nullable|string|max:255',
            'roles' => 'nullable|array',
            'roles.*' => 'integer|exists:roles,id',
        ]);

        // Convert role IDs to integers
        if (isset($validated['roles']) && is_array($validated['roles'])) {
            $validated['roles'] = array_map('intval', $validated['roles']);
        }

        try {
            // Update permission
            DB::table('permissions')
                ->where('id', $id)
                ->update([
                    'name' => $validated['name'],
                    'guard_name' => $validated['guard_name'] ?? 'web',
                    'updated_at' => now(),
                ]);

            // Sync roles (which roles have this permission)
            if (DB::getSchemaBuilder()->hasTable('role_has_permissions')) {
                // Remove all existing role assignments for this permission
                DB::table('role_has_permissions')
                    ->where('permission_id', $id)
                    ->delete();

                // Add new role assignments
                if (!empty($validated['roles'])) {
                    $rolesToInsert = array_map(function ($roleId) use ($id) {
                        return [
                            'permission_id' => $id,
                            'role_id' => $roleId,
                        ];
                    }, $validated['roles']);

                    DB::table('role_has_permissions')->insert($rolesToInsert);
                }
            }

            if ($request->expectsJson() || $request->ajax()) {
                return response()->json([
                    'success' => true,
                    'message' => 'Permission updated successfully',
                ]);
            }

            return redirect()->route('admin.permissions.index')
                ->with('success', 'Permission updated successfully');
        } catch (\Exception $e) {
            Log::error('Error updating permission: ' . $e->getMessage());
            
            if ($request->expectsJson() || $request->ajax()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to update permission: ' . $e->getMessage(),
                ], 500);
            }

            return back()->withErrors(['error' => 'Failed to update permission']);
        }
    }
}
