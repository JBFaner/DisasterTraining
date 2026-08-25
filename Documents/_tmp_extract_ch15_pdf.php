<?php
$path = 'C:/Users/Rem/Downloads/CHAPTER 1 -5 (2).pdf';
if (!file_exists($path)) {
    fwrite(STDERR, "Missing: $path\n");
    exit(1);
}

// Try pdftotext if available, else php raw extract
$out = sys_get_temp_dir() . '/ch15_extract.txt';
$cmds = [
    'pdftotext -layout ' . escapeshellarg($path) . ' ' . escapeshellarg($out),
    'pdftotext ' . escapeshellarg($path) . ' ' . escapeshellarg($out),
];
$ok = false;
foreach ($cmds as $cmd) {
    exec($cmd . ' 2>&1', $o, $code);
    if ($code === 0 && file_exists($out) && filesize($out) > 100) {
        $ok = true;
        break;
    }
}
if (!$ok) {
    // Fallback: crude binary string scrape
    $bin = file_get_contents($path);
    preg_match_all('/\(([^)]{3,200})\)/', $bin, $m);
    $text = implode("\n", $m[1]);
    file_put_contents($out, $text);
    echo "FALLBACK_RAW\n";
}
$text = file_get_contents($out);
file_put_contents('C:/Users/Rem/Documents/New folder/DisasterTraining/Documents/_tmp_ch15_extract.txt', $text);
echo "CHARS=" . strlen($text) . "\n";
echo substr($text, 0, 8000);
