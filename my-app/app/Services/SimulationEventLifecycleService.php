<?php

namespace App\Services;

use App\Models\SimulationEvent;
use Carbon\Carbon;

class SimulationEventLifecycleService
{
    public const EXECUTION_STEP_DEFINITIONS = [
        ['key' => 'pre_briefing', 'label' => 'Pre-Briefing'],
        ['key' => 'attendance_verification', 'label' => 'Attendance Verification'],
        ['key' => 'equipment_deployment', 'label' => 'Equipment Deployment'],
        ['key' => 'drill_started', 'label' => 'Drill Started'],
        ['key' => 'evacuation_completed', 'label' => 'Evacuation Completed'],
        ['key' => 'debriefing', 'label' => 'Debriefing'],
    ];

    public function buildPayload(SimulationEvent $event): array
    {
        $event->loadMissing([
            'assignedTrainer',
            'scenario.trainingModule',
            'registrations.user',
            'resources',
            'assignedResources.resource',
            'attendances.user',
        ]);

        $readiness = $this->buildReadinessChecklist($event);
        $executionProgress = $this->normalizeExecutionProgress($event);
        $timeline = $this->normalizeTimeline($event);
        $attendance = $this->buildAttendanceSummary($event);
        $resources = $this->buildResourceUtilization($event);

        return [
            'monitoring_status' => $this->resolveMonitoringStatus($event, $readiness),
            'readiness' => $readiness,
            'execution_progress' => $executionProgress,
            'execution_percent' => $this->executionPercent($executionProgress),
            'timeline_entries' => $timeline,
            'attendance_summary' => $attendance,
            'resource_utilization' => $resources,
            'post_evaluation' => $this->normalizePostEvaluation($event),
            'trainer' => $event->assignedTrainer ? [
                'id' => $event->assignedTrainer->id,
                'name' => $event->assignedTrainer->name,
                'email' => $event->assignedTrainer->email,
                'specialization' => $event->assignedTrainer->specialization,
            ] : null,
            'participants' => $event->registrations
                ->where('status', 'approved')
                ->map(fn ($registration) => [
                    'id' => $registration->user_id,
                    'name' => $registration->user?->name,
                    'email' => $registration->user?->email,
                    'status' => $registration->status,
                ])
                ->values()
                ->all(),
            'equipment' => $event->resources->map(fn ($resource) => [
                'id' => $resource->id,
                'name' => $resource->name,
                'quantity_needed' => (int) ($resource->pivot->quantity_needed ?? 0),
                'quantity_assigned' => (int) ($resource->pivot->quantity_assigned ?? 0),
                'status' => $resource->pivot->status ?? null,
            ])->values()->all(),
        ];
    }

    public function buildReadinessChecklist(SimulationEvent $event): array
    {
        $confirmations = $event->readiness_confirmations ?? [];

        $hasVenueData = filled($event->location) || filled($event->venue) || filled($event->building);
        $hasScheduleData = filled($event->event_date) && filled($event->start_time) && filled($event->end_time);
        $hasTrainer = (bool) $event->assigned_trainer_id;
        $hasParticipants = $event->relationLoaded('registrations')
            ? $event->registrations->where('status', 'approved')->count() > 0
            : $event->approvedRegistrations()->exists();
        $resourceCollection = $event->relationLoaded('resources')
            ? $event->resources
            : $event->resources()->get();
        $hasPlannedEquipment = $resourceCollection->isNotEmpty();
        $equipmentReady = ! $hasPlannedEquipment || $resourceCollection->every(function ($resource) {
            $needed = (int) ($resource->pivot->quantity_needed ?? 0);
            $assigned = (int) ($resource->pivot->quantity_assigned ?? 0);

            return $needed === 0 || $assigned >= $needed;
        });
        $hasScenario = (bool) $event->scenario_id;

        $items = [
            [
                'key' => 'trainer_assigned',
                'label' => 'Trainer Assigned',
                'completed' => $hasTrainer,
                'required' => true,
            ],
            [
                'key' => 'participants_registered',
                'label' => 'Participants Registered',
                'completed' => $hasParticipants,
                'required' => true,
            ],
            [
                'key' => 'equipment_assigned',
                'label' => 'Equipment Assigned',
                'completed' => $equipmentReady,
                'required' => $hasPlannedEquipment,
            ],
            [
                'key' => 'venue_confirmed',
                'label' => 'Venue Confirmed',
                'completed' => (bool) ($confirmations['venue_confirmed'] ?? false) || $hasVenueData,
                'required' => true,
            ],
            [
                'key' => 'schedule_confirmed',
                'label' => 'Schedule Confirmed',
                'completed' => (bool) ($confirmations['schedule_confirmed'] ?? false) || $hasScheduleData,
                'required' => true,
            ],
            [
                'key' => 'hazard_scenario_assigned',
                'label' => 'Hazard Scenario Assigned',
                'completed' => $hasScenario,
                'required' => true,
            ],
        ];

        $allComplete = collect($items)->every(fn (array $item) => ! $item['required'] || $item['completed']);

        return [
            'items' => $items,
            'all_complete' => $allComplete,
            'confirmations' => [
                'venue_confirmed' => (bool) ($confirmations['venue_confirmed'] ?? false),
                'schedule_confirmed' => (bool) ($confirmations['schedule_confirmed'] ?? false),
            ],
        ];
    }

    public function isReadyToStart(SimulationEvent $event): bool
    {
        return $this->buildReadinessChecklist($event)['all_complete'];
    }

    public function resolveMonitoringStatus(SimulationEvent $event, ?array $readiness = null): string
    {
        if ($event->status === 'cancelled') {
            return 'Cancelled';
        }

        if (in_array($event->status, ['completed', 'ended', 'archived'], true)) {
            return 'Completed';
        }

        if ($event->status === 'ongoing') {
            return 'Ongoing';
        }

        $readiness ??= $this->buildReadinessChecklist($event);

        if ($event->status === 'published' && $readiness['all_complete']) {
            return 'Ready';
        }

        return 'Scheduled';
    }

    public function initializeExecutionProgress(SimulationEvent $event): array
    {
        $steps = collect(self::EXECUTION_STEP_DEFINITIONS)->map(fn (array $step) => [
            'key' => $step['key'],
            'label' => $step['label'],
            'completed' => false,
            'completed_at' => null,
        ])->all();

        $event->update(['execution_progress' => $steps]);

        return $steps;
    }

    public function normalizeExecutionProgress(SimulationEvent $event): array
    {
        $stored = $event->execution_progress;

        if (! is_array($stored) || $stored === []) {
            return collect(self::EXECUTION_STEP_DEFINITIONS)->map(fn (array $step) => [
                'key' => $step['key'],
                'label' => $step['label'],
                'completed' => false,
                'completed_at' => null,
            ])->all();
        }

        $byKey = collect($stored)->keyBy('key');

        return collect(self::EXECUTION_STEP_DEFINITIONS)->map(function (array $definition) use ($byKey) {
            $existing = $byKey->get($definition['key'], []);

            return [
                'key' => $definition['key'],
                'label' => $definition['label'],
                'completed' => (bool) ($existing['completed'] ?? false),
                'completed_at' => $existing['completed_at'] ?? null,
            ];
        })->all();
    }

    public function completeExecutionStep(SimulationEvent $event, string $stepKey): array
    {
        $progress = $this->normalizeExecutionProgress($event);
        $found = false;

        foreach ($progress as &$step) {
            if ($step['key'] !== $stepKey) {
                continue;
            }

            $step['completed'] = true;
            $step['completed_at'] = now()->toIso8601String();
            $found = true;
            break;
        }
        unset($step);

        if (! $found) {
            abort(422, 'Invalid execution step.');
        }

        $event->update(['execution_progress' => $progress]);
        $this->appendTimelineEntry($event, $this->labelForStep($stepKey).' completed');

        return $progress;
    }

    public function appendTimelineEntry(SimulationEvent $event, string $label, ?Carbon $at = null): array
    {
        $at ??= now();
        $entries = $this->normalizeTimeline($event);
        $entries[] = [
            'time' => $at->format('H:i'),
            'label' => $label,
            'recorded_at' => $at->toIso8601String(),
        ];

        $event->update(['timeline_entries' => $entries]);

        return $entries;
    }

    public function normalizeTimeline(SimulationEvent $event): array
    {
        $entries = $event->timeline_entries;

        if (! is_array($entries)) {
            return [];
        }

        return collect($entries)
            ->filter(fn ($entry) => is_array($entry) && filled($entry['label'] ?? null))
            ->map(fn (array $entry) => [
                'time' => $entry['time'] ?? null,
                'label' => $entry['label'],
                'recorded_at' => $entry['recorded_at'] ?? null,
            ])
            ->sortBy(fn (array $entry) => $entry['recorded_at'] ?? $entry['time'])
            ->values()
            ->all();
    }

    public function buildAttendanceSummary(SimulationEvent $event): array
    {
        $registered = $event->relationLoaded('registrations')
            ? $event->registrations->where('status', 'approved')->count()
            : $event->approvedRegistrations()->count();

        $attendances = $event->relationLoaded('attendances')
            ? $event->attendances
            : $event->attendances()->get();

        $checkedIn = $attendances->whereIn('status', ['present', 'late', 'completed'])->count();
        $absent = $attendances->where('status', 'absent')->count();
        $late = $attendances->where('status', 'late')->count();
        $completionRate = $registered > 0
            ? round(($checkedIn / $registered) * 100, 1)
            : 0.0;

        return [
            'registered' => $registered,
            'checked_in' => $checkedIn,
            'absent' => $absent,
            'late' => $late,
            'completion_rate' => $completionRate,
        ];
    }

    public function buildResourceUtilization(SimulationEvent $event): array
    {
        $assignments = $event->relationLoaded('assignedResources')
            ? $event->assignedResources
            : $event->assignedResources()->with('resource')->get();

        $assignedCount = $assignments->sum('quantity_assigned');
        $usedCount = $assignments->where('status', 'Active')->sum('quantity_assigned');
        $returnedCount = $assignments->where('status', 'Returned')->sum('quantity_assigned');
        $damagedCount = $assignments->filter(function ($assignment) {
            return $assignment->resource && $assignment->resource->status === 'Damaged';
        })->sum('quantity_assigned');

        return [
            'equipment_assigned' => (int) $assignedCount,
            'equipment_used' => (int) $usedCount,
            'equipment_returned' => (int) $returnedCount,
            'equipment_damaged' => (int) $damagedCount,
        ];
    }

    public function normalizePostEvaluation(SimulationEvent $event): array
    {
        $data = $event->post_evaluation;

        if (! is_array($data)) {
            $data = [];
        }

        return [
            'overall_remarks' => $data['overall_remarks'] ?? '',
            'success_level' => $data['success_level'] ?? '',
            'problems_encountered' => $data['problems_encountered'] ?? '',
            'recommendations' => $data['recommendations'] ?? '',
            'lessons_learned' => $data['lessons_learned'] ?? '',
            'submitted_at' => $data['submitted_at'] ?? null,
        ];
    }

    public function executionPercent(array $progress): int
    {
        $total = count($progress);
        if ($total === 0) {
            return 0;
        }

        $completed = collect($progress)->where('completed', true)->count();

        return (int) round(($completed / $total) * 100);
    }

    protected function labelForStep(string $stepKey): string
    {
        foreach (self::EXECUTION_STEP_DEFINITIONS as $step) {
            if ($step['key'] === $stepKey) {
                return $step['label'];
            }
        }

        return ucwords(str_replace('_', ' ', $stepKey));
    }
}
