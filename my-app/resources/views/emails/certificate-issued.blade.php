<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Your Certificate</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 24px;">
    @php
        $program = $certificate->training_type
            ?? $certificate->simulationEvent?->title
            ?? $certificate->trainingModule?->title
            ?? 'Disaster Preparedness Training';
        $viewUrl = route('participant.certificates.view', $certificate);
        $verifyUrl = $certificate->verificationUrl();
    @endphp

    <h1 style="font-size: 22px; color: #0f766e; margin-bottom: 8px;">Your certificate is ready</h1>
    <p>Hello {{ $participant->name }},</p>
    <p>
        Your completion certificate for <strong>{{ $program }}</strong> has been issued.
    </p>

    <table style="width: 100%; border-collapse: collapse; margin: 20px 0; background: #f8fafc; border-radius: 8px;">
        <tr>
            <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #64748b;">Certificate #</td>
            <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-weight: bold;">{{ $certificate->certificate_number }}</td>
        </tr>
        @if($certificate->final_score)
        <tr>
            <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #64748b;">Score</td>
            <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-weight: bold;">{{ number_format((float) $certificate->final_score, 1) }}%</td>
        </tr>
        @endif
        <tr>
            <td style="padding: 12px 16px; font-size: 13px; color: #64748b;">Issued</td>
            <td style="padding: 12px 16px; font-weight: bold;">{{ $certificate->issued_at?->format('F j, Y') ?? '—' }}</td>
        </tr>
    </table>

    <p style="margin: 24px 0;">
        <a href="{{ $viewUrl }}" style="display: inline-block; background: #059669; color: white; text-decoration: none; padding: 12px 20px; border-radius: 8px; font-weight: bold;">
            View &amp; Download Certificate
        </a>
    </p>

    @if($verifyUrl)
    <p style="font-size: 14px;">
        <strong>Public verification link</strong><br>
        Anyone can verify this certificate at:<br>
        <a href="{{ $verifyUrl }}" style="color: #0f766e; word-break: break-all;">{{ $verifyUrl }}</a>
    </p>
    @endif

    <p style="font-size: 12px; color: #64748b; margin-top: 32px;">
        LGU Disaster Training &amp; Simulation Portal
    </p>
</body>
</html>
