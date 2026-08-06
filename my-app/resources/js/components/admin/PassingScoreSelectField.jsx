import React from 'react';
import Swal from 'sweetalert2';

const ADD_PASSING_SCORE_VALUE = '__add_passing_score__';

/** Preset passing scores for Lesson Quiz + Final AI Scenario. */
export const PASSING_SCORE_PRESETS = [50, 60, 70, 75, 80, 85, 90];

export const DEFAULT_PASSING_SCORE = 50;

export function formatPassingScoreLabel(score) {
    const value = Number(score);
    if (value === 50) {
        return '50% (Recommended)';
    }

    return `${value}%`;
}

/**
 * Dropdown for passing score with “+ Add category…” for custom percentages.
 */
export function PassingScoreSelectField({
    id = 'passing_score',
    value = DEFAULT_PASSING_SCORE,
    onChange,
    className = '',
    min = 1,
    max = 100,
    label = 'Passing Score (%)',
    hint = null,
}) {
    const [extraOptions, setExtraOptions] = React.useState([]);

    const options = React.useMemo(() => {
        const merged = [...PASSING_SCORE_PRESETS, ...extraOptions, Number(value)]
            .map((item) => Number(item))
            .filter((item) => Number.isFinite(item) && item >= min && item <= max);

        return [...new Set(merged)].sort((a, b) => a - b);
    }, [extraOptions, value, min, max]);

    const handleChange = async (event) => {
        const next = event.target.value;
        if (next !== ADD_PASSING_SCORE_VALUE) {
            onChange(Number(next));
            return;
        }

        const result = await Swal.fire({
            title: 'Add passing score',
            input: 'number',
            inputLabel: `Custom passing score (${min}–${max}%)`,
            inputPlaceholder: 'e.g. 70',
            inputAttributes: {
                min: String(min),
                max: String(max),
                step: '1',
            },
            showCancelButton: true,
            confirmButtonText: 'Add category',
            cancelButtonText: 'Cancel',
            confirmButtonColor: '#059669',
            inputValidator: (inputValue) => {
                const parsed = Number(inputValue);
                if (!Number.isFinite(parsed)) {
                    return 'Enter a valid number.';
                }
                if (parsed < min || parsed > max) {
                    return `Passing score must be between ${min} and ${max}.`;
                }
                if (!Number.isInteger(parsed)) {
                    return 'Use a whole number (no decimals).';
                }

                return null;
            },
        });

        if (!result.isConfirmed) {
            return;
        }

        const parsed = Number(result.value);
        if (!Number.isFinite(parsed)) {
            return;
        }

        setExtraOptions((prev) => (prev.includes(parsed) ? prev : [...prev, parsed]));
        onChange(parsed);
    };

    return (
        <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1" htmlFor={id}>
                {label}
            </label>
            <select
                id={id}
                className={className}
                value={String(Number(value) || DEFAULT_PASSING_SCORE)}
                onChange={handleChange}
            >
                {options.map((score) => (
                    <option key={score} value={score}>
                        {formatPassingScoreLabel(score)}
                    </option>
                ))}
                <option value={ADD_PASSING_SCORE_VALUE}>+ Add category…</option>
            </select>
            {hint && (
                <p className="text-[0.7rem] text-slate-500 mt-1">{hint}</p>
            )}
        </div>
    );
}
