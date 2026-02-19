import React from 'react';
import { Shield, Save, X, CheckSquare, Square } from 'lucide-react';
import Swal from 'sweetalert2';

export function RoleEditPage({ role, groupedPermissions = [], assignedPermissionIds = [] }) {
    const [roleName, setRoleName] = React.useState(role?.name || '');
    const [guardName, setGuardName] = React.useState(role?.guard_name || 'web');
    const [selectedPermissions, setSelectedPermissions] = React.useState(
        new Set((assignedPermissionIds || []).map(id => parseInt(id, 10)))
    );
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    // Get display name for role
    const getRoleDisplayName = (roleName) => {
        const roleMap = {
            'LGU_ADMIN': 'Admin',
            'LGU_TRAINER': 'Trainer',
            'STAFF': 'Staff',
            'PARTICIPANT': 'Participant',
        };
        return roleMap[roleName] || roleName;
    };

    // Toggle single permission
    const togglePermission = (permissionId) => {
        const permId = parseInt(permissionId, 10);
        setSelectedPermissions(prev => {
            const newSet = new Set(prev);
            if (newSet.has(permId)) {
                newSet.delete(permId);
            } else {
                newSet.add(permId);
            }
            return newSet;
        });
    };

    // Toggle all permissions in a module
    const toggleModulePermissions = (modulePermissions) => {
        const modulePermissionIds = modulePermissions.map(p => parseInt(p.id, 10));
        const allSelected = modulePermissionIds.every(id => selectedPermissions.has(id));

        setSelectedPermissions(prev => {
            const newSet = new Set(prev);
            if (allSelected) {
                // Deselect all in module
                modulePermissionIds.forEach(id => newSet.delete(id));
            } else {
                // Select all in module
                modulePermissionIds.forEach(id => newSet.add(id));
            }
            return newSet;
        });
    };

    // Toggle all permissions globally
    const toggleAllPermissions = () => {
        const allPermissionIds = groupedPermissions.flatMap(category => 
            category.modules.flatMap(module => 
                module.permissions.map(p => parseInt(p.id, 10))
            )
        );
        const allSelected = allPermissionIds.every(id => selectedPermissions.has(id));

        setSelectedPermissions(prev => {
            if (allSelected) {
                return new Set();
            } else {
                return new Set(allPermissionIds);
            }
        });
    };

    // Check if all permissions in a module are selected
    const isModuleFullySelected = (modulePermissions) => {
        if (modulePermissions.length === 0) return false;
        return modulePermissions.every(p => selectedPermissions.has(parseInt(p.id, 10)));
    };

    // Check if some (but not all) permissions in a module are selected
    const isModulePartiallySelected = (modulePermissions) => {
        const selectedCount = modulePermissions.filter(p => selectedPermissions.has(parseInt(p.id, 10))).length;
        return selectedCount > 0 && selectedCount < modulePermissions.length;
    };

    // Check if all permissions globally are selected
    const areAllPermissionsSelected = () => {
        const allPermissionIds = groupedPermissions.flatMap(category => 
            category.modules.flatMap(module => 
                module.permissions.map(p => parseInt(p.id, 10))
            )
        );
        if (allPermissionIds.length === 0) return false;
        return allPermissionIds.every(id => selectedPermissions.has(id));
    };

    // Toggle all permissions in a category
    const toggleCategoryPermissions = (categoryModules) => {
        const categoryPermissionIds = categoryModules.flatMap(module => 
            module.permissions.map(p => parseInt(p.id, 10))
        );
        const allSelected = categoryPermissionIds.every(id => selectedPermissions.has(id));

        setSelectedPermissions(prev => {
            const newSet = new Set(prev);
            if (allSelected) {
                // Deselect all in category
                categoryPermissionIds.forEach(id => newSet.delete(id));
            } else {
                // Select all in category
                categoryPermissionIds.forEach(id => newSet.add(id));
            }
            return newSet;
        });
    };

    // Check if all permissions in a category are selected
    const isCategoryFullySelected = (categoryModules) => {
        const categoryPermissionIds = categoryModules.flatMap(module => 
            module.permissions.map(p => parseInt(p.id, 10))
        );
        if (categoryPermissionIds.length === 0) return false;
        return categoryPermissionIds.every(id => selectedPermissions.has(id));
    };

    // Check if some (but not all) permissions in a category are selected
    const isCategoryPartiallySelected = (categoryModules) => {
        const categoryPermissionIds = categoryModules.flatMap(module => 
            module.permissions.map(p => parseInt(p.id, 10))
        );
        const selectedCount = categoryPermissionIds.filter(id => selectedPermissions.has(id)).length;
        return selectedCount > 0 && selectedCount < categoryPermissionIds.length;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        const csrf = document.head.querySelector('meta[name="csrf-token"]')?.content;

        try {
            const formData = new FormData();
            formData.append('_method', 'PUT');
            formData.append('_token', csrf);
            formData.append('name', roleName);
            formData.append('guard_name', guardName);
            Array.from(selectedPermissions).forEach(permissionId => {
                formData.append('permissions[]', parseInt(permissionId, 10));
            });

            const response = await fetch(`/admin/roles/${role.id}`, {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN': csrf,
                    'Accept': 'application/json',
                },
                body: formData,
            });

            const data = await response.json();

            if (response.ok) {
                Swal.fire({
                    icon: 'success',
                    title: '<div class="text-lg font-semibold text-slate-900">Role Updated</div>',
                    html: '<div class="text-sm text-slate-600 mt-2">The role and its permissions have been updated successfully.</div>',
                    timer: 2000,
                    showConfirmButton: false,
                    customClass: {
                        popup: 'rounded-xl shadow-2xl border border-slate-200',
                        icon: 'text-emerald-500',
                    },
                });
                setTimeout(() => {
                    window.location.href = '/admin/roles';
                }, 2100);
            } else {
                Swal.fire({
                    icon: 'error',
                    title: '<div class="text-lg font-semibold text-slate-900">Error</div>',
                    html: `<div class="text-sm text-slate-600 mt-2">${data.message || 'Failed to update role. Please try again.'}</div>`,
                    customClass: {
                        popup: 'rounded-xl shadow-2xl border border-slate-200',
                        icon: 'text-red-500',
                    },
                });
            }
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: '<div class="text-lg font-semibold text-slate-900">Error</div>',
                html: '<div class="text-sm text-slate-600 mt-2">An error occurred while updating the role. Please try again.</div>',
                customClass: {
                    popup: 'rounded-xl shadow-2xl border border-slate-200',
                    icon: 'text-red-500',
                },
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const capitalizeModuleName = (module) => {
        return module.charAt(0).toUpperCase() + module.slice(1).replace(/_/g, ' ');
    };

    return (
        <div className="space-y-6 w-full overflow-x-hidden">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                        <Shield className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-semibold text-slate-900">
                            Edit Role: {getRoleDisplayName(role?.name)}
                        </h1>
                        <p className="text-sm text-slate-600 mt-1">
                            Manage role details and assign permissions
                        </p>
                    </div>
                </div>
                <a
                    href="/admin/roles"
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 transition-colors"
                >
                    <X className="w-4 h-4" />
                    Cancel
                </a>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Information */}
                <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
                    <h2 className="text-lg font-semibold text-slate-900 mb-4">Basic Information</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Role Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={roleName}
                                onChange={(e) => setRoleName(e.target.value)}
                                required
                                className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none text-sm font-medium text-slate-900"
                                placeholder="e.g., LGU_ADMIN"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Guard Name
                            </label>
                            <input
                                type="text"
                                value={guardName}
                                onChange={(e) => setGuardName(e.target.value)}
                                className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none text-sm font-medium text-slate-900"
                                placeholder="web"
                            />
                        </div>
                    </div>
                </div>

                {/* Permissions */}
                <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-semibold text-slate-900">Permissions</h2>
                        {groupedPermissions.length > 0 && (
                            <button
                                type="button"
                                onClick={toggleAllPermissions}
                                className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                            >
                                {areAllPermissionsSelected() ? (
                                    <>
                                        <CheckSquare className="w-4 h-4" />
                                        Deselect All
                                    </>
                                ) : (
                                    <>
                                        <Square className="w-4 h-4" />
                                        Select All
                                    </>
                                )}
                            </button>
                        )}
                    </div>

                    {groupedPermissions.length === 0 ? (
                        <div className="text-center py-8 text-sm text-slate-500">
                            No permissions available. Please create permissions first.
                        </div>
                    ) : (
                        <div className="space-y-8">
                            {groupedPermissions.map((category) => (
                                <div key={category.category} className="border-2 border-slate-300 rounded-xl p-6 bg-gradient-to-br from-slate-50 to-white shadow-sm">
                                    {/* Category Header */}
                                    <div className="mb-6 pb-4 border-b-2 border-slate-200">
                                        <label className="flex items-center gap-3 cursor-pointer group">
                                            <input
                                                type="checkbox"
                                                checked={isCategoryFullySelected(category.modules)}
                                                ref={(input) => {
                                                    if (input) {
                                                        input.indeterminate = isCategoryPartiallySelected(category.modules);
                                                    }
                                                }}
                                                onChange={() => toggleCategoryPermissions(category.modules)}
                                                className="w-5 h-5 text-blue-600 border-slate-300 rounded focus:ring-blue-500 cursor-pointer"
                                            />
                                            <span className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                                                {category.category_display}
                                            </span>
                                            <span className="text-xs text-slate-500 font-medium">
                                                ({category.modules.reduce((sum, m) => sum + m.permissions.length, 0)} permissions)
                                            </span>
                                        </label>
                                    </div>

                                    {/* Modules within Category */}
                                    <div className="space-y-4 pl-2">
                                        {category.modules.map((module) => (
                                            <div key={module.module} className="border border-slate-200 rounded-lg p-4 bg-white">
                                                <div className="flex items-center justify-between mb-3">
                                                    <label className="flex items-center gap-2 cursor-pointer group">
                                                        <input
                                                            type="checkbox"
                                                            checked={isModuleFullySelected(module.permissions)}
                                                            ref={(input) => {
                                                                if (input) {
                                                                    input.indeterminate = isModulePartiallySelected(module.permissions);
                                                                }
                                                            }}
                                                            onChange={() => toggleModulePermissions(module.permissions)}
                                                            className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 cursor-pointer"
                                                        />
                                                        <span className="text-sm font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                                                            {capitalizeModuleName(module.module)}
                                                        </span>
                                                        <span className="text-xs text-slate-500">
                                                            ({module.permissions.length} permissions)
                                                        </span>
                                                    </label>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 pl-6">
                                                    {module.permissions.map((permission) => (
                                                        <label
                                                            key={permission.id}
                                                            className="flex items-center gap-2 cursor-pointer p-2.5 rounded-lg hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-200"
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedPermissions.has(parseInt(permission.id, 10))}
                                                                onChange={() => togglePermission(permission.id)}
                                                                className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 focus:ring-2 cursor-pointer"
                                                            />
                                                            <span className="text-sm text-slate-700 font-medium">
                                                                {permission.display_name}
                                                            </span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Submit Button */}
                <div className="flex items-center justify-end gap-3">
                    <a
                        href="/admin/roles"
                        className="px-6 py-2.5 rounded-lg border border-slate-300 text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 transition-colors"
                    >
                        Cancel
                    </a>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold shadow-sm hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4" />
                                Save Changes
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
