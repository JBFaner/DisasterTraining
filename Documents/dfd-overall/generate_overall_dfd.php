<?php

/**
 * Overall DFD — Level 0 (whole system) + Level 1 (all internal modules).
 * Run: php Documents/dfd-overall/generate_overall_dfd.php
 */

$outDir = __DIR__;

function esc(string $s): string
{
    return htmlspecialchars($s, ENT_QUOTES | ENT_XML1, 'UTF-8');
}

function entity(string $id, string $label, int $x, int $y, int $w = 150, int $h = 56, string $color = '#fff7ed'): string
{
    return sprintf(
        '<mxCell id="%s" value="%s" style="rounded=0;whiteSpace=wrap;html=1;fillColor=%s;strokeColor=#334155;fontStyle=1;fontSize=10;" vertex="1" parent="1"><mxGeometry x="%d" y="%d" width="%d" height="%d" as="geometry"/></mxCell>',
        esc($id), esc($label), esc($color), $x, $y, $w, $h
    );
}

function process(string $id, string $label, int $x, int $y, int $size = 95): string
{
    return sprintf(
        '<mxCell id="%s" value="%s" style="ellipse;whiteSpace=wrap;html=1;aspect=fixed;fillColor=#dbeafe;strokeColor=#1d4ed8;fontStyle=1;fontSize=9;" vertex="1" parent="1"><mxGeometry x="%d" y="%d" width="%d" height="%d" as="geometry"/></mxCell>',
        esc($id), esc($label), $x, $y, $size, $size
    );
}

function store(string $id, string $label, int $x, int $y, int $w = 150, int $h = 40): string
{
    return sprintf(
        '<mxCell id="%s" value="%s" style="shape=partialRectangle;whiteSpace=wrap;html=1;leftSpacing=0;fillColor=#fef9c3;strokeColor=#854d0e;fontStyle=1;fontSize=9;align=left;spacingLeft=6;" vertex="1" parent="1"><mxGeometry x="%d" y="%d" width="%d" height="%d" as="geometry"/></mxCell>',
        esc($id), esc($label), $x, $y, $w, $h
    );
}

function flow(string $id, string $from, string $to, string $label): string
{
    $base = 'edgeStyle=orthogonalEdgeStyle;rounded=0;html=1;strokeWidth=1.2;strokeColor=#0f172a;endArrow=block;endFill=1;fontSize=8;';

    return sprintf(
        '<mxCell id="%s" value="%s" style="%s" edge="1" parent="1" source="%s" target="%s"><mxGeometry relative="1" as="geometry"/></mxCell>',
        esc($id), esc($label), $base, esc($from), esc($to)
    );
}

function title(string $text, int $w = 1520): string
{
    return sprintf(
        '<mxCell id="title" value="%s" style="rounded=0;whiteSpace=wrap;html=1;fillColor=#1e3a5f;fontColor=#ffffff;fontStyle=1;fontSize=13;strokeColor=#1e3a5f;" vertex="1" parent="1"><mxGeometry x="40" y="16" width="%d" height="44" as="geometry"/></mxCell>',
        esc($text), $w
    );
}

function note(string $text, int $y = 1040, int $w = 1520): string
{
    return sprintf(
        '<mxCell id="note" value="%s" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#f1f5f9;strokeColor=#64748b;fontSize=10;align=left;spacingLeft=8;" vertex="1" parent="1"><mxGeometry x="40" y="%d" width="%d" height="40" as="geometry"/></mxCell>',
        esc($text), $y, $w
    );
}

function wrapDiagram(string $id, string $name, string $body, int $pageW = 1600, int $pageH = 1100): string
{
    return sprintf(
        '<diagram id="%s" name="%s"><mxGraphModel dx="1600" dy="1100" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="%d" pageHeight="%d" math="0" shadow="0"><root><mxCell id="0"/><mxCell id="1" parent="0"/>%s</root></mxGraphModel></diagram>',
        esc($id), esc($name), $pageW, $pageH, $body
    );
}

// ─── LEVEL 0 — Whole system context ────────────────────────────────────────
$l0 = title('DFD Level 0 — Overall Context · AlertaraQC (Disaster Preparedness Training & Simulation)', 1320)
    .entity('e_admin', "LGU Admin /\nLead Trainer", 60, 120)
    .entity('e_asst', "Assistant Trainer\n/ Staff", 60, 320, 150, 56, '#fff7ed')
    .entity('e_eval', "Evaluator", 60, 520, 150, 56, '#fef2f2')
    .entity('e_part', "Participant", 60, 720, 150, 56, '#eff6ff')
    .entity('e_camp', "Campaign Planning\n(Group 6)", 1100, 140, 170, 56, '#faf5ff')
    .entity('e_gem', "Google Gemini\nAPI", 1100, 360, 170, 56, '#ecfeff')
    .entity('e_cpsqc', "CPSQC Patrol\nSystem", 1100, 580, 170, 56, '#ecfeff')
    .entity('e_public', "Public Verifier\n(certificate QR)", 1100, 760, 170, 56, '#f0fdf4')
    .process('p0', "0\nDisaster Preparedness\nTraining &\nSimulation System", 520, 340, 200)
    .flow('f1', 'e_admin', 'p0', 'Modules, plans, inventory, issue certs, hazards')
    .flow('f2', 'p0', 'e_admin', 'Dashboards, readiness, reports, analytics')
    .flow('f3', 'e_asst', 'p0', 'Roster / personnel updates')
    .flow('f4', 'p0', 'e_asst', 'Assignment lists')
    .flow('f5', 'e_eval', 'p0', 'Attendance marks, drill scores')
    .flow('f6', 'p0', 'e_eval', 'Rosters, score sheets, summaries')
    .flow('f7', 'e_part', 'p0', 'Register, learn, attempt quizzes, events')
    .flow('f8', 'p0', 'e_part', 'Content, schedules, scores, certificates')
    .flow('f9', 'e_camp', 'p0', 'Campaign request / open registration')
    .flow('f10', 'p0', 'e_camp', 'Approve/reject / linked event status')
    .flow('f11', 'p0', 'e_gem', 'Generation prompts')
    .flow('f12', 'e_gem', 'p0', 'Quiz / scenario drafts')
    .flow('f13', 'p0', 'e_cpsqc', 'Personnel request / start-complete notify')
    .flow('f14', 'e_cpsqc', 'p0', 'Availability / assignment sync')
    .flow('f15', 'e_public', 'p0', 'Verify token')
    .flow('f16', 'p0', 'e_public', 'Valid / revoked status')
    .note('Level 0 = whole platform as one process. Internal modules appear in Level 1. Campaign Planning & CPSQC are EXTERNAL (not our internal modules).', 900, 1320);

// ─── LEVEL 1 — All internal modules ────────────────────────────────────────
$l1 = title('DFD Level 1 — Overall Decomposition (Internal Modules)', 1520)
    // Humans left
    .entity('e_admin', "LGU Admin /\nLead Trainer", 40, 80, 140, 50)
    .entity('e_eval', "Evaluator", 40, 420, 140, 50, '#fef2f2')
    .entity('e_part', "Participant", 40, 760, 140, 50, '#eff6ff')
    // Externals right
    .entity('e_camp', "Campaign Planning\n(Group 6)", 1420, 80, 140, 50, '#faf5ff')
    .entity('e_gem', "Google Gemini\nAPI", 1420, 360, 140, 50, '#ecfeff')
    .entity('e_cpsqc', "CPSQC Patrol", 1420, 560, 140, 50, '#ecfeff')
    .entity('e_public', "Public Verifier", 1420, 780, 140, 50, '#f0fdf4')
    // Processes — two columns
    .process('p1', "1.0\nTraining\nModule", 240, 70)
    .process('p2', "2.0\nAI Scenario\nTraining", 240, 220)
    .process('p3', "3.0\nSimulation\nEvent Planning", 240, 370)
    .process('p4', "4.0\nParticipant Reg.\n& Attendance", 240, 520)
    .process('p5', "5.0\nResource &\nInventory", 240, 670)
    .process('p6', "6.0\nEvaluation &\nScoring", 240, 820)
    .process('p7', "7.0\nCertification\nIssuance", 520, 820)
    .process('p8', "8.0\nHazard\nAssessment", 520, 70)
    // Shared stores center-right
    .store('d1', "D1 Module Catalog\n& Lessons", 780, 70, 160, 42)
    .store('d2', "D2 AI Configs &\nGenerated Banks", 780, 160, 160, 42)
    .store('d3', "D3 Exercise Plans\n& Events", 780, 250, 160, 42)
    .store('d4', "D4 Campaign &\nEvent Registrations", 780, 340, 160, 42)
    .store('d5', "D5 Attendance\nRecords", 780, 430, 160, 42)
    .store('d6', "D6 Equipment\nCatalog & Assign", 780, 520, 160, 42)
    .store('d7', "D7 Evaluation\nResults & Scores", 780, 610, 160, 42)
    .store('d8', "D8 Certificates\n& Templates", 780, 700, 160, 42)
    .store('d9', "D9 Barangay\nHazard Profiles", 780, 790, 160, 42)
    .store('d10', "D10 Users &\nRoles (auth)", 780, 880, 160, 42)
    // Admin → modules (high level)
    .flow('a1', 'e_admin', 'p1', 'Publish modules')
    .flow('a2', 'e_admin', 'p2', 'Generate / publish quizzes')
    .flow('a3', 'e_admin', 'p3', 'Plan / publish / monitor')
    .flow('a4', 'e_admin', 'p5', 'Catalog / assign equipment')
    .flow('a5', 'e_admin', 'p7', 'Issue / revoke certs')
    .flow('a6', 'e_admin', 'p8', 'Profiles / hazards / docs')
    .flow('a7', 'e_eval', 'p4', 'Mark attendance')
    .flow('a8', 'e_eval', 'p6', 'Score drills')
    .flow('a9', 'e_part', 'p1', 'Study lessons')
    .flow('a10', 'e_part', 'p2', 'Take quizzes / scenarios')
    .flow('a11', 'e_part', 'p4', 'Register / check-in')
    .flow('a12', 'e_part', 'p6', 'View portfolio')
    .flow('a13', 'e_part', 'p7', 'View / email certificate')
    // Module ↔ store (key)
    .flow('s1', 'p1', 'd1', 'Modules / lessons')
    .flow('s2', 'd1', 'p2', 'Lesson content for prompts')
    .flow('s3', 'p2', 'd2', 'Banks / versions')
    .flow('s4', 'p2', 'e_gem', 'Prompts')
    .flow('s5', 'e_gem', 'p2', 'AI drafts')
    .flow('s6', 'p3', 'd3', 'Plans / events')
    .flow('s7', 'e_camp', 'p3', 'Approved campaign')
    .flow('s8', 'p3', 'e_cpsqc', 'Roster / notify')
    .flow('s9', 'e_cpsqc', 'p3', 'Availability')
    .flow('s10', 'p4', 'd4', 'Registrations')
    .flow('s11', 'e_camp', 'p4', 'Open campaign window')
    .flow('s12', 'd3', 'p4', 'Published events')
    .flow('s13', 'p4', 'd5', 'Attendance')
    .flow('s14', 'p5', 'd6', 'Stock / assignments')
    .flow('s15', 'd3', 'p5', 'Event for assign')
    .flow('s16', 'd6', 'p3', 'Equipment readiness')
    .flow('s17', 'p6', 'd7', 'Scores / results')
    .flow('s18', 'd2', 'p6', 'Quiz/scenario scores')
    .flow('s19', 'd5', 'p6', 'Present roster')
    .flow('s20', 'd7', 'p7', 'Eligibility')
    .flow('s21', 'p7', 'd8', 'Issued certificates')
    .flow('s22', 'e_public', 'p7', 'Verify QR')
    .flow('s23', 'p7', 'e_public', 'Valid/revoked')
    .flow('s24', 'p8', 'd9', 'Profiles / hazards')
    .flow('s25', 'd9', 'p1', 'Recommended communities')
    .flow('s26', 'd9', 'p3', 'Hazard context')
    .flow('s27', 'd9', 'p2', 'AI hazard context')
    .flow('s28', 'd1', 'p7', 'Module completion context')
    .flow('s29', 'd10', 'p1', 'Auth / roles')
    .flow('s30', 'e_admin', 'd10', 'Manage users/roles')
    .note('Level 1 = 8 internal modules. Campaign Planning & CPSQC remain EXTERNAL. Detail per module: see dfd-training-module … dfd-hazard-assessment (L0–L2).', 980, 1520);

$pages = [
    ['id' => 'ov-l0', 'name' => 'Level 0 — Overall Context', 'body' => $l0, 'file' => '18_DFD_Overall_L0.drawio', 'w' => 1400, 'h' => 980],
    ['id' => 'ov-l1', 'name' => 'Level 1 — All Modules', 'body' => $l1, 'file' => '18_DFD_Overall_L1.drawio', 'w' => 1600, 'h' => 1100],
];

$combined = '';
foreach ($pages as $p) {
    $xml = '<?xml version="1.0" encoding="UTF-8"?>'."\n"
        .'<mxfile host="app.diagrams.net" agent="Cursor" version="22.1.0" type="device">'
        .wrapDiagram($p['id'], $p['name'], $p['body'], $p['w'], $p['h'])
        .'</mxfile>';
    file_put_contents($outDir.'/'.$p['file'], $xml);
    $combined .= wrapDiagram($p['id'], $p['name'], $p['body'], $p['w'], $p['h']);
    echo "Wrote {$p['file']}\n";
}

$all = '<?xml version="1.0" encoding="UTF-8"?>'."\n"
    .'<mxfile host="app.diagrams.net" agent="Cursor" version="22.1.0" type="device">'
    .$combined
    .'</mxfile>';
file_put_contents($outDir.'/18_DFD_Overall_L0_L1.drawio', $all);
echo "Wrote 18_DFD_Overall_L0_L1.drawio (2 tabs)\n";
