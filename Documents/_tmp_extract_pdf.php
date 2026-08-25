<?php
$pdf = 'c:/Users/Rem/Downloads/CHAPTER 1 -5.pdf';
$raw = file_get_contents($pdf);
// Extract readable ASCII runs
preg_match_all('/[\x20-\x7E]{20,}/', $raw, $m);
$text = implode("\n", $m[0]);
$lines = explode("\n", $text);
$capture = false;
$out = [];
foreach ($lines as $line) {
    if (preg_match('/13\.4|5\.4|Closing Remarks/i', $line)) {
        $capture = true;
    }
    if ($capture) {
        $out[] = $line;
        if (count($out) > 80) {
            break;
        }
    }
}
if (empty($out)) {
    // fallback: search key chapter 5 sections
    foreach ($lines as $i => $line) {
        if (preg_match('/Key Takeaways|Project Achievements|Future Work|Closing Remarks|CHAPTER V|CHAPTER 5/i', $line)) {
            for ($j = max(0, $i - 2); $j < min(count($lines), $i + 15); $j++) {
                $out[] = $lines[$j];
            }
            $out[] = '---';
        }
    }
}
echo implode("\n", array_slice($out, 0, 120));
