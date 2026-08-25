<?php
$path = 'c:/Users/Rem/Downloads/Chapter-3-Scrum-Artifacts-AlertaraQC-updated.docx';
$zip = new ZipArchive();
$zip->open($path);
$xml = $zip->getFromName('word/document.xml');
$zip->close();
$xml = preg_replace('/<\/w:p>/', "\n", $xml);
$xml = preg_replace('/<\/w:tr>/', "\n[ROW]\n", $xml);
$xml = preg_replace('/<w:tbl[ >]/', "\n===TABLE===\n", $xml);
$text = strip_tags($xml);
$text = html_entity_decode($text, ENT_QUOTES | ENT_XML1, 'UTF-8');
$text = preg_replace('/[ \t]+/', ' ', $text);
file_put_contents('c:/Users/Rem/Documents/New folder/DisasterTraining/Documents/_tmp_ch3_extract.txt', $text);
echo "Extracted " . strlen($text) . " chars\n";
// grep-like highlights
foreach (['Resource', 'Allocation', 'INT-', 'Sprint 7', 'DFD', 'Done', 'In Progress', 'SMS', 'S7_', 'DOC-'] as $k) {
    if (stripos($text, $k) !== false) echo "Found: $k\n";
}
