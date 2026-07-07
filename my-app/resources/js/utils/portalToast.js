export function showPortalToast({ title, description, variant = 'success' }) {
    window.dispatchEvent(new CustomEvent('portal-toast', {
        detail: { title, description, variant },
    }));
}
