<?php

/**
 * Generate DFD Level 0 Draw.io — one page per platform module.
 * Run: php Documents/dfd-level0-modules/generate_dfd_level0_modules.php
 */

$outDir = __DIR__;
if (! is_dir($outDir)) {
    mkdir($outDir, 0755, true);
}

$modules = [
    [
        'id' => 'm01-auth',
        'name' => 'M1 — Authentication & User Management',
        'process' => "0\nAuthentication &\nUser Management",
        'entities' => [
            ['id' => 'e1', 'label' => "LGU Admin /\nLead Trainer", 'x' => 80, 'y' => 140, 'color' => '#fff7ed'],
            ['id' => 'e2', 'label' => "Participant", 'x' => 80, 'y' => 400, 'color' => '#eff6ff'],
            ['id' => 'e3', 'label' => "Centralized Login\n(login.alertaraqc.com)", 'x' => 1100, 'y' => 270, 'color' => '#ecfeff'],
        ],
        'flows' => [
            ['from' => 'e1', 'to' => 'p0', 'label' => 'Login, OTP, user/role CRUD, permissions'],
            ['from' => 'p0', 'to' => 'e1', 'label' => 'Session, RBAC claims, audit log'],
            ['from' => 'e2', 'to' => 'p0', 'label' => 'Register, verify email, login, profile'],
            ['from' => 'p0', 'to' => 'e2', 'label' => 'Session, portal access, profile data'],
            ['from' => 'e3', 'to' => 'p0', 'label' => 'JWT / centralized auth token'],
            ['from' => 'p0', 'to' => 'e3', 'label' => 'Logout redirect, session sync'],
        ],
    ],
    [
        'id' => 'm02-training',
        'name' => 'M2 — Training Module Management',
        'process' => "0\nTraining Module\nManagement",
        'entities' => [
            ['id' => 'e1', 'label' => "Lead Trainer /\nAdmin", 'x' => 80, 'y' => 160, 'color' => '#fff7ed'],
            ['id' => 'e2', 'label' => "Participant", 'x' => 80, 'y' => 480, 'color' => '#eff6ff'],
            ['id' => 'e3', 'label' => "Google Gemini API", 'x' => 1100, 'y' => 300, 'color' => '#ecfeff'],
        ],
        'flows' => [
            ['from' => 'e1', 'to' => 'p0', 'label' => 'Create/edit lessons, resources, publish module'],
            ['from' => 'p0', 'to' => 'e1', 'label' => 'Module list, draft status, print export'],
            ['from' => 'e2', 'to' => 'p0', 'label' => 'Lesson progress, quiz attempts (read module)'],
            ['from' => 'p0', 'to' => 'e2', 'label' => 'Published lessons, resources, objectives'],
            ['from' => 'p0', 'to' => 'e3', 'label' => 'AI module draft prompt'],
            ['from' => 'e3', 'to' => 'p0', 'label' => 'Generated lesson outline/content'],
        ],
    ],
    [
        'id' => 'm03-campaign',
        'name' => 'M3 — Campaign Planning Integration',
        'process' => "0\nCampaign Planning\nIntegration",
        'entities' => [
            ['id' => 'e1', 'label' => "Lead Trainer /\nAdmin", 'x' => 80, 'y' => 200, 'color' => '#fff7ed'],
            ['id' => 'e2', 'label' => "Participant", 'x' => 80, 'y' => 520, 'color' => '#eff6ff'],
            ['id' => 'e3', 'label' => "Campaign Planning\n(Group 6)", 'x' => 1100, 'y' => 280, 'color' => '#faf5ff'],
        ],
        'flows' => [
            ['from' => 'e1', 'to' => 'p0', 'label' => 'Submit campaign request, registration windows, capacity'],
            ['from' => 'p0', 'to' => 'e1', 'label' => 'Request status, registration link, counts'],
            ['from' => 'p0', 'to' => 'e3', 'label' => 'Campaign planning payload (training intelligence)'],
            ['from' => 'e3', 'to' => 'p0', 'label' => 'Approve / reject + remarks'],
            ['from' => 'e2', 'to' => 'p0', 'label' => 'Campaign registration (via link)'],
            ['from' => 'p0', 'to' => 'e2', 'label' => 'Enrollment confirmation, batch/module unlock'],
        ],
    ],
    [
        'id' => 'm04-simulation',
        'name' => 'M4 — Simulation Event Lifecycle',
        'process' => "0\nSimulation Event\nLifecycle",
        'entities' => [
            ['id' => 'e1', 'label' => "Lead Trainer /\nAdmin (Ops)", 'x' => 80, 'y' => 140, 'color' => '#fff7ed'],
            ['id' => 'e2', 'label' => "Assistant Trainer /\nStaff", 'x' => 80, 'y' => 380, 'color' => '#fff7ed'],
            ['id' => 'e3', 'label' => "Participant", 'x' => 80, 'y' => 600, 'color' => '#eff6ff'],
            ['id' => 'e4', 'label' => "CPSQC Patrol\nSystem", 'x' => 1100, 'y' => 300, 'color' => '#ecfeff'],
        ],
        'flows' => [
            ['from' => 'e1', 'to' => 'p0', 'label' => 'Exercise plan, template, readiness, publish'],
            ['from' => 'p0', 'to' => 'e1', 'label' => 'Lifecycle status, monitoring dashboard'],
            ['from' => 'e2', 'to' => 'p0', 'label' => 'Personnel roster assignments'],
            ['from' => 'p0', 'to' => 'e2', 'label' => 'Readiness personnel lists'],
            ['from' => 'e3', 'to' => 'p0', 'label' => 'Event registration / cancel registration'],
            ['from' => 'p0', 'to' => 'e3', 'label' => 'Published event schedule, registration status'],
            ['from' => 'p0', 'to' => 'e4', 'label' => 'Patrol / marshal request'],
            ['from' => 'e4', 'to' => 'p0', 'label' => 'Marshal availability, request status'],
        ],
    ],
    [
        'id' => 'm05-attendance',
        'name' => 'M5 — Participant Registration & Attendance',
        'process' => "0\nParticipant Registration\n& Attendance",
        'entities' => [
            ['id' => 'e1', 'label' => "Participant", 'x' => 80, 'y' => 280, 'color' => '#eff6ff'],
            ['id' => 'e2', 'label' => "Evaluator", 'x' => 1100, 'y' => 200, 'color' => '#fef2f2'],
            ['id' => 'e3', 'label' => "Lead Trainer /\nAdmin", 'x' => 1100, 'y' => 480, 'color' => '#fff7ed'],
        ],
        'flows' => [
            ['from' => 'e1', 'to' => 'p0', 'label' => 'Campaign enroll, event register, check-in/out'],
            ['from' => 'p0', 'to' => 'e1', 'label' => 'Attendance record, registration status'],
            ['from' => 'e2', 'to' => 'p0', 'label' => 'Record attendance during drill'],
            ['from' => 'p0', 'to' => 'e2', 'label' => 'Event roster, attendance sheet'],
            ['from' => 'p0', 'to' => 'e3', 'label' => 'Attendance reports, headcount'],
            ['from' => 'e3', 'to' => 'p0', 'label' => 'Approve/reject event registration (if manual)'],
        ],
    ],
    [
        'id' => 'm06-evaluation',
        'name' => 'M6 — Evaluation & Scoring',
        'process' => "0\nEvaluation &\nScoring",
        'entities' => [
            ['id' => 'e1', 'label' => "Participant", 'x' => 80, 'y' => 200, 'color' => '#eff6ff'],
            ['id' => 'e2', 'label' => "Evaluator", 'x' => 80, 'y' => 480, 'color' => '#fef2f2'],
            ['id' => 'e3', 'label' => "Lead Trainer /\nAdmin", 'x' => 1100, 'y' => 320, 'color' => '#fff7ed'],
            ['id' => 'e4', 'label' => "Google Gemini API", 'x' => 1100, 'y' => 560, 'color' => '#ecfeff'],
        ],
        'flows' => [
            ['from' => 'e1', 'to' => 'p0', 'label' => 'Quiz answers, AI scenario responses'],
            ['from' => 'p0', 'to' => 'e1', 'label' => 'Scores, pass/fail, answer review'],
            ['from' => 'e2', 'to' => 'p0', 'label' => 'Manual evaluation scores, remarks'],
            ['from' => 'p0', 'to' => 'e2', 'label' => 'Evaluation forms, participant results'],
            ['from' => 'p0', 'to' => 'e3', 'label' => 'Analytics, evaluation reports'],
            ['from' => 'p0', 'to' => 'e4', 'label' => 'Final scenario assessment prompt'],
            ['from' => 'e4', 'to' => 'p0', 'label' => 'AI-generated scenario / rubric support'],
        ],
    ],
    [
        'id' => 'm07-certification',
        'name' => 'M7 — Certification Issuance',
        'process' => "0\nCertification\nIssuance",
        'entities' => [
            ['id' => 'e1', 'label' => "Lead Trainer /\nAdmin", 'x' => 80, 'y' => 220, 'color' => '#fff7ed'],
            ['id' => 'e2', 'label' => "Participant", 'x' => 80, 'y' => 500, 'color' => '#eff6ff'],
            ['id' => 'e3', 'label' => "Evaluation Module\n(eligibility input)", 'x' => 1100, 'y' => 320, 'color' => '#f0fdf4'],
        ],
        'flows' => [
            ['from' => 'e3', 'to' => 'p0', 'label' => 'Pass/fail, attendance complete, eligibility flags'],
            ['from' => 'e1', 'to' => 'p0', 'label' => 'Issue/revoke certificate, export list'],
            ['from' => 'p0', 'to' => 'e1', 'label' => 'Certificate registry, verification status'],
            ['from' => 'p0', 'to' => 'e2', 'label' => 'Certificate PDF / download link'],
            ['from' => 'e2', 'to' => 'p0', 'label' => 'Verification lookup (certificate no.)'],
        ],
    ],
    [
        'id' => 'm08-hazard',
        'name' => 'M8 — Hazard Assessment Profile',
        'process' => "0\nHazard Assessment\nProfile",
        'entities' => [
            ['id' => 'e1', 'label' => "Lead Trainer /\nAdmin", 'x' => 80, 'y' => 200, 'color' => '#fff7ed'],
            ['id' => 'e2', 'label' => "Public Reference\nSources (QCDMP, PAGASA,\nPHIVOLCS, BDRRM studies)", 'x' => 1100, 'y' => 260, 'color' => '#f1f5f9'],
            ['id' => 'e3', 'label' => "Simulation Planning\n(uses hazard context)", 'x' => 1100, 'y' => 520, 'color' => '#f0fdf4'],
        ],
        'flows' => [
            ['from' => 'e1', 'to' => 'p0', 'label' => 'Barangay profile, hazard records, upload docs'],
            ['from' => 'p0', 'to' => 'e1', 'label' => 'Risk levels, supporting Word/PDF docs'],
            ['from' => 'e2', 'to' => 'p0', 'label' => 'Reference materials (manual curation)'],
            ['from' => 'p0', 'to' => 'e3', 'label' => 'San Agustin hazard context for exercise design'],
        ],
    ],
];

function esc(string $s): string
{
    return htmlspecialchars($s, ENT_QUOTES | ENT_XML1, 'UTF-8');
}

function buildDiagram(array $mod): string
{
    $cells = '';
    $cells .= '<mxCell id="0" /><mxCell id="1" parent="0" />';

    $cells .= sprintf(
        '<mxCell id="title" value="%s — DFD Level 0" style="rounded=0;whiteSpace=wrap;html=1;fillColor=#1e3a5f;fontColor=#ffffff;fontStyle=1;fontSize=13;strokeColor=#1e3a5f;" vertex="1" parent="1"><mxGeometry x="40" y="20" width="1200" height="44" as="geometry"/></mxCell>',
        esc($mod['name'])
    );

    $cells .= sprintf(
        '<mxCell id="p0" value="%s" style="ellipse;whiteSpace=wrap;html=1;aspect=fixed;fillColor=#dbeafe;strokeColor=#1d4ed8;fontStyle=1;fontSize=11;" vertex="1" parent="1"><mxGeometry x="520" y="320" width="180" height="180" as="geometry"/></mxCell>',
        esc($mod['process'])
    );

    foreach ($mod['entities'] as $ent) {
        $cells .= sprintf(
            '<mxCell id="%s" value="%s" style="rounded=0;whiteSpace=wrap;html=1;fillColor=%s;strokeColor=#334155;fontStyle=1;fontSize=10;" vertex="1" parent="1"><mxGeometry x="%d" y="%d" width="150" height="64" as="geometry"/></mxCell>',
            esc($ent['id']),
            esc($ent['label']),
            esc($ent['color']),
            $ent['x'],
            $ent['y']
        );
    }

    $fi = 0;
    foreach ($mod['flows'] as $flow) {
        $fi++;
        $from = $flow['from'];
        $to = $flow['to'];
        $label = esc($flow['label']);
        $isOut = $from === 'p0';

        if ($from === 'p0') {
            $style = 'exitX=1;exitY=0.5;entryX=0;entryY=0.5;';
            if ($to !== 'p0' && str_starts_with($to, 'e') && ($mod['entities'][array_search($to, array_column($mod['entities'], 'id'))]['x'] ?? 0) < 520) {
                $style = 'exitX=0;exitY=0.5;entryX=1;entryY=0.5;';
            }
        } else {
            $style = 'exitX=1;exitY=0.5;entryX=0;entryY=0.5;';
            if (($mod['entities'][array_search($from, array_column($mod['entities'], 'id'))]['x'] ?? 0) > 520) {
                $style = 'exitX=0;exitY=0.5;entryX=1;entryY=0.5;';
            }
        }

        $cells .= sprintf(
            '<mxCell id="f%d" value="%s" style="edgeStyle=orthogonalEdgeStyle;rounded=0;html=1;strokeWidth=1.5;strokeColor=#0f172a;endArrow=block;endFill=1;fontSize=9;%s" edge="1" parent="1" source="%s" target="%s"><mxGeometry relative="1" as="geometry"/></mxCell>',
            $fi,
            $label,
            $style,
            esc($from),
            esc($to)
        );
    }

    $cells .= '<mxCell id="note" value="DFD Level 0 per module: one process (0), external entities, labeled flows. Gane–Sarson notation." style="rounded=1;whiteSpace=wrap;html=1;fillColor=#f1f5f9;strokeColor=#64748b;fontSize=10;" vertex="1" parent="1"><mxGeometry x="40" y="780" width="1200" height="32" as="geometry"/></mxCell>';

    return sprintf(
        '<diagram id="%s" name="%s"><mxGraphModel dx="1200" dy="800" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="1300" pageHeight="850" math="0" shadow="0"><root>%s</root></mxGraphModel></diagram>',
        esc($mod['id']),
        esc($mod['name']),
        $cells
    );
}

$diagrams = '';
foreach ($modules as $mod) {
    $diagrams .= buildDiagram($mod);
    // Also write individual file
    $slug = $mod['id'];
    $single = '<?xml version="1.0" encoding="UTF-8"?>'."\n"
        .'<mxfile host="app.diagrams.net" agent="Cursor" version="22.1.0" type="device">'
        .buildDiagram($mod)
        .'</mxfile>';
    file_put_contents($outDir."/{$slug}.drawio", $single);
    echo "Wrote {$slug}.drawio\n";
}

$combined = '<?xml version="1.0" encoding="UTF-8"?>'."\n"
    .'<mxfile host="app.diagrams.net" agent="Cursor" version="22.1.0" type="device">'
    .$diagrams
    .'</mxfile>';

file_put_contents($outDir.'/09_DFD_Level_0_All_Modules.drawio', $combined);
echo "Wrote 09_DFD_Level_0_All_Modules.drawio (".count($modules)." tabs)\n";
