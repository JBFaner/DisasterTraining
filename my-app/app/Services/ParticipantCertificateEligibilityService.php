<?php

namespace App\Services;

use App\Models\Attendance;
use App\Models\Certificate;
use App\Models\CertificationSetting;
use App\Models\EvaluationResult;
use App\Models\EventRegistration;
use App\Models\LessonQuizConfig;
use App\Models\ParticipantEvaluation;
use App\Models\TrainingModule;
use App\Models\User;

class ParticipantCertificateEligibilityService
{
    public function __construct(
        private readonly CampaignRegistrationService $registrationService,
        private readonly TrainingModuleCardStatsService $moduleStatsService,
        private readonly LessonQuizProgressionService $lessonProgression,
        private readonly EvaluationScoringService $scoringService,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function buildFor(User $user): array
    {
        $userId = (int) $user->id;
        $passingScore = $this->scoringService->passingScore();
        $requireAttendance = filter_var(CertificationSetting::get('require_attendance', '1'), FILTER_VALIDATE_BOOLEAN);
        $eventAutoIssue = filter_var(CertificationSetting::get('auto_issue_when_passed', '0'), FILTER_VALIDATE_BOOLEAN);

        $registeredModuleIds = $this->registrationService->registeredModuleIdsFor($user);
        $modulesQuery = TrainingModule::query()
            ->withCount('contents as lesson_count')
            ->where('status', 'published')
            ->orderBy('title');

        if ($registeredModuleIds !== []) {
            $modulesQuery->whereIn('id', $registeredModuleIds);
        }

        $modules = $modulesQuery->get();
        $this->moduleStatsService->enrichParticipantModules($modules, $userId);

        $moduleIds = $modules->pluck('id')->map(fn ($id) => (int) $id)->all();

        $evaluationByModule = EvaluationResult::query()
            ->where('participant_id', $userId)
            ->when($moduleIds !== [], fn ($q) => $q->whereIn('training_module_id', $moduleIds))
            ->orderByDesc('completed_at')
            ->get()
            ->groupBy('training_module_id');

        $certificatesByModule = Certificate::query()
            ->where('user_id', $userId)
            ->whereNull('revoked_at')
            ->whereNotNull('training_module_id')
            ->when($moduleIds !== [], fn ($q) => $q->whereIn('training_module_id', $moduleIds))
            ->get()
            ->keyBy('training_module_id');

        $selfPaced = $modules->map(function (TrainingModule $module) use (
            $userId,
            $passingScore,
            $evaluationByModule,
            $certificatesByModule,
        ) {
            return $this->buildSelfPacedEntry(
                $module,
                $userId,
                $passingScore,
                $evaluationByModule->get($module->id, collect())->first(),
                $certificatesByModule->get($module->id),
            );
        })->values()->all();

        $eventBased = $this->buildEventBasedEntries($userId, $passingScore, $requireAttendance, $eventAutoIssue);

        $issuedCount = Certificate::query()
            ->where('user_id', $userId)
            ->whereNull('revoked_at')
            ->count();

        return [
            'passing_score' => $passingScore,
            'settings' => [
                'self_paced_auto_issue' => true,
                'event_requires_attendance' => $requireAttendance,
                'event_auto_issue' => $eventAutoIssue,
            ],
            'summary' => [
                'issued_count' => $issuedCount,
                'self_paced_eligible' => collect($selfPaced)->where('status', 'eligible')->count(),
                'self_paced_issued' => collect($selfPaced)->where('status', 'issued')->count(),
                'event_eligible' => collect($eventBased)->where('status', 'eligible')->count(),
                'event_issued' => collect($eventBased)->where('status', 'issued')->count(),
                'in_progress' => collect($selfPaced)->whereIn('status', ['in_progress', 'assessment_ready', 'assessment_failed'])->count(),
            ],
            'self_paced' => $selfPaced,
            'event_based' => $eventBased,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function buildSelfPacedEntry(
        TrainingModule $module,
        int $userId,
        float $passingScore,
        ?EvaluationResult $evaluation,
        ?Certificate $certificate,
    ): array {
        $module->loadMissing('contents');
        $lessonCount = (int) ($module->lesson_count ?? $module->contents->count());
        $progressPercent = (int) ($module->completion_percentage ?? 0);

        $hasQuizLessons = $module->contents->contains(
            fn ($content) => $this->lessonProgression->lessonHasPublishedQuiz((int) $content->id),
        );
        $lessonsComplete = $lessonCount > 0
            && $this->lessonProgression->participantHasPassedAllRequiredLessonQuizzes($module, $userId);

        $assessmentPassed = $evaluation?->status === EvaluationResult::STATUS_PASSED;
        $assessmentFailed = $evaluation?->status === EvaluationResult::STATUS_NEEDS_IMPROVEMENT;
        $hasCertificate = $certificate !== null;

        $requirements = [
            $this->requirement(
                'lessons',
                $hasQuizLessons
                    ? 'Complete all lessons and pass lesson quizzes'
                    : 'Complete all lessons',
                $lessonsComplete,
            ),
            $this->requirement(
                'ai_assessment',
                sprintf('Pass Final AI Scenario Assessment (%s%%+)', number_format($passingScore, 0)),
                $assessmentPassed,
            ),
            $this->requirement(
                'certificate',
                'Receive completion certificate',
                $hasCertificate,
            ),
        ];

        if ($hasCertificate) {
            $status = 'issued';
            $statusLabel = 'Certificate issued';
            $nextStep = 'Your self-paced completion certificate is ready to view or download.';
            $actionHref = route('participant.certificates.view', $certificate);
            $actionLabel = 'View certificate';
        } elseif ($assessmentPassed) {
            $status = 'eligible';
            $statusLabel = 'Eligible — certificate processing';
            $nextStep = 'You passed the assessment. Your certificate is issued automatically; refresh this page if it has not appeared yet.';
            $actionHref = '/participant/evaluations?tab=modules';
            $actionLabel = 'View assessment';
        } elseif ($assessmentFailed) {
            $status = 'assessment_failed';
            $statusLabel = 'Assessment not passed';
            $score = $evaluation?->percentage;
            $nextStep = $score !== null
                ? sprintf('Your score was %s%%. Retrain and pass the Final AI Scenario Assessment (%s%% required).', number_format((float) $score, 1), number_format($passingScore, 0))
                : sprintf('Pass the Final AI Scenario Assessment with at least %s%%.', number_format($passingScore, 0));
            $actionHref = "/participant/training-modules/{$module->id}";
            $actionLabel = 'Continue module';
        } elseif ($lessonsComplete) {
            $status = 'assessment_ready';
            $statusLabel = 'Ready for final assessment';
            $nextStep = 'All lessons are complete. Take the Final AI Scenario Assessment to earn your certificate.';
            $actionHref = "/participant/training-modules/{$module->id}";
            $actionLabel = 'Take assessment';
        } elseif ($progressPercent > 0) {
            $status = 'in_progress';
            $statusLabel = 'Training in progress';
            $nextStep = sprintf('You are %d%% through this module. Finish all lessons before the final assessment.', $progressPercent);
            $actionHref = "/participant/training-modules/{$module->id}";
            $actionLabel = 'Continue module';
        } else {
            $status = 'not_started';
            $statusLabel = 'Not started';
            $nextStep = 'Start the module and complete all lessons, then pass the Final AI Scenario Assessment.';
            $actionHref = "/participant/training-modules/{$module->id}";
            $actionLabel = 'Start module';
        }

        return [
            'training_module_id' => (int) $module->id,
            'title' => $module->title,
            'category' => $module->category,
            'progress_percent' => $progressPercent,
            'lesson_count' => $lessonCount,
            'requirements' => $requirements,
            'status' => $status,
            'status_label' => $statusLabel,
            'next_step' => $nextStep,
            'action_href' => $actionHref,
            'action_label' => $actionLabel,
            'certificate_id' => $certificate?->id,
            'assessment_score' => $evaluation?->percentage !== null ? (float) $evaluation->percentage : null,
            'path_type' => 'self_paced',
            'path_label' => 'Self-paced module',
        ];
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function buildEventBasedEntries(
        int $userId,
        float $passingScore,
        bool $requireAttendance,
        bool $eventAutoIssue,
    ): array {
        $registrations = EventRegistration::query()
            ->with(['simulationEvent', 'attendance'])
            ->where('user_id', $userId)
            ->whereIn('status', ['approved', 'pending'])
            ->orderByDesc('registered_at')
            ->get();

        $eventIds = $registrations->pluck('simulation_event_id')->filter()->map(fn ($id) => (int) $id)->unique()->all();

        $participantEvaluations = ParticipantEvaluation::query()
            ->with(['evaluation.simulationEvent', 'scores'])
            ->where('user_id', $userId)
            ->whereNotNull('submitted_at')
            ->when($eventIds !== [], function ($query) use ($eventIds) {
                $query->whereHas('evaluation', fn ($q) => $q->whereIn('simulation_event_id', $eventIds));
            })
            ->get()
            ->keyBy(fn (ParticipantEvaluation $pe) => (int) ($pe->evaluation?->simulation_event_id ?? 0));

        $certificatesByEvent = Certificate::query()
            ->where('user_id', $userId)
            ->whereNull('revoked_at')
            ->whereNotNull('simulation_event_id')
            ->when($eventIds !== [], fn ($q) => $q->whereIn('simulation_event_id', $eventIds))
            ->get()
            ->keyBy('simulation_event_id');

        $entries = [];

        foreach ($registrations as $registration) {
            $event = $registration->simulationEvent;
            if (! $event) {
                continue;
            }

            $eventId = (int) $event->id;
            $evaluation = $participantEvaluations->get($eventId);
            $certificate = $certificatesByEvent->get($eventId);
            $attendance = $registration->attendance
                ?? Attendance::query()
                    ->where('user_id', $userId)
                    ->where('simulation_event_id', $eventId)
                    ->first();

            $attendanceStatus = $attendance?->status ?? 'not_marked';
            $hasAttendance = in_array($attendanceStatus, ['present', 'completed', 'late'], true);
            $evaluationSubmitted = $evaluation !== null;
            $evaluationPassed = $evaluation?->result === 'passed';
            $evaluationFailed = $evaluation?->result === 'failed';
            $eligible = (bool) ($evaluation?->is_eligible_for_certification);
            $hasCertificate = $certificate !== null;

            $requirements = [
                $this->requirement(
                    'registration',
                    'Register and get approved for the event',
                    $registration->status === 'approved',
                ),
            ];

            if ($requireAttendance) {
                $requirements[] = $this->requirement(
                    'attendance',
                    'Attend the simulation event (marked present)',
                    $hasAttendance,
                );
            }

            $requirements[] = $this->requirement(
                'evaluation',
                sprintf('Pass event drill evaluation (%s%%+)', number_format($passingScore, 0)),
                $evaluationPassed,
            );
            $requirements[] = $this->requirement(
                'certificate',
                $eventAutoIssue
                    ? 'Certificate issued automatically when eligible'
                    : 'Certificate issued by your LGU trainer',
                $hasCertificate,
            );

            if ($hasCertificate) {
                $status = 'issued';
                $statusLabel = 'Certificate issued';
                $nextStep = 'Your event completion certificate is ready.';
                $actionHref = route('participant.certificates.view', $certificate);
                $actionLabel = 'View certificate';
            } elseif ($eligible && ! $hasCertificate) {
                $status = 'eligible';
                $statusLabel = 'Eligible — awaiting issuance';
                $nextStep = $eventAutoIssue
                    ? 'You met all requirements. Your certificate should be issued automatically; we will notify you when it is ready.'
                    : 'You met all requirements. Your LGU trainer will issue your certificate — we will notify you when it is ready.';
                $actionHref = "/participant/simulation-events/{$eventId}";
                $actionLabel = 'View event';
            } elseif ($evaluationFailed || ($evaluationSubmitted && ! $evaluationPassed)) {
                $status = 'not_eligible';
                $statusLabel = 'Not eligible';
                $score = $evaluation?->average_score;
                $nextStep = $score !== null
                    ? sprintf('Event evaluation score: %s%%. Certificate requires a passing drill evaluation.', number_format((float) $score, 1))
                    : 'You did not meet the passing score for this event evaluation.';
                $actionHref = '/participant/evaluations?tab=events';
                $actionLabel = 'View evaluation';
            } elseif ($evaluationSubmitted && $requireAttendance && ! $hasAttendance) {
                $status = 'not_eligible';
                $statusLabel = 'Attendance required';
                $nextStep = 'Evaluation was recorded, but attendance must be marked present before a certificate can be issued.';
                $actionHref = '/participant/my-attendance';
                $actionLabel = 'My attendance';
            } elseif ($registration->status === 'pending') {
                $status = 'pending_registration';
                $statusLabel = 'Registration pending';
                $nextStep = 'Wait for your registration to be approved, then attend the event on the scheduled date.';
                $actionHref = "/participant/simulation-events/{$eventId}";
                $actionLabel = 'View event';
            } elseif (! $evaluationSubmitted && in_array($event->status, ['completed', 'ended', 'archived'], true)) {
                $status = 'awaiting_evaluation';
                $statusLabel = 'Awaiting evaluation';
                $nextStep = 'The event has ended. Your trainer will submit drill evaluations soon.';
                $actionHref = "/participant/simulation-events/{$eventId}";
                $actionLabel = 'View event';
            } elseif (! $hasAttendance && in_array($event->status, ['ongoing', 'published'], true)) {
                $status = 'awaiting_event';
                $statusLabel = 'Awaiting event day';
                $nextStep = 'Attend the simulation event on the scheduled date so your trainer can mark attendance and evaluate your performance.';
                $actionHref = "/participant/simulation-events/{$eventId}";
                $actionLabel = 'View event';
            } else {
                $status = 'in_progress';
                $statusLabel = 'Registered';
                $nextStep = 'Attend the event and complete the drill evaluation to become eligible for a certificate.';
                $actionHref = "/participant/simulation-events/{$eventId}";
                $actionLabel = 'View event';
            }

            $entries[] = [
                'simulation_event_id' => $eventId,
                'title' => $event->title,
                'event_date' => $event->event_date?->toDateString(),
                'event_status' => $event->status,
                'registration_status' => $registration->status,
                'attendance_status' => $attendanceStatus,
                'requirements' => $requirements,
                'status' => $status,
                'status_label' => $statusLabel,
                'next_step' => $nextStep,
                'action_href' => $actionHref,
                'action_label' => $actionLabel,
                'certificate_id' => $certificate?->id,
                'evaluation_score' => $evaluation?->average_score !== null ? (float) $evaluation->average_score : null,
                'path_type' => 'event',
                'path_label' => 'Simulation event',
            ];
        }

        return $entries;
    }

    /**
     * @return array{key: string, label: string, met: bool}
     */
    private function requirement(string $key, string $label, bool $met): array
    {
        return [
            'key' => $key,
            'label' => $label,
            'met' => $met,
        ];
    }
}
