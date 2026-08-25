<?php

/**
 * Thesis architecture figures — reference-style (icons, tree layout, banners).
 * Run: php Documents/architecture/generate_thesis_figures.php
 */

$outDir = __DIR__;
$docsRoot = dirname($outDir);
$docsAppDir = dirname($outDir, 2) . DIRECTORY_SEPARATOR . 'my-app' . DIRECTORY_SEPARATOR . 'docs';
$erdDir = $docsRoot . DIRECTORY_SEPARATOR . 'erd';

function esc(string $s): string
{
    return htmlspecialchars($s, ENT_QUOTES | ENT_XML1, 'UTF-8');
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
const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: 2800 } });
fs.writeFileSync(process.argv[3], resvg.render().asPng());
JS;
    $jsPath = $erdDir . DIRECTORY_SEPARATOR . '_resvg_thesis_fig.js';
    file_put_contents($jsPath, $js);
    shell_exec('cd /d ' . escapeshellarg($erdDir) . ' && node ' . escapeshellarg($jsPath) . ' ' . escapeshellarg($svgPath) . ' ' . escapeshellarg($pngPath) . ' 2>&1');
    @unlink($jsPath);
    return is_file($pngPath) && filesize($pngPath) > 500;
}

function wrapDrawio(string $name, string $body, int $w = 1100, int $h = 820): string
{
    return '<?xml version="1.0" encoding="UTF-8"?>'
        . '<mxfile host="app.diagrams.net" agent="generate_thesis_figures.php" version="22.1.0" type="device">'
        . '<diagram id="' . esc($name) . '" name="' . esc($name) . '">'
        . '<mxGraphModel dx="1100" dy="820" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="' . $w . '" pageHeight="' . $h . '" math="0" shadow="0">'
        . '<root><mxCell id="0"/><mxCell id="1" parent="0"/>'
        . $body
        . '</root></mxGraphModel></diagram></mxfile>';
}

function iconCell(string $id, string $style, int $x, int $y, int $w, int $h, string $label = ''): string
{
    $lbl = $label !== '' ? 'verticalLabelPosition=bottom;verticalAlign=top;labelBackgroundColor=#ffffff;' : 'points=[];';
    return sprintf(
        '<mxCell id="%s" value="%s" style="%s;html=1;whiteSpace=wrap;align=center;%sfontSize=9;fontStyle=0;" vertex="1" parent="1"><mxGeometry x="%d" y="%d" width="%d" height="%d" as="geometry"/></mxCell>',
        esc($id), esc($label), esc($style), $lbl, $x, $y, $w, $h
    );
}

function rectCell(string $id, string $label, int $x, int $y, int $w, int $h, string $fill, string $stroke = '#334155', int $fs = 10, bool $bold = true, int $r = 8): string
{
    $font = $bold ? 'fontStyle=1;' : '';
    return sprintf(
        '<mxCell id="%s" value="%s" style="rounded=%d;whiteSpace=wrap;html=1;fillColor=%s;strokeColor=%s;%sfontSize=%d;align=center;verticalAlign=middle;" vertex="1" parent="1"><mxGeometry x="%d" y="%d" width="%d" height="%d" as="geometry"/></mxCell>',
        esc($id), esc($label), $r, esc($fill), esc($stroke), $font, $fs, $x, $y, $w, $h
    );
}

function edge(string $id, int $x1, int $y1, int $x2, int $y2, bool $dashed = false, string $label = '', bool $arrow = true): string
{
    $dash = $dashed ? 'dashed=1;dashPattern=8 4;' : '';
    $end = $arrow ? 'endArrow=block;endFill=1;' : 'endArrow=none;';
    $lbl = $label !== '' ? 'labelBackgroundColor=#ffffff;fontSize=10;fontColor=#334155;' : '';
    return sprintf(
        '<mxCell id="%s" value="%s" style="%s%shtml=1;strokeWidth=2;strokeColor=#334155;%s" edge="1" parent="1"><mxGeometry relative="1" as="geometry"><mxPoint x="%d" y="%d" as="sourcePoint"/><mxPoint x="%d" y="%d" as="targetPoint"/></mxGeometry></mxCell>',
        esc($id), esc($label), $end, $dash, $lbl, $x1, $y1, $x2, $y2
    );
}

function svgHeader(int $w, int $h): string
{
    return '<?xml version="1.0" encoding="UTF-8"?>'
        . '<svg xmlns="http://www.w3.org/2000/svg" width="' . $w . '" height="' . $h . '" viewBox="0 0 ' . $w . ' ' . $h . '">'
        . '<defs>'
        . '<marker id="arr" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto"><polygon points="0 0,10 3.5,0 7" fill="#334155"/></marker>'
        . '<linearGradient id="titleGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#1e4a7a"/><stop offset="100%" stop-color="#1e3a5f"/></linearGradient>'
        . '</defs><rect width="100%" height="100%" fill="#ffffff"/>';
}

function svgTitleBanner(int $w, string $text, int $y = 18, int $h = 42): string
{
    $x = 40;
    $bw = $w - 80;
    return '<rect x="' . $x . '" y="' . $y . '" width="' . $bw . '" height="' . $h . '" rx="14" fill="url(#titleGrad)" stroke="#16324f"/>'
        . '<text x="' . ($w / 2) . '" y="' . ($y + 27) . '" text-anchor="middle" fill="#ffffff" font-family="Arial,sans-serif" font-size="14" font-weight="700">' . esc($text) . '</text>';
}

function svgCaption(int $w, int $y, string $text): string
{
    return '<text x="' . ($w / 2) . '" y="' . $y . '" text-anchor="middle" font-family="Arial,sans-serif" font-size="12" font-style="italic" fill="#334155">' . esc($text) . '</text>';
}

function svgPerson(int $cx, int $cy, float $s = 1.0): string
{
    return '<g transform="translate(' . ($cx - 16 * $s) . ',' . ($cy - 24 * $s) . ') scale(' . $s . ')">'
        . '<circle cx="16" cy="8" r="7" fill="none" stroke="#334155" stroke-width="2"/>'
        . '<path d="M4 36 Q16 22 28 36" fill="none" stroke="#334155" stroke-width="2"/>'
        . '</g>';
}

function svgLaptop(int $x, int $y): string
{
    return '<rect x="' . $x . '" y="' . $y . '" width="42" height="28" rx="3" fill="#e2e8f0" stroke="#334155" stroke-width="1.5"/>'
        . '<rect x="' . ($x + 5) . '" y="' . ($y + 4) . '" width="32" height="18" fill="#ffffff" stroke="#334155"/>'
        . '<path d="M' . ($x - 4) . ' ' . ($y + 28) . ' L' . ($x + 46) . ' ' . ($y + 28) . ' L' . ($x + 42) . ' ' . ($y + 34) . ' L' . ($x + 0) . ' ' . ($y + 34) . ' Z" fill="#cbd5e1" stroke="#334155"/>';
}

function svgCodeBox(int $x, int $y): string
{
    return '<rect x="' . $x . '" y="' . $y . '" width="54" height="54" rx="8" fill="#3b82f6" stroke="#1d4ed8" stroke-width="2"/>'
        . '<text x="' . ($x + 27) . '" y="' . ($y + 34) . '" text-anchor="middle" fill="#ffffff" font-family="Consolas,monospace" font-size="18" font-weight="700">&lt;/&gt;</text>';
}

function svgGitHubDb(int $cx, int $cy): string
{
    return '<ellipse cx="' . $cx . '" cy="' . ($cy + 18) . '" rx="34" ry="10" fill="#cbd5e1" stroke="#334155"/>'
        . '<rect x="' . ($cx - 34) . '" y="' . ($cy - 18) . '" width="68" height="36" rx="4" fill="#dbeafe" stroke="#334155" stroke-width="2"/>'
        . '<ellipse cx="' . $cx . '" cy="' . ($cy - 18) . '" rx="34" ry="10" fill="#eff6ff" stroke="#334155" stroke-width="2"/>'
        . '<circle cx="' . $cx . '" cy="' . $cy . '" r="10" fill="#24292f"/>'
        . '<path d="M' . ($cx - 4) . ' ' . ($cy - 2) . ' c0-2 1-3 3-3 s2 1 2 2 c0 1-1 2-2 2 v1 M' . ($cx + 1) . ' ' . ($cy + 5) . ' h-1" fill="none" stroke="#fff" stroke-width="1.2"/>';
}

function svgCloudHost(int $cx, int $cy): string
{
    return '<path d="M' . ($cx - 48) . ' ' . ($cy + 8) . ' q0-24 24-24 q8-18 32-10 q14-2 22 10 q18 2 18 20 q0 16-16 16 H' . ($cx - 40) . ' q-20 0-20-12 z" fill="#dbeafe" stroke="#334155" stroke-width="2"/>'
        . '<rect x="' . ($cx - 14) . '" y="' . ($cy - 6) . '" width="28" height="28" rx="4" fill="#673de6" stroke="#4c1d95"/>'
        . '<text x="' . $cx . '" y="' . ($cy + 14) . '" text-anchor="middle" fill="#fff" font-family="Arial" font-size="16" font-weight="700">H</text>';
}

function svgModuleIcon(int $cx, int $cy, string $type): string
{
    switch ($type) {
        case 'book':
            return '<path d="M' . ($cx - 14) . ' ' . ($cy - 10) . ' v28 q14-4 28 0 v-28 q-14 4-28 0 z" fill="#fff" stroke="#334155" stroke-width="1.5"/>'
                . '<line x1="' . $cx . '" y1="' . ($cy - 10) . '" x2="' . $cx . '" y2="' . ($cy + 18) . '" stroke="#334155"/>';
        case 'calendar':
            return '<rect x="' . ($cx - 14) . '" y="' . ($cy - 8) . '" width="28" height="24" rx="3" fill="#fff" stroke="#334155" stroke-width="1.5"/>'
                . '<line x1="' . ($cx - 14) . '" y1="' . ($cy - 2) . '" x2="' . ($cx + 14) . '" y2="' . ($cy - 2) . '" stroke="#334155"/>'
                . '<circle cx="' . ($cx + 4) . '" cy="' . ($cy + 10) . '" r="4" fill="#ef4444"/>';
        case 'people':
            return svgPerson($cx - 8, $cy + 6, 0.55) . svgPerson($cx + 8, $cy + 6, 0.55) . svgPerson($cx, $cy - 2, 0.65);
        case 'map':
            return '<circle cx="' . ($cx - 8) . '" cy="' . ($cy + 6) . '" r="4" fill="#ef4444"/>'
                . '<circle cx="' . ($cx + 8) . '" cy="' . ($cy - 4) . '" r="4" fill="#3b82f6"/>'
                . '<path d="M' . $cx . ' ' . ($cy - 12) . ' L' . ($cx - 8) . ' ' . ($cy + 6) . ' L' . ($cx + 8) . ' ' . ($cy - 4) . '" fill="none" stroke="#334155" stroke-width="1.5"/>';
        case 'stars':
            return '<rect x="' . ($cx - 12) . '" y="' . ($cy - 10) . '" width="24" height="28" rx="2" fill="#fff" stroke="#334155"/>'
                . '<text x="' . $cx . '" y="' . ($cy + 4) . '" text-anchor="middle" font-size="10" fill="#f59e0b">★★★</text>';
        case 'cert':
            return '<rect x="' . ($cx - 14) . '" y="' . ($cy - 10) . '" width="28" height="22" fill="#fff" stroke="#334155"/>'
                . '<circle cx="' . $cx . '" cy="' . ($cy + 14) . '" r="6" fill="#fbbf24" stroke="#334155"/>';
        case 'shelf':
            return '<rect x="' . ($cx - 14) . '" y="' . ($cy - 4) . '" width="28" height="16" fill="#fff" stroke="#334155"/>'
                . '<rect x="' . ($cx - 10) . '" y="' . ($cy - 12) . '" width="8" height="8" fill="#fbbf24" stroke="#334155"/>'
                . '<path d="M' . ($cx + 2) . ' ' . ($cy - 12) . ' l6 4 v8 h-12 v-8 z" fill="#f97316" stroke="#334155"/>';
        default:
            return '<circle cx="' . $cx . '" cy="' . $cy . '" r="12" fill="#dbeafe" stroke="#334155"/>';
    }
}

function svgGear(int $cx, int $cy, float $r = 16): string
{
    return '<circle cx="' . $cx . '" cy="' . $cy . '" r="' . ($r * 0.45) . '" fill="none" stroke="#334155" stroke-width="2"/>'
        . '<g stroke="#334155" stroke-width="2" fill="none">'
        . '<line x1="' . $cx . '" y1="' . ($cy - $r) . '" x2="' . $cx . '" y2="' . ($cy - $r * 0.55) . '"/>'
        . '<line x1="' . $cx . '" y1="' . ($cy + $r) . '" x2="' . $cx . '" y2="' . ($cy + $r * 0.55) . '"/>'
        . '<line x1="' . ($cx - $r) . '" y1="' . $cy . '" x2="' . ($cx - $r * 0.55) . '" y2="' . $cy . '"/>'
        . '<line x1="' . ($cx + $r) . '" y1="' . $cy . '" x2="' . ($cx + $r * 0.55) . '" y2="' . $cy . '"/>'
        . '</g>';
}

function svgGateway(int $cx, int $cy): string
{
    return '<polygon points="' . $cx . ',' . ($cy - 34) . ' ' . ($cx + 30) . ',' . ($cy - 10) . ' ' . ($cx + 30) . ',' . ($cy + 18) . ' ' . $cx . ',' . ($cy + 34) . ' ' . ($cx - 30) . ',' . ($cy + 18) . ' ' . ($cx - 30) . ',' . ($cy - 10) . '" fill="#ff9900" stroke="#c2410c" stroke-width="2"/>'
        . '<rect x="' . ($cx - 18) . '" y="' . ($cy - 8) . '" width="36" height="8" fill="#fff" opacity="0.9"/>'
        . '<rect x="' . ($cx - 18) . '" y="' . ($cy + 4) . '" width="36" height="8" fill="#fff" opacity="0.9"/>';
}

function svgDb(int $cx, int $cy, string $color = '#dbeafe'): string
{
    return '<ellipse cx="' . $cx . '" cy="' . ($cy + 14) . '" rx="18" ry="6" fill="#94a3b8"/>'
        . '<rect x="' . ($cx - 18) . '" y="' . ($cy - 10) . '" width="36" height="24" fill="' . $color . '" stroke="#334155"/>'
        . '<ellipse cx="' . $cx . '" cy="' . ($cy - 10) . '" rx="18" ry="6" fill="' . $color . '" stroke="#334155"/>';
}

// ─── Figure 43: IaC ─────────────────────────────────────────────────────────
function buildIacDrawio(): string
{
    $b = rectCell('title', 'DISASTER PREPAREDNESS TRAINING &amp; SIMULATION IAC', 80, 16, 940, 44, '#1e3a5f', '#16324f', 13, true, 14);
    $b .= iconCell('dev', 'shape=umlActor;fillColor=#ffffff;strokeColor=#334155;', 170, 88, 40, 60, 'Developer');
    $b .= iconCell('code', 'shape=process;rounded=1;fillColor=#3b82f6;fontColor=#ffffff;strokeColor=#1d4ed8;', 260, 92, 56, 56);
    $b .= iconCell('git', 'shape=cylinder3;whiteSpace=wrap;html=1;boundedLbl=1;backgroundOutline=1;size=12;fillColor=#dbeafe;strokeColor=#334155;', 380, 88, 70, 72, 'Git Repository&#xa;(IaC + App Code)');
    $b .= edge('e1', 210, 118, 260, 118);
    $b .= edge('e2', 316, 118, 380, 118);
    $b .= edge('e3', 415, 160, 415, 205, false, 'Build &amp; Deploy');
    $b .= rectCell('cicd', 'CI/CD Pipeline&#xa;Build, Test &amp; Deploy', 340, 205, 150, 52, '#3b82f6', '#1d4ed8', 10, true, 6);
    $b .= edge('e4', 415, 257, 415, 300);
    $b .= iconCell('host', 'shape=ellipse;shape=cloud;whiteSpace=wrap;html=1;fillColor=#dbeafe;strokeColor=#334155;', 385, 300, 60, 40, 'Hosting&#xa;Hostinger VPS');
    $modules = [
        ['m1', 'Training Module&#xa;Management', 70, 'shape=mxgraph.basic.book;'],
        ['m2', 'Simulation Event&#xa;Planning', 200, 'shape=mxgraph.office.calendar;'],
        ['m3', 'Participant Registration&#xa;&amp; Attendance', 330, 'shape=mxgraph.office.users;'],
        ['m4', 'Scenario-Based&#xa;Simulations', 460, 'shape=mxgraph.signs.traffic_light;'],
        ['m5', 'Evaluation &amp;&#xa;Scoring System', 590, 'shape=mxgraph.office.concepts.checklist;'],
        ['m6', 'Certification&#xa;Management', 720, 'shape=mxgraph.basic.diamond;'],
        ['m7', 'Resources &amp; Equipment&#xa;Inventory', 850, 'shape=mxgraph.signs.warehouse;'],
    ];
    $b .= edge('tree', 415, 340, 415, 380, false, '', false);
    $b .= edge('treeH', 120, 380, 910, 380, false, '', false);
    foreach ($modules as [$id, $label, $x, $shape]) {
        $b .= edge('d_' . $id, $x + 35, 380, $x + 35, 400);
        $b .= iconCell($id, $shape . 'fillColor=#ffffff;strokeColor=#334155;', $x, 400, 50, 50, $label);
    }
    $b .= '<mxCell id="cap" value="Figure no. __ Infrastructure as a Code (IaC)" style="text;html=1;strokeColor=none;fillColor=none;align=center;fontSize=12;fontStyle=2;" vertex="1" parent="1"><mxGeometry x="80" y="760" width="940" height="24" as="geometry"/></mxCell>';
    return $b;
}

function buildIacSvg(): string
{
    $w = 1020; $h = 780;
    $svg = svgHeader($w, $h);
    $svg .= svgTitleBanner($w, 'DISASTER PREPAREDNESS TRAINING & SIMULATION IAC');
    $svg .= svgPerson(190, 130);
    $svg .= '<text x="190" y="175" text-anchor="middle" font-family="Arial" font-size="10" font-weight="700">Developer</text>';
    $svg .= svgCodeBox(270, 98);
    $svg .= '<line x1="230" y1="125" x2="270" y2="125" stroke="#334155" stroke-width="2" marker-end="url(#arr)"/>';
    $svg .= svgGitHubDb(420, 125);
    $svg .= '<text x="420" y="175" text-anchor="middle" font-family="Arial" font-size="9" font-weight="700">Git Repository (IaC + App Code)</text>';
    $svg .= '<line x1="326" y1="125" x2="380" y2="125" stroke="#334155" stroke-width="2" marker-end="url(#arr)"/>';
    $svg .= '<line x1="420" y1="175" x2="420" y2="215" stroke="#334155" stroke-width="2" marker-end="url(#arr)"/>';
    $svg .= '<text x="450" y="200" font-family="Arial" font-size="10" fill="#475569">Build &amp; Deploy</text>';
    $svg .= '<rect x="345" y="215" width="150" height="48" rx="6" fill="#3b82f6" stroke="#1d4ed8"/>';
    $svg .= '<text x="420" y="236" text-anchor="middle" fill="#fff" font-family="Arial" font-size="11" font-weight="700">CI/CD Pipeline</text>';
    $svg .= '<text x="420" y="252" text-anchor="middle" fill="#dbeafe" font-family="Arial" font-size="9">Build, Test &amp; Deploy</text>';
    $svg .= '<line x1="420" y1="263" x2="420" y2="295" stroke="#334155" stroke-width="2" marker-end="url(#arr)"/>';
    $svg .= svgCloudHost(420, 315);
    $svg .= '<text x="420" y="365" text-anchor="middle" font-family="Arial" font-size="10" font-weight="700">Hosting (Hostinger VPS)</text>';
    $svg .= '<line x1="420" y1="345" x2="420" y2="395" stroke="#334155" stroke-width="2"/>';
    $svg .= '<line x1="90" y1="395" x2="930" y2="395" stroke="#334155" stroke-width="2"/>';
    $mods = [
        [90, 'book', "Training Module\nManagement"],
        [220, 'calendar', "Simulation Event\nPlanning"],
        [350, 'people', "Participant Registration\n& Attendance"],
        [480, 'map', "Scenario-Based\nSimulations"],
        [610, 'stars', "Evaluation &\nScoring System"],
        [740, 'cert', "Certification\nManagement"],
        [870, 'shelf', "Resources & Equipment\nInventory for Simulation"],
    ];
    foreach ($mods as [$x, $icon, $label]) {
        $cx = $x + 55;
        $svg .= '<line x1="' . $cx . '" y1="395" x2="' . $cx . '" y2="420" stroke="#334155" stroke-width="2" marker-end="url(#arr)"/>';
        $svg .= svgModuleIcon($cx, 445, $icon);
        $lines = explode("\n", $label);
        $ly = 490;
        foreach ($lines as $ln) {
            $svg .= '<text x="' . $cx . '" y="' . $ly . '" text-anchor="middle" font-family="Arial" font-size="8.5" font-weight="700">' . esc($ln) . '</text>';
            $ly += 12;
        }
    }
    $svg .= svgCaption($w, 760, 'Figure no. __ Infrastructure as a Code (IaC)');
    $svg .= '</svg>';
    return $svg;
}

// ─── Figure 44: Monitoring ──────────────────────────────────────────────────
function buildMonitoringDrawio(): string
{
    $b = rectCell('title', 'MONITORING AND ALERTING', 80, 16, 940, 44, '#1e3a5f', '#16324f', 14, true, 14);
    $b .= iconCell('u1', 'shape=umlActor;fillColor=#ffffff;strokeColor=#334155;', 70, 120, 40, 60, 'Trainers / Admins');
    $b .= iconCell('u2', 'shape=mxgraph.office.devices.laptop;fillColor=#ffffff;strokeColor=#334155;', 70, 210, 60, 40, 'Web App');
    $b .= '<mxCell id="frame" value="" style="rounded=0;whiteSpace=wrap;html=1;fillColor=none;strokeColor=#334155;strokeWidth=3;" vertex="1" parent="1"><mxGeometry x="210" y="95" width="460" height="230" as="geometry"/></mxCell>';
    $b .= iconCell('gear', 'shape=mxgraph.basic.gear;fillColor=#fde047;strokeColor=#854d0e;', 420, 105, 40, 40);
    $b .= rectCell('mon', 'MONITORING', 330, 150, 220, 28, '#fde047', '#854d0e', 12, true, 4);
    $b .= rectCell('data', 'DATA COLLECTION &amp; TRANSMIT', 280, 188, 320, 26, '#fef08a', '#854d0e', 10, true, 4);
    $b .= iconCell('s1', 'shape=mxgraph.office.concepts.checklist;fillColor=#ffffff;strokeColor=#334155;', 250, 225, 50, 50, 'Session Status');
    $b .= iconCell('s2', 'shape=mxgraph.office.chart.bar;fillColor=#ffffff;strokeColor=#334155;', 365, 225, 50, 50, 'Participant Activity');
    $b .= iconCell('s3', 'shape=mxgraph.networks.wireless_hub;fillColor=#ffffff;strokeColor=#334155;', 480, 225, 50, 50, 'System Health &amp; Latency');
    $b .= edge('lu1', 110, 150, 210, 170, true);
    $b .= edge('lu2', 110, 230, 210, 210, true);
    $b .= rectCell('srv', 'Monitoring Server', 720, 110, 130, 40, '#fef08a', '#854d0e', 10, true, 12);
    $b .= rectCell('gw', 'API Gateway', 720, 175, 130, 40, '#fef08a', '#854d0e', 10, true, 12);
    $b .= rectCell('db', 'Training DB &amp; Logs', 720, 240, 130, 40, '#fef08a', '#854d0e', 10, true, 12);
    $b .= edge('lr1', 670, 170, 720, 130, true);
    $b .= edge('lr2', 670, 200, 720, 195, true);
    $b .= edge('lr3', 670, 230, 720, 260, true);
    $b .= edge('down', 440, 325, 440, 365, true);
    $b .= rectCell('issue', 'Issue Detected?', 370, 365, 140, 40, '#fef08a', '#854d0e', 11, true, 14);
    $b .= edge('toAlert', 440, 405, 440, 445);
    $b .= rectCell('alert', 'Alerting', 395, 445, 90, 36, '#ef4444', '#b91c1c', 11, true, 10);
    $b .= iconCell('mail', 'shape=mxgraph.office.concepts.envelope;fillColor=#ffffff;strokeColor=#334155;', 300, 520, 50, 40, 'Email Alerts');
    $b .= iconCell('sms', 'shape=mxgraph.office.devices.cellphone;fillColor=#ffffff;strokeColor=#334155;', 530, 520, 40, 50, 'SMS / Push');
    $b .= edge('a1', 410, 481, 340, 520, true);
    $b .= edge('a2', 470, 481, 550, 520, true);
    $b .= '<mxCell id="cap" value="Figure no. __ Monitoring and Alerting" style="text;html=1;strokeColor=none;fillColor=none;align=center;fontSize=12;fontStyle=2;" vertex="1" parent="1"><mxGeometry x="80" y="760" width="940" height="24" as="geometry"/></mxCell>';
    return $b;
}

function buildMonitoringSvg(): string
{
    $w = 1020; $h = 780;
    $svg = svgHeader($w, $h);
    $svg .= svgTitleBanner($w, 'MONITORING AND ALERTING');
    $svg .= svgPerson(100, 145);
    $svg .= '<text x="100" y="195" text-anchor="middle" font-family="Arial" font-size="9" font-weight="700">Trainers / Admins</text>';
    $svg .= svgLaptop(78, 225);
    $svg .= '<text x="100" y="275" text-anchor="middle" font-family="Arial" font-size="9" font-weight="700">Web App</text>';
    $svg .= '<rect x="210" y="95" width="460" height="230" fill="none" stroke="#334155" stroke-width="3"/>';
    $svg .= svgGear(440, 125);
    $svg .= '<rect x="330" y="150" width="220" height="28" rx="4" fill="#fde047" stroke="#854d0e"/>';
    $svg .= '<text x="440" y="169" text-anchor="middle" font-family="Arial" font-size="12" font-weight="700">MONITORING</text>';
    $svg .= '<rect x="280" y="188" width="320" height="26" rx="4" fill="#fef08a" stroke="#854d0e"/>';
    $svg .= '<text x="440" y="206" text-anchor="middle" font-family="Arial" font-size="10" font-weight="700">DATA COLLECTION &amp; TRANSMIT</text>';
    foreach ([[280, 'Session Status', 'checklist'], [395, 'Participant Activity', 'chart'], [510, 'System Health & Latency', 'net']] as [$x, $lbl, $type]) {
        $cx = $x + 35;
        if ($type === 'checklist') {
            $svg .= '<rect x="' . $x . '" y="228" width="36" height="44" fill="#fff" stroke="#334155"/><line x1="' . ($x + 8) . '" y1="240" x2="' . ($x + 28) . '" y2="240" stroke="#334155"/><line x1="' . ($x + 8) . '" y1="252" x2="' . ($x + 28) . '" y2="252" stroke="#334155"/>';
        } elseif ($type === 'chart') {
            $svg .= '<rect x="' . ($x + 6) . '" y="252" width="8" height="16" fill="#3b82f6"/><rect x="' . ($x + 18) . '" y="244" width="8" height="24" fill="#22c55e"/><rect x="' . ($x + 30) . '" y="236" width="8" height="32" fill="#f59e0b"/>';
        } else {
            $svg .= '<circle cx="' . $cx . '" cy="250" r="14" fill="none" stroke="#334155" stroke-width="1.5"/><line x1="' . $cx . '" y1="236" x2="' . $cx . '" y2="264" stroke="#334155"/><line x1="' . ($cx - 14) . '" y1="250" x2="' . ($cx + 14) . '" y2="250" stroke="#334155"/>';
        }
        $svg .= '<text x="' . $cx . '" y="290" text-anchor="middle" font-family="Arial" font-size="8" font-weight="700">' . esc($lbl) . '</text>';
    }
    $svg .= '<line x1="130" y1="155" x2="210" y2="175" stroke="#334155" stroke-width="1.5" stroke-dasharray="8 4"/>';
    $svg .= '<line x1="130" y1="245" x2="210" y2="215" stroke="#334155" stroke-width="1.5" stroke-dasharray="8 4"/>';
    foreach ([[720, 120, 'Monitoring Server'], [720, 185, 'API Gateway'], [720, 250, 'Training DB & Logs']] as [$x, $y, $lbl]) {
        $svg .= '<rect x="' . $x . '" y="' . $y . '" width="130" height="40" rx="14" fill="#fef08a" stroke="#854d0e"/>';
        $svg .= '<text x="' . ($x + 65) . '" y="' . ($y + 25) . '" text-anchor="middle" font-family="Arial" font-size="10" font-weight="700">' . esc($lbl) . '</text>';
        $svg .= '<line x1="670" y1="' . ($y + 20) . '" x2="' . $x . '" y2="' . ($y + 20) . '" stroke="#334155" stroke-width="1.5" stroke-dasharray="8 4"/>';
    }
    $svg .= '<line x1="440" y1="325" x2="440" y2="365" stroke="#334155" stroke-width="1.5" stroke-dasharray="8 4" marker-end="url(#arr)"/>';
    $svg .= '<rect x="370" y="365" width="140" height="40" rx="14" fill="#fef08a" stroke="#854d0e"/>';
    $svg .= '<text x="440" y="390" text-anchor="middle" font-family="Arial" font-size="11" font-weight="700">Issue Detected?</text>';
    $svg .= '<line x1="440" y1="405" x2="440" y2="445" stroke="#334155" stroke-width="2" marker-end="url(#arr)"/>';
    $svg .= '<rect x="395" y="445" width="90" height="36" rx="8" fill="#ef4444" stroke="#b91c1c"/>';
    $svg .= '<text x="440" y="468" text-anchor="middle" fill="#fff" font-family="Arial" font-size="11" font-weight="700">Alerting</text>';
    $svg .= '<rect x="285" y="520" width="36" height="26" fill="#fff" stroke="#334155"/><path d="M285 520 L303 533 L285 546 Z" fill="#fff" stroke="#334155"/>';
    $svg .= '<text x="303" y="560" text-anchor="middle" font-family="Arial" font-size="9" font-weight="700">Email Alerts</text>';
    $svg .= '<rect x="535" y="520" width="24" height="36" rx="4" fill="#fff" stroke="#334155"/><circle cx="547" cy="548" r="3" fill="#334155"/>';
    $svg .= '<text x="547" y="575" text-anchor="middle" font-family="Arial" font-size="9" font-weight="700">SMS / Push</text>';
    $svg .= '<line x1="410" y1="481" x2="330" y2="520" stroke="#334155" stroke-width="1.5" stroke-dasharray="8 4"/>';
    $svg .= '<line x1="470" y1="481" x2="550" y2="520" stroke="#334155" stroke-width="1.5" stroke-dasharray="8 4"/>';
    $svg .= svgCaption($w, 760, 'Figure no. __ Monitoring and Alerting');
    $svg .= '</svg>';
    return $svg;
}

// ─── Figure 45: API Gateway ───────────────────────────────────────────────────
function buildApiGatewayDrawio(): string
{
    $b = rectCell('title', 'API GATEWAY', 80, 16, 940, 44, '#1e3a5f', '#16324f', 14, true, 14);
    $b .= iconCell('u1', 'shape=mxgraph.office.devices.workstation;fillColor=#ffffff;strokeColor=#334155;', 50, 170, 50, 40, 'Web Users');
    $b .= iconCell('u2', 'shape=mxgraph.office.users;fillColor=#ffffff;strokeColor=#334155;', 50, 260, 50, 40, 'LGU Staff &amp; Trainers');
    $b .= iconCell('u3', 'shape=mxgraph.signs.people;fillColor=#ffffff;strokeColor=#334155;', 50, 350, 50, 40, 'Responders');
    $b .= iconCell('gw', 'shape=mxgraph.aws4.api_gateway;fillColor=#ff9900;strokeColor=#c2410c;', 180, 250, 70, 70, 'API Gateway');
    $b .= edge('ug1', 100, 190, 180, 280);
    $b .= edge('ug2', 100, 280, 180, 285);
    $b .= edge('ug3', 100, 370, 180, 290);
    $chain = [
        ['a1', 'Authentication &amp; Authorization', 310, 'shape=mxgraph.aws4.certificate_manager_3;'],
        ['a2', 'Disaster Training Management', 460, 'shape=mxgraph.aws4.generic_database;'],
        ['a3', 'Simulation Engine', 610, 'shape=mxgraph.aws4.aurora;'],
        ['a4', 'AI Scenario Generation', 760, 'shape=mxgraph.aws4.sagemaker;'],
        ['a5', 'Logging &amp; Monitoring', 910, 'shape=mxgraph.aws4.cloudwatch_2;'],
    ];
    $prev = 250;
    foreach ($chain as [$id, $label, $x, $shape]) {
        $b .= edge('c_' . $id, $prev, 285, $x, 285);
        $b .= iconCell($id, $shape . 'fillColor=#ffffff;strokeColor=#334155;', $x, 255, 50, 50, $label);
        $prev = $x + 50;
    }
    $b .= rectCell('sub2', 'Training Database', 450, 330, 110, 24, '#dbeafe', '#334155', 8, false, 6);
    $b .= rectCell('sub3', 'Simulation Results DB', 600, 330, 120, 24, '#fecaca', '#334155', 8, false, 6);
    $b .= rectCell('sub4', 'Gemini AI API', 750, 330, 100, 24, '#fed7aa', '#334155', 8, false, 6);
    $b .= '<mxCell id="cap" value="Figure no. __ API Gateway" style="text;html=1;strokeColor=none;fillColor=none;align=center;fontSize=12;fontStyle=2;" vertex="1" parent="1"><mxGeometry x="80" y="760" width="940" height="24" as="geometry"/></mxCell>';
    return $b;
}

function buildApiGatewaySvg(): string
{
    $w = 1020; $h = 780;
    $svg = svgHeader($w, $h);
    $svg .= svgTitleBanner($w, 'API GATEWAY');
    $svg .= svgLaptop(55, 165);
    $svg .= '<rect x="55" y="205" width="18" height="28" rx="3" fill="#e2e8f0" stroke="#334155"/>';
    $svg .= '<text x="75" y="195" text-anchor="middle" font-family="Arial" font-size="9" font-weight="700">Web Users</text>';
    $svg .= svgPerson(75, 265, 0.8);
    $svg .= svgPerson(95, 275, 0.7);
    $svg .= svgPerson(55, 275, 0.7);
    $svg .= '<text x="75" y="315" text-anchor="middle" font-family="Arial" font-size="9" font-weight="700">LGU Staff &amp; Trainers</text>';
    $svg .= svgPerson(75, 365, 0.85);
    $svg .= '<rect x="65" y="350" width="20" height="8" fill="#fbbf24" stroke="#334155"/>';
    $svg .= '<text x="75" y="405" text-anchor="middle" font-family="Arial" font-size="9" font-weight="700">Responders</text>';
    $svg .= svgGateway(215, 285);
    $svg .= '<text x="215" y="340" text-anchor="middle" font-family="Arial" font-size="9" font-weight="700">API Gateway</text>';
    $svg .= '<line x1="110" y1="190" x2="180" y2="270" stroke="#334155" stroke-width="1.5" marker-end="url(#arr)"/>';
    $svg .= '<line x1="110" y1="280" x2="180" y2="285" stroke="#334155" stroke-width="1.5" marker-end="url(#arr)"/>';
    $svg .= '<line x1="110" y1="370" x2="180" y2="295" stroke="#334155" stroke-width="1.5" marker-end="url(#arr)"/>';
    $steps = [
        [310, 'Authentication & Authorization', 'auth', ''],
        [460, 'Disaster Training Management', 'db', 'Training Database'],
        [610, 'Simulation Engine', 'dbred', 'Simulation Results DB'],
        [760, 'AI Scenario Generation', 'brain', 'Gemini AI API'],
        [910, 'Logging & Monitoring', 'log', ''],
    ];
    $px = 250;
    foreach ($steps as [$x, $title, $icon, $sub]) {
        $cx = $x + 25;
        $svg .= '<line x1="' . $px . '" y1="285" x2="' . $x . '" y2="285" stroke="#334155" stroke-width="2" marker-end="url(#arr)"/>';
        $svg .= '<text x="' . $cx . '" y="248" text-anchor="middle" font-family="Arial" font-size="8" font-weight="700">' . esc($title) . '</text>';
        if ($icon === 'auth') {
            $svg .= svgDb($cx, 275, '#dbeafe');
            $svg .= '<polygon points="' . ($cx - 12) . ',252 ' . $cx . ',244 ' . ($cx + 12) . ',252 ' . $cx . ',256" fill="#fbbf24" stroke="#334155"/>';
            $svg .= '<rect x="' . ($cx - 4) . '" y="256" width="8" height="6" fill="#fbbf24" stroke="#334155"/>';
        } elseif ($icon === 'db') {
            $svg .= svgDb($cx, 275, '#dbeafe');
            $svg .= '<circle cx="' . $cx . '" cy="258" r="8" fill="#ffffff" stroke="#334155" stroke-width="1.2"/>';
            $svg .= '<circle cx="' . $cx . '" cy="258" r="3" fill="none" stroke="#334155"/>';
        } elseif ($icon === 'dbred') {
            $svg .= svgDb($cx, 275, '#fecaca');
        } elseif ($icon === 'brain') {
            $svg .= '<ellipse cx="' . $cx . '" cy="275" rx="18" ry="14" fill="#fed7aa" stroke="#334155"/>'
                . '<path d="M' . ($cx - 10) . ' 275 q5-8 10 0 q5 8 10 0 q-2 6-10 4 q-8 2-10-4" fill="none" stroke="#7c3aed" stroke-width="1.5"/>';
        } else {
            $svg .= '<rect x="' . ($cx - 10) . '" y="272" width="5" height="12" fill="#3b82f6"/>';
            $svg .= '<rect x="' . ($cx - 3) . '" y="266" width="5" height="18" fill="#22c55e"/>';
            $svg .= '<rect x="' . ($cx + 4) . '" y="269" width="5" height="15" fill="#f59e0b"/>';
            $svg .= '<circle cx="' . ($cx + 16) . '" cy="260" r="9" fill="none" stroke="#334155" stroke-width="1.5"/>';
            $svg .= '<line x1="' . ($cx + 23) . '" y1="267" x2="' . ($cx + 30) . '" y2="274" stroke="#334155" stroke-width="1.5"/>';
        }
        if ($sub !== '') {
            $svg .= '<text x="' . $cx . '" y="330" text-anchor="middle" font-family="Arial" font-size="8" fill="#475569">' . esc($sub) . '</text>';
        }
        $px = $x + 50;
    }
    $svg .= svgCaption($w, 760, 'Figure no. __ API Gateway');
    $svg .= '</svg>';
    return $svg;
}

function writeFigure(string $base, callable $drawioFn, callable $svgFn, string $erdDir): void
{
    global $outDir, $docsAppDir, $docsRoot;
    $drawio = wrapDrawio($base, $drawioFn());
    $svg = $svgFn();
    $drawioPath = $outDir . DIRECTORY_SEPARATOR . $base . '.drawio';
    $svgPath = $outDir . DIRECTORY_SEPARATOR . $base . '.svg';
    $pngPath = $outDir . DIRECTORY_SEPARATOR . $base . '.png';
    file_put_contents($drawioPath, $drawio);
    file_put_contents($svgPath, $svg);
    $pngOk = exportPng($svgPath, $pngPath, $erdDir);
    echo 'DRAWIO_OK=' . $drawioPath . PHP_EOL;
    echo 'PNG_OK=' . ($pngOk ? $pngPath : 'failed') . PHP_EOL;
    if ($pngOk) {
        if (is_dir($docsAppDir)) {
            $short = str_replace(
                ['43_IaC_Infrastructure_as_Code', '44_Monitoring_and_Alerting', '45_API_Gateway'],
                ['IaC_Infrastructure', 'Monitoring_Alerting', 'API_Gateway'],
                $base
            );
            copy($pngPath, $docsAppDir . DIRECTORY_SEPARATOR . $short . '.png');
        }
        copy($pngPath, $docsRoot . DIRECTORY_SEPARATOR . $base . '.png');
    }
}

writeFigure('43_IaC_Infrastructure_as_Code', 'buildIacDrawio', 'buildIacSvg', $erdDir);
writeFigure('44_Monitoring_and_Alerting', 'buildMonitoringDrawio', 'buildMonitoringSvg', $erdDir);
writeFigure('45_API_Gateway', 'buildApiGatewayDrawio', 'buildApiGatewaySvg', $erdDir);

$iacBody = buildIacDrawio();
$monBody = buildMonitoringDrawio();
$apiBody = buildApiGatewayDrawio();
$all = '<?xml version="1.0" encoding="UTF-8"?><mxfile host="app.diagrams.net" agent="generate_thesis_figures.php" version="22.1.0" type="device">';
foreach ([['iac', '43 — IaC', $iacBody], ['mon', '44 — Monitoring', $monBody], ['api', '45 — API Gateway', $apiBody]] as [$id, $name, $body]) {
    $all .= '<diagram id="' . $id . '" name="' . esc($name) . '"><mxGraphModel dx="1100" dy="820" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="1100" pageHeight="820" math="0" shadow="0"><root><mxCell id="0"/><mxCell id="1" parent="0"/>' . $body . '</root></mxGraphModel></diagram>';
}
$all .= '</mxfile>';
file_put_contents($outDir . DIRECTORY_SEPARATOR . '43_45_Thesis_Architecture_All.drawio', $all);
echo 'ALL_OK=' . $outDir . DIRECTORY_SEPARATOR . '43_45_Thesis_Architecture_All.drawio' . PHP_EOL;
