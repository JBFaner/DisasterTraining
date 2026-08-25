<?php

/**
 * UML Sequence diagrams — AlertaraQC (3 critical scenarios).
 * Run: php Documents/sequence/generate_sequence.php
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
    $jsPath = $erdDir . DIRECTORY_SEPARATOR . '_resvg_seq.js';
    file_put_contents($jsPath, $js);
    shell_exec('cd /d ' . escapeshellarg($erdDir) . ' && node ' . escapeshellarg($jsPath) . ' ' . escapeshellarg($svgPath) . ' ' . escapeshellarg($pngPath) . ' 2>&1');
    @unlink($jsPath);

    return is_file($pngPath) && filesize($pngPath) > 500;
}

class SequenceDiagram
{
    public string $id;
    public string $title;
    /** @var list<array{id:string,label:string,x:int}> */
    public array $participants = [];
    /** @var list<array{from:int,to:int,label:string,kind:string}> */
    public array $messages = [];
    public int $pageW = 1200;
    public int $pageH = 720;

    public function __construct(string $id, string $title)
    {
        $this->id = $id;
        $this->title = $title;
    }

    public function addParticipant(string $id, string $label, int $x): void
    {
        $this->participants[] = ['id' => $id, 'label' => $label, 'x' => $x];
    }

    /** @param 'sync'|'return'|'async' $kind */
    public function addMessage(string $fromId, string $toId, string $label, string $kind = 'sync'): void
    {
        $fromIdx = $this->idx($fromId);
        $toIdx = $this->idx($toId);
        if ($fromIdx < 0 || $toIdx < 0) {
            return;
        }
        $this->messages[] = [
            'from' => $fromIdx,
            'to' => $toIdx,
            'label' => $label,
            'kind' => $kind,
        ];
    }

    private function idx(string $id): int
    {
        foreach ($this->participants as $i => $p) {
            if ($p['id'] === $id) {
                return $i;
            }
        }
        return -1;
    }

    public function centerX(int $participantIdx): int
    {
        return $this->participants[$participantIdx]['x'] + 55;
    }

    public function buildDrawioBody(): string
    {
        $topY = 72;
        $lifeTop = 118;
        $lifeBottom = 640;
        $msgStartY = 150;
        $msgStep = 38;

        $xml = sprintf(
            '<mxCell id="%s_title" value="%s" style="rounded=0;whiteSpace=wrap;html=1;fillColor=#1e3a5f;fontColor=#ffffff;fontStyle=1;fontSize=12;strokeColor=#1e3a5f;" vertex="1" parent="1"><mxGeometry x="40" y="16" width="%d" height="40" as="geometry"/></mxCell>',
            esc($this->id),
            esc($this->title),
            $this->pageW - 80
        );

        foreach ($this->participants as $p) {
            $xml .= sprintf(
                '<mxCell id="%s_%s" value="%s" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#dbeafe;strokeColor=#1e3a5f;fontStyle=1;fontSize=10;align=center;" vertex="1" parent="1"><mxGeometry x="%d" y="%d" width="110" height="40" as="geometry"/></mxCell>',
                esc($this->id),
                esc($p['id']),
                esc($p['label']),
                $p['x'],
                $topY
            );
            $cx = $p['x'] + 55;
            $xml .= sprintf(
                '<mxCell id="%s_%s_line" value="" style="endArrow=none;dashed=1;html=1;strokeWidth=1;strokeColor=#64748b;" edge="1" parent="1"><mxGeometry relative="1" as="geometry"><mxPoint x="%d" y="%d" as="sourcePoint"/><mxPoint x="%d" y="%d" as="targetPoint"/></mxGeometry></mxCell>',
                esc($this->id),
                esc($p['id']),
                $cx,
                $lifeTop,
                $cx,
                $lifeBottom
            );
        }

        foreach ($this->messages as $i => $m) {
            $y = $msgStartY + $i * $msgStep;
            $x1 = $this->centerX($m['from']);
            $x2 = $this->centerX($m['to']);
            $dashed = $m['kind'] === 'return' ? 'dashed=1;' : '';
            $open = $m['kind'] === 'async' ? 'startArrow=open;startFill=0;' : '';
            $xml .= sprintf(
                '<mxCell id="%s_m%d" value="%s" style="html=1;verticalAlign=bottom;endArrow=block;endFill=1;strokeWidth=1.5;strokeColor=#0f172a;%s%sfontSize=10;labelBackgroundColor=#ffffff;" edge="1" parent="1"><mxGeometry relative="1" as="geometry"><mxPoint x="%d" y="%d" as="sourcePoint"/><mxPoint x="%d" y="%d" as="targetPoint"/></mxGeometry></mxCell>',
                esc($this->id),
                $i,
                esc($m['label']),
                $dashed,
                $open,
                $x1,
                $y,
                $x2,
                $y
            );

            // activation bar on receiver for sync messages
            if ($m['kind'] === 'sync' && $m['from'] !== $m['to']) {
                $rx = $this->participants[$m['to']]['x'] + 50;
                $xml .= sprintf(
                    '<mxCell id="%s_a%d" value="" style="rounded=0;whiteSpace=wrap;html=1;fillColor=#99f6e4;strokeColor=#0f766e;opacity=60;" vertex="1" parent="1"><mxGeometry x="%d" y="%d" width="10" height="28" as="geometry"/></mxCell>',
                    esc($this->id),
                    $i,
                    $rx,
                    $y - 4
                );
            }
        }

        $xml .= sprintf(
            '<mxCell id="%s_note" value="Solid arrow = request/response · Dashed = return message · AlertaraQC — Barangay San Agustin pilot" style="text;html=1;strokeColor=none;fillColor=none;align=center;verticalAlign=middle;fontSize=9;fontColor=#64748b;" vertex="1" parent="1"><mxGeometry x="40" y="660" width="%d" height="24" as="geometry"/></mxCell>',
            esc($this->id),
            $this->pageW - 80
        );

        return $xml;
    }

    public function buildSvg(): string
    {
        $w = $this->pageW;
        $h = $this->pageH;
        $lifeTop = 118;
        $lifeBottom = 620;
        $msgStartY = 150;
        $msgStep = 38;

        $svg = '<?xml version="1.0" encoding="UTF-8"?>';
        $svg .= '<svg xmlns="http://www.w3.org/2000/svg" width="' . $w . '" height="' . $h . '" viewBox="0 0 ' . $w . ' ' . $h . '">';
        $svg .= '<defs><marker id="arr" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto"><polygon points="0 0, 10 3.5, 0 7" fill="#0f172a"/></marker></defs>';
        $svg .= '<rect width="100%" height="100%" fill="#ffffff"/>';
        $svg .= '<rect x="40" y="16" width="' . ($w - 80) . '" height="40" rx="2" fill="#1e3a5f"/>';
        $svg .= '<text x="' . ($w / 2) . '" y="42" text-anchor="middle" font-family="Arial,sans-serif" font-size="13" font-weight="700" fill="#ffffff">' . esc($this->title) . '</text>';

        foreach ($this->participants as $p) {
            $x = $p['x'];
            $svg .= '<rect x="' . $x . '" y="72" width="110" height="40" rx="8" fill="#dbeafe" stroke="#1e3a5f"/>';
            $svg .= '<text x="' . ($x + 55) . '" y="97" text-anchor="middle" font-family="Arial,sans-serif" font-size="10" font-weight="700" fill="#0f172a">' . esc($p['label']) . '</text>';
            $cx = $x + 55;
            $svg .= '<line x1="' . $cx . '" y1="' . $lifeTop . '" x2="' . $cx . '" y2="' . $lifeBottom . '" stroke="#94a3b8" stroke-width="1" stroke-dasharray="6 4"/>';
        }

        foreach ($this->messages as $i => $m) {
            $y = $msgStartY + $i * $msgStep;
            $x1 = $this->centerX($m['from']);
            $x2 = $this->centerX($m['to']);
            $dash = $m['kind'] === 'return' ? ' stroke-dasharray="6 4"' : '';
            $dir = $x2 >= $x1 ? 1 : -1;
            $ax1 = $x1;
            $ax2 = $x2 - ($dir * 8);
            $svg .= '<line x1="' . $ax1 . '" y1="' . $y . '" x2="' . $ax2 . '" y2="' . $y . '" stroke="#0f172a" stroke-width="1.5"' . $dash . ' marker-end="url(#arr)"/>';
            $lx = min($x1, $x2) + abs($x2 - $x1) / 2;
            $svg .= '<text x="' . $lx . '" y="' . ($y - 6) . '" text-anchor="middle" font-family="Arial,sans-serif" font-size="9" fill="#334155">' . esc($m['label']) . '</text>';
        }

        $svg .= '<text x="' . ($w / 2) . '" y="652" text-anchor="middle" font-family="Arial,sans-serif" font-size="9" fill="#64748b">Solid = request · Dashed = return · AlertaraQC — Barangay San Agustin pilot</text>';
        $svg .= '</svg>';

        return $svg;
    }
}

function wrapDiagram(string $diagramId, string $name, string $body, int $pageW, int $pageH): string
{
    return sprintf(
        '<diagram id="%s" name="%s"><mxGraphModel dx="1200" dy="720" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="%d" pageHeight="%d" math="0" shadow="0"><root><mxCell id="0"/><mxCell id="1" parent="0"/>%s</root></mxGraphModel></diagram>',
        esc($diagramId),
        esc($name),
        $pageW,
        $pageH,
        $body
    );
}

function diagramLogin(): SequenceDiagram
{
    $d = new SequenceDiagram('seq_login', 'Sequence Diagram — Admin OTP Login (AlertaraQC)');
    $d->addParticipant('admin', 'LGU Admin', 80);
    $d->addParticipant('ui', 'Web UI (React)', 260);
    $d->addParticipant('app', 'Laravel App', 440);
    $d->addParticipant('db', 'MySQL DB', 620);
    $d->addParticipant('smtp', 'SMTP Email', 800);
    $d->addMessage('admin', 'ui', 'Enter email + password');
    $d->addMessage('ui', 'app', 'POST /admin/login');
    $d->addMessage('app', 'db', 'Validate credentials + RBAC');
    $d->addMessage('db', 'app', 'User record', 'return');
    $d->addMessage('app', 'smtp', 'Send OTP email');
    $d->addMessage('app', 'ui', 'OTP challenge required', 'return');
    $d->addMessage('admin', 'ui', 'Submit OTP code');
    $d->addMessage('ui', 'app', 'POST /admin/verify-otp');
    $d->addMessage('app', 'db', 'Create session + audit log');
    $d->addMessage('app', 'ui', '302 → Dashboard', 'return');
    $d->addMessage('ui', 'admin', 'Show admin portal', 'return');
    return $d;
}

function diagramAiScenario(): SequenceDiagram
{
    $d = new SequenceDiagram('seq_ai', 'Sequence Diagram — AI Scenario Generation (Gemini)');
    $d->addParticipant('trainer', 'Lead Trainer', 80);
    $d->addParticipant('ui', 'Web UI', 260);
    $d->addParticipant('app', 'Laravel App', 440);
    $d->addParticipant('gem', 'Gemini API', 620);
    $d->addParticipant('db', 'MySQL DB', 800);
    $d->addMessage('trainer', 'ui', 'Request generate final scenario');
    $d->addMessage('ui', 'app', 'POST /scenarios/generate (CSRF + session)');
    $d->addMessage('app', 'db', 'Load module context + hazard hints');
    $d->addMessage('db', 'app', 'Training + hazard data', 'return');
    $d->addMessage('app', 'gem', 'HTTPS prompt (sync API call)');
    $d->addMessage('gem', 'app', 'Scenario JSON / text', 'return');
    $d->addMessage('app', 'db', 'Save draft scenario version');
    $d->addMessage('app', 'ui', '200 OK + scenario payload', 'return');
    $d->addMessage('ui', 'trainer', 'Preview / publish scenario', 'return');
    return $d;
}

function diagramPublish(): SequenceDiagram
{
    $d = new SequenceDiagram('seq_pub', 'Sequence Diagram — Publish Simulation Event (Readiness → Monitoring)');
    $d->addParticipant('trainer', 'Lead Trainer', 60);
    $d->addParticipant('ui', 'Web UI', 220);
    $d->addParticipant('app', 'Laravel App', 400);
    $d->addParticipant('db', 'MySQL DB', 580);
    $d->addParticipant('g6', 'Campaign Planning (G6)', 760);
    $d->addParticipant('cpsqc', 'CPSQC Patrol', 940);
    $d->pageW = 1180;
    $d->addMessage('trainer', 'ui', 'Complete readiness checklist');
    $d->addMessage('ui', 'app', 'POST /events/{id}/publish');
    $d->addMessage('app', 'db', 'Verify template, personnel, attendance gates');
    $d->addMessage('db', 'app', 'Checklist OK', 'return');
    $d->addMessage('app', 'db', 'UPDATE status = published');
    $d->addMessage('app', 'g6', 'Notify campaign status (if linked)', 'async');
    $d->addMessage('app', 'cpsqc', 'Refresh marshal availability (optional)', 'async');
    $d->addMessage('app', 'ui', 'Publish success + lifecycle URL', 'return');
    $d->addMessage('ui', 'trainer', 'Open monitoring view', 'return');
    return $d;
}

$diagrams = [
    ['file' => '39_Sequence_Admin_OTP_Login', 'tab' => '1 — Admin OTP Login', 'builder' => 'diagramLogin'],
    ['file' => '40_Sequence_AI_Scenario', 'tab' => '2 — AI Scenario (Gemini)', 'builder' => 'diagramAiScenario'],
    ['file' => '41_Sequence_Publish_Event', 'tab' => '3 — Publish Simulation Event', 'builder' => 'diagramPublish'],
];

$allDrawio = '<?xml version="1.0" encoding="UTF-8"?>'
    . '<mxfile host="app.diagrams.net" modified="' . date('c') . '" agent="generate_sequence.php" version="22.1.0" type="device">';

foreach ($diagrams as $spec) {
    /** @var SequenceDiagram $d */
    $d = $spec['builder']();
    $body = $d->buildDrawioBody();
    $allDrawio .= wrapDiagram($d->id, $spec['tab'], $body, $d->pageW, $d->pageH);

    $singleDrawio = '<?xml version="1.0" encoding="UTF-8"?>'
        . '<mxfile host="app.diagrams.net" modified="' . date('c') . '" agent="generate_sequence.php" version="22.1.0" type="device">'
        . wrapDiagram($d->id, $spec['tab'], $body, $d->pageW, $d->pageH)
        . '</mxfile>';

    $drawioPath = $outDir . DIRECTORY_SEPARATOR . $spec['file'] . '.drawio';
    $svgPath = $outDir . DIRECTORY_SEPARATOR . $spec['file'] . '.svg';
    $pngPath = $outDir . DIRECTORY_SEPARATOR . $spec['file'] . '.png';

    file_put_contents($drawioPath, $singleDrawio);
    file_put_contents($svgPath, $d->buildSvg());
    $pngOk = exportPng($svgPath, $pngPath, $erdDir);
    echo 'DRAWIO_OK=' . $drawioPath . PHP_EOL;
    echo 'SVG_OK=' . $svgPath . PHP_EOL;
    echo 'PNG_OK=' . ($pngOk ? $pngPath : 'failed') . PHP_EOL;
}

$allDrawio .= '</mxfile>';
$allPath = $outDir . DIRECTORY_SEPARATOR . '39_Sequence_All.drawio';
file_put_contents($allPath, $allDrawio);
echo 'ALL_DRAWIO_OK=' . $allPath . PHP_EOL;

// Copy primary diagram to my-app/docs and Documents root
$primarySvg = $outDir . DIRECTORY_SEPARATOR . '41_Sequence_Publish_Event.svg';
$primaryPng = $outDir . DIRECTORY_SEPARATOR . '41_Sequence_Publish_Event.png';
if (is_dir($docsAppDir)) {
    if (is_file($primaryPng)) {
        copy($primaryPng, $docsAppDir . DIRECTORY_SEPARATOR . 'Sequence_Publish_Simulation_Event.png');
        copy($primaryPng, $docsRoot . DIRECTORY_SEPARATOR . '41_Sequence_Publish_Event.png');
    } elseif (is_file($primarySvg)) {
        copy($primarySvg, $docsAppDir . DIRECTORY_SEPARATOR . 'Sequence_Publish_Simulation_Event.svg');
    }
}
