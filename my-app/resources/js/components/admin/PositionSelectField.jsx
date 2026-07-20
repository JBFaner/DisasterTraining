import React from 'react';

/** Positions reserved for Trainer (and Admin) accounts — hidden when role is STAFF/VIEWER. */
export const TRAINER_ONLY_POSITIONS = ['Lead Trainer', 'Assistant Trainer'];

export function positionsForAccountRole(options = [], accountRole = '') {
    const list = [...(options || [])];
    if (accountRole === 'STAFF' || accountRole === 'VIEWER') {
        return list.filter((opt) => !TRAINER_ONLY_POSITIONS.includes(opt));
    }
    return list;
}

/**
 * Single primary position select with inline “add category”.
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
    const allowed = React.useMemo(
        () => positionsForAccountRole(options, accountRole),
        [options, accountRole],
    );

    const [extraChoices, setExtraChoices] = React.useState([]);
    const [value, setValue] = React.useState(() => {
        if (!defaultValue) return '';
        if (accountRole === 'STAFF' || accountRole === 'VIEWER') {
            if (TRAINER_ONLY_POSITIONS.includes(defaultValue)) return '';
        }
        return defaultValue;
    });

    const choices = React.useMemo(() => {
        const merged = [...new Set([...allowed, ...extraChoices].filter(Boolean))];
        const blocked =
            (accountRole === 'STAFF' || accountRole === 'VIEWER') &&
            TRAINER_ONLY_POSITIONS.includes(value);
        if (value && !merged.includes(value) && !blocked) {
            merged.push(value);
        }
        return merged;
    }, [allowed, extraChoices, value, accountRole]);

    React.useEffect(() => {
        if (!value) return;
        if ((accountRole === 'STAFF' || accountRole === 'VIEWER') && TRAINER_ONLY_POSITIONS.includes(value)) {
            setValue('');
        }
    }, [accountRole, value]);

    const handleChange = (e) => {
        const next = e.target.value;
        if (next === '__add__') {
            const custom = window.prompt('New position name (e.g. Evaluator, Safety Officer):');
            const trimmed = (custom || '').trim();
            if (!trimmed) return;
            if (
                (accountRole === 'STAFF' || accountRole === 'VIEWER') &&
                TRAINER_ONLY_POSITIONS.includes(trimmed)
            ) {
                window.alert('That position is only available for Trainer accounts.');
                return;
            }
            setExtraChoices((prev) => (prev.includes(trimmed) ? prev : [...prev, trimmed]));
            setValue(trimmed);
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
            </select>
            {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
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
        ? roles.filter((r) => r.name !== 'PARTICIPANT')
        : [
            { name: 'LGU_ADMIN', display_name: 'LGU Admin' },
            { name: 'LGU_TRAINER', display_name: 'LGU Trainer' },
            { name: 'STAFF', display_name: 'Staff' },
            { name: 'VIEWER', display_name: 'Viewer' },
        ]);

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
                    {roleOptions.map((roleOption) => (
                        <option key={roleOption.id ?? roleOption.name} value={roleOption.name}>
                            {roleOption.display_name ?? roleOption.name}
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
