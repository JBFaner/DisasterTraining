const ADMIN_ROLES = ['LGU_ADMIN', 'LGU_TRAINER', 'STAFF', 'SUPER_ADMIN'];

/**
 * Resolve the guard-specific logout URL for the current portal session.
 */
export function getLogoutUrl(reason) {
    const root = document.getElementById('app');
    const guard = root?.getAttribute('data-auth-guard') || '';
    const role = root?.getAttribute('data-role') || '';

    let base = '/logout';

    if (guard === 'participant' || role === 'PARTICIPANT') {
        base = '/participant/logout';
    } else if (guard === 'admin' || ADMIN_ROLES.includes(role)) {
        base = '/admin/logout';
    }

    if (reason) {
        const separator = base.includes('?') ? '&' : '?';
        return `${base}${separator}reason=${encodeURIComponent(reason)}`;
    }

    return base;
}
