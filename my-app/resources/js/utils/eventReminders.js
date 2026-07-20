const STORAGE_KEY = 'participant_event_reminders';

function readAll() {
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : {};
    } catch {
        return {};
    }
}

function writeAll(data) {
    try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
        // ignore
    }
}

function eventStartDate(event) {
    if (!event?.event_date) return null;
    const date = new Date(event.event_date);
    if (Number.isNaN(date.getTime())) return null;

    const time = event.start_time || '09:00';
    const [hours, minutes] = time.split(':').map((part) => Number(part) || 0);
    date.setHours(hours, minutes, 0, 0);

    return date;
}

export function getEventReminders(eventId) {
    const all = readAll();
    return all[String(eventId)] || [];
}

export function scheduleEventReminder(event, hoursBefore, label) {
    const start = eventStartDate(event);
    if (!start) {
        return { ok: false, message: 'Event date is not set.' };
    }

    const fireAt = new Date(start.getTime() - hoursBefore * 60 * 60 * 1000);
    if (fireAt.getTime() <= Date.now()) {
        return { ok: false, message: 'That reminder time has already passed.' };
    }

    const all = readAll();
    const key = String(event.id);
    const existing = all[key] || [];
    const entry = {
        id: `${hoursBefore}h`,
        hours_before: hoursBefore,
        label: label || `Reminder ${hoursBefore}h before`,
        fire_at: fireAt.toISOString(),
        event_title: event.title,
    };

    all[key] = [...existing.filter((item) => item.id !== entry.id), entry];
    writeAll(all);

    return { ok: true, entry };
}

export async function requestReminderPermission() {
    if (typeof window === 'undefined' || !('Notification' in window)) {
        return false;
    }

    if (Notification.permission === 'granted') {
        return true;
    }

    if (Notification.permission === 'denied') {
        return false;
    }

    const result = await Notification.requestPermission();

    return result === 'granted';
}

export function processDueReminders() {
    if (typeof window === 'undefined') {
        return;
    }

    const all = readAll();
    const now = Date.now();
    let changed = false;

    Object.entries(all).forEach(([eventId, reminders]) => {
        const remaining = [];
        reminders.forEach((reminder) => {
            const fireAt = new Date(reminder.fire_at).getTime();
            if (fireAt <= now) {
                changed = true;
                if ('Notification' in window && Notification.permission === 'granted') {
                    new Notification(reminder.label, {
                        body: reminder.event_title || 'Simulation event reminder',
                        tag: `event-reminder-${eventId}-${reminder.id}`,
                    });
                }
            } else {
                remaining.push(reminder);
            }
        });
        all[eventId] = remaining;
    });

    if (changed) {
        writeAll(all);
    }
}
