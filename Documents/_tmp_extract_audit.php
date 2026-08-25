<?php
$docx = 'c:/Users/Rem/Downloads/IT_Audit_Performance_Activity.docx';
$zip = new ZipArchive();
$zip->open($docx);
$xml = $zip->getFromName('word/document.xml');
$zip->close();

// Paragraphs
preg_match_all('/<w:p[\s>][\s\S]*?<\/w:p>/', $xml, $paras);
$lines = [];
foreach ($paras[0] as $p) {
    preg_match_all('/<w:t[^>]*>([\s\S]*?)<\/w:t>/', $p, $t);
    $line = html_entity_decode(implode('', $t[1]), ENT_QUOTES | ENT_XML1, 'UTF-8');
    $lines[] = $line;
}
file_put_contents('c:/Users/Rem/Downloads/_it_audit_plain.txt', implode("\n", $lines));
echo "LINES=" . count($lines) . "\n";
echo implode("\n", $lines);
