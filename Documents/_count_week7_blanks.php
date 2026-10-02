<?php
$z = new ZipArchive();
$z->open('c:/Users/Rem/Downloads/Week_7_IT_Audit_2_Hour_Online_Activity.docx');
$xml = $z->getFromName('word/document.xml');
$z->close();
preg_match_all('/<w:t[^>]*>([^<]*)<\/w:t>/', $xml, $m);
$long = 0;
$short16 = 0;
$short18 = 0;
foreach ($m[1] as $t) {
    $t = html_entity_decode($t, ENT_QUOTES | ENT_XML1, 'UTF-8');
    $trim = trim($t);
    if (preg_match('/^_{90,}$/', $trim)) {
        $long++;
    }
    if ($trim === str_repeat('_', 16)) {
        $short16++;
    }
    if (substr_count($t, str_repeat('_', 18)) > 0 && strpos($t, 'Major Risks') !== false) {
        echo "Major Risks line found\n";
    }
}
echo "long_blanks=$long short16=$short16\n";
// show lengths of underscore-only texts
foreach ($m[1] as $t) {
    $t = html_entity_decode($t, ENT_QUOTES | ENT_XML1, 'UTF-8');
    $trim = trim($t);
    if (preg_match('/^_+$/', $trim)) {
        echo 'u' . strlen($trim) . "\n";
    }
}
