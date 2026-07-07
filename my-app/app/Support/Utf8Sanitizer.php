<?php

namespace App\Support;

class Utf8Sanitizer
{
    /**
     * Normalize text so it is safe for json_encode and external API payloads.
     */
    public static function clean(?string $value): string
    {
        if ($value === null || $value === '') {
            return '';
        }

        $clean = $value;

        if (function_exists('mb_convert_encoding')) {
            $converted = @mb_convert_encoding($clean, 'UTF-8', 'UTF-8');
            if (is_string($converted)) {
                $clean = $converted;
            }
        }

        if (function_exists('iconv')) {
            $converted = @iconv('UTF-8', 'UTF-8//IGNORE', $clean);
            if (is_string($converted)) {
                $clean = $converted;
            }
        }

        $clean = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $clean) ?? '';

        return trim($clean);
    }

    /**
     * Recursively sanitize strings inside arrays for JSON encoding.
     *
     * @param  mixed  $value
     * @return mixed
     */
    public static function cleanArray(mixed $value): mixed
    {
        if (is_string($value)) {
            return self::clean($value);
        }

        if (! is_array($value)) {
            return $value;
        }

        $cleaned = [];
        foreach ($value as $key => $item) {
            $cleaned[$key] = self::cleanArray($item);
        }

        return $cleaned;
    }
}
