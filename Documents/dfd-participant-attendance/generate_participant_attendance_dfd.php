<?php

/**
 * DFD Level 0, 1, 2 — Participant Registration & Attendance module.
 * Covers: participant registry, campaign registration, event registration, attendance.
 * Run: php Documents/dfd-participant-attendance/generate_participant_attendance_dfd.php
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
$l0 = title('DFD Level 0 — Participant Registration & Attendance (Context)')
    .entity('e_admin', "Lead Trainer /\nAdmin / Evaluator", 60, 140)
    .entity('e_part', "Participant", 60, 480, 150, 64, '#eff6ff')
    .entity('e_camp', "Campaign Planning\n(Group 6)", 1080, 120, 170, 64, '#f0fdf4')
    .entity('e_sim', "Simulation Event\nPlanning", 1080, 320, 170, 64, '#ecfeff')
    .entity('e_g6', "Group 6\nParticipant Sync", 1080, 520, 170, 64, '#fef3c7')
    .process('p0', "0\nParticipant Reg.\n& Attendance", 500, 300, 180)
    .flow('f1', 'e_admin', 'p0', 'Approve/reject event reg, mark attendance, lock/export')
    .flow('f2', 'p0', 'e_admin', 'Roster, attendance sheet, exports')
    .flow('f3', 'e_part', 'p0', 'Self-register, campaign register, cancel event reg')
    .flow('f4', 'p0', 'e_part', 'Reg status, QR check-in, my-attendance')
    .flow('f5', 'e_camp', 'p0', 'Open campaign / registration window')
    .flow('f6', 'p0', 'e_camp', 'Campaign registration count / link')
    .flow('f7', 'e_sim', 'p0', 'Published event for event registration')
    .flow('f8', 'p0', 'e_sim', 'Registration roster status')
    .flow('f9', 'e_g6', 'p0', 'Inbound participant profiles')
    .flow('f10', 'p0', 'e_g6', 'Sync ack / registry updates')
    .note('Level 0: Campaign registration unlocks training module access. Cancel registration applies to simulation EVENT only — campaign/module access stays.');

// ─── LEVEL 1 ───────────────────────────────────────────────────────────────
$l1 = title('DFD Level 1 — Participant Registration & Attendance (Decomposition)')
    .entity('e_admin', "Lead Trainer /\nAdmin / Evaluator", 40, 100)
    .entity('e_part', "Participant", 40, 560, 150, 64, '#eff6ff')
    .entity('e_camp', "Campaign Planning", 1080, 160, 150, 64, '#f0fdf4')
    .entity('e_sim', "Simulation Event\nPlanning", 1080, 400, 150, 64, '#ecfeff')
    .entity('e_g6', "Group 6 Sync", 1080, 620, 150, 64, '#fef3c7')
    .process('p1', "1.0\nManage Participant\nRegistry", 260, 80, 105)
    .process('p2', "2.0\nCampaign\nRegistration", 260, 240, 105)
    .process('p3', "3.0\nEvent Registration\n(approve/cancel)", 260, 400, 105)
    .process('p4', "4.0\nRecord\nAttendance", 260, 560, 105)
    .process('p5', "5.0\nLock & Export\nAttendance", 260, 700, 105)
    .store('d1', "D1\nParticipant\nRegistry", 560, 80)
    .store('d2', "D2\nCampaign\nRegistrations", 560, 240)
    .store('d3', "D3\nEvent\nRegistrations", 560, 400)
    .store('d4', "D4\nAttendance\nRecords", 560, 560)
    .store('d5', "D5\nPublished Events\n(read from Sim)", 560, 700)
    .flow('l1f1', 'e_admin', 'p1', 'Create / view / export participants')
    .flow('l1f2', 'e_g6', 'p1', 'Sync participant profiles')
    .flow('l1f3', 'e_part', 'p1', 'Self-registration / verify email')
    .flow('l1f4', 'p1', 'd1', 'User + participant profile')
    .flow('l1f5', 'd1', 'p1', 'Registry list')
    .flow('l1f6', 'e_part', 'p2', 'Register to open campaign')
    .flow('l1f7', 'e_camp', 'p2', 'Open window + campaign request')
    .flow('l1f8', 'd1', 'p2', 'Participant identity')
    .flow('l1f9', 'p2', 'd2', 'CampaignRegistration row')
    .flow('l1f10', 'p2', 'e_part', 'Module unlock confirmation')
    .flow('l1f11', 'e_part', 'p3', 'Register / cancel event')
    .flow('l1f12', 'e_admin', 'p3', 'Approve / reject / cancel')
    .flow('l1f13', 'd5', 'p3', 'Published SimulationEvent')
    .flow('l1f14', 'e_sim', 'p3', 'Event schedule / capacity')
    .flow('l1f15', 'd1', 'p3', 'Eligible participant')
    .flow('l1f16', 'p3', 'd3', 'EventRegistration status')
    .flow('l1f17', 'p3', 'e_part', 'Approved / rejected / cancelled')
    .flow('l1f18', 'e_admin', 'p4', 'Mark present / bulk / update')
    .flow('l1f19', 'e_part', 'p4', 'QR check-in token')
    .flow('l1f20', 'd3', 'p4', 'Approved registrations')
    .flow('l1f21', 'p4', 'd4', 'Attendance present/absent')
    .flow('l1f22', 'd4', 'p4', 'Existing marks')
    .flow('l1f23', 'e_admin', 'p5', 'Lock sheet / export CSV')
    .flow('l1f24', 'd4', 'p5', 'Attendance rows')
    .flow('l1f25', 'p5', 'd4', 'Locked flag')
    .flow('l1f26', 'p5', 'e_admin', 'Export file')
    .note('Level 1: D2 = campaign unlock (training). D3 = event seat. Cancel event reg does NOT delete campaign registration.');

// ─── LEVEL 2 — Process 4.0 Record Attendance ───────────────────────────────
$l2 = title('DFD Level 2 — Process 4.0 Record Attendance (Detail)')
    .entity('e_admin', "Lead Trainer /\nAdmin / Evaluator", 40, 200)
    .entity('e_part', "Participant", 40, 520, 150, 64, '#eff6ff')
    .process('p41', "4.1\nLoad Approved\nRoster", 260, 100, 100)
    .process('p42', "4.2\nMark Present\n(QR / Manual)", 260, 280, 100)
    .process('p43', "4.3\nBulk Mark /\nUpdate Status", 260, 460, 100)
    .process('p44', "4.4\nValidate &\nPersist Record", 260, 640, 100)
    .store('d3', "D3\nEvent\nRegistrations", 560, 120, 160, 44)
    .store('d5', "D5\nPublished Event", 560, 280, 160, 44)
    .store('d4', "D4\nAttendance\nRecords", 560, 520, 160, 44)
    .flow('l2f1', 'e_admin', 'p41', 'Open attendance page')
    .flow('l2f2', 'd5', 'p41', 'Event context')
    .flow('l2f3', 'd3', 'p41', 'Approved EventRegistrations')
    .flow('l2f4', 'p41', 'e_admin', 'Roster UI')
    .flow('l2f5', 'e_part', 'p42', 'QR scan / check-in')
    .flow('l2f6', 'e_admin', 'p42', 'Mark present by QR/manual')
    .flow('l2f7', 'd3', 'p42', 'Match registration')
    .flow('l2f8', 'e_admin', 'p43', 'Bulk present/absent')
    .flow('l2f9', 'p42', 'p44', 'Single mark payload')
    .flow('l2f10', 'p43', 'p44', 'Bulk mark payload')
    .flow('l2f11', 'd4', 'p44', 'Existing / locked check')
    .flow('l2f12', 'p44', 'd4', 'Attendance upsert')
    .flow('l2f13', 'p44', 'e_admin', 'Updated sheet')
    .flow('l2f14', 'p44', 'e_part', 'My-attendance status')
    .note('Level 2 maps to AttendanceController::markPresentByQR, bulkMark, store/update. Lock/export is Process 5.0.');

$pages = [
    ['id' => 'att-l0', 'name' => 'Level 0 — Context', 'body' => $l0, 'file' => '13_DFD_Participant_Attendance_L0.drawio'],
    ['id' => 'att-l1', 'name' => 'Level 1 — Decomposition', 'body' => $l1, 'file' => '13_DFD_Participant_Attendance_L1.drawio'],
    ['id' => 'att-l2', 'name' => 'Level 2 — Process 4.0 Detail', 'body' => $l2, 'file' => '13_DFD_Participant_Attendance_L2.drawio'],
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
file_put_contents($outDir.'/13_DFD_Participant_Attendance_L0_L1_L2.drawio', $all);
echo "Wrote 13_DFD_Participant_Attendance_L0_L1_L2.drawio (3 tabs)\n";
