<?php
$z = new ZipArchive();
$z->open('C:/Users/Rem/Downloads/IT_Audit_Performance_Activity.docx');
$xml = $z->getFromName('word/document.xml');
$z->close();
preg_match_all('/<w:tbl>[\s\S]*?<\/w:tbl>/', $xml, $m);
echo 'tables=' . count($m[0]) . PHP_EOL;
foreach ($m[0] as $i => $t) {
    $plain = preg_replace('/<[^>]+>/', ' ', $t);
    $plain = html_entity_decode(preg_replace('/\s+/', ' ', $plain), ENT_QUOTES | ENT_XML1, 'UTF-8');
    echo "=== TABLE $i ===\n" . substr($plain, 0, 800) . "\n\n";
}
echo "has User Access: " . (strpos($xml, 'User Access') !== false ? 'yes' : 'no') . PHP_EOL;
echo "has Ex-employees: " . (strpos($xml, 'Ex-employees') !== false ? 'yes' : 'no') . PHP_EOL;
