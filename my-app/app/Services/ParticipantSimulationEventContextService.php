<?php

namespace App\Services;

use App\Models\Evaluation;
use App\Models\EventRegistration;
use App\Models\ParticipantEvaluation;
use App\Models\SimulationEvent;
use App\Models\User;
use Carbon\Carbon;

class ParticipantSimulationEventContextService
{
    public function buildForParticipant(User $user, SimulationEvent $event): array
    {
        $registration = EventRegistration::query()
            ->where('simulation_event_id', $event->id)
            ->where('user_id', $user->id)
            ->where('status', 'approved')
            ->with('attendance')
            ->first();

        $attendance = $registration?->attendance;

        $participantEvaluation = ParticipantEvaluation::query()
            ->where('user_id', $user->id)
            ->whereNotNull('submitted_at')
            ->whereHas('evaluation', fn ($query) => $query->where('simulation_event_id', $event->id))
            ->first();

        $eventEvaluation = Evaluation::query()
            ->where('simulation_event_id', $event->id)
            ->first();

        $evaluation = $this->buildEvaluationContext($event, $participantEvaluation, $eventEvaluation);

        return [
            'maps_url' => $this->mapsUrl($event),
            'calendar_url' => route('participant.simulation-events.calendar', $event),
            'check_in' => $this->buildCheckInContext($event, $registration, $attendance),
            'attendance' => $attendance ? [
                'status' => $attendance->status,
                'checked_in_at' => $attendance->checked_in_at?->toIso8601String(),
                'check_in_method' => $attendance->check_in_method,
            ] : null,
            'evaluation' => $evaluation,
            'is_registered_approved' => $registration !== null,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function buildCheckInContext(
        SimulationEvent $event,
        ?EventRegistration $registration,
        $attendance,
    ): array {
        $checkedIn = $attendance && in_array($attendance->status, ['present', 'late'], true);

        return [
            'enabled' => (bool) $event->qr_code_enabled,
            'available' => $registration !== null
                && (bool) $event->qr_code_enabled
                && ! $checkedIn
                && $this->isCheckInWindowOpen($event),
            'checked_in' => $checkedIn,
            'window_open' => $this->isCheckInWindowOpen($event),
            'requires_code' => filled($event->attendance_code),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function buildEvaluationContext(
        SimulationEvent $event,
        ?ParticipantEvaluation $participantEvaluation,
        ?Evaluation $eventEvaluation,
    ): array {
        if ($participantEvaluation) {
            return [
                'state' => 'ready',
                'title' => 'Your evaluation is ready',
                'description' => 'View your event drill scores and feedback.',
                'view_url' => route('participant.event-evaluations.show', $participantEvaluation),
            ];
        }

        if ($eventEvaluation && in_array($event->status, ['ongoing', 'ended', 'completed'], true)) {
            return [
                'state' => 'pending',
                'title' => 'Evaluation in progress',
                'description' => 'Your facilitator is recording drill scores. Check back here or under Evaluation Results.',
                'view_url' => '/participant/evaluations?tab=events',
            ];
        }

        if (in_array($event->status, ['ended', 'completed'], true)) {
            return [
                'state' => 'none',
                'title' => 'No evaluation posted yet',
                'description' => 'If you attended this drill, your evaluation will appear here once your facilitator submits scores.',
                'view_url' => '/participant/evaluations?tab=events',
            ];
        }

        return [
            'state' => 'upcoming',
            'title' => 'Evaluation after the drill',
            'description' => 'Event drill evaluations appear here once the exercise is complete.',
            'view_url' => null,
        ];
    }

    public function isCheckInWindowOpen(SimulationEvent $event): bool
    {
        if ($event->status === 'ongoing') {
            return true;
        }

        if (! in_array($event->status, ['published', 'ongoing'], true)) {
            return false;
        }

        if (! $event->event_date) {
            return false;
        }

        $eventDate = $event->event_date instanceof Carbon
            ? $event->event_date->copy()->startOfDay()
            : Carbon::parse($event->event_date)->startOfDay();

        $today = now()->startOfDay();

        return $eventDate->equalTo($today) || $eventDate->equalTo($today->copy()->subDay());
    }

    public function mapsUrl(SimulationEvent $event): ?string
    {
        $query = array_filter([
            $event->location,
            $event->building,
            $event->room_zone,
            $event->venue,
        ]);

        if ($query === []) {
            return null;
        }

        return 'https://www.google.com/maps/search/?api=1&query='.urlencode(implode(', ', $query));
    }
}
