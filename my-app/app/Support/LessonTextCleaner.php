<?php

namespace App\Support;

class LessonTextCleaner
{
    public static function cleanHtml(?string $html): string
    {
        if ($html === null || trim($html) === '') {
            return '';
        }

        $normalized = str_replace(["\r\n", "\r"], "\n", $html);
        $normalized = preg_replace('/<br\s*\/?>/i', "\n", $normalized) ?? $normalized;
        $normalized = preg_replace('/<\/(p|div|li|h[1-6])>/i', "\n", $normalized) ?? $normalized;
        $normalized = strip_tags($normalized);
        $normalized = html_entity_decode($normalized, ENT_QUOTES | ENT_HTML5, 'UTF-8');

        return self::clean($normalized);
    }

    public static function clean(?string $text): string
    {
        if ($text === null || $text === '') {
            return '';
        }

        $text = Utf8Sanitizer::clean($text);
        $text = str_replace(["\r\n", "\r"], "\n", $text);
        $text = preg_replace('/[ \t\f\v]+/u', ' ', $text) ?? $text;

        $lines = explode("\n", $text);
        $cleanedLines = [];

        foreach ($lines as $line) {
            $line = trim($line);
            if ($line === '') {
                continue;
            }

            if (self::isLikelyPageNumberLine($line)) {
                continue;
            }

            $cleanedLines[] = $line;
        }

        $cleanedLines = self::removeRepeatedHeaderFooterLines($cleanedLines);

        $text = implode("\n", $cleanedLines);
        $text = preg_replace('/\n{3,}/', "\n\n", $text) ?? $text;

        return trim($text);
    }

    /**
     * @param  list<string>  $lines
     * @return list<string>
     */
    private static function removeRepeatedHeaderFooterLines(array $lines): array
    {
        if (count($lines) < 6) {
            return $lines;
        }

        $counts = [];
        foreach ($lines as $line) {
            $key = mb_strtolower($line);
            if (mb_strlen($key) < 4 || mb_strlen($key) > 120) {
                continue;
            }

            $counts[$key] = ($counts[$key] ?? 0) + 1;
        }

        $repeated = array_keys(array_filter($counts, fn (int $count) => $count >= 3));
        if ($repeated === []) {
            return $lines;
        }

        return array_values(array_filter(
            $lines,
            fn (string $line) => ! in_array(mb_strtolower($line), $repeated, true),
        ));
    }

    private static function isLikelyPageNumberLine(string $line): bool
    {
        if (preg_match('/^\d+$/', $line)) {
            return true;
        }

        if (preg_match('/^page\s+\d+(\s+of\s+\d+)?$/i', $line)) {
            return true;
        }

        if (preg_match('/^\d+\s*\/\s*\d+$/', $line)) {
            return true;
        }

        if (preg_match('/^-\s*\d+\s*-$/', $line)) {
            return true;
        }

        return false;
    }
}
