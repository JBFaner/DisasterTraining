<?php
$src = 'c:/Users/Rem/Downloads/Week_7_IT_Audit_2_Hour_Online_Activity.docx';
$z = new ZipArchive();
$z->open($src);
$xml = $z->getFromName('word/document.xml');
$z->close();

preg_match_all('/<w:tbl>[\s\S]*?<\/w:tbl>/', $xml, $tbls);
// Table with Former employee accounts - likely table index related to activity 3
foreach ($tbls[0] as $ti => $t) {
    if (strpos($t, 'Former employee') !== false || strpos($t, 'Audit Technique') !== false) {
        echo "==== TABLE $ti ====\n";
        // print each cell text
        preg_match_all('/<w:tr[\s>][\s\S]*?<\/w:tr>/', $t, $trs);
        foreach ($trs[0] as $ri => $tr) {
            preg_match_all('/<w:tc[\s>][\s\S]*?<\/w:tc>/', $tr, $tcs);
            $cells = [];
            foreach ($tcs[0] as $tc) {
                $text = '';
                if (preg_match_all('/<w:t[^>]*>([\s\S]*?)<\/w:t>/', $tc, $tm)) {
                    $text = html_entity_decode(implode('', $tm[1]), ENT_QUOTES | ENT_XML1, 'UTF-8');
                }
                $cells[] = trim($text);
            }
            echo "R$ri: " . json_encode($cells) . "\n";
        }
    }
}
