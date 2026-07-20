const STORAGE_KEY = 'participant_low_bandwidth_mode';

export function isLowBandwidthModeEnabled() {
    try {
        return window.localStorage.getItem(STORAGE_KEY) === '1';
    } catch {
        return false;
    }
}

export function setLowBandwidthMode(enabled) {
    try {
        window.localStorage.setItem(STORAGE_KEY, enabled ? '1' : '0');
    } catch {
        // ignore storage failures
    }
}

export function subscribeLowBandwidthMode(callback) {
    const handler = (event) => {
        if (event.key === STORAGE_KEY || event.key === null) {
            callback(isLowBandwidthModeEnabled());
        }
    };

    window.addEventListener('storage', handler);

    return () => window.removeEventListener('storage', handler);
}
