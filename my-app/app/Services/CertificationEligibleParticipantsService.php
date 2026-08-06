<?php

namespace App\Services;

use App\Models\Certificate;
use App\Models\SimulationEvent;

class CertificationEligibleParticipantsService
{
    /**
     * @return array<int, array<string, mixed>>
     */
    public function build(
        ?string $eventIdFilter = null,
        ?string $statusFilter = null,
        ?string $dateFrom = null,
        ?string $dateTo = null,
        ?string $moduleIdFilter = null,
    ): array {
        $events = SimulationEvent::whereIn('status', ['published', 'ongoing', 'completed'])
            ->whereHas('evaluation')
            ->with([
                'trainingModule:id,title,category',
                'evaluation.participantEvaluations' => function ($q) {
                    $q->whereHas('scores')->with(['user', 'attendance']);
                },
            ])
            ->when($eventIdFilter, fn ($q) => $q->where('id', $eventIdFilter))
            ->when($moduleIdFilter, fn ($q) => $q->where('training_module_id', $moduleIdFilter))
            ->when($dateFrom, fn ($q) => $q->whereDate('event_date', '>=', $dateFrom))
            ->when($dateTo, fn ($q) => $q->whereDate('event_date', '<=', $dateTo))
            ->orderByDesc('event_date')
            ->get();

        $list = [];
        foreach ($events as $event) {
            $evaluation = $event->evaluation;
            if (! $evaluation) {
                continue;
            }

            $approvedRegistrations = $event->registrations()
                ->where('status', 'approved')
                ->with(['user', 'attendance'])
                ->get();

            foreach ($approvedRegistrations as $reg) {
                $pe = $evaluation->participantEvaluations->firstWhere('user_id', $reg->user_id);
                $attendance = $reg->attendance;
                $attendanceStatus = $attendance ? $attendance->status : 'not_marked';
                $hasAttendance = in_array($attendanceStatus, ['present', 'completed', 'late'], true);

                if ($pe && $pe->scores->isNotEmpty()) {
                    $avg = (float) ($pe->average_score ?? 0);
                    $passed = $avg >= 75.0;
                    $certStatus = ($passed && $hasAttendance) ? 'eligible' : 'not_eligible';
                } else {
                    $certStatus = 'pending';
                    $pe = null;
                }

                if ($statusFilter && $certStatus !== $statusFilter) {
                    continue;
                }

                $existingCert = Certificate::where('user_id', $reg->user_id)
                    ->where('simulation_event_id', $event->id)
                    ->whereNull('revoked_at')
                    ->first();

                $list[] = [
                    'user_id' => $reg->user_id,
                    'user_name' => $reg->user->name ?? 'N/A',
                    'user_email' => $reg->user->email ?? '',
                    'event_id' => $event->id,
                    'event_title' => $event->title,
                    'event_date' => $event->event_date,
                    'training_module_id' => $event->training_module_id,
                    'training_module_title' => $event->trainingModule?->title,
                    'score' => $pe ? round((float) $pe->average_score, 2) : null,
                    'attendance_status' => $attendanceStatus,
                    'cert_status' => $certStatus,
                    'participant_evaluation_id' => $pe?->id,
                    'certificate_issued' => $existingCert !== null,
                    'certificate_id' => $existingCert?->id,
                ];
            }
        }

        return $list;
    }

    public function countPendingIssuance(): int
    {
        return collect($this->build(null, 'eligible'))
            ->where('cert_status', 'eligible')
            ->where('certificate_issued', false)
            ->count();
    }
}
