<?php

namespace App\Support;

class MaskedEmail
{
    /**
     * Mask an email address for display, revealing only the first few local characters and the domain.
     *
     * Examples: bro***@gmail.com, reym******@outlook.com
     */
    public static function mask(?string $email): string
    {
        if (! $email || ! str_contains($email, '@')) {
            return $email ?? '';
        }

        [$local, $domain] = explode('@', $email, 2);
        $length = strlen($local);

        if ($length === 0) {
            return '***@'.$domain;
        }

        $visibleCount = $length >= 4 ? 4 : min(3, $length);
        $hiddenCount = max(3, $length - $visibleCount);

        return substr($local, 0, $visibleCount).str_repeat('*', $hiddenCount).'@'.$domain;
    }
}
