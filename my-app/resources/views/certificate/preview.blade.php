<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $title ?? 'Template Preview - ' . (optional($template)->name ?? 'Certificate') }}</title>
    <style>
        body { margin: 0; padding: 24px; background: linear-gradient(to bottom, #f8fafc, #eef2f7); font-family: system-ui, -apple-system, sans-serif; min-height: 100vh; }
        .toolbar { margin-bottom: 24px; }
        .toolbar a { display: inline-flex; align-items: center; gap: 6px; padding: 10px 18px; background: #16a34a; color: white; text-decoration: none; border-radius: 12px; font-size: 14px; font-weight: 500; transition: all 0.25s ease; }
        .toolbar a:hover { background: #15803d; transform: translateY(-2px); box-shadow: 0 4px 12px rgba(22,163,74,0.3); }
        .preview-wrap { background: white; padding: 32px; border-radius: 12px; box-shadow: 0 25px 50px rgba(0,0,0,0.1); max-width: 900px; margin: 0 auto; animation: certZoomIn 0.4s ease-out; }
        @keyframes certZoomIn { from { opacity: 0; transform: scale(0.97); } to { opacity: 1; transform: scale(1); } }
        .preview-wrap .certificate { min-height: 0; }
        /* A4/Letter landscape shape (wider than tall) */
        .certificate-outer { aspect-ratio: 297/210; max-width: 800px; width: 100%; margin: 0 auto; }
        .certificate-content, .certificate-outer .certificate { height: 100%; min-height: 0; box-sizing: border-box; }
        /* Certificate fonts: title & name → serif; body → sans-serif (match print) */
        .certificate-content { text-align: center; font-family: Arial, "Open Sans", "Lato", sans-serif; }
        .certificate-content h1,
        .certificate-content .certificate h1 { font-size: 48pt; font-weight: bold; font-family: "Times New Roman", Times, Georgia, serif; text-align: center; }
        .certificate-content .certificate p:nth-of-type(1) { font-size: 20pt; font-family: Arial, "Open Sans", "Lato", sans-serif; text-align: center; }
        .certificate-content .certificate p:nth-of-type(2) { font-size: 32pt; font-weight: bold; font-family: "Times New Roman", Times, Georgia, serif; text-align: center; }
        .certificate-content .certificate p:nth-of-type(3) { font-size: 20pt; font-family: Arial, "Open Sans", "Lato", sans-serif; text-align: center; }
        .certificate-content .certificate p:nth-of-type(4) { font-size: 28pt; font-weight: bold; font-family: "Times New Roman", Times, Georgia, serif; text-align: center; }
        .certificate-content .certificate p:nth-of-type(5) { font-size: 18pt; font-family: Arial, "Open Sans", "Lato", sans-serif; text-align: center; }
        .certificate-content .certificate p:nth-of-type(6) { font-size: 18pt; font-family: Arial, "Open Sans", "Lato", sans-serif; text-align: center; }
        @media print {
            @page { size: {{ ($paperSize ?? 'a4') === 'letter' ? 'letter landscape' : 'A4 landscape' }}; margin: 8mm; }
            body { background: white; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .toolbar, p { display: none !important; }
            .preview-wrap { box-shadow: none; padding: 16px; max-width: none; width: 100%; min-height: 190mm; display: flex; align-items: center; justify-content: center; }
            body.certificate-paper-letter .preview-wrap { min-height: 7.5in; }
            .preview-wrap .certificate { min-height: 0; }
            .certificate-outer { page-break-inside: avoid; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .certificate-bg, .certificate-content { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .certificate-outer .certificate { border: 3px solid #16a34a !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; box-sizing: border-box; }
            .certificate-content h1, .certificate-content .certificate h1 { font-size: 48pt !important; font-weight: bold !important; font-family: "Times New Roman", Times, Georgia, serif !important; text-align: center !important; }
            .certificate-content .certificate p:nth-of-type(1) { font-size: 20pt !important; font-family: Arial, "Open Sans", "Lato", sans-serif !important; }
            .certificate-content .certificate p:nth-of-type(2) { font-size: 32pt !important; font-weight: bold !important; font-family: "Times New Roman", Times, Georgia, serif !important; }
            .certificate-content .certificate p:nth-of-type(3) { font-size: 20pt !important; font-family: Arial, "Open Sans", "Lato", sans-serif !important; }
            .certificate-content .certificate p:nth-of-type(4) { font-size: 28pt !important; font-weight: bold !important; font-family: "Times New Roman", Times, Georgia, serif !important; }
            .certificate-content .certificate p:nth-of-type(5), .certificate-content .certificate p:nth-of-type(6) { font-size: 18pt !important; font-family: Arial, "Open Sans", "Lato", sans-serif !important; }
        }
    </style>
</head>
<body class="certificate-paper-{{ $paperSize ?? 'a4' }} certificate-orientation-landscape">
    <div class="toolbar">
        <a href="{{ route('certification') }}">← Back to Certification</a>
    </div>
    @if(isset($subtitle))
    <p style="color:#64748b; font-size:14px; margin-bottom:12px;">{{ $subtitle }}</p>
    @else
    <p style="color:#64748b; font-size:14px; margin-bottom:12px;">Preview with sample data (A4/Letter landscape). Placeholders: <code>{name}</code>, <code>{date}</code>, <code>{event}</code>, <code>{certificate_number}</code>, <code>{score}</code>, <code>{training_type}</code></p>
    @endif
    <div class="preview-wrap">
        <div class="certificate">
            {!! $content !!}
        </div>
    </div>
</body>
</html>
