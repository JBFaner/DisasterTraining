<?php

namespace App\Services;

use App\Models\CampaignRequest;
use App\Models\QualifiedTrainer;
use App\Models\Resource;
use App\Models\Scenario;
use App\Models\SimulationEvent;
use App\Models\SimulationExerciseActivity;
use App\Models\SimulationExerciseActivityEquipment;
use App\Models\SimulationExerciseEvaluationObjective;
use App\Models\SimulationExercisePersonnel;
use App\Models\SimulationExercisePersonnelAssignment;
use App\Models\SimulationExerciseTemplate;
use App\Models\SimulationExerciseTimelineItem;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class SimulationExerciseTemplateService
{
    /**
     * @return Collection<int, array<string, mixed>>
     */
    public function listForDashboard(?string $status = null): Collection
    {
        return SimulationExerciseTemplate::query()
            ->withCount(['activities', 'events'])
            ->when($status, fn ($query) => $query->where('status', $status))
            ->orderByDesc('updated_at')
            ->get()
            ->map(fn (SimulationExerciseTemplate $template) => $this->serializeListItem($template));
    }

    /**
     * @return array<string, mixed>
     */
    public function serializeListItem(SimulationExerciseTemplate $template): array
    {
        return [
            'id' => $template->id,
            'title' => $template->title,
            'category' => $template->category,
            'exercise_type' => $template->exercise_type,
            'difficulty_level' => $template->difficulty_level,
            'estimated_duration_minutes' => $template->estimated_duration_minutes,
            'status' => $template->status,
            'activities_count' => (int) ($template->activities_count ?? $template->activities()->count()),
            'events_count' => (int) ($template->events_count ?? $template->events()->count()),
            'updated_at' => $template->updated_at?->toIso8601String(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function serializeDetail(SimulationExerciseTemplate $template): array
    {
        $template->load([
            'activities.equipment.resource',
            'activities.evaluationObjectives',
            'equipment.resource',
            'personnel.qualifiedTrainer',
            'personnel.qualifiedTrainer',
            'personnelAssignments.qualifiedTrainer',
            'timelineItems.activity',
            'evaluationObjectives.activity',
            'createdBy',
            'updatedBy',
        ]);

        $resources = Resource::query()->orderBy('name')->get(['id', 'name', 'category', 'available', 'quantity', 'status']);

        return [
            'template' => [
                'id' => $template->id,
                'title' => $template->title,
                'category' => $template->category,
                'exercise_type' => $template->exercise_type,
                'difficulty_level' => $template->difficulty_level,
                'estimated_duration_minutes' => $template->estimated_duration_minutes,
                'objectives' => $template->objectives,
                'scenario_summary' => $template->scenario_summary,
                'expected_hazards' => $template->expected_hazards,
                'learning_objectives' => $template->learning_objectives,
                'safety_reminders' => $template->safety_reminders,
                'status' => $template->status,
                'activities_count' => $template->activities->count(),
                'events_count' => $template->events()->count(),
                'updated_at' => $template->updated_at?->toIso8601String(),
            ],
            'activities' => $template->activities->map(function (SimulationExerciseActivity $activity) use ($template) {
                $timelineTime = $template->timelineItems
                    ->firstWhere('activity_id', $activity->id)
                    ?->start_time;

                return [
                'id' => $activity->id,
                'title' => $activity->title,
                'description' => $activity->description,
                'duration_minutes' => $activity->duration_minutes,
                'start_time' => $activity->start_time ?? $timelineTime,
                'sort_order' => $activity->sort_order,
                'equipment' => $activity->equipment->map(fn ($item) => $this->serializeEquipment($item))->values()->all(),
                'evaluation_objectives' => $activity->evaluationObjectives->map(fn ($item) => [
                    'id' => $item->id,
                    'heading' => $item->heading,
                    'objective_text' => $item->objective_text,
                    'sort_order' => $item->sort_order,
                ])->values()->all(),
            ];
            })->values()->all(),
            'equipment' => $template->equipment->map(fn ($item) => $this->serializeEquipment($item))->values()->all(),
            'personnel' => $template->personnel->map(fn (SimulationExercisePersonnel $item) => [
                'id' => $item->id,
                'role' => $item->role,
                'recommended_count' => $item->recommended_count,
                'notes' => $item->notes,
                'sort_order' => $item->sort_order,
            ])->values()->all(),
            'personnel_assignments' => $this->serializePersonnelAssignments($template),
            'personnel_pool' => $this->buildPersonnelPool(),
            'timeline_items' => $template->timelineItems->map(fn (SimulationExerciseTimelineItem $item) => [
                'id' => $item->id,
                'start_time' => $item->start_time,
                'label' => $item->label,
                'description' => $item->description,
                'activity_id' => $item->activity_id,
                'activity_title' => $item->activity?->title,
                'sort_order' => $item->sort_order,
            ])->values()->all(),
            'evaluation_objectives' => $template->evaluationObjectives->map(fn (SimulationExerciseEvaluationObjective $item) => [
                'id' => $item->id,
                'activity_id' => $item->activity_id,
                'activity_title' => $item->activity?->title,
                'heading' => $item->heading,
                'objective_text' => $item->objective_text,
                'sort_order' => $item->sort_order,
            ])->values()->all(),
            'options' => [
                'categories' => SimulationExerciseTemplate::CATEGORIES,
                'exercise_types' => SimulationExerciseTemplate::EXERCISE_TYPES,
                'difficulty_levels' => SimulationExerciseTemplate::DIFFICULTY_LEVELS,
                'personnel_roles' => SimulationExerciseTemplate::PERSONNEL_ROLES,
                'statuses' => [
                    SimulationExerciseTemplate::STATUS_DRAFT,
                    SimulationExerciseTemplate::STATUS_PUBLISHED,
                    SimulationExerciseTemplate::STATUS_ARCHIVED,
                ],
            ],
            'resources' => $resources->map(fn (Resource $resource) => [
                'id' => $resource->id,
                'name' => $resource->name,
                'category' => $resource->category,
                'available' => $resource->computeAvailableQuantity(),
                'quantity' => $resource->quantity,
                'status' => $resource->status,
            ])->values()->all(),
            'qualified_trainers' => QualifiedTrainer::active()
                ->orderBy('name')
                ->get(['id', 'name', 'specialization', 'barangay', 'status'])
                ->map(fn (QualifiedTrainer $trainer) => [
                    'id' => $trainer->id,
                    'name' => $trainer->name,
                    'specialization' => $trainer->specialization,
                    'barangay' => $trainer->barangay,
                    'status' => $trainer->status,
                ])
                ->values()
                ->all(),
        ];
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function saveTemplate(?SimulationExerciseTemplate $template, array $data, ?int $userId = null): SimulationExerciseTemplate
    {
        return DB::transaction(function () use ($template, $data, $userId) {
            $core = [
                'title' => trim((string) ($data['title'] ?? '')),
                'category' => (string) ($data['category'] ?? 'Multi-Hazard'),
                'exercise_type' => (string) ($data['exercise_type'] ?? 'Drill'),
                'difficulty_level' => (string) ($data['difficulty_level'] ?? 'Intermediate'),
                'estimated_duration_minutes' => isset($data['estimated_duration_minutes'])
                    ? (int) $data['estimated_duration_minutes']
                    : null,
                'objectives' => $data['objectives'] ?? null,
                'scenario_summary' => $data['scenario_summary'] ?? null,
                'expected_hazards' => $data['expected_hazards'] ?? null,
                'learning_objectives' => $data['learning_objectives'] ?? null,
                'safety_reminders' => $data['safety_reminders'] ?? null,
                'status' => (string) ($data['status'] ?? SimulationExerciseTemplate::STATUS_DRAFT),
                'updated_by_id' => $userId,
            ];

            if ($template) {
                $template->update($core);
            } else {
                $template = SimulationExerciseTemplate::create(array_merge($core, [
                    'created_by_id' => $userId,
                ]));
            }

            $this->syncActivities($template, $data['activities'] ?? []);
            $this->syncPersonnel($template, $data['personnel'] ?? []);
            $this->syncPersonnelAssignments($template, $data['personnel_assignments'] ?? []);
            $template->refresh();
            $this->syncTimelineFromActivities($template);
            $this->syncEvaluationObjectives($template, $data['evaluation_objectives'] ?? []);

            return $template->fresh();
        });
    }

    public function publish(SimulationExerciseTemplate $template, ?int $userId = null): SimulationExerciseTemplate
    {
        $template->update([
            'status' => SimulationExerciseTemplate::STATUS_PUBLISHED,
            'updated_by_id' => $userId,
        ]);

        return $template->fresh();
    }

    /**
     * @return list<string>
     */
    public function validatePublishable(SimulationExerciseTemplate $template): array
    {
        $template->loadMissing(['activities', 'personnel', 'evaluationObjectives']);

        $errors = [];

        if ($template->status === SimulationExerciseTemplate::STATUS_PUBLISHED) {
            return ['This exercise plan is already published.'];
        }

        if ($template->status === SimulationExerciseTemplate::STATUS_ARCHIVED) {
            return ['Archived exercise plans cannot be published. Create a new plan instead.'];
        }

        if (trim((string) $template->title) === '') {
            $errors[] = 'Exercise title is required.';
        }

        if (! in_array((string) $template->category, SimulationExerciseTemplate::CATEGORIES, true)) {
            $errors[] = 'Exercise category is required.';
        }

        if (! in_array((string) $template->exercise_type, SimulationExerciseTemplate::EXERCISE_TYPES, true)) {
            $errors[] = 'Exercise type is required.';
        }

        if ((int) ($template->estimated_duration_minutes ?? 0) < 15) {
            $errors[] = 'Estimated duration must be at least 15 minutes.';
        }

        if (trim((string) ($template->objectives ?? '')) === '') {
            $errors[] = 'Exercise objectives are required.';
        }

        if (trim((string) ($template->scenario_summary ?? '')) === '') {
            $errors[] = 'Scenario brief is required.';
        }

        $activities = $template->activities->filter(
            fn (SimulationExerciseActivity $activity) => trim((string) $activity->title) !== ''
                && (int) $activity->duration_minutes > 0
        );
        if ($activities->isEmpty()) {
            $errors[] = 'Add at least one exercise activity with a title and duration.';
        }

        $personnel = $template->personnel->filter(
            fn (SimulationExercisePersonnel $row) => trim((string) $row->role) !== ''
        );
        if ($personnel->isEmpty()) {
            $errors[] = 'Add at least one recommended personnel role.';
        }

        $evaluationObjectives = $template->evaluationObjectives->filter(
            fn (SimulationExerciseEvaluationObjective $row) => trim((string) $row->objective_text) !== ''
        );
        if ($evaluationObjectives->isEmpty()) {
            $errors[] = 'Add at least one evaluation objective.';
        }

        return $errors;
    }

    public function archive(SimulationExerciseTemplate $template, ?int $userId = null): SimulationExerciseTemplate
    {
        $template->update([
            'status' => SimulationExerciseTemplate::STATUS_ARCHIVED,
            'updated_by_id' => $userId,
        ]);

        return $template->fresh();
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function reuseTemplate(SimulationExerciseTemplate $template, array $data, ?int $userId = null): SimulationEvent
    {
        abort_unless($template->status === SimulationExerciseTemplate::STATUS_PUBLISHED, 422, 'Only published templates can be reused.');

        $template->load(['activities', 'personnel', 'personnelAssignments.qualifiedTrainer', 'timelineItems', 'evaluationObjectives', 'equipment.resource']);

        $campaignRequest = null;
        if (! empty($data['campaign_request_id'])) {
            $campaignRequest = CampaignRequest::query()
                ->with('trainingModule')
                ->where('status', 'approved')
                ->findOrFail((int) $data['campaign_request_id']);
        }

        $eventDate = $data['event_date'] ?? now()->addDays(7)->toDateString();
        $startTime = $data['start_time'] ?? '08:00';
        $endTime = $data['end_time'] ?? '12:00';
        $venue = trim((string) ($data['venue'] ?? 'TBD'));

        $assignmentSummary = $template->personnelAssignments
            ->map(fn ($item) => "{$item->role}: {$item->person_name}")
            ->implode(', ');

        $personnelSummary = $template->personnel
            ->map(fn ($item) => "{$item->role} ({$item->recommended_count})")
            ->implode(', ');

        if ($assignmentSummary !== '') {
            $personnelSummary = trim($personnelSummary.' | Assigned: '.$assignmentSummary, ' |');
        }

        $equipmentSummary = $template->equipment
            ->map(fn ($item) => ($item->resource?->name ?? 'Equipment').' x'.$item->required_quantity)
            ->implode(', ');

        $activitySummary = $template->activities
            ->map(fn ($item, $index) => ($index + 1).'. '.$item->title.' ('.$item->duration_minutes.' min)')
            ->implode("\n");

        $evaluationSummary = $template->evaluationObjectives
            ->map(fn ($item) => '• '.$item->objective_text)
            ->implode("\n");

        $timelineEntries = $template->timelineItems
            ->map(fn ($item) => [
                'time' => $item->start_time,
                'label' => $item->label,
                'description' => $item->description,
            ])
            ->values()
            ->all();

        $eventPhases = $template->activities
            ->map(fn ($item, $index) => [
                'order' => $index + 1,
                'title' => $item->title,
                'duration_minutes' => $item->duration_minutes,
                'description' => $item->description,
            ])
            ->values()
            ->all();

        $scenario = Scenario::query()
            ->where('status', 'published')
            ->where(function ($query) use ($template) {
                $query->where('disaster_type', $template->category)
                    ->orWhere('title', 'like', '%'.$template->category.'%');
            })
            ->orderBy('title')
            ->first();

        $leadTrainer = $template->personnelAssignments
            ->first(fn ($item) => $item->role === 'Lead Trainer' && $item->qualified_trainer_id)
            ?->qualifiedTrainer
            ?? $template->personnelAssignments->first(fn ($item) => $item->qualified_trainer_id)?->qualifiedTrainer;

        $targetAudience = $campaignRequest?->trainingModule?->target_audience;
        $targetAudienceLabel = is_array($targetAudience) && $targetAudience !== []
            ? implode(', ', $targetAudience)
            : (is_string($targetAudience) && trim($targetAudience) !== '' ? trim($targetAudience) : null);

        $campaignPayload = is_array($campaignRequest?->payload) ? $campaignRequest->payload : [];
        $registrationDeadline = $campaignPayload['registration_deadline'] ?? null;

        return DB::transaction(function () use (
            $template,
            $data,
            $userId,
            $campaignRequest,
            $eventDate,
            $startTime,
            $endTime,
            $venue,
            $personnelSummary,
            $equipmentSummary,
            $activitySummary,
            $evaluationSummary,
            $timelineEntries,
            $eventPhases,
            $scenario,
            $leadTrainer,
            $targetAudienceLabel,
            $registrationDeadline,
        ) {
        $event = SimulationEvent::create([
            'title' => trim((string) ($data['title'] ?? $template->title)),
            'disaster_type' => $template->category,
            'description' => $template->scenario_summary,
            'event_category' => $this->mapExerciseTypeToEventCategory($template->exercise_type),
            'status' => 'draft',
            'event_date' => $eventDate,
            'start_time' => $startTime,
            'end_time' => $endTime,
            'location' => $venue,
            'venue' => $venue,
            'scenario_id' => $scenario?->id,
            'training_module_id' => $campaignRequest?->training_module_id,
            'campaign_request_id' => $campaignRequest?->id,
            'simulation_exercise_template_id' => $template->id,
            'assigned_trainer_id' => $leadTrainer?->id,
            'target_audience' => $targetAudienceLabel,
            'max_participants' => $campaignRequest?->expected_participants,
            'registration_deadline' => $registrationDeadline,
            'self_registration_enabled' => false,
            'approval_required' => false,
            'facilitator_instructions' => implode("\n\n", array_filter([
                'Exercise Template: '.$template->title,
                'Recommended Personnel: '.$personnelSummary,
                'Recommended Equipment: '.$equipmentSummary,
                'Activities:'."\n".$activitySummary,
                $evaluationSummary !== '' ? "Evaluation Objectives:\n".$evaluationSummary : null,
            ])),
            'safety_guidelines' => $template->safety_reminders,
            'event_phases' => $eventPhases,
            'timeline_entries' => $timelineEntries,
            'created_by' => $userId,
            'updated_by' => $userId,
        ]);

        if ($campaignRequest) {
            $campaignRequest->update([
                'simulation_event_id' => $event->id,
                'status' => 'scheduled',
            ]);
        }

        app(SimulationEventPlanningService::class)->syncQualifiedParticipantsToEvent($event, $userId);

        return $event;
        });
    }

    /**
     * @param  list<array<string, mixed>>  $activities
     */
    private function syncActivities(SimulationExerciseTemplate $template, array $activities): void
    {
        $keptIds = [];

        foreach (array_values($activities) as $index => $row) {
            $title = trim((string) ($row['title'] ?? ''));
            if ($title === '') {
                continue;
            }

            $activity = isset($row['id'])
                ? $template->activities()->whereKey($row['id'])->first()
                : null;

            $payload = [
                'title' => $title,
                'description' => $row['description'] ?? null,
                'duration_minutes' => max(1, (int) ($row['duration_minutes'] ?? 15)),
                'start_time' => ! empty($row['start_time']) ? (string) $row['start_time'] : null,
                'sort_order' => $index + 1,
            ];

            if ($activity) {
                $activity->update($payload);
            } else {
                $activity = $template->activities()->create($payload);
            }

            $keptIds[] = $activity->id;
            $this->syncActivityEquipment($template, $activity, $row['equipment'] ?? []);
        }

        $template->activities()->whereNotIn('id', $keptIds)->delete();
        $template->equipment()->whereNotNull('activity_id')->whereNotIn('activity_id', $keptIds)->delete();
        $template->evaluationObjectives()->whereNotNull('activity_id')->whereNotIn('activity_id', $keptIds)->delete();
    }

    /**
     * @param  list<array<string, mixed>>  $equipment
     */
    private function syncActivityEquipment(
        SimulationExerciseTemplate $template,
        SimulationExerciseActivity $activity,
        array $equipment,
    ): void {
        $keptIds = [];

        foreach (array_values($equipment) as $index => $row) {
            $resourceId = (int) ($row['resource_id'] ?? 0);
            if ($resourceId <= 0) {
                continue;
            }

            $item = isset($row['id'])
                ? $activity->equipment()->whereKey($row['id'])->first()
                : null;

            $payload = [
                'template_id' => $template->id,
                'resource_id' => $resourceId,
                'required_quantity' => max(1, (int) ($row['required_quantity'] ?? 1)),
                'sort_order' => $index + 1,
            ];

            if ($item) {
                $item->update($payload);
            } else {
                $item = $activity->equipment()->create($payload);
            }

            $keptIds[] = $item->id;
        }

        $activity->equipment()->whereNotIn('id', $keptIds)->delete();
    }

    /**
     * @param  list<array<string, mixed>>  $personnel
     */
    private function syncPersonnel(SimulationExerciseTemplate $template, array $personnel): void
    {
        $keptIds = [];

        foreach (array_values($personnel) as $index => $row) {
            $role = trim((string) ($row['role'] ?? ''));
            if ($role === '') {
                continue;
            }

            $item = isset($row['id'])
                ? $template->personnel()->whereKey($row['id'])->first()
                : null;

            $payload = [
                'role' => $role,
                'recommended_count' => max(1, (int) ($row['recommended_count'] ?? 1)),
                'notes' => $row['notes'] ?? null,
                'sort_order' => $index + 1,
            ];

            if ($item) {
                $item->update($payload);
            } else {
                $item = $template->personnel()->create($payload);
            }

            $keptIds[] = $item->id;
        }

        $template->personnel()->whereNotIn('id', $keptIds)->delete();
    }

    /**
     * @param  list<array<string, mixed>>  $timeline
     */
    private function syncTimeline(SimulationExerciseTemplate $template, array $timeline): void
    {
        $activityIdsByIndex = $template->activities()
            ->orderBy('sort_order')
            ->pluck('id')
            ->values()
            ->all();

        $keptIds = [];

        foreach (array_values($timeline) as $index => $row) {
            $label = trim((string) ($row['label'] ?? ''));
            if ($label === '') {
                continue;
            }

            $item = isset($row['id'])
                ? $template->timelineItems()->whereKey($row['id'])->first()
                : null;

            $activityId = ! empty($row['activity_id']) ? (int) $row['activity_id'] : null;
            if (! $activityId && isset($row['activity_index']) && is_numeric($row['activity_index'])) {
                $activityId = $activityIdsByIndex[(int) $row['activity_index']] ?? null;
            }

            $payload = [
                'start_time' => (string) ($row['start_time'] ?? '08:00'),
                'label' => $label,
                'description' => $row['description'] ?? null,
                'activity_id' => $activityId,
                'sort_order' => $index + 1,
            ];

            if ($item) {
                $item->update($payload);
            } else {
                $item = $template->timelineItems()->create($payload);
            }

            $keptIds[] = $item->id;
        }

        $template->timelineItems()->whereNotIn('id', $keptIds)->delete();
    }

    private function syncTimelineFromActivities(SimulationExerciseTemplate $template): void
    {
        $timeline = $template->activities()
            ->orderBy('sort_order')
            ->get()
            ->filter(fn (SimulationExerciseActivity $activity) => filled($activity->start_time))
            ->values()
            ->map(fn (SimulationExerciseActivity $activity, int $index) => [
                'start_time' => (string) $activity->start_time,
                'label' => (string) $activity->title,
                'description' => $activity->description,
                'activity_id' => $activity->id,
                'sort_order' => $index + 1,
            ])
            ->all();

        $this->syncTimeline($template, $timeline);
    }

    /**
     * @param  list<array<string, mixed>>  $objectives
     */
    private function syncEvaluationObjectives(SimulationExerciseTemplate $template, array $objectives): void
    {
        $activityIdsByIndex = $template->activities()
            ->orderBy('sort_order')
            ->pluck('id')
            ->values()
            ->all();

        $keptIds = [];

        foreach (array_values($objectives) as $index => $row) {
            $text = trim((string) ($row['objective_text'] ?? ''));
            if ($text === '') {
                continue;
            }

            $item = isset($row['id'])
                ? $template->evaluationObjectives()->whereKey($row['id'])->first()
                : null;

            $activityId = ! empty($row['activity_id']) ? (int) $row['activity_id'] : null;
            if (! $activityId && isset($row['activity_index']) && is_numeric($row['activity_index'])) {
                $activityId = $activityIdsByIndex[(int) $row['activity_index']] ?? null;
            }

            $payload = [
                'activity_id' => $activityId,
                'heading' => $row['heading'] ?? null,
                'objective_text' => $text,
                'sort_order' => $index + 1,
            ];

            if ($item) {
                $item->update($payload);
            } else {
                $item = $template->evaluationObjectives()->create($payload);
            }

            $keptIds[] = $item->id;
        }

        $template->evaluationObjectives()->whereNotIn('id', $keptIds)->delete();
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function serializePersonnelAssignments(SimulationExerciseTemplate $template): array
    {
        $assignments = $template->personnelAssignments
            ->map(fn (SimulationExercisePersonnelAssignment $item) => [
                'id' => $item->id,
                'role' => $item->role,
                'source_group' => $item->source_group,
                'qualified_trainer_id' => $item->qualified_trainer_id,
                'person_name' => $item->person_name,
                'person_external_id' => $item->person_external_id,
                'notes' => $item->notes,
                'sort_order' => $item->sort_order,
            ])
            ->values()
            ->all();

        if ($assignments !== []) {
            return $assignments;
        }

        return $template->personnel
            ->filter(fn (SimulationExercisePersonnel $item) => $item->qualified_trainer_id)
            ->map(fn (SimulationExercisePersonnel $item) => [
                'id' => null,
                'role' => $item->role,
                'source_group' => 'group6_trainers',
                'qualified_trainer_id' => $item->qualified_trainer_id,
                'person_name' => $item->qualifiedTrainer?->name ?? 'Trainer',
                'person_external_id' => null,
                'notes' => $item->notes,
                'sort_order' => $item->sort_order,
            ])
            ->values()
            ->all();
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function buildPersonnelPool(): array
    {
        $pools = [];

        $trainers = QualifiedTrainer::active()->orderBy('name')->get();
        $pools[] = [
            'group_key' => 'group6_trainers',
            'group_label' => 'Group 6 — Community Engagement (Trainers)',
            'integration_pending' => false,
            'members' => $trainers->map(fn (QualifiedTrainer $trainer) => [
                'id' => $trainer->id,
                'name' => $trainer->name,
                'specialization' => $trainer->specialization,
                'barangay' => $trainer->barangay,
                'source_group' => 'group6_trainers',
            ])->values()->all(),
        ];

        $pools[] = [
            'group_key' => 'group3_personnel',
            'group_label' => 'Group 3 — Resource Allocation Personnel',
            'integration_pending' => true,
            'members' => [],
        ];

        $pools[] = [
            'group_key' => 'group5_medical',
            'group_label' => 'Group 5 — Medical & Safety Personnel',
            'integration_pending' => true,
            'members' => [],
        ];

        return $pools;
    }

    /**
     * @param  list<array<string, mixed>>  $assignments
     */
    private function syncPersonnelAssignments(SimulationExerciseTemplate $template, array $assignments): void
    {
        $keptIds = [];

        foreach (array_values($assignments) as $index => $row) {
            $role = trim((string) ($row['role'] ?? ''));
            $personName = trim((string) ($row['person_name'] ?? ''));
            if ($role === '' || $personName === '') {
                continue;
            }

            $item = isset($row['id'])
                ? $template->personnelAssignments()->whereKey($row['id'])->first()
                : null;

            $payload = [
                'role' => $role,
                'source_group' => (string) ($row['source_group'] ?? 'group6_trainers'),
                'qualified_trainer_id' => ! empty($row['qualified_trainer_id'])
                    ? (int) $row['qualified_trainer_id']
                    : null,
                'person_name' => $personName,
                'person_external_id' => $row['person_external_id'] ?? null,
                'notes' => $row['notes'] ?? null,
                'sort_order' => $index + 1,
            ];

            if ($item) {
                $item->update($payload);
            } else {
                $item = $template->personnelAssignments()->create($payload);
            }

            $keptIds[] = $item->id;
        }

        $template->personnelAssignments()->whereNotIn('id', $keptIds)->delete();
    }

    /**
     * @return array<string, mixed>
     */
    private function serializeEquipment(SimulationExerciseActivityEquipment $item): array
    {
        $resource = $item->resource;

        return [
            'id' => $item->id,
            'activity_id' => $item->activity_id,
            'resource_id' => $item->resource_id,
            'resource_name' => $resource?->name,
            'resource_category' => $resource?->category,
            'required_quantity' => $item->required_quantity,
            'available_quantity' => $resource?->computeAvailableQuantity(),
            'availability_status' => $resource?->status,
            'sort_order' => $item->sort_order,
        ];
    }

    private function mapExerciseTypeToEventCategory(string $exerciseType): string
    {
        return match ($exerciseType) {
            'Functional Exercise' => 'Functional Exercise',
            'Full Scale Exercise' => 'Full-scale Exercise',
            default => 'Drill',
        };
    }
}
