import React from 'react';
import { Search, Plus, Settings, Pencil, Trash2 } from 'lucide-react';
import Swal from 'sweetalert2';

export function RolesPage({ roles = [] }) {
    const [search, setSearch] = React.useState('');
    const [rolesState, setRolesState] = React.useState(roles);

    // Update roles state when props change
    React.useEffect(() => {
        setRolesState(roles);
    }, [roles]);

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

    const filteredRoles = (rolesState || []).filter((role) => {
        const query = search.toLowerCase().trim();
        const displayName = getRoleDisplayName(role.name || '').toLowerCase();
        const roleName = (role.name || '').toLowerCase();
        return !query || displayName.includes(query) || roleName.includes(query);
    });

    const handleAddRole = async () => {
        const { value: formValues } = await Swal.fire({
            title: '<div class="flex items-center gap-3 mb-2"><div class="p-2 bg-blue-100 rounded-lg"><svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg></div><span class="text-xl font-semibold text-slate-900">Add New Role</span></div>',
            html: `
                <div class="text-left space-y-5 pt-2">
                    <div class="space-y-2">
                        <label class="block text-sm font-semibold text-slate-700 mb-2">
                            Role Name <span class="text-red-500">*</span>
                        </label>
                        <input 
                            id="role-name" 
                            type="text"
                            class="w-full px-4 py-2.5 border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none text-sm font-medium text-slate-900 placeholder:text-slate-400" 
                            placeholder="e.g., MANAGER, COORDINATOR" 
                            required
                            autocomplete="off"
                        >
                        <p class="text-xs text-slate-500 mt-1.5 flex items-center gap-1">
                            <svg class="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                            Use uppercase with underscores (e.g., LGU_ADMIN, MANAGER)
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
                        <p class="text-xs text-slate-500 mt-1.5">Authentication guard for this role (default: web)</p>
                    </div>
                </div>
            `,
            width: '520px',
            padding: '2rem',
            background: '#ffffff',
            backdrop: 'rgba(0, 0, 0, 0.4)',
            focusConfirm: false,
            showCancelButton: true,
            confirmButtonText: '<span class="flex items-center gap-2"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>Create Role</span>',
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
                const roleName = document.getElementById('role-name').value.trim();
                const guardName = document.getElementById('guard-name').value.trim() || 'web';

                if (!roleName) {
                    Swal.showValidationMessage('<div class="text-left"><p class="font-medium text-red-600">Role name is required</p></div>');
                    return false;
                }

                // Validate format (uppercase with underscores)
                if (!/^[A-Z_]+$/.test(roleName)) {
                    Swal.showValidationMessage('<div class="text-left"><p class="font-medium text-red-600">Role name must be uppercase with underscores</p><p class="text-sm text-slate-600 mt-1">Example: LGU_ADMIN, MANAGER, COORDINATOR</p></div>');
                    return false;
                }

                return { name: roleName, guard_name: guardName };
            },
        });

        if (formValues) {
            const csrf = document.head.querySelector('meta[name="csrf-token"]')?.content;

            try {
                const response = await fetch('/admin/roles', {
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
                        title: '<div class="text-lg font-semibold text-slate-900">Role Created</div>',
                        html: '<div class="text-sm text-slate-600 mt-2">The role has been created successfully.</div>',
                        timer: 2000,
                        showConfirmButton: false,
                        customClass: {
                            popup: 'rounded-xl shadow-2xl border border-slate-200',
                            icon: 'text-emerald-500',
                        },
                    });
                    // Reload page to show new role
                    setTimeout(() => window.location.reload(), 2100);
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: '<div class="text-lg font-semibold text-slate-900">Error</div>',
                        html: `<div class="text-sm text-slate-600 mt-2">${data.message || 'Failed to create role. Please try again.'}</div>`,
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
                    html: '<div class="text-sm text-slate-600 mt-2">An error occurred while creating the role. Please try again.</div>',
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
                    <div className="p-2 bg-emerald-100 rounded-lg">
                        <Settings className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-semibold text-slate-900">
                            Roles Management
                        </h1>
                    </div>
                </div>
                <button
                    onClick={handleAddRole}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Add Role
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
                                    Role Name
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                                    Guard
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                                    Permissions
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                            {filteredRoles.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-8 text-center text-sm text-slate-500">
                                        No roles found
                                    </td>
                                </tr>
                            ) : (
                                filteredRoles.map((role) => (
                                    <tr key={role.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                                            {role.id}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                                            {getRoleDisplayName(role.name) || 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                                            {role.guard_name || 'web'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                                                {role.permissions_count || 0} permissions
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <div className="flex items-center gap-2">
                                                <a
                                                    href={`/admin/roles/${role.id}/edit`}
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
