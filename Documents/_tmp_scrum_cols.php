<?php
$path = 'c:/Users/Rem/Downloads/Chapter-3-Scrum-Artifacts-AlertaraQC-updated.docx';
$zip = new ZipArchive();
$zip->open($path);
$xml = $zip->getFromName('word/document.xml');
$zip->close();

// Find scrum board table (after "Table no. 2")
$start = strpos($xml, 'Table no. 2');
$tblStart = strpos($xml, '<w:tbl', $start);
$tblEnd = strpos($xml, '</w:tbl>', $tblStart) + 8;
$tbl = substr($xml, $tblStart, $tblEnd - $tblStart);

preg_match_all('/<w:tr[^>]*>.*?<\/w:tr>/s', $tbl, $rows);
echo "Scrum table rows: " . count($rows[0]) . "\n\n";

function cellText($tr, $idx) {
    preg_match_all('/<w:tc>.*?<\/w:tc>/s', $tr, $cells);
    if (!isset($cells[0][$idx])) return '';
    $c = $cells[0][$idx];
    return trim(preg_replace('/\s+/', ' ', html_entity_decode(strip_tags(str_replace('</w:p>', ' ', $c)), ENT_QUOTES|ENT_XML1, 'UTF-8')));
}

foreach ($rows[0] as $i => $tr) {
    $c0 = cellText($tr, 0);
    $c1 = cellText($tr, 1);
    $c2 = cellText($tr, 2);
    if ($i === 0) echo "HEADER: [$c0] | [$c1] | [$c2]\n";
    else echo "R$i: [$c0] | [$c1] | [$c2]\n";
}
