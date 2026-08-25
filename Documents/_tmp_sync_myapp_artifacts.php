<?php
/**
 * Sync my-app/docs 3.4.* from resized chapter-3 (classmate-matched counts).
 */
declare(strict_types=1);

$src = 'C:/Users/Rem/Documents/New folder/DisasterTraining/docs/chapter-3-scrum-artifacts-alertara.md';
$outDir = 'C:/Users/Rem/Documents/New folder/DisasterTraining/my-app/docs';
$md = file_get_contents($src);

function between(string $md, string $start, string $end): string
{
    $p1 = strpos($md, $start);
    if ($p1 === false) {
        return '';
    }
    $p2 = $end === '' ? strlen($md) : strpos($md, $end, $p1 + strlen($start));
    if ($p2 === false) {
        $p2 = strlen($md);
    }
    return rtrim(substr($md, $p1, $p2 - $p1)) . "\n";
}

$files = [
    '3.4.1_Product_Backlog_User_Stories.md' => between($md, '## 3.4.1 Product Backlog', '## 3.4.2 Product Backlog for EIS Information Security'),
    '3.4.2_Product_Backlog_EIS_Information_Security.md' => between($md, '## 3.4.2 Product Backlog for EIS Information Security', '## 3.4.3 Product Backlog for EIS Standards'),
    '3.4.3_Product_Backlog_EIS_Standards_UI_UX.md' => between($md, '## 3.4.3 Product Backlog for EIS Standards', '## 3.4.4 Product Backlog for EIS Integration'),
    '3.4.4_Product_Backlog_EIS_Integration.md' => between($md, '## 3.4.4 Product Backlog for EIS Integration', '## 3.4.5 Product Backlog for Analytics'),
    '3.4.5_Product_Backlog_Analytics.md' => between($md, '## 3.4.5 Product Backlog for Analytics', '## 3.4.6 Sprint Backlog'),
    '3.4.6_Sprint_Backlog.md' => between($md, '## 3.4.6 Sprint Backlog', '## 3.4.7 Increment'),
    '3.4.7_Increment.md' => between($md, '## 3.4.7 Increment', '## Appendix'),
];

foreach ($files as $name => $body) {
    // Promote ## to # for standalone files
    $body = preg_replace('/^## /m', '# ', $body);
    $body = preg_replace('/^### /m', '## ', $body);
    file_put_contents($outDir . '/' . $name, $body);
    echo "WROTE $name (" . strlen($body) . " bytes)\n";
}

$overview = <<<'MD'
# 3.4 Scrum Artifacts

## Overview

Scrum artifacts for AlertaraQC (Barangay San Agustin pilot), sized to match the classmate CHAPTER 1–5 reference counts (content remains AlertaraQC-specific).

| Section | File | Count |
|---|---|---|
| 3.4.1 Product Backlog | `3.4.1_Product_Backlog_User_Stories.md` | 40 |
| 3.4.2 EIS Information Security | `3.4.2_Product_Backlog_EIS_Information_Security.md` | 10 |
| 3.4.3 EIS Standards + UI/UX | `3.4.3_Product_Backlog_EIS_Standards_UI_UX.md` | 6 + 12 |
| 3.4.4 EIS Integration | `3.4.4_Product_Backlog_EIS_Integration.md` | 8 |
| 3.4.5 Analytics (App + EIS) | `3.4.5_Product_Backlog_Analytics.md` | 8 + 6 |
| 3.4.6 Sprint Backlog | `3.4.6_Sprint_Backlog.md` | 25 + Burndown/Velocity/CFD |
| 3.4.7 Increment | `3.4.7_Increment.md` | 16 |

## Status Legend

| Symbol | Meaning |
|--------|---------|
| Done / Completed | Implemented and accepted for the San Agustin pilot |

MD;
file_put_contents($outDir . '/3.4_Scrum_Artifacts.md', $overview);
echo "WROTE 3.4_Scrum_Artifacts.md\n";

// Soft-update generate script header targets for future runs
$gen = $outDir . '/generate_realistic_scrum_artifacts.php';
if (is_file($gen)) {
    $g = file_get_contents($gen);
    $g = preg_replace(
        '/Target sizes \(thesis guide\):.*? \*\/\s*/s',
        "Target sizes (classmate CHAPTER 1-5 reference):\n"
        . " *   Product Backlog F*: 40\n"
        . " *   EIS Security IS-*: 10\n"
        . " *   EIS Standards STD-*: 6\n"
        . " *   EIS UI UI-*: 12\n"
        . " *   EIS Integration INT-*: 8\n"
        . " *   Application Analytics ASA-*: 8\n"
        . " *   EIS Analytics EA-*: 6\n"
        . " *   Sprint Backlog: 25 tasks (5×5)\n"
        . " *   Increment: 16 items\n"
        . " *   Charts: Burndown, Velocity, Cumulative Flow\n"
        . " */\n\n",
        $g,
        1
    );
    file_put_contents($gen, $g);
    echo "UPDATED generate_realistic header\n";
}
