<?php

/**
 * Layered Application Architecture (Figure 34 style) — AlertaraQC.
 * Run: php Documents/architecture/generate_layered_architecture.php
 */

$outDir = __DIR__;
$docsRoot = dirname($outDir);
$docsAppDir = dirname($outDir, 2) . DIRECTORY_SEPARATOR . 'my-app' . DIRECTORY_SEPARATOR . 'docs';
$erdDir = $docsRoot . DIRECTORY_SEPARATOR . 'erd';
$base = '46_Application_Architecture_Layered';

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
const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: 3200 } });
fs.writeFileSync(process.argv[3], resvg.render().asPng());
JS;
    $jsPath = $erdDir . DIRECTORY_SEPARATOR . '_resvg_layered.js';
    file_put_contents($jsPath, $js);
    shell_exec('cd /d ' . escapeshellarg($erdDir) . ' && node ' . escapeshellarg($jsPath) . ' ' . escapeshellarg($svgPath) . ' ' . escapeshellarg($pngPath) . ' 2>&1');
    @unlink($jsPath);
    return is_file($pngPath) && filesize($pngPath) > 500;
}

function layerSwimlane(string $id, string $title, int $x, int $y, int $w, int $h, string $fill, string $stroke): string
{
    return sprintf(
        '<mxCell id="%s" value="%s" style="swimlane;horizontal=0;whiteSpace=wrap;html=1;startSize=34;fillColor=%s;strokeColor=%s;fontStyle=1;fontSize=11;fontColor=#0f172a;collapsible=0;" vertex="1" parent="1"><mxGeometry x="%d" y="%d" width="%d" height="%d" as="geometry"/></mxCell>',
        esc($id), esc($title), esc($fill), esc($stroke), $x, $y, $w, $h
    );
}

function boxInLayer(string $id, string $label, int $x, int $y, int $w, int $h, string $fill, string $parent, int $fs = 8): string
{
    return sprintf(
        '<mxCell id="%s" value="%s" style="rounded=1;whiteSpace=wrap;html=1;fillColor=%s;strokeColor=#334155;fontSize=%d;align=center;verticalAlign=middle;" vertex="1" parent="%s"><mxGeometry x="%d" y="%d" width="%d" height="%d" as="geometry"/></mxCell>',
        esc($id), esc($label), esc($fill), $fs, esc($parent), $x, $y, $w, $h
    );
}

function hEdge(string $id, int $x1, int $y1, int $x2, int $y2): string
{
    return sprintf(
        '<mxCell id="%s" value="" style="endArrow=block;endFill=1;html=1;strokeWidth=2;strokeColor=#334155;" edge="1" parent="1"><mxGeometry relative="1" as="geometry"><mxPoint x="%d" y="%d" as="sourcePoint"/><mxPoint x="%d" y="%d" as="targetPoint"/></mxGeometry></mxCell>',
        esc($id), $x1, $y1, $x2, $y2
    );
}

function svgToDataUri(string $svg): string
{
    return 'data:image/svg+xml,' . rawurlencode($svg);
}

function iconSvgMini(string $type, string $letter = ''): string
{
    $svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">';
    switch ($type) {
        case 'monitor':
            $svg .= '<rect x="6" y="6" width="20" height="14" rx="2" fill="#fff" stroke="#334155" stroke-width="1.2"/><line x1="4" y1="22" x2="28" y2="22" stroke="#334155" stroke-width="1.2"/>';
            break;
        case 'users':
            $svg .= '<circle cx="11" cy="11" r="3.5" fill="none" stroke="#334155"/><circle cx="21" cy="11" r="3.5" fill="none" stroke="#334155"/><path d="M5 26 q6-7 12 0 M16 26 q6-7 12 0" fill="none" stroke="#334155"/>';
            break;
        case 'phone':
            $svg .= '<rect x="10" y="4" width="12" height="22" rx="2" fill="#fff" stroke="#334155"/><circle cx="16" cy="22" r="1.5" fill="#334155"/>';
            break;
        case 'tablet':
            $svg .= '<rect x="7" y="4" width="18" height="24" rx="2" fill="#fff" stroke="#334155"/>';
            break;
        case 'key':
            $svg .= '<circle cx="12" cy="16" r="6" fill="none" stroke="#334155" stroke-width="1.3"/><line x1="17" y1="16" x2="27" y2="16" stroke="#334155" stroke-width="1.3"/>';
            break;
        case 'book':
            $svg .= '<path d="M6 7 v18 q10-2 20 0 V7 q-10 2-20 0z" fill="#fff" stroke="#334155"/><line x1="16" y1="7" x2="16" y2="25" stroke="#334155"/>';
            break;
        case 'hub':
            $svg .= '<rect x="6" y="8" width="20" height="14" fill="#fff" stroke="#334155"/><rect x="9" y="11" width="6" height="6" fill="#16a34a"/><rect x="17" y="11" width="6" height="6" fill="#16a34a"/>';
            break;
        case 'brain':
            $svg .= '<ellipse cx="16" cy="16" rx="12" ry="9" fill="#fed7aa" stroke="#334155"/><path d="M8 16 q4-5 8 0 q4 5 8 0" fill="none" stroke="#7c3aed" stroke-width="1.2"/>';
            break;
        case 'bell':
            $svg .= '<path d="M16 6 l8 10 v5 H8 v-5z" fill="#fff" stroke="#334155"/><circle cx="16" cy="23" r="2" fill="#334155"/>';
            break;
        case 'chart':
            $svg .= '<rect x="7" y="18" width="4" height="8" fill="#3b82f6"/><rect x="14" y="14" width="4" height="12" fill="#22c55e"/><rect x="21" y="10" width="4" height="16" fill="#f59e0b"/>';
            break;
        case 'scroll':
            $svg .= '<rect x="9" y="6" width="14" height="20" fill="#fff" stroke="#334155"/><path d="M23 6 v20" fill="none" stroke="#334155"/>';
            break;
        case 'mail':
            $svg .= '<rect x="6" y="9" width="20" height="14" fill="#fff" stroke="#334155"/><path d="M6 9 L16 18 L26 9" fill="none" stroke="#334155"/>';
            break;
        case 'cloud':
            $svg .= '<ellipse cx="16" cy="18" rx="12" ry="8" fill="#fff" stroke="#9333ea" stroke-width="1.3"/>';
            break;
        case 'qr':
            $svg .= '<rect x="7" y="7" width="18" height="18" fill="#fff" stroke="#334155"/><rect x="10" y="10" width="4" height="4" fill="#334155"/><rect x="18" y="10" width="4" height="4" fill="#334155"/>';
            break;
        case 'db':
            $svg .= '<ellipse cx="16" cy="24" rx="10" ry="3.5" fill="#94a3b8"/><rect x="6" y="10" width="20" height="14" fill="#fff" stroke="#ea580c" stroke-width="1.2"/><ellipse cx="16" cy="10" rx="10" ry="3.5" fill="#fff" stroke="#ea580c" stroke-width="1.2"/>';
            if ($letter !== '') {
                $svg .= '<text x="16" y="22" text-anchor="middle" font-family="Arial" font-size="10" font-weight="700" fill="#ea580c">' . esc($letter) . '</text>';
            }
            break;
        default:
            $svg .= '<rect x="8" y="8" width="16" height="16" fill="#fff" stroke="#334155"/>';
    }
    $svg .= '</svg>';
    return $svg;
}

function drawioHtmlLabel(string $iconType, string $label, string $letter = ''): string
{
    $uri = svgToDataUri(iconSvgMini($iconType, $letter));
    $lines = explode("\n", wordwrap($label, 24, "\n", true));
    $text = implode('<br>', array_map(static fn ($ln) => esc($ln), $lines));
    $html = '<div style="text-align:center;font-family:Arial;font-size:8px;font-weight:700;line-height:1.15;color:#0f172a;">'
        . '<img src="' . $uri . '" width="30" height="30" style="display:block;margin:0 auto 3px auto;"/>'
        . $text
        . '</div>';
    return esc($html);
}

function moduleCard(string $id, string $iconType, string $label, int $x, int $y, int $w, int $h, string $fill, string $parent = '1', string $letter = ''): string
{
    return sprintf(
        '<mxCell id="%s" value="%s" style="rounded=1;whiteSpace=wrap;html=1;fillColor=%s;strokeColor=#334155;align=center;verticalAlign=middle;" vertex="1" parent="%s"><mxGeometry x="%d" y="%d" width="%d" height="%d" as="geometry"/></mxCell>',
        esc($id),
        drawioHtmlLabel($iconType, $label, $letter),
        esc($fill),
        esc($parent),
        $x,
        $y,
        $w,
        $h
    );
}

function buildDrawio(): string
{
    $b = '<mxCell id="title" value="APPLICATION ARCHITECTURE — Disaster Preparedness Training &amp; Simulation System" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#1e3a5f;fontColor=#ffffff;fontStyle=1;fontSize=13;strokeColor=#16324f;" vertex="1" parent="1"><mxGeometry x="40" y="16" width="1040" height="40" as="geometry"/></mxCell>';

    $b .= layerSwimlane('pres', 'Presentation Layer', 40, 70, 210, 500, '#dbeafe', '#2563eb');
    $b .= layerSwimlane('app', 'Application Layer', 270, 70, 300, 500, '#bbf7d0', '#16a34a');
    $b .= layerSwimlane('data', 'Data Layer', 590, 70, 230, 500, '#fed7aa', '#ea580c');
    $b .= layerSwimlane('int', 'Integration Layer', 840, 70, 240, 500, '#e9d5ff', '#9333ea');

    $b .= moduleCard('p1', 'monitor', 'Participant Web Portal', 70, 110, 150, 72, '#eff6ff');
    $b .= moduleCard('p2', 'users', 'Trainer / LGU Staff Dashboard', 70, 200, 150, 72, '#eff6ff');
    $b .= moduleCard('p3', 'phone', 'Admin Dashboard', 70, 290, 150, 72, '#eff6ff');
    $b .= moduleCard('p4', 'tablet', 'Mobile Responsive Interface', 70, 380, 150, 72, '#eff6ff');
    $b .= boxInLayer('p5', 'React + Vite SPA&#xa;Laravel Blade Views', 70, 470, 150, 36, '#eff6ff', '1', 8);

    $b .= moduleCard('a1', 'key', 'Authentication Service', 300, 110, 90, 72, '#ecfdf5');
    $b .= moduleCard('a2', 'users', 'User Management (RBAC)', 400, 110, 90, 72, '#ecfdf5');
    $b .= moduleCard('a3', 'book', 'Training Module Management', 500, 110, 90, 72, '#ecfdf5');
    $b .= moduleCard('aHub', 'hub', 'Simulation Event Management', 390, 210, 100, 80, '#dcfce7');
    $b .= moduleCard('a4', 'brain', 'AI Scenario Generation', 300, 320, 90, 72, '#ecfdf5');
    $b .= moduleCard('a5', 'bell', 'Notification Service', 400, 320, 90, 72, '#ecfdf5');
    $b .= moduleCard('a6', 'chart', 'Reporting & Analytics', 500, 320, 90, 72, '#ecfdf5');
    $b .= boxInLayer('a7', 'Laravel 12 Modular Monolith&#xa;8 Internal Modules', 330, 410, 220, 36, '#ecfdf5', '1', 8);

    $b .= moduleCard('d1', 'db', 'User Database', 610, 110, 90, 72, '#fff7ed', '1', 'U');
    $b .= moduleCard('d2', 'db', 'Training Database', 710, 110, 90, 72, '#fff7ed', '1', 'T');
    $b .= moduleCard('d3', 'db', 'Simulation Event DB', 660, 200, 90, 72, '#fff7ed', '1', 'S');
    $b .= moduleCard('d4', 'scroll', 'Audit Logs', 630, 300, 120, 72, '#fff7ed');
    $b .= moduleCard('d5', 'db', 'Certification & Reports DB', 660, 400, 90, 72, '#fff7ed', '1', 'R');
    $b .= boxInLayer('d6', 'MySQL 8.0 (InnoDB)&#xa;Hostinger VPS', 610, 490, 170, 36, '#fff7ed', '1', 8);

    $b .= moduleCard('i1', 'mail', 'SMTP Email Service', 870, 110, 130, 64, '#faf5ff');
    $b .= moduleCard('i2', 'phone', 'SMS Gateway', 870, 182, 130, 64, '#faf5ff');
    $b .= moduleCard('i3', 'brain', 'Google Gemini AI API', 870, 254, 130, 64, '#faf5ff');
    $b .= moduleCard('i4', 'hub', 'Group 6 Campaign API', 870, 326, 130, 64, '#faf5ff');
    $b .= moduleCard('i5', 'cloud', 'Cloudinary CDN', 870, 398, 130, 64, '#faf5ff');
    $b .= moduleCard('i6', 'hub', 'CPSQC Patrol API', 870, 470, 130, 64, '#faf5ff');
    $b .= moduleCard('i7', 'qr', 'Public Certificate Verifier (QR)', 870, 542, 130, 64, '#faf5ff');

    $b .= hEdge('e1', 250, 280, 270, 280);
    $b .= hEdge('e2', 570, 280, 590, 280);
    $b .= hEdge('e3', 820, 280, 840, 280);

    $b .= '<mxCell id="aiBox" value="" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#ecfdf5;strokeColor=#16a34a;strokeWidth=2;dashed=1;" vertex="1" parent="1"><mxGeometry x="290" y="600" width="520" height="52" as="geometry"/></mxCell>';
    $b .= '<mxCell id="aiLbl" value="AI Scenario Generation:  [Training Context + Hazard Data]  →  [AI Model (Gemini)]  →  [Scenario Draft for Review]" style="text;html=1;strokeColor=none;fillColor=none;align=center;fontSize=10;fontStyle=1;fontColor=#166534;" vertex="1" parent="1"><mxGeometry x="290" y="615" width="520" height="30" as="geometry"/></mxCell>';
    $b .= '<mxCell id="cap" value="Figure no. __ Application Architecture — AlertaraQC · Barangay San Agustin pilot" style="text;html=1;strokeColor=none;fillColor=none;align=center;fontSize=11;fontStyle=2;fontColor=#334155;" vertex="1" parent="1"><mxGeometry x="40" y="680" width="1040" height="24" as="geometry"/></mxCell>';

    return $b;
}

function svgLayerPanel(int $x, int $y, int $w, int $h, string $fill, string $stroke, string $title): string
{
    $svg = '<rect x="' . $x . '" y="' . $y . '" width="' . $w . '" height="' . $h . '" rx="10" fill="' . $fill . '" stroke="' . $stroke . '" stroke-width="2"/>';
    $svg .= '<text transform="translate(' . ($x + 18) . ',' . ($y + $h / 2 + 40) . ') rotate(-90)" text-anchor="middle" font-family="Arial,sans-serif" font-size="11" font-weight="700" fill="#0f172a">' . esc($title) . '</text>';
    return $svg;
}

function svgDbIcon(int $cx, int $cy, string $letter = ''): string
{
    $svg = '<ellipse cx="' . $cx . '" cy="' . ($cy + 16) . '" rx="20" ry="7" fill="#94a3b8"/>';
    $svg .= '<rect x="' . ($cx - 20) . '" y="' . ($cy - 12) . '" width="40" height="28" fill="#ffffff" stroke="#ea580c" stroke-width="1.5"/>';
    $svg .= '<ellipse cx="' . $cx . '" cy="' . ($cy - 12) . '" rx="20" ry="7" fill="#ffffff" stroke="#ea580c" stroke-width="1.5"/>';
    if ($letter !== '') {
        $svg .= '<text x="' . $cx . '" y="' . ($cy + 4) . '" text-anchor="middle" font-family="Arial" font-size="14" font-weight="700" fill="#ea580c">' . esc($letter) . '</text>';
    }
    return $svg;
}

function svgModuleBox(int $x, int $y, int $w, int $h, string $fill, string $icon, string $label): string
{
    $cx = $x + $w / 2;
    $svg = '<rect x="' . $x . '" y="' . $y . '" width="' . $w . '" height="' . $h . '" rx="8" fill="' . $fill . '" stroke="#334155" stroke-width="1.2"/>';
    $iy = $y + 14;
    switch ($icon) {
        case 'monitor':
            $svg .= '<rect x="' . ($cx - 16) . '" y="' . $iy . '" width="32" height="22" rx="2" fill="#fff" stroke="#334155"/><line x1="' . ($cx - 20) . '" y1="' . ($iy + 22) . '" x2="' . ($cx + 20) . '" y2="' . ($iy + 22) . '" stroke="#334155"/>';
            break;
        case 'users':
            $svg .= '<circle cx="' . ($cx - 6) . '" cy="' . ($iy + 6) . '" r="4" fill="none" stroke="#334155"/><circle cx="' . ($cx + 6) . '" cy="' . ($iy + 6) . '" r="4" fill="none" stroke="#334155"/><path d="M' . ($cx - 12) . ' ' . ($iy + 20) . ' q6-8 12 0 M' . $cx . ' ' . ($iy + 20) . ' q6-8 12 0" fill="none" stroke="#334155"/>';
            break;
        case 'phone':
            $svg .= '<rect x="' . ($cx - 10) . '" y="' . $iy . '" width="20" height="32" rx="3" fill="#fff" stroke="#334155"/><circle cx="' . $cx . '" cy="' . ($iy + 26) . '" r="2" fill="#334155"/>';
            break;
        case 'tablet':
            $svg .= '<rect x="' . ($cx - 14) . '" y="' . $iy . '" width="28" height="34" rx="3" fill="#fff" stroke="#334155"/>';
            break;
        case 'key':
            $svg .= '<circle cx="' . ($cx - 4) . '" cy="' . ($iy + 10) . '" r="7" fill="none" stroke="#334155" stroke-width="1.5"/><line x1="' . ($cx + 2) . '" y1="' . ($iy + 10) . '" x2="' . ($cx + 16) . '" y2="' . ($iy + 10) . '" stroke="#334155" stroke-width="1.5"/>';
            break;
        case 'book':
            $svg .= '<path d="M' . ($cx - 12) . ' ' . $iy . ' v24 q12-3 24 0 v-24 q-12 3-24 0 z" fill="#fff" stroke="#334155"/>';
            break;
        case 'hub':
            $svg .= '<rect x="' . ($cx - 14) . '" y="' . $iy . '" width="28" height="22" fill="#fff" stroke="#334155"/><rect x="' . ($cx - 10) . '" y="' . ($iy + 4) . '" width="8" height="8" fill="#16a34a"/><rect x="' . ($cx + 2) . '" y="' . ($iy + 4) . '" width="8" height="8" fill="#16a34a"/>';
            break;
        case 'brain':
            $svg .= '<ellipse cx="' . $cx . '" cy="' . ($iy + 12) . '" rx="14" ry="10" fill="#fed7aa" stroke="#334155"/><path d="M' . ($cx - 8) . ' ' . ($iy + 12) . ' q4-5 8 0 q4 5 8 0" fill="none" stroke="#7c3aed"/>';
            break;
        case 'bell':
            $svg .= '<path d="M' . $cx . ' ' . $iy . ' l10 12 v6 h-20 v-6 z" fill="#fff" stroke="#334155"/><circle cx="' . $cx . '" cy="' . ($iy + 22) . '" r="3" fill="#334155"/>';
            break;
        case 'chart':
            $svg .= '<rect x="' . ($cx - 10) . '" y="' . ($iy + 10) . '" width="5" height="12" fill="#3b82f6"/><rect x="' . ($cx - 2) . '" y="' . ($iy + 6) . '" width="5" height="16" fill="#22c55e"/><rect x="' . ($cx + 6) . '" y="' . ($iy + 2) . '" width="5" height="20" fill="#f59e0b"/>';
            break;
        case 'scroll':
            $svg .= '<rect x="' . ($cx - 10) . '" y="' . $iy . '" width="20" height="26" fill="#fff" stroke="#334155"/><path d="M' . ($cx + 10) . ' ' . $iy . ' v26" fill="none" stroke="#334155"/>';
            break;
        case 'mail':
            $svg .= '<rect x="' . ($cx - 12) . '" y="' . $iy . '" width="24" height="16" fill="#fff" stroke="#334155"/><path d="M' . ($cx - 12) . ' ' . $iy . ' L' . $cx . ' ' . ($iy + 10) . ' L' . ($cx + 12) . ' ' . $iy . '" fill="none" stroke="#334155"/>';
            break;
        case 'cloud':
            $svg .= '<ellipse cx="' . $cx . '" cy="' . ($iy + 12) . '" rx="14" ry="10" fill="#fff" stroke="#9333ea"/>';
            break;
        case 'qr':
            $svg .= '<rect x="' . ($cx - 10) . '" y="' . $iy . '" width="20" height="20" fill="#fff" stroke="#334155"/><rect x="' . ($cx - 6) . '" y="' . ($iy + 4) . '" width="4" height="4" fill="#334155"/><rect x="' . ($cx + 2) . '" y="' . ($iy + 4) . '" width="4" height="4" fill="#334155"/>';
            break;
        default:
            $svg .= '<rect x="' . ($cx - 12) . '" y="' . $iy . '" width="24" height="24" fill="#fff" stroke="#334155"/>';
    }
    $lines = explode("\n", wordwrap($label, 22, "\n", true));
    $ly = $y + $h - 10 - (count($lines) - 1) * 10;
    foreach ($lines as $ln) {
        $svg .= '<text x="' . $cx . '" y="' . $ly . '" text-anchor="middle" font-family="Arial,sans-serif" font-size="7.5" font-weight="700" fill="#0f172a">' . esc($ln) . '</text>';
        $ly += 10;
    }
    return $svg;
}

function buildSvg(): string
{
    $w = 1120; $h = 720;
    $svg = '<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" width="' . $w . '" height="' . $h . '" viewBox="0 0 ' . $w . ' ' . $h . '">';
    $svg .= '<defs><marker id="arr" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto"><polygon points="0 0,10 3.5,0 7" fill="#334155"/></marker></defs>';
    $svg .= '<rect width="100%" height="100%" fill="#fff"/>';
    $svg .= '<rect x="40" y="16" width="1040" height="40" rx="12" fill="#1e3a5f"/><text x="560" y="42" text-anchor="middle" fill="#fff" font-family="Arial,sans-serif" font-size="13" font-weight="700">APPLICATION ARCHITECTURE — Disaster Preparedness Training &amp; Simulation System</text>';

    $svg .= svgLayerPanel(40, 70, 210, 500, '#dbeafe', '#2563eb', 'Presentation Layer');
    $svg .= svgLayerPanel(270, 70, 300, 500, '#bbf7d0', '#16a34a', 'Application Layer');
    $svg .= svgLayerPanel(590, 70, 230, 500, '#fed7aa', '#ea580c', 'Data Layer');
    $svg .= svgLayerPanel(840, 70, 240, 500, '#e9d5ff', '#9333ea', 'Integration Layer');

    $svg .= svgModuleBox(70, 110, 150, 72, '#eff6ff', 'monitor', "Participant Web Portal");
    $svg .= svgModuleBox(70, 200, 150, 72, '#eff6ff', 'users', "Trainer / LGU Staff Dashboard");
    $svg .= svgModuleBox(70, 290, 150, 72, '#eff6ff', 'phone', "Admin Dashboard");
    $svg .= svgModuleBox(70, 380, 150, 72, '#eff6ff', 'tablet', "Mobile Responsive Interface");

    $svg .= svgModuleBox(300, 110, 90, 72, '#ecfdf5', 'key', "Authentication Service");
    $svg .= svgModuleBox(400, 110, 90, 72, '#ecfdf5', 'users', "User Management (RBAC)");
    $svg .= svgModuleBox(500, 110, 90, 72, '#ecfdf5', 'book', "Training Module Management");
    $svg .= svgModuleBox(390, 210, 100, 80, '#dcfce7', 'hub', "Simulation Event Management");
    $svg .= svgModuleBox(300, 320, 90, 72, '#ecfdf5', 'brain', "AI Scenario Generation");
    $svg .= svgModuleBox(400, 320, 90, 72, '#ecfdf5', 'bell', "Notification Service");
    $svg .= svgModuleBox(500, 320, 90, 72, '#ecfdf5', 'chart', "Reporting & Analytics");

    $svg .= '<text x="420" y="430" text-anchor="middle" font-family="Arial" font-size="8" font-weight="700" fill="#166534">Laravel 12 Modular Monolith · 8 Internal Modules</text>';

    $svg .= svgDbIcon(650, 130, 'U');
    $svg .= '<text x="650" y="175" text-anchor="middle" font-family="Arial" font-size="7.5" font-weight="700">User Database</text>';
    $svg .= svgDbIcon(730, 130, 'T');
    $svg .= '<text x="730" y="175" text-anchor="middle" font-family="Arial" font-size="7.5" font-weight="700">Training Database</text>';
    $svg .= svgDbIcon(690, 220, 'S');
    $svg .= '<text x="690" y="265" text-anchor="middle" font-family="Arial" font-size="7.5" font-weight="700">Simulation Event DB</text>';
    $svg .= svgModuleBox(630, 300, 120, 72, '#fff7ed', 'scroll', "Audit Logs");
    $svg .= svgDbIcon(690, 400, 'R');
    $svg .= '<text x="690" y="445" text-anchor="middle" font-family="Arial" font-size="7.5" font-weight="700">' . esc('Certification & Reports DB') . '</text>';
    $svg .= '<text x="690" y="480" text-anchor="middle" font-family="Arial" font-size="8" font-weight="700" fill="#9a3412">MySQL 8.0 (InnoDB) · Hostinger VPS</text>';

    $svg .= svgModuleBox(870, 110, 130, 64, '#faf5ff', 'mail', "SMTP Email Service");
    $svg .= svgModuleBox(870, 182, 130, 64, '#faf5ff', 'phone', "SMS Gateway");
    $svg .= svgModuleBox(870, 254, 130, 64, '#faf5ff', 'brain', "Google Gemini AI API");
    $svg .= svgModuleBox(870, 326, 130, 64, '#faf5ff', 'hub', "Group 6 Campaign API");
    $svg .= svgModuleBox(870, 398, 130, 64, '#faf5ff', 'cloud', "Cloudinary CDN");
    $svg .= svgModuleBox(870, 470, 130, 64, '#faf5ff', 'hub', "CPSQC Patrol API");
    $svg .= svgModuleBox(870, 542, 130, 64, '#faf5ff', 'qr', "Public Certificate Verifier (QR)");

    foreach ([250, 570, 820] as $x) {
        $svg .= '<line x1="' . $x . '" y1="280" x2="' . ($x + 20) . '" y2="280" stroke="#334155" stroke-width="2" marker-end="url(#arr)"/>';
    }

    $svg .= '<rect x="290" y="600" width="520" height="52" rx="8" fill="#ecfdf5" stroke="#16a34a" stroke-width="2" stroke-dasharray="6 4"/>';
    $svg .= '<text x="550" y="622" text-anchor="middle" font-family="Arial,sans-serif" font-size="9.5" font-weight="700" fill="#166534">AI Scenario Generation:</text>';
    $svg .= '<text x="550" y="638" text-anchor="middle" font-family="Arial,sans-serif" font-size="9" fill="#166534">[Training Context + Hazard Data]  →  [AI Model (Gemini)]  →  [Scenario Draft for Review]</text>';

    $svg .= '<text x="560" y="690" text-anchor="middle" font-family="Arial,sans-serif" font-size="11" font-style="italic" fill="#334155">Figure no. __ Application Architecture — AlertaraQC · Barangay San Agustin pilot</text>';
    $svg .= '</svg>';
    return $svg;
}

$drawio = '<?xml version="1.0" encoding="UTF-8"?>'
    . '<mxfile host="app.diagrams.net" agent="generate_layered_architecture.php" version="22.1.0" type="device">'
    . '<diagram id="layered_arch" name="46 — Application Architecture">'
    . '<mxGraphModel dx="1120" dy="720" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="1120" pageHeight="720" math="0" shadow="0">'
    . '<root><mxCell id="0"/><mxCell id="1" parent="0"/>'
    . buildDrawio()
    . '</root></mxGraphModel></diagram></mxfile>';

$drawioPath = $outDir . DIRECTORY_SEPARATOR . $base . '.drawio';
$svgPath = $outDir . DIRECTORY_SEPARATOR . $base . '.svg';
$pngPath = $outDir . DIRECTORY_SEPARATOR . $base . '.png';

file_put_contents($drawioPath, $drawio);
file_put_contents($svgPath, buildSvg());
$pngOk = exportPng($svgPath, $pngPath, $erdDir);

if ($pngOk) {
    copy($pngPath, $docsRoot . DIRECTORY_SEPARATOR . $base . '.png');
    if (is_dir($docsAppDir)) {
        copy($pngPath, $docsAppDir . DIRECTORY_SEPARATOR . 'Application_Architecture_Layered.png');
    }
}

echo 'DRAWIO_OK=' . $drawioPath . PHP_EOL;
echo 'SVG_OK=' . $svgPath . PHP_EOL;
echo 'PNG_OK=' . ($pngOk ? $pngPath : 'failed') . PHP_EOL;
