<?php

/**
 * DFD Level 0, 1, 2 — Simulation Event Planning module.
 * Product flow: Approved Campaign → Exercise Plan → Use Template → Readiness → Publish → Monitoring
 * Run: php Documents/dfd-ai-scenario/../dfd-simulation-event/generate_simulation_event_dfd.php
 *      php Documents/dfd-simulation-event/generate_simulation_event_dfd.php
 */

$outDir = __DIR__;

function esc(string $s): string
{
    return htmlspecialchars($s, ENT_QUOTES | ENT_XML1, 'UTF-8');
}

function entity(string $id, string $label, int $x, int $y, int $w = 150, int $h = 64, string $color = '#fff7ed'): string
{
    return sprintf(
        '<mxCell id="%s" value="%s" style="rounded=0;whiteSpace=wrap;html=1;fillColor=%s;strokeColor=#334155;fontStyle=1;fontSize=10;" vertex="1" parent="1"><mxGeometry x="%d" y="%d" width="%d" height="%d" as="geometry"/></mxCell>',
        esc($id), esc($label), esc($color), $x, $y, $w, $h
    );
}

function process(string $id, string $label, int $x, int $y, int $size = 100): string
{
    return sprintf(
        '<mxCell id="%s" value="%s" style="ellipse;whiteSpace=wrap;html=1;aspect=fixed;fillColor=#dbeafe;strokeColor=#1d4ed8;fontStyle=1;fontSize=10;" vertex="1" parent="1"><mxGeometry x="%d" y="%d" width="%d" height="%d" as="geometry"/></mxCell>',
        esc($id), esc($label), $x, $y, $size, $size
    );
}

function store(string $id, string $label, int $x, int $y, int $w = 170, int $h = 52): string
{
    return sprintf(
        '<mxCell id="%s" value="%s" style="shape=partialRectangle;whiteSpace=wrap;html=1;leftSpacing=0;fillColor=#fef9c3;strokeColor=#854d0e;fontStyle=1;fontSize=10;align=left;spacingLeft=8;" vertex="1" parent="1"><mxGeometry x="%d" y="%d" width="%d" height="%d" as="geometry"/></mxCell>',
        esc($id), esc($label), $x, $y, $w, $h
    );
}

function flow(string $id, string $from, string $to, string $label): string
{
    $base = 'edgeStyle=orthogonalEdgeStyle;rounded=0;html=1;strokeWidth=1.5;strokeColor=#0f172a;endArrow=block;endFill=1;fontSize=9;';

    return sprintf(
        '<mxCell id="%s" value="%s" style="%s" edge="1" parent="1" source="%s" target="%s"><mxGeometry relative="1" as="geometry"/></mxCell>',
        esc($id), esc($label), $base, esc($from), esc($to)
    );
}

function title(string $text): string
{
    return sprintf(
        '<mxCell id="title" value="%s" style="rounded=0;whiteSpace=wrap;html=1;fillColor=#1e3a5f;fontColor=#ffffff;fontStyle=1;fontSize=13;strokeColor=#1e3a5f;" vertex="1" parent="1"><mxGeometry x="40" y="16" width="1220" height="40" as="geometry"/></mxCell>',
        esc($text)
    );
}

function note(string $text): string
{
    return sprintf(
        '<mxCell id="note" value="%s" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#f1f5f9;strokeColor=#64748b;fontSize=10;align=left;spacingLeft=8;" vertex="1" parent="1"><mxGeometry x="40" y="820" width="1220" height="36" as="geometry"/></mxCell>',
        esc($text)
    );
}

function wrapDiagram(string $id, string $name, string $body): string
{
    return sprintf(
        '<diagram id="%s" name="%s"><mxGraphModel dx="1300" dy="900" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="1300" pageHeight="880" math="0" shadow="0"><root><mxCell id="0"/><mxCell id="1" parent="0"/>%s</root></mxGraphModel></diagram>',
        esc($id), esc($name), $body
    );
}

// ─── LEVEL 0 ───────────────────────────────────────────────────────────────
$l0 = title('DFD Level 0 — Simulation Event Planning (Context)')
    .entity('e_admin', "Lead Trainer /\nLGU Admin", 60, 140)
    .entity('e_part', "Participant", 60, 500, 150, 64, '#eff6ff')
    .entity('e_camp', "Campaign Planning\n(Group 6 — approved)", 1080, 120, 170, 64, '#f0fdf4')
    .entity('e_cpsqc', "CPSQC Patrol\n(personnel)", 1080, 300, 170, 64, '#ecfeff')
    .entity('e_inv', "Resource &\nEquipment Inventory", 1080, 480, 170, 64, '#fef3c7')
    .process('p0', "0\nSimulation Event\nPlanning", 500, 300, 180)
    .flow('f1', 'e_admin', 'p0', 'Exercise plan, use template, publish, monitor')
    .flow('f2', 'p0', 'e_admin', 'Plan/event list, readiness, lifecycle UI')
    .flow('f3', 'e_camp', 'p0', 'Approved campaign request / schedule window')
    .flow('f4', 'p0', 'e_camp', 'Linked simulation batch / event status')
    .flow('f5', 'e_cpsqc', 'p0', 'Available trainers / assignment sync')
    .flow('f6', 'p0', 'e_cpsqc', 'Start/complete notifications, roster')
    .flow('f7', 'e_inv', 'p0', 'Equipment availability / condition')
    .flow('f8', 'p0', 'e_inv', 'Planned resource reservations')
    .flow('f9', 'e_part', 'p0', 'View published event / calendar (read)')
    .flow('f10', 'p0', 'e_part', 'Event schedule, venue, status')
    .note('Level 0: Campaign Planning & CPSQC are EXTERNAL. Registration/Attendance is a separate internal module — not decomposed here.');

// ─── LEVEL 1 ───────────────────────────────────────────────────────────────
$l1 = title('DFD Level 1 — Simulation Event Planning (Decomposition)')
    .entity('e_admin', "Lead Trainer /\nAdmin", 40, 120)
    .entity('e_camp', "Campaign Planning\n(approved)", 1080, 120, 160, 64, '#f0fdf4')
    .entity('e_cpsqc', "CPSQC Patrol", 1080, 380, 160, 64, '#ecfeff')
    .entity('e_inv', "Resource Inventory", 1080, 560, 160, 64, '#fef3c7')
    .process('p1', "1.0\nManage Exercise\nPlan (Template)", 260, 80, 105)
    .process('p2', "2.0\nCreate Event\nfrom Template", 260, 240, 105)
    .process('p3', "3.0\nAssign Personnel\n& Equipment", 260, 400, 105)
    .process('p4', "4.0\nValidate Readiness\n& Publish", 260, 560, 105)
    .process('p5', "5.0\nMonitor Lifecycle\n& Execution", 260, 700, 105)
    .store('d1', "D1\nExercise Plans\n(templates)", 560, 80)
    .store('d2', "D2\nSimulation Events", 560, 240)
    .store('d3', "D3\nPersonnel &\nResource Assignments", 560, 400)
    .store('d4', "D4\nReadiness &\nPublish State", 560, 560)
    .store('d5', "D5\nTimeline &\nExecution Progress", 560, 700)
    .flow('l1f1', 'e_admin', 'p1', 'Activities, timeline, eval objectives')
    .flow('l1f2', 'p1', 'd1', 'Save / publish / archive template')
    .flow('l1f3', 'd1', 'p1', 'Template detail for edit')
    .flow('l1f4', 'e_admin', 'p2', 'Use template + schedule')
    .flow('l1f5', 'e_camp', 'p2', 'Approved campaign link')
    .flow('l1f6', 'd1', 'p2', 'Published template snapshot')
    .flow('l1f7', 'p2', 'd2', 'New SimulationEvent')
    .flow('l1f8', 'p2', 'e_camp', 'Batch / event linkage')
    .flow('l1f9', 'e_admin', 'p3', 'Select trainers / equipment')
    .flow('l1f10', 'e_cpsqc', 'p3', 'Personnel pool availability')
    .flow('l1f11', 'e_inv', 'p3', 'Stock / condition')
    .flow('l1f12', 'd2', 'p3', 'Event context')
    .flow('l1f13', 'p3', 'd3', 'Assignments saved')
    .flow('l1f14', 'e_admin', 'p4', 'Publish when ready')
    .flow('l1f15', 'd2', 'p4', 'Draft event')
    .flow('l1f16', 'd3', 'p4', 'Assigned roster & resources')
    .flow('l1f17', 'p4', 'd4', 'Checklist + published flag')
    .flow('l1f18', 'p4', 'd2', 'Published status')
    .flow('l1f19', 'e_admin', 'p5', 'Start steps, complete, timeline')
    .flow('l1f20', 'd2', 'p5', 'Published event')
    .flow('l1f21', 'd4', 'p5', 'Ready-to-start gate')
    .flow('l1f22', 'p5', 'd5', 'Execution progress / timeline')
    .flow('l1f23', 'p5', 'e_cpsqc', 'Start / complete notify')
    .flow('l1f24', 'd5', 'p5', 'Current step state')
    .note('Level 1 flow: Exercise Plan → Use Template → Assign → Readiness & Publish → Monitoring. Deprecated Edit Simulation Event form is out of scope.');

// ─── LEVEL 2 — Process 4.0 Validate Readiness & Publish ───────────────────
$l2 = title('DFD Level 2 — Process 4.0 Validate Readiness & Publish (Detail)')
    .entity('e_admin', "Lead Trainer /\nAdmin", 40, 320)
    .entity('e_cpsqc', "CPSQC Patrol", 1080, 200, 150, 64, '#ecfeff')
    .entity('e_inv', "Resource Inventory", 1080, 480, 150, 64, '#fef3c7')
    .process('p41', "4.1\nBuild Readiness\nChecklist", 260, 100, 100)
    .process('p42', "4.2\nVerify Personnel\n& Equipment", 260, 280, 100)
    .process('p43', "4.3\nGate Ready-to-\nPublish / Start", 260, 460, 100)
    .process('p44', "4.4\nPublish Event &\nNotify", 260, 640, 100)
    .store('d2', "D2\nSimulation Events", 560, 120, 160, 44)
    .store('d3', "D3\nAssignments", 560, 280, 160, 44)
    .store('d4', "D4\nReadiness &\nPublish State", 560, 460, 160, 44)
    .store('d5', "D5\nTimeline\n(init on publish)", 560, 640, 160, 44)
    .flow('l2f1', 'e_admin', 'p41', 'Open planning / readiness UI')
    .flow('l2f2', 'd2', 'p41', 'Event + schedule fields')
    .flow('l2f3', 'p41', 'd4', 'Checklist items built')
    .flow('l2f4', 'd3', 'p42', 'Personnel / equipment rows')
    .flow('l2f5', 'e_cpsqc', 'p42', 'Live assignment availability')
    .flow('l2f6', 'e_inv', 'p42', 'Equipment ready flags')
    .flow('l2f7', 'p42', 'd4', 'Pass/fail checklist updates')
    .flow('l2f8', 'd4', 'p43', 'Checklist status')
    .flow('l2f9', 'p43', 'e_admin', 'Ready / blocked reasons')
    .flow('l2f10', 'e_admin', 'p44', 'Confirm publish')
    .flow('l2f11', 'p44', 'd2', 'status = published')
    .flow('l2f12', 'p44', 'd4', 'Published + ready-to-start')
    .flow('l2f13', 'p44', 'd5', 'Initialize execution progress')
    .flow('l2f14', 'p44', 'e_cpsqc', 'Optional pre-start roster sync')
    .note('Level 2 maps to SimulationEventLifecycleService::buildReadinessChecklist / isReadyToStart + publish path. Monitoring is Process 5.0.');

$pages = [
    ['id' => 'sim-l0', 'name' => 'Level 0 — Context', 'body' => $l0, 'file' => '12_DFD_Simulation_Event_L0.drawio'],
    ['id' => 'sim-l1', 'name' => 'Level 1 — Decomposition', 'body' => $l1, 'file' => '12_DFD_Simulation_Event_L1.drawio'],
    ['id' => 'sim-l2', 'name' => 'Level 2 — Process 4.0 Detail', 'body' => $l2, 'file' => '12_DFD_Simulation_Event_L2.drawio'],
];

$combined = '';
foreach ($pages as $p) {
    $xml = '<?xml version="1.0" encoding="UTF-8"?>'."\n"
        .'<mxfile host="app.diagrams.net" agent="Cursor" version="22.1.0" type="device">'
        .wrapDiagram($p['id'], $p['name'], $p['body'])
        .'</mxfile>';
    file_put_contents($outDir.'/'.$p['file'], $xml);
    $combined .= wrapDiagram($p['id'], $p['name'], $p['body']);
    echo "Wrote {$p['file']}\n";
}

$all = '<?xml version="1.0" encoding="UTF-8"?>'."\n"
    .'<mxfile host="app.diagrams.net" agent="Cursor" version="22.1.0" type="device">'
    .$combined
    .'</mxfile>';
file_put_contents($outDir.'/12_DFD_Simulation_Event_L0_L1_L2.drawio', $all);
echo "Wrote 12_DFD_Simulation_Event_L0_L1_L2.drawio (3 tabs)\n";
