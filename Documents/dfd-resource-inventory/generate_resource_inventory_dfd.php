<?php

/**
 * DFD Level 0, 1, 2 — Resource & Equipment Inventory module.
 * Covers: catalog, event assign/return, movements, maintenance, budget requests.
 * Run: php Documents/dfd-resource-inventory/generate_resource_inventory_dfd.php
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
$l0 = title('DFD Level 0 — Resource & Equipment Inventory (Context)')
    .entity('e_admin', "Lead Trainer /\nLGU Admin", 60, 160)
    .entity('e_sim', "Simulation Event\nPlanning", 1080, 200, 170, 64, '#ecfeff')
    .entity('e_budget', "Budget / Procurement\n(approver)", 60, 480, 170, 64, '#fef3c7')
    .process('p0', "0\nResource &\nEquipment Inventory", 500, 300, 180)
    .flow('f1', 'e_admin', 'p0', 'CRUD catalog, assign, damage, maintenance')
    .flow('f2', 'p0', 'e_admin', 'Stock list, history, reports, export')
    .flow('f3', 'e_sim', 'p0', 'Event equipment request / planned items')
    .flow('f4', 'p0', 'e_sim', 'Availability, assignment status, condition')
    .flow('f5', 'e_budget', 'p0', 'Approve/reject budget proposal')
    .flow('f6', 'p0', 'e_budget', 'Inventory / budget proposal request')
    .note('Level 0: Lesson learning resources belong to Training Module — NOT this inventory. This module = physical equipment stock for simulation events.');

// ─── LEVEL 1 ───────────────────────────────────────────────────────────────
$l1 = title('DFD Level 1 — Resource & Equipment Inventory (Decomposition)')
    .entity('e_admin', "Lead Trainer /\nAdmin", 40, 100)
    .entity('e_sim', "Simulation Event\nPlanning", 1080, 280, 160, 64, '#ecfeff')
    .entity('e_budget', "Budget Approver", 1080, 620, 160, 64, '#fef3c7')
    .process('p1', "1.0\nManage Equipment\nCatalog", 260, 80, 105)
    .process('p2', "2.0\nAssign Equipment\nto Event", 260, 240, 105)
    .process('p3', "3.0\nTrack Usage &\nCondition", 260, 400, 105)
    .process('p4', "4.0\nReturn from\nEvent", 260, 560, 105)
    .process('p5', "5.0\nMaintenance &\nBudget Request", 260, 700, 105)
    .store('d1', "D1\nEquipment Catalog\n(Resources)", 560, 80)
    .store('d2', "D2\nEvent Assignments\n& Requests", 560, 240)
    .store('d3', "D3\nResource Movements\n(history)", 560, 400)
    .store('d4', "D4\nMaintenance Logs", 560, 560)
    .store('d5', "D5\nBudget Proposals", 560, 700)
    .flow('l1f1', 'e_admin', 'p1', 'Create / update / archive item')
    .flow('l1f2', 'p1', 'd1', 'Resource master data')
    .flow('l1f3', 'd1', 'p1', 'Catalog list / export')
    .flow('l1f4', 'e_admin', 'p2', 'Assign to event')
    .flow('l1f5', 'e_sim', 'p2', 'Equipment request / event id')
    .flow('l1f6', 'd1', 'p2', 'Available stock')
    .flow('l1f7', 'p2', 'd2', 'ResourceEventAssignment')
    .flow('l1f8', 'p2', 'd3', 'Assign movement')
    .flow('l1f9', 'p2', 'e_sim', 'Assigned qty / status')
    .flow('l1f10', 'e_admin', 'p3', 'Mark in-use / unused / damage')
    .flow('l1f11', 'd2', 'p3', 'Active assignment')
    .flow('l1f12', 'p3', 'd1', 'Condition / status update')
    .flow('l1f13', 'p3', 'd3', 'Usage / damage movement')
    .flow('l1f14', 'e_admin', 'p4', 'Return from event')
    .flow('l1f15', 'd2', 'p4', 'Open assignment')
    .flow('l1f16', 'p4', 'd2', 'Closed assignment')
    .flow('l1f17', 'p4', 'd1', 'Stock available again')
    .flow('l1f18', 'p4', 'd3', 'Return movement')
    .flow('l1f19', 'e_admin', 'p5', 'Schedule / complete maintenance')
    .flow('l1f20', 'e_admin', 'p5', 'Inventory budget request')
    .flow('l1f21', 'd1', 'p5', 'Item needing repair / purchase')
    .flow('l1f22', 'p5', 'd4', 'Maintenance log')
    .flow('l1f23', 'p5', 'd5', 'Budget proposal')
    .flow('l1f24', 'e_budget', 'p5', 'Approve / reject proposal')
    .flow('l1f25', 'p5', 'd1', 'Post-maintenance status')
    .note('Level 1: Catalog → Assign → Track usage → Return → Maintenance/Budget. Feeds Simulation Event readiness (equipment ready flags).');

// ─── LEVEL 2 — Process 2.0 Assign / Reserve to Event ───────────────────────
$l2 = title('DFD Level 2 — Process 2.0 Assign Equipment to Event (Detail)')
    .entity('e_admin', "Lead Trainer /\nAdmin", 40, 200)
    .entity('e_sim', "Simulation Event\nPlanning", 1080, 360, 150, 64, '#ecfeff')
    .process('p21', "2.1\nValidate Stock\nAvailability", 260, 100, 100)
    .process('p22', "2.2\nCreate / Approve\nEquipment Request", 260, 280, 100)
    .process('p23', "2.3\nCreate Event\nAssignment", 260, 460, 100)
    .process('p24', "2.4\nLog Movement &\nUpdate Status", 260, 640, 100)
    .store('d1', "D1\nEquipment Catalog", 560, 120, 160, 44)
    .store('d2', "D2\nAssignments &\nRequests", 560, 360, 160, 44)
    .store('d3', "D3\nMovements", 560, 560, 160, 44)
    .store('d5e', "D5e\nPublished Event\n(read)", 560, 720, 160, 44)
    .flow('l2f1', 'e_admin', 'p21', 'Select item + qty')
    .flow('l2f2', 'd1', 'p21', 'Qty available / condition')
    .flow('l2f3', 'p21', 'e_admin', 'Available / shortfall')
    .flow('l2f4', 'e_sim', 'p22', 'Event equipment request')
    .flow('l2f5', 'e_admin', 'p22', 'Approve / reject request')
    .flow('l2f6', 'p22', 'd2', 'EventEquipmentRequest status')
    .flow('l2f7', 'd5e', 'p22', 'Event context')
    .flow('l2f8', 'p22', 'p23', 'Approved request lines')
    .flow('l2f9', 'p21', 'p23', 'Validated stock')
    .flow('l2f10', 'p23', 'd2', 'ResourceEventAssignment')
    .flow('l2f11', 'p23', 'p24', 'Assigned rows')
    .flow('l2f12', 'p24', 'd3', 'Assign movement log')
    .flow('l2f13', 'p24', 'd1', 'Status = assigned')
    .flow('l2f14', 'p24', 'e_sim', 'Ready for readiness check')
    .note('Level 2 maps to ResourceController::assignToEvent and EventEquipmentRequestController.');

$pages = [
    ['id' => 'res-l0', 'name' => 'Level 0 — Context', 'body' => $l0, 'file' => '14_DFD_Resource_Inventory_L0.drawio'],
    ['id' => 'res-l1', 'name' => 'Level 1 — Decomposition', 'body' => $l1, 'file' => '14_DFD_Resource_Inventory_L1.drawio'],
    ['id' => 'res-l2', 'name' => 'Level 2 — Process 2.0 Detail', 'body' => $l2, 'file' => '14_DFD_Resource_Inventory_L2.drawio'],
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
file_put_contents($outDir.'/14_DFD_Resource_Inventory_L0_L1_L2.drawio', $all);
echo "Wrote 14_DFD_Resource_Inventory_L0_L1_L2.drawio (3 tabs)\n";
