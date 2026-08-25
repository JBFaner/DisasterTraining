<?php
$paths = [
    'c:/Users/Rem/Documents/Chapter-3-Scrum-Artifacts-AlertaraQC updated.docx',
    'c:/Users/Rem/Documents/New folder/DisasterTraining/Documents/Chapter-3-Scrum-Artifacts-AlertaraQC-updated-PATCHED.docx',
];
foreach ($paths as $p) {
    if (!is_file($p)) {
        echo "MISSING: $p\n";
        continue;
    }
    $z = new ZipArchive();
    $z->open($p);
    $x = $z->getFromName('word/document.xml');
    $z->close();
    echo "\n=== " . basename($p) . " (" . filesize($p) . " bytes) ===\n";
    preg_match_all('/Table no\.\s*[0-9]+[^<]*/', $x, $tables);
    foreach ($tables[0] as $t) {
        echo strip_tags(html_entity_decode($t)) . "\n";
    }
    foreach (['F' => 'F[0-9]+', 'IS' => 'IS-[0-9]+', 'UI' => 'UI-[0-9]+', 'INT' => 'INT-[0-9]+', 'ASA' => 'ASA-[0-9]+', 'EA' => 'EA-[0-9]+', 'Sprint' => 'S[0-9]+_[0-9]+'] as $label => $pat) {
        preg_match_all('/\b' . $pat . '\b/', $x, $m);
        echo "$label count: " . count($m[0]) . "\n";
    }
}
