/**
 * Read the current CSRF token from the page meta tag.
 */
import { getPortalSessionHeaders } from './portalAuth';

export function getCsrfToken() {
    return document.head.querySelector('meta[name="csrf-token"]')?.content || '';
}

/**
 * Update the CSRF meta tag after the server rotates the session token.
 */
export function setCsrfToken(token) {
    if (!token) {
        return;
    }

    const meta = document.head.querySelector('meta[name="csrf-token"]');
    if (meta) {
        meta.setAttribute('content', token);
    }
}

/**
 * Build CSRF headers for fetch requests (meta tag or XSRF-TOKEN cookie).
 */
export function getCsrfHeaders() {
    const token = getCsrfToken();
    if (token) {
        return { 'X-CSRF-TOKEN': token };
    }

    const match = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/);
    if (match?.[1]) {
        return { 'X-XSRF-TOKEN': decodeURIComponent(match[1]) };
    }

    return {};
}

/**
 * Ping the server to refresh session activity and return the latest CSRF token.
 */
export async function pingSessionActivity() {
    const response = await fetch('/session/activity', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            ...getPortalSessionHeaders(),
            ...getCsrfHeaders(),
        },
        credentials: 'same-origin',
    });

    if (!response.ok) {
        return { ok: false, status: response.status };
    }

    const data = await response.json().catch(() => ({}));
    if (data.csrf_token) {
        setCsrfToken(data.csrf_token);
    }

    return { ok: true, csrfToken: data.csrf_token || getCsrfToken() };
}

/**
 * JSON fetch with CSRF headers, session cookies, and optional session keep-alive.
 */
export async function csrfFetch(url, options = {}, { keepAlive = false } = {}) {
    if (keepAlive) {
        await pingSessionActivity();
    }

    const headers = {
        Accept: 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        ...getPortalSessionHeaders(),
        ...getCsrfHeaders(),
        ...(options.headers || {}),
    };

    let body = options.body;
    if (body && typeof body === 'object' && !(body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
        body = JSON.stringify({
            ...body,
            _token: getCsrfToken(),
        });
    }

    return fetch(url, {
        ...options,
        headers,
        body,
        credentials: 'same-origin',
    });
}
