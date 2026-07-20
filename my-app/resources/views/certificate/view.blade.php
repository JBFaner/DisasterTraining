<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Certificate - {{ $certificate->certificate_number }}</title>
    <style>
        body { margin: 0; padding: 24px; background: linear-gradient(to bottom, #f8fafc, #eef2f7); font-family: system-ui, -apple-system, sans-serif; min-height: 100vh; }
        .toolbar { margin-bottom: 24px; display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
        .toolbar a, .toolbar button { display: inline-flex; align-items: center; gap: 6px; padding: 10px 18px; background: #16a34a; color: white; text-decoration: none; border: none; border-radius: 12px; font-size: 14px; font-weight: 500; cursor: pointer; transition: all 0.25s ease; }
        .toolbar a:hover, .toolbar button:hover { background: #15803d; transform: translateY(-2px); box-shadow: 0 4px 12px rgba(22,163,74,0.3); }
        .toolbar button.secondary { background: #64748b; }
        .toolbar button.secondary:hover { background: #475569; box-shadow: 0 4px 12px rgba(100,116,139,0.3); }
        .toolbar-tip { font-size: 12px; color: #475569; margin-left: 12px; }
        .cert-wrap { background: white; padding: 32px; border-radius: 12px; box-shadow: 0 25px 50px rgba(0,0,0,0.1); max-width: 900px; margin: 0 auto; animation: certZoomIn 0.4s ease-out; }
        @keyframes certZoomIn { from { opacity: 0; transform: scale(0.97); } to { opacity: 1; transform: scale(1); } }
        .cert-wrap .certificate { min-height: 0; }
        .verify-panel { margin-top: 24px; background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; max-width: 900px; margin-left: auto; margin-right: auto; }
        .verify-panel h2 { margin: 0 0 12px; font-size: 16px; color: #0f172a; }
        .verify-grid { display: grid; grid-template-columns: 160px 1fr; gap: 20px; align-items: start; }
        .verify-url { font-family: ui-monospace, monospace; font-size: 12px; word-break: break-all; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 12px; }
        .share-row { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
        .share-row a, .share-row button { display: inline-flex; align-items: center; gap: 6px; padding: 8px 14px; border-radius: 10px; border: 1px solid #cbd5e1; background: white; color: #334155; text-decoration: none; font-size: 13px; cursor: pointer; }
        .share-row a:hover, .share-row button:hover { background: #f8fafc; }
        .share-row button.primary { background: #059669; color: white; border-color: #059669; }
        .share-row button.primary:hover { background: #047857; }
        @media (max-width: 640px) { .verify-grid { grid-template-columns: 1fr; } }
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
            .no-print, .verify-panel { display: none !important; }
            @page { size: {{ ($paperSize ?? 'a4') === 'letter' ? 'letter' : 'A4' }}{{ ($orientation ?? 'portrait') === 'landscape' ? ' landscape' : '' }}; margin: 0; }
            body { background: white; padding: 0; margin: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; min-height: 100vh; height: 100vh; }
            .toolbar { display: none !important; }
            .cert-wrap { box-shadow: none; padding: 0; margin: 0; position: fixed; top: 0; left: 0; right: 0; bottom: 0; width: 100%; height: 100%; max-width: none; min-height: 0; display: block; overflow: hidden; }
            .cert-wrap .certificate { min-height: 0; width: 100%; height: 100%; position: relative; }
            .certificate-outer { page-break-inside: avoid; -webkit-print-color-adjust: exact; print-color-adjust: exact; position: absolute; top: 0; left: 0; width: 100% !important; height: 100% !important; max-width: none !important; transform: none !important; }
            .certificate-bg { -webkit-print-color-adjust: exact; print-color-adjust: exact; image-rendering: -webkit-optimize-contrast; image-rendering: crisp-edges; }
            .certificate-content { -webkit-print-color-adjust: exact; print-color-adjust: exact; position: absolute; top: 0; left: 0; width: 100%; height: 100%; text-align: center !important; font-family: Arial, "Open Sans", "Lato", sans-serif; display: flex !important; align-items: center !important; justify-content: center !important; padding: 12mm !important; box-sizing: border-box; }
            .certificate-content > * { box-sizing: border-box; max-width: 100% !important; text-align: center !important; }
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
        <a href="{{ route($certificationBackRoute ?? 'admin.certification.index') }}">← Back to Certification</a>
        <button type="button" class="secondary" onclick="window.open('{{ route($certificateViewRoute ?? 'admin.certificates.view', ['certificate' => $certificate, 'orientation' => 'portrait', 'print' => 1]) }}', 'print', 'width=800,height=600');">Print / PDF (Portrait)</button>
        <button type="button" class="secondary" onclick="window.open('{{ route($certificateViewRoute ?? 'admin.certificates.view', ['certificate' => $certificate, 'orientation' => 'landscape', 'print' => 1]) }}', 'print', 'width=800,height=600');">Print / PDF (Landscape)</button>
        <span class="toolbar-tip">In the print dialog: set Margins to <strong>None</strong>, uncheck <strong>Headers and footers</strong>, and turn <strong>on</strong> <strong>Background graphics</strong>—otherwise the PDF will look lighter than the screen. Paper: {{ strtoupper($paperSize ?? 'a4') }}.</span>
    </div>
    @if(!empty($autoPrint))
    <div class="print-reminder" role="note">Before saving: set Margins to <strong>None</strong>, uncheck <strong>Headers and footers</strong>, and turn <strong>on</strong> <strong>Background graphics</strong> (under Options). If this is off, the PDF will look lighter than the certificate on screen.</div>
    <style>.print-reminder { position: fixed; top: 0; left: 0; right: 0; background: #1e40af; color: white; padding: 12px 20px; text-align: center; font-size: 14px; z-index: 9999; font-weight: 500; box-shadow: 0 2px 8px rgba(0,0,0,0.15); } @media print { .print-reminder { display: none !important; } }</style>
    <script>window.onload = function() { window.print(); }</script>
    @endif
    <div class="cert-wrap">
        <div class="certificate">
            {!! $content !!}
        </div>
    </div>

    @if(!empty($verificationUrl))
    <div class="verify-panel no-print">
        <h2>Verify &amp; Share</h2>
        <p style="font-size: 13px; color: #64748b; margin: 0 0 16px;">
            Scan the QR code or share the public verification link so employers and trainers can confirm this certificate.
        </p>
        <div class="verify-grid">
            @if(!empty($qrCodeImageUrl))
            <div>
                <img src="{{ $qrCodeImageUrl }}" alt="Certificate verification QR code" width="160" height="160" style="border-radius: 8px; border: 1px solid #e2e8f0;">
            </div>
            @endif
            <div>
                <p style="font-size: 12px; font-weight: 600; color: #475569; margin: 0 0 6px;">Verification link</p>
                <div class="verify-url" id="cert-verify-url">{{ $verificationUrl }}</div>
                <div class="share-row">
                    <button type="button" class="primary" onclick="copyVerifyLink()">Copy verification link</button>
                    @if(!empty($isParticipant) && !empty($emailCertificateUrl))
                    <form method="POST" action="{{ $emailCertificateUrl }}" style="display:inline;">
                        @csrf
                        <button type="submit">Email me this certificate</button>
                    </form>
                    @endif
                    <a href="https://www.linkedin.com/sharing/share-offsite/?url={{ urlencode($verificationUrl) }}" target="_blank" rel="noopener noreferrer">Share on LinkedIn</a>
                    <a href="https://twitter.com/intent/tweet?text={{ urlencode('Verify my disaster preparedness certificate: '.$certificate->certificate_number) }}&url={{ urlencode($verificationUrl) }}" target="_blank" rel="noopener noreferrer">Share on X</a>
                    <a href="https://www.facebook.com/sharer/sharer.php?u={{ urlencode($verificationUrl) }}" target="_blank" rel="noopener noreferrer">Share on Facebook</a>
                </div>
                <p id="copy-status" style="font-size: 12px; color: #059669; margin: 10px 0 0; display: none;">Link copied to clipboard.</p>
            </div>
        </div>
    </div>
    <script>
        function copyVerifyLink() {
            const text = document.getElementById('cert-verify-url')?.textContent?.trim();
            if (!text) return;
            navigator.clipboard.writeText(text).then(function () {
                const status = document.getElementById('copy-status');
                if (status) {
                    status.style.display = 'block';
                    setTimeout(function () { status.style.display = 'none'; }, 2500);
                }
            });
        }
    </script>
    @endif
</body>
</html>
