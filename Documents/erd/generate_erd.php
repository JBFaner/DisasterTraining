<?php

/**
 * Thesis-style ERD (Crow's Foot) — matches capstone ERD format.
 * Run: php Documents/erd/generate_erd.php
 */

$outDir = __DIR__;
$docsAppDir = dirname($outDir, 2) . DIRECTORY_SEPARATOR . 'my-app' . DIRECTORY_SEPARATOR . 'docs';

function esc(string $s): string
{
    return htmlspecialchars($s, ENT_QUOTES | ENT_XML1, 'UTF-8');
}

/** Entity box using draw.io shape=table (thesis ERD format — full header text, PK/FK columns) */
function erdEntityDrawio(string $id, string $name, array $attrs, int $x, int $y, int $colW = 56, int $attrW = 224): string
{
    $totalW = $colW + $attrW;
    $headerH = 30;
    $rowH = 26;
    $totalH = $headerH + count($attrs) * $rowH;

    $tableStyle = 'shape=table;startSize=' . $headerH
        . ';container=1;collapsible=0;childLayout=tableLayout;fixedRows=1;rowLines=0;columnLines=0;'
        . 'fontStyle=1;align=center;resizeLast=1;html=1;strokeColor=#111827;fillColor=#4b5563;fontColor=#ffffff;fontSize=11;';

    $xml = sprintf(
        '<mxCell id="%s" value="%s" style="%s" vertex="1" parent="1"><mxGeometry x="%d" y="%d" width="%d" height="%d" as="geometry"/></mxCell>',
        esc($id),
        esc(strtoupper($name)),
        esc($tableStyle),
        $x,
        $y,
        $totalW,
        $totalH
    );

    $rowStyle = 'shape=tableRow;horizontal=0;startSize=0;swimlaneFillColor=none;fillColor=none;strokeColor=inherit;'
        . 'collapsible=0;dropTarget=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;';

    $keyStyle = 'shape=partialRectangle;connectable=0;fillColor=none;top=0;left=0;bottom=0;right=0;'
        . 'editable=1;overflow=hidden;whiteSpace=wrap;html=1;align=center;fontSize=9;fontStyle=1;strokeColor=#d1d5db;';

    $attrBase = 'shape=partialRectangle;connectable=0;fillColor=none;top=0;left=0;bottom=0;right=0;'
        . 'editable=1;overflow=hidden;whiteSpace=wrap;html=1;align=left;spacingLeft=6;fontSize=10;strokeColor=#d1d5db;';

    foreach ($attrs as $i => $attr) {
        [$keyLabel, $attrName, $isPk] = $attr;
        $rowId = $id . '_row' . $i;
        $yPos = $headerH + $i * $rowH;

        $xml .= sprintf(
            '<mxCell id="%s" value="" style="%s" vertex="1" parent="%s"><mxGeometry y="%d" width="%d" height="%d" as="geometry"/></mxCell>',
            esc($rowId),
            esc($rowStyle),
            esc($id),
            $yPos,
            $totalW,
            $rowH
        );
        $xml .= sprintf(
            '<mxCell id="%s_k" value="%s" style="%s" vertex="1" parent="%s"><mxGeometry width="%d" height="%d" as="geometry"/></mxCell>',
            esc($rowId),
            esc($keyLabel),
            esc($keyStyle),
            esc($rowId),
            $colW,
            $rowH
        );
        $xml .= sprintf(
            '<mxCell id="%s_a" value="%s" style="%s%s" vertex="1" parent="%s"><mxGeometry x="%d" width="%d" height="%d" as="geometry"/></mxCell>',
            esc($rowId),
            esc($attrName),
            esc($attrBase),
            $isPk ? 'fontStyle=4;' : '',
            esc($rowId),
            $colW,
            $attrW,
            $rowH
        );
    }

    return $xml;
}

function erdRelDrawio(string $id, string $from, string $to, bool $dashed = true): string
{
    $dash = $dashed ? 'dashed=1;dashPattern=8 4;' : '';

    return sprintf(
        '<mxCell id="%s" value="" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeWidth=1.5;strokeColor=#111827;%sendArrow=ERmany;endFill=0;startArrow=ERone;startFill=0;" edge="1" parent="1" source="%s" target="%s"><mxGeometry relative="1" as="geometry"/></mxCell>',
        esc($id),
        $dash,
        esc($from),
        esc($to)
    );
}

function wrapDiagram(string $body, int $pageW = 1400, int $pageH = 1000): string
{
    return sprintf(
        '<diagram id="erd_thesis" name="Overall ERD"><mxGraphModel dx="1200" dy="900" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="%d" pageHeight="%d" math="0" shadow="0"><root><mxCell id="0"/><mxCell id="1" parent="0"/>%s</root></mxGraphModel></diagram>',
        $pageW,
        $pageH,
        $body
    );
}

function buildThesisSvg(array $entities, array $links): string
{
    $w = 1400;
    $h = 1000;

    $svg = '<?xml version="1.0" encoding="UTF-8"?>';
    $svg .= '<svg xmlns="http://www.w3.org/2000/svg" width="' . $w . '" height="' . $h . '" viewBox="0 0 ' . $w . ' ' . $h . '">';
    $svg .= '<rect width="100%" height="100%" fill="#ffffff"/>';
    $svg .= '<text x="700" y="36" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="16" font-weight="700" fill="#111827">Entity-Relationship Diagram — Disaster Preparedness Training &amp; Simulation System</text>';

    foreach ($links as $link) {
        [$x1, $y1, $x2, $y2] = $link;
        $svg .= sprintf(
            '<line x1="%d" y1="%d" x2="%d" y2="%d" stroke="#111827" stroke-width="1.5" stroke-dasharray="8,4"/>',
            $x1,
            $y1,
            $x2,
            $y2
        );
    }

    foreach ($entities as $e) {
        [$id, $name, $attrs, $x, $y] = $e;
        $colW = 56;
        $attrW = 224;
        $totalW = $colW + $attrW;
        $headerH = 30;
        $rowH = 26;
        $bodyH = count($attrs) * $rowH;
        $totalH = $headerH + $bodyH;

        $svg .= sprintf('<rect x="%d" y="%d" width="%d" height="%d" fill="#ffffff" stroke="#111827" stroke-width="1.2"/>', $x, $y, $totalW, $totalH);
        $svg .= sprintf('<rect x="%d" y="%d" width="%d" height="%d" fill="#4b5563" stroke="#111827" stroke-width="1.2"/>', $x, $y, $totalW, $headerH);
        $svg .= sprintf(
            '<text x="%d" y="%d" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="11" font-weight="700" fill="#ffffff">%s</text>',
            $x + $totalW / 2,
            $y + 20,
            htmlspecialchars(strtoupper($name))
        );

        $rowY = $y + $headerH;
        foreach ($attrs as $attr) {
            [$keyLabel, $attrName, $isPk] = $attr;
            $svg .= sprintf('<line x1="%d" y1="%d" x2="%d" y2="%d" stroke="#d1d5db" stroke-width="1"/>', $x, $rowY + $rowH, $x + $totalW, $rowY + $rowH);
            $svg .= sprintf('<line x1="%d" y1="%d" x2="%d" y2="%d" stroke="#d1d5db" stroke-width="1"/>', $x + $colW, $rowY, $x + $colW, $rowY + $rowH);
            $svg .= sprintf(
                '<text x="%d" y="%d" text-anchor="middle" font-family="Arial, sans-serif" font-size="9" font-weight="700" fill="#111827">%s</text>',
                $x + $colW / 2,
                $rowY + 15,
                htmlspecialchars($keyLabel)
            );
            if ($isPk) {
                $svg .= sprintf(
                    '<text x="%d" y="%d" font-family="Arial, sans-serif" font-size="10" fill="#111827"><tspan text-decoration="underline">%s</tspan></text>',
                    $x + $colW + 6,
                    $rowY + 15,
                    htmlspecialchars($attrName)
                );
            } else {
                $svg .= sprintf(
                    '<text x="%d" y="%d" font-family="Arial, sans-serif" font-size="10" fill="#111827">%s</text>',
                    $x + $colW + 6,
                    $rowY + 15,
                    htmlspecialchars($attrName)
                );
            }
            $rowY += $rowH;
        }
    }

    $svg .= '</svg>';

    return $svg;
}

// ─── Entity definitions (mapped to actual Laravel tables) ─────────────────────
$entityDefs = [
    'training_module' => [
        'TRAINING_MODULE',
        [['PK', 'module_id', true], ['', 'module_name', false], ['', 'description', false], ['', 'curriculum', false], ['', 'status', false]],
        40,
        80,
    ],
    'scenario_exercise' => [
        'SCENARIO_EXERCISE',
        [['PK', 'scenario_id', true], ['FK1', 'module_id', false], ['', 'scenario_name', false], ['', 'description', false], ['', 'difficulty', false]],
        320,
        80,
    ],
    'simulation_event' => [
        'SIMULATION_EVENT',
        [['PK', 'event_id', true], ['FK1', 'scenario_id', false], ['', 'event_name', false], ['', 'event_date', false], ['', 'location', false], ['', 'status', false]],
        600,
        80,
    ],
    'participant' => [
        'PARTICIPANT',
        [['PK', 'participant_id', true], ['', 'first_name', false], ['', 'last_name', false], ['', 'organization', false], ['', 'email', false], ['', 'contact_no', false]],
        960,
        80,
    ],
    'participant_registration' => [
        'PARTICIPANT_REGISTRATION',
        [['PK', 'registration_id', true], ['FK1', 'participant_id', false], ['FK2', 'event_id', false], ['', 'registration_date', false], ['', 'attendance_status', false]],
        960,
        300,
    ],
    'evaluation' => [
        'EVALUATION',
        [['PK', 'evaluation_id', true], ['FK1', 'registration_id', false], ['', 'score', false], ['', 'remarks', false], ['', 'evaluation_date', false]],
        960,
        500,
    ],
    'certification' => [
        'CERTIFICATION',
        [['PK', 'certificate_id', true], ['FK1', 'evaluation_id', false], ['', 'certificate_no', false], ['', 'issue_date', false]],
        960,
        680,
    ],
    'resource_inventory' => [
        'RESOURCE_INVENTORY',
        [['PK', 'resource_id', true], ['', 'resource_name', false], ['', 'category', false], ['', 'quantity_available', false], ['', 'status', false]],
        320,
        400,
    ],
    'patrol_schedule' => [
        'PATROL_SCHEDULE',
        [['PK', 'patrol_id', true], ['FK1', 'event_id', false], ['', 'assigned_personnel', false], ['', 'patrol_date', false]],
        600,
        580,
    ],
    'campaign' => [
        'CAMPAIGN',
        [['PK', 'campaign_id', true], ['FK1', 'event_id', false], ['', 'campaign_name', false], ['', 'schedule', false]],
        820,
        400,
    ],
    'seminar_event' => [
        'SEMINAR_EVENT',
        [['PK', 'seminar_id', true], ['FK1', 'event_id', false], ['', 'seminar_name', false], ['', 'venue', false], ['', 'schedule', false]],
        820,
        580,
    ],
];

// Table name mapping note (for README)
$tableMap = [
    'TRAINING_MODULE' => 'training_modules',
    'SCENARIO_EXERCISE' => 'scenarios',
    'SIMULATION_EVENT' => 'simulation_events',
    'PARTICIPANT' => 'users (participant role)',
    'PARTICIPANT_REGISTRATION' => 'event_registrations',
    'EVALUATION' => 'participant_evaluations',
    'CERTIFICATION' => 'certificates',
    'RESOURCE_INVENTORY' => 'resources (+ event_resource)',
    'PATROL_SCHEDULE' => 'simulation_exercise_timeline_items / personnel_assignments',
    'CAMPAIGN' => 'campaign_requests (+ simulation_plans)',
    'SEMINAR_EVENT' => 'training_contents / lesson sessions',
];

// ─── Draw.io body ─────────────────────────────────────────────────────────────
$body = '';
foreach ($entityDefs as $id => [$name, $attrs, $x, $y]) {
    $body .= erdEntityDrawio($id, $name, $attrs, $x, $y);
}

$rels = [
    ['r1', 'training_module', 'scenario_exercise'],
    ['r2', 'scenario_exercise', 'simulation_event'],
    ['r3', 'simulation_event', 'participant_registration'],
    ['r4', 'participant', 'participant_registration'],
    ['r5', 'participant_registration', 'evaluation'],
    ['r6', 'evaluation', 'certification'],
    ['r7', 'simulation_event', 'resource_inventory'],
    ['r8', 'simulation_event', 'patrol_schedule'],
    ['r9', 'simulation_event', 'campaign'],
    ['r10', 'simulation_event', 'seminar_event'],
];
foreach ($rels as $r) {
    $body .= erdRelDrawio($r[0], $r[1], $r[2]);
}

$drawio = '<?xml version="1.0" encoding="UTF-8"?>'
    . '<mxfile host="app.diagrams.net" modified="' . date('c') . '" agent="generate_erd.php" version="22.1.0" type="device">'
    . wrapDiagram($body, 1400, 1000)
    . '</mxfile>';

$drawioPath = $outDir . DIRECTORY_SEPARATOR . '37_ERD_Overall.drawio';
file_put_contents($drawioPath, $drawio);

// ─── SVG (thesis format) ────────────────────────────────────────────────────────
$svgEntities = [];
foreach ($entityDefs as $id => [$name, $attrs, $x, $y]) {
    $svgEntities[] = [$id, $name, $attrs, $x, $y];
}

// Connection lines (center-to-center approximations for dashed lines)
$cx = fn (string $id): array => [
    $entityDefs[$id][2] + 140,
    $entityDefs[$id][3] + 30 + (count($entityDefs[$id][1]) * 26) / 2,
];

$svgLinks = [
    [...array_values(array_slice($cx('training_module'), 0, 2)), ...array_values(array_slice($cx('scenario_exercise'), 0, 2))],
    [...array_values(array_slice($cx('scenario_exercise'), 0, 2)), ...array_values(array_slice($cx('simulation_event'), 0, 2))],
    [...array_values(array_slice($cx('simulation_event'), 0, 2)), ...array_values(array_slice($cx('participant_registration'), 0, 2))],
    [...array_values(array_slice($cx('participant'), 0, 2)), ...array_values(array_slice($cx('participant_registration'), 0, 2))],
    [...array_values(array_slice($cx('participant_registration'), 0, 2)), ...array_values(array_slice($cx('evaluation'), 0, 2))],
    [...array_values(array_slice($cx('evaluation'), 0, 2)), ...array_values(array_slice($cx('certification'), 0, 2))],
    [$cx('simulation_event')[0] - 20, $cx('simulation_event')[1] + 40, $cx('resource_inventory')[0], $cx('resource_inventory')[1] - 30],
    [$cx('simulation_event')[0], $cx('simulation_event')[1] + 60, $cx('patrol_schedule')[0], $cx('patrol_schedule')[1] - 30],
    [$cx('simulation_event')[0] + 40, $cx('simulation_event')[1] + 40, $cx('campaign')[0], $cx('campaign')[1] - 30],
    [$cx('simulation_event')[0] + 60, $cx('simulation_event')[1] + 60, $cx('seminar_event')[0], $cx('seminar_event')[1] - 30],
];

$svgPath = $outDir . DIRECTORY_SEPARATOR . '37_ERD_Overall.svg';
file_put_contents($svgPath, buildThesisSvg($svgEntities, $svgLinks));

// ─── PNG via resvg or sharp ───────────────────────────────────────────────────
$pngPath = $outDir . DIRECTORY_SEPARATOR . '37_ERD_Overall.png';
$pngOk = false;

$resvgBin = $outDir . DIRECTORY_SEPARATOR . 'node_modules' . DIRECTORY_SEPARATOR . '.bin' . DIRECTORY_SEPARATOR . 'resvg.cmd';
if (!is_file($resvgBin)) {
    shell_exec('cd ' . escapeshellarg($outDir) . ' && npm install @resvg/resvg-js --no-save >nul 2>&1');
    $resvgBin = $outDir . DIRECTORY_SEPARATOR . 'node_modules' . DIRECTORY_SEPARATOR . '.bin' . DIRECTORY_SEPARATOR . 'resvg.cmd';
}

if (is_file($resvgBin)) {
    shell_exec(escapeshellarg($resvgBin) . ' ' . escapeshellarg($svgPath) . ' ' . escapeshellarg($pngPath) . ' 2>&1');
    $pngOk = is_file($pngPath) && filesize($pngPath) > 500;
}

if (!$pngOk && is_file($outDir . DIRECTORY_SEPARATOR . 'node_modules' . DIRECTORY_SEPARATOR . '@resvg' . DIRECTORY_SEPARATOR . 'resvg-js' . DIRECTORY_SEPARATOR . 'index.js')) {
    $js = <<<'JS'
const { Resvg } = require('@resvg/resvg-js');
const fs = require('fs');
const svg = fs.readFileSync(process.argv[2], 'utf8');
const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: 2400 } });
fs.writeFileSync(process.argv[3], resvg.render().asPng());
JS;
    $jsPath = $outDir . DIRECTORY_SEPARATOR . '_resvg_export.js';
    file_put_contents($jsPath, $js);
    shell_exec('node ' . escapeshellarg($jsPath) . ' ' . escapeshellarg($svgPath) . ' ' . escapeshellarg($pngPath) . ' 2>&1');
    $pngOk = is_file($pngPath) && filesize($pngPath) > 500;
    @unlink($jsPath);
}

if (!is_dir($docsAppDir)) {
    mkdir($docsAppDir, 0777, true);
}

$docsPng = $docsAppDir . DIRECTORY_SEPARATOR . 'ERD_Overall.png';
$docsSvg = $docsAppDir . DIRECTORY_SEPARATOR . 'ERD_Overall.svg';
if ($pngOk) {
    copy($pngPath, $docsPng);
} else {
    copy($svgPath, $docsSvg);
}

// Mapping reference for thesis
$mapPath = $outDir . DIRECTORY_SEPARATOR . 'ERD_Table_Mapping.md';
$mapMd = "# ERD Entity to Database Table Mapping\n\n| ERD Entity | Laravel / MySQL Table |\n|------------|----------------------|\n";
foreach ($tableMap as $erd => $db) {
    $mapMd .= "| `$erd` | `$db` |\n";
}
file_put_contents($mapPath, $mapMd);

echo 'DRAWIO_OK=' . $drawioPath . PHP_EOL;
echo 'SVG_OK=' . $svgPath . PHP_EOL;
echo 'PNG_OK=' . ($pngOk ? $pngPath : 'fallback_svg_only') . PHP_EOL;
echo 'DOCS_COPY=' . ($pngOk ? $docsPng : $docsSvg) . PHP_EOL;
echo 'MAP_OK=' . $mapPath . PHP_EOL;
