<?php
$path = 'c:/Users/Rem/Downloads/Chapter-3-Scrum-Artifacts-AlertaraQC-updated.docx';
$zip = new ZipArchive();
$zip->open($path);
$xml = $zip->getFromName('word/document.xml');
$zip->close();

$anchor = 'Word thesis Scrum artifacts export';
$pos = strpos($xml, $anchor);
$trStart = strrpos(substr($xml, 0, $pos), '<w:tr');
$trEnd = strpos($xml, '</w:tr>', $pos) + 6;
$row = substr($xml, $trStart, $trEnd - $trStart);
file_put_contents(__DIR__.'/_sample_row.xml', $row);
echo "Row len: ".strlen($row)."\n";

function plain($s) {
    return trim(preg_replace('/\s+/', ' ', html_entity_decode(strip_tags(str_replace('</w:p>', ' ', $s)), ENT_QUOTES|ENT_XML1, 'UTF-8')));
}
echo plain($row)."\n";
