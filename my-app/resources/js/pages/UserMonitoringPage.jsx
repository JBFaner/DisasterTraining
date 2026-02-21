import React, { useState, useEffect } from 'react';
import { Users, Circle, Clock, Mail, Shield, UserCircle, RefreshCw, Search, Filter, Activity } from 'lucide-react';

export function UserMonitoringPage({ users: initialUsers = [] }) {
    const [users, setUsers] = useState(initialUsers);
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Refresh user statuses every 30 seconds
    useEffect(() => {
        const refreshStatuses = async () => {
            try {
                const response = await fetch('/api/user-monitoring/status', {
                    headers: {
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                    credentials: 'same-origin',
                });

                if (response.ok) {
                    const statuses = await response.json();
                    setUsers(prevUsers => {
                        return prevUsers.map(user => {
                            const status = statuses.find(s => s.id === user.id);
                            if (status) {
                                return {
                                    ...user,
                                    is_online: status.is_online,
                                    inactive_minutes: status.inactive_minutes,
                                    last_activity: status.last_activity,
                                };
                            }
                            return user;
                        });
                    });
                }
            } catch (error) {
                console.error('Failed to refresh user statuses:', error);
            } finally {
                setIsRefreshing(false);
            }
        };

        // Initial refresh after 1 second
        const initialTimeout = setTimeout(refreshStatuses, 1000);

        // Then refresh every 30 seconds
        const interval = setInterval(refreshStatuses, 30000);

        return () => {
            clearTimeout(initialTimeout);
            clearInterval(interval);
        };
    }, []);

    const handleManualRefresh = async () => {
        setIsRefreshing(true);
        try {
            const response = await fetch('/api/user-monitoring/status', {
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                },
                credentials: 'same-origin',
            });

            if (response.ok) {
                const statuses = await response.json();
                setUsers(prevUsers => {
                    return prevUsers.map(user => {
                        const status = statuses.find(s => s.id === user.id);
                        if (status) {
                            return {
                                ...user,
                                is_online: status.is_online,
                                inactive_minutes: status.inactive_minutes,
                                last_activity: status.last_activity,
                            };
                        }
                        return user;
                    });
                });
            }
        } catch (error) {
            console.error('Failed to refresh user statuses:', error);
        } finally {
            setIsRefreshing(false);
        }
    };

    // Filter users based on search query, role, and status
    const filteredUsers = users.filter(user => {
        const matchesSearch = 
            user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email.toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesRole = roleFilter === 'all' || user.role === roleFilter;
        const matchesStatus = statusFilter === 'all' || 
            (statusFilter === 'online' && user.is_online) ||
            (statusFilter === 'offline' && !user.is_online);

        return matchesSearch && matchesRole && matchesStatus;
    });

    // Group users by role
    const groupedUsers = filteredUsers.reduce((acc, user) => {
        if (!acc[user.role]) {
            acc[user.role] = [];
        }
        acc[user.role].push(user);
        return acc;
    }, {});

    // Get unique roles for filter
    const uniqueRoles = ['all', ...new Set(users.map(u => u.role))];

    const getRoleBadgeColor = (role) => {
        switch (role) {
            case 'LGU_ADMIN':
                return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'LGU_TRAINER':
                return 'bg-teal-100 text-teal-800 border-teal-200';
            case 'STAFF':
                return 'bg-indigo-100 text-indigo-800 border-indigo-200';
            case 'PARTICIPANT':
                return 'bg-green-100 text-green-800 border-green-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const formatInactiveTime = (minutes) => {
        if (minutes < 60) {
            return `${minutes}m`;
        } else if (minutes < 1440) {
            const hours = Math.floor(minutes / 60);
            const mins = minutes % 60;
            return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
        } else {
            const days = Math.floor(minutes / 1440);
            const hours = Math.floor((minutes % 1440) / 60);
            return hours > 0 ? `${days}d ${hours}h` : `${days}d`;
        }
    };

    const getStatusBadge = (user) => {
        if (user.is_online) {
            return (
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Circle className="w-3 h-3 text-emerald-500 fill-emerald-500 drop-shadow-sm" />
                        <Circle className="w-3 h-3 text-emerald-500 fill-emerald-500 absolute top-0 left-0 animate-ping drop-shadow-sm" />
                    </div>
                    <span className="text-sm font-medium text-emerald-700">Online</span>
                </div>
            );
        } else {
            return (
                <div className="flex items-center gap-2">
                    <Circle className="w-3 h-3 text-slate-400 fill-slate-400 drop-shadow-sm" />
                    <span className="text-sm font-medium text-slate-600">
                        Offline
                        {user.inactive_minutes > 0 && (
                            <span className="ml-1 text-slate-500">
                                ({formatInactiveTime(user.inactive_minutes)})
                            </span>
                        )}
                    </span>
                </div>
            );
        }
    };

    const onlineCount = users.filter(u => u.is_online).length;
    const offlineCount = users.filter(u => !u.is_online).length;

    return (
        <div className="space-y-6 w-full overflow-x-hidden">
            {/* Hero Header - Certification style */}
            <div className="rounded-2xl bg-gradient-to-br from-slate-50 via-white to-emerald-50/40 border border-slate-200/80 shadow-xl p-8 md:p-10 transition-all duration-250">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-3 bg-emerald-100 rounded-xl shadow-md">
                                <Activity className="w-9 h-9 text-emerald-600" />
                            </div>
                            <h1 className="text-[30px] font-bold text-slate-900 tracking-tight">User Monitoring</h1>
                        </div>
                        <p className="text-sm text-slate-600 mt-1 max-w-xl leading-relaxed">
                            Monitor real-time online/offline status of all users.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-3 shrink-0">
                        <button
                            onClick={handleManualRefresh}
                            disabled={isRefreshing}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 hover:shadow-[0_0_0_4px_rgba(16,185,129,0.35)] hover:-translate-y-0.5 text-white rounded-xl font-semibold text-sm transition-all duration-250 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                        >
                            <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
                            {isRefreshing ? 'Refreshing...' : 'Refresh'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Stats cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-md transition-shadow hover:shadow-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-600">Total Users</p>
                            <p className="text-2xl font-bold text-slate-900 mt-1">{users.length}</p>
                        </div>
                        <div className="p-3 bg-slate-100 rounded-xl">
                            <Users className="w-6 h-6 text-slate-600" />
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-md transition-shadow hover:shadow-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-600">Online</p>
                            <p className="text-2xl font-bold text-emerald-600 mt-1">{onlineCount}</p>
                        </div>
                        <div className="p-3 bg-emerald-100 rounded-xl">
                            <Circle className="w-6 h-6 text-emerald-600 fill-emerald-600" />
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-md transition-shadow hover:shadow-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-600">Offline</p>
                            <p className="text-2xl font-bold text-slate-600 mt-1">{offlineCount}</p>
                        </div>
                        <div className="p-3 bg-slate-100 rounded-xl">
                            <Circle className="w-6 h-6 text-slate-400 fill-slate-400" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-md">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by name or email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-shadow"
                        />
                    </div>
                    <div className="relative">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <select
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white appearance-none"
                        >
                            <option value="all">All Roles</option>
                            {uniqueRoles.filter(r => r !== 'all').map(role => (
                                <option key={role} value={role}>
                                    {users.find(u => u.role === role)?.role_display || role}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="relative">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white appearance-none"
                        >
                            <option value="all">All Status</option>
                            <option value="online">Online Only</option>
                            <option value="offline">Offline Only</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Users list */}
            <div className="space-y-6">
                {Object.keys(groupedUsers).length === 0 ? (
                    <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-md">
                        <Users className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                        <p className="text-slate-600 font-medium">No users found</p>
                        <p className="text-sm text-slate-500 mt-1">Try adjusting your filters</p>
                    </div>
                ) : (
                    Object.entries(groupedUsers).map(([role, roleUsers]) => (
                        <div key={role} className="bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden transition-shadow hover:shadow-lg">
                            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-1.5 bg-slate-200/80 rounded-lg">
                                            <Shield className="w-5 h-5 text-slate-600" />
                                        </div>
                                        <h3 className="text-lg font-semibold text-slate-900">
                                            {roleUsers[0]?.role_display || role}
                                        </h3>
                                        <span className="px-2.5 py-0.5 bg-slate-200 text-slate-700 rounded-full text-xs font-medium">
                                            {roleUsers.length}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-4 text-sm text-slate-600">
                                        <span className="flex items-center gap-1.5">
                                            <Circle className="w-3 h-3 text-emerald-500 fill-emerald-500" />
                                            {roleUsers.filter(u => u.is_online).length} online
                                        </span>
                                        <span className="flex items-center gap-1.5">
                                            <Circle className="w-3 h-3 text-slate-400 fill-slate-400" />
                                            {roleUsers.filter(u => !u.is_online).length} offline
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="divide-y divide-slate-200">
                                {roleUsers.map((user) => (
                                    <div
                                        key={user.id}
                                        className="px-6 py-4 hover:bg-slate-50 transition-colors"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4 flex-1 min-w-0">
                                                {/* Avatar */}
                                                <div className="flex-shrink-0">
                                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white font-semibold text-lg shadow-sm">
                                                        {user.name.charAt(0).toUpperCase()}
                                                    </div>
                                                </div>

                                                {/* User Info */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h4 className="text-base font-semibold text-slate-900 truncate">
                                                            {user.name}
                                                        </h4>
                                                        <span className={`px-2 py-0.5 rounded text-xs font-medium border ${getRoleBadgeColor(user.role)}`}>
                                                            {user.role_display}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-4 text-sm text-slate-600">
                                                        <div className="flex items-center gap-1.5">
                                                            <Mail className="w-3.5 h-3.5" />
                                                            <span className="truncate">{user.email}</span>
                                                        </div>
                                                        {user.last_activity && (
                                                            <div className="flex items-center gap-1.5">
                                                                <Clock className="w-3.5 h-3.5" />
                                                                <span>
                                                                    Last active: {new Date(user.last_activity).toLocaleString()}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Status */}
                                            <div className="flex-shrink-0 ml-4">
                                                {getStatusBadge(user)}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
