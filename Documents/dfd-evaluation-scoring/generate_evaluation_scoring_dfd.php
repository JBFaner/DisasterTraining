<?php

/**
 * DFD Level 0, 1, 2 — Evaluation & Scoring System module.
 * Covers: training results, event drill scoring, lock/export, participant portfolio.
 * Run: php Documents/dfd-evaluation-scoring/generate_evaluation_scoring_dfd.php
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
$l0 = title('DFD Level 0 — Evaluation & Scoring System (Context)')
    .entity('e_eval', "Evaluator /\nLead Trainer", 60, 140)
    .entity('e_part', "Participant", 60, 480, 150, 64, '#eff6ff')
    .entity('e_sim', "Simulation Event\nPlanning", 1080, 120, 170, 64, '#ecfeff')
    .entity('e_ai', "AI Scenario\nTraining", 1080, 300, 170, 64, '#f0fdf4')
    .entity('e_att', "Participant Reg.\n& Attendance", 1080, 480, 170, 64, '#fef3c7')
    .entity('e_cert', "Certification\nIssuance", 1080, 640, 170, 64, '#fce7f3')
    .process('p0', "0\nEvaluation &\nScoring System", 500, 300, 180)
    .flow('f1', 'e_eval', 'p0', 'Score drills, review results, lock/export')
    .flow('f2', 'p0', 'e_eval', 'Hub, summaries, score sheets')
    .flow('f3', 'e_part', 'p0', 'View portfolio / event drill scores')
    .flow('f4', 'p0', 'e_part', 'Scores, pass/fail, portfolio download')
    .flow('f5', 'e_sim', 'p0', 'Completed event + eval objectives')
    .flow('f6', 'p0', 'e_sim', 'Post-evaluation / locked status')
    .flow('f7', 'e_ai', 'p0', 'Lesson quiz & AI scenario attempt scores')
    .flow('f8', 'e_att', 'p0', 'Attendance present for eligibility to score')
    .flow('f9', 'p0', 'e_cert', 'Eligible results for certificate gate')
    .note('Level 0: Hub combines training assessment results + simulation event manual scoring. Certification consumes pass results (separate module).');

// ─── LEVEL 1 ───────────────────────────────────────────────────────────────
$l1 = title('DFD Level 1 — Evaluation & Scoring System (Decomposition)')
    .entity('e_eval', "Evaluator /\nAdmin", 40, 100)
    .entity('e_part', "Participant", 40, 620, 150, 64, '#eff6ff')
    .entity('e_sim', "Simulation Event\nPlanning", 1080, 160, 160, 64, '#ecfeff')
    .entity('e_ai', "AI Scenario\nTraining", 1080, 400, 160, 64, '#f0fdf4')
    .entity('e_cert', "Certification", 1080, 640, 160, 64, '#fce7f3')
    .process('p1', "1.0\nIngest Training\nAssessment Results", 260, 80, 105)
    .process('p2', "2.0\nScore Simulation\nEvent Drill", 260, 240, 105)
    .process('p3', "3.0\nAggregate &\nSummarize", 260, 400, 105)
    .process('p4', "4.0\nLock / Reset\nFinalize", 260, 560, 105)
    .process('p5', "5.0\nPublish Portfolio\n& Export", 260, 700, 105)
    .store('d1', "D1\nTraining Evaluation\nResults", 560, 80)
    .store('d2', "D2\nEvent Evaluations &\nParticipant Scores", 560, 240)
    .store('d3', "D3\nCriteria Score\nLines", 560, 400)
    .store('d4', "D4\nQuiz/Scenario\nAttempts (read)", 560, 560)
    .store('d5', "D5\nLocked Status &\nExports", 560, 700)
    .flow('l1f1', 'e_ai', 'p1', 'Submitted quiz/scenario attempts')
    .flow('l1f2', 'd4', 'p1', 'Attempt + score payload')
    .flow('l1f3', 'p1', 'd1', 'EvaluationResult rows')
    .flow('l1f4', 'e_eval', 'p1', 'Review / reset training results')
    .flow('l1f5', 'e_eval', 'p2', 'Enter criteria scores')
    .flow('l1f6', 'e_sim', 'p2', 'Completed event + objectives')
    .flow('l1f7', 'p2', 'd2', 'Evaluation + ParticipantEvaluation')
    .flow('l1f8', 'p2', 'd3', 'EvaluationScore lines')
    .flow('l1f9', 'd2', 'p2', 'Draft scores for edit')
    .flow('l1f10', 'd1', 'p3', 'Training totals')
    .flow('l1f11', 'd2', 'p3', 'Drill totals')
    .flow('l1f12', 'd3', 'p3', 'Criteria breakdown')
    .flow('l1f13', 'p3', 'e_eval', 'Hub / summary dashboard')
    .flow('l1f14', 'e_eval', 'p4', 'Lock / update status / bulk reset')
    .flow('l1f15', 'd2', 'p4', 'Open evaluation')
    .flow('l1f16', 'p4', 'd5', 'Locked flag / status')
    .flow('l1f17', 'p4', 'd1', 'Reset training result')
    .flow('l1f18', 'p4', 'e_sim', 'Post-evaluation complete')
    .flow('l1f19', 'e_part', 'p5', 'Open portfolio')
    .flow('l1f20', 'e_eval', 'p5', 'Export CSV/summary')
    .flow('l1f21', 'd1', 'p5', 'Training results')
    .flow('l1f22', 'd2', 'p5', 'Event drill scores')
    .flow('l1f23', 'd5', 'p5', 'Locked exports')
    .flow('l1f24', 'p5', 'e_part', 'Portfolio / download')
    .flow('l1f25', 'p5', 'e_cert', 'Pass/eligible signals')
    .note('Level 1: Training results (auto from AI Scenario) + manual event drill scoring. Attendance eligibility is checked when scoring.');

// ─── LEVEL 2 — Process 2.0 Score Simulation Event Drill ────────────────────
$l2 = title('DFD Level 2 — Process 2.0 Score Simulation Event Drill (Detail)')
    .entity('e_eval', "Evaluator /\nAdmin", 40, 280)
    .entity('e_sim', "Simulation Event\nPlanning", 1080, 160, 150, 64, '#ecfeff')
    .entity('e_att', "Attendance\n(present roster)", 1080, 480, 150, 64, '#fef3c7')
    .process('p21', "2.1\nLoad Event &\nEligible Roster", 260, 100, 100)
    .process('p22', "2.2\nApply Evaluation\nCriteria", 260, 280, 100)
    .process('p23', "2.3\nCompute Total &\nPass/Fail", 260, 460, 100)
    .process('p24', "2.4\nSave Participant\nEvaluation", 260, 640, 100)
    .store('d2', "D2\nEvent Evaluations", 560, 200, 160, 44)
    .store('d3', "D3\nCriteria Scores", 560, 400, 160, 44)
    .store('d5e', "D5e\nEvent + Objectives\n(read)", 560, 100, 160, 44)
    .store('d4a', "D4a\nAttendance\n(present)", 560, 560, 160, 44)
    .flow('l2f1', 'e_eval', 'p21', 'Open evaluate participant')
    .flow('l2f2', 'e_sim', 'p21', 'Completed event context')
    .flow('l2f3', 'd5e', 'p21', 'Objectives / mode')
    .flow('l2f4', 'e_att', 'p21', 'Present participants')
    .flow('l2f5', 'd4a', 'p21', 'Attendance check')
    .flow('l2f6', 'p21', 'p22', 'Eligible participant + form')
    .flow('l2f7', 'e_eval', 'p22', 'Enter criterion scores')
    .flow('l2f8', 'p22', 'd3', 'Score lines')
    .flow('l2f9', 'd3', 'p23', 'Score lines to total')
    .flow('l2f10', 'p23', 'p24', 'Total + pass/fail')
    .flow('l2f11', 'p24', 'd2', 'ParticipantEvaluation saved')
    .flow('l2f12', 'p24', 'e_eval', 'Saved confirmation')
    .flow('l2f13', 'd2', 'p21', 'Existing draft if any')
    .note('Level 2 maps to EvaluationController::evaluate / storeEvaluation + EvaluationScoringService. Lock/export is Process 4.0 / 5.0.');

$pages = [
    ['id' => 'eval-l0', 'name' => 'Level 0 — Context', 'body' => $l0, 'file' => '15_DFD_Evaluation_Scoring_L0.drawio'],
    ['id' => 'eval-l1', 'name' => 'Level 1 — Decomposition', 'body' => $l1, 'file' => '15_DFD_Evaluation_Scoring_L1.drawio'],
    ['id' => 'eval-l2', 'name' => 'Level 2 — Process 2.0 Detail', 'body' => $l2, 'file' => '15_DFD_Evaluation_Scoring_L2.drawio'],
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
file_put_contents($outDir.'/15_DFD_Evaluation_Scoring_L0_L1_L2.drawio', $all);
echo "Wrote 15_DFD_Evaluation_Scoring_L0_L1_L2.drawio (3 tabs)\n";
