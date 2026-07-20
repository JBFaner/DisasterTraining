<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Certificate extends Model
{
    protected $fillable = [
        'user_id',
        'simulation_event_id',
        'training_module_id',
        'evaluation_result_id',
        'participant_evaluation_id',
        'certificate_template_id',
        'template_background_path',
        'template_background_opacity',
        'template_paper_size',
        'template_content',
        'certificate_number',
        'qr_verification_token',
        'type',
        'training_type',
        'completion_date',
        'final_score',
        'issued_at',
        'issued_by',
        'file_path',
        'revoked_at',
        'revoked_by',
        'revoke_reason',
    ];

    protected $casts = [
        'completion_date' => 'date',
        'final_score' => 'decimal:2',
        'issued_at' => 'datetime',
        'revoked_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function simulationEvent()
    {
        return $this->belongsTo(SimulationEvent::class);
    }

    public function trainingModule()
    {
        return $this->belongsTo(TrainingModule::class);
    }

    public function evaluationResult()
    {
        return $this->belongsTo(EvaluationResult::class);
    }

    public function participantEvaluation()
    {
        return $this->belongsTo(ParticipantEvaluation::class);
    }

    public function certificateTemplate()
    {
        return $this->belongsTo(CertificateTemplate::class);
    }

    public function issuer()
    {
        return $this->belongsTo(User::class, 'issued_by');
    }

    public function isRevoked(): bool
    {
        return $this->revoked_at !== null;
    }

    public function verificationUrl(): ?string
    {
        if (! $this->qr_verification_token) {
            return null;
        }

        return url('/certificates/verify/'.$this->qr_verification_token);
    }

    public function ensureVerificationToken(): string
    {
        if ($this->qr_verification_token) {
            return $this->qr_verification_token;
        }

        $token = bin2hex(random_bytes(32));
        $this->forceFill(['qr_verification_token' => $token])->save();

        return $token;
    }

    public function qrCodeImageUrl(int $size = 160): ?string
    {
        $url = $this->verificationUrl();

        if (! $url) {
            return null;
        }

        return 'https://api.qrserver.com/v1/create-qr-code/?size='.$size.'x'.$size.'&data='.urlencode($url);
    }
}
