<?php
$path = 'c:/Users/Rem/Downloads/Chapter-3-Scrum-Artifacts-AlertaraQC-updated-PATCHED.docx';
$zip = new ZipArchive();
$zip->open($path);
$xml = $zip->getFromName('word/document.xml');
$zip->close();
$xml = preg_replace('/<\/w:p>/', "\n", $xml);
$xml = preg_replace('/<\/w:tr>/', "\n[ROW]\n", $xml);
$text = html_entity_decode(strip_tags($xml), ENT_QUOTES|ENT_XML1, 'UTF-8');
foreach (['Per-module DFD', 'S7_7', 'Integration scope note', '31 delivered', '42', 'Resource Allocation', 'Group 3', 'SMS notifications', 'Groupmate diagram'] as $k) {
    echo ($k . ': ' . (stripos($text, $k) !== false ? 'YES' : 'NO') . "\n");
}
// show increment caption area
$i = stripos($text, 'Table no. Increment');
echo "\n" . substr($text, $i, 120) . "\n";
$i2 = stripos($text, 'Sprint Backlog');
echo substr($text, $i2, 200) . "\n";
