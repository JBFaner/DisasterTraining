<?php

/**
 * DFD Level 0, 1, 2 — Certification Issuance module.
 * Covers: templates, eligibility, issue/revoke/reissue, verify, email/export.
 * Run: php Documents/dfd-certification/generate_certification_dfd.php
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
$l0 = title('DFD Level 0 — Certification Issuance (Context)')
    .entity('e_admin', "Lead Trainer /\nLGU Admin", 60, 140)
    .entity('e_part', "Participant", 60, 480, 150, 64, '#eff6ff')
    .entity('e_eval', "Evaluation &\nScoring System", 1080, 120, 170, 64, '#fce7f3')
    .entity('e_train', "Training Module", 1080, 300, 170, 64, '#f0fdf4')
    .entity('e_public', "Public Verifier\n(QR / link)", 1080, 500, 170, 64, '#ecfeff')
    .process('p0', "0\nCertification\nIssuance", 500, 300, 180)
    .flow('f1', 'e_admin', 'p0', 'Templates, settings, issue, revoke, export')
    .flow('f2', 'p0', 'e_admin', 'Eligible list, certificate views, reports')
    .flow('f3', 'e_part', 'p0', 'View / email my certificate')
    .flow('f4', 'p0', 'e_part', 'Certificate PDF/HTML, email delivery')
    .flow('f5', 'e_eval', 'p0', 'Pass/eligible evaluation results')
    .flow('f6', 'e_train', 'p0', 'Module title / completion context')
    .flow('f7', 'e_public', 'p0', 'Verify token / QR scan')
    .flow('f8', 'p0', 'e_public', 'Valid / revoked certificate status')
    .note('Level 0: Certificates are issued after eligibility from Evaluation & Training. Public verification is open (no login).');

// ─── LEVEL 1 ───────────────────────────────────────────────────────────────
$l1 = title('DFD Level 1 — Certification Issuance (Decomposition)')
    .entity('e_admin', "Lead Trainer /\nAdmin", 40, 100)
    .entity('e_part', "Participant", 40, 600, 150, 64, '#eff6ff')
    .entity('e_eval', "Evaluation &\nScoring", 1080, 200, 160, 64, '#fce7f3')
    .entity('e_train', "Training Module", 1080, 400, 160, 64, '#f0fdf4')
    .entity('e_public', "Public Verifier", 1080, 620, 160, 64, '#ecfeff')
    .process('p1', "1.0\nManage Templates\n& Settings", 260, 80, 105)
    .process('p2', "2.0\nCheck Eligibility", 260, 240, 105)
    .process('p3', "3.0\nIssue Certificate", 260, 400, 105)
    .process('p4', "4.0\nRevoke / Reissue", 260, 560, 105)
    .process('p5', "5.0\nDeliver & Verify", 260, 700, 105)
    .store('d1', "D1\nCertificate\nTemplates", 560, 80)
    .store('d2', "D2\nCertification\nSettings", 560, 200)
    .store('d3', "D3\nIssued\nCertificates", 560, 400)
    .store('d4', "D4\nEligibility\nSnapshot (read)", 560, 560)
    .store('d5', "D5\nVerify Tokens &\nExports", 560, 700)
    .flow('l1f1', 'e_admin', 'p1', 'Create/update/duplicate template')
    .flow('l1f2', 'e_admin', 'p1', 'Update certification settings')
    .flow('l1f3', 'p1', 'd1', 'Template design / background')
    .flow('l1f4', 'p1', 'd2', 'Issuance rules / defaults')
    .flow('l1f5', 'e_admin', 'p2', 'Open eligible participants')
    .flow('l1f6', 'e_eval', 'p2', 'Pass results / scores')
    .flow('l1f7', 'e_train', 'p2', 'Module completion context')
    .flow('l1f8', 'p2', 'd4', 'Eligible participant list')
    .flow('l1f9', 'd4', 'p2', 'Eligibility flags')
    .flow('l1f10', 'e_admin', 'p3', 'Issue / preview participant')
    .flow('l1f11', 'd4', 'p3', 'Eligible target')
    .flow('l1f12', 'd1', 'p3', 'Selected template')
    .flow('l1f13', 'd2', 'p3', 'Settings for render')
    .flow('l1f14', 'p3', 'd3', 'Certificate record + number')
    .flow('l1f15', 'p3', 'd5', 'Verification token')
    .flow('l1f16', 'e_admin', 'p4', 'Revoke / reissue')
    .flow('l1f17', 'd3', 'p4', 'Existing certificate')
    .flow('l1f18', 'p4', 'd3', 'Revoked / new issued row')
    .flow('l1f19', 'e_part', 'p5', 'View / email certificate')
    .flow('l1f20', 'e_admin', 'p5', 'View / export CSV')
    .flow('l1f21', 'e_public', 'p5', 'QR / verify link')
    .flow('l1f22', 'd3', 'p5', 'Certificate content')
    .flow('l1f23', 'd5', 'p5', 'Token lookup')
    .flow('l1f24', 'p5', 'e_part', 'Rendered cert / email')
    .flow('l1f25', 'p5', 'e_public', 'Valid / revoked status')
    .flow('l1f26', 'p5', 'e_admin', 'Export file')
    .note('Level 1: Templates → Eligibility → Issue → Revoke/Reissue → Deliver & Verify. Eligibility comes from Evaluation + Training Module.');

// ─── LEVEL 2 — Process 3.0 Issue Certificate ───────────────────────────────
$l2 = title('DFD Level 2 — Process 3.0 Issue Certificate (Detail)')
    .entity('e_admin', "Lead Trainer /\nAdmin", 40, 300)
    .process('p31', "3.1\nValidate\nEligibility", 260, 100, 100)
    .process('p32', "3.2\nSelect Template\n& Preview", 260, 280, 100)
    .process('p33', "3.3\nGenerate Number\n& Render", 260, 460, 100)
    .process('p34', "3.4\nPersist &\nNotify", 260, 640, 100)
    .store('d4', "D4\nEligibility\n(read)", 560, 120, 160, 44)
    .store('d1', "D1\nTemplates", 560, 280, 160, 44)
    .store('d2', "D2\nSettings", 560, 400, 160, 44)
    .store('d3', "D3\nCertificates", 560, 560, 160, 44)
    .store('d5', "D5\nVerify Tokens", 560, 700, 160, 44)
    .flow('l2f1', 'e_admin', 'p31', 'Issue request (user + module)')
    .flow('l2f2', 'd4', 'p31', 'Eligible flags')
    .flow('l2f3', 'p31', 'p32', 'Validated participant')
    .flow('l2f4', 'e_admin', 'p32', 'Choose template / preview')
    .flow('l2f5', 'd1', 'p32', 'Template design')
    .flow('l2f6', 'p32', 'p33', 'Confirmed design + data')
    .flow('l2f7', 'd2', 'p33', 'Numbering / design rules')
    .flow('l2f8', 'p33', 'p34', 'Rendered HTML + cert number')
    .flow('l2f9', 'p34', 'd3', 'Certificate saved')
    .flow('l2f10', 'p34', 'd5', 'Public verify token')
    .flow('l2f11', 'p34', 'e_admin', 'Issued confirmation + view')
    .note('Level 2 maps to CertificationController::issue, TrainingCertificateService, CertificateDesignRenderer, ParticipantCertificateEligibilityService.');

$pages = [
    ['id' => 'cert-l0', 'name' => 'Level 0 — Context', 'body' => $l0, 'file' => '16_DFD_Certification_L0.drawio'],
    ['id' => 'cert-l1', 'name' => 'Level 1 — Decomposition', 'body' => $l1, 'file' => '16_DFD_Certification_L1.drawio'],
    ['id' => 'cert-l2', 'name' => 'Level 2 — Process 3.0 Detail', 'body' => $l2, 'file' => '16_DFD_Certification_L2.drawio'],
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
file_put_contents($outDir.'/16_DFD_Certification_L0_L1_L2.drawio', $all);
echo "Wrote 16_DFD_Certification_L0_L1_L2.drawio (3 tabs)\n";
