import React from 'react';
import { Search, Filter, Plus, Eye, Pencil, Lock, Unlock, Archive, CheckCircle2 } from 'lucide-react';

export function AdminUsersPage({ users = [] }) {
    const [search, setSearch] = React.useState('');
    const [roleFilter, setRoleFilter] = React.useState('all');
    const [statusFilter, setStatusFilter] = React.useState('all');

    const normalizedUsers = (users || []).map((u) => ({
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
            case 'inactive':
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

    const handleToggleStatus = (user) => {
        const isCurrentlyActive = user.status === 'active';
        const action = isCurrentlyActive ? 'disable' : 'enable';
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = `/admin/users/${user.id}/${action}`;

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

    const handleArchive = (user) => {
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = `/admin/users/${user.id}/archive`;

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

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-semibold text-slate-900">
                        User Management
                    </h1>
                    <p className="text-sm text-slate-600 mt-1">
                        Manage LGU Admin, Trainer, and Staff accounts for the disaster preparedness system.
                    </p>
                </div>
                <a
                    href="/admin/users/create"
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Add User
                </a>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row md:items-center gap-3">
                <div className="relative flex-1 min-w-[220px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search by name or email..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 rounded-md border border-slate-300 bg-white text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <div className="inline-flex items-center gap-2">
                        <Filter className="w-4 h-4 text-slate-400" />
                        <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                            Filters
                        </span>
                    </div>
                    <select
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                        className="rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    >
                        <option value="all">All Roles</option>
                        <option value="LGU_ADMIN">LGU Admin</option>
                        <option value="LGU_TRAINER">Trainer</option>
                        <option value="STAFF">Staff</option>
                    </select>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    >
                        <option value="all">All Status</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="pending_verification">Pending Verification</option>
                    </select>
                </div>
            </div>

            {/* Users table */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200 text-sm">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                    User ID
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                    Full Name
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                    Email Address
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                    Role
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                    Created Date
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                    Last Login
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredUsers.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={8}
                                        className="px-6 py-8 text-center text-sm text-slate-500"
                                    >
                                        No users found for the current search and filters.
                                    </td>
                                </tr>
                            )}
                            {filteredUsers.map((user) => (
                                <tr key={user.id} className="hover:bg-slate-50/70 transition-colors">
                                    <td className="px-6 py-3 text-xs text-slate-500">
                                        #{user.id}
                                    </td>
                                    <td className="px-6 py-3">
                                        <div className="text-sm font-medium text-slate-900">
                                            {user.name}
                                        </div>
                                    </td>
                                    <td className="px-6 py-3">
                                        <div className="text-sm text-slate-700">
                                            {user.email}
                                        </div>
                                    </td>
                                    <td className="px-6 py-3">
                                        <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                                            {user.role === 'LGU_ADMIN' && 'LGU Admin'}
                                            {user.role === 'LGU_TRAINER' && 'Trainer'}
                                            {user.role === 'STAFF' && 'Staff'}
                                            {!['LGU_ADMIN', 'LGU_TRAINER', 'STAFF'].includes(user.role) && user.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-3">
                                        <span
                                            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${getStatusBadge(
                                                user.status,
                                            )}`}
                                        >
                                            <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
                                            <span className="capitalize">
                                                {user.status?.replace('_', ' ') || 'N/A'}
                                            </span>
                                        </span>
                                    </td>
                                    <td className="px-6 py-3 text-sm text-slate-600">
                                        {user.created_at
                                            ? new Date(user.created_at).toLocaleDateString('en-US', {
                                                  year: 'numeric',
                                                  month: 'short',
                                                  day: '2-digit',
                                              })
                                            : 'N/A'}
                                    </td>
                                    <td className="px-6 py-3 text-sm text-slate-600">
                                        {user.last_login
                                            ? new Date(user.last_login).toLocaleString('en-US', {
                                                  year: 'numeric',
                                                  month: 'short',
                                                  day: '2-digit',
                                                  hour: 'numeric',
                                                  minute: '2-digit',
                                              })
                                            : 'Never'}
                                    </td>
                                    <td className="px-6 py-3">
                                        <div className="flex items-center justify-end gap-1.5 text-xs">
                                            <a
                                                href={`/admin/users/${user.id}`}
                                                className="inline-flex items-center justify-center rounded-md border border-slate-200 p-1.5 text-slate-700 hover:bg-slate-100"
                                                title="View"
                                            >
                                                <Eye className="w-3.5 h-3.5" />
                                            </a>
                                            <a
                                                href={`/admin/users/${user.id}/edit`}
                                                className="inline-flex items-center justify-center rounded-md border border-blue-200 bg-blue-50 p-1.5 text-blue-700 hover:bg-blue-100"
                                                title="Edit"
                                            >
                                                <Pencil className="w-3.5 h-3.5" />
                                            </a>
                                            {user.status === 'pending_verification' && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleManualVerify(user)}
                                                    className="inline-flex items-center justify-center rounded-md border border-emerald-200 bg-emerald-50 p-1.5 text-emerald-700 hover:bg-emerald-100"
                                                    title="Verify account"
                                                >
                                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                            <button
                                                type="button"
                                                onClick={() => handleToggleStatus(user)}
                                                className="inline-flex items-center justify-center rounded-md border border-amber-200 bg-amber-50 p-1.5 text-amber-700 hover:bg-amber-100"
                                                title={user.status === 'active' ? 'Disable account' : 'Enable account'}
                                            >
                                                {user.status === 'active' ? (
                                                    <Lock className="w-3.5 h-3.5" />
                                                ) : (
                                                    <Unlock className="w-3.5 h-3.5" />
                                                )}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleArchive(user)}
                                                className="inline-flex items-center justify-center rounded-md border border-slate-300 p-1.5 text-slate-600 hover:bg-slate-100"
                                                title="Archive account"
                                            >
                                                <Archive className="w-3.5 h-3.5" />
                                            </button>
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

