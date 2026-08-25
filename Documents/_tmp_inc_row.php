<?php
$path = 'c:/Users/Rem/Downloads/Chapter-3-Scrum-Artifacts-AlertaraQC-updated.docx';
$zip = new ZipArchive();
$zip->open($path);
$xml = $zip->getFromName('word/document.xml');
$zip->close();

$anchor = 'Docs handoff to Word Online';
$pos = strpos($xml, $anchor);
$trStart = strrpos(substr($xml, 0, $pos), '<w:tr');
$trEnd = strpos($xml, '</w:tr>', $pos) + 6;
$row = substr($xml, $trStart, $trEnd - $trStart);
file_put_contents(__DIR__.'/_sample_inc_row.xml', $row);
echo strlen($row)."\n";
