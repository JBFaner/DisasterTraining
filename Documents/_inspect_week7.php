<?php
$src = 'c:/Users/Rem/Downloads/Week_7_IT_Audit_2_Hour_Online_Activity.docx';
$z = new ZipArchive();
if ($z->open($src) !== true) {
    fwrite(STDERR, "Cannot open\n");
    exit(1);
}
$xml = $z->getFromName('word/document.xml');
$z->close();

echo 'LEN=' . strlen($xml) . PHP_EOL;
echo 'tbl=' . preg_match_all('/<w:tbl>/', $xml) . PHP_EOL;
echo 'underscore_in_xml=' . preg_match_all('/_{5,}/', $xml) . PHP_EOL;

// Collect plain text of each paragraph that looks like a blank line or answer line
preg_match_all('/<w:p\b[^>]*>[\s\S]*?<\/w:p>/', $xml, $paras);
$interesting = 0;
foreach ($paras[0] as $i => $p) {
    $text = '';
    if (preg_match_all('/<w:t[^>]*>([\s\S]*?)<\/w:t>/', $p, $tm)) {
        $text = html_entity_decode(implode('', $tm[1]), ENT_QUOTES | ENT_XML1, 'UTF-8');
    }
    $text = trim(preg_replace('/\s+/', ' ', $text));
    if ($text === '') {
        continue;
    }
    if (preg_match('/Answer:|Technique:|Essay Title:|Name:|Section:|Date:|_{8,}|Recommendation |Major Risks|Expected Controls|Audit Objective/i', $text)
        || preg_match('/^\d+\.\s/', $text)
        || preg_match('/Former employee|Failed backups|Duplicate|Password policy/i', $text)
    ) {
        echo sprintf("[%03d] %s\n", $i, mb_substr($text, 0, 160));
        $interesting++;
        if ($interesting > 120) {
            break;
        }
    }
}

echo "\n--- TABLES ---\n";
preg_match_all('/<w:tbl>[\s\S]*?<\/w:tbl>/', $xml, $tbls);
foreach ($tbls[0] as $ti => $t) {
    $plain = '';
    if (preg_match_all('/<w:t[^>]*>([\s\S]*?)<\/w:t>/', $t, $tm)) {
        $plain = html_entity_decode(implode(' | ', $tm[1]), ENT_QUOTES | ENT_XML1, 'UTF-8');
    }
    echo "TABLE $ti: " . mb_substr(preg_replace('/\s+/', ' ', $plain), 0, 200) . "\n";
}
