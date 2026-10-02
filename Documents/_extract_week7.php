<?php
$path = 'C:/Users/Rem/Downloads/Week_7_IT_Audit_2_Hour_Online_Activity.docx';
$z = new ZipArchive();
if ($z->open($path) !== true) {
    fwrite(STDERR, "Cannot open $path\n");
    exit(1);
}
$xml = $z->getFromName('word/document.xml');
$z->close();

$text = preg_replace('/<\/w:p>/', "\n", $xml);
$text = preg_replace('/<\/w:tr>/', "\n", $text);
$text = preg_replace('/<\/w:tc>/', " | ", $text);
$text = preg_replace('/<w:tab[^>]*\/>/', "\t", $text);
$text = strip_tags($text);
$text = html_entity_decode($text, ENT_QUOTES | ENT_XML1, 'UTF-8');
$text = preg_replace("/\n{3,}/", "\n\n", $text);

$out = __DIR__ . '/_week7_audit_extracted.txt';
file_put_contents($out, trim($text));
echo "Wrote " . strlen($text) . " chars to $out\n\n";
echo trim($text);
