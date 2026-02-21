import React from 'react';
import { Search, Plus, Settings, Pencil, Trash2, X } from 'lucide-react';
import Swal from 'sweetalert2';

export function RolesPage({ roles = [] }) {
    const [search, setSearch] = React.useState('');
    const [rolesState, setRolesState] = React.useState(roles);
    const [showAddModal, setShowAddModal] = React.useState(false);
    const [roleName, setRoleName] = React.useState('');
    const [guardName, setGuardName] = React.useState('web');
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    React.useEffect(() => {
        setRolesState(roles);
    }, [roles]);

    const getRoleDisplayName = (roleNameVal) => {
        const roleMap = {
            'LGU_ADMIN': 'Admin',
            'LGU_TRAINER': 'Trainer',
            'STAFF': 'Staff',
            'PARTICIPANT': 'Participant',
        };
        return roleMap[roleNameVal] || roleNameVal;
    };

    const filteredRoles = (rolesState || []).filter((role) => {
        const query = search.toLowerCase().trim();
        const displayName = getRoleDisplayName(role.name || '').toLowerCase();
        const name = (role.name || '').toLowerCase();
        return !query || displayName.includes(query) || name.includes(query);
    });

    const handleCloseModal = () => {
        setShowAddModal(false);
        setRoleName('');
        setGuardName('web');
    };

    const handleSubmitAdd = async (e) => {
        e.preventDefault();
        const name = roleName.trim();
        const guard = guardName.trim() || 'web';

        if (!name) {
            Swal.fire({ icon: 'error', title: 'Validation Error', text: 'Role name is required', confirmButtonColor: '#64748b' });
            return;
        }
        if (!/^[A-Z_]+$/.test(name)) {
            Swal.fire({ icon: 'error', title: 'Validation Error', html: 'Role name must be uppercase with underscores<br><small>Example: LGU_ADMIN, MANAGER</small>', confirmButtonColor: '#64748b' });
            return;
        }

        setIsSubmitting(true);
        const csrf = document.head.querySelector('meta[name="csrf-token"]')?.content;

        try {
            const response = await fetch('/admin/roles', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': csrf, 'Accept': 'application/json' },
                body: JSON.stringify({ name, guard_name: guard }),
            });
            const data = await response.json();

            if (response.ok) {
                Swal.fire({ icon: 'success', title: 'Role Created', text: 'The role has been created successfully.', timer: 2000, showConfirmButton: false });
                setTimeout(() => window.location.reload(), 2100);
            } else {
                Swal.fire({ icon: 'error', title: 'Error', text: data.message || 'Failed to create role. Please try again.', confirmButtonColor: '#64748b' });
            }
        } catch (error) {
            Swal.fire({ icon: 'error', title: 'Error', text: 'An error occurred while creating the role. Please try again.', confirmButtonColor: '#64748b' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteRole = async (role) => {
        const result = await Swal.fire({
            title: 'Delete Role?',
            text: `Are you sure you want to delete "${getRoleDisplayName(role.name)}"? This cannot be undone.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, delete',
            cancelButtonText: 'Cancel',
            confirmButtonColor: '#dc2626',
            cancelButtonColor: '#64748b',
        });

        if (result.isConfirmed) {
            const form = document.createElement('form');
            form.method = 'POST';
            form.action = `/admin/roles/${role.id}`;
            const csrf = document.head.querySelector('meta[name="csrf-token"]')?.content;
            if (csrf) {
                const tokenInput = document.createElement('input');
                tokenInput.type = 'hidden';
                tokenInput.name = '_token';
                tokenInput.value = csrf;
                form.appendChild(tokenInput);
            }
            const methodInput = document.createElement('input');
            methodInput.type = 'hidden';
            methodInput.name = '_method';
            methodInput.value = 'DELETE';
            form.appendChild(methodInput);
            document.body.appendChild(form);
            form.submit();
        }
    };

    const handleAddRole = () => {
        setShowAddModal(true);
    };

    return (
        <div className="space-y-6 w-full overflow-x-hidden">
            {/* Hero Header - Certification style */}
            <div className="rounded-2xl bg-gradient-to-br from-slate-50 via-white to-emerald-50/40 border border-slate-200/80 shadow-xl p-8 md:p-10 transition-all duration-250">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-3 bg-emerald-100 rounded-xl shadow-md">
                                <Settings className="w-9 h-9 text-emerald-600" />
                            </div>
                            <h1 className="text-[30px] font-bold text-slate-900 tracking-tight">Roles Management</h1>
                        </div>
                        <p className="text-sm text-slate-600 mt-1 max-w-xl leading-relaxed">
                            Manage user roles and their permissions.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-3 shrink-0">
                        <button
                            onClick={handleAddRole}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 hover:shadow-[0_0_0_4px_rgba(16,185,129,0.35)] hover:-translate-y-0.5 text-white rounded-xl font-semibold text-sm transition-all duration-250"
                        >
                            <Plus className="w-5 h-5" />
                            Add Role
                        </button>
                    </div>
                </div>
            </div>

            {/* Search */}
            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                    type="text"
                    placeholder="Search roles..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-shadow"
                />
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[560px] text-sm">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                                <th className="px-5 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">ID</th>
                                <th className="px-5 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Role Name</th>
                                <th className="px-5 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Guard</th>
                                <th className="px-5 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Permissions</th>
                                <th className="px-5 py-4 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredRoles.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-5 py-12 text-center">
                                        <p className="text-slate-500 font-medium">No roles found</p>
                                        <p className="text-slate-400 text-xs mt-1">
                                            {roles.length === 0 ? 'Click "Add Role" to create one.' : 'Try a different search term.'}
                                        </p>
                                    </td>
                                </tr>
                            ) : (
                                filteredRoles.map((role) => (
                                    <tr key={role.id} className="bg-white hover:bg-slate-50/80 transition-colors duration-150">
                                        <td className="px-5 py-4 whitespace-nowrap text-sm text-slate-500">#{role.id}</td>
                                        <td className="px-5 py-4 whitespace-nowrap">
                                            <span className="text-sm font-medium text-slate-900">{getRoleDisplayName(role.name) || 'N/A'}</span>
                                            <span className="ml-2 text-xs text-slate-500 font-mono">{role.name}</span>
                                        </td>
                                        <td className="px-5 py-4 whitespace-nowrap text-sm text-slate-600">{role.guard_name || 'web'}</td>
                                        <td className="px-5 py-4 whitespace-nowrap">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-medium bg-slate-100 text-slate-700">
                                                {role.permissions_count || 0} {role.permissions_count === 1 ? 'permission' : 'permissions'}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 whitespace-nowrap text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <a
                                                    href={`/admin/roles/${role.id}/edit`}
                                                    className="inline-flex items-center justify-center w-9 h-9 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
                                                    title="Edit"
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </a>
                                                <button
                                                    onClick={() => handleDeleteRole(role)}
                                                    className="inline-flex items-center justify-center w-9 h-9 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add Role Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md">
                        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
                            <div className="flex items-center gap-2">
                                <div className="p-2 rounded-xl bg-emerald-100">
                                    <Settings className="w-5 h-5 text-emerald-600" />
                                </div>
                                <h3 className="text-lg font-semibold text-slate-800">Add New Role</h3>
                            </div>
                            <button
                                onClick={handleCloseModal}
                                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                                aria-label="Close"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmitAdd} className="p-5 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1" htmlFor="role-name">
                                    Role Name <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    id="role-name"
                                    type="text"
                                    value={roleName}
                                    onChange={(e) => setRoleName(e.target.value)}
                                    placeholder="e.g., MANAGER, COORDINATOR"
                                    className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-shadow"
                                    required
                                    autoComplete="off"
                                />
                                <p className="mt-1.5 text-xs text-slate-500">Use uppercase with underscores (e.g., LGU_ADMIN, MANAGER)</p>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1" htmlFor="guard-name">
                                    Guard Name
                                </label>
                                <input
                                    id="guard-name"
                                    type="text"
                                    value={guardName}
                                    onChange={(e) => setGuardName(e.target.value)}
                                    placeholder="web"
                                    className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-shadow"
                                    autoComplete="off"
                                />
                                <p className="mt-1.5 text-xs text-slate-500">Authentication guard for this role (default: web)</p>
                            </div>
                            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            Creating...
                                        </>
                                    ) : (
                                        <>
                                            <Plus className="w-4 h-4" />
                                            Create Role
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
