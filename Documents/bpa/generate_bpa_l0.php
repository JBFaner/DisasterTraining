<?php

/**
 * BPA Level 0 (whole process) + Level 1 (8 internal modules).
 * Run: php Documents/bpa/generate_bpa_l0.php
 */

$outDir = __DIR__;

function esc(string $s): string
{
    return htmlspecialchars($s, ENT_QUOTES | ENT_XML1, 'UTF-8');
}

function actor(string $id, string $label, int $x, int $y, int $w = 160, int $h = 56, string $color = '#fff7ed'): string
{
    return sprintf(
        '<mxCell id="%s" value="%s" style="rounded=0;whiteSpace=wrap;html=1;fillColor=%s;strokeColor=#334155;fontStyle=1;fontSize=10;" vertex="1" parent="1"><mxGeometry x="%d" y="%d" width="%d" height="%d" as="geometry"/></mxCell>',
        esc($id), esc($label), esc($color), $x, $y, $w, $h
    );
}

function processBox(string $id, string $label, int $x, int $y, int $w = 280, int $h = 160, int $font = 11): string
{
    return sprintf(
        '<mxCell id="%s" value="%s" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#dbeafe;strokeColor=#1d4ed8;fontStyle=1;fontSize=%d;arcSize=8;" vertex="1" parent="1"><mxGeometry x="%d" y="%d" width="%d" height="%d" as="geometry"/></mxCell>',
        esc($id), esc($label), $font, $x, $y, $w, $h
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

function title(string $text, int $w = 1320): string
{
    return sprintf(
        '<mxCell id="title" value="%s" style="rounded=0;whiteSpace=wrap;html=1;fillColor=#1e3a5f;fontColor=#ffffff;fontStyle=1;fontSize=13;strokeColor=#1e3a5f;" vertex="1" parent="1"><mxGeometry x="40" y="16" width="%d" height="44" as="geometry"/></mxCell>',
        esc($text), $w
    );
}

function note(string $text, int $y = 900, int $w = 1320): string
{
    return sprintf(
        '<mxCell id="note" value="%s" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#f1f5f9;strokeColor=#64748b;fontSize=10;align=left;spacingLeft=8;" vertex="1" parent="1"><mxGeometry x="40" y="%d" width="%d" height="48" as="geometry"/></mxCell>',
        esc($text), $y, $w
    );
}

function wrapDiagram(string $id, string $name, string $body, int $pageW = 1400, int $pageH = 980): string
{
    return sprintf(
        '<diagram id="%s" name="%s"><mxGraphModel dx="1600" dy="1100" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="%d" pageHeight="%d" math="0" shadow="0"><root><mxCell id="0"/><mxCell id="1" parent="0"/>%s</root></mxGraphModel></diagram>',
        esc($id), esc($name), $pageW, $pageH, $body
    );
}

// ─── LEVEL 0 ────────────────────────────────────────────────────────────────
$l0 = title('BPA Level 0 — Disaster Preparedness Drill & Simulation Conduct (TO-BE · AlertaraQC)', 1320)
    .actor('e_admin', "LGU Admin /\nLead Trainer", 60, 120)
    .actor('e_asst', "Assistant Trainer\n/ Staff", 60, 320, 160, 56, '#fff7ed')
    .actor('e_eval', "Evaluator", 60, 520, 160, 56, '#fef2f2')
    .actor('e_part', "Participant", 60, 720, 160, 56, '#eff6ff')
    .actor('e_camp', "Campaign Planning\n(Group 6)", 1100, 140, 170, 56, '#faf5ff')
    .actor('e_gem', "Google Gemini\nAPI", 1100, 360, 170, 56, '#ecfeff')
    .actor('e_cpsqc', "CPSQC Patrol\nSystem", 1100, 580, 170, 56, '#ecfeff')
    .actor('e_public', "Public Verifier\n(certificate QR)", 1100, 760, 170, 56, '#f0fdf4')
    .processBox(
        'p0',
        "0\nConduct Disaster Preparedness\nTraining & Simulation\n(Barangay San Agustin Pilot)\n\nTrigger: approved campaign / drill need\nOutput: attendance · evaluation · certificates",
        480,
        360,
        300,
        180
    )
    .flow('f1', 'e_admin', 'p0', 'Plan exercise, readiness, publish, inventory, hazards')
    .flow('f2', 'p0', 'e_admin', 'Event status, reports, issued certificates')
    .flow('f3', 'e_asst', 'p0', 'Roster / personnel support')
    .flow('f4', 'p0', 'e_asst', 'Assignment lists')
    .flow('f5', 'e_eval', 'p0', 'Mark attendance, score drills')
    .flow('f6', 'p0', 'e_eval', 'Rosters, score sheets')
    .flow('f7', 'e_part', 'p0', 'Register, train, join drill')
    .flow('f8', 'p0', 'e_part', 'Modules, schedule, scores, certificate')
    .flow('f9', 'e_camp', 'p0', 'Approve / reject campaign')
    .flow('f10', 'p0', 'e_camp', 'Campaign request / event status')
    .flow('f11', 'p0', 'e_gem', 'Generate quiz / scenario')
    .flow('f12', 'e_gem', 'p0', 'AI scenario drafts')
    .flow('f13', 'p0', 'e_cpsqc', 'Request patrol / notify start-complete')
    .flow('f14', 'e_cpsqc', 'p0', 'Availability / assignment')
    .flow('f15', 'e_public', 'p0', 'Verify certificate')
    .flow('f16', 'p0', 'e_public', 'Valid / revoked')
    .note('BPA Level 0 = one business process (TO-BE). Same actors as DFD L0. Group 6 + CPSQC are external. Resource Allocation (Group 3) is not connected. Detail steps: see 07_BPA tables + BPMN TO-BE.', 900, 1320);

// ─── LEVEL 1 — 8 internal modules (process handoffs, not data stores) ───────
$l1 = title('BPA Level 1 — Overall Process Decomposition (8 Internal Modules)', 1520)
    .actor('e_admin', "LGU Admin /\nLead Trainer", 40, 80, 140, 50)
    .actor('e_asst', "Assistant Trainer\n/ Staff", 40, 260, 140, 50)
    .actor('e_eval', "Evaluator", 40, 500, 140, 50, '#fef2f2')
    .actor('e_part', "Participant", 40, 760, 140, 50, '#eff6ff')
    .actor('e_camp', "Campaign Planning\n(Group 6)", 1420, 80, 140, 50, '#faf5ff')
    .actor('e_gem', "Google Gemini\nAPI", 1420, 360, 140, 50, '#ecfeff')
    .actor('e_cpsqc', "CPSQC Patrol", 1420, 560, 140, 50, '#ecfeff')
    .actor('e_public', "Public Verifier", 1420, 780, 140, 50, '#f0fdf4')
    .processBox('p1', "1.0\nTraining Module", 240, 70, 160, 70, 10)
    .processBox('p2', "2.0\nAI Scenario Training", 240, 210, 160, 70, 10)
    .processBox('p3', "3.0\nSimulation Event\nPlanning", 240, 360, 160, 80, 10)
    .processBox('p4', "4.0\nParticipant Reg.\n& Attendance", 240, 510, 160, 80, 10)
    .processBox('p5', "5.0\nResource &\nInventory", 240, 660, 160, 80, 10)
    .processBox('p6', "6.0\nEvaluation &\nScoring", 240, 820, 160, 80, 10)
    .processBox('p7', "7.0\nCertification\nIssuance", 520, 820, 160, 80, 10)
    .processBox('p8', "8.0\nHazard\nAssessment", 520, 70, 160, 80, 10)
    // Actor → process
    .flow('a1', 'e_admin', 'p1', 'Publish modules')
    .flow('a2', 'e_admin', 'p2', 'Generate / publish quizzes')
    .flow('a3', 'e_admin', 'p3', 'Plan / readiness / publish / monitor')
    .flow('a4', 'e_admin', 'p5', 'Catalog / assign equipment')
    .flow('a5', 'e_admin', 'p7', 'Issue / revoke certs')
    .flow('a6', 'e_admin', 'p8', 'Profiles / hazards / docs')
    .flow('a7', 'e_asst', 'p3', 'Personnel / roster support')
    .flow('a8', 'e_asst', 'p4', 'Roster updates')
    .flow('a9', 'e_eval', 'p4', 'Mark attendance')
    .flow('a10', 'e_eval', 'p6', 'Score drills')
    .flow('a11', 'e_part', 'p1', 'Study lessons')
    .flow('a12', 'e_part', 'p2', 'Take quizzes / scenarios')
    .flow('a13', 'e_part', 'p4', 'Register / check-in')
    .flow('a14', 'e_part', 'p6', 'View results')
    .flow('a15', 'e_part', 'p7', 'Receive certificate')
    // External partners
    .flow('x1', 'e_camp', 'p3', 'Approved campaign')
    .flow('x2', 'p3', 'e_camp', 'Request / event status')
    .flow('x3', 'e_camp', 'p4', 'Open registration window')
    .flow('x4', 'p2', 'e_gem', 'Generate quiz / scenario')
    .flow('x5', 'e_gem', 'p2', 'AI drafts')
    .flow('x6', 'p3', 'e_cpsqc', 'Patrol request / notify')
    .flow('x7', 'e_cpsqc', 'p3', 'Availability')
    .flow('x8', 'e_public', 'p7', 'Verify QR')
    .flow('x9', 'p7', 'e_public', 'Valid / revoked')
    // Process handoffs (BPA sequence — not DFD stores)
    .flow('h1', 'p8', 'p1', 'Hazard context for modules')
    .flow('h2', 'p8', 'p3', 'Hazard context for plans')
    .flow('h3', 'p8', 'p2', 'Hazard context for AI')
    .flow('h4', 'p1', 'p2', 'Lessons ready for quizzes')
    .flow('h5', 'p1', 'p7', 'Module completion')
    .flow('h6', 'p3', 'p4', 'Published event')
    .flow('h7', 'p3', 'p5', 'Event for equipment')
    .flow('h8', 'p5', 'p3', 'Equipment readiness')
    .flow('h9', 'p4', 'p6', 'Present roster')
    .flow('h10', 'p2', 'p6', 'Quiz / scenario scores')
    .flow('h11', 'p6', 'p7', 'Eligibility')
    .note('BPA Level 1 = Process 0 broken into 8 internal modules. Arrows between modules are handoffs (not data stores — those are in DFD L1). Group 6 + CPSQC remain EXTERNAL. Resource Allocation (Group 3) is not connected.', 980, 1520);

$pages = [
    ['id' => 'bpa-l0', 'name' => 'Level 0 — Process Context', 'body' => $l0, 'file' => '19_BPA_L0.drawio', 'w' => 1400, 'h' => 980],
    ['id' => 'bpa-l1', 'name' => 'Level 1 — Overall Decomposition', 'body' => $l1, 'file' => '19_BPA_L1.drawio', 'w' => 1600, 'h' => 1100],
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

file_put_contents(
    $outDir.'/19_BPA_L0_L1.drawio',
    '<?xml version="1.0" encoding="UTF-8"?>'."\n"
    .'<mxfile host="app.diagrams.net" agent="Cursor" version="22.1.0" type="device">'
    .$combined
    .'</mxfile>'
);
echo "Wrote 19_BPA_L0_L1.drawio (2 tabs)\n";
