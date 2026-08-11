import React from 'react';

/** Positions reserved for Trainer (and Admin) accounts — hidden when role is STAFF/VIEWER. */
export const TRAINER_ONLY_POSITIONS = ['Lead Trainer', 'Assistant Trainer'];

/** Retired positions — keep out of UI lists (backend may still have old rows). */
export const HIDDEN_POSITIONS = ['Attendance Officer'];

/** Friendly labels for account_type / roles.name values. */
export const ACCOUNT_ROLE_LABELS = {
    LGU_ADMIN: 'Admin',
    LGU_TRAINER: 'Assistant Trainer',
    LEAD_TRAINER: 'Lead Trainer',
    EVALUATOR: 'Evaluator',
    STAFF: 'Staff',
    VIEWER: 'Viewer',
    PARTICIPANT: 'Participant',
    SUPER_ADMIN: 'Admin',
};

export function accountRoleLabel(roleName = '') {
    return ACCOUNT_ROLE_LABELS[roleName] || roleName;
}

export function positionsForAccountRole(options = [], accountRole = '') {
    const list = [...(options || [])].filter((opt) => !HIDDEN_POSITIONS.includes(opt));
    if (accountRole === 'STAFF' || accountRole === 'VIEWER' || accountRole === 'EVALUATOR') {
        return list.filter((opt) => !TRAINER_ONLY_POSITIONS.includes(opt));
    }
    return list;
}

function isSystemPosition(opt, baseOptions = []) {
    return (baseOptions || []).includes(opt) || TRAINER_ONLY_POSITIONS.includes(opt);
}

/**
 * Single primary position select with inline “add / remove” position.
 * Filters trainer-only titles when Account Role is STAFF or VIEWER.
 */
export function PositionSelectField({
    id = 'position',
    name = 'position',
    label = 'Position',
    options = [],
    defaultValue = '',
    accountRole = '',
    hint = 'Primary duty for exercise planning (e.g. Evaluator). Per-event assignments can differ.',
}) {
    const baseAllowed = React.useMemo(
        () => positionsForAccountRole(options, accountRole),
        [options, accountRole],
    );

    const [extraChoices, setExtraChoices] = React.useState([]);
    const [removedChoices, setRemovedChoices] = React.useState(() => [...HIDDEN_POSITIONS]);
    const [value, setValue] = React.useState(() => {
        if (!defaultValue || HIDDEN_POSITIONS.includes(defaultValue)) return '';
        if (accountRole === 'STAFF' || accountRole === 'VIEWER' || accountRole === 'EVALUATOR') {
            if (TRAINER_ONLY_POSITIONS.includes(defaultValue)) return '';
        }
        return defaultValue;
    });

    const choices = React.useMemo(() => {
        const merged = [...new Set([...baseAllowed, ...extraChoices].filter(Boolean))]
            .filter((opt) => !removedChoices.includes(opt) && !HIDDEN_POSITIONS.includes(opt));
        const blocked =
            (accountRole === 'STAFF' || accountRole === 'VIEWER' || accountRole === 'EVALUATOR') &&
            TRAINER_ONLY_POSITIONS.includes(value);
        if (value && !merged.includes(value) && !blocked && !HIDDEN_POSITIONS.includes(value)) {
            merged.push(value);
        }
        return merged;
    }, [baseAllowed, extraChoices, removedChoices, value, accountRole]);

    React.useEffect(() => {
        if (!value) return;
        if ((accountRole === 'STAFF' || accountRole === 'VIEWER' || accountRole === 'EVALUATOR') && TRAINER_ONLY_POSITIONS.includes(value)) {
            setValue('');
        }
        if (HIDDEN_POSITIONS.includes(value)) {
            setValue('');
        }
    }, [accountRole, value]);

    const canRemoveSelected = Boolean(value) && (
        extraChoices.includes(value) || !isSystemPosition(value, baseAllowed)
    );

    const handleChange = (e) => {
        const next = e.target.value;
        if (next === '__add__') {
            const custom = window.prompt('New position name (e.g. Evaluator, Safety Officer):');
            const trimmed = (custom || '').trim();
            if (!trimmed) return;
            if (HIDDEN_POSITIONS.includes(trimmed)) {
                window.alert('That position is no longer used.');
                return;
            }
            if (
                (accountRole === 'STAFF' || accountRole === 'VIEWER' || accountRole === 'EVALUATOR') &&
                TRAINER_ONLY_POSITIONS.includes(trimmed)
            ) {
                window.alert('That position is only available for Trainer accounts.');
                return;
            }
            setRemovedChoices((prev) => prev.filter((p) => p !== trimmed));
            setExtraChoices((prev) => (prev.includes(trimmed) ? prev : [...prev, trimmed]));
            setValue(trimmed);
            return;
        }
        if (next === '__remove__') {
            if (!value) {
                window.alert('Select a position first, then choose Remove.');
                return;
            }
            if (isSystemPosition(value, baseAllowed) && !extraChoices.includes(value)) {
                const confirmed = window.confirm(
                    `Hide “${value}” from this list? You can add it again later with + Add position.`,
                );
                if (!confirmed) return;
                setRemovedChoices((prev) => (prev.includes(value) ? prev : [...prev, value]));
                setValue('');
                return;
            }
            const confirmed = window.confirm(`Remove “${value}” from the position list?`);
            if (!confirmed) return;
            setExtraChoices((prev) => prev.filter((p) => p !== value));
            setRemovedChoices((prev) => (prev.includes(value) ? prev : [...prev, value]));
            setValue('');
            return;
        }
        setValue(next);
    };

    return (
        <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1" htmlFor={id}>
                {label}
            </label>
            <select
                id={id}
                name={name}
                value={value}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
            >
                <option value="">— None —</option>
                {choices.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                ))}
                <option value="__add__">+ Add position…</option>
                <option value="__remove__" disabled={!value}>
                    − Remove selected position…
                </option>
            </select>
            {hint ? (
                <p className="mt-1 text-xs text-slate-500">
                    {hint}
                    {canRemoveSelected ? ' Use “Remove selected position” to hide it from this list.' : ''}
                </p>
            ) : null}
        </div>
    );
}

/**
 * Linked Account Role + Position fields for create/edit user forms.
 */
export function AccountRoleAndPositionFields({
    roles = [],
    positionOptions = [],
    defaultRole = 'LGU_ADMIN',
    defaultPosition = '',
    roleSelectId = 'account_type',
    positionSelectId = 'position',
}) {
    const [accountRole, setAccountRole] = React.useState(defaultRole);
    const roleOptions = (roles && roles.length > 0
        ? roles.filter((r) => r.name !== 'PARTICIPANT' && r.name !== 'VIEWER')
        : [
            { name: 'LGU_ADMIN', display_name: 'Admin' },
            { name: 'LEAD_TRAINER', display_name: 'Lead Trainer' },
            { name: 'LGU_TRAINER', display_name: 'Assistant Trainer' },
            { name: 'EVALUATOR', display_name: 'Evaluator' },
            { name: 'STAFF', display_name: 'Staff' },
        ]);

    const sortedRoles = React.useMemo(() => {
        const order = ['LGU_ADMIN', 'LEAD_TRAINER', 'LGU_TRAINER', 'EVALUATOR', 'STAFF'];
        return [...roleOptions].sort((a, b) => {
            const ai = order.indexOf(a.name);
            const bi = order.indexOf(b.name);
            return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
        });
    }, [roleOptions]);

    return (
        <>
            <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1" htmlFor={roleSelectId}>
                    Account Role
                </label>
                <select
                    id={roleSelectId}
                    name="account_type"
                    value={accountRole}
                    onChange={(e) => setAccountRole(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                >
                    {sortedRoles.map((roleOption) => (
                        <option key={roleOption.id ?? roleOption.name} value={roleOption.name}>
                            {roleOption.display_name || accountRoleLabel(roleOption.name)}
                        </option>
                    ))}
                </select>
            </div>
            <PositionSelectField
                id={positionSelectId}
                name="position"
                options={positionOptions}
                defaultValue={defaultPosition}
                accountRole={accountRole}
            />
        </>
    );
}
