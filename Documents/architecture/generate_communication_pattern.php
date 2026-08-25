<?php

/**
 * Communication & Interaction Pattern diagram (thesis format).
 * Run: php Documents/architecture/generate_communication_pattern.php
 */

$outDir = __DIR__;
$docsAppDir = dirname($outDir, 2) . DIRECTORY_SEPARATOR . 'my-app' . DIRECTORY_SEPARATOR . 'docs';
$erdDir = dirname($outDir) . DIRECTORY_SEPARATOR . 'erd';

function esc(string $s): string
{
    return htmlspecialchars($s, ENT_QUOTES | ENT_XML1, 'UTF-8');
}

function box(string $id, string $label, int $x, int $y, int $w, int $h, string $fill, int $fontSize = 11, string $parent = '1', bool $bold = true, string $fontColor = '#0f172a'): string
{
    $font = $bold ? 'fontStyle=1;' : '';

    return sprintf(
        '<mxCell id="%s" value="%s" style="rounded=1;whiteSpace=wrap;html=1;fillColor=%s;strokeColor=#334155;%sfontSize=%d;fontColor=%s;align=center;verticalAlign=middle;" vertex="1" parent="%s"><mxGeometry x="%d" y="%d" width="%d" height="%d" as="geometry"/></mxCell>',
        esc($id),
        esc($label),
        esc($fill),
        $font,
        $fontSize,
        esc($fontColor),
        esc($parent),
        $x,
        $y,
        $w,
        $h
    );
}

function container(string $id, string $label, int $x, int $y, int $w, int $h, string $parent = '1'): string
{
    return sprintf(
        '<mxCell id="%s" value="%s" style="swimlane;whiteSpace=wrap;html=1;startSize=36;fillColor=#f8fafc;strokeColor=#1e3a5f;fontStyle=1;fontSize=13;fontColor=#0f172a;collapsible=0;" vertex="1" parent="%s"><mxGeometry x="%d" y="%d" width="%d" height="%d" as="geometry"/></mxCell>',
        esc($id),
        esc($label),
        esc($parent),
        $x,
        $y,
        $w,
        $h
    );
}

function arrow(string $id, string $from, string $to, string $label = '', int $stroke = 2): string
{
    $style = 'edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeWidth='
        . $stroke . ';strokeColor=#334155;endArrow=block;endFill=1;';
    if ($label !== '') {
        $style .= 'labelBackgroundColor=#ffffff;fontSize=10;fontColor=#334155;';
    }

    return sprintf(
        '<mxCell id="%s" value="%s" style="%s" edge="1" parent="1" source="%s" target="%s"><mxGeometry relative="1" as="geometry"/></mxCell>',
        esc($id),
        esc($label),
        esc($style),
        esc($from),
        esc($to)
    );
}

function wrapDiagram(string $body, int $pageW = 1100, int $pageH = 920): string
{
    return sprintf(
        '<diagram id="comm_pattern" name="Communication Pattern"><mxGraphModel dx="1100" dy="920" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="%d" pageHeight="%d" math="0" shadow="0"><root><mxCell id="0"/><mxCell id="1" parent="0"/>%s</root></mxGraphModel></diagram>',
        $pageW,
        $pageH,
        $body
    );
}

function buildSvg(): string
{
    $w = 1100;
    $h = 680;
    $svg = '<?xml version="1.0" encoding="UTF-8"?>';
    $svg .= '<svg xmlns="http://www.w3.org/2000/svg" width="' . $w . '" height="' . $h . '" viewBox="0 0 ' . $w . ' ' . $h . '">';
    $svg .= '<defs><marker id="arr" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto"><polygon points="0 0, 10 3.5, 0 7" fill="#334155"/></marker></defs>';
    $svg .= '<rect width="100%" height="100%" fill="#ffffff"/>';
    $svg .= '<text x="550" y="32" text-anchor="middle" font-family="Arial,sans-serif" font-size="15" font-weight="700" fill="#0f172a">Communication and Interaction Patterns</text>';
    $svg .= '<text x="550" y="52" text-anchor="middle" font-family="Arial,sans-serif" font-size="11" fill="#64748b">Disaster Preparedness Training &amp; Simulation System</text>';

    $svg .= '<rect x="350" y="70" width="400" height="44" rx="8" fill="#e2e8f0" stroke="#334155"/>';
    $svg .= '<text x="550" y="98" text-anchor="middle" font-family="Arial,sans-serif" font-size="12" font-weight="700">LGU Admin · Trainer · Evaluator · Participant</text>';
    $svg .= '<line x1="550" y1="114" x2="550" y2="138" stroke="#334155" stroke-width="2" marker-end="url(#arr)"/>';
    $svg .= '<text x="550" y="132" text-anchor="middle" font-family="Arial,sans-serif" font-size="10" fill="#475569">HTTP / HTTPS</text>';

    $svg .= '<rect x="60" y="150" width="980" height="210" rx="4" fill="#f8fafc" stroke="#1e3a5f" stroke-width="2"/>';
    $svg .= '<text x="550" y="178" text-anchor="middle" font-family="Arial,sans-serif" font-size="13" font-weight="700">Web Application (Laravel 12 + React Modular Monolith)</text>';

    $row1 = [
        ['Auth', '#dbeafe', 90], ['Training', '#99f6e4', 200], ['AI Scenario', '#fed7aa', 310],
        ['Simulation Event', '#bbf7d0', 420], ['Attendance', '#a7f3d0', 540], ['Evaluation', '#fde68a', 650], ['Certification', '#e9d5ff', 760],
    ];
    foreach ($row1 as [$name, $color, $x]) {
        $svg .= '<rect x="' . $x . '" y="200" width="100" height="48" rx="8" fill="' . $color . '" stroke="#334155"/>';
        $svg .= '<text x="' . ($x + 50) . '" y="228" text-anchor="middle" font-family="Arial,sans-serif" font-size="9" font-weight="700">' . htmlspecialchars($name) . '</text>';
    }
    $svg .= '<rect x="90" y="265" width="130" height="48" rx="8" fill="#fecdd3" stroke="#334155"/>';
    $svg .= '<text x="155" y="293" text-anchor="middle" font-family="Arial,sans-serif" font-size="9" font-weight="700">Hazard Assessment</text>';
    $svg .= '<rect x="240" y="265" width="130" height="48" rx="8" fill="#fef9c3" stroke="#334155"/>';
    $svg .= '<text x="305" y="293" text-anchor="middle" font-family="Arial,sans-serif" font-size="9" font-weight="700">Resource Inventory</text>';

    $svg .= '<line x1="550" y1="360" x2="550" y2="400" stroke="#334155" stroke-width="3" marker-end="url(#arr)"/>';
    $svg .= '<rect x="370" y="400" width="360" height="50" rx="8" fill="#fef08a" stroke="#854d0e" stroke-width="2"/>';
    $svg .= '<text x="550" y="432" text-anchor="middle" font-family="Arial,sans-serif" font-size="13" font-weight="700">MySQL 8.0 Database (InnoDB)</text>';

    $svg .= '<line x1="550" y1="450" x2="550" y2="480" stroke="#334155" stroke-width="3" marker-end="url(#arr)"/>';
    $externals = [
        ['SMTP Email', '#dbeafe', 80], ['SMS API', '#bbf7d0', 220], ['Gemini API', '#fed7aa', 360],
        ['Group 6 Campaign', '#e9d5ff', 500], ['Cloudinary CDN', '#e2e8f0', 660], ['Public Verifier (QR)', '#f1f5f9', 820],
    ];
    foreach ($externals as [$name, $color, $x]) {
        $svg .= '<rect x="' . $x . '" y="490" width="130" height="44" rx="8" fill="' . $color . '" stroke="#334155"/>';
        $svg .= '<text x="' . ($x + 65) . '" y="517" text-anchor="middle" font-family="Arial,sans-serif" font-size="9" font-weight="700">' . htmlspecialchars($name) . '</text>';
    }

    $svg .= '<text x="550" y="570" text-anchor="middle" font-family="Arial,sans-serif" font-size="10" fill="#64748b">Synchronous HTTPS · Session auth · RBAC · Optional queue for AI/notifications</text>';
    $svg .= '</svg>';

    return $svg;
}

function exportPng(string $svgPath, string $pngPath, string $erdDir): bool
{
    $resvgJs = $erdDir . DIRECTORY_SEPARATOR . 'node_modules' . DIRECTORY_SEPARATOR . '@resvg' . DIRECTORY_SEPARATOR . 'resvg-js' . DIRECTORY_SEPARATOR . 'index.js';
    if (!is_file($resvgJs)) {
        shell_exec('cd ' . escapeshellarg($erdDir) . ' && npm install @resvg/resvg-js --no-save >nul 2>&1');
    }
    if (!is_file($resvgJs)) {
        return false;
    }

    $js = <<<'JS'
const { Resvg } = require('@resvg/resvg-js');
const fs = require('fs');
const svg = fs.readFileSync(process.argv[2], 'utf8');
const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: 2200 } });
fs.writeFileSync(process.argv[3], resvg.render().asPng());
JS;
    $jsPath = $erdDir . DIRECTORY_SEPARATOR . '_resvg_comm.js';
    file_put_contents($jsPath, $js);
    shell_exec('cd /d ' . escapeshellarg($erdDir) . ' && node ' . escapeshellarg($jsPath) . ' ' . escapeshellarg($svgPath) . ' ' . escapeshellarg($pngPath) . ' 2>&1');
    @unlink($jsPath);

    return is_file($pngPath) && filesize($pngPath) > 500;
}

// ─── Draw.io layout ───────────────────────────────────────────────────────────
$body = box('title', 'Communication and Interaction Patterns — Disaster Preparedness Training & Simulation System', 120, 16, 860, 36, '#1e3a5f', 11, '1', true, '#ffffff');
$body .= box('users', 'LGU Admin · Trainer · Evaluator · Participant', 350, 70, 400, 48, '#e2e8f0', 12);
$body .= container('webapp', 'Web Application (Laravel 12 + React Modular Monolith)', 60, 170, 980, 230);

$modules = [
    ['m_auth', 'Auth Module', 90, 50, 100, 48, '#dbeafe'],
    ['m_train', 'Training Module', 205, 50, 100, 48, '#99f6e4'],
    ['m_ai', 'AI Scenario Module', 320, 50, 100, 48, '#fed7aa'],
    ['m_sim', 'Simulation Event Module', 435, 50, 110, 48, '#bbf7d0'],
    ['m_att', 'Attendance Module', 560, 50, 100, 48, '#a7f3d0'],
    ['m_eval', 'Evaluation Module', 675, 50, 100, 48, '#fde68a'],
    ['m_cert', 'Certification Module', 790, 50, 110, 48, '#e9d5ff'],
    ['m_haz', 'Hazard Assessment Module', 90, 115, 130, 48, '#fecdd3'],
    ['m_res', 'Resource Inventory Module', 240, 115, 130, 48, '#fef9c3'],
];
foreach ($modules as [$id, $label, $x, $y, $w, $h, $fill]) {
    $body .= box($id, $label, $x, $y, $w, $h, $fill, 10, 'webapp');
}

$body .= box('mysql', 'MySQL 8.0 Database (InnoDB)', 370, 440, 360, 52, '#fef08a', 13);
$body .= box('ext_smtp', 'SMTP Email', 80, 540, 130, 48, '#dbeafe', 10);
$body .= box('ext_sms', 'SMS API', 230, 540, 130, 48, '#bbf7d0', 10);
$body .= box('ext_gemini', 'Gemini API', 380, 540, 130, 48, '#fed7aa', 10);
$body .= box('ext_g6', 'Group 6 Campaign API', 530, 540, 150, 48, '#e9d5ff', 10);
$body .= box('ext_cloud', 'Cloudinary CDN', 700, 540, 130, 48, '#e2e8f0', 10);
$body .= box('ext_verify', 'Public Certificate Verifier (QR)', 850, 540, 170, 48, '#f1f5f9', 9);

$body .= arrow('a1', 'users', 'webapp', 'HTTP / HTTPS', 2);
$body .= arrow('a2', 'webapp', 'mysql', '', 3);
$body .= arrow('a3', 'mysql', 'ext_gemini', '', 2);
$body .= arrow('a4', 'mysql', 'ext_g6', '', 2);
$body .= arrow('a5', 'mysql', 'ext_smtp', '', 2);
$body .= arrow('a6', 'mysql', 'ext_sms', '', 2);
$body .= arrow('a7', 'mysql', 'ext_cloud', '', 2);
$body .= arrow('a8', 'mysql', 'ext_verify', '', 2);

$drawio = '<?xml version="1.0" encoding="UTF-8"?>'
    . '<mxfile host="app.diagrams.net" modified="' . date('c') . '" agent="generate_communication_pattern.php" version="22.1.0" type="device">'
    . wrapDiagram($body, 1100, 680)
    . '</mxfile>';

$drawioPath = $outDir . DIRECTORY_SEPARATOR . '38_Communication_Interaction_Pattern.drawio';
$svgPath = $outDir . DIRECTORY_SEPARATOR . '38_Communication_Interaction_Pattern.svg';
$pngPath = $outDir . DIRECTORY_SEPARATOR . '38_Communication_Interaction_Pattern.png';

file_put_contents($drawioPath, $drawio);
file_put_contents($svgPath, buildSvg());

$pngOk = exportPng($svgPath, $pngPath, $erdDir);

if (!is_dir($docsAppDir)) {
    mkdir($docsAppDir, 0777, true);
}
$docsPng = $docsAppDir . DIRECTORY_SEPARATOR . 'Communication_Interaction_Pattern.png';
$docsCopy = $pngOk ? $docsPng : ($docsAppDir . DIRECTORY_SEPARATOR . 'Communication_Interaction_Pattern.svg');
copy($pngOk ? $pngPath : $svgPath, $docsCopy);

// Also copy to Documents root for manuscript pack
$rootPng = dirname($outDir) . DIRECTORY_SEPARATOR . '38_Communication_Interaction_Pattern.png';
if ($pngOk) {
    copy($pngPath, $rootPng);
}

echo 'DRAWIO_OK=' . $drawioPath . PHP_EOL;
echo 'SVG_OK=' . $svgPath . PHP_EOL;
echo 'PNG_OK=' . ($pngOk ? $pngPath : 'failed') . PHP_EOL;
echo 'DOCS_COPY=' . $docsCopy . PHP_EOL;
