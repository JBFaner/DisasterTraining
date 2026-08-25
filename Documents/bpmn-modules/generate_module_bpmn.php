<?php

/**
 * Per-module BPMN swimlanes (TO-BE) — 8 internal modules.
 * Run: php Documents/bpmn-modules/generate_module_bpmn.php
 */

$outDir = __DIR__;

function esc(string $s): string
{
    return htmlspecialchars($s, ENT_QUOTES | ENT_XML1, 'UTF-8');
}

function cell(string $id, string $parent, string $style, string $value, int $x, int $y, int $w, int $h): string
{
    return sprintf(
        '<mxCell id="%s" parent="%s" style="%s" value="%s" vertex="1"><mxGeometry x="%d" y="%d" width="%d" height="%d" as="geometry"/></mxCell>',
        esc($id), esc($parent), esc($style), esc($value), $x, $y, $w, $h
    );
}

function edge(string $id, string $from, string $to, string $label = '', bool $dashed = false, string $color = '#0f172a'): string
{
    $style = 'edgeStyle=orthogonalEdgeStyle;rounded=0;html=1;strokeWidth=1.5;strokeColor='.$color
        .';endArrow=block;endFill=1;fontSize=9;exitX=0.5;exitY=1;exitDx=0;exitDy=0;entryX=0.5;entryY=0;entryDx=0;entryDy=0;';
    if ($dashed) {
        $style .= 'dashed=1;dashPattern=8 4;';
    }
    $val = $label !== '' ? ' value="'.esc($label).'"' : '';

    return sprintf(
        '<mxCell id="%s" edge="1" parent="1" source="%s" target="%s" style="%s"%s><mxGeometry relative="1" as="geometry"/></mxCell>',
        esc($id), esc($from), esc($to), esc($style), $val
    );
}

const S_TITLE = 'rounded=0;whiteSpace=wrap;html=1;fillColor=#1e3a5f;fontColor=#ffffff;fontStyle=1;fontSize=14;strokeColor=#1e3a5f;';
const S_SUB = 'rounded=0;whiteSpace=wrap;html=1;fillColor=#e8f1f8;fontColor=#1e3a5f;fontSize=10;strokeColor=#94a3b8;align=left;spacingLeft=10;';
const S_POOL = 'swimlane;horizontal=0;whiteSpace=wrap;html=1;fillColor=#ffffff;strokeColor=#334155;startSize=0;collapsible=0;';
const S_LANE = 'swimlane;horizontal=0;whiteSpace=wrap;html=1;strokeColor=#64748b;fontStyle=1;startSize=36;fontSize=11;';
const S_START = 'ellipse;whiteSpace=wrap;html=1;aspect=fixed;fillColor=#22c55e;fontColor=#fff;strokeColor=#15803d;fontStyle=1;fontSize=10;';
const S_END = 'ellipse;whiteSpace=wrap;html=1;aspect=fixed;fillColor=#3b82f6;fontColor=#fff;strokeColor=#1d4ed8;fontStyle=1;fontSize=10;';
const S_TASK = 'rounded=1;whiteSpace=wrap;html=1;fillColor=#ffffff;strokeColor=#334155;fontSize=10;';
const S_OK = 'rounded=1;whiteSpace=wrap;html=1;fillColor=#bbf7d0;strokeColor=#15803d;fontSize=10;';
const S_NO = 'rounded=1;whiteSpace=wrap;html=1;fillColor=#fecaca;strokeColor=#b91c1c;fontSize=10;';
const S_GW = 'rhombus;whiteSpace=wrap;html=1;fillColor=#fdba74;strokeColor=#c2410c;fontSize=9;fontStyle=1;';

function renderModule(array $m): array
{
    $laneW = 270;
    $n = count($m['lanes']);
    $poolW = $n * $laneW;
    $maxY = 80;
    foreach ($m['nodes'] as $n0) {
        $maxY = max($maxY, (int) $n0['y'] + 80);
    }
    $poolH = $maxY + 40;
    $pageW = $poolW + 80;
    $pageH = $poolH + 140;

    $xml = cell('title', '1', S_TITLE, $m['title'], 40, 16, $poolW, 40)
        .cell('sub', '1', S_SUB, $m['subtitle'], 40, 56, $poolW, 28)
        .cell('pool', '1', S_POOL, '', 40, 92, $poolW, $poolH);

    $x = 0;
    foreach ($m['lanes'] as $i => $lane) {
        $xml .= cell(
            $lane['id'],
            'pool',
            S_LANE.'fillColor='.$lane['color'].';',
            $lane['label'],
            $x,
            0,
            $laneW,
            $poolH
        );
        $x += $laneW;
    }

    $styles = [
        'start' => [S_START, 105, 60, 60],
        'end' => [S_END, 105, 60, 60],
        'task' => [S_TASK, 50, 170, 48],
        'ok' => [S_OK, 50, 170, 44],
        'no' => [S_NO, 50, 170, 44],
        'gw' => [S_GW, 80, 110, 70],
    ];

    foreach ($m['nodes'] as $node) {
        [$style, $nx, $nw, $nh] = $styles[$node['type']];
        $xml .= cell($node['id'], $node['lane'], $style, $node['label'], $nx, $node['y'], $nw, $nh);
    }

    foreach ($m['edges'] as $e) {
        $xml .= edge(
            $e['id'],
            $e['from'],
            $e['to'],
            $e['label'] ?? '',
            !empty($e['dashed']),
            $e['color'] ?? '#0f172a'
        );
    }

    $diagram = sprintf(
        '<diagram id="%s" name="%s"><mxGraphModel dx="1400" dy="900" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="%d" pageHeight="%d" math="0" shadow="0"><root><mxCell id="0"/><mxCell id="1" parent="0"/>%s</root></mxGraphModel></diagram>',
        esc($m['id']),
        esc($m['name']),
        $pageW,
        $pageH,
        $xml
    );

    return ['diagram' => $diagram, 'file' => $m['file']];
}

$modules = [];

// 1 — Training Module
$modules[] = [
    'id' => 'bpmn-tm',
    'name' => '1 · Training Module',
    'file' => '20_BPMN_Training_Module.drawio',
    'title' => 'BPMN — Training Module (TO-BE)',
    'subtitle' => 'Create / publish modules and lessons. Campaign submit is NOT this module.',
    'lanes' => [
        ['id' => 'L1', 'label' => '1 · Lead Trainer / Admin', 'color' => '#fff7ed'],
        ['id' => 'L2', 'label' => '2 · Platform', 'color' => '#f0fdf4'],
        ['id' => 'L3', 'label' => '3 · Participant', 'color' => '#eff6ff'],
    ],
    'nodes' => [
        ['id' => 's', 'lane' => 'L1', 'type' => 'start', 'label' => 'Start', 'y' => 50],
        ['id' => 'a1', 'lane' => 'L1', 'type' => 'task', 'label' => 'Create / edit module', 'y' => 140],
        ['id' => 'a2', 'lane' => 'L1', 'type' => 'task', 'label' => 'Add lessons & resources', 'y' => 230],
        ['id' => 'g1', 'lane' => 'L1', 'type' => 'gw', 'label' => 'Publish?', 'y' => 320],
        ['id' => 'a3', 'lane' => 'L1', 'type' => 'ok', 'label' => 'Publish module', 'y' => 430],
        ['id' => 'a4', 'lane' => 'L1', 'type' => 'no', 'label' => 'Keep as draft', 'y' => 520],
        ['id' => 'p1', 'lane' => 'L2', 'type' => 'task', 'label' => 'Save catalog + lessons', 'y' => 230],
        ['id' => 'p2', 'lane' => 'L2', 'type' => 'task', 'label' => 'Unlock published content', 'y' => 430],
        ['id' => 'u1', 'lane' => 'L3', 'type' => 'task', 'label' => 'Open published module', 'y' => 520],
        ['id' => 'u2', 'lane' => 'L3', 'type' => 'task', 'label' => 'Study lessons / mark progress', 'y' => 610],
        ['id' => 'p3', 'lane' => 'L2', 'type' => 'task', 'label' => 'Record lesson progress', 'y' => 610],
        ['id' => 'e', 'lane' => 'L3', 'type' => 'end', 'label' => 'End', 'y' => 700],
    ],
    'edges' => [
        ['id' => 'e1', 'from' => 's', 'to' => 'a1'],
        ['id' => 'e2', 'from' => 'a1', 'to' => 'a2'],
        ['id' => 'e3', 'from' => 'a2', 'to' => 'p1'],
        ['id' => 'e4', 'from' => 'p1', 'to' => 'g1'],
        ['id' => 'e5', 'from' => 'g1', 'to' => 'a3', 'label' => 'Yes', 'color' => '#15803d'],
        ['id' => 'e6', 'from' => 'g1', 'to' => 'a4', 'label' => 'No', 'color' => '#b91c1c'],
        ['id' => 'e7', 'from' => 'a3', 'to' => 'p2'],
        ['id' => 'e8', 'from' => 'p2', 'to' => 'u1'],
        ['id' => 'e9', 'from' => 'u1', 'to' => 'u2'],
        ['id' => 'e10', 'from' => 'u2', 'to' => 'p3'],
        ['id' => 'e11', 'from' => 'p3', 'to' => 'e'],
        ['id' => 'e12', 'from' => 'a4', 'to' => 'a2', 'label' => 'edit again', 'dashed' => true, 'color' => '#b91c1c'],
    ],
];

// 2 — AI Scenario
$modules[] = [
    'id' => 'bpmn-ai',
    'name' => '2 · AI Scenario Training',
    'file' => '21_BPMN_AI_Scenario.drawio',
    'title' => 'BPMN — AI Scenario Training (TO-BE)',
    'subtitle' => 'Lesson quiz + final AI scenario. Campaign Planning is not this module.',
    'lanes' => [
        ['id' => 'L1', 'label' => '1 · Lead Trainer / Admin', 'color' => '#fff7ed'],
        ['id' => 'L2', 'label' => '2 · Platform', 'color' => '#f0fdf4'],
        ['id' => 'L3', 'label' => '3 · Google Gemini', 'color' => '#ecfeff'],
        ['id' => 'L4', 'label' => '4 · Participant', 'color' => '#eff6ff'],
    ],
    'nodes' => [
        ['id' => 's', 'lane' => 'L1', 'type' => 'start', 'label' => 'Start', 'y' => 50],
        ['id' => 'a1', 'lane' => 'L1', 'type' => 'task', 'label' => 'Configure quiz / scenario', 'y' => 140],
        ['id' => 'a2', 'lane' => 'L1', 'type' => 'task', 'label' => 'Request AI generation', 'y' => 230],
        ['id' => 'p1', 'lane' => 'L2', 'type' => 'task', 'label' => 'Queue generation job', 'y' => 230],
        ['id' => 'g1', 'lane' => 'L3', 'type' => 'task', 'label' => 'Generate questions / scenario', 'y' => 320],
        ['id' => 'p2', 'lane' => 'L2', 'type' => 'task', 'label' => 'Save draft version', 'y' => 410],
        ['id' => 'gw', 'lane' => 'L1', 'type' => 'gw', 'label' => 'Approve?', 'y' => 490],
        ['id' => 'a3', 'lane' => 'L1', 'type' => 'ok', 'label' => 'Publish version', 'y' => 590],
        ['id' => 'a4', 'lane' => 'L1', 'type' => 'no', 'label' => 'Revise / regenerate', 'y' => 680],
        ['id' => 'u1', 'lane' => 'L4', 'type' => 'task', 'label' => 'Take quiz / final scenario', 'y' => 680],
        ['id' => 'p3', 'lane' => 'L2', 'type' => 'task', 'label' => 'Score & store attempt', 'y' => 770],
        ['id' => 'e', 'lane' => 'L4', 'type' => 'end', 'label' => 'End', 'y' => 860],
    ],
    'edges' => [
        ['id' => 'e1', 'from' => 's', 'to' => 'a1'],
        ['id' => 'e2', 'from' => 'a1', 'to' => 'a2'],
        ['id' => 'e3', 'from' => 'a2', 'to' => 'p1'],
        ['id' => 'e4', 'from' => 'p1', 'to' => 'g1'],
        ['id' => 'e5', 'from' => 'g1', 'to' => 'p2'],
        ['id' => 'e6', 'from' => 'p2', 'to' => 'gw'],
        ['id' => 'e7', 'from' => 'gw', 'to' => 'a3', 'label' => 'Yes', 'color' => '#15803d'],
        ['id' => 'e8', 'from' => 'gw', 'to' => 'a4', 'label' => 'No', 'color' => '#b91c1c'],
        ['id' => 'e9', 'from' => 'a4', 'to' => 'a2', 'dashed' => true, 'color' => '#b91c1c'],
        ['id' => 'e10', 'from' => 'a3', 'to' => 'u1'],
        ['id' => 'e11', 'from' => 'u1', 'to' => 'p3'],
        ['id' => 'e12', 'from' => 'p3', 'to' => 'e'],
    ],
];

// 3 — Simulation Event Planning
$modules[] = [
    'id' => 'bpmn-sim',
    'name' => '3 · Simulation Event Planning',
    'file' => '22_BPMN_Simulation_Event.drawio',
    'title' => 'BPMN — Simulation Event Planning (TO-BE)',
    'subtitle' => 'Approved Campaign → Exercise Plan → Template → Readiness → Publish → Monitoring. No Resource Allocation (Group 3).',
    'lanes' => [
        ['id' => 'L1', 'label' => '1 · Lead Trainer / Admin', 'color' => '#fff7ed'],
        ['id' => 'L2', 'label' => '2 · Platform', 'color' => '#f0fdf4'],
        ['id' => 'L3', 'label' => '3 · Campaign Planning (G6)', 'color' => '#faf5ff'],
        ['id' => 'L4', 'label' => '4 · CPSQC Patrol', 'color' => '#ecfeff'],
    ],
    'nodes' => [
        ['id' => 's', 'lane' => 'L3', 'type' => 'start', 'label' => 'Start', 'y' => 50],
        ['id' => 'c1', 'lane' => 'L3', 'type' => 'task', 'label' => 'Approve campaign', 'y' => 140],
        ['id' => 'a1', 'lane' => 'L1', 'type' => 'task', 'label' => 'Create exercise plan', 'y' => 230],
        ['id' => 'gw1', 'lane' => 'L1', 'type' => 'gw', 'label' => 'Use template?', 'y' => 310],
        ['id' => 'a2', 'lane' => 'L1', 'type' => 'ok', 'label' => 'Apply template', 'y' => 410],
        ['id' => 'a3', 'lane' => 'L1', 'type' => 'task', 'label' => 'Custom plan setup', 'y' => 500],
        ['id' => 'a4', 'lane' => 'L1', 'type' => 'task', 'label' => 'Assign personnel / equipment', 'y' => 590],
        ['id' => 'q1', 'lane' => 'L4', 'type' => 'task', 'label' => 'Return availability', 'y' => 590],
        ['id' => 'a5', 'lane' => 'L1', 'type' => 'task', 'label' => 'Complete readiness checklist', 'y' => 680],
        ['id' => 'gw2', 'lane' => 'L2', 'type' => 'gw', 'label' => 'Ready?', 'y' => 760],
        ['id' => 'p1', 'lane' => 'L2', 'type' => 'ok', 'label' => 'Publish event', 'y' => 860],
        ['id' => 'p2', 'lane' => 'L2', 'type' => 'no', 'label' => 'Block publish / fix gaps', 'y' => 950],
        ['id' => 'a6', 'lane' => 'L1', 'type' => 'task', 'label' => 'Monitor lifecycle', 'y' => 1040],
        ['id' => 'q2', 'lane' => 'L4', 'type' => 'task', 'label' => 'Start / complete notify', 'y' => 1040],
        ['id' => 'e', 'lane' => 'L1', 'type' => 'end', 'label' => 'End', 'y' => 1130],
    ],
    'edges' => [
        ['id' => 'e1', 'from' => 's', 'to' => 'c1'],
        ['id' => 'e2', 'from' => 'c1', 'to' => 'a1'],
        ['id' => 'e3', 'from' => 'a1', 'to' => 'gw1'],
        ['id' => 'e4', 'from' => 'gw1', 'to' => 'a2', 'label' => 'Yes', 'color' => '#15803d'],
        ['id' => 'e5', 'from' => 'gw1', 'to' => 'a3', 'label' => 'No'],
        ['id' => 'e6', 'from' => 'a2', 'to' => 'a4'],
        ['id' => 'e7', 'from' => 'a3', 'to' => 'a4'],
        ['id' => 'e8', 'from' => 'a4', 'to' => 'q1', 'dashed' => true],
        ['id' => 'e9', 'from' => 'a4', 'to' => 'a5'],
        ['id' => 'e10', 'from' => 'a5', 'to' => 'gw2'],
        ['id' => 'e11', 'from' => 'gw2', 'to' => 'p1', 'label' => 'Yes', 'color' => '#15803d'],
        ['id' => 'e12', 'from' => 'gw2', 'to' => 'p2', 'label' => 'No', 'color' => '#b91c1c'],
        ['id' => 'e13', 'from' => 'p2', 'to' => 'a5', 'dashed' => true, 'color' => '#b91c1c'],
        ['id' => 'e14', 'from' => 'p1', 'to' => 'a6'],
        ['id' => 'e15', 'from' => 'a6', 'to' => 'q2', 'dashed' => true],
        ['id' => 'e16', 'from' => 'a6', 'to' => 'e'],
    ],
];

// 4 — Participant / Attendance
$modules[] = [
    'id' => 'bpmn-att',
    'name' => '4 · Participant & Attendance',
    'file' => '23_BPMN_Participant_Attendance.drawio',
    'title' => 'BPMN — Participant Registration & Attendance (TO-BE)',
    'subtitle' => 'Campaign reg unlocks training. Cancel = simulation EVENT only (module access stays).',
    'lanes' => [
        ['id' => 'L1', 'label' => '1 · Participant', 'color' => '#eff6ff'],
        ['id' => 'L2', 'label' => '2 · Platform', 'color' => '#f0fdf4'],
        ['id' => 'L3', 'label' => '3 · Evaluator / Admin', 'color' => '#fef2f2'],
        ['id' => 'L4', 'label' => '4 · Campaign Planning (G6)', 'color' => '#faf5ff'],
    ],
    'nodes' => [
        ['id' => 's', 'lane' => 'L4', 'type' => 'start', 'label' => 'Start', 'y' => 50],
        ['id' => 'c1', 'lane' => 'L4', 'type' => 'task', 'label' => 'Open campaign window', 'y' => 140],
        ['id' => 'u1', 'lane' => 'L1', 'type' => 'task', 'label' => 'Register for campaign', 'y' => 230],
        ['id' => 'p1', 'lane' => 'L2', 'type' => 'task', 'label' => 'Unlock training module', 'y' => 230],
        ['id' => 'u2', 'lane' => 'L1', 'type' => 'task', 'label' => 'Register for event', 'y' => 340],
        ['id' => 'gw1', 'lane' => 'L3', 'type' => 'gw', 'label' => 'Approve seat?', 'y' => 410],
        ['id' => 'a1', 'lane' => 'L3', 'type' => 'ok', 'label' => 'Approve registration', 'y' => 510],
        ['id' => 'a2', 'lane' => 'L3', 'type' => 'no', 'label' => 'Reject / waitlist', 'y' => 600],
        ['id' => 'gw2', 'lane' => 'L1', 'type' => 'gw', 'label' => 'Cancel event?', 'y' => 680],
        ['id' => 'u3', 'lane' => 'L1', 'type' => 'no', 'label' => 'Cancel event reg only', 'y' => 770],
        ['id' => 'u4', 'lane' => 'L1', 'type' => 'task', 'label' => 'Attend / QR check-in', 'y' => 860],
        ['id' => 'a3', 'lane' => 'L3', 'type' => 'task', 'label' => 'Mark attendance', 'y' => 860],
        ['id' => 'p2', 'lane' => 'L2', 'type' => 'task', 'label' => 'Lock & export sheet', 'y' => 950],
        ['id' => 'e', 'lane' => 'L2', 'type' => 'end', 'label' => 'End', 'y' => 1040],
    ],
    'edges' => [
        ['id' => 'e1', 'from' => 's', 'to' => 'c1'],
        ['id' => 'e2', 'from' => 'c1', 'to' => 'u1'],
        ['id' => 'e3', 'from' => 'u1', 'to' => 'p1'],
        ['id' => 'e4', 'from' => 'p1', 'to' => 'u2'],
        ['id' => 'e5', 'from' => 'u2', 'to' => 'gw1'],
        ['id' => 'e6', 'from' => 'gw1', 'to' => 'a1', 'label' => 'Yes', 'color' => '#15803d'],
        ['id' => 'e7', 'from' => 'gw1', 'to' => 'a2', 'label' => 'No', 'color' => '#b91c1c'],
        ['id' => 'e8', 'from' => 'a1', 'to' => 'gw2'],
        ['id' => 'e9', 'from' => 'gw2', 'to' => 'u3', 'label' => 'Yes', 'color' => '#b91c1c'],
        ['id' => 'e10', 'from' => 'gw2', 'to' => 'u4', 'label' => 'No'],
        ['id' => 'e11', 'from' => 'u4', 'to' => 'a3'],
        ['id' => 'e12', 'from' => 'a3', 'to' => 'p2'],
        ['id' => 'e13', 'from' => 'p2', 'to' => 'e'],
        ['id' => 'e14', 'from' => 'u3', 'to' => 'u2', 'label' => 're-register', 'dashed' => true, 'color' => '#b91c1c'],
    ],
];

// 5 — Resource Inventory (NO Group 3)
$modules[] = [
    'id' => 'bpmn-inv',
    'name' => '5 · Resource Inventory',
    'file' => '24_BPMN_Resource_Inventory.drawio',
    'title' => 'BPMN — Resource & Equipment Inventory (TO-BE)',
    'subtitle' => 'Internal inventory only. Resource Allocation (Group 3) is not connected.',
    'lanes' => [
        ['id' => 'L1', 'label' => '1 · Lead Trainer / Admin', 'color' => '#fff7ed'],
        ['id' => 'L2', 'label' => '2 · Platform', 'color' => '#f0fdf4'],
        ['id' => 'L3', 'label' => '3 · Simulation Event Planning', 'color' => '#eff6ff'],
        ['id' => 'L4', 'label' => '4 · Budget Approver', 'color' => '#fefce8'],
    ],
    'nodes' => [
        ['id' => 's', 'lane' => 'L1', 'type' => 'start', 'label' => 'Start', 'y' => 50],
        ['id' => 'a1', 'lane' => 'L1', 'type' => 'task', 'label' => 'Maintain equipment catalog', 'y' => 140],
        ['id' => 'ev1', 'lane' => 'L3', 'type' => 'task', 'label' => 'Request equipment for event', 'y' => 230],
        ['id' => 'gw1', 'lane' => 'L2', 'type' => 'gw', 'label' => 'Stock OK?', 'y' => 310],
        ['id' => 'p1', 'lane' => 'L2', 'type' => 'ok', 'label' => 'Assign to event', 'y' => 410],
        ['id' => 'p2', 'lane' => 'L2', 'type' => 'no', 'label' => 'Hold / find substitute', 'y' => 500],
        ['id' => 'a2', 'lane' => 'L1', 'type' => 'task', 'label' => 'Track usage / damage', 'y' => 590],
        ['id' => 'a3', 'lane' => 'L1', 'type' => 'task', 'label' => 'Return from event', 'y' => 680],
        ['id' => 'gw2', 'lane' => 'L1', 'type' => 'gw', 'label' => 'Need budget?', 'y' => 760],
        ['id' => 'b1', 'lane' => 'L4', 'type' => 'task', 'label' => 'Approve / reject proposal', 'y' => 860],
        ['id' => 'p3', 'lane' => 'L2', 'type' => 'task', 'label' => 'Restock catalog', 'y' => 950],
        ['id' => 'e', 'lane' => 'L2', 'type' => 'end', 'label' => 'End', 'y' => 1040],
    ],
    'edges' => [
        ['id' => 'e1', 'from' => 's', 'to' => 'a1'],
        ['id' => 'e2', 'from' => 'a1', 'to' => 'ev1'],
        ['id' => 'e3', 'from' => 'ev1', 'to' => 'gw1'],
        ['id' => 'e4', 'from' => 'gw1', 'to' => 'p1', 'label' => 'Yes', 'color' => '#15803d'],
        ['id' => 'e5', 'from' => 'gw1', 'to' => 'p2', 'label' => 'No', 'color' => '#b91c1c'],
        ['id' => 'e6', 'from' => 'p1', 'to' => 'a2'],
        ['id' => 'e7', 'from' => 'p2', 'to' => 'ev1', 'dashed' => true, 'color' => '#b91c1c'],
        ['id' => 'e8', 'from' => 'a2', 'to' => 'a3'],
        ['id' => 'e9', 'from' => 'a3', 'to' => 'gw2'],
        ['id' => 'e10', 'from' => 'gw2', 'to' => 'b1', 'label' => 'Yes'],
        ['id' => 'e11', 'from' => 'gw2', 'to' => 'p3', 'label' => 'No'],
        ['id' => 'e12', 'from' => 'b1', 'to' => 'p3'],
        ['id' => 'e13', 'from' => 'p3', 'to' => 'e'],
    ],
];

// 6 — Evaluation
$modules[] = [
    'id' => 'bpmn-eval',
    'name' => '6 · Evaluation & Scoring',
    'file' => '25_BPMN_Evaluation_Scoring.drawio',
    'title' => 'BPMN — Evaluation & Scoring (TO-BE)',
    'subtitle' => 'Training results hub + simulation drill scoring. Present roster only.',
    'lanes' => [
        ['id' => 'L1', 'label' => '1 · Evaluator', 'color' => '#fef2f2'],
        ['id' => 'L2', 'label' => '2 · Platform', 'color' => '#f0fdf4'],
        ['id' => 'L3', 'label' => '3 · Participant', 'color' => '#eff6ff'],
    ],
    'nodes' => [
        ['id' => 's', 'lane' => 'L1', 'type' => 'start', 'label' => 'Start', 'y' => 50],
        ['id' => 'p1', 'lane' => 'L2', 'type' => 'task', 'label' => 'Ingest quiz / scenario scores', 'y' => 140],
        ['id' => 'p2', 'lane' => 'L2', 'type' => 'task', 'label' => 'Load present roster', 'y' => 230],
        ['id' => 'a1', 'lane' => 'L1', 'type' => 'task', 'label' => 'Score drill criteria', 'y' => 320],
        ['id' => 'p3', 'lane' => 'L2', 'type' => 'task', 'label' => 'Compute total / pass-fail', 'y' => 410],
        ['id' => 'gw', 'lane' => 'L1', 'type' => 'gw', 'label' => 'Lock now?', 'y' => 490],
        ['id' => 'a2', 'lane' => 'L1', 'type' => 'ok', 'label' => 'Lock evaluation', 'y' => 590],
        ['id' => 'a3', 'lane' => 'L1', 'type' => 'task', 'label' => 'Keep open / revise', 'y' => 680],
        ['id' => 'u1', 'lane' => 'L3', 'type' => 'task', 'label' => 'View portfolio / scores', 'y' => 770],
        ['id' => 'p4', 'lane' => 'L2', 'type' => 'task', 'label' => 'Export summary (CSV)', 'y' => 860],
        ['id' => 'e', 'lane' => 'L2', 'type' => 'end', 'label' => 'End', 'y' => 950],
    ],
    'edges' => [
        ['id' => 'e1', 'from' => 's', 'to' => 'p1'],
        ['id' => 'e2', 'from' => 'p1', 'to' => 'p2'],
        ['id' => 'e3', 'from' => 'p2', 'to' => 'a1'],
        ['id' => 'e4', 'from' => 'a1', 'to' => 'p3'],
        ['id' => 'e5', 'from' => 'p3', 'to' => 'gw'],
        ['id' => 'e6', 'from' => 'gw', 'to' => 'a2', 'label' => 'Yes', 'color' => '#15803d'],
        ['id' => 'e7', 'from' => 'gw', 'to' => 'a3', 'label' => 'No'],
        ['id' => 'e8', 'from' => 'a3', 'to' => 'a1', 'dashed' => true],
        ['id' => 'e9', 'from' => 'a2', 'to' => 'u1'],
        ['id' => 'e10', 'from' => 'u1', 'to' => 'p4'],
        ['id' => 'e11', 'from' => 'p4', 'to' => 'e'],
    ],
];

// 7 — Certification
$modules[] = [
    'id' => 'bpmn-cert',
    'name' => '7 · Certification Issuance',
    'file' => '26_BPMN_Certification.drawio',
    'title' => 'BPMN — Certification Issuance (TO-BE)',
    'subtitle' => 'Internal certificates. External cert authority API is future / optional.',
    'lanes' => [
        ['id' => 'L1', 'label' => '1 · Lead Trainer / Admin', 'color' => '#fff7ed'],
        ['id' => 'L2', 'label' => '2 · Platform', 'color' => '#f0fdf4'],
        ['id' => 'L3', 'label' => '3 · Participant', 'color' => '#eff6ff'],
        ['id' => 'L4', 'label' => '4 · Public Verifier', 'color' => '#f0fdf4'],
    ],
    'nodes' => [
        ['id' => 's', 'lane' => 'L1', 'type' => 'start', 'label' => 'Start', 'y' => 50],
        ['id' => 'a1', 'lane' => 'L1', 'type' => 'task', 'label' => 'Set template / settings', 'y' => 140],
        ['id' => 'p1', 'lane' => 'L2', 'type' => 'task', 'label' => 'Check eligibility', 'y' => 230],
        ['id' => 'gw1', 'lane' => 'L2', 'type' => 'gw', 'label' => 'Eligible?', 'y' => 310],
        ['id' => 'p2', 'lane' => 'L2', 'type' => 'ok', 'label' => 'Issue certificate', 'y' => 410],
        ['id' => 'p3', 'lane' => 'L2', 'type' => 'no', 'label' => 'Hold (not yet eligible)', 'y' => 500],
        ['id' => 'u1', 'lane' => 'L3', 'type' => 'task', 'label' => 'View / email certificate', 'y' => 590],
        ['id' => 'gw2', 'lane' => 'L1', 'type' => 'gw', 'label' => 'Revoke?', 'y' => 670],
        ['id' => 'a2', 'lane' => 'L1', 'type' => 'no', 'label' => 'Revoke / reissue', 'y' => 770],
        ['id' => 'v1', 'lane' => 'L4', 'type' => 'task', 'label' => 'Scan QR / verify token', 'y' => 860],
        ['id' => 'p4', 'lane' => 'L2', 'type' => 'task', 'label' => 'Return valid / revoked', 'y' => 950],
        ['id' => 'e', 'lane' => 'L4', 'type' => 'end', 'label' => 'End', 'y' => 1040],
    ],
    'edges' => [
        ['id' => 'e1', 'from' => 's', 'to' => 'a1'],
        ['id' => 'e2', 'from' => 'a1', 'to' => 'p1'],
        ['id' => 'e3', 'from' => 'p1', 'to' => 'gw1'],
        ['id' => 'e4', 'from' => 'gw1', 'to' => 'p2', 'label' => 'Yes', 'color' => '#15803d'],
        ['id' => 'e5', 'from' => 'gw1', 'to' => 'p3', 'label' => 'No', 'color' => '#b91c1c'],
        ['id' => 'e6', 'from' => 'p2', 'to' => 'u1'],
        ['id' => 'e7', 'from' => 'u1', 'to' => 'gw2'],
        ['id' => 'e8', 'from' => 'gw2', 'to' => 'a2', 'label' => 'Yes', 'color' => '#b91c1c'],
        ['id' => 'e9', 'from' => 'gw2', 'to' => 'v1', 'label' => 'No'],
        ['id' => 'e10', 'from' => 'a2', 'to' => 'p4'],
        ['id' => 'e11', 'from' => 'v1', 'to' => 'p4'],
        ['id' => 'e12', 'from' => 'p4', 'to' => 'e'],
    ],
];

// 8 — Hazard Assessment
$modules[] = [
    'id' => 'bpmn-haz',
    'name' => '8 · Hazard Assessment',
    'file' => '27_BPMN_Hazard_Assessment.drawio',
    'title' => 'BPMN — Hazard Assessment Profile (TO-BE)',
    'subtitle' => 'San Agustin profile + hazards + docs → intelligence for Training, AI, and Simulation.',
    'lanes' => [
        ['id' => 'L1', 'label' => '1 · Lead Trainer / Admin', 'color' => '#fff7ed'],
        ['id' => 'L2', 'label' => '2 · Platform', 'color' => '#f0fdf4'],
        ['id' => 'L3', 'label' => '3 · Consuming Modules', 'color' => '#eff6ff'],
    ],
    'nodes' => [
        ['id' => 's', 'lane' => 'L1', 'type' => 'start', 'label' => 'Start', 'y' => 50],
        ['id' => 'a1', 'lane' => 'L1', 'type' => 'task', 'label' => 'Create / update barangay profile', 'y' => 140],
        ['id' => 'a2', 'lane' => 'L1', 'type' => 'task', 'label' => 'Capture hazard records', 'y' => 230],
        ['id' => 'a3', 'lane' => 'L1', 'type' => 'task', 'label' => 'Upload supporting documents', 'y' => 320],
        ['id' => 'p1', 'lane' => 'L2', 'type' => 'task', 'label' => 'Save profile / hazards / docs', 'y' => 320],
        ['id' => 'p2', 'lane' => 'L2', 'type' => 'task', 'label' => 'Build intelligence package', 'y' => 430],
        ['id' => 'c1', 'lane' => 'L3', 'type' => 'task', 'label' => 'Training: recommended modules', 'y' => 520],
        ['id' => 'c2', 'lane' => 'L3', 'type' => 'task', 'label' => 'AI: hazard context for scenarios', 'y' => 610],
        ['id' => 'c3', 'lane' => 'L3', 'type' => 'task', 'label' => 'Simulation: exercise context', 'y' => 700],
        ['id' => 'e', 'lane' => 'L2', 'type' => 'end', 'label' => 'End', 'y' => 790],
    ],
    'edges' => [
        ['id' => 'e1', 'from' => 's', 'to' => 'a1'],
        ['id' => 'e2', 'from' => 'a1', 'to' => 'a2'],
        ['id' => 'e3', 'from' => 'a2', 'to' => 'a3'],
        ['id' => 'e4', 'from' => 'a3', 'to' => 'p1'],
        ['id' => 'e5', 'from' => 'p1', 'to' => 'p2'],
        ['id' => 'e6', 'from' => 'p2', 'to' => 'c1'],
        ['id' => 'e7', 'from' => 'c1', 'to' => 'c2'],
        ['id' => 'e8', 'from' => 'c2', 'to' => 'c3'],
        ['id' => 'e9', 'from' => 'c3', 'to' => 'e'],
    ],
];

$combined = '';
foreach ($modules as $m) {
    $out = renderModule($m);
    $xml = '<?xml version="1.0" encoding="UTF-8"?>'."\n"
        .'<mxfile host="app.diagrams.net" agent="Cursor" version="22.1.0" type="device">'
        .$out['diagram']
        .'</mxfile>';
    file_put_contents($outDir.'/'.$out['file'], $xml);
    $combined .= $out['diagram'];
    echo "Wrote {$out['file']}\n";
}

file_put_contents(
    $outDir.'/20_BPMN_Modules_All.drawio',
    '<?xml version="1.0" encoding="UTF-8"?>'."\n"
    .'<mxfile host="app.diagrams.net" agent="Cursor" version="22.1.0" type="device">'
    .$combined
    .'</mxfile>'
);
echo "Wrote 20_BPMN_Modules_All.drawio (8 tabs)\n";
