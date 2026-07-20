<?php

namespace App\Services;

use App\Models\AiScenarioAttempt;
use App\Models\Certificate;
use App\Models\CertificateTemplate;
use App\Models\CertificationSetting;
use App\Models\EvaluationResult;
use App\Models\ParticipantEvaluation;
use App\Services\DatabaseBackupService;
use App\Services\PortalNotificationFactory;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class TrainingCertificateService
{
    public function __construct(
        private readonly PortalNotificationFactory $notificationFactory,
    ) {}

    public function issueForPassedAttempt(AiScenarioAttempt $attempt, EvaluationResult $evaluation): ?Certificate
    {
        $attempt->loadMissing(['user', 'trainingModule']);

        $existing = Certificate::query()
            ->where('user_id', $attempt->user_id)
            ->where('training_module_id', $attempt->training_module_id)
            ->whereNull('revoked_at')
            ->first();

        if ($existing) {
            if ((float) $evaluation->percentage > (float) ($existing->final_score ?? 0)) {
                $existing->update([
                    'evaluation_result_id' => $evaluation->id,
                    'final_score' => $evaluation->percentage,
                    'completion_date' => $evaluation->completed_at?->toDateString() ?? now()->toDateString(),
                    'issued_at' => now(),
                ]);

                app(DatabaseBackupService::class)->queueAfterCommit('certificate_issued');
            }

            return $existing;
        }

        $template = CertificateTemplate::where('status', 'active')->first();

        if (! $template) {
            Log::warning('No active certificate template available for AI scenario pass.', [
                'attempt_id' => $attempt->id,
                'user_id' => $attempt->user_id,
            ]);

            return null;
        }

        $certNumber = $this->generateCertificateNumber();
        $snapshotBackgroundPath = $this->snapshotTemplateBackground($template, $certNumber);

        $certificate = Certificate::create([
            'user_id' => $attempt->user_id,
            'simulation_event_id' => null,
            'training_module_id' => $attempt->training_module_id,
            'evaluation_result_id' => $evaluation->id,
            'certificate_template_id' => $template->id,
            'template_background_path' => $snapshotBackgroundPath ?? $template->background_path,
            'template_background_opacity' => $template->background_opacity,
            'template_paper_size' => $template->paper_size,
            'template_content' => $template->getSnapshotContent(),
            'certificate_number' => $certNumber,
            'qr_verification_token' => bin2hex(random_bytes(32)),
            'type' => 'completion',
            'training_type' => $attempt->trainingModule?->title ?? 'AI Scenario Training',
            'completion_date' => $evaluation->completed_at?->toDateString() ?? now()->toDateString(),
            'final_score' => $evaluation->percentage,
            'issued_at' => now(),
            'issued_by' => null,
        ]);

        $template->update(['last_used_at' => now()]);

        app(DatabaseBackupService::class)->queueAfterCommit('certificate_issued');

        if ($attempt->user) {
            $this->notificationFactory->certificateIssued($attempt->user, $certificate);
        }

        return $certificate;
    }

    public function issueForEventEvaluation(ParticipantEvaluation $participantEvaluation): ?Certificate
    {
        $participantEvaluation->loadMissing(['user', 'evaluation.simulationEvent']);

        if ($participantEvaluation->result !== 'passed' || ! $participantEvaluation->is_eligible_for_certification) {
            return null;
        }

        $user = $participantEvaluation->user;
        $event = $participantEvaluation->evaluation?->simulationEvent;

        if (! $user || ! $event) {
            return null;
        }

        $existing = Certificate::query()
            ->where('user_id', $user->id)
            ->where('simulation_event_id', $event->id)
            ->whereNull('revoked_at')
            ->first();

        if ($existing) {
            return $existing;
        }

        $template = CertificateTemplate::where('status', 'active')->first();

        if (! $template) {
            Log::warning('No active certificate template available for event evaluation pass.', [
                'participant_evaluation_id' => $participantEvaluation->id,
                'user_id' => $user->id,
            ]);

            return null;
        }

        $certNumber = $this->generateCertificateNumber();
        $snapshotBackgroundPath = $this->snapshotTemplateBackground($template, $certNumber);

        $certificate = Certificate::create([
            'user_id' => $user->id,
            'simulation_event_id' => $event->id,
            'participant_evaluation_id' => $participantEvaluation->id,
            'certificate_template_id' => $template->id,
            'template_background_path' => $snapshotBackgroundPath ?? $template->background_path,
            'template_background_opacity' => $template->background_opacity,
            'template_paper_size' => $template->paper_size,
            'template_content' => $template->getSnapshotContent(),
            'certificate_number' => $certNumber,
            'qr_verification_token' => bin2hex(random_bytes(32)),
            'type' => 'completion',
            'training_type' => $event->scenario?->title ?? $event->title ?? 'Disaster Preparedness Training',
            'completion_date' => $event->event_date ?? now()->toDateString(),
            'final_score' => $participantEvaluation->average_score,
            'issued_at' => now(),
            'issued_by' => null,
        ]);

        $template->update(['last_used_at' => now()]);
        app(DatabaseBackupService::class)->queueAfterCommit('certificate_issued');
        $this->notificationFactory->certificateIssued($user, $certificate);

        return $certificate;
    }

    public function maybeIssueAfterEventEvaluation(ParticipantEvaluation $participantEvaluation): ?Certificate
    {
        $autoIssue = filter_var(CertificationSetting::get('auto_issue_when_passed', '0'), FILTER_VALIDATE_BOOLEAN);

        if (! $autoIssue) {
            if ($participantEvaluation->user && $participantEvaluation->result === 'passed' && $participantEvaluation->is_eligible_for_certification) {
                $this->notificationFactory->certificateEligible($participantEvaluation->user, $participantEvaluation);
            }

            return null;
        }

        return $this->issueForEventEvaluation($participantEvaluation);
    }

    protected function generateCertificateNumber(): string
    {
        $year = date('Y');
        $seq = Certificate::whereYear('issued_at', $year)->count() + 1;

        return sprintf('CERT-%s-%05d', $year, $seq);
    }

    protected function snapshotTemplateBackground(CertificateTemplate $template, string $certNumber): ?string
    {
        if (! $template->background_path || ! Storage::disk('public')->exists($template->background_path)) {
            return null;
        }

        $ext = pathinfo($template->background_path, PATHINFO_EXTENSION) ?: 'png';
        $snapshotBackgroundPath = 'issued-certificates/backgrounds/'.$certNumber.'.'.$ext;

        if (Storage::disk('public')->exists($snapshotBackgroundPath)) {
            $snapshotBackgroundPath = 'issued-certificates/backgrounds/'.$certNumber.'-'.uniqid().'.'.$ext;
        }

        Storage::disk('public')->copy($template->background_path, $snapshotBackgroundPath);

        return $snapshotBackgroundPath;
    }
}
