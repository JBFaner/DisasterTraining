<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Certificate Verification - {{ $certificate->certificate_number }}</title>
    <style>
        body { margin: 0; padding: 24px; background: #f8fafc; font-family: system-ui, -apple-system, sans-serif; color: #0f172a; }
        .card { max-width: 560px; margin: 0 auto; background: white; border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0 10px 30px rgba(15,23,42,0.08); overflow: hidden; }
        .header { padding: 24px; text-align: center; border-bottom: 1px solid #e2e8f0; }
        .badge { display: inline-flex; align-items: center; gap: 8px; padding: 8px 16px; border-radius: 999px; font-size: 14px; font-weight: 600; }
        .badge.valid { background: #dcfce7; color: #166534; }
        .badge.invalid { background: #fee2e2; color: #991b1b; }
        .body { padding: 24px; }
        .row { display: flex; justify-content: space-between; gap: 16px; padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
        .row:last-child { border-bottom: none; }
        .label { color: #64748b; }
        .value { font-weight: 600; text-align: right; }
        .footer { padding: 16px 24px; background: #f8fafc; font-size: 12px; color: #64748b; text-align: center; }
    </style>
</head>
<body>
    <div class="card">
        <div class="header">
            <h1 style="margin: 0 0 12px; font-size: 20px;">Certificate Verification</h1>
            <span class="badge {{ $isValid ? 'valid' : 'invalid' }}">
                {{ $isValid ? '✓ Valid Certificate' : '✗ Revoked or Invalid' }}
            </span>
        </div>
        <div class="body">
            <div class="row"><span class="label">Certificate No.</span><span class="value">{{ $certificate->certificate_number }}</span></div>
            <div class="row"><span class="label">Participant</span><span class="value">{{ $certificate->user?->name ?? 'N/A' }}</span></div>
            <div class="row"><span class="label">Training / Event</span><span class="value">{{ $certificate->simulationEvent?->title ?? $certificate->trainingModule?->title ?? $certificate->training_type ?? 'N/A' }}</span></div>
            @if($certificate->final_score)
            <div class="row"><span class="label">Final Score</span><span class="value">{{ $certificate->final_score }}%</span></div>
            @endif
            <div class="row"><span class="label">Completion Date</span><span class="value">{{ $certificate->completion_date?->format('F j, Y') ?? 'N/A' }}</span></div>
            <div class="row"><span class="label">Issued</span><span class="value">{{ $certificate->issued_at?->format('F j, Y') ?? 'N/A' }}</span></div>
            @if($certificate->revoked_at)
            <div class="row"><span class="label">Revoked</span><span class="value">{{ $certificate->revoked_at->format('F j, Y') }}</span></div>
            @endif
        </div>
        <div class="footer">Disaster Preparedness Training — Official Certificate Verification</div>
    </div>
</body>
</html>
