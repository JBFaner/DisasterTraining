import React from 'react';
import { Search, Filter, Plus, Eye, Pencil, Lock, Unlock, CheckCircle2, Key, KeyRound, UserCircle } from 'lucide-react';

export function AdminUsersPage({ users = [], currentUser = null }) {
    const [search, setSearch] = React.useState('');
    const [roleFilter, setRoleFilter] = React.useState('all');
    const [statusFilter, setStatusFilter] = React.useState('all');
    const [usersState, setUsersState] = React.useState(users);
    const [loadingUserId, setLoadingUserId] = React.useState(null);

    // Check if current user can manage a target user
    const canManageUser = (targetUser) => {
        if (!currentUser) return false;
        
        // Admin can manage everyone
        if (currentUser.role === 'LGU_ADMIN') {
            return true;
        }
        
        // LGU Admin can only manage their own account
        if (currentUser.role === 'LGU_ADMIN') {
            return currentUser.id === targetUser.id;
        }
        
        return false;
    };

    // Update users state when props change
    React.useEffect(() => {
        setUsersState(users);
    }, [users]);

    const normalizedUsers = (usersState || []).map((u) => ({
        ...u,
        _name: (u.name || '').toLowerCase(),
        _email: (u.email || '').toLowerCase(),
    }));

    const filteredUsers = normalizedUsers.filter((user) => {
        const query = search.toLowerCase().trim();
        const matchesSearch =
            !query ||
            user._name.includes(query) ||
            user._email.includes(query);

        const matchesRole =
            roleFilter === 'all' || user.role === roleFilter;

        const matchesStatus =
            statusFilter === 'all' || user.status === statusFilter;

        return matchesSearch && matchesRole && matchesStatus;
    });

    const getStatusBadge = (status) => {
        switch (status) {
            case 'active':
                return 'bg-emerald-50 text-emerald-700 border-emerald-200';
            case 'disabled':
                return 'bg-rose-50 text-rose-700 border-rose-200';
            case 'pending_verification':
                return 'bg-amber-50 text-amber-700 border-amber-200';
            default:
                return 'bg-slate-50 text-slate-700 border-slate-200';
        }
    };

    const handleManualVerify = (user) => {
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = `/admin/users/${user.id}/manual-verify`;

        const csrf = document.head.querySelector('meta[name="csrf-token"]')?.content;
        if (csrf) {
            const tokenInput = document.createElement('input');
            tokenInput.type = 'hidden';
            tokenInput.name = '_token';
            tokenInput.value = csrf;
            form.appendChild(tokenInput);
        }

        document.body.appendChild(form);
        form.submit();
    };

    const handleToggleStatus = async (user) => {
        const isCurrentlyActive = user.status === 'active';
        const action = isCurrentlyActive ? 'disable' : 'enable';
        
        if (isCurrentlyActive) {
            // Disabling
            if (!confirm(`Are you sure you want to disable ${user.name} (${user.email})?\n\nThis will:\n- Prevent the user from logging in\n- Automatically disable the USB key\n- Invalidate their current session if logged in\n\nThe account can be re-enabled later.`)) {
                return;
            }
        } else {
            // Enabling
            if (!confirm(`Are you sure you want to enable ${user.name} (${user.email})?\n\nThis will:\n- Allow the user to log in\n- Automatically re-enable the USB key (if one exists)\n\nThe existing USB key file will remain valid.`)) {
                return;
            }
        }

        setLoadingUserId(user.id);
        const csrf = document.head.querySelector('meta[name="csrf-token"]')?.content;

        try {
            const formData = new FormData();
            formData.append('_token', csrf);
            formData.append('_method', 'POST');

            const response = await fetch(`/admin/users/${user.id}/${action}`, {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN': csrf,
                    'Accept': 'application/json',
                },
                body: formData,
            });

            const data = await response.json();

            if (response.ok) {
                // Update user state immediately
                setUsersState(prevUsers => 
                    prevUsers.map(u => {
                        if (u.id === user.id) {
                            return {
                                ...u,
                                status: action === 'disable' ? 'disabled' : 'active',
                                usb_key_enabled: action === 'disable' ? false : (u.usb_key_hash ? true : u.usb_key_enabled),
                            };
                        }
                        return u;
                    })
                );
            } else {
                alert(data.message || `Failed to ${action} user. Please try again.`);
            }
        } catch (error) {
            console.error('Error toggling user status:', error);
            alert(`An error occurred while ${action === 'disable' ? 'disabling' : 'enabling'} the user. Please try again.`);
        } finally {
            setLoadingUserId(null);
        }
    };


    const handleGenerateUsbKey = async (user) => {
        if (!confirm(`Generate a new USB key for ${user.name}? This will revoke any existing USB key.`)) {
            return;
        }

        setLoadingUserId(user.id);
        const csrf = document.head.querySelector('meta[name="csrf-token"]')?.content;

        try {
            const response = await fetch(`/admin/users/${user.id}/generate-usb-key`, {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN': csrf,
                    'Accept': 'text/plain',
                },
            });

            if (response.ok) {
                // Update the user's USB key status in state immediately
                setUsersState(prevUsers => 
                    prevUsers.map(u => 
                        u.id === user.id 
                            ? { ...u, usb_key_enabled: true }
                            : u
                    )
                );

                // Trigger file download
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `disaster-training-usb-key-${user.id}.txt`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            } else {
                const errorText = await response.text();
                let errorMessage = 'Failed to generate USB key. Please try again.';
                try {
                    const errorJson = JSON.parse(errorText);
                    errorMessage = errorJson.error || errorMessage;
                } catch (e) {
                    // Not JSON, use default message
                }
                alert(errorMessage);
            }
        } catch (error) {
            console.error('Error generating USB key:', error);
            alert('An error occurred while generating the USB key. Please try again.');
        } finally {
            setLoadingUserId(null);
        }
    };

    const handleRevokeUsbKey = async (user) => {
        if (!confirm(`Revoke USB key for ${user.name}? They will need to generate a new key to use USB authentication.`)) {
            return;
        }

        setLoadingUserId(user.id);
        const csrf = document.head.querySelector('meta[name="csrf-token"]')?.content;

        try {
            const response = await fetch(`/admin/users/${user.id}/revoke-usb-key`, {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN': csrf,
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });

            if (response.ok) {
                const data = await response.json();
                // Update the user's USB key status in state immediately
                setUsersState(prevUsers => 
                    prevUsers.map(u => 
                        u.id === user.id 
                            ? { ...u, usb_key_enabled: false }
                            : u
                    )
                );
            } else {
                const errorData = await response.json().catch(() => ({ error: 'Failed to revoke USB key. Please try again.' }));
                alert(errorData.error || 'Failed to revoke USB key. Please try again.');
            }
        } catch (error) {
            console.error('Error revoking USB key:', error);
            alert('An error occurred while revoking the USB key. Please try again.');
        } finally {
            setLoadingUserId(null);
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
                                <UserCircle className="w-9 h-9 text-emerald-600" />
                            </div>
                            <h1 className="text-[30px] font-bold text-slate-900 tracking-tight">User Management</h1>
                        </div>
                        <p className="text-sm text-slate-600 mt-1 max-w-xl leading-relaxed">
                            Manage LGU Admin, Trainer, and Staff accounts.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-3 shrink-0">
                        <a
                            href="/admin/users/create"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 hover:shadow-[0_0_0_4px_rgba(16,185,129,0.35)] hover:-translate-y-0.5 text-white rounded-xl font-semibold text-sm transition-all duration-250"
                        >
                            <Plus className="w-5 h-5" />
                            Add User
                        </a>
                    </div>
                </div>
            </div>

            {/* Search & filters */}
            <div className="flex flex-col md:flex-row md:items-center gap-3">
                <div className="relative flex-1 min-w-[220px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search by name or email..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-shadow"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-slate-400" />
                    <select
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                        className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                        <option value="all">All Roles</option>
                        <option value="LGU_ADMIN">LGU Admin</option>
                        <option value="LGU_TRAINER">Trainer</option>
                        <option value="STAFF">Staff</option>
                    </select>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                        <option value="all">All Status</option>
                        <option value="active">Active</option>
                        <option value="disabled">Disabled</option>
                        <option value="pending_verification">Pending Verification</option>
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden w-full">
                <div className="overflow-x-auto w-full">
                    <table className="w-full min-w-[900px] text-sm">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                                <th className="px-5 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider whitespace-nowrap">User ID</th>
                                <th className="px-5 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider whitespace-nowrap">Full Name</th>
                                <th className="px-5 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider whitespace-nowrap">Email</th>
                                <th className="px-5 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider whitespace-nowrap">Role</th>
                                <th className="px-5 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider whitespace-nowrap">Barangay</th>
                                <th className="px-5 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider whitespace-nowrap">Status</th>
                                <th className="px-5 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider whitespace-nowrap">Created</th>
                                <th className="px-5 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider whitespace-nowrap">Last Login</th>
                                <th className="px-5 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider whitespace-nowrap">USB Key</th>
                                <th className="px-5 py-4 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider whitespace-nowrap">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredUsers.length === 0 && (
                                <tr>
                                    <td colSpan={10} className="px-5 py-12 text-center">
                                        <p className="text-slate-500 font-medium">No users match your search or filters.</p>
                                        <p className="text-slate-400 text-xs mt-1">Try adjusting the search or filter criteria.</p>
                                    </td>
                                </tr>
                            )}
                            {filteredUsers.map((user) => (
                                <tr key={user.id} className="bg-white hover:bg-slate-50/80 transition-colors duration-150">
                                    <td className="px-5 py-4 text-xs text-slate-500 whitespace-nowrap">#{user.id}</td>
                                    <td className="px-5 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-slate-900 truncate max-w-[150px]" title={user.name}>{user.name}</div>
                                    </td>
                                    <td className="px-5 py-4 whitespace-nowrap">
                                        <div className="text-sm text-slate-700 truncate max-w-[200px]" title={user.email}>{user.email}</div>
                                    </td>
                                    <td className="px-5 py-4 whitespace-nowrap">
                                        <span className="inline-flex items-center rounded-lg bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                                            {user.role === 'LGU_ADMIN' && 'LGU Admin'}
                                            {user.role === 'LGU_TRAINER' && 'Trainer'}
                                            {user.role === 'STAFF' && 'Staff'}
                                            {!['LGU_ADMIN', 'LGU_TRAINER', 'STAFF'].includes(user.role) && user.role}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4 text-sm text-slate-700 whitespace-nowrap">{user.barangay_profile?.barangay_name ?? '—'}</td>
                                    <td className="px-5 py-4 whitespace-nowrap">
                                        <span className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-0.5 text-xs font-medium ${getStatusBadge(user.status)}`}>
                                            <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
                                            <span className="capitalize">{user.status?.replace('_', ' ') || 'N/A'}</span>
                                        </span>
                                    </td>
                                    <td className="px-5 py-4 text-sm text-slate-600 whitespace-nowrap">
                                        {user.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' }) : 'N/A'}
                                    </td>
                                    <td className="px-5 py-4 text-sm text-slate-600 whitespace-nowrap">
                                        {user.last_login ? new Date(user.last_login).toLocaleString('en-US', { year: 'numeric', month: 'short', day: '2-digit', hour: 'numeric', minute: '2-digit' }) : 'Never'}
                                    </td>
                                    <td className="px-5 py-4 whitespace-nowrap">
                                        {['LGU_ADMIN', 'LGU_TRAINER'].includes(user.role) ? (
                                            user.usb_key_enabled ? (
                                                <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-xs font-medium text-emerald-700">
                                                    <KeyRound className="w-3 h-3" /> Enabled
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 rounded-lg bg-slate-50 border border-slate-200 px-2 py-0.5 text-xs font-medium text-slate-600">
                                                    <Key className="w-3 h-3" /> Disabled
                                                </span>
                                            )
                                        ) : (
                                            <span className="text-xs text-slate-400">N/A</span>
                                        )}
                                    </td>
                                    <td className="px-5 py-4 whitespace-nowrap">
                                        <div className="flex items-center justify-end gap-2">
                                            {currentUser?.role === 'LGU_ADMIN' && (
                                                <a href={`/admin/users/${user.id}`} className="inline-flex items-center justify-center w-9 h-9 rounded-xl border border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100 transition-colors" title="View">
                                                    <Eye className="w-4 h-4" />
                                                </a>
                                            )}
                                            {canManageUser(user) && (
                                                <a href={`/admin/users/${user.id}/edit`} className="inline-flex items-center justify-center w-9 h-9 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors" title="Edit">
                                                    <Pencil className="w-4 h-4" />
                                                </a>
                                            )}
                                            {canManageUser(user) && user.status === 'pending_verification' && (
                                                <button type="button" onClick={() => handleManualVerify(user)} className="inline-flex items-center justify-center w-9 h-9 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors" title="Verify account">
                                                    <CheckCircle2 className="w-4 h-4" />
                                                </button>
                                            )}
                                            {canManageUser(user) && (
                                                <button type="button" onClick={() => handleToggleStatus(user)} disabled={loadingUserId === user.id} className="inline-flex items-center justify-center w-9 h-9 rounded-xl border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" title={user.status === 'active' ? 'Disable' : 'Enable'}>
                                                    {loadingUserId === user.id ? <div className="w-4 h-4 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" /> : user.status === 'active' ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                                                </button>
                                            )}
                                            {canManageUser(user) && ['LGU_ADMIN', 'LGU_TRAINER'].includes(user.role) && (
                                                user.usb_key_enabled ? (
                                                    <button type="button" onClick={() => handleRevokeUsbKey(user)} disabled={loadingUserId === user.id} className="inline-flex items-center justify-center w-9 h-9 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" title="Revoke USB key">
                                                        {loadingUserId === user.id ? <div className="w-4 h-4 border-2 border-rose-700 border-t-transparent rounded-full animate-spin" /> : <KeyRound className="w-4 h-4" />}
                                                    </button>
                                                ) : (
                                                    <button type="button" onClick={() => handleGenerateUsbKey(user)} disabled={loadingUserId === user.id} className="inline-flex items-center justify-center w-9 h-9 rounded-xl border border-teal-200 bg-teal-50 text-teal-700 hover:bg-teal-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" title="Generate USB key">
                                                        {loadingUserId === user.id ? <div className="w-4 h-4 border-2 border-teal-700 border-t-transparent rounded-full animate-spin" /> : <Key className="w-4 h-4" />}
                                                    </button>
                                                )
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

