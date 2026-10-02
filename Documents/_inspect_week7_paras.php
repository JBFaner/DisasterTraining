<?php
$src = 'c:/Users/Rem/Downloads/Week_7_IT_Audit_2_Hour_Online_Activity.docx';
$z = new ZipArchive();
$z->open($src);
$xml = $z->getFromName('word/document.xml');
$z->close();

preg_match_all('/<w:p\b[^>]*>[\s\S]*?<\/w:p>/', $xml, $paras);
foreach ([26, 27, 34, 44, 105, 116, 162] as $i) {
    echo "==== PARA $i ====\n";
    echo $paras[0][$i] . "\n\n";
}
