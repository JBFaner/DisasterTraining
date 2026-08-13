<?php

/**
 * DFD Level 0, 1, 2 — AI Scenario Training module.
 * Covers: Lesson Quiz Generator + Final AI Scenario Assessment.
 * Run: php Documents/dfd-ai-scenario/generate_ai_scenario_dfd.php
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

function store(string $id, string $label, int $x, int $y, int $w = 160, int $h = 48): string
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
$l0 = title('DFD Level 0 — AI Scenario Training (Context)')
    .entity('e_admin', "Lead Trainer /\nLGU Admin", 60, 160)
    .entity('e_part', "Participant", 60, 480, 150, 64, '#eff6ff')
    .entity('e_train', "Training Module\n(read-only link)", 1080, 160, 160, 64, '#f0fdf4')
    .entity('e_gem', "Google Gemini\nAPI", 1080, 480, 150, 64, '#ecfeff')
    .process('p0', "0\nAI Scenario\nTraining", 520, 300, 180)
    .flow('f1', 'e_admin', 'p0', 'Quiz/scenario config, generate, publish workflow')
    .flow('f2', 'p0', 'e_admin', 'Draft versions, job status, review UI')
    .flow('f3', 'e_part', 'p0', 'Start attempt, save answers, submit')
    .flow('f4', 'p0', 'e_part', 'Quiz/scenario items, score, pass/fail')
    .flow('f5', 'e_train', 'p0', 'Lesson content, module context for prompts')
    .flow('f6', 'p0', 'e_gem', 'Generation prompt (lesson quiz / final scenario)')
    .flow('f7', 'e_gem', 'p0', 'Generated questions / scenario JSON')
    .note('Level 0: AI Scenario Training = Lesson Quiz Generator + Final AI Scenario Assessment. Campaign Planning is NOT part of this module.');

// ─── LEVEL 1 ───────────────────────────────────────────────────────────────
$l1 = title('DFD Level 1 — AI Scenario Training (Decomposition)')
    .entity('e_admin', "Lead Trainer /\nAdmin", 40, 140)
    .entity('e_part', "Participant", 40, 560, 150, 64, '#eff6ff')
    .entity('e_gem', "Google Gemini\nAPI", 1080, 360, 150, 64, '#ecfeff')
    .process('p1', "1.0\nConfigure\nLesson Quiz", 280, 80, 105)
    .process('p2', "2.0\nConfigure Final\nAI Scenario", 280, 220, 105)
    .process('p3', "3.0\nGenerate AI\nContent", 280, 380, 105)
    .process('p4', "4.0\nReview & Publish\nVersion", 280, 540, 105)
    .process('p5', "5.0\nDeliver & Score\nAttempts", 280, 680, 105)
    .store('d1', "D1\nLesson Quiz Config\n& Question Bank", 560, 80, 170, 52)
    .store('d2', "D2\nAI Scenario Config\n& Versions", 560, 220, 170, 52)
    .store('d3', "D3\nGeneration Jobs\n(queue / status)", 560, 380, 170, 52)
    .store('d4', "D4\nParticipant\nAttempts & Scores", 560, 680, 170, 52)
    .store('d5', "D5\nTraining Lessons\n(source content)", 560, 540, 170, 52)
    .flow('l1f1', 'e_admin', 'p1', 'Per-lesson quiz settings, counts, passing score')
    .flow('l1f2', 'p1', 'd1', 'LessonQuizConfig + bank')
    .flow('l1f3', 'd5', 'p1', 'Lesson text/resources link')
    .flow('l1f4', 'e_admin', 'p2', 'Final scenario config, retake policy')
    .flow('l1f5', 'p2', 'd2', 'AiScenarioConfig')
    .flow('l1f6', 'd5', 'p2', 'Module lessons for context')
    .flow('l1f7', 'e_admin', 'p3', 'Generate / retry request')
    .flow('l1f8', 'p3', 'd3', 'Queued job record')
    .flow('l1f9', 'd3', 'p3', 'Job to process')
    .flow('l1f10', 'p3', 'e_gem', 'Prompt + lesson context')
    .flow('l1f11', 'e_gem', 'p3', 'AI output')
    .flow('l1f12', 'p3', 'd1', 'Generated quiz bank')
    .flow('l1f13', 'p3', 'd2', 'Draft assessment version')
    .flow('l1f14', 'e_admin', 'p4', 'Approve / publish version')
    .flow('l1f15', 'd2', 'p4', 'Draft version')
    .flow('l1f16', 'd1', 'p4', 'Published quiz bank')
    .flow('l1f17', 'p4', 'd2', 'Published scenario version')
    .flow('l1f18', 'e_part', 'p5', 'Start, save progress, submit')
    .flow('l1f19', 'd1', 'p5', 'Published lesson quiz')
    .flow('l1f20', 'd2', 'p5', 'Published final scenario')
    .flow('l1f21', 'p5', 'd4', 'Attempt rows + scores')
    .flow('l1f22', 'd4', 'p5', 'Resume / retake state')
    .flow('l1f23', 'p5', 'e_part', 'Questions, feedback, pass/fail')
    .note('Level 1: Lesson Quiz Generator (1.0, D1) + Final AI Scenario (2.0, D2). D5 = lesson content owned by Training Module, read here.');

// ─── LEVEL 2 — decompose 3.0 Generate AI Content ─────────────────────────
$l2 = title('DFD Level 2 — Process 3.0 Generate AI Content (Detail)')
    .entity('e_admin', "Lead Trainer /\nAdmin", 40, 300)
    .entity('e_gem', "Google Gemini\nAPI", 1080, 300, 150, 64, '#ecfeff')
    .process('p31', "3.1\nQueue Generation\nJob", 260, 100, 100)
    .process('p32', "3.2\nExtract Lesson /\nModule Context", 260, 260, 100)
    .process('p33', "3.3\nCall Gemini &\nParse Response", 260, 420, 100)
    .process('p34', "3.4\nSave Draft Version\n& Notify Admin", 260, 580, 100)
    .store('d3', "D3\nGeneration Jobs", 560, 120, 160, 44)
    .store('d5', "D5\nTraining Lessons\n(source)", 560, 280, 160, 44)
    .store('d1', "D1\nQuiz Question\nBank (draft)", 560, 440, 160, 44)
    .store('d2', "D2\nScenario Version\n(draft)", 560, 580, 160, 44)
    .flow('l2f1', 'e_admin', 'p31', 'Generate / retry click')
    .flow('l2f2', 'p31', 'd3', 'Job queued (ProcessAiScenarioGenerationJob)')
    .flow('l2f3', 'd3', 'p32', 'Active job payload')
    .flow('l2f4', 'd5', 'p32', 'Lesson text, resources, module title')
    .flow('l2f5', 'p32', 'p33', 'Structured prompt context')
    .flow('l2f6', 'p33', 'e_gem', 'API request')
    .flow('l2f7', 'e_gem', 'p33', 'JSON questions / scenario')
    .flow('l2f8', 'p33', 'p34', 'Validated draft content')
    .flow('l2f9', 'p34', 'd1', 'Lesson quiz bank (if lesson job)')
    .flow('l2f10', 'p34', 'd2', 'AssessmentVersion draft (if final job)')
    .flow('l2f11', 'p34', 'd3', 'Job completed / failed status')
    .flow('l2f12', 'p34', 'e_admin', 'Portal notification + review UI')
    .note('Level 2: maps to AiScenarioGenerationProcessor / LessonQuizGenerationProcessor + GeminiService + queued jobs.');

$pages = [
    ['id' => 'ai-l0', 'name' => 'Level 0 — Context', 'body' => $l0, 'file' => '11_DFD_AI_Scenario_L0.drawio'],
    ['id' => 'ai-l1', 'name' => 'Level 1 — Decomposition', 'body' => $l1, 'file' => '11_DFD_AI_Scenario_L1.drawio'],
    ['id' => 'ai-l2', 'name' => 'Level 2 — Process 3.0 Detail', 'body' => $l2, 'file' => '11_DFD_AI_Scenario_L2.drawio'],
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
file_put_contents($outDir.'/11_DFD_AI_Scenario_L0_L1_L2.drawio', $all);
echo "Wrote 11_DFD_AI_Scenario_L0_L1_L2.drawio (3 tabs)\n";
