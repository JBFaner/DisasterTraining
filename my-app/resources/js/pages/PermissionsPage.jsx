import React from 'react';
import { Search, Plus, ShieldCheck, Pencil, Trash2, X } from 'lucide-react';
import Swal from 'sweetalert2';

export function PermissionsPage({ permissions = [] }) {
    const [search, setSearch] = React.useState('');
    const [permissionsState, setPermissionsState] = React.useState(permissions);
    const [showAddModal, setShowAddModal] = React.useState(false);
    const [permissionName, setPermissionName] = React.useState('');
    const [guardName, setGuardName] = React.useState('web');
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    // Update permissions state when props change
    React.useEffect(() => {
        setPermissionsState(permissions);
    }, [permissions]);

    const filteredPermissions = (permissionsState || []).filter((permission) => {
        const query = search.toLowerCase().trim();
        return !query || (permission.name || '').toLowerCase().includes(query);
    });

    const handleAddPermission = async () => {
        setShowAddModal(true);
    };

    const handleCloseModal = () => {
        setShowAddModal(false);
        setPermissionName('');
        setGuardName('web');
    };

    const handleSubmitAdd = async (e) => {
        e.preventDefault();
        
        const name = permissionName.trim();
        const guard = guardName.trim() || 'web';

        if (!name) {
            Swal.fire({
                icon: 'error',
                title: 'Validation Error',
                text: 'Permission name is required',
                confirmButtonColor: '#64748b',
            });
            return;
        }

        if (!/^[a-z][a-z0-9_.]*$/.test(name)) {
            Swal.fire({
                icon: 'error',
                title: 'Validation Error',
                html: 'Permission name must be lowercase with dots<br><small>Example: users.create, resources.edit</small>',
                confirmButtonColor: '#64748b',
            });
            return;
        }

        setIsSubmitting(true);
        const csrf = document.head.querySelector('meta[name="csrf-token"]')?.content;

        try {
            const response = await fetch('/admin/permissions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrf,
                    'Accept': 'application/json',
                },
                body: JSON.stringify({ name, guard_name: guard }),
            });

            const data = await response.json();

            if (response.ok) {
                Swal.fire({
                    icon: 'success',
                    title: 'Permission Created',
                    text: 'The permission has been created successfully.',
                    timer: 2000,
                    showConfirmButton: false,
                    customClass: {
                        popup: 'rounded-xl shadow-2xl border border-slate-200',
                    },
                });
                setTimeout(() => window.location.reload(), 2100);
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: data.message || 'Failed to create permission. Please try again.',
                    confirmButtonColor: '#64748b',
                });
            }
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'An error occurred while creating the permission. Please try again.',
                confirmButtonColor: '#64748b',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeletePermission = async (permission) => {
        const result = await Swal.fire({
            title: 'Delete Permission?',
            text: `Are you sure you want to delete "${permission.name}"? This cannot be undone.`,
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
            form.action = `/admin/permissions/${permission.id}`;
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

    const oldHandleAddPermission = async () => {
        const { value: formValues } = await Swal.fire({
            title: '<div class="flex items-center gap-3 mb-2"><div class="p-2 bg-blue-100 rounded-lg"><svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"></path></svg></div><span class="text-xl font-semibold text-slate-900">Add New Permission</span></div>',
            html: `
                <div class="text-left space-y-5 pt-2">
                    <div class="space-y-2">
                        <label class="block text-sm font-semibold text-slate-700 mb-2">
                            Permission Name <span class="text-red-500">*</span>
                        </label>
                        <input 
                            id="permission-name" 
                            type="text"
                            class="w-full px-4 py-2.5 border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none text-sm font-medium text-slate-900 placeholder:text-slate-400" 
                            placeholder="e.g., users.create, resources.edit" 
                            required
                            autocomplete="off"
                        >
                        <p class="text-xs text-slate-500 mt-1.5 flex items-center gap-1">
                            <svg class="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                            Use lowercase with dots (e.g., users.create, resources.edit)
                        </p>
                    </div>
                    <div class="space-y-2">
                        <label class="block text-sm font-semibold text-slate-700 mb-2">
                            Guard Name
                        </label>
                        <input 
                            id="guard-name" 
                            type="text"
                            value="web"
                            class="w-full px-4 py-2.5 border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none text-sm font-medium text-slate-900 placeholder:text-slate-400" 
                            placeholder="web"
                            autocomplete="off"
                        >
                        <p class="text-xs text-slate-500 mt-1.5">Authentication guard for this permission (default: web)</p>
                    </div>
                </div>
            `,
            width: '520px',
            padding: '2rem',
            background: '#ffffff',
            backdrop: 'rgba(0, 0, 0, 0.4)',
            focusConfirm: false,
            showCancelButton: true,
            confirmButtonText: '<span class="flex items-center gap-2"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>Create Permission</span>',
            cancelButtonText: '<span class="flex items-center gap-2"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>Cancel</span>',
            confirmButtonColor: '#2563eb',
            cancelButtonColor: '#64748b',
            buttonsStyling: true,
            customClass: {
                popup: 'rounded-xl shadow-2xl border border-slate-200',
                title: 'text-left',
                confirmButton: 'px-6 py-2.5 rounded-lg font-semibold text-sm shadow-sm hover:shadow-md transition-all',
                cancelButton: 'px-6 py-2.5 rounded-lg font-semibold text-sm shadow-sm hover:shadow-md transition-all mr-3',
            },
            preConfirm: () => {
                const permissionName = document.getElementById('permission-name').value.trim();
                const guardName = document.getElementById('guard-name').value.trim() || 'web';

                if (!permissionName) {
                    Swal.showValidationMessage('<div class="text-left"><p class="font-medium text-red-600">Permission name is required</p></div>');
                    return false;
                }

                // Validate format (lowercase with dots)
                if (!/^[a-z][a-z0-9_.]*$/.test(permissionName)) {
                    Swal.showValidationMessage('<div class="text-left"><p class="font-medium text-red-600">Permission name must be lowercase with dots</p><p class="text-sm text-slate-600 mt-1">Example: users.create, resources.edit, reports.generate</p></div>');
                    return false;
                }

                return { name: permissionName, guard_name: guardName };
            },
        });

        if (formValues) {
            const csrf = document.head.querySelector('meta[name="csrf-token"]')?.content;

            try {
                const response = await fetch('/admin/permissions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': csrf,
                        'Accept': 'application/json',
                    },
                    body: JSON.stringify(formValues),
                });

                const data = await response.json();

                if (response.ok) {
                    Swal.fire({
                        icon: 'success',
                        title: '<div class="text-lg font-semibold text-slate-900">Permission Created</div>',
                        html: '<div class="text-sm text-slate-600 mt-2">The permission has been created successfully.</div>',
                        timer: 2000,
                        showConfirmButton: false,
                        customClass: {
                            popup: 'rounded-xl shadow-2xl border border-slate-200',
                            icon: 'text-emerald-500',
                        },
                    });
                    // Reload page to show new permission
                    setTimeout(() => window.location.reload(), 2100);
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: '<div class="text-lg font-semibold text-slate-900">Error</div>',
                        html: `<div class="text-sm text-slate-600 mt-2">${data.message || 'Failed to create permission. Please try again.'}</div>`,
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
                    html: '<div class="text-sm text-slate-600 mt-2">An error occurred while creating the permission. Please try again.</div>',
                    customClass: {
                        popup: 'rounded-xl shadow-2xl border border-slate-200',
                        icon: 'text-red-500',
                    },
                });
            }
        }
    };

    return (
        <div className="space-y-6 w-full overflow-x-hidden">
            {/* Hero Header - Certification style */}
            <div className="rounded-2xl bg-gradient-to-br from-slate-50 via-white to-emerald-50/40 border border-slate-200/80 shadow-xl p-8 md:p-10 transition-all duration-250">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-3 bg-emerald-100 rounded-xl shadow-md">
                                <ShieldCheck className="w-9 h-9 text-emerald-600" />
                            </div>
                            <h1 className="text-[30px] font-bold text-slate-900 tracking-tight">Permission Management</h1>
                        </div>
                        <p className="text-sm text-slate-600 mt-1 max-w-xl leading-relaxed">
                            Manage system permissions and access controls.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-3 shrink-0">
                        <button
                            onClick={handleAddPermission}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 hover:shadow-[0_0_0_4px_rgba(16,185,129,0.35)] hover:-translate-y-0.5 text-white rounded-xl font-semibold text-sm transition-all duration-250"
                        >
                            <Plus className="w-5 h-5" />
                            Add Permission
                        </button>
                    </div>
                </div>
            </div>

            {/* Search */}
            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                    type="text"
                    placeholder="Search permissions..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-shadow"
                />
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[600px] text-sm">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                                <th className="px-5 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">ID</th>
                                <th className="px-5 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Permission Name</th>
                                <th className="px-5 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Guard</th>
                                <th className="px-5 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Roles</th>
                                <th className="px-5 py-4 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredPermissions.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-5 py-12 text-center">
                                        <p className="text-slate-500 font-medium">No permissions found</p>
                                        <p className="text-slate-400 text-xs mt-1">
                                            {permissions.length === 0 ? 'Click "Add Permission" to create one.' : 'Try a different search term.'}
                                        </p>
                                    </td>
                                </tr>
                            ) : (
                                filteredPermissions.map((permission) => (
                                    <tr key={permission.id} className="bg-white hover:bg-slate-50/80 transition-colors duration-150">
                                        <td className="px-5 py-4 whitespace-nowrap text-sm text-slate-500">#{permission.id}</td>
                                        <td className="px-5 py-4 whitespace-nowrap">
                                            <span className="text-sm font-medium text-slate-900 font-mono">{permission.name || 'N/A'}</span>
                                        </td>
                                        <td className="px-5 py-4 whitespace-nowrap text-sm text-slate-600">{permission.guard_name || 'web'}</td>
                                        <td className="px-5 py-4 whitespace-nowrap">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-medium bg-slate-100 text-slate-700">
                                                {permission.roles_count || 0} {permission.roles_count === 1 ? 'role' : 'roles'}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 whitespace-nowrap text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <a
                                                    href={`/admin/permissions/${permission.id}/edit`}
                                                    className="inline-flex items-center justify-center w-9 h-9 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
                                                    title="Edit"
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </a>
                                                <button
                                                    onClick={() => handleDeletePermission(permission)}
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

            {/* Add Permission Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md">
                        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
                            <div className="flex items-center gap-2">
                                <div className="p-2 rounded-xl bg-emerald-100">
                                    <ShieldCheck className="w-5 h-5 text-emerald-600" />
                                </div>
                                <h3 className="text-lg font-semibold text-slate-800">Add New Permission</h3>
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
                                <label className="block text-xs font-semibold text-slate-600 mb-1" htmlFor="permission-name">
                                    Permission Name <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    id="permission-name"
                                    type="text"
                                    value={permissionName}
                                    onChange={(e) => setPermissionName(e.target.value)}
                                    placeholder="e.g., users.create, resources.edit"
                                    className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-shadow"
                                    required
                                    autoComplete="off"
                                />
                                <p className="mt-1.5 text-xs text-slate-500">Use lowercase with dots (e.g., users.create, resources.edit)</p>
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
                                <p className="mt-1.5 text-xs text-slate-500">Authentication guard for this permission (default: web)</p>
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
                                            Create Permission
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
