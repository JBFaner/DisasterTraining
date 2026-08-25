<?php
$md = file_get_contents('C:/Users/Rem/Documents/New folder/DisasterTraining/docs/chapter-3-scrum-artifacts-alertara.md');

function section(string $md, string $start, string $end): string {
    $p1 = strpos($md, $start);
    $p2 = strpos($md, $end, $p1 + 1);
    if ($p1 === false) return '';
    if ($p2 === false) $p2 = strlen($md);
    return substr($md, $p1, $p2 - $p1);
}

function countPref(string $sec, string $re): int {
    $n = 0;
    foreach (preg_split("/\r\n|\n|\r/", $sec) as $line) {
        if (preg_match('/^\|\s*(' . $re . ')\s*\|/', $line)) $n++;
    }
    return $n;
}

$checks = [
    ['3.4.1', '## 3.4.1', '## 3.4.2', 'F\d+'],
    ['3.4.2 IS', '## 3.4.2', '## 3.4.3', 'IS-\d+'],
    ['STD', '## 3.4.3 Product Backlog for EIS Standards', '### 3.4.3.1', 'STD-\d+'],
    ['UI', '### 3.4.3.1', '## 3.4.4', 'UI-\d+'],
    ['INT', '## 3.4.4', '## 3.4.5', 'INT-\d+'],
    ['ASA', '### 3.4.5.1', '### 3.4.5.2', 'ASA-\d+'],
    ['EA', '### 3.4.5.2', '## 3.4.6', 'EA-\d+'],
    ['Sprint', '## 3.4.6', '## 3.4.7', 'S\d+_\d+'],
];

foreach ($checks as [$name, $a, $b, $re]) {
    $sec = section($md, $a, $b);
    echo "$name = " . countPref($sec, $re) . "\n";
}
$inc = section($md, '## 3.4.7', '## Appendix');
$incN = 0;
foreach (preg_split("/\r\n|\n|\r/", $inc) as $line) {
    if (preg_match('/^\|\s*Sprint\s+\d+/i', $line)) $incN++;
}
echo "INC = $incN\n";
