import React from 'react';
import { Key, Save, X, CheckSquare, Square } from 'lucide-react';
import Swal from 'sweetalert2';

export function PermissionEditPage({ permission, roles = [], assignedRoleIds = [] }) {
    const [permissionName, setPermissionName] = React.useState(permission?.name || '');
    const [guardName, setGuardName] = React.useState(permission?.guard_name || 'web');
    const [selectedRoles, setSelectedRoles] = React.useState(
        new Set((assignedRoleIds || []).map(id => parseInt(id, 10)))
    );
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    // Get display name for role
    const getRoleDisplayName = (roleName) => {
        const roleMap = {
            'SUPER_ADMIN': 'Super Admin',
            'LGU_ADMIN': 'Admin',
            'LGU_TRAINER': 'Trainer',
            'STAFF': 'Staff',
            'PARTICIPANT': 'Participant',
        };
        return roleMap[roleName] || roleName;
    };

    // Toggle single role
    const toggleRole = (roleId) => {
        const rId = parseInt(roleId, 10);
        setSelectedRoles(prev => {
            const newSet = new Set(prev);
            if (newSet.has(rId)) {
                newSet.delete(rId);
            } else {
                newSet.add(rId);
            }
            return newSet;
        });
    };

    // Toggle all roles
    const toggleAllRoles = () => {
        const allRoleIds = (roles || []).map(r => parseInt(r.id, 10));
        const allSelected = allRoleIds.every(id => selectedRoles.has(id));

        setSelectedRoles(prev => {
            if (allSelected) {
                return new Set();
            } else {
                return new Set(allRoleIds);
            }
        });
    };

    // Check if all roles are selected
    const areAllRolesSelected = () => {
        if (roles.length === 0) return false;
        const allRoleIds = roles.map(r => parseInt(r.id, 10));
        return allRoleIds.every(id => selectedRoles.has(id));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        const csrf = document.head.querySelector('meta[name="csrf-token"]')?.content;

        try {
            const formData = new FormData();
            formData.append('_method', 'PUT');
            formData.append('_token', csrf);
            formData.append('name', permissionName);
            formData.append('guard_name', guardName);
            Array.from(selectedRoles).forEach(roleId => {
                formData.append('roles[]', parseInt(roleId, 10));
            });

            const response = await fetch(`/admin/permissions/${permission.id}`, {
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
                    title: '<div class="text-lg font-semibold text-slate-900">Permission Updated</div>',
                    html: '<div class="text-sm text-slate-600 mt-2">The permission and its role assignments have been updated successfully.</div>',
                    timer: 2000,
                    showConfirmButton: false,
                    customClass: {
                        popup: 'rounded-xl shadow-2xl border border-slate-200',
                        icon: 'text-emerald-500',
                    },
                });
                setTimeout(() => {
                    window.location.href = '/admin/permissions';
                }, 2100);
            } else {
                Swal.fire({
                    icon: 'error',
                    title: '<div class="text-lg font-semibold text-slate-900">Error</div>',
                    html: `<div class="text-sm text-slate-600 mt-2">${data.message || 'Failed to update permission. Please try again.'}</div>`,
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
                html: '<div class="text-sm text-slate-600 mt-2">An error occurred while updating the permission. Please try again.</div>',
                customClass: {
                    popup: 'rounded-xl shadow-2xl border border-slate-200',
                    icon: 'text-red-500',
                },
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6 w-full overflow-x-hidden">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                        <Key className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-semibold text-slate-900">
                            Edit Permission: {permission?.name}
                        </h1>
                        <p className="text-sm text-slate-600 mt-1">
                            Manage permission details and assign roles
                        </p>
                    </div>
                </div>
                <a
                    href="/admin/permissions"
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
                                Permission Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={permissionName}
                                onChange={(e) => setPermissionName(e.target.value)}
                                required
                                className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none text-sm font-medium text-slate-900"
                                placeholder="e.g., users.create"
                            />
                            <p className="text-xs text-slate-500 mt-1.5">
                                Use lowercase with dots (e.g., users.create, resources.edit)
                            </p>
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

                {/* Role Assignments */}
                <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-semibold text-slate-900">Role Assignments</h2>
                        {roles.length > 0 && (
                            <button
                                type="button"
                                onClick={toggleAllRoles}
                                className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                            >
                                {areAllRolesSelected() ? (
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

                    {roles.length === 0 ? (
                        <div className="text-center py-8 text-sm text-slate-500">
                            No roles available. Please create roles first.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {roles.map((role) => (
                                <label
                                    key={role.id}
                                    className="flex items-center gap-2 cursor-pointer p-3 rounded-lg border border-slate-200 hover:bg-slate-50 hover:border-blue-300 transition-colors"
                                >
                                    <input
                                        type="checkbox"
                                        checked={selectedRoles.has(parseInt(role.id, 10))}
                                        onChange={() => toggleRole(role.id)}
                                        className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 focus:ring-2 cursor-pointer"
                                    />
                                    <span className="text-sm text-slate-700 font-medium">
                                        {getRoleDisplayName(role.name)}
                                    </span>
                                </label>
                            ))}
                        </div>
                    )}
                </div>

                {/* Submit Button */}
                <div className="flex items-center justify-end gap-3">
                    <a
                        href="/admin/permissions"
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
