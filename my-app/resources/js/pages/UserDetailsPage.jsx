import React from 'react';
import { ArrowLeft, User, Mail, Shield, Key, Calendar, Clock, Lock, Activity, Eye, EyeOff } from 'lucide-react';

export function UserDetailsPage({ user, currentUser, canViewSecurity, recentLogins, recentActions, maskedUsbKeyHash }) {
    if (!user) {
        return (
            <div className="p-6">
                <div className="bg-white rounded-xl border border-slate-200 p-6">
                    <p className="text-slate-600">User not found.</p>
                </div>
            </div>
        );
    }

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const formatDateTime = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
        });
    };

    const getRoleDisplay = (role) => {
        switch (role) {
            case 'SUPER_ADMIN': return 'Super Admin';
            case 'LGU_ADMIN': return 'LGU Admin';
            case 'LGU_TRAINER': return 'Trainer';
            case 'STAFF': return 'Staff';
            default: return role;
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'active':
                return 'bg-emerald-50 text-emerald-700 border-emerald-200';
            case 'inactive':
            case 'disabled':
                return 'bg-rose-50 text-rose-700 border-rose-200';
            case 'pending_verification':
                return 'bg-amber-50 text-amber-700 border-amber-200';
            case 'archived':
                return 'bg-slate-50 text-slate-700 border-slate-200';
            default:
                return 'bg-slate-50 text-slate-700 border-slate-200';
        }
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case 'active': return 'Active';
            case 'inactive': return 'Inactive';
            case 'disabled': return 'Disabled';
            case 'pending_verification': return 'Pending Verification';
            case 'archived': return 'Archived';
            default: return status;
        }
    };

    return (
        <div className="space-y-6 w-full overflow-x-hidden">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <a
                        href="/admin/users"
                        className="inline-flex items-center justify-center rounded-md border border-slate-200 p-2 text-slate-700 hover:bg-slate-100 transition-colors"
                        title="Back to Users"
                    >
                        <ArrowLeft className="w-4 h-4" />
                    </a>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">User Details</h1>
                        <p className="text-sm text-slate-600 mt-1">View user information and activity</p>
                    </div>
                </div>
            </div>

            {/* Basic Information Section */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
                    <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                        <User className="w-5 h-5" />
                        Basic Information
                    </h2>
                </div>
                <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">
                                Full Name
                            </label>
                            <p className="text-sm text-slate-900 font-medium">{user.name || 'N/A'}</p>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">
                                Email Address
                            </label>
                            <p className="text-sm text-slate-900 font-medium flex items-center gap-2">
                                <Mail className="w-4 h-4 text-slate-400" />
                                {user.email || 'N/A'}
                            </p>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">
                                Role
                            </label>
                            <p className="text-sm text-slate-900 font-medium flex items-center gap-2">
                                <Shield className="w-4 h-4 text-slate-400" />
                                {getRoleDisplay(user.role)}
                            </p>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">
                                Account Status
                            </label>
                            <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${getStatusBadge(user.status)}`}>
                                {getStatusLabel(user.status)}
                            </span>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">
                                USB Key Status
                            </label>
                            <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                                user.usb_key_enabled 
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                    : 'bg-slate-50 text-slate-600 border-slate-200'
                            }`}>
                                <Key className="w-3 h-3" />
                                {user.usb_key_enabled ? 'Enabled' : 'Disabled'}
                            </span>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">
                                Created Date
                            </label>
                            <p className="text-sm text-slate-900 font-medium flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-slate-400" />
                                {formatDate(user.created_at)}
                            </p>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">
                                Last Login
                            </label>
                            <p className="text-sm text-slate-900 font-medium flex items-center gap-2">
                                <Clock className="w-4 h-4 text-slate-400" />
                                {user.last_login ? formatDateTime(user.last_login) : 'Never'}
                            </p>
                        </div>
                        {user.registered_at && (
                            <div>
                                <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">
                                    Registered At
                                </label>
                                <p className="text-sm text-slate-900 font-medium flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-slate-400" />
                                    {formatDateTime(user.registered_at)}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Security Section - Only visible if canViewSecurity is true */}
            {canViewSecurity && (
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
                        <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                            <Lock className="w-5 h-5" />
                            Security Information
                        </h2>
                    </div>
                    <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {user.usb_key_enabled && maskedUsbKeyHash && (
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">
                                        USB Key ID
                                    </label>
                                    <p className="text-sm text-slate-900 font-mono flex items-center gap-2">
                                        <Key className="w-4 h-4 text-slate-400" />
                                        {maskedUsbKeyHash}
                                    </p>
                                    <p className="text-xs text-slate-500 mt-1">Masked for security</p>
                                </div>
                            )}
                            {user.usb_key_enabled && (
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">
                                        USB Key Status
                                    </label>
                                    <p className="text-sm text-slate-900 font-medium">
                                        {user.usb_key_enabled ? 'Active' : 'Inactive'}
                                    </p>
                                </div>
                            )}
                            {!user.usb_key_enabled && (
                                <div className="md:col-span-2">
                                    <p className="text-sm text-slate-600">USB key is not enabled for this account.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Activity Overview Section */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
                    <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                        <Activity className="w-5 h-5" />
                        Activity Overview
                    </h2>
                </div>
                <div className="p-6">
                    {/* Recent Login History */}
                    <div className="mb-6">
                        <h3 className="text-sm font-semibold text-slate-900 mb-3">Recent Login History</h3>
                        {recentLogins && recentLogins.length > 0 ? (
                            <div className="space-y-2">
                                {recentLogins.map((login, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center justify-between p-3 bg-slate-50 rounded-md border border-slate-200"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                            <div>
                                                <p className="text-sm font-medium text-slate-900">{login.action}</p>
                                                <p className="text-xs text-slate-500">
                                                    {login.description || 'Login successful'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs font-medium text-slate-900">
                                                {formatDateTime(login.performed_at)}
                                            </p>
                                            {login.ip_address && (
                                                <p className="text-xs text-slate-500">IP: {login.ip_address}</p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-slate-600 py-3">No recent login history available.</p>
                        )}
                    </div>

                    {/* Recent System Actions */}
                    <div>
                        <h3 className="text-sm font-semibold text-slate-900 mb-3">Recent System Actions</h3>
                        {recentActions && recentActions.length > 0 ? (
                            <div className="space-y-2">
                                {recentActions.map((action, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center justify-between p-3 bg-slate-50 rounded-md border border-slate-200"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-2 h-2 rounded-full ${
                                                action.status === 'success' ? 'bg-emerald-500' :
                                                action.status === 'failed' ? 'bg-rose-500' :
                                                'bg-amber-500'
                                            }`}></div>
                                            <div>
                                                <p className="text-sm font-medium text-slate-900">
                                                    {action.action}
                                                </p>
                                                <p className="text-xs text-slate-500">
                                                    {action.module ? `${action.module} • ` : ''}
                                                    {action.description || 'No description'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs font-medium text-slate-900">
                                                {formatDateTime(action.performed_at)}
                                            </p>
                                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                                                action.status === 'success' ? 'bg-emerald-50 text-emerald-700' :
                                                action.status === 'failed' ? 'bg-rose-50 text-rose-700' :
                                                'bg-amber-50 text-amber-700'
                                            }`}>
                                                {action.status}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-slate-600 py-3">No recent system actions available.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
