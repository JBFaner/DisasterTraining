<?php

namespace App\Services;

use App\Models\Certificate;
use App\Models\EvaluationResult;
use App\Models\Attendance;
use App\Models\ParticipantEvaluation;
use App\Models\PortalNotification;
use App\Models\SimulationEvent;
use App\Models\User;
use Illuminate\Support\Collection;

class PortalNotificationFactory
{
    public function __construct(
        private readonly PortalNotificationService $notificationService,
    ) {}

    public function registrationApproved(User $participant, SimulationEvent $event): ?PortalNotification
    {
        return $this->notificationService->notify($participant, [
            'type' => PortalNotification::TYPE_REGISTRATION_APPROVED,
            'icon' => '✅',
            'title' => 'Event Registration Approved',
            'body' => "Your registration for \"{$event->title}\" has been approved.",
            'action_label' => 'View Event',
            'action_url' => route('participant.simulation-events.show', $event),
            'metadata' => [
                'simulation_event_id' => $event->id,
            ],
        ]);
    }

    public function registrationRejected(User $participant, SimulationEvent $event, string $reason): ?PortalNotification
    {
        return $this->notificationService->notify($participant, [
            'type' => PortalNotification::TYPE_REGISTRATION_REJECTED,
            'icon' => '❌',
            'title' => 'Event Registration Declined',
            'body' => "Your registration for \"{$event->title}\" was not approved.\n\nReason: {$reason}",
            'action_label' => 'Browse Events',
            'action_url' => route('participant.simulation-events.index'),
            'metadata' => [
                'simulation_event_id' => $event->id,
                'rejection_reason' => $reason,
            ],
        ]);
    }

    public function registrationSubmitted(User $participant, SimulationEvent $event): ?PortalNotification
    {
        return $this->notificationService->notify($participant, [
            'type' => PortalNotification::TYPE_REGISTRATION_SUBMITTED,
            'icon' => '⏳',
            'title' => 'Registration Submitted',
            'body' => "Your registration for \"{$event->title}\" is pending admin approval.",
            'action_label' => 'View Event',
            'action_url' => route('participant.simulation-events.show', $event),
            'metadata' => [
                'simulation_event_id' => $event->id,
            ],
        ]);
    }

    /**
     * @return Collection<int, PortalNotification>
     */
    public function eventCancelled(SimulationEvent $event): Collection
    {
        $event->loadMissing(['registrations.user']);

        $notifications = collect();

        foreach ($event->registrations as $registration) {
            if (! in_array($registration->status, ['approved', 'pending'], true)) {
                continue;
            }

            $participant = $registration->user;
            if (! $participant) {
                continue;
            }

            $notifications->push($this->notificationService->notify($participant, [
                'type' => PortalNotification::TYPE_EVENT_CANCELLED,
                'icon' => '🚫',
                'title' => 'Simulation Event Cancelled',
                'body' => "The event \"{$event->title}\" has been cancelled. Your registration is no longer active.",
                'action_label' => 'Browse Events',
                'action_url' => route('participant.simulation-events.index'),
                'metadata' => [
                    'simulation_event_id' => $event->id,
                ],
            ]));
        }

        return $notifications;
    }

    public function certificateIssued(User $participant, Certificate $certificate): ?PortalNotification
    {
        $certificate->loadMissing(['simulationEvent', 'trainingModule']);

        $trainingLabel = $certificate->training_type
            ?? $certificate->simulationEvent?->title
            ?? $certificate->trainingModule?->title
            ?? 'Disaster Preparedness Training';

        return $this->notificationService->notify($participant, [
            'type' => PortalNotification::TYPE_CERTIFICATE_ISSUED,
            'icon' => '🏅',
            'title' => 'Certificate Issued',
            'body' => "Your certificate for \"{$trainingLabel}\" is ready to view.",
            'action_label' => 'View Certificate',
            'action_url' => route('participant.certificates.view', $certificate),
            'metadata' => [
                'certificate_id' => $certificate->id,
                'simulation_event_id' => $certificate->simulation_event_id,
                'training_module_id' => $certificate->training_module_id,
            ],
        ]);
    }

    public function evaluationRecorded(User $participant, ParticipantEvaluation $participantEvaluation): ?PortalNotification
    {
        $participantEvaluation->loadMissing(['evaluation.simulationEvent']);
        $event = $participantEvaluation->evaluation?->simulationEvent;
        $eventTitle = $event?->title ?? 'Simulation Event';
        $passed = $participantEvaluation->result === 'passed';
        $score = $participantEvaluation->average_score !== null
            ? number_format((float) $participantEvaluation->average_score, 1).'%'
            : null;

        $body = $passed
            ? "Your drill evaluation for \"{$eventTitle}\" is complete. You passed"
            : "Your drill evaluation for \"{$eventTitle}\" is complete.";

        if ($score) {
            $body .= " with a score of {$score}.";
        } else {
            $body .= '.';
        }

        return $this->notificationService->notify($participant, [
            'type' => PortalNotification::TYPE_EVALUATION_RECORDED,
            'icon' => $passed ? '🎯' : '📋',
            'title' => $passed ? 'Drill Evaluation Passed' : 'Drill Evaluation Recorded',
            'body' => $body,
            'action_label' => 'View Report',
            'action_url' => route('participant.event-evaluations.show', $participantEvaluation),
            'metadata' => [
                'participant_evaluation_id' => $participantEvaluation->id,
                'simulation_event_id' => $event?->id,
                'result' => $participantEvaluation->result,
            ],
        ]);
    }

    public function assessmentCompleted(User $participant, EvaluationResult $evaluationResult): ?PortalNotification
    {
        $evaluationResult->loadMissing(['trainingModule']);
        $moduleTitle = $evaluationResult->trainingModule?->title ?? 'Training Module';
        $passed = $evaluationResult->status === EvaluationResult::STATUS_PASSED;
        $percentage = number_format((float) ($evaluationResult->percentage ?? 0), 1);

        return $this->notificationService->notify($participant, [
            'type' => PortalNotification::TYPE_ASSESSMENT_COMPLETED,
            'icon' => $passed ? '🎉' : '📝',
            'title' => $passed ? 'Assessment Passed' : 'Assessment Completed',
            'body' => $passed
                ? "You passed the AI scenario assessment for \"{$moduleTitle}\" with {$percentage}%."
                : "Your AI scenario assessment for \"{$moduleTitle}\" is complete. Score: {$percentage}%.",
            'action_label' => 'View Results',
            'action_url' => route('participant.evaluation-results.show', $evaluationResult),
            'metadata' => [
                'evaluation_result_id' => $evaluationResult->id,
                'training_module_id' => $evaluationResult->training_module_id,
                'passed' => $passed,
            ],
        ]);
    }

    /**
     * @return Collection<int, PortalNotification>
     */
    public function registrationPending(SimulationEvent $event, User $participant): Collection
    {
        $recipients = $this->registrationReviewRecipients($event);
        $notifications = collect();

        foreach ($recipients as $recipient) {
            $notifications->push($this->notificationService->notify($recipient, [
                'type' => PortalNotification::TYPE_REGISTRATION_PENDING,
                'icon' => '📝',
                'title' => 'New Event Registration',
                'body' => "{$participant->name} registered for \"{$event->title}\" and is awaiting approval.",
                'action_label' => 'Review Registrations',
                'action_url' => route('admin.simulation-events.registrations', $event),
                'metadata' => [
                    'simulation_event_id' => $event->id,
                    'participant_id' => $participant->id,
                ],
            ]));
        }

        return $notifications;
    }

    public function attendanceMarked(User $participant, Attendance $attendance): ?PortalNotification
    {
        $attendance->loadMissing(['simulationEvent']);
        $event = $attendance->simulationEvent;
        $eventTitle = $event?->title ?? 'Simulation Event';
        $statusLabel = $attendance->status === 'late' ? 'late' : 'present';

        return $this->notificationService->notify($participant, [
            'type' => PortalNotification::TYPE_ATTENDANCE_MARKED,
            'icon' => '✔️',
            'title' => 'Attendance Recorded',
            'body' => "You were marked {$statusLabel} for \"{$eventTitle}\".",
            'action_label' => 'View My Attendance',
            'action_url' => route('participant.my-attendance.index'),
            'metadata' => [
                'attendance_id' => $attendance->id,
                'simulation_event_id' => $event?->id,
                'status' => $attendance->status,
            ],
        ]);
    }

    public function certificateRevoked(User $participant, Certificate $certificate, ?string $reason = null): ?PortalNotification
    {
        $certificate->loadMissing(['simulationEvent', 'trainingModule']);

        $trainingLabel = $certificate->training_type
            ?? $certificate->simulationEvent?->title
            ?? $certificate->trainingModule?->title
            ?? 'Disaster Preparedness Training';

        $body = "Your certificate for \"{$trainingLabel}\" has been revoked.";
        if ($reason) {
            $body .= "\n\nReason: {$reason}";
        }

        return $this->notificationService->notify($participant, [
            'type' => PortalNotification::TYPE_CERTIFICATE_REVOKED,
            'icon' => '⚠️',
            'title' => 'Certificate Revoked',
            'body' => $body,
            'action_label' => 'View Certification',
            'action_url' => route('participant.certification.index'),
            'metadata' => [
                'certificate_id' => $certificate->id,
                'revoke_reason' => $reason,
            ],
        ]);
    }

    /**
     * @return Collection<int, User>
     */
    private function registrationReviewRecipients(SimulationEvent $event): Collection
    {
        $recipientIds = collect([$event->created_by])
            ->filter()
            ->unique()
            ->values();

        if ($recipientIds->isEmpty()) {
            return User::query()
                ->whereIn('role', ['LGU_ADMIN', 'LGU_TRAINER'])
                ->where('status', 'active')
                ->limit(5)
                ->get();
        }

        return User::query()
            ->whereIn('id', $recipientIds)
            ->whereIn('role', ['LGU_ADMIN', 'LGU_TRAINER'])
            ->where('status', 'active')
            ->get();
    }
}
