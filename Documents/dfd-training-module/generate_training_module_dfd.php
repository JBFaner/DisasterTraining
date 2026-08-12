<?php

/**
 * DFD Level 0, 1, 2 — Training Module Management only.
 * Run: php Documents/dfd-training-module/generate_training_module_dfd.php
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

function store(string $id, string $label, int $x, int $y, int $w = 150, int $h = 44): string
{
    return sprintf(
        '<mxCell id="%s" value="%s" style="shape=partialRectangle;whiteSpace=wrap;html=1;leftSpacing=0;fillColor=#fef9c3;strokeColor=#854d0e;fontStyle=1;fontSize=10;align=left;spacingLeft=8;" vertex="1" parent="1"><mxGeometry x="%d" y="%d" width="%d" height="%d" as="geometry"/></mxCell>',
        esc($id), esc($label), $x, $y, $w, $h
    );
}

function flow(string $id, string $from, string $to, string $label, string $style = ''): string
{
    $base = 'edgeStyle=orthogonalEdgeStyle;rounded=0;html=1;strokeWidth=1.5;strokeColor=#0f172a;endArrow=block;endFill=1;fontSize=9;';
    return sprintf(
        '<mxCell id="%s" value="%s" style="%s%s" edge="1" parent="1" source="%s" target="%s"><mxGeometry relative="1" as="geometry"/></mxCell>',
        esc($id), esc($label), $base, $style, esc($from), esc($to)
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
$l0 = title('DFD Level 0 — Training Module Management (Context)')
    .entity('e_admin', "Lead Trainer /\nLGU Admin", 60, 180)
    .entity('e_part', "Participant", 60, 480, 150, 64, '#eff6ff')
    .entity('e_gem', "Google Gemini\nAPI", 1080, 320, 150, 64, '#ecfeff')
    .process('p0', "0\nTraining Module\nManagement", 520, 320, 180)
    .flow('f1', 'e_admin', 'p0', 'Module metadata, lessons, resources, publish/archive')
    .flow('f2', 'p0', 'e_admin', 'Module list, status, print export')
    .flow('f3', 'e_part', 'p0', 'View lessons, mark progress, quiz attempts')
    .flow('f4', 'p0', 'e_part', 'Published content, objectives, resources')
    .flow('f5', 'p0', 'e_gem', 'AI draft prompt (title, hazard, difficulty)')
    .flow('f6', 'e_gem', 'p0', 'Generated outline / lesson draft')
    .note('Level 0: entire Training Module boundary as Process 0. No internal processes or data stores yet.');

// ─── LEVEL 1 ───────────────────────────────────────────────────────────────
$l1 = title('DFD Level 1 — Training Module Management (Decomposition)')
    .entity('e_admin', "Lead Trainer /\nLGU Admin", 40, 120)
    .entity('e_part', "Participant", 40, 520, 150, 64, '#eff6ff')
    .entity('e_gem', "Google Gemini\nAPI", 1080, 420, 150, 64, '#ecfeff')
    .process('p1', "1.0\nCreate & Publish\nModule", 280, 100, 110)
    .process('p2', "2.0\nManage Lessons\n& Resources", 280, 260, 110)
    .process('p3', "3.0\nDeliver Training\nContent", 280, 500, 110)
    .process('p4', "4.0\nGenerate AI\nDraft", 280, 660, 110)
    .store('d1', "D1\nModule Catalog", 560, 120, 160, 48)
    .store('d2', "D2\nLessons &\nResources", 560, 280, 160, 48)
    .store('d3', "D3\nParticipant\nProgress", 560, 520, 160, 48)
    .flow('l1f1', 'e_admin', 'p1', 'Title, category, objectives, publish')
    .flow('l1f2', 'p1', 'd1', 'Module record')
    .flow('l1f3', 'd1', 'p1', 'Existing module')
    .flow('l1f4', 'p1', 'e_admin', 'Publish confirmation / errors')
    .flow('l1f5', 'e_admin', 'p2', 'Lesson text, attachments, reorder')
    .flow('l1f6', 'p2', 'd2', 'Content + resources')
    .flow('l1f7', 'd2', 'p2', 'Lesson list')
    .flow('l1f8', 'd1', 'p2', 'Module link')
    .flow('l1f9', 'p2', 'e_admin', 'Updated lesson tree')
    .flow('l1f10', 'e_part', 'p3', 'Open module, complete lesson')
    .flow('l1f11', 'd1', 'p3', 'Published module')
    .flow('l1f12', 'd2', 'p3', 'Lesson content')
    .flow('l1f13', 'p3', 'd3', 'Completion / attempt')
    .flow('l1f14', 'd3', 'p3', 'Progress state')
    .flow('l1f15', 'p3', 'e_part', 'Lessons, resources, progress %')
    .flow('l1f16', 'e_admin', 'p4', 'Generate AI module request')
    .flow('l1f17', 'p4', 'e_gem', 'Prompt')
    .flow('l1f18', 'e_gem', 'p4', 'AI response')
    .flow('l1f19', 'p4', 'd1', 'Draft module fields')
    .flow('l1f20', 'p4', 'd2', 'Draft lessons')
    .flow('l1f21', 'p4', 'e_admin', 'Preview draft')
    .note('Level 1: four internal processes + three data stores. Campaign submit is outside this module (Campaign Integration DFD).');

// ─── LEVEL 2 (decompose 2.0 Manage Lessons & Resources) ───────────────────
$l2 = title('DFD Level 2 — Process 2.0 Manage Lessons & Resources (Detail)')
    .entity('e_admin', "Lead Trainer /\nLGU Admin", 40, 280)
    .process('p21', "2.1\nValidate &\nSave Lesson", 260, 120, 100)
    .process('p22', "2.2\nAttach Learning\nResource", 260, 280, 100)
    .process('p23', "2.3\nReorder\nContents", 260, 440, 100)
    .process('p24', "2.4\nRemove Lesson\nor Resource", 260, 600, 100)
    .store('d1', "D1\nModule Catalog", 560, 140, 160, 44)
    .store('d2', "D2\nLessons &\nResources", 560, 300, 160, 44)
    .store('d2b', "D2b\nResource Files\n(storage)", 560, 460, 160, 44)
    .flow('l2f1', 'e_admin', 'p21', 'Lesson title, body, order')
    .flow('l2f2', 'd1', 'p21', 'Parent module ID')
    .flow('l2f3', 'p21', 'd2', 'Lesson row')
    .flow('l2f4', 'p21', 'e_admin', 'Validation result')
    .flow('l2f5', 'e_admin', 'p22', 'PDF / image / video file')
    .flow('l2f6', 'd2', 'p22', 'Target lesson')
    .flow('l2f7', 'p22', 'd2b', 'Stored file path')
    .flow('l2f8', 'p22', 'd2', 'Resource metadata link')
    .flow('l2f9', 'e_admin', 'p23', 'New sort order')
    .flow('l2f10', 'd2', 'p23', 'Current sequence')
    .flow('l2f11', 'p23', 'd2', 'Updated order')
    .flow('l2f12', 'e_admin', 'p24', 'Delete lesson / resource ID')
    .flow('l2f13', 'd2', 'p24', 'Row to delete')
    .flow('l2f14', 'p24', 'd2b', 'Remove file (if any)')
    .flow('l2f15', 'p24', 'd2', 'Delete record')
    .flow('l2f16', 'p24', 'e_admin', 'Delete confirmation')
    .note('Level 2: zooms into Process 2.0 from Level 1. Sub-processes 2.1–2.4 map to TrainingModuleController content CRUD in the app.');

$pages = [
    ['id' => 'tm-l0', 'name' => 'Level 0 — Context', 'body' => $l0, 'file' => '10_DFD_Training_Module_L0.drawio'],
    ['id' => 'tm-l1', 'name' => 'Level 1 — Decomposition', 'body' => $l1, 'file' => '10_DFD_Training_Module_L1.drawio'],
    ['id' => 'tm-l2', 'name' => 'Level 2 — Process 2.0 Detail', 'body' => $l2, 'file' => '10_DFD_Training_Module_L2.drawio'],
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
file_put_contents($outDir.'/10_DFD_Training_Module_L0_L1_L2.drawio', $all);
echo "Wrote 10_DFD_Training_Module_L0_L1_L2.drawio (3 tabs)\n";
