import React, { useState, useEffect } from 'react';
import { Users, Circle, Clock, Mail, Shield, UserCircle, RefreshCw, Search, Filter } from 'lucide-react';

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
            case 'SUPER_ADMIN':
                return 'bg-purple-100 text-purple-800 border-purple-200';
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
                        <Circle className="w-3 h-3 text-emerald-500 fill-emerald-500" />
                        <Circle className="w-3 h-3 text-emerald-500 fill-emerald-500 absolute top-0 left-0 animate-ping" />
                    </div>
                    <span className="text-sm font-medium text-emerald-700">Online</span>
                </div>
            );
        } else {
            return (
                <div className="flex items-center gap-2">
                    <Circle className="w-3 h-3 text-slate-400 fill-slate-400" />
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
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">User Monitoring</h1>
                    <p className="text-sm text-slate-600 mt-1">
                        Monitor real-time online/offline status of all users
                    </p>
                </div>
                <button
                    onClick={handleManualRefresh}
                    disabled={isRefreshing}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium shadow-sm"
                >
                    <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                    {isRefreshing ? 'Refreshing...' : 'Refresh'}
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-600">Total Users</p>
                            <p className="text-2xl font-bold text-slate-900 mt-1">{users.length}</p>
                        </div>
                        <div className="p-3 bg-slate-100 rounded-lg">
                            <Users className="w-6 h-6 text-slate-600" />
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-600">Online</p>
                            <p className="text-2xl font-bold text-emerald-600 mt-1">{onlineCount}</p>
                        </div>
                        <div className="p-3 bg-emerald-100 rounded-lg">
                            <Circle className="w-6 h-6 text-emerald-600 fill-emerald-600" />
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-600">Offline</p>
                            <p className="text-2xl font-bold text-slate-600 mt-1">{offlineCount}</p>
                        </div>
                        <div className="p-3 bg-slate-100 rounded-lg">
                            <Circle className="w-6 h-6 text-slate-400 fill-slate-400" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by name or email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm"
                        />
                    </div>

                    {/* Role Filter */}
                    <div className="relative">
                        <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <select
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm appearance-none bg-white"
                        >
                            <option value="all">All Roles</option>
                            {uniqueRoles.filter(r => r !== 'all').map(role => (
                                <option key={role} value={role}>
                                    {users.find(u => u.role === role)?.role_display || role}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Status Filter */}
                    <div className="relative">
                        <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm appearance-none bg-white"
                        >
                            <option value="all">All Status</option>
                            <option value="online">Online Only</option>
                            <option value="offline">Offline Only</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Users List */}
            <div className="space-y-6">
                {Object.keys(groupedUsers).length === 0 ? (
                    <div className="bg-white rounded-lg border border-slate-200 p-12 text-center shadow-sm">
                        <Users className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                        <p className="text-slate-600 font-medium">No users found</p>
                        <p className="text-sm text-slate-500 mt-1">Try adjusting your filters</p>
                    </div>
                ) : (
                    Object.entries(groupedUsers).map(([role, roleUsers]) => (
                        <div key={role} className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Shield className="w-5 h-5 text-slate-600" />
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
