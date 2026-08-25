<?php
$path = 'C:/Users/Rem/Downloads/IT_Audit_Performance_Activity.docx';
$z = new ZipArchive();
if ($z->open($path) !== true) {
    fwrite(STDERR, "Cannot open $path\n");
    exit(1);
}
$xml = $z->getFromName('word/document.xml');
$z->close();

// Strip tags to readable text while keeping paragraph breaks
$text = preg_replace('/<\/w:p>/', "\n", $xml);
$text = preg_replace('/<w:tab[^>]*\/>/', "\t", $text);
$text = strip_tags($text);
$text = html_entity_decode($text, ENT_QUOTES | ENT_XML1, 'UTF-8');
$text = preg_replace("/\n{3,}/", "\n\n", $text);

file_put_contents(__DIR__ . '/_tmp_it_audit_activity.txt', $text);
echo "Wrote " . strlen($text) . " chars\n";
echo $text;
