<?php
$src = 'c:/Users/Rem/Downloads/Week_7_IT_Audit_2_Hour_Online_Activity.docx';
$z = new ZipArchive();
$z->open($src);
$xml = $z->getFromName('word/document.xml');
$z->close();

// Remove visible marker if present
if (strpos($xml, 'ANSWERED_WEEK7') !== false) {
    $xml = preg_replace('/<w:p[^>]*>\s*<w:r[^>]*>\s*<w:t[^>]*>ANSWERED_WEEK7<\/w:t>\s*<\/w:r>\s*<\/w:p>/', '', $xml);
    $work = sys_get_temp_dir() . '/week7_clean_' . uniqid();
    mkdir($work);
    $z2 = new ZipArchive();
    $z2->open($src);
    $z2->extractTo($work);
    $z2->close();
    file_put_contents($work . '/word/document.xml', $xml);
    @unlink($src);
    $z3 = new ZipArchive();
    $z3->open($src, ZipArchive::CREATE);
    $it = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($work, FilesystemIterator::SKIP_DOTS), RecursiveIteratorIterator::SELF_FIRST);
    foreach ($it as $file) {
        $path = $file->getPathname();
        $local = str_replace('\\', '/', substr($path, strlen($work) + 1));
        if ($file->isDir()) {
            $z3->addEmptyDir($local);
        } else {
            $z3->addFile($path, $local);
        }
    }
    $z3->close();
    echo "Removed ANSWERED_WEEK7 marker\n";
}

$text = preg_replace('/<\/w:p>/', "\n", $xml);
$text = strip_tags($text);
$text = html_entity_decode($text, ENT_QUOTES | ENT_XML1, 'UTF-8');
$text = preg_replace("/[ \t]+/", ' ', $text);
$text = preg_replace("/\n{3,}/", "\n\n", $text);
file_put_contents('c:/Users/Rem/Documents/New folder/DisasterTraining/Documents/_week7_filled_preview.txt', $text);
echo "Preview written, chars=" . strlen($text) . "\n";

// Essay word count: from title to ONLINE SUBMISSION
if (preg_match('/Essay Title:([\s\S]*?)ONLINE SUBMISSION/i', $text, $m)) {
    $essay = trim($m[1]);
    $words = preg_split('/\s+/', $essay);
    echo 'Essay words≈' . count($words) . "\n";
}

// Quick spot checks
$checks = [
    'Answer: Risk Assessment',
    'Answer: Fieldwork',
    'Technique: Walkthrough',
    'Technique: Data Analysis',
    'Name: Reymon S.A. Brogada',
    'Inspection / Testing',
    'The Importance of a Systematic IT Audit Process',
];
foreach ($checks as $c) {
    echo (strpos($text, $c) !== false ? 'PASS' : 'FAIL') . ": $c\n";
}
