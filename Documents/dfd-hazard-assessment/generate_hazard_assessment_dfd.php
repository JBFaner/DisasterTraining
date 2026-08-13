<?php

/**
 * DFD Level 0, 1, 2 — Hazard Assessment Profile module.
 * Covers: barangay profiles, hazard records, documents, intelligence recommendations.
 * Run: php Documents/dfd-hazard-assessment/generate_hazard_assessment_dfd.php
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
$l0 = title('DFD Level 0 — Hazard Assessment Profile (Context)')
    .entity('e_admin', "Lead Trainer /\nLGU Admin", 60, 160)
    .entity('e_train', "Training Module", 1080, 120, 170, 64, '#f0fdf4')
    .entity('e_sim', "Simulation Event\nPlanning", 1080, 300, 170, 64, '#ecfeff')
    .entity('e_ai', "AI Scenario\nTraining", 1080, 480, 170, 64, '#eff6ff')
    .entity('e_inv', "Resource &\nEquipment Inventory", 1080, 640, 170, 64, '#fef3c7')
    .process('p0', "0\nHazard Assessment\nProfile", 500, 300, 180)
    .flow('f1', 'e_admin', 'p0', 'Create/edit barangay profile, hazards, documents')
    .flow('f2', 'p0', 'e_admin', 'Profile list, intelligence package, downloads')
    .flow('f3', 'e_train', 'p0', 'Published modules for matching')
    .flow('f4', 'p0', 'e_train', 'Recommended modules / communities')
    .flow('f5', 'p0', 'e_sim', 'Hazard context for exercise planning')
    .flow('f6', 'p0', 'e_ai', 'AI context / scenario suggestions')
    .flow('f7', 'p0', 'e_inv', 'Suggested equipment for hazards')
    .note('Level 0: Local barangay hazard profiles + supporting docs. Intelligence recommends training, scenarios, equipment, trainers — does not own those modules.');

// ─── LEVEL 1 ───────────────────────────────────────────────────────────────
$l1 = title('DFD Level 1 — Hazard Assessment Profile (Decomposition)')
    .entity('e_admin', "Lead Trainer /\nAdmin", 40, 100)
    .entity('e_train', "Training Module", 1080, 200, 160, 64, '#f0fdf4')
    .entity('e_sim', "Simulation Event\nPlanning", 1080, 420, 160, 64, '#ecfeff')
    .entity('e_ai', "AI Scenario\nTraining", 1080, 620, 160, 64, '#eff6ff')
    .process('p1', "1.0\nManage Barangay\nProfile", 260, 80, 105)
    .process('p2', "2.0\nCapture Hazard\nRecords", 260, 240, 105)
    .process('p3', "3.0\nManage Supporting\nDocuments", 260, 400, 105)
    .process('p4', "4.0\nGenerate Intelligence\nRecommendations", 260, 560, 105)
    .process('p5', "5.0\nExpose Profile &\nAnalytics", 260, 700, 105)
    .store('d1', "D1\nBarangay Profiles", 560, 80)
    .store('d2', "D2\nHazard Records", 560, 240)
    .store('d3', "D3\nSupporting\nDocuments", 560, 400)
    .store('d4', "D4\nIntelligence\nPackage (derived)", 560, 560)
    .store('d5', "D5\nTraining Catalog\n(read)", 560, 700)
    .flow('l1f1', 'e_admin', 'p1', 'Create / update / delete profile')
    .flow('l1f2', 'p1', 'd1', 'BarangayProfile master')
    .flow('l1f3', 'd1', 'p1', 'Profile form data')
    .flow('l1f4', 'e_admin', 'p2', 'Hazard types / severity / notes')
    .flow('l1f5', 'd1', 'p2', 'Profile link')
    .flow('l1f6', 'p2', 'd2', 'BarangayHazard rows')
    .flow('l1f7', 'e_admin', 'p3', 'Upload / delete documents')
    .flow('l1f8', 'd1', 'p3', 'Profile context')
    .flow('l1f9', 'p3', 'd3', 'HazardAssessmentDocument')
    .flow('l1f10', 'd3', 'p3', 'Download path')
    .flow('l1f11', 'e_admin', 'p4', 'Open intelligence view')
    .flow('l1f12', 'd1', 'p4', 'Profile demographics')
    .flow('l1f13', 'd2', 'p4', 'Hazard list')
    .flow('l1f14', 'd5', 'p4', 'Published modules')
    .flow('l1f15', 'e_train', 'p4', 'Module hazard tags')
    .flow('l1f16', 'p4', 'd4', 'Recommendations package')
    .flow('l1f17', 'p4', 'e_admin', 'Training / scenario / equipment / trainer tips')
    .flow('l1f18', 'e_admin', 'p5', 'List / API / analytics')
    .flow('l1f19', 'd1', 'p5', 'Profiles')
    .flow('l1f20', 'd2', 'p5', 'Hazard summary')
    .flow('l1f21', 'd4', 'p5', 'Intelligence summary')
    .flow('l1f22', 'p5', 'e_sim', 'Hazard context for planning')
    .flow('l1f23', 'p5', 'e_ai', 'AI context string')
    .flow('l1f24', 'p5', 'e_train', 'Recommended communities')
    .note('Level 1: Profile → Hazards → Documents → Intelligence → Expose to other modules. Documents are .docx supporting evidence (e.g. San Agustin).');

// ─── LEVEL 2 — Process 4.0 Generate Intelligence ───────────────────────────
$l2 = title('DFD Level 2 — Process 4.0 Generate Intelligence Recommendations (Detail)')
    .entity('e_admin', "Lead Trainer /\nAdmin", 40, 280)
    .entity('e_train', "Training Module", 1080, 200, 150, 64, '#f0fdf4')
    .entity('e_inv', "Resource Inventory", 1080, 480, 150, 64, '#fef3c7')
    .process('p41', "4.1\nLoad Profile &\nHazards", 260, 100, 100)
    .process('p42', "4.2\nMatch Training\nModules", 260, 280, 100)
    .process('p43', "4.3\nSuggest Scenarios\nEquipment Trainers", 260, 460, 100)
    .process('p44', "4.4\nBuild Intelligence\nPackage", 260, 640, 100)
    .store('d1', "D1\nBarangay Profiles", 560, 100, 160, 44)
    .store('d2', "D2\nHazard Records", 560, 240, 160, 44)
    .store('d5', "D5\nTraining Catalog\n(read)", 560, 400, 160, 44)
    .store('d4', "D4\nIntelligence\nPackage", 560, 600, 160, 44)
    .flow('l2f1', 'e_admin', 'p41', 'Open intelligence page')
    .flow('l2f2', 'd1', 'p41', 'Profile fields')
    .flow('l2f3', 'd2', 'p41', 'Hazard types / severity')
    .flow('l2f4', 'p41', 'p42', 'Normalized hazard keywords')
    .flow('l2f5', 'e_train', 'p42', 'Published modules')
    .flow('l2f6', 'd5', 'p42', 'Module hazard tags')
    .flow('l2f7', 'p42', 'p43', 'Matched module list')
    .flow('l2f8', 'e_inv', 'p43', 'Equipment catalog cues')
    .flow('l2f9', 'p43', 'p44', 'Scenario / equipment / trainer suggestions')
    .flow('l2f10', 'p44', 'd4', 'Intelligence package saved/derived')
    .flow('l2f11', 'p44', 'e_admin', 'UI package display')
    .note('Level 2 maps to HazardTrainingRecommendationService::buildIntelligencePackage / recommendTrainingModules / suggestScenarios / suggestEquipment / suggestTrainers.');

$pages = [
    ['id' => 'haz-l0', 'name' => 'Level 0 — Context', 'body' => $l0, 'file' => '17_DFD_Hazard_Assessment_L0.drawio'],
    ['id' => 'haz-l1', 'name' => 'Level 1 — Decomposition', 'body' => $l1, 'file' => '17_DFD_Hazard_Assessment_L1.drawio'],
    ['id' => 'haz-l2', 'name' => 'Level 2 — Process 4.0 Detail', 'body' => $l2, 'file' => '17_DFD_Hazard_Assessment_L2.drawio'],
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
file_put_contents($outDir.'/17_DFD_Hazard_Assessment_L0_L1_L2.drawio', $all);
echo "Wrote 17_DFD_Hazard_Assessment_L0_L1_L2.drawio (3 tabs)\n";
