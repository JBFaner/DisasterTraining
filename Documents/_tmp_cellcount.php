<?php
foreach (['_sample_sprint_row.xml', '_sample_pb_row.xml'] as $f) {
    $row = file_get_contents(__DIR__ . '/' . $f);
    preg_match_all('/<w:tc>/', $row, $m);
    echo "$f cells: " . count($m[0]) . "\n";
}
