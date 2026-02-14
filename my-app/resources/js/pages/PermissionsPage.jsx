import React from 'react';
import { Search, Plus, Key, Pencil, Trash2 } from 'lucide-react';
import Swal from 'sweetalert2';

export function PermissionsPage({ permissions = [] }) {
    const [search, setSearch] = React.useState('');
    const [permissionsState, setPermissionsState] = React.useState(permissions);

    // Update permissions state when props change
    React.useEffect(() => {
        setPermissionsState(permissions);
    }, [permissions]);

    const filteredPermissions = (permissionsState || []).filter((permission) => {
        const query = search.toLowerCase().trim();
        return !query || (permission.name || '').toLowerCase().includes(query);
    });

    const handleAddPermission = async () => {
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
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                        <Key className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-semibold text-slate-900">
                            Permission Management
                        </h1>
                    </div>
                </div>
                <button
                    onClick={handleAddPermission}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Add Permission
                </button>
            </div>

            {/* Search Bar */}
            <div className="flex items-center gap-3">
                <div className="relative flex-1 min-w-[220px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                                    ID
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                                    Permission Name
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                                    Guard
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                                    Roles
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                            {filteredPermissions.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-8 text-center text-sm text-slate-500">
                                        No permissions found
                                    </td>
                                </tr>
                            ) : (
                                filteredPermissions.map((permission) => (
                                    <tr key={permission.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                                            {permission.id}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                                            {permission.name || 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                                            {permission.guard_name || 'web'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                                                {permission.roles_count || 0} roles
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <div className="flex items-center gap-2">
                                                <a
                                                    href={`/admin/permissions/${permission.id}/edit`}
                                                    className="p-2 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors"
                                                    title="Edit"
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </a>
                                                <button
                                                    className="p-2 bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors"
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
        </div>
    );
}
