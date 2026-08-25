<?php
$z = new ZipArchive();
$z->open('c:/Users/Rem/Downloads/Chapter-3-Scrum-Artifacts-AlertaraQC-updated-PATCHED.docx');
$x = $z->getFromName('word/document.xml');
$z->close();

foreach (['24 delivered', '31 delivered', 'Table no. Increment', 'Realistic sprint tasks', '>32<', '>42<'] as $needle) {
    echo "$needle: " . (strpos($x, $needle) !== false ? 'found' : 'missing') . "\n";
}

$pos = strpos($x, 'Table no. Increment');
if ($pos !== false) {
    echo "\nSnippet:\n" . substr($x, $pos, 200) . "\n";
}

// find appendix increment row
if (preg_match('/Summary of deliveries.{0,400}?<w:t>([^<]+)<\/w:t>/s', $x, $m)) {
    echo "\nIncrement appendix value: " . $m[1] . "\n";
}
if (preg_match('/Realistic sprint tasks.{0,400}?<w:t>([^<]+)<\/w:t>/s', $x, $m)) {
    echo "Sprint backlog appendix value: " . $m[1] . "\n";
}
