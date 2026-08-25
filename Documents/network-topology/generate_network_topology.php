<?php

/**
 * Network Topology — Star-Tree Hybrid (thesis format, AlertaraQC).
 * Run: php Documents/network-topology/generate_network_topology.php
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
const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: 2400 } });
fs.writeFileSync(process.argv[3], resvg.render().asPng());
JS;
    $jsPath = $erdDir . DIRECTORY_SEPARATOR . '_resvg_topo.js';
    file_put_contents($jsPath, $js);
    shell_exec('cd /d ' . escapeshellarg($erdDir) . ' && node ' . escapeshellarg($jsPath) . ' ' . escapeshellarg($svgPath) . ' ' . escapeshellarg($pngPath) . ' 2>&1');
    @unlink($jsPath);

    return is_file($pngPath) && filesize($pngPath) > 500;
}

/** @return list<array{label:string,leaves:list<string>,external:bool}> */
function branchDefinitions(): array
{
    return [
        ['label' => 'LGU Admin', 'leaves' => ['Admin PC', 'Admin Laptop', 'Super Admin'], 'external' => false],
        ['label' => 'Trainers', 'leaves' => ['Lead Trainer PC', 'Assistant Trainer', 'Staff Terminal'], 'external' => false],
        ['label' => 'Participants', 'leaves' => ['Mobile Phone', 'Home Desktop', 'Public Register'], 'external' => false],
        ['label' => 'Evaluators', 'leaves' => ['Evaluator PC', 'Attendance Tablet', 'Scoring Laptop'], 'external' => false],
        ['label' => 'Data Store', 'leaves' => ['MySQL 8.0', 'Session Store', 'File Storage'], 'external' => false],
        ['label' => 'Email (SMTP)', 'leaves' => ['OTP Mail', 'Verify Email', 'Notifications'], 'external' => true],
        ['label' => 'AI & Media', 'leaves' => ['Gemini API', 'Cloudinary CDN', 'PDF Assets'], 'external' => true],
        ['label' => 'Partner APIs', 'leaves' => ['Group 6 Campaign', 'CPSQC Patrol', 'Public QR Verify'], 'external' => true],
    ];
}

function computeLayout(int $cx, int $cy, float $hubR, float $leafR): array
{
    $branches = branchDefinitions();
    $n = count($branches);
    $layout = [];

    for ($i = 0; $i < $n; $i++) {
        $angle = -M_PI / 2 + (2 * M_PI / $n) * $i;
        $hubX = (int) round($cx + cos($angle) * $hubR);
        $hubY = (int) round($cy + sin($angle) * $hubR);
        $leaves = [];
        $leafCount = count($branches[$i]['leaves']);
        $spread = 0.45;
        for ($j = 0; $j < $leafCount; $j++) {
            $offset = ($leafCount === 1) ? 0 : ($j - ($leafCount - 1) / 2) * $spread;
            $leafAngle = $angle + $offset;
            $leaves[] = [
                'label' => $branches[$i]['leaves'][$j],
                'x' => (int) round($hubX + cos($leafAngle) * $leafR),
                'y' => (int) round($hubY + sin($leafAngle) * $leafR),
            ];
        }
        $layout[] = [
            'branch' => $branches[$i],
            'hubX' => $hubX,
            'hubY' => $hubY,
            'angle' => $angle,
            'leaves' => $leaves,
        ];
    }

    return $layout;
}

function serverNodeDrawio(string $id, string $label, int $x, int $y, int $w, int $h): string
{
    return sprintf(
        '<mxCell id="%s" value="%s" style="shape=cylinder3;whiteSpace=wrap;html=1;boundedLbl=1;backgroundOutline=1;size=12;fillColor=#1e293b;fontColor=#ffffff;strokeColor=#0f172a;fontStyle=1;fontSize=11;" vertex="1" parent="1"><mxGeometry x="%d" y="%d" width="%d" height="%d" as="geometry"/></mxCell>',
        esc($id),
        esc($label),
        $x,
        $y,
        $w,
        $h
    );
}

function pcNodeDrawio(string $id, string $label, int $x, int $y, bool $external): string
{
    $fill = $external ? '#faf5ff' : '#ffffff';
    $stroke = $external ? '#7c3aed' : '#334155';

    return sprintf(
        '<mxCell id="%s" value="%s" style="shape=mxgraph.networks.pc;whiteSpace=wrap;html=1;fillColor=%s;strokeColor=%s;fontSize=9;fontStyle=0;verticalLabelPosition=bottom;verticalAlign=top;" vertex="1" parent="1"><mxGeometry x="%d" y="%d" width="52" height="42" as="geometry"/></mxCell>',
        esc($id),
        esc($label),
        esc($fill),
        esc($stroke),
        $x - 26,
        $y - 21
    );
}

function hubNodeDrawio(string $id, string $label, int $x, int $y): string
{
    return sprintf(
        '<mxCell id="%s" value="%s" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#dbeafe;strokeColor=#1e40af;fontStyle=1;fontSize=9;" vertex="1" parent="1"><mxGeometry x="%d" y="%d" width="88" height="32" as="geometry"/></mxCell>',
        esc($id),
        esc($label),
        $x - 44,
        $y - 16
    );
}

function lineDrawio(string $id, int $x1, int $y1, int $x2, int $y2, bool $dashed = false): string
{
    $dash = $dashed ? 'dashed=1;' : '';

    return sprintf(
        '<mxCell id="%s" value="" style="endArrow=none;html=1;strokeWidth=1.5;strokeColor=#334155;%s" edge="1" parent="1"><mxGeometry relative="1" as="geometry"><mxPoint x="%d" y="%d" as="sourcePoint"/><mxPoint x="%d" y="%d" as="targetPoint"/></mxGeometry></mxCell>',
        esc($id),
        $dash,
        $x1,
        $y1,
        $x2,
        $y2
    );
}

function buildDrawio(): string
{
    $w = 920;
    $h = 720;
    $cx = 460;
    $cy = 310;
    $layout = computeLayout($cx, $cy, 155, 95);

    $body = sprintf(
        '<mxCell id="sec" value="3.6.1 Network Topology" style="text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;fontSize=14;fontStyle=1;fontColor=#0f172a;" vertex="1" parent="1"><mxGeometry x="40" y="20" width="400" height="30" as="geometry"/></mxCell>'
    );
    $body .= serverNodeDrawio('core', "Hostinger VPS\nApache · PHP 8.2 · Laravel 12", $cx - 70, $cy - 55, 140, 90);

    $ei = 0;
    foreach ($layout as $bi => $b) {
        $body .= lineDrawio('e_c_h_' . $bi, $cx, $cy, $b['hubX'], $b['hubY']);
        $body .= hubNodeDrawio('hub_' . $bi, $b['branch']['label'], $b['hubX'], $b['hubY']);
        foreach ($b['leaves'] as $li => $leaf) {
            $body .= lineDrawio('e_h_l_' . $bi . '_' . $li, $b['hubX'], $b['hubY'], $leaf['x'], $leaf['y'], $b['branch']['external']);
            $body .= pcNodeDrawio('pc_' . $bi . '_' . $li, $leaf['label'], $leaf['x'], $leaf['y'], $b['branch']['external']);
        }
        $ei++;
    }

    $body .= sprintf(
        '<mxCell id="legend" value="STAR-TREE HYBRID TOPOLOGY&#xa;Disaster Preparedness Training &amp; Simulation System (AlertaraQC)&#xa;Barangay San Agustin Pilot · HTTPS to VPS · Outbound HTTPS to partners" style="rounded=0;whiteSpace=wrap;html=1;fillColor=#f8fafc;strokeColor=#64748b;fontSize=10;align=center;fontStyle=0;" vertex="1" parent="1"><mxGeometry x="280" y="620" width="360" height="58" as="geometry"/></mxCell>'
    );
    $body .= sprintf(
        '<mxCell id="fig" value="Figure no. __ Network Topology" style="text;html=1;strokeColor=none;fillColor=none;align=center;fontSize=11;fontStyle=2;fontColor=#334155;" vertex="1" parent="1"><mxGeometry x="280" y="688" width="360" height="24" as="geometry"/></mxCell>'
    );

    return '<?xml version="1.0" encoding="UTF-8"?>'
        . '<mxfile host="app.diagrams.net" modified="' . date('c') . '" agent="generate_network_topology.php" version="22.1.0" type="device">'
        . '<diagram id="net_topo" name="Network Topology"><mxGraphModel dx="920" dy="720" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="920" pageHeight="720" math="0" shadow="0"><root><mxCell id="0"/><mxCell id="1" parent="0"/>'
        . $body
        . '</root></mxGraphModel></diagram></mxfile>';
}

function buildSvg(): string
{
    $w = 920;
    $h = 720;
    $cx = 460;
    $cy = 310;
    $layout = computeLayout($cx, $cy, 155, 95);

    $svg = '<?xml version="1.0" encoding="UTF-8"?>';
    $svg .= '<svg xmlns="http://www.w3.org/2000/svg" width="' . $w . '" height="' . $h . '" viewBox="0 0 ' . $w . ' ' . $h . '">';
    $svg .= '<rect width="100%" height="100%" fill="#ffffff"/>';
    $svg .= '<text x="40" y="38" font-family="Arial,sans-serif" font-size="14" font-weight="700" fill="#0f172a">3.6.1 Network Topology</text>';

    // central server
    $svg .= '<ellipse cx="' . $cx . '" cy="' . ($cy + 20) . '" rx="58" ry="14" fill="#0f172a" opacity="0.25"/>';
    $svg .= '<rect x="' . ($cx - 70) . '" y="' . ($cy - 55) . '" width="140" height="72" rx="6" fill="#1e293b" stroke="#0f172a"/>';
    $svg .= '<text x="' . $cx . '" y="' . ($cy - 18) . '" text-anchor="middle" font-family="Arial,sans-serif" font-size="10" font-weight="700" fill="#ffffff">Hostinger VPS</text>';
    $svg .= '<text x="' . $cx . '" y="' . ($cy + 2) . '" text-anchor="middle" font-family="Arial,sans-serif" font-size="9" fill="#e2e8f0">Apache · PHP · Laravel 12</text>';

    foreach ($layout as $bi => $b) {
        $dash = $b['branch']['external'] ? ' stroke-dasharray="5 4"' : '';
        $svg .= '<line x1="' . $cx . '" y1="' . $cy . '" x2="' . $b['hubX'] . '" y2="' . $b['hubY'] . '" stroke="#334155" stroke-width="1.5"/>';
        $svg .= '<rect x="' . ($b['hubX'] - 44) . '" y="' . ($b['hubY'] - 16) . '" width="88" height="32" rx="6" fill="#dbeafe" stroke="#1e40af"/>';
        $svg .= '<text x="' . $b['hubX'] . '" y="' . ($b['hubY'] + 4) . '" text-anchor="middle" font-family="Arial,sans-serif" font-size="8" font-weight="700" fill="#1e3a8a">' . esc($b['branch']['label']) . '</text>';
        foreach ($b['leaves'] as $li => $leaf) {
            $svg .= '<line x1="' . $b['hubX'] . '" y1="' . $b['hubY'] . '" x2="' . $leaf['x'] . '" y2="' . $leaf['y'] . '" stroke="#64748b" stroke-width="1"' . $dash . '/>';
            $fill = $b['branch']['external'] ? '#faf5ff' : '#ffffff';
            $stroke = $b['branch']['external'] ? '#7c3aed' : '#334155';
            $svg .= '<rect x="' . ($leaf['x'] - 18) . '" y="' . ($leaf['y'] - 14) . '" width="36" height="24" rx="2" fill="' . $fill . '" stroke="' . $stroke . '"/>';
            $svg .= '<rect x="' . ($leaf['x'] - 12) . '" y="' . ($leaf['y'] - 10) . '" width="24" height="14" fill="#e2e8f0" stroke="' . $stroke . '"/>';
            $svg .= '<text x="' . $leaf['x'] . '" y="' . ($leaf['y'] + 22) . '" text-anchor="middle" font-family="Arial,sans-serif" font-size="7" fill="#334155">' . esc($leaf['label']) . '</text>';
        }
    }

    $svg .= '<rect x="280" y="620" width="360" height="58" fill="#f8fafc" stroke="#64748b"/>';
    $svg .= '<text x="460" y="642" text-anchor="middle" font-family="Arial,sans-serif" font-size="10" font-weight="700" fill="#0f172a">STAR-TREE HYBRID TOPOLOGY</text>';
    $svg .= '<text x="460" y="658" text-anchor="middle" font-family="Arial,sans-serif" font-size="9" fill="#475569">Disaster Preparedness Training &amp; Simulation System (AlertaraQC)</text>';
    $svg .= '<text x="460" y="672" text-anchor="middle" font-family="Arial,sans-serif" font-size="8" fill="#64748b">Barangay San Agustin Pilot · HTTPS inbound · Outbound HTTPS to partners</text>';
    $svg .= '<text x="460" y="700" text-anchor="middle" font-family="Arial,sans-serif" font-size="10" font-style="italic" fill="#334155">Figure no. __ Network Topology</text>';
    $svg .= '</svg>';

    return $svg;
}

$drawioPath = $outDir . DIRECTORY_SEPARATOR . '42_Network_Topology.drawio';
$svgPath = $outDir . DIRECTORY_SEPARATOR . '42_Network_Topology.svg';
$pngPath = $outDir . DIRECTORY_SEPARATOR . '42_Network_Topology.png';

file_put_contents($drawioPath, buildDrawio());
file_put_contents($svgPath, buildSvg());
$pngOk = exportPng($svgPath, $pngPath, $erdDir);

if (is_dir($docsAppDir)) {
    $dest = $pngOk ? $docsAppDir . DIRECTORY_SEPARATOR . 'Network_Topology.png' : $docsAppDir . DIRECTORY_SEPARATOR . 'Network_Topology.svg';
    copy($pngOk ? $pngPath : $svgPath, $dest);
}
if ($pngOk) {
    copy($pngPath, $docsRoot . DIRECTORY_SEPARATOR . '42_Network_Topology.png');
}

echo 'DRAWIO_OK=' . $drawioPath . PHP_EOL;
echo 'SVG_OK=' . $svgPath . PHP_EOL;
echo 'PNG_OK=' . ($pngOk ? $pngPath : 'failed') . PHP_EOL;
