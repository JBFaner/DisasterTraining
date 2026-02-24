function normalizeEventDateStr(eventDate) {
    if (!eventDate) return null;
    if (typeof eventDate === 'string') return eventDate;
    if (typeof eventDate === 'object') return eventDate.date || eventDate.datetime || eventDate.value || null;
    return null;
}

function parseTimeParts(timeStr) {
    if (!timeStr || typeof timeStr !== 'string') return null;
    const m = timeStr.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
    if (!m) return null;
    const h = Number(m[1]);
    const min = Number(m[2]);
    if (!Number.isFinite(h) || !Number.isFinite(min)) return null;
    if (h < 0 || h > 23 || min < 0 || min > 59) return null;
    return { h, min };
}

export function getEventDateTime(eventDate, timeStr) {
    const dateStr = normalizeEventDateStr(eventDate);
    if (!dateStr) return null;
    const t = parseTimeParts(timeStr);
    if (!t) return null;

    // Important: `new Date('YYYY-MM-DD')` is parsed as UTC by JS (can shift day locally).
    // Use a local-time constructor when dateStr is date-only.
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        const [y, m, d] = dateStr.split('-').map((v) => Number(v));
        if (![y, m, d].every(Number.isFinite)) return null;
        const local = new Date(y, m - 1, d, t.h, t.min, 0, 0);
        return Number.isNaN(local.getTime()) ? null : local;
    }

    const dt = new Date(dateStr);
    if (Number.isNaN(dt.getTime())) return null;
    dt.setHours(t.h, t.min, 0, 0);
    return dt;
}

/**
 * Derive the correct "effective" simulation event status based on:
 * - stored status
 * - start/end datetimes (event_date + start_time/end_time)
 * - current time
 *
 * Rules:
 * - draft: no time logic applies
 * - published: if now > end -> ended; else remains published
 * - ongoing: if now >= end -> completed; else remains ongoing
 * - ended/completed/cancelled/archived: remain as-is
 */
export function deriveSimulationEventStatus(event, now = new Date()) {
    const stored = String(event?.status || '').toLowerCase();
    if (!stored) return 'draft';

    // Statuses that should not be time-derived.
    if (
        stored === 'draft' ||
        stored === 'cancelled' ||
        stored === 'archived' ||
        stored === 'ended' ||
        stored === 'completed'
    ) {
        return stored;
    }

    const startAt = getEventDateTime(event?.event_date, event?.start_time);
    const endAt = getEventDateTime(event?.event_date, event?.end_time);
    if (!startAt || !endAt || Number.isNaN(now?.getTime?.() ?? NaN)) return stored;

    // Invalid schedule (end before start): keep stored status.
    if (endAt.getTime() < startAt.getTime()) return stored;

    if (stored === 'published') {
        if (now.getTime() > endAt.getTime()) return 'ended';
        return 'published';
    }

    if (stored === 'ongoing') {
        if (now.getTime() >= endAt.getTime()) return 'completed';
        return 'ongoing';
    }

    return stored;
}

export function getSimulationEventWindow(event) {
    return {
        startAt: getEventDateTime(event?.event_date, event?.start_time),
        endAt: getEventDateTime(event?.event_date, event?.end_time),
    };
}

