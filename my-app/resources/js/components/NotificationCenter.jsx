import React from 'react';
import { Bell, CheckCheck, Loader2, X } from 'lucide-react';
import { getPortalSessionHeaders } from '../utils/portalAuth';
import { dashboardIndex, notificationsApi } from '../utils/portalRoutes';

function formatRelativeTime(value) {
    if (!value) return '';
    const date = new Date(value);
    const now = new Date();
    const diffMs = now - date;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffHours < 24) return 'Today';
    if (diffHours < 48) return 'Yesterday';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function groupNotifications(notifications) {
    const groups = new Map();

    notifications.forEach((notification) => {
        const label = formatRelativeTime(notification.created_at);
        if (!groups.has(label)) {
            groups.set(label, []);
        }
        groups.get(label).push(notification);
    });

    return Array.from(groups.entries());
}

export function NotificationCenter({ user }) {
    const canUseNotifications = user && ['LGU_ADMIN', 'LGU_TRAINER', 'PARTICIPANT'].includes(user.role);
    const apiBase = React.useMemo(
        () => (canUseNotifications ? notificationsApi(user.role) : ''),
        [canUseNotifications, user?.role],
    );
    const [open, setOpen] = React.useState(false);
    const [loading, setLoading] = React.useState(false);
    const [notifications, setNotifications] = React.useState([]);
    const [unreadCount, setUnreadCount] = React.useState(0);
    const panelRef = React.useRef(null);

    const csrfToken = document.head.querySelector('meta[name="csrf-token"]')?.content || '';
    const requestHeaders = React.useMemo(() => ({
        Accept: 'application/json',
        ...getPortalSessionHeaders(),
    }), []);

    const fetchNotifications = React.useCallback(async () => {
        if (!canUseNotifications || !apiBase) return;

        setLoading(true);
        try {
            const response = await fetch(apiBase, { headers: requestHeaders });
            if (!response.ok) return;
            const data = await response.json();
            setNotifications(data.notifications || []);
            setUnreadCount(data.unread_count || 0);
        } finally {
            setLoading(false);
        }
    }, [apiBase, canUseNotifications, requestHeaders]);

    const fetchUnreadCount = React.useCallback(async () => {
        if (!canUseNotifications || !apiBase) return;

        try {
            const response = await fetch(`${apiBase}/unread-count`, { headers: requestHeaders });
            if (!response.ok) return;
            const data = await response.json();
            setUnreadCount(data.unread_count || 0);
        } catch {
            // ignore polling errors
        }
    }, [apiBase, canUseNotifications, requestHeaders]);

    React.useEffect(() => {
        if (!canUseNotifications) return undefined;

        fetchUnreadCount();
        const timer = window.setInterval(fetchUnreadCount, 30000);
        return () => window.clearInterval(timer);
    }, [canUseNotifications, fetchUnreadCount]);

    React.useEffect(() => {
        if (open) {
            fetchNotifications();
        }
    }, [open, fetchNotifications]);

    React.useEffect(() => {
        if (!open) return undefined;

        const previousOverflowX = document.body.style.overflowX;
        document.body.style.overflowX = 'hidden';

        return () => {
            document.body.style.overflowX = previousOverflowX;
        };
    }, [open]);

    React.useEffect(() => {
        if (!canUseNotifications) return undefined;

        const handleRefresh = () => {
            fetchUnreadCount();
            if (open) {
                fetchNotifications();
            }
        };
        window.addEventListener('portal-notifications-refresh', handleRefresh);
        return () => window.removeEventListener('portal-notifications-refresh', handleRefresh);
    }, [canUseNotifications, fetchUnreadCount, fetchNotifications, open]);

    const markRead = async (notification) => {
        if (!notification?.id || notification.read_at || !apiBase) return;

        await fetch(`${apiBase}/${notification.id}/read`, {
            method: 'POST',
            headers: {
                ...requestHeaders,
                'X-CSRF-TOKEN': csrfToken,
            },
        });

        setNotifications((prev) => prev.map((item) => (
            item.id === notification.id ? { ...item, read_at: new Date().toISOString(), is_unread: false } : item
        )));
        setUnreadCount((prev) => Math.max(0, prev - 1));
    };

    const markAllRead = async () => {
        if (!apiBase) return;

        await fetch(`${apiBase}/read-all`, {
            method: 'POST',
            headers: {
                ...requestHeaders,
                'X-CSRF-TOKEN': csrfToken,
            },
        });

        setNotifications((prev) => prev.map((item) => ({
            ...item,
            read_at: item.read_at || new Date().toISOString(),
            is_unread: false,
        })));
        setUnreadCount(0);
    };

    const handleNotificationClick = async (notification) => {
        await markRead(notification);
        if (notification.action_url) {
            window.location.href = notification.action_url;
        }
        setOpen(false);
    };

    if (!canUseNotifications) {
        return (
            <button
                type="button"
                className="relative p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors flex items-center justify-center"
                title="Notifications"
                disabled
            >
                <Bell className="w-4 h-4 drop-shadow-sm" />
            </button>
        );
    }

    const grouped = groupNotifications(notifications);

    return (
        <div className="relative shrink-0" ref={panelRef}>
            <button
                type="button"
                onClick={() => setOpen((prev) => !prev)}
                className={`relative p-1.5 rounded-md transition-colors flex items-center justify-center hover:bg-slate-100 ${
                    open ? 'text-green-500 hover:text-green-500' : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Notifications"
                aria-expanded={open}
                aria-haspopup="true"
            >
                <Bell className="w-4 h-4 drop-shadow-sm" />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 min-w-[0.9rem] h-[0.9rem] px-0.5 rounded-full bg-red-500 text-white text-[0.6rem] font-semibold flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {open && (
                <>
                    <div
                        className="fixed inset-0 z-40 overflow-hidden"
                        onClick={() => setOpen(false)}
                        aria-hidden="true"
                    />
                    <div className="absolute right-0 top-full mt-2 z-50 w-80 max-w-[calc(100vw-1rem)] max-h-96 overflow-y-auto overflow-x-hidden bg-white rounded-xl border border-slate-200 shadow-xl">
                        <div className="sticky top-0 z-10 flex items-center justify-between gap-2 px-4 py-3 border-b border-slate-200 bg-white">
                            <div className="min-w-0">
                                <h3 className="text-sm font-semibold text-slate-900 truncate">Notifications</h3>
                                <p className="text-xs text-slate-500">{unreadCount} unread</p>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                                {unreadCount > 0 && (
                                    <button
                                        type="button"
                                        onClick={markAllRead}
                                        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 whitespace-nowrap"
                                    >
                                        <CheckCheck className="w-3.5 h-3.5" />
                                        Mark all read
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={() => setOpen(false)}
                                    className="p-1 rounded-md text-slate-500 hover:bg-slate-100"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {loading ? (
                            <div className="flex items-center justify-center gap-2 px-4 py-8 text-sm text-slate-500">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Loading notifications…
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="px-4 py-8 text-sm text-slate-500 text-center">
                                No notifications yet.
                            </div>
                        ) : (
                            grouped.map(([label, items]) => (
                                <div key={label}>
                                    <div className="px-4 py-2 text-[0.65rem] font-semibold uppercase tracking-wide text-slate-400 bg-slate-50">
                                        {label}
                                    </div>
                                    <ul>
                                        {items.map((notification) => (
                                            <li key={notification.id}>
                                                <button
                                                    type="button"
                                                    onClick={() => handleNotificationClick(notification)}
                                                    className={`w-full text-left px-4 py-3 border-b border-slate-100 hover:bg-slate-50 transition-colors ${
                                                        notification.is_unread ? 'bg-emerald-50/40' : ''
                                                    }`}
                                                >
                                                    <div className="flex items-start gap-2 min-w-0">
                                                        <span className="text-base leading-none mt-0.5 shrink-0" aria-hidden>
                                                            {notification.icon || '🔔'}
                                                        </span>
                                                        <div className="min-w-0 flex-1">
                                                            <p className="text-sm font-medium text-slate-900 break-words">
                                                                {notification.title}
                                                            </p>
                                                            {notification.body && (
                                                                <p className="text-xs text-slate-600 mt-1 whitespace-pre-line line-clamp-3 break-words">
                                                                    {notification.body}
                                                                </p>
                                                            )}
                                                            {notification.action_label && (
                                                                <span className="inline-block mt-2 text-xs font-medium text-emerald-700 break-words">
                                                                    {notification.action_label}
                                                                </span>
                                                            )}
                                                        </div>
                                                        {notification.is_unread && (
                                                            <span className="mt-1 h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                                                        )}
                                                    </div>
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))
                        )}

                        <div className="sticky bottom-0 border-t border-slate-200 bg-slate-50 px-4 py-2 text-center no-print space-y-1">
                            {user?.role === 'PARTICIPANT' && (
                                <a
                                    href={`${dashboardIndex(user.role)}#activity-feed`}
                                    className="block text-xs font-medium text-emerald-700 hover:text-emerald-800"
                                >
                                    View activity on dashboard
                                </a>
                            )}
                            <a href="/profile#notification-preferences" className="block text-xs font-medium text-slate-600 hover:text-slate-800">
                                Manage notification preferences
                            </a>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
