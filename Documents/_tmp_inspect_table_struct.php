<?php
$z = new ZipArchive();
$z->open('C:/Users/Rem/Downloads/IT_Audit_Performance_Activity.docx');
$xml = $z->getFromName('word/document.xml');
$z->close();
preg_match_all('/<w:tbl>[\s\S]*?<\/w:tbl>/', $xml, $m);

// Dump structure of table 1 (checklist) - first 3 rows, cell texts
$t = $m[0][1];
preg_match_all('/<w:tr[\s>][\s\S]*?<\/w:tr>/', $t, $trs);
echo "Q1 rows=" . count($trs[0]) . PHP_EOL;
for ($i = 0; $i < min(3, count($trs[0])); $i++) {
    preg_match_all('/<w:tc[\s>]([\s\S]*?)<\/w:tc>/', $trs[0][$i], $tcs);
    echo "ROW $i cells=" . count($tcs[0]) . PHP_EOL;
    foreach ($tcs[1] as $ci => $inner) {
        preg_match_all('/<w:t[^>]*>([\s\S]*?)<\/w:t>/', $inner, $ft);
        $text = trim(html_entity_decode(implode('', $ft[1] ?? []), ENT_QUOTES | ENT_XML1, 'UTF-8'));
        $hasT = preg_match('/<w:t[^>]*>\S/', $inner) ? 'Y' : 'N';
        echo "  cell$ci hasNonWS=$hasT text=[" . substr($text, 0, 60) . "]\n";
        // show if only empty paragraphs
        if ($i === 1 && $ci <= 2) {
            echo "  RAW_SNIP: " . substr(preg_replace('/\s+/', ' ', $inner), 0, 200) . "\n";
        }
    }
}

echo "\n--- Q2 ---\n";
$t2 = $m[0][2];
preg_match_all('/<w:tr[\s>][\s\S]*?<\/w:tr>/', $t2, $trs2);
echo "Q2 rows=" . count($trs2[0]) . PHP_EOL;
for ($i = 0; $i < min(3, count($trs2[0])); $i++) {
    preg_match_all('/<w:tc[\s>]([\s\S]*?)<\/w:tc>/', $trs2[0][$i], $tcs);
    echo "ROW $i cells=" . count($tcs[0]) . PHP_EOL;
    foreach ($tcs[1] as $ci => $inner) {
        preg_match_all('/<w:t[^>]*>([\s\S]*?)<\/w:t>/', $inner, $ft);
        $text = trim(html_entity_decode(implode('', $ft[1] ?? []), ENT_QUOTES | ENT_XML1, 'UTF-8'));
        $hasT = preg_match('/<w:t[^>]*>\S/', $inner) ? 'Y' : 'N';
        echo "  cell$ci hasNonWS=$hasT text=[" . substr($text, 0, 60) . "]\n";
    }
}
