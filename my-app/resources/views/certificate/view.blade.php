<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Certificate - {{ $certificate->certificate_number }}</title>
    <style>
        body { margin: 0; padding: 20px; background: #e2e8f0; font-family: system-ui, sans-serif; }
        .toolbar { margin-bottom: 16px; }
        .toolbar a, .toolbar button { display: inline-block; padding: 8px 16px; margin-right: 8px; background: #16a34a; color: white; text-decoration: none; border: none; border-radius: 6px; font-size: 14px; cursor: pointer; }
        .toolbar a:hover, .toolbar button:hover { background: #15803d; }
        .toolbar button.secondary { background: #64748b; }
        .toolbar-tip { font-size: 12px; color: #475569; margin-left: 12px; }
        .cert-wrap { background: white; padding: 24px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); max-width: 900px; margin: 0 auto; }
        .cert-wrap .certificate { min-height: 0; }
        /* A4/Letter shape: landscape = wider than tall, portrait = taller than wide */
        body.certificate-orientation-landscape .certificate-outer { aspect-ratio: 297/210; max-width: 800px; width: 100%; }
        body.certificate-orientation-portrait .certificate-outer { aspect-ratio: 210/297; max-width: 600px; width: 100%; }
        body.certificate-orientation-landscape .certificate-content,
        body.certificate-orientation-landscape .certificate-outer .certificate { height: 100%; min-height: 0; box-sizing: border-box; }
        body.certificate-orientation-portrait .certificate-content,
        body.certificate-orientation-portrait .certificate-outer .certificate { height: 100%; min-height: 0; box-sizing: border-box; }
        /* Certificate fonts on screen: title & name → serif; body → sans-serif (match preview/print) */
        .certificate-content { text-align: center; font-family: Arial, "Open Sans", "Lato", sans-serif; }
        .certificate-content h1, .certificate-content .certificate h1 { font-size: 48pt; font-weight: bold; font-family: "Times New Roman", Times, Georgia, serif; text-align: center; }
        .certificate-content .certificate p:nth-of-type(1) { font-size: 20pt; font-family: Arial, "Open Sans", "Lato", sans-serif; text-align: center; }
        .certificate-content .certificate p:nth-of-type(2) { font-size: 32pt; font-weight: bold; font-family: "Times New Roman", Times, Georgia, serif; text-align: center; }
        .certificate-content .certificate p:nth-of-type(3) { font-size: 20pt; font-family: Arial, "Open Sans", "Lato", sans-serif; text-align: center; }
        .certificate-content .certificate p:nth-of-type(4) { font-size: 28pt; font-weight: bold; font-family: "Times New Roman", Times, Georgia, serif; text-align: center; }
        .certificate-content .certificate p:nth-of-type(5), .certificate-content .certificate p:nth-of-type(6) { font-size: 18pt; font-family: Arial, "Open Sans", "Lato", sans-serif; text-align: center; }
        @media print {
            .toolbar-tip { display: none !important; }
            @page { size: {{ ($paperSize ?? 'a4') === 'letter' ? 'letter' : 'A4' }}{{ ($orientation ?? 'portrait') === 'landscape' ? ' landscape' : '' }}; margin: 0; }
            body { background: white; padding: 0; margin: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; min-height: 100vh; height: 100vh; }
            .toolbar { display: none !important; }
            .cert-wrap { box-shadow: none; padding: 0; margin: 0; position: fixed; top: 0; left: 0; right: 0; bottom: 0; width: 100%; height: 100%; max-width: none; min-height: 0; display: block; overflow: hidden; }
            .cert-wrap .certificate { min-height: 0; width: 100%; height: 100%; position: relative; }
            .certificate-outer { page-break-inside: avoid; -webkit-print-color-adjust: exact; print-color-adjust: exact; position: absolute; top: 0; left: 0; width: 100% !important; height: 100% !important; max-width: none !important; transform: none !important; }
            .certificate-bg { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .certificate-content { -webkit-print-color-adjust: exact; print-color-adjust: exact; position: absolute; top: 0; left: 0; width: 100%; height: 100%; text-align: center !important; font-family: Arial, "Open Sans", "Lato", sans-serif; display: flex !important; flex-direction: column !important; align-items: center !important; justify-content: center !important; }
            .certificate-content > * { box-sizing: border-box; width: 100% !important; height: 100% !important; max-width: none !important; padding: 12mm !important; text-align: center !important; display: flex !important; flex-direction: column !important; align-items: center !important; justify-content: center !important; }
            .certificate-content p, .certificate-content span, .certificate-content div { text-align: center !important; }
            /* Title & name → serif; body → sans-serif. Sizes in pt for print. */
            .certificate-content h1 { font-size: 48pt !important; font-weight: bold !important; font-family: "Times New Roman", Times, Georgia, serif !important; text-align: center !important; }
            .certificate-content .certificate h1 { font-size: 48pt !important; font-weight: bold !important; font-family: "Times New Roman", Times, Georgia, serif !important; text-align: center !important; }
            .certificate-content .certificate p:nth-of-type(1) { font-size: 20pt !important; font-family: Arial, "Open Sans", "Lato", sans-serif !important; }
            .certificate-content .certificate p:nth-of-type(2) { font-size: 32pt !important; font-weight: bold !important; font-family: "Times New Roman", Times, Georgia, serif !important; }
            .certificate-content .certificate p:nth-of-type(3) { font-size: 20pt !important; font-family: Arial, "Open Sans", "Lato", sans-serif !important; }
            .certificate-content .certificate p:nth-of-type(4) { font-size: 28pt !important; font-weight: bold !important; font-family: "Times New Roman", Times, Georgia, serif !important; }
            .certificate-content .certificate p:nth-of-type(5) { font-size: 18pt !important; font-family: Arial, "Open Sans", "Lato", sans-serif !important; }
            .certificate-content .certificate p:nth-of-type(6) { font-size: 18pt !important; font-family: Arial, "Open Sans", "Lato", sans-serif !important; }
            .certificate-outer .certificate { border: 3px solid #16a34a !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; box-sizing: border-box; width: 100% !important; height: 100% !important; max-width: none !important; padding: 12mm !important; text-align: center !important; font-family: Arial, "Open Sans", "Lato", sans-serif !important; }
        }
    </style>
</head>
<body class="certificate-paper-{{ $paperSize ?? 'a4' }} certificate-orientation-{{ $orientation ?? 'portrait' }}">
    <div class="toolbar">
        <a href="{{ route('certification') }}">← Back to Certification</a>
        <button type="button" class="secondary" onclick="window.open('{{ route('certificates.view', ['certificate' => $certificate, 'orientation' => 'portrait', 'print' => 1]) }}', 'print', 'width=800,height=600');">Print / PDF (Portrait)</button>
        <button type="button" class="secondary" onclick="window.open('{{ route('certificates.view', ['certificate' => $certificate, 'orientation' => 'landscape', 'print' => 1]) }}', 'print', 'width=800,height=600');">Print / PDF (Landscape)</button>
        <span class="toolbar-tip">For a real certificate: in the print dialog set Margins to <strong>None</strong> or <strong>Minimum</strong>, uncheck <strong>Headers and footers</strong>, enable <strong>Background graphics</strong>. Paper: {{ strtoupper($paperSize ?? 'a4') }}.</span>
    </div>
    @if(!empty($autoPrint))
    <div class="print-reminder" role="note">For a real certificate: set Margins to <strong>None</strong> or <strong>Minimum</strong>, uncheck <strong>Headers and footers</strong>, enable <strong>Background graphics</strong>, then Save.</div>
    <style>.print-reminder { position: fixed; top: 0; left: 0; right: 0; background: #1e40af; color: white; padding: 10px 16px; text-align: center; font-size: 13px; z-index: 9999; } @media print { .print-reminder { display: none !important; } }</style>
    <script>window.onload = function() { window.print(); }</script>
    @endif
    <div class="cert-wrap">
        <div class="certificate">
            {!! $content !!}
        </div>
    </div>
</body>
</html>
