<?php

/**
 * Use Case diagrams — overall + 8 internal modules.
 * Run: php Documents/usecase/generate_usecase.php
 */

$outDir = __DIR__;

function esc(string $s): string
{
    return htmlspecialchars($s, ENT_QUOTES | ENT_XML1, 'UTF-8');
}

function title(string $text, int $w = 1400, string $id = 'title'): string
{
    return sprintf(
        '<mxCell id="%s" value="%s" style="rounded=0;whiteSpace=wrap;html=1;fillColor=#1e3a5f;fontColor=#ffffff;fontStyle=1;fontSize=13;strokeColor=#1e3a5f;" vertex="1" parent="1"><mxGeometry x="40" y="16" width="%d" height="40" as="geometry"/></mxCell>',
        esc($id),
        esc($text),
        $w
    );
}

function note(string $text, int $y, int $w = 1400, string $id = 'note'): string
{
    return sprintf(
        '<mxCell id="%s" value="%s" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#f1f5f9;strokeColor=#64748b;fontSize=10;align=left;spacingLeft=8;" vertex="1" parent="1"><mxGeometry x="40" y="%d" width="%d" height="40" as="geometry"/></mxCell>',
        esc($id),
        esc($text),
        $y,
        $w
    );
}

function systemBoundary(string $id, string $label, int $x, int $y, int $w, int $h): string
{
    // No childLayout/stackLayout — that auto-stretches all ovals when one is moved.
    return sprintf(
        '<mxCell id="%s" value="%s" style="swimlane;fontStyle=1;align=center;verticalAlign=top;horizontal=1;startSize=36;collapsible=0;resizeParent=0;whiteSpace=wrap;html=1;fillColor=#ffffff;strokeColor=#1e3a5f;fontSize=12;" vertex="1" parent="1"><mxGeometry x="%d" y="%d" width="%d" height="%d" as="geometry"/></mxCell>',
        esc($id),
        esc($label),
        $x,
        $y,
        $w,
        $h
    );
}

/** UML actor (stick figure via shape=umlActor) */
function actor(string $id, string $label, int $x, int $y, string $parent = '1'): string
{
    return sprintf(
        '<mxCell id="%s" value="%s" style="shape=umlActor;verticalLabelPosition=bottom;verticalAlign=top;html=1;outlineConnect=0;fillColor=#fff7ed;strokeColor=#334155;fontSize=10;fontStyle=1;" vertex="1" parent="%s"><mxGeometry x="%d" y="%d" width="40" height="70" as="geometry"/></mxCell>',
        esc($id),
        esc($label),
        esc($parent),
        $x,
        $y
    );
}

/** External system as rectangle actor */
function extActor(string $id, string $label, int $x, int $y, int $w = 130, int $h = 50): string
{
    return sprintf(
        '<mxCell id="%s" value="%s" style="rounded=0;whiteSpace=wrap;html=1;fillColor=#faf5ff;strokeColor=#334155;fontStyle=1;fontSize=9;" vertex="1" parent="1"><mxGeometry x="%d" y="%d" width="%d" height="%d" as="geometry"/></mxCell>',
        esc($id),
        esc($label),
        $x,
        $y,
        $w,
        $h
    );
}

function useCase(string $id, string $label, int $x, int $y, string $parent = 'sys', int $w = 180, int $h = 48): string
{
    return sprintf(
        '<mxCell id="%s" value="%s" style="ellipse;whiteSpace=wrap;html=1;fillColor=#dbeafe;strokeColor=#1d4ed8;fontSize=10;" vertex="1" parent="%s"><mxGeometry x="%d" y="%d" width="%d" height="%d" as="geometry"/></mxCell>',
        esc($id),
        esc($label),
        esc($parent),
        $x,
        $y,
        $w,
        $h
    );
}

function assoc(string $id, string $from, string $to): string
{
    return sprintf(
        '<mxCell id="%s" style="endArrow=none;html=1;strokeWidth=1.2;strokeColor=#0f172a;exitX=1;exitY=0.5;entryX=0;entryY=0.5;" edge="1" parent="1" source="%s" target="%s"><mxGeometry relative="1" as="geometry"/></mxCell>',
        esc($id),
        esc($from),
        esc($to)
    );
}

function assocR(string $id, string $from, string $to): string
{
    return sprintf(
        '<mxCell id="%s" style="endArrow=none;html=1;strokeWidth=1.2;strokeColor=#0f172a;exitX=0;exitY=0.5;entryX=1;entryY=0.5;" edge="1" parent="1" source="%s" target="%s"><mxGeometry relative="1" as="geometry"/></mxCell>',
        esc($id),
        esc($from),
        esc($to)
    );
}

function includeRel(string $id, string $from, string $to, string $stereo = '<<include>>'): string
{
    return sprintf(
        '<mxCell id="%s" value="%s" style="endArrow=open;html=1;dashed=1;dashPattern=8 4;strokeWidth=1.2;strokeColor=#64748b;fontSize=8;fontColor=#64748b;" edge="1" parent="1" source="%s" target="%s"><mxGeometry relative="1" as="geometry"/></mxCell>',
        esc($id),
        esc($stereo),
        esc($from),
        esc($to)
    );
}

function wrapDiagram(string $id, string $name, string $body, int $pageW, int $pageH): string
{
    return sprintf(
        '<diagram id="%s" name="%s"><mxGraphModel dx="1600" dy="1100" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="%d" pageHeight="%d" math="0" shadow="0"><root><mxCell id="0"/><mxCell id="1" parent="0"/>%s</root></mxGraphModel></diagram>',
        esc($id),
        esc($name),
        $pageW,
        $pageH,
        $body
    );
}

function writeDiagram(string $outDir, string $file, string $id, string $name, string $body, int $w, int $h): string
{
    $diagram = wrapDiagram($id, $name, $body, $w, $h);
    $xml = '<?xml version="1.0" encoding="UTF-8"?>'."\n"
        .'<mxfile host="app.diagrams.net" agent="Cursor" version="22.1.0" type="device">'
        .$diagram
        .'</mxfile>';
    file_put_contents($outDir.'/'.$file, $xml);
    echo "Wrote $file\n";

    return $diagram;
}

// ═══════════════════════════════════════════════════════════════════════════
// OVERALL
// ═══════════════════════════════════════════════════════════════════════════
$overall = title('Use Case Diagram — Overall · AlertaraQC (Disaster Preparedness Training & Simulation)', 1100)
    .systemBoundary('sys', 'AlertaraQC System', 280, 70, 560, 640)
    // Human actors left
    .actor('a_admin', "LGU Admin /\nLead Trainer", 60, 100)
    .actor('a_asst', "Assistant Trainer\n/ Staff", 60, 280)
    .actor('a_eval', 'Evaluator', 60, 460)
    .actor('a_part', 'Participant', 60, 640)
    // External right
    .extActor('e_g6', "Campaign Planning\n(Group 6)", 920, 120, 140, 50)
    .extActor('e_gem', "Google Gemini\nAPI", 920, 280, 140, 50)
    .extActor('e_cpsqc', "CPSQC Patrol\nSystem", 920, 440, 140, 50)
    .extActor('e_pub', "Public Verifier\n(Certificate QR)", 920, 600, 140, 50)
    // Use cases inside system (coords relative to sys) — fixed size, free layout (no stack)
    .useCase('uc1', 'Manage Users & Roles', 40, 50, 'sys', 200, 50)
    .useCase('uc2', 'Manage Training Modules', 40, 120, 'sys', 200, 50)
    .useCase('uc3', 'Generate AI Scenario / Quiz', 40, 190, 'sys', 200, 50)
    .useCase('uc4', 'Submit Campaign Request', 40, 260, 'sys', 200, 50)
    .useCase('uc5', 'Plan Simulation Event', 40, 330, 'sys', 200, 50)
    .useCase('uc6', 'Manage Resource Inventory', 40, 400, 'sys', 200, 50)
    .useCase('uc7', 'Register & Record Attendance', 40, 470, 'sys', 200, 50)
    .useCase('uc8', 'Evaluate Participants', 40, 540, 'sys', 200, 50)
    .useCase('uc9', 'Issue Certificate', 280, 50, 'sys', 200, 50)
    .useCase('uc10', 'Manage Hazard Profile', 280, 120, 'sys', 200, 50)
    .useCase('uc11', 'View Dashboard / Reports', 280, 190, 'sys', 200, 50)
    .useCase('uc12', 'Take Training & Quizzes', 280, 260, 'sys', 200, 50)
    .useCase('uc13', 'Publish & Monitor Event', 280, 330, 'sys', 200, 50)
    .useCase('uc14', 'Verify Certificate', 280, 400, 'sys', 200, 50)
    .useCase('uc15', 'View Own Results / Certificate', 280, 470, 'sys', 220, 50)
    // Associations — left actors
    .assoc('l1', 'a_admin', 'uc1')
    .assoc('l2', 'a_admin', 'uc2')
    .assoc('l3', 'a_admin', 'uc3')
    .assoc('l4', 'a_admin', 'uc4')
    .assoc('l5', 'a_admin', 'uc5')
    .assoc('l6', 'a_admin', 'uc6')
    .assoc('l7', 'a_admin', 'uc9')
    .assoc('l8', 'a_admin', 'uc10')
    .assoc('l9', 'a_admin', 'uc11')
    .assoc('l10', 'a_admin', 'uc13')
    .assoc('l11', 'a_asst', 'uc5')
    .assoc('l12', 'a_asst', 'uc7')
    .assoc('l13', 'a_eval', 'uc7')
    .assoc('l14', 'a_eval', 'uc8')
    .assoc('l15', 'a_part', 'uc12')
    .assoc('l16', 'a_part', 'uc7')
    .assoc('l17', 'a_part', 'uc15')
    // Right externals
    .assocR('r1', 'e_g6', 'uc4')
    .assocR('r2', 'e_g6', 'uc5')
    .assocR('r3', 'e_gem', 'uc3')
    .assocR('r4', 'e_cpsqc', 'uc5')
    .assocR('r5', 'e_pub', 'uc14')
    // include (sparingly)
    .includeRel('i1', 'uc13', 'uc5')
    .includeRel('i2', 'uc9', 'uc8')
    .note('Overall use cases for San Agustin pilot. External: Group 6, Gemini, CPSQC, Public Verifier. Resource Allocation (Group 3) is not an actor — inventory is internal.', 740, 1100);

$pages = [];
$pages[] = writeDiagram($outDir, '28_UseCase_Overall.drawio', 'uc-overall', 'Overall Use Case', $overall, 1200, 820);

// Helper to build a module diagram (unique id prefix per file — avoids paste/merge mix-ups)
function moduleUc(
    string $pfx,
    string $titleText,
    string $boundary,
    array $leftActors,
    array $rightActors,
    array $useCases,
    array $assocs,
    array $includes,
    string $noteText,
    int $sysH = 520
): string {
    $sysId = $pfx.'sys';
    $sysW = 520;
    $sysX = 220;
    $body = title($titleText, 1100, $pfx.'title')
        .systemBoundary($sysId, $boundary, $sysX, 70, $sysW, $sysH);

    foreach ($leftActors as $a) {
        $body .= actor($pfx.$a['id'], $a['label'], $a['x'], $a['y']);
    }
    foreach ($rightActors as $a) {
        if (($a['type'] ?? 'ext') === 'actor') {
            $body .= actor($pfx.$a['id'], $a['label'], $a['x'], $a['y']);
        } else {
            $body .= extActor($pfx.$a['id'], $a['label'], $a['x'], $a['y'], $a['w'] ?? 130, $a['h'] ?? 50);
        }
    }
    foreach ($useCases as $u) {
        $body .= useCase($pfx.$u['id'], $u['label'], $u['x'], $u['y'], $sysId, $u['w'] ?? 200, $u['h'] ?? 44);
    }
    foreach ($assocs as $e) {
        $fn = ($e['dir'] ?? 'L') === 'R' ? 'assocR' : 'assoc';
        $body .= $fn($pfx.$e['id'], $pfx.$e['from'], $pfx.$e['to']);
    }
    foreach ($includes as $e) {
        $body .= includeRel($pfx.$e['id'], $pfx.$e['from'], $pfx.$e['to'], $e['stereo'] ?? '<<include>>');
    }
    $body .= note($noteText, 70 + $sysH + 30, 1100, $pfx.'note');

    return $body;
}

// 1 Training Module
$pages[] = writeDiagram(
    $outDir,
    '29_UseCase_Training_Module.drawio',
    'uc-tm',
    '1 · Training Module',
    moduleUc(
        'tm_',
        'Use Case — Training Module',
        'Training Module',
        [
            ['id' => 'a1', 'label' => "Lead Trainer\n/ Admin", 'x' => 60, 'y' => 120],
            ['id' => 'a2', 'label' => 'Participant', 'x' => 60, 'y' => 360],
        ],
        [
            ['id' => 'e1', 'label' => "Google Gemini\nAPI (optional)", 'x' => 820, 'y' => 200],
        ],
        [
            ['id' => 'u1', 'label' => 'Create / Edit Module', 'x' => 50, 'y' => 50],
            ['id' => 'u2', 'label' => 'Manage Lessons & Resources', 'x' => 50, 'y' => 120],
            ['id' => 'u3', 'label' => 'Publish / Archive Module', 'x' => 50, 'y' => 190],
            ['id' => 'u4', 'label' => 'Generate AI Module Draft', 'x' => 50, 'y' => 260],
            ['id' => 'u5', 'label' => 'View & Study Lessons', 'x' => 50, 'y' => 340],
            ['id' => 'u6', 'label' => 'Mark Lesson Progress', 'x' => 50, 'y' => 410],
            ['id' => 'u7', 'label' => 'Print Module List', 'x' => 280, 'y' => 120],
        ],
        [
            ['id' => 'l1', 'from' => 'a1', 'to' => 'u1'],
            ['id' => 'l2', 'from' => 'a1', 'to' => 'u2'],
            ['id' => 'l3', 'from' => 'a1', 'to' => 'u3'],
            ['id' => 'l4', 'from' => 'a1', 'to' => 'u4'],
            ['id' => 'l5', 'from' => 'a1', 'to' => 'u7'],
            ['id' => 'l6', 'from' => 'a2', 'to' => 'u5'],
            ['id' => 'l7', 'from' => 'a2', 'to' => 'u6'],
            ['id' => 'r1', 'from' => 'e1', 'to' => 'u4', 'dir' => 'R'],
        ],
        [
            ['id' => 'i1', 'from' => 'u3', 'to' => 'u2'],
        ],
        'Campaign submit is NOT this module. Gemini is optional for AI draft outline.'
    ),
    1200,
    700
);

// 2 AI Scenario
$pages[] = writeDiagram(
    $outDir,
    '30_UseCase_AI_Scenario.drawio',
    'uc-ai',
    '2 · AI Scenario Training',
    moduleUc(
        'ai_',
        'Use Case — AI Scenario Training',
        'AI Scenario Training',
        [
            ['id' => 'a1', 'label' => "Lead Trainer\n/ Admin", 'x' => 60, 'y' => 120],
            ['id' => 'a2', 'label' => 'Participant', 'x' => 60, 'y' => 400],
        ],
        [
            ['id' => 'e1', 'label' => "Google Gemini\nAPI", 'x' => 820, 'y' => 180],
        ],
        [
            ['id' => 'u1', 'label' => 'Configure Lesson Quiz', 'x' => 50, 'y' => 40],
            ['id' => 'u2', 'label' => 'Configure Final AI Scenario', 'x' => 50, 'y' => 100],
            ['id' => 'u3', 'label' => 'Generate AI Content', 'x' => 50, 'y' => 160],
            ['id' => 'u4', 'label' => 'Review & Publish Version', 'x' => 50, 'y' => 220],
            ['id' => 'u5', 'label' => 'Take Lesson Quiz', 'x' => 50, 'y' => 300],
            ['id' => 'u6', 'label' => 'Take Final AI Scenario', 'x' => 50, 'y' => 360],
            ['id' => 'u7', 'label' => 'View Attempt Scores', 'x' => 50, 'y' => 420],
        ],
        [
            ['id' => 'l1', 'from' => 'a1', 'to' => 'u1'],
            ['id' => 'l2', 'from' => 'a1', 'to' => 'u2'],
            ['id' => 'l3', 'from' => 'a1', 'to' => 'u3'],
            ['id' => 'l4', 'from' => 'a1', 'to' => 'u4'],
            ['id' => 'l5', 'from' => 'a2', 'to' => 'u5'],
            ['id' => 'l6', 'from' => 'a2', 'to' => 'u6'],
            ['id' => 'l7', 'from' => 'a2', 'to' => 'u7'],
            ['id' => 'r1', 'from' => 'e1', 'to' => 'u3', 'dir' => 'R'],
        ],
        [
            ['id' => 'i1', 'from' => 'u4', 'to' => 'u3'],
        ],
        'Hazard Assessment may supply hazard context / scenario suggestions for generation.',
        520
    ),
    1200,
    700
);

// 3 Simulation Event — planning ONLY (registration/attendance is separate module)
$pages[] = writeDiagram(
    $outDir,
    '31_UseCase_Simulation_Event.drawio',
    'uc-sim',
    '3 · Simulation Event Planning',
    moduleUc(
        'sim_',
        'Use Case — Simulation Event Planning',
        'Simulation Event Planning',
        [
            ['id' => 'a1', 'label' => "Lead Trainer\n/ Admin", 'x' => 60, 'y' => 120],
            ['id' => 'a2', 'label' => "Assistant\nTrainer", 'x' => 60, 'y' => 340],
        ],
        [
            ['id' => 'e1', 'label' => "Campaign Planning\n(Group 6)", 'x' => 820, 'y' => 100],
            ['id' => 'e2', 'label' => "CPSQC Patrol\nSystem", 'x' => 820, 'y' => 280],
        ],
        [
            ['id' => 'u1', 'label' => 'Manage Exercise Plan / Template', 'x' => 40, 'y' => 40, 'w' => 220],
            ['id' => 'u2', 'label' => 'Create Event from Template', 'x' => 40, 'y' => 110, 'w' => 220],
            ['id' => 'u3', 'label' => 'Assign Personnel & Equipment', 'x' => 40, 'y' => 180, 'w' => 220],
            ['id' => 'u4', 'label' => 'Complete Readiness Checklist', 'x' => 40, 'y' => 250, 'w' => 220],
            ['id' => 'u5', 'label' => 'Publish Simulation Event', 'x' => 40, 'y' => 320, 'w' => 220],
            ['id' => 'u6', 'label' => 'Monitor Event Lifecycle', 'x' => 40, 'y' => 390, 'w' => 220],
        ],
        [
            ['id' => 'l1', 'from' => 'a1', 'to' => 'u1'],
            ['id' => 'l2', 'from' => 'a1', 'to' => 'u2'],
            ['id' => 'l3', 'from' => 'a1', 'to' => 'u3'],
            ['id' => 'l4', 'from' => 'a1', 'to' => 'u4'],
            ['id' => 'l5', 'from' => 'a1', 'to' => 'u5'],
            ['id' => 'l6', 'from' => 'a1', 'to' => 'u6'],
            ['id' => 'l7', 'from' => 'a2', 'to' => 'u3'],
            ['id' => 'r1', 'from' => 'e1', 'to' => 'u2', 'dir' => 'R'],
            ['id' => 'r2', 'from' => 'e2', 'to' => 'u3', 'dir' => 'R'],
            ['id' => 'r3', 'from' => 'e2', 'to' => 'u6', 'dir' => 'R'],
        ],
        [
            ['id' => 'i1', 'from' => 'u5', 'to' => 'u4'],
        ],
        'Planning only: Campaign → Plan → Template → Readiness → Publish → Monitoring. Registration & attendance = separate Use Case (module 4). No Resource Allocation (Group 3).',
        500
    ),
    1200,
    680
);

// 4 Participant Attendance
$pages[] = writeDiagram(
    $outDir,
    '32_UseCase_Participant_Attendance.drawio',
    'uc-att',
    '4 · Participant & Attendance',
    moduleUc(
        'att_',
        'Use Case — Participant Registration & Attendance',
        'Participant Registration & Attendance',
        [
            ['id' => 'a1', 'label' => 'Participant', 'x' => 60, 'y' => 120],
            ['id' => 'a2', 'label' => "Evaluator /\nAdmin", 'x' => 60, 'y' => 360],
        ],
        [
            ['id' => 'e1', 'label' => "Campaign Planning\n(Group 6)", 'x' => 820, 'y' => 160],
        ],
        [
            ['id' => 'u1', 'label' => 'Manage Participant Registry', 'x' => 40, 'y' => 40, 'w' => 220],
            ['id' => 'u2', 'label' => 'Register for Campaign', 'x' => 40, 'y' => 100, 'w' => 220],
            ['id' => 'u3', 'label' => 'Register for Simulation Event', 'x' => 40, 'y' => 160, 'w' => 220],
            ['id' => 'u4', 'label' => 'Approve / Reject Event Seat', 'x' => 40, 'y' => 220, 'w' => 220],
            ['id' => 'u5', 'label' => 'Cancel Event Registration', 'x' => 40, 'y' => 280, 'w' => 220],
            ['id' => 'u6', 'label' => 'Record Attendance (QR / Manual)', 'x' => 40, 'y' => 340, 'w' => 220],
            ['id' => 'u7', 'label' => 'Lock & Export Attendance', 'x' => 40, 'y' => 400, 'w' => 220],
        ],
        [
            ['id' => 'l1', 'from' => 'a1', 'to' => 'u2'],
            ['id' => 'l2', 'from' => 'a1', 'to' => 'u3'],
            ['id' => 'l3', 'from' => 'a1', 'to' => 'u5'],
            ['id' => 'l4', 'from' => 'a1', 'to' => 'u6'],
            ['id' => 'l5', 'from' => 'a2', 'to' => 'u1'],
            ['id' => 'l6', 'from' => 'a2', 'to' => 'u4'],
            ['id' => 'l7', 'from' => 'a2', 'to' => 'u6'],
            ['id' => 'l8', 'from' => 'a2', 'to' => 'u7'],
            ['id' => 'r1', 'from' => 'e1', 'to' => 'u2', 'dir' => 'R'],
        ],
        [
            ['id' => 'i1', 'from' => 'u6', 'to' => 'u3'],
        ],
        'Cancel = EVENT registration only; campaign/module access stays unlocked.',
        520
    ),
    1200,
    700
);

// 5 Resource Inventory
$pages[] = writeDiagram(
    $outDir,
    '33_UseCase_Resource_Inventory.drawio',
    'uc-inv',
    '5 · Resource Inventory',
    moduleUc(
        'inv_',
        'Use Case — Resource & Equipment Inventory',
        'Resource & Equipment Inventory',
        [
            ['id' => 'a1', 'label' => "Lead Trainer\n/ Admin", 'x' => 60, 'y' => 140],
            ['id' => 'a2', 'label' => "Budget\nApprover", 'x' => 60, 'y' => 380],
        ],
        [],
        [
            ['id' => 'u1', 'label' => 'Manage Equipment Catalog', 'x' => 50, 'y' => 40],
            ['id' => 'u2', 'label' => 'Assign Equipment to Event', 'x' => 50, 'y' => 110],
            ['id' => 'u3', 'label' => 'Track Usage & Condition', 'x' => 50, 'y' => 180],
            ['id' => 'u4', 'label' => 'Return Equipment from Event', 'x' => 50, 'y' => 250],
            ['id' => 'u5', 'label' => 'Log Maintenance', 'x' => 50, 'y' => 320],
            ['id' => 'u6', 'label' => 'Submit Budget Proposal', 'x' => 50, 'y' => 390],
            ['id' => 'u7', 'label' => 'Approve / Reject Budget', 'x' => 280, 'y' => 390],
        ],
        [
            ['id' => 'l1', 'from' => 'a1', 'to' => 'u1'],
            ['id' => 'l2', 'from' => 'a1', 'to' => 'u2'],
            ['id' => 'l3', 'from' => 'a1', 'to' => 'u3'],
            ['id' => 'l4', 'from' => 'a1', 'to' => 'u4'],
            ['id' => 'l5', 'from' => 'a1', 'to' => 'u5'],
            ['id' => 'l6', 'from' => 'a1', 'to' => 'u6'],
            ['id' => 'l7', 'from' => 'a2', 'to' => 'u7'],
        ],
        [
            ['id' => 'i1', 'from' => 'u2', 'to' => 'u1'],
        ],
        'Internal only. Resource Allocation (Group 3) is NOT an actor — integration disabled.',
        500
    ),
    1100,
    680
);

// 6 Evaluation
$pages[] = writeDiagram(
    $outDir,
    '34_UseCase_Evaluation_Scoring.drawio',
    'uc-eval',
    '6 · Evaluation & Scoring',
    moduleUc(
        'eval_',
        'Use Case — Evaluation & Scoring',
        'Evaluation & Scoring System',
        [
            ['id' => 'a1', 'label' => 'Evaluator', 'x' => 60, 'y' => 140],
            ['id' => 'a2', 'label' => "Lead Trainer\n/ Admin", 'x' => 60, 'y' => 300],
            ['id' => 'a3', 'label' => 'Participant', 'x' => 60, 'y' => 450],
        ],
        [],
        [
            ['id' => 'u1', 'label' => 'Ingest Training Assessment Results', 'x' => 40, 'y' => 40, 'w' => 230],
            ['id' => 'u2', 'label' => 'Score Simulation Drill', 'x' => 40, 'y' => 110, 'w' => 230],
            ['id' => 'u3', 'label' => 'Aggregate Evaluation Summary', 'x' => 40, 'y' => 180, 'w' => 230],
            ['id' => 'u4', 'label' => 'Lock / Finalize Evaluation', 'x' => 40, 'y' => 250, 'w' => 230],
            ['id' => 'u5', 'label' => 'Export Evaluation Report', 'x' => 40, 'y' => 320, 'w' => 230],
            ['id' => 'u6', 'label' => 'View Own Portfolio / Scores', 'x' => 40, 'y' => 400, 'w' => 230],
        ],
        [
            ['id' => 'l1', 'from' => 'a1', 'to' => 'u2'],
            ['id' => 'l2', 'from' => 'a1', 'to' => 'u3'],
            ['id' => 'l3', 'from' => 'a2', 'to' => 'u1'],
            ['id' => 'l4', 'from' => 'a2', 'to' => 'u4'],
            ['id' => 'l5', 'from' => 'a2', 'to' => 'u5'],
            ['id' => 'l6', 'from' => 'a3', 'to' => 'u6'],
        ],
        [
            ['id' => 'i1', 'from' => 'u4', 'to' => 'u2'],
        ],
        'Scoring uses present attendance roster. Results feed Certification eligibility.',
        500
    ),
    1100,
    680
);

// 7 Certification
$pages[] = writeDiagram(
    $outDir,
    '35_UseCase_Certification.drawio',
    'uc-cert',
    '7 · Certification Issuance',
    moduleUc(
        'cert_',
        'Use Case — Certification Issuance',
        'Certification Issuance',
        [
            ['id' => 'a1', 'label' => "Lead Trainer\n/ Admin", 'x' => 60, 'y' => 140],
            ['id' => 'a2', 'label' => 'Participant', 'x' => 60, 'y' => 360],
        ],
        [
            ['id' => 'e1', 'label' => "Public Verifier\n(QR / token)", 'x' => 820, 'y' => 280],
        ],
        [
            ['id' => 'u1', 'label' => 'Manage Certificate Templates', 'x' => 40, 'y' => 40, 'w' => 220],
            ['id' => 'u2', 'label' => 'Check Eligibility', 'x' => 40, 'y' => 110, 'w' => 220],
            ['id' => 'u3', 'label' => 'Issue Certificate', 'x' => 40, 'y' => 180, 'w' => 220],
            ['id' => 'u4', 'label' => 'Revoke / Reissue Certificate', 'x' => 40, 'y' => 250, 'w' => 220],
            ['id' => 'u5', 'label' => 'View / Email Certificate', 'x' => 40, 'y' => 330, 'w' => 220],
            ['id' => 'u6', 'label' => 'Verify Certificate (Public)', 'x' => 40, 'y' => 400, 'w' => 220],
        ],
        [
            ['id' => 'l1', 'from' => 'a1', 'to' => 'u1'],
            ['id' => 'l2', 'from' => 'a1', 'to' => 'u2'],
            ['id' => 'l3', 'from' => 'a1', 'to' => 'u3'],
            ['id' => 'l4', 'from' => 'a1', 'to' => 'u4'],
            ['id' => 'l5', 'from' => 'a2', 'to' => 'u5'],
            ['id' => 'r1', 'from' => 'e1', 'to' => 'u6', 'dir' => 'R'],
        ],
        [
            ['id' => 'i1', 'from' => 'u3', 'to' => 'u2'],
        ],
        'Internal issuance. External certification authority API is future / optional.',
        500
    ),
    1200,
    680
);

// 8 Hazard Assessment
$pages[] = writeDiagram(
    $outDir,
    '36_UseCase_Hazard_Assessment.drawio',
    'uc-haz',
    '8 · Hazard Assessment',
    moduleUc(
        'haz_',
        'Use Case — Hazard Assessment Profile',
        'Hazard Assessment Profile',
        [
            ['id' => 'a1', 'label' => "Lead Trainer\n/ Admin", 'x' => 60, 'y' => 200],
        ],
        [],
        [
            ['id' => 'u1', 'label' => 'Manage Barangay Profile', 'x' => 50, 'y' => 40],
            ['id' => 'u2', 'label' => 'Capture Hazard Records', 'x' => 50, 'y' => 110],
            ['id' => 'u3', 'label' => 'Upload Supporting Documents', 'x' => 50, 'y' => 180],
            ['id' => 'u4', 'label' => 'View Intelligence Recommendations', 'x' => 50, 'y' => 250, 'w' => 230],
            ['id' => 'u5', 'label' => 'Get Suggested Scenarios (AI context)', 'x' => 50, 'y' => 320, 'w' => 230],
            ['id' => 'u6', 'label' => 'Get Recommended Training Modules', 'x' => 50, 'y' => 390, 'w' => 230],
        ],
        [
            ['id' => 'l1', 'from' => 'a1', 'to' => 'u1'],
            ['id' => 'l2', 'from' => 'a1', 'to' => 'u2'],
            ['id' => 'l3', 'from' => 'a1', 'to' => 'u3'],
            ['id' => 'l4', 'from' => 'a1', 'to' => 'u4'],
            ['id' => 'l5', 'from' => 'a1', 'to' => 'u5'],
            ['id' => 'l6', 'from' => 'a1', 'to' => 'u6'],
        ],
        [
            ['id' => 'i1', 'from' => 'u4', 'to' => 'u2'],
            ['id' => 'i2', 'from' => 'u5', 'to' => 'u4'],
        ],
        'San Agustin hazard profile grounds AI scenario suggestions and exercise planning context.',
        500
    ),
    1100,
    680
);

// Combined all tabs
$combined = '';
foreach ($pages as $d) {
    $combined .= $d;
}
file_put_contents(
    $outDir.'/28_UseCase_All.drawio',
    '<?xml version="1.0" encoding="UTF-8"?>'."\n"
    .'<mxfile host="app.diagrams.net" agent="Cursor" version="22.1.0" type="device">'
    .$combined
    .'</mxfile>'
);
echo "Wrote 28_UseCase_All.drawio (".count($pages)." tabs)\n";
