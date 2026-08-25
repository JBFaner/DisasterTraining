<?php
/**
 * Patch Chapter-3-Scrum-Artifacts-AlertaraQC-updated.docx in Downloads:
 * - ADD new Scrum board / Increment / Sprint 7 rows (keep existing Done rows)
 * - ADD scope note: Resource Inventory is internal-only (no Resource Allocation Group 3)
 * - UPDATE integration-health remark to reflect Group 3 disconnected
 */
declare(strict_types=1);

$source = 'c:/Users/Rem/Downloads/Chapter-3-Scrum-Artifacts-AlertaraQC-updated.docx';
$backup = 'c:/Users/Rem/Documents/New folder/DisasterTraining/Documents/Chapter-3-Scrum-Artifacts-AlertaraQC-updated.BACKUP.docx';
$outDownloads = 'c:/Users/Rem/Downloads/Chapter-3-Scrum-Artifacts-AlertaraQC-updated-PATCHED.docx';
$outRepo = 'c:/Users/Rem/Documents/New folder/DisasterTraining/Documents/Chapter-3-Scrum-Artifacts-AlertaraQC-updated-PATCHED.docx';

if (!is_file($source)) {
    fwrite(STDERR, "Missing source: $source\n");
    exit(1);
}

if (!is_file($backup)) {
    copy($source, $backup);
}
$readFrom = (filesize($source) > 100000 && is_file($backup)) ? $source : $backup;
if (filesize($readFrom) < 100000 && is_file($backup)) {
    $readFrom = $backup;
}

function xmlText(string $s): string
{
    return htmlspecialchars($s, ENT_QUOTES | ENT_XML1, 'UTF-8');
}

function cell(string $text, int $width): string
{
    $border = '<w:tcBorders>'
        . '<w:top w:val="single" w:sz="4" w:space="0" w:color="94A3B8"/>'
        . '<w:left w:val="single" w:sz="4" w:space="0" w:color="94A3B8"/>'
        . '<w:bottom w:val="single" w:sz="4" w:space="0" w:color="94A3B8"/>'
        . '<w:right w:val="single" w:sz="4" w:space="0" w:color="94A3B8"/>'
        . '</w:tcBorders>';

    if ($text === '') {
        $p = '<w:p w:rsidR="00952573" w:rsidRDefault="00952573"/>';
    } else {
        $p = '<w:p w:rsidR="00952573" w:rsidRDefault="00AF3671"><w:r>'
            . '<w:rPr><w:rFonts w:ascii="Calibri" w:eastAsia="Calibri" w:hAnsi="Calibri" w:cs="Calibri"/>'
            . '<w:sz w:val="14"/><w:szCs w:val="14"/></w:rPr>'
            . '<w:t>' . xmlText($text) . '</w:t></w:r></w:p>';
    }

    return '<w:tc><w:tcPr><w:tcW w:w="' . $width . '" w:type="dxa"/>' . $border . '</w:tcPr>' . $p . '</w:tc>';
}

function tableRow(array $cells, int $width): string
{
    $xml = '<w:tr w:rsidR="00952573"><w:tblPrEx><w:tblCellMar>'
        . '<w:top w:w="0" w:type="dxa"/><w:bottom w:w="0" w:type="dxa"/>'
        . '</w:tblCellMar></w:tblPrEx>';
    foreach ($cells as $text) {
        $xml .= cell((string) $text, $width);
    }
    return $xml . '</w:tr>';
}

function scrumRow(string $todo, string $prog, string $done): string
{
    return tableRow([$todo, $prog, $done], 3000);
}

function incRow(string $sprint, string $feature, string $ref, string $remarks): string
{
    $dod = 'Code completed; tested; integrated with DB; documentation updated; PO accepted';
    return tableRow([$sprint, $feature, $ref, $dod, 'Done', $remarks], 1500);
}

function sprintRow(string $task, string $storyId, string $title, string $timeline, string $owner): string
{
    return tableRow([$task, $storyId, $title, 'PLANNING / DESIGN / CODE / DOCUMENTATION', $timeline, $owner], 1500);
}

function sprintHeaderRow(string $label): string
{
    return tableRow([$label, '', '', '', '', ''], 1500);
}

function scopeParagraph(string $text): string
{
    return '<w:p w:rsidR="00952573" w:rsidRDefault="00AF3671"><w:pPr><w:spacing w:after="80"/></w:pPr>'
        . '<w:r><w:rPr><w:rFonts w:ascii="Calibri" w:eastAsia="Calibri" w:hAnsi="Calibri" w:cs="Calibri"/>'
        . '<w:i/><w:sz w:val="14"/><w:szCs w:val="14"/></w:rPr>'
        . '<w:t>' . xmlText($text) . '</w:t></w:r></w:p>';
}

$zip = new ZipArchive();
if ($zip->open($readFrom) !== true) {
    fwrite(STDERR, "Cannot open docx: $readFrom\n");
    exit(1);
}

$xml = $zip->getFromName('word/document.xml');
$zip->close();
if ($xml === false || $xml === '') {
    fwrite(STDERR, "Missing document.xml\n");
    exit(1);
}
$originalXml = $xml;

$changes = [];

// --- Scrum board: add To Do / In Progress / new Done rows (keep existing 14 Done rows) ---
$scrumAnchor = scrumRow('', '', 'Word thesis Scrum artifacts export');
if (strpos($xml, $scrumAnchor) === false) {
    fwrite(STDERR, "Scrum anchor not found\n");
    exit(1);
}

$newScrumRows =
    scrumRow('SMS notifications (optional)', '', '') .
    scrumRow('External cert authority API', '', '') .
    scrumRow('Custom report builder', '', '') .
    scrumRow('Final WCAG / design-system pack', '', '') .
    scrumRow('', 'Groupmate diagram polish (ERD, Use Case, Sequence, Sprint chart)', '') .
    scrumRow('', '', 'Refined RBAC on production (Lead / Assistant / Evaluator)') .
    scrumRow('', '', 'Role access matrix verified on production') .
    scrumRow('', '', 'Per-module DFD L0–L2 (8 internal modules)') .
    scrumRow('', '', 'Overall DFD L0 + L1') .
    scrumRow('', '', 'Capstone diagram drafts (BPMN / IaC / MS / BPA / guidelines)') .
    scrumRow('', '', 'Week 4 IT Auditing risk case study (answered)') .
    scrumRow('', '', 'Resource & Equipment Inventory — internal only (no Resource Allocation Group 3 API)');

$xml = str_replace($scrumAnchor, $scrumAnchor . $newScrumRows, $xml, $count);
$changes[] = "Scrum board rows added: $count";

// Scope note under Scrum board table title
$scopeNote = scopeParagraph(
    'Integration scope note (2026-08-13): Active external partners are Group 6 (Campaign) and CPSQC (Patrol). '
    . 'Resource & Equipment Inventory and Budget Proposals are internal to AlertaraQC — '
    . 'Resource Allocation (Group 3) API is disabled / not connected.'
);
$scopeAnchor = 'Table no. 2 — Scrum Board (completed board for the pilot scope)';
if (strpos($xml, $scopeAnchor) !== false && strpos($xml, 'Integration scope note (2026-08-13)') === false) {
    $xml = str_replace($scopeAnchor, $scopeAnchor . $scopeNote, $xml, $count);
    $changes[] = "Scope note inserted: $count";
}

// --- Increment table: Sprint 7 deliveries ---
$incAnchor = incRow(
    'Sprint 6',
    'Docs handoff to Word Online',
    'EA-25',
    'Chapter 3 Scrum artifacts exported for thesis submission'
);
if (strpos($xml, $incAnchor) === false) {
    fwrite(STDERR, "Increment anchor not found\n");
    exit(1);
}

$newIncRows =
    incRow('Sprint 7', 'Per-module DFD L0–L2 (8 modules)', 'DOC-DFD-MOD, S7_7', 'Draw.io DFD packs under Documents/dfd-*') .
    incRow('Sprint 7', 'Overall system DFD L0 + L1', 'DOC-DFD-OVERALL, S7_8', 'Whole-system decomposition with shared stores D1–D10') .
    incRow('Sprint 7', 'Role access matrix on production', 'DOC-ROLE-PROD, IS-5, S7_10', 'Lead / Assistant / Evaluator probe verified on prod') .
    incRow('Sprint 7', 'Capstone diagram draft pack', 'DOC-BPMN, DOC-IAC, DOC-MS, DOC-BPA', 'BPMN, IaC, microservices, BPA drafts for defense') .
    incRow('Sprint 7', 'Week 4 IT Auditing risk case study', 'DOC-WEEK4, S7_9', 'Answered case study with tables for IT Auditing subject') .
    incRow('Sprint 7', 'Refined RBAC role model', 'F5, F7, F8', 'Lead Trainer, Assistant Trainer, Evaluator roles aligned to org practice') .
    incRow('Sprint 7', 'Inventory standalone scope documented', 'F113, F114', 'Internal inventory only — Resource Allocation (Group 3) not connected');

$xml = str_replace($incAnchor, $incAnchor . $newIncRows, $xml, $count);
$changes[] = "Increment rows added: $count";

// --- Sprint backlog: Sprint 7 section after S4_8 ---
$sprintAnchor = sprintRow('S4_8', 'F20', 'Print Training Modules', 'Week 7-8', 'Backend Dev');
if (strpos($xml, $sprintAnchor) === false) {
    fwrite(STDERR, "Sprint backlog anchor not found\n");
    exit(1);
}

$newSprintRows =
    sprintHeaderRow('SPRINT 7 — Defense Documentation & Remaining Integrations') .
    sprintRow('S7_1', 'DOC-BPMN', 'BPMN AS-IS / TO-BE + diagram guidelines', 'Week 13–14', 'Tech Writer / Lead') .
    sprintRow('S7_2', 'DOC-IAC', 'Infrastructure as Code narrative', 'Week 13–14', 'DevOps / Lead') .
    sprintRow('S7_3', 'DOC-MS', 'Microservices DFD + communication pattern', 'Week 13–14', 'Architect / Lead') .
    sprintRow('S7_4', 'INT-5', 'SMS notification integration', 'Week 13–14', 'Backend') .
    sprintRow('S7_5', 'INT-2', 'External certification authority API', 'Week 14', 'Backend, Integration') .
    sprintRow('S7_6', 'API-DOC', 'Partner / gateway API documentation', 'Week 14', 'Tech Writer') .
    sprintRow('S7_7', 'DOC-DFD-MOD', 'Per-module DFD L0–L2 (8 modules)', 'Week 14', 'Lead / Architect') .
    sprintRow('S7_8', 'DOC-DFD-OVERALL', 'Overall system DFD L0 + L1', 'Week 14', 'Lead / Architect') .
    sprintRow('S7_9', 'DOC-WEEK4', 'Week 4 IT Auditing risk case study', 'Week 14', 'Student') .
    sprintRow('S7_10', 'DOC-ROLE-PROD', 'Role access matrix prod verification', 'Week 14', 'Backend');

$xml = str_replace($sprintAnchor, $sprintAnchor . $newSprintRows, $xml, $count);
$changes[] = "Sprint 7 backlog rows added: $count";

// --- Text updates (counts + integration remark) ---
$replacements = [
    'Table no. Increment (24 delivered increments — all Done)' => 'Table no. Increment (31 delivered increments — all Done)',
    '24 (all Done)' => '31 (all Done)',
    '32' => '42', // careful - might replace too much
    'Group 6 + CPSQC status visible to admins' =>
        'Group 6 + CPSQC only; Resource Allocation (Group 3) not connected',
    'Table no. 2 — Scrum Board (completed board for the pilot scope)' =>
        'Table no. 2 — Scrum Board (updated 2026-08-13)',
];

foreach ([
    'Group 6 + CPSQC status visible to admins' => 'Group 6 + CPSQC only; Resource Allocation (Group 3) not connected',
    'Table no. 2 — Scrum Board (completed board for the pilot scope)' => 'Table no. 2 — Scrum Board (updated 2026-08-13)',
    'All cards in Done (San Agustin pilot)' => 'To Do / In Progress / Done aligned to prod (2026-08-13)',
] as $from => $to) {
    $xml = str_replace($from, $to, $xml, $c);
    $changes[] = substr($from, 0, 40) . "... → $c";
}

// Word may split captions across runs / proofErr — use targeted regex for counts
$xml = preg_replace(
    '/Table no\. Increment \(24 delivered/',
    'Table no. Increment (31 delivered',
    $xml,
    1,
    $cIncCap
);
$changes[] = "Increment caption 24→31: $cIncCap";

$xml = preg_replace(
    '/(<w:t>)24 \(all Done\)(<\/w:t>)/',
    '${1}31 (all Done)${2}',
    $xml,
    1,
    $cIncApp
);
$changes[] = "Appendix increment count 24→31: $cIncApp";

$xml = preg_replace(
    '/(Realistic sprint tasks[\s\S]{0,800}?<w:t>)32(<\/w:t>)/',
    '${1}42${2}',
    $xml,
    1,
    $cSpr
);
$changes[] = "Appendix sprint backlog 32→42: $cSpr";

if (!is_string($xml) || strlen($xml) < 1000) {
    fwrite(STDERR, "Patch failed: document.xml invalid after edits\n");
    exit(1);
}

if (stripos($xml, 'Resource Allocation') === false) {
    $changes[] = 'No Resource Allocation rows to remove (already absent)';
}

function writePatchedDocx(string $templateDocx, string $outPath, string $documentXml): void
{
    $in = new ZipArchive();
    if ($in->open($templateDocx) !== true) {
        throw new RuntimeException("Cannot open template: $templateDocx");
    }
    $out = new ZipArchive();
    if ($out->open($outPath, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== true) {
        throw new RuntimeException("Cannot create: $outPath");
    }
    for ($i = 0; $i < $in->numFiles; $i++) {
        $name = $in->getNameIndex($i);
        if ($name === 'word/document.xml') {
            $out->addFromString($name, $documentXml);
        } else {
            $out->addFromString($name, $in->getFromIndex($i));
        }
    }
    $in->close();
    $out->close();
}

writePatchedDocx($readFrom, $outRepo, $xml);
writePatchedDocx($readFrom, $outDownloads, $xml);

echo "Source read: $readFrom\n";
echo "Backup:      $backup\n";
echo "Patched:     $outDownloads\n";
echo "Copy:        $outRepo\n\n";
foreach ($changes as $line) {
    echo "- $line\n";
}
