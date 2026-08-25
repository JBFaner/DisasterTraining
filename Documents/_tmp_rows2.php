<?php
$path = 'c:/Users/Rem/Downloads/Chapter-3-Scrum-Artifacts-AlertaraQC-updated.docx';
$zip = new ZipArchive();
$zip->open($path);
$xml = $zip->getFromName('word/document.xml');
$zip->close();
$pos = strpos($xml, 'S4_8');
$trStart = strrpos(substr($xml, 0, $pos), '<w:tr');
$trEnd = strpos($xml, '</w:tr>', $pos) + 6;
file_put_contents(__DIR__.'/_sample_sprint_row.xml', substr($xml, $trStart, $trEnd - $trStart));

$pos2 = strpos($xml, 'F120');
$trStart2 = strrpos(substr($xml, 0, $pos2), '<w:tr');
$trEnd2 = strpos($xml, '</w:tr>', $pos2) + 6;
file_put_contents(__DIR__.'/_sample_pb_row.xml', substr($xml, $trStart2, $trEnd2 - $trStart2));
echo "ok\n";
