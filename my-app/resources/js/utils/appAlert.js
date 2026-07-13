import { blurAllFocus } from './blurFocus';

let alertHandler = null;
let confirmHandler = null;
let choiceHandler = null;

export function registerAppAlert(handler) {
    alertHandler = handler;
}

export function registerAppConfirm(handler) {
    confirmHandler = handler;
}

export function registerAppChoice(handler) {
    choiceHandler = handler;
}

export function formatApiErrors(data, fallback = 'Something went wrong.') {
    if (Array.isArray(data?.errors) && data.errors.length > 0) {
        return data.errors.map((item) => `• ${item}`).join('\n');
    }

    return data?.message || fallback;
}

export function showAppAlert({ title, description, icon = 'warning' }) {
    blurAllFocus();
    if (alertHandler) {
        return alertHandler({ title, description, icon });
    }

    window.alert([title, description].filter(Boolean).join('\n\n'));
    return Promise.resolve();
}

export function showAppConfirm({
    title,
    description,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    confirmVariant = 'danger',
}) {
    blurAllFocus();
    if (confirmHandler) {
        return confirmHandler({ title, description, confirmLabel, cancelLabel, confirmVariant });
    }

    return Promise.resolve(window.confirm([title, description].filter(Boolean).join('\n\n')));
}

export function showAppChoice({
    title,
    description,
    icon = 'warning',
    buttons = [],
}) {
    blurAllFocus();
    if (choiceHandler) {
        return choiceHandler({ title, description, icon, buttons });
    }

    return Promise.resolve(null);
}
