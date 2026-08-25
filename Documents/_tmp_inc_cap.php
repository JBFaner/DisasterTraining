<?php
$path = 'c:/Users/Rem/Downloads/Chapter-3-Scrum-Artifacts-AlertaraQC-updated.docx';
$zip = new ZipArchive();
$zip->open($path);
$xml = $zip->getFromName('word/document.xml');
$zip->close();

$pos = strpos($xml, 'Table no. Increment');
$before = substr($xml, max(0, $pos - 500), 500);
echo $before;
