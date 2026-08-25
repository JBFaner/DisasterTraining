<?php
$z = new ZipArchive();
$z->open('c:/Users/Rem/Downloads/Chapter-3-Scrum-Artifacts-AlertaraQC-updated.docx');
$x = $z->getFromName('word/document.xml');
$z->close();
foreach (['Resource Allocation', 'Group 3', 'allocation API', 'Group3', 'RESOURCE_ALLOCATION'] as $k) {
    echo "$k: " . (stripos($x, $k) !== false ? 'YES' : 'no') . "\n";
}
