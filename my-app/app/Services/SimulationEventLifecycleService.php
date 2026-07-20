<?php

namespace App\Services;

use App\Models\CampaignRequest;
use App\Models\SimulationEvent;
use Carbon\Carbon;

class SimulationEventLifecycleService
{
    public function __construct(
        protected SimulationEventPlanningService $planningService,
    ) {}
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
            'simulationExerciseTemplate.personnel.qualifiedTrainer',
            'simulationExerciseTemplate.personnelAssignments.qualifiedTrainer',
        ]);

        $readiness = $this->buildReadinessChecklist($event);
        $executionProgress = $this->normalizeExecutionProgress($event);
        $timeline = $this->normalizeTimeline($event);
        $attendance = $this->buildAttendanceSummary($event);
        $resources = $this->buildResourceUtilization($event);
        $template = $event->simulationExerciseTemplate;
        $evaluationMode = $this->resolveEvaluationMode($event);
        $personnelRoster = $this->buildPersonnelRoster($event);

        return [
            'monitoring_status' => $this->resolveMonitoringStatus($event, $readiness),
            'readiness' => $readiness,
            'execution_progress' => $executionProgress,
            'execution_percent' => $this->executionPercent($executionProgress),
            'timeline_entries' => $timeline,
            'attendance_summary' => $attendance,
            'resource_utilization' => $resources,
            'post_evaluation' => $this->normalizePostEvaluation($event),
            'evaluation_mode' => $evaluationMode,
            'evaluation_mode_label' => $evaluationMode === 'individual'
                ? 'Individual (per participant)'
                : 'Team / overall',
            'personnel_roster' => $personnelRoster,
            'exercise_plan' => $template ? [
                'id' => $template->id,
                'title' => $template->title,
                'category' => $template->category,
                'exercise_type' => $template->exercise_type,
                'evaluation_mode' => $evaluationMode,
            ] : null,
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

    public function resolveEvaluationMode(SimulationEvent $event): string
    {
        $template = $event->simulationExerciseTemplate;
        if (! $template) {
            return 'team';
        }

        return app(SimulationExerciseTemplateService::class)->resolveEvaluationMode($template);
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function buildPersonnelRoster(SimulationEvent $event): array
    {
        $template = $event->simulationExerciseTemplate;
        if (! $template) {
            return [];
        }

        $template->loadMissing(['personnel.qualifiedTrainer', 'personnelAssignments.qualifiedTrainer']);

        $sourceLabels = [
            'group6_trainers' => 'Users & Roles / Trainers',
            'lgu_staff' => 'Users & Roles / Staff',
            'group3_personnel' => 'Group 3 — Resource Allocation',
            'group5_medical' => 'Group 5 — Medical & Safety',
        ];

        $assignmentsByRole = $template->personnelAssignments
            ->groupBy(fn ($item) => trim((string) $item->role));

        $rows = [];

        foreach ($template->personnel->sortBy('sort_order')->values() as $roleRow) {
            $role = trim((string) $roleRow->role);
            if ($role === '') {
                continue;
            }

            $roleAssignments = $assignmentsByRole->get($role, collect());
            if ($roleAssignments->isEmpty() && $roleRow->qualified_trainer_id) {
                $rows[] = [
                    'role' => $role,
                    'person_name' => $roleRow->qualifiedTrainer?->name,
                    'source_group' => 'group6_trainers',
                    'source_label' => $sourceLabels['group6_trainers'],
                    'recommended_count' => (int) ($roleRow->recommended_count ?? 1),
                    'notes' => $roleRow->notes,
                    'assigned' => true,
                ];
                continue;
            }

            if ($roleAssignments->isEmpty()) {
                $rows[] = [
                    'role' => $role,
                    'person_name' => null,
                    'source_group' => null,
                    'source_label' => '—',
                    'recommended_count' => (int) ($roleRow->recommended_count ?? 1),
                    'notes' => $roleRow->notes,
                    'assigned' => false,
                ];
                continue;
            }

            foreach ($roleAssignments as $assignment) {
                $source = (string) ($assignment->source_group ?? '');
                $rows[] = [
                    'role' => $role,
                    'person_name' => $assignment->person_name
                        ?: $assignment->qualifiedTrainer?->name,
                    'source_group' => $source ?: null,
                    'source_label' => $sourceLabels[$source] ?? ($source !== '' ? $source : '—'),
                    'recommended_count' => (int) ($roleRow->recommended_count ?? 1),
                    'notes' => $assignment->notes ?: $roleRow->notes,
                    'assigned' => filled($assignment->person_name)
                        || (bool) $assignment->qualified_trainer_id
                        || filled($assignment->person_external_id),
                ];
            }
        }

        // Orphan assignments whose role was removed from recommended personnel.
        foreach ($template->personnelAssignments as $assignment) {
            $role = trim((string) $assignment->role);
            $alreadyListed = collect($rows)->contains(
                fn (array $row) => $row['role'] === $role
                    && ($row['person_name'] ?? null) === ($assignment->person_name ?: $assignment->qualifiedTrainer?->name)
            );
            if ($alreadyListed) {
                continue;
            }

            $source = (string) ($assignment->source_group ?? '');
            $rows[] = [
                'role' => $role !== '' ? $role : 'Assigned Personnel',
                'person_name' => $assignment->person_name ?: $assignment->qualifiedTrainer?->name,
                'source_group' => $source ?: null,
                'source_label' => $sourceLabels[$source] ?? ($source !== '' ? $source : '—'),
                'recommended_count' => 1,
                'notes' => $assignment->notes,
                'assigned' => true,
            ];
        }

        return array_values($rows);
    }

    public function buildReadinessChecklist(SimulationEvent $event): array
    {
        $confirmations = $event->readiness_confirmations ?? [];
        $isCampaignEvent = (bool) $event->campaign_request_id;

        if ($isCampaignEvent && $event->training_module_id) {
            $this->planningService->syncQualifiedParticipantsToEvent($event);
            $event->unsetRelation('registrations');
            $event->load('registrations');
        }

        $hasVenueData = filled($event->location) || filled($event->venue) || filled($event->building);
        $hasScheduleData = filled($event->event_date) && filled($event->start_time) && filled($event->end_time);
        $hasTrainer = (bool) $event->assigned_trainer_id;
        $approvedRegistrationCount = $event->relationLoaded('registrations')
            ? $event->registrations->where('status', 'approved')->count()
            : $event->approvedRegistrations()->count();

        if ($isCampaignEvent) {
            $campaign = $event->relationLoaded('campaignRequest')
                ? $event->campaignRequest
                : CampaignRequest::query()->find($event->campaign_request_id);
            $minimum = (int) ($campaign?->minimum_qualified_participants ?? 0);
            $hasParticipants = $minimum > 0
                ? $approvedRegistrationCount >= $minimum
                : $approvedRegistrationCount > 0;
        } else {
            $hasParticipants = $approvedRegistrationCount > 0;
        }
        $resourceCollection = $event->relationLoaded('resources')
            ? $event->resources
            : $event->resources()->get();
        $hasPlannedEquipment = $resourceCollection->isNotEmpty();
        $equipmentReady = ! $hasPlannedEquipment || $resourceCollection->every(function ($resource) {
            $needed = (int) ($resource->pivot->quantity_needed ?? 0);
            $assigned = (int) ($resource->pivot->quantity_assigned ?? 0);

            return $needed === 0 || $assigned >= $needed;
        });
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
                'automatic' => $isCampaignEvent,
                'detail' => $isCampaignEvent
                    ? sprintf(
                        '%d qualified participant%s auto-registered from completed training',
                        $approvedRegistrationCount,
                        $approvedRegistrationCount === 1 ? '' : 's',
                    )
                    : null,
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
