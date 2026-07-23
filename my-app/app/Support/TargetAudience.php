<?php

namespace App\Support;

/**
 * Canonical target-audience keys used by Training Module forms + validation.
 */
class TargetAudience
{
    public const KEYS = [
        'residents',
        'barangay_officials',
        'emergency_responders',
        'volunteers',
        'students',
        'employees',
        'community_leaders',
        'others',
    ];

    /**
     * Map display labels / aliases → canonical keys.
     *
     * @var array<string, string>
     */
    private const LABEL_TO_KEY = [
        'residents' => 'residents',
        'resident' => 'residents',
        'barangay officials' => 'barangay_officials',
        'barangay official' => 'barangay_officials',
        'barangay_officials' => 'barangay_officials',
        'emergency responders' => 'emergency_responders',
        'emergency responder' => 'emergency_responders',
        'emergency_responders' => 'emergency_responders',
        'community volunteers' => 'volunteers',
        'volunteers' => 'volunteers',
        'volunteer' => 'volunteers',
        'students' => 'students',
        'student' => 'students',
        'employees' => 'employees',
        'employee' => 'employees',
        'community leaders' => 'community_leaders',
        'community leader' => 'community_leaders',
        'community_leaders' => 'community_leaders',
        'others' => 'others',
        'other' => 'others',
    ];

    /**
     * @param  mixed  $values
     * @return list<string>
     */
    public static function normalize($values): array
    {
        if (! is_array($values)) {
            return [];
        }

        $normalized = [];

        foreach ($values as $value) {
            if (! is_string($value) && ! is_numeric($value)) {
                continue;
            }

            $raw = trim((string) $value);
            if ($raw === '') {
                continue;
            }

            $lookup = strtolower(str_replace(['_', '-'], ' ', $raw));
            $lookup = preg_replace('/\s+/', ' ', $lookup) ?? $lookup;

            if (isset(self::LABEL_TO_KEY[$lookup])) {
                $normalized[] = self::LABEL_TO_KEY[$lookup];
                continue;
            }

            // Already a canonical key (snake_case)
            $asKey = strtolower(str_replace([' ', '-'], '_', $raw));
            if (in_array($asKey, self::KEYS, true)) {
                $normalized[] = $asKey;
            }
        }

        return array_values(array_unique($normalized));
    }
}
