<?php

namespace App\Services;

use App\Models\AiScenarioAttempt;
use App\Models\CampaignRegistration;
use App\Models\CampaignRequest;
use App\Models\EventRegistration;
use App\Models\LessonCompletion;
use App\Models\Scenario;
use App\Models\SimulationEvent;
use App\Models\SimulationExerciseTemplate;
use App\Models\SimulationPlan;
use App\Models\TrainingModule;
use App\Models\User;
use App\Support\SimulationPlanningCampaignImport;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;

class SimulationEventPlanningService
{
    private static ?int $publishedExercisePlanCount = null;

    public function __construct(
        private readonly GeminiService $geminiService,
    ) {}

    public const EXERCISE_TYPES = [
        'Drill' => [
            'description' => 'A supervised exercise that tests a specific emergency response function such as evacuation, fire response, or communication.',
            'tone' => 'emerald',
        ],
        'Functional Exercise' => [
            'description' => 'Tests coordination, communication, and decision-making among response teams without deploying actual field resources.',
            'tone' => 'orange',
        ],
        'Full-Scale Exercise' => [
            'description' => 'A realistic disaster simulation involving responders, participants, emergency vehicles, equipment, and field operations.',
            'tone' => 'rose',
        ],
    ];

    public const SCENARIO_TEMPLATES = [
        'Earthquake' => 'A magnitude 6.8 earthquake has struck the municipality. Participants must perform Duck, Cover, Hold, evacuation, and initial emergency response.',
        'Flood' => 'A continuous heavy rainfall has caused flooding in the community. Participants are expected to perform evacuation procedures and emergency response.',
        'Fire' => 'A fire has started inside a public building requiring immediate evacuation and fire response.',
        'Typhoon' => 'A strong typhoon has made landfall with heavy rain and strong winds, requiring coordinated sheltering and emergency response.',
        'Landslide' => 'Continuous rainfall has triggered landslides in high-risk zones, requiring immediate warning, evacuation, and rescue coordination.',
        'Tsunami' => 'A tsunami alert has been issued after an offshore seismic event. Participants must execute vertical and inland evacuation protocols.',
        'Volcanic Eruption' => 'Volcanic activity has intensified with ashfall and possible eruption, requiring protection measures and staged evacuation.',
        'Chemical Spill' => 'A hazardous material spill has occurred near a populated area, requiring isolation, decontamination, and coordinated emergency response.',
    ];
    /**
     * @return Collection<int, array<string, mixed>>
     */
    public function listApprovedSchedules(): Collection
    {
        return CampaignRequest::query()
            ->with(['trainingModule', 'simulationPlan', 'simulationEvent'])
            ->where('status', 'approved')
            ->orderByDesc('approved_at')
            ->orderByDesc('id')
            ->get()
            ->map(fn (CampaignRequest $request) => $this->serializeScheduleForDashboard($request));
    }

    /**
     * @return array<string, mixed>
     */
    public function serializeScheduleForDashboard(CampaignRequest $request): array
    {
        $request->loadMissing(['trainingModule', 'simulationPlan', 'simulationEvent']);

        $schedule = $this->serializeSchedule($request);
        $summary = $this->buildTrainingSummaryForCampaign($request);
        $planData = $this->serializePlan($request->simulationPlan);
        $readiness = $this->buildReadiness($schedule, $summary, $planData);

        $registrationPassed = (bool) ($readiness['registration_deadline_passed'] ?? false);
        $trainingCompletionPassed = $this->trainingCompletionDeadlineHasPassed(
            $schedule['training_completion_deadline'] ?? null,
        );
        $qualified = (int) ($summary['qualified_for_simulation'] ?? 0);
        $minimum = (int) ($schedule['minimum_qualified_participants'] ?? 0);
        $simulationReadiness = $this->resolveDashboardReadiness(
            $request,
            $registrationPassed,
            $trainingCompletionPassed,
            $qualified,
            $minimum,
        );
        $simulationPlanBadge = $this->resolveDashboardPlanStatus($request, $readiness);
        [$canCreatePlan, $createPlanDisabledReason] = $this->resolveCreatePlanAccess(
            $request,
            $registrationPassed,
            $trainingCompletionPassed,
            $qualified,
            $minimum,
        );

        return array_merge($schedule, [
            'registered_participants_count' => (int) ($summary['total_registered'] ?? 0),
            'qualified_participants' => $qualified,
            'registration_deadline_passed' => $registrationPassed,
            'training_completion_deadline_passed' => $trainingCompletionPassed,
            'simulation_readiness' => $simulationReadiness['key'],
            'simulation_readiness_label' => $simulationReadiness['label'],
            'simulation_readiness_tone' => $simulationReadiness['tone'],
            'simulation_plan_badge' => $simulationPlanBadge['key'],
            'simulation_plan_badge_label' => $simulationPlanBadge['label'],
            'simulation_plan_badge_tone' => $simulationPlanBadge['tone'],
            'can_create_plan' => $canCreatePlan,
            'create_plan_disabled_reason' => $createPlanDisabledReason,
            'is_ready_for_simulation' => $simulationReadiness['key'] === 'ready',
            'has_simulation_plan' => $request->simulation_event_id !== null,
            'published_exercise_plans_available' => $this->publishedExercisePlanCount() > 0,
            'simulation_event_status' => $request->simulationEvent?->status,
            'planning_href' => '/admin/simulation-planning/'.$request->id,
            'simulation_event_href' => $request->simulation_event_id
                ? '/admin/simulation-events/'.$request->simulation_event_id
                : null,
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    public function serializeSchedule(CampaignRequest $request): array
    {
        return SimulationPlanningCampaignImport::fromCampaignRequest($request);
    }

    /**
     * @return array<string, int>
     */
    public function buildTrainingSummaryForCampaign(CampaignRequest $request): array
    {
        return $this->buildTrainingSummary(
            (int) $request->training_module_id,
            $request,
        );
    }

    /**
     * @return array<string, mixed>
     */
    public function buildDetail(CampaignRequest $request): array
    {
        $schedule = $this->serializeSchedule($request);
        $trainingModuleId = (int) $request->training_module_id;
        $summary = $this->buildTrainingSummaryForCampaign($request);
        $plan = $request->simulationPlan;
        $planData = $this->serializePlan($plan);
        $readiness = $this->buildReadiness($schedule, $summary, $planData);
        $participants = $this->buildParticipantRows($trainingModuleId, $request);

        return [
            'schedule' => $schedule,
            'training_summary' => $summary,
            'readiness' => $readiness,
            'participants' => $participants,
            'simulation_plan' => $planData,
            'exercise_type_options' => array_keys(self::EXERCISE_TYPES),
            'exercise_type_metadata' => self::EXERCISE_TYPES,
            'scenario_templates' => self::SCENARIO_TEMPLATES,
            'scenario_library' => $this->scenarioLibrary(),
            'scenarios' => Scenario::query()
                ->where('status', 'published')
                ->orderBy('title')
                ->get(['id', 'title', 'disaster_type'])
                ->map(fn (Scenario $scenario) => [
                    'id' => $scenario->id,
                    'title' => $scenario->title,
                    'disaster_type' => $scenario->disaster_type,
                ])
                ->values()
                ->all(),
            'trainer_options' => [],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function serializePlanningWorkspace(CampaignRequest $request): array
    {
        $request->loadMissing(['trainingModule', 'simulationPlan', 'simulationEvent']);

        return $this->buildDetail($request);
    }

    /**
     * @param  array<string, mixed>  $context
     * @return array{simulation_title:string,objectives:array<int,string>}
     */
    public function generateAiPlanningDraft(CampaignRequest $request, array $context): array
    {
        $schedule = $this->serializeSchedule($request);
        $exerciseType = trim((string) ($context['exercise_type'] ?? ''));
        $scenario = trim((string) ($context['simulation_scenario'] ?? ''));
        $campaignTitle = trim((string) ($schedule['campaign_title'] ?? ''));
        $disasterType = trim((string) ($schedule['disaster_type'] ?? ''));
        $minimumObjectives = max(3, min(8, (int) ($context['objective_count'] ?? 4)));

        if ($exerciseType === '' || $scenario === '') {
            throw new \InvalidArgumentException('Select Simulation Type and Disaster Type first.');
        }

        $prompt = <<<PROMPT
You are a disaster preparedness planning assistant for LGU simulation events in the Philippines.

Generate a concise simulation plan draft for:
- Campaign Title: {$campaignTitle}
- Disaster Type: {$disasterType}
- Simulation Type: {$exerciseType}
- Disaster Scenario: {$scenario}

Return ONLY valid JSON (no markdown):
{
  "simulation_title": "Short, specific title (max 120 chars)",
  "objectives": [
    "Objective 1",
    "Objective 2",
    "Objective 3"
  ]
}

Rules:
- Provide at least {$minimumObjectives} objectives.
- Objectives must be actionable, specific, and measurable for responders.
- Do not include numbering, bullets, + symbols, or prefixes inside objective text.
PROMPT;

        try {
            $text = $this->geminiService->generateContentText($prompt);
            return $this->parseAiPlanningDraft($text, $exerciseType, $scenario);
        } catch (\Throwable $exception) {
            Log::warning('AI planning draft fallback used', [
                'campaign_request_id' => $request->id,
                'error' => $exception->getMessage(),
            ]);

            return [
                'simulation_title' => $exerciseType.' - '.$scenario,
                'objectives' => [
                    'Activate incident command structure and role assignments within the target response time.',
                    'Execute coordinated communication and reporting flow among all assigned response teams.',
                    'Validate evacuation, safety, and accountability procedures for affected participants.',
                    'Assess operational readiness and identify immediate post-exercise improvement actions.',
                ],
            ];
        }
    }

    /**
     * @return array<string, int>
     */
    public function buildTrainingSummary(int $trainingModuleId, CampaignRequest|string $campaignRequestOrCommunity = ''): array
    {
        $participantIds = $campaignRequestOrCommunity instanceof CampaignRequest
            ? $this->registeredParticipantIdsForCampaign($campaignRequestOrCommunity)
            : $this->registeredParticipantIds($trainingModuleId, (string) $campaignRequestOrCommunity);
        $totalLessons = TrainingModule::query()->withCount('contents')->find($trainingModuleId)?->contents_count ?? 0;

        $completed = 0;
        $inProgress = 0;
        $notStarted = 0;

        foreach ($participantIds as $userId) {
            $status = $this->resolveModuleTrainingStatus((int) $userId, $trainingModuleId, $totalLessons);
            if ($status === 'Completed') {
                $completed++;
            } elseif ($status === 'In Progress') {
                $inProgress++;
            } else {
                $notStarted++;
            }
        }

        return [
            'total_registered' => $participantIds->count(),
            'completed' => $completed,
            'in_progress' => $inProgress,
            'not_started' => $notStarted,
            'qualified_for_simulation' => $completed,
        ];
    }

    /**
     * @param  array<string, mixed>  $schedule
     * @param  array<string, int>  $summary
     * @param  array<string, mixed>|null  $plan
     * @return array<string, mixed>
     */
    public function buildReadiness(array $schedule, array $summary, ?array $plan = null): array
    {
        $expected = (int) ($schedule['expected_participants'] ?? 0);
        $minimum = (int) ($schedule['minimum_qualified_participants'] ?? 0);
        $qualified = (int) ($summary['qualified_for_simulation'] ?? 0);
        $registrationDeadlinePassed = $this->registrationDeadlineHasPassed($schedule['registration_deadline'] ?? null);
        $trainingCompletionDeadlinePassed = $this->trainingCompletionDeadlineHasPassed(
            $schedule['training_completion_deadline'] ?? null,
        );
        $registrationValidationMessage = $registrationDeadlinePassed
            ? null
            : 'Registration is still open. Simulation planning will be available after the registration deadline.';
        $trainingCompletionValidationMessage = $trainingCompletionDeadlinePassed
            ? null
            : 'Training completion period has not ended.';
        $qualifiedValidationMessage = ($minimum > 0 && $qualified < $minimum)
            ? sprintf(
                'Only %d qualified participants. A minimum of %d qualified participants is required.',
                $qualified,
                $minimum,
            )
            : null;
        $trainingAvailable = TrainingModule::query()->whereKey($schedule['training_module_id'] ?? 0)->exists();
        $exerciseType = (string) ($plan['exercise_type'] ?? '');
        $checklist = [
            $this->checkItem(
                'exercise_type',
                'Simulation Type',
                $this->hasText($exerciseType),
                'Please select a Simulation Type before generating the Simulation Event.'
            ),
            $this->checkItem(
                'approved_schedule',
                'Approved Campaign',
                ($schedule['campaign_status'] ?? $schedule['approval_status'] ?? '') === 'Approved',
                'Campaign has not been approved yet.'
            ),
            $this->checkItem(
                'registration_deadline_passed',
                'Registration Deadline Passed',
                $registrationDeadlinePassed,
                $registrationValidationMessage ?? 'Registration deadline has not passed yet.'
            ),
            $this->checkItem(
                'training_completion_deadline_passed',
                'Training Completion Deadline Passed',
                $trainingCompletionDeadlinePassed,
                $trainingCompletionValidationMessage ?? 'Training completion period has not ended.'
            ),
            $this->checkItem(
                'training_available',
                'Training Available',
                $trainingAvailable,
                'No linked training module is available for this campaign.'
            ),
            $this->checkItem(
                'simulation_scenario',
                'Disaster Type',
                $this->hasText($plan['simulation_scenario'] ?? null),
                'Disaster type is missing.'
            ),
            $this->checkItem(
                'minimum_qualified_participants',
                'Minimum Qualified Participants Reached',
                $minimum > 0 && $qualified >= $minimum,
                $qualifiedValidationMessage ?? 'Insufficient qualified participants.'
            ),
            $this->checkItem(
                'simulation_objectives',
                'Objectives',
                $this->hasText($plan['simulation_objectives'] ?? null),
                'Objectives are missing.'
            ),
        ];
        $completedChecks = collect($checklist)->where('completed', true)->count();
        $progressPercent = count($checklist) > 0
            ? (int) round(($completedChecks / count($checklist)) * 100)
            : 0;
        $blockers = collect($checklist)
            ->where('completed', false)
            ->pluck('message')
            ->filter()
            ->values()
            ->all();
        $hasSavedPlan = $plan !== null;
        $requirementsMet = $registrationDeadlinePassed
            && $trainingCompletionDeadlinePassed
            && ($minimum <= 0 || $qualified >= $minimum);
        $isReady = count($blockers) === 0 && $hasSavedPlan && $requirementsMet;
        $planStatus = $hasSavedPlan
            ? (($schedule['simulation_event_id'] ?? null) ? 'Generated' : 'Saved')
            : 'Not Yet Created';
        $reason = $blockers[0] ?? ($hasSavedPlan ? null : 'Simulation plan has not been saved yet.');

        return [
            'approved_schedule' => true,
            'registration_deadline_passed' => $registrationDeadlinePassed,
            'registration_validation_message' => $registrationValidationMessage,
            'qualified_validation_message' => $qualifiedValidationMessage,
            'validation_messages' => array_values(array_filter([
                $registrationValidationMessage,
                $trainingCompletionValidationMessage,
                $qualifiedValidationMessage,
            ])),
            'training_available' => $trainingAvailable,
            'expected_participants' => $expected,
            'minimum_qualified_participants' => $minimum,
            'qualified_participants' => $qualified,
            'exercise_type' => $exerciseType !== '' ? $exerciseType : '—',
            'exercise_type_tone' => $this->exerciseTypeTone($exerciseType),
            'exercise_complexity' => $plan['exercise_complexity'] ?? '—',
            'planning_progress' => $progressPercent,
            'completed_items' => $completedChecks,
            'total_items' => count($checklist),
            'checklist' => $checklist,
            'blockers' => $blockers,
            'can_generate' => $isReady,
            'simulation_plan_status' => $planStatus,
            'is_ready' => $isReady,
            'overall_status' => $isReady ? 'READY FOR SIMULATION' : 'NOT READY FOR SIMULATION',
            'overall_status_tone' => $isReady ? 'ready' : 'not_ready',
            'reason' => $isReady ? null : $reason,
            'validation_message' => $isReady
                ? null
                : 'Simulation event cannot be generated until all planning and readiness requirements are complete.',
        ];
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function buildParticipantRows(int $trainingModuleId, CampaignRequest|string $campaignRequestOrCommunity = ''): array
    {
        $participantIds = $campaignRequestOrCommunity instanceof CampaignRequest
            ? $this->registeredParticipantIdsForCampaign($campaignRequestOrCommunity)
            : $this->registeredParticipantIds($trainingModuleId, (string) $campaignRequestOrCommunity);
        $totalLessons = TrainingModule::query()->withCount('contents')->find($trainingModuleId)?->contents_count ?? 0;

        return User::query()
            ->whereIn('id', $participantIds)
            ->orderBy('name')
            ->get(['id', 'name', 'email', 'barangay', 'city'])
            ->map(function (User $user) use ($trainingModuleId, $totalLessons) {
                $status = $this->resolveModuleTrainingStatus($user->id, $trainingModuleId, $totalLessons);
                $lessonCount = LessonCompletion::query()
                    ->where('user_id', $user->id)
                    ->where('training_module_id', $trainingModuleId)
                    ->count();
                $lastLessonCompletion = LessonCompletion::query()
                    ->where('user_id', $user->id)
                    ->where('training_module_id', $trainingModuleId)
                    ->latest('completed_at')
                    ->value('completed_at');
                $latestAttemptCompletion = AiScenarioAttempt::query()
                    ->where('user_id', $user->id)
                    ->where('training_module_id', $trainingModuleId)
                    ->whereNotNull('completed_at')
                    ->latest('completed_at')
                    ->value('completed_at');
                $completionDate = $lastLessonCompletion ?: $latestAttemptCompletion;
                $attendance = $totalLessons > 0 ? sprintf('%d/%d lessons', $lessonCount, $totalLessons) : '—';
                $eligible = $status === 'Completed';

                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'community' => $user->barangay ?: $user->city ?: '—',
                    'training_status' => $status,
                    'attendance' => $attendance,
                    'completion_date' => $completionDate,
                    'qualified_for_simulation' => $eligible,
                    'eligibility' => $eligible ? 'Eligible' : 'Not Eligible',
                ];
            })
            ->values()
            ->all();
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function savePlan(CampaignRequest $request, array $data, ?int $userId = null): SimulationPlan
    {
        abort_unless($request->status === 'approved', 422, 'Only approved schedules can have simulation plans.');

        return SimulationPlan::updateOrCreate(
            ['campaign_request_id' => $request->id],
            [
                'exercise_type' => $data['exercise_type'] ?? null,
                'exercise_complexity' => $data['exercise_complexity'] ?? null,
                'estimated_duration' => $data['estimated_duration'] ?? null,
                'estimated_responders' => $data['estimated_responders'] ?? null,
                'estimated_observers' => $data['estimated_observers'] ?? null,
                'estimated_evaluators' => $data['estimated_evaluators'] ?? null,
                'simulation_title' => $data['simulation_title'] ?? null,
                'simulation_scenario' => $data['simulation_scenario'] ?? null,
                'simulation_objectives' => $data['simulation_objectives'] ?? null,
                'simulation_description' => $data['simulation_description'] ?? null,
                'event_date' => $data['event_date'] ?? null,
                'start_time' => $data['start_time'] ?? null,
                'end_time' => $data['end_time'] ?? null,
                'venue' => $data['venue'] ?? null,
                'team_assignments' => $data['team_assignments'] ?? null,
                'lead_coordinator' => $data['lead_coordinator'] ?? null,
                'planning_officer' => $data['planning_officer'] ?? null,
                'medical_team' => $data['medical_team'] ?? null,
                'rescue_team' => $data['rescue_team'] ?? null,
                'communication_team' => $data['communication_team'] ?? null,
                'team_leader' => $data['lead_coordinator'] ?? ($data['team_leader'] ?? null),
                'required_equipment' => $data['required_equipment'] ?? null,
                'required_resources' => $data['required_resources'] ?? null,
                'safety_officer' => $data['safety_officer'] ?? null,
                'assembly_area' => $data['assembly_area'] ?? null,
                'evacuation_route' => $data['evacuation_route'] ?? null,
                'evaluation_criteria' => $data['evaluation_criteria'] ?? null,
                'emergency_contact_person' => $data['emergency_contact_person'] ?? null,
                'remarks' => $data['remarks'] ?? ($data['additional_notes'] ?? null),
                'additional_notes' => $data['additional_notes'] ?? null,
                'status' => 'saved',
                'created_by_id' => $userId,
                'updated_by_id' => $userId,
            ],
        );
    }

    public function generateSimulationEvent(CampaignRequest $request, ?int $userId = null): SimulationEvent
    {
        abort_unless($request->status === 'approved', 422, 'Only approved schedules can generate simulation events.');
        abort_if($request->simulation_event_id, 422, 'A simulation event has already been generated for this schedule.');

        $schedule = $this->serializeSchedule($request);
        $summary = $this->buildTrainingSummaryForCampaign($request);
        $plan = $request->simulationPlan;
        abort_if(! $plan, 422, 'Save a simulation plan before generating the simulation event.');
        $planData = $this->serializePlan($plan);
        $readiness = $this->buildReadiness($schedule, $summary, $planData);
        abort_unless($readiness['is_ready'], 422, implode(' ', $readiness['validation_messages'] ?: $readiness['blockers'] ?: [$readiness['validation_message']]));

        $payload = is_array($request->payload) ? $request->payload : [];
        $module = $request->trainingModule;
        $disasterType = (string) ($schedule['disaster_type'] ?? 'General');
        if ($disasterType === '—' || $disasterType === '') {
            $hazard = $module?->related_hazard ?? $module?->category;
            $disasterType = is_array($hazard) ? ($hazard[0] ?? 'General') : (string) ($hazard ?: 'General');
        }

        $targetAudience = $schedule['target_audience'] ?? [];
        $targetAudienceLabel = is_array($targetAudience) && $targetAudience !== []
            ? implode(', ', $targetAudience)
            : null;
        $registrationDeadline = $schedule['registration_deadline'] ?? null;

        $scenarioId = Scenario::query()
            ->where('status', 'published')
            ->when($plan->simulation_scenario, fn ($query) => $query->where('disaster_type', $plan->simulation_scenario))
            ->when(! $plan->simulation_scenario && $disasterType !== '' && $disasterType !== 'General', fn ($query) => $query->where('disaster_type', $disasterType))
            ->orderBy('title')
            ->value('id');

        $event = SimulationEvent::create([
            'title' => $plan->simulation_title ?: $plan->simulation_scenario ?: (($module?->title ?? 'Training').' Simulation'),
            'disaster_type' => $plan->simulation_scenario ?: $disasterType,
            'description' => $plan->simulation_description,
            'event_category' => $this->mapExerciseTypeToEventCategory($plan->exercise_type),
            'status' => 'draft',
            'event_date' => $plan->event_date ?? ($registrationDeadline ? Carbon::parse($registrationDeadline)->addDay()->toDateString() : now()->toDateString()),
            'start_time' => $plan->start_time ?? '08:00',
            'end_time' => $plan->end_time ?? '12:00',
            'location' => $plan->venue,
            'venue' => $plan->venue,
            'training_module_id' => $request->training_module_id,
            'campaign_request_id' => $request->id,
            'max_participants' => $schedule['expected_participants'] ?: null,
            'target_audience' => $targetAudienceLabel,
            'registration_deadline' => $registrationDeadline,
            'facilitators' => array_values(array_filter([
                $plan->lead_coordinator,
                $plan->planning_officer,
                $plan->safety_officer,
            ])),
            'assembly_points' => $plan->assembly_area,
            'exits' => $plan->evacuation_route,
            'safety_guidelines' => $plan->evaluation_criteria,
            'hazard_warnings' => $plan->remarks ?: $plan->additional_notes,
            'facilitator_instructions' => trim(implode("\n\n", array_filter([
                $plan->simulation_objectives,
                $plan->exercise_type ? 'Exercise Type: '.$plan->exercise_type : null,
                $plan->exercise_complexity ? 'Exercise Complexity: '.$plan->exercise_complexity : null,
                $plan->estimated_duration ? 'Estimated Duration: '.$plan->estimated_duration : null,
                $plan->required_resources ? 'Required Resources: '.$plan->required_resources : null,
                $plan->required_equipment ? 'Required Equipment: '.$plan->required_equipment : null,
                $plan->medical_team ? 'Medical Team: '.$plan->medical_team : null,
                $plan->rescue_team ? 'Rescue Team: '.$plan->rescue_team : null,
                $plan->communication_team ? 'Communication Team: '.$plan->communication_team : null,
                $plan->emergency_contact_person ? 'Emergency Contact: '.$plan->emergency_contact_person : null,
            ]))),
            'scenario_id' => $scenarioId,
            'self_registration_enabled' => false,
            'approval_required' => false,
            'created_by' => $userId,
        ]);

        $plan->update([
            'status' => 'generated',
            'updated_by_id' => $userId,
        ]);

        $request->update([
            'simulation_event_id' => $event->id,
            'status' => 'scheduled',
        ]);

        $this->syncQualifiedParticipantsToEvent($event, $userId);

        return $event;
    }

    /**
     * @return Collection<int, int>
     */
    protected function registeredParticipantIdsForCampaign(CampaignRequest $request): Collection
    {
        return CampaignRegistration::query()
            ->where('campaign_request_id', $request->id)
            ->where('registration_status', CampaignRegistration::STATUS_REGISTERED)
            ->pluck('user_id');
    }

    /**
     * @return Collection<int, int>
     */
    protected function registeredParticipantIds(int $trainingModuleId, string $community = ''): Collection
    {
        // Primary source: active participants in the target community (so "Not Started" users still show up).
        $community = trim($community);
        $communityIds = User::query()
            ->where('role', 'PARTICIPANT')
            ->where('status', 'active')
            ->when($community !== '' && $community !== '—', function ($query) use ($community) {
                $query->where(function ($inner) use ($community) {
                    $inner
                        ->where('barangay', $community)
                        ->orWhere('city', $community);
                });
            })
            ->pluck('id');

        $lessonIds = LessonCompletion::query()
            ->where('training_module_id', $trainingModuleId)
            ->pluck('user_id');

        $attemptIds = AiScenarioAttempt::query()
            ->where('training_module_id', $trainingModuleId)
            ->pluck('user_id');

        return $communityIds
            ->merge($lessonIds)
            ->merge($attemptIds)
            ->unique()
            ->values();
    }

    protected function resolveModuleTrainingStatus(int $userId, int $trainingModuleId, int $totalLessons): string
    {
        $lessonCount = LessonCompletion::query()
            ->where('user_id', $userId)
            ->where('training_module_id', $trainingModuleId)
            ->count();

        $aiCompleted = AiScenarioAttempt::query()
            ->where('user_id', $userId)
            ->where('training_module_id', $trainingModuleId)
            ->where('status', AiScenarioAttempt::STATUS_COMPLETED)
            ->exists();

        if ($lessonCount === 0 && ! $aiCompleted) {
            return 'Not Started';
        }

        if ($aiCompleted || ($totalLessons > 0 && $lessonCount >= $totalLessons) || $lessonCount >= 3) {
            return 'Completed';
        }

        return 'In Progress';
    }

    protected function registrationDeadlineHasPassed(?string $deadline): bool
    {
        if (! $deadline) {
            return false;
        }

        try {
            return now()->greaterThan(Carbon::parse($deadline));
        } catch (\Throwable) {
            return false;
        }
    }

    protected function trainingCompletionDeadlineHasPassed(?string $deadline): bool
    {
        if (! $deadline) {
            return true;
        }

        try {
            return now()->greaterThan(Carbon::parse($deadline));
        } catch (\Throwable) {
            return false;
        }
    }

    /**
     * @return array{key:string,label:string,tone:string}
     */
    protected function resolveDashboardReadiness(
        CampaignRequest $request,
        bool $registrationPassed,
        bool $trainingCompletionPassed,
        int $qualified,
        int $minimum,
    ): array {
        if ($request->simulation_event_id) {
            return [
                'key' => 'simulation_created',
                'label' => 'Simulation Created',
                'tone' => 'blue',
            ];
        }

        if (! $registrationPassed) {
            return [
                'key' => 'registration_open',
                'label' => 'Registration Open',
                'tone' => 'amber',
            ];
        }

        $qualificationMet = $minimum <= 0 || $qualified >= $minimum;
        if (! $qualificationMet || ! $trainingCompletionPassed) {
            return [
                'key' => 'waiting_qualification',
                'label' => 'Waiting Qualification',
                'tone' => 'orange',
            ];
        }

        return [
            'key' => 'ready',
            'label' => 'Ready',
            'tone' => 'emerald',
        ];
    }

    /**
     * @return array{key:string,label:string,tone:string}
     */
    protected function publishedExercisePlanCount(): int
    {
        if (self::$publishedExercisePlanCount === null) {
            self::$publishedExercisePlanCount = SimulationExerciseTemplate::query()
                ->where('status', SimulationExerciseTemplate::STATUS_PUBLISHED)
                ->count();
        }

        return self::$publishedExercisePlanCount;
    }

    /**
     * @return array{key:string,label:string,tone:string}
     */
    protected function resolveDashboardPlanStatus(CampaignRequest $request, array $readiness): array
    {
        $event = $request->simulationEvent;
        if ($event && in_array((string) $event->status, ['completed', 'ended', 'archived'], true)) {
            return [
                'key' => 'completed',
                'label' => 'Completed',
                'tone' => 'slate',
            ];
        }

        if ($request->simulation_event_id) {
            return [
                'key' => 'generated',
                'label' => 'Generated',
                'tone' => 'blue',
            ];
        }

        return [
            'key' => 'not_created',
            'label' => 'Not Created',
            'tone' => 'slate',
        ];
    }

    /**
     * @return array{0:bool,1:?string}
     */
    protected function resolveCreatePlanAccess(
        CampaignRequest $request,
        bool $registrationPassed,
        bool $trainingCompletionPassed,
        int $qualified,
        int $minimum,
    ): array {
        if ($request->simulation_event_id) {
            return [false, null];
        }

        if (! $registrationPassed) {
            return [false, 'Registration is still open.'];
        }

        if (! $trainingCompletionPassed) {
            return [false, 'Training completion period has not ended.'];
        }

        if ($minimum > 0 && $qualified < $minimum) {
            return [false, 'Minimum qualified participants have not been reached.'];
        }

        return [true, null];
    }

    /**
     * @param  array<string, mixed>  $payload
     * @deprecated Use SimulationPlanningCampaignImport::resolveRecommendedCommunity()
     */
    protected function resolvePrimaryCommunity(array $payload): string
    {
        $recommended = $payload['recommended_communities'] ?? null;
        if (is_array($recommended) && is_array($recommended['communities'] ?? null)) {
            $first = $recommended['communities'][0] ?? null;
            if (is_array($first)) {
                return (string) ($first['barangay_name'] ?? '—');
            }
        }

        return '—';
    }

    public static function resolveParticipantThresholds(array $sessions): array
    {
        $first = is_array($sessions[0] ?? null) ? $sessions[0] : [];
        $expected = (int) ($first['maximum_participants'] ?? 0);
        $minimum = (int) ($first['minimum_qualified_participants'] ?? 0);

        if ($minimum <= 0 && $expected > 0) {
            $minimum = (int) max(1, round($expected * 0.67));
        }

        return [
            'expected_participants' => $expected > 0 ? $expected : null,
            'minimum_qualified_participants' => $minimum > 0 ? $minimum : null,
        ];
    }

    public function serializePlan(?SimulationPlan $plan): ?array
    {
        if (! $plan) {
            return null;
        }

        return [
            'exercise_type' => $plan->exercise_type,
            'exercise_complexity' => $plan->exercise_complexity,
            'estimated_duration' => $plan->estimated_duration,
            'estimated_responders' => $plan->estimated_responders,
            'estimated_observers' => $plan->estimated_observers,
            'estimated_evaluators' => $plan->estimated_evaluators,
            'simulation_title' => $plan->simulation_title,
            'simulation_scenario' => $plan->simulation_scenario,
            'simulation_objectives' => $plan->simulation_objectives,
            'simulation_description' => $plan->simulation_description,
            'event_date' => optional($plan->event_date)->toDateString(),
            'start_time' => $plan->start_time,
            'end_time' => $plan->end_time,
            'venue' => $plan->venue,
            'team_assignments' => $plan->team_assignments ?? [],
            'lead_coordinator' => $plan->lead_coordinator ?? $plan->team_leader,
            'planning_officer' => $plan->planning_officer,
            'medical_team' => $plan->medical_team,
            'rescue_team' => $plan->rescue_team,
            'communication_team' => $plan->communication_team,
            'team_leader' => $plan->team_leader,
            'required_equipment' => $plan->required_equipment,
            'required_resources' => $plan->required_resources,
            'safety_officer' => $plan->safety_officer,
            'assembly_area' => $plan->assembly_area,
            'evacuation_route' => $plan->evacuation_route,
            'evaluation_criteria' => $plan->evaluation_criteria,
            'emergency_contact_person' => $plan->emergency_contact_person,
            'remarks' => $plan->remarks ?? $plan->additional_notes,
            'additional_notes' => $plan->additional_notes,
            'status' => $plan->status,
        ];
    }

    /**
     * @return array{key:string,label:string,completed:bool,message:string}
     */
    protected function checkItem(string $key, string $label, bool $completed, string $message): array
    {
        return [
            'key' => $key,
            'label' => $label,
            'completed' => $completed,
            'message' => $completed ? '' : $message,
        ];
    }

    /**
     * @param  mixed  $value
     */
    protected function hasText($value): bool
    {
        return trim((string) $value) !== '';
    }

    /**
     * @param  array<string, mixed>|null  $plan
     * @return array<int, array{key:string,label:string,completed:bool,message:string}>
     */
    protected function exerciseTypeSpecificChecks(string $exerciseType, ?array $plan): array
    {
        $plan = $plan ?? [];

        return match ($exerciseType) {
            'Drill' => [
                $this->checkItem('drill_objectives', 'Objectives', $this->hasText($plan['simulation_objectives'] ?? null), 'Objectives are required for a Drill.'),
                $this->checkItem('drill_scenario', 'Scenario', $this->hasText($plan['simulation_scenario'] ?? null), 'Scenario is required for a Drill.'),
                $this->checkItem('drill_safety_officer', 'Safety Officer', $this->hasText($plan['safety_officer'] ?? null), 'Safety Officer is required for a Drill.'),
                $this->checkItem('drill_assembly_area', 'Assembly Area', $this->hasText($plan['assembly_area'] ?? null), 'Assembly Area is required for a Drill.'),
                $this->checkItem('drill_evaluation_criteria', 'Evaluation Criteria', $this->hasText($plan['evaluation_criteria'] ?? null), 'Evaluation Criteria is required for a Drill.'),
            ],
            'Functional Exercise (FE)' => [
                $this->checkItem('fe_incident_commander', 'Incident Commander', $this->hasText($plan['lead_coordinator'] ?? null), 'Incident Commander is required for a Functional Exercise.'),
                $this->checkItem('fe_communication_team', 'Communication Team', $this->hasText($plan['communication_team'] ?? null), 'Communication Team is required for a Functional Exercise.'),
                $this->checkItem('fe_operations_team', 'Operations Team', $this->hasText($plan['team_assignments'] ?? null), 'Operations Team is required for a Functional Exercise.'),
                $this->checkItem('fe_logistics_team', 'Logistics Team', $this->hasText($plan['required_resources'] ?? null), 'Logistics Team planning is required for a Functional Exercise.'),
                $this->checkItem('fe_evaluators', 'Evaluators', ((int) ($plan['estimated_evaluators'] ?? 0)) > 0, 'At least one evaluator is required for a Functional Exercise.'),
            ],
            'Full-Scale Exercise (FSE)' => [
                $this->checkItem('fse_incident_commander', 'Incident Commander', $this->hasText($plan['lead_coordinator'] ?? null), 'Incident Commander is required for a Full-Scale Exercise.'),
                $this->checkItem('fse_rescue_team', 'Rescue Team', $this->hasText($plan['rescue_team'] ?? null), 'Rescue Team is required for a Full-Scale Exercise.'),
                $this->checkItem('fse_medical_team', 'Medical Team', $this->hasText($plan['medical_team'] ?? null), 'Medical Team is required for a Full-Scale Exercise.'),
                $this->checkItem('fse_fire_response_team', 'Fire Response Team', $this->hasText($plan['team_assignments'] ?? null), 'Fire Response Team is required for a Full-Scale Exercise.'),
                $this->checkItem('fse_police_coordination', 'Police Coordination', $this->hasText($plan['planning_officer'] ?? null), 'Police Coordination is required for a Full-Scale Exercise.'),
                $this->checkItem('fse_ambulance', 'Ambulance', $this->containsKeyword($plan['required_equipment'] ?? null, 'ambulance'), 'Ambulance must be included in required equipment.'),
                $this->checkItem('fse_fire_truck', 'Fire Truck', $this->containsKeyword($plan['required_equipment'] ?? null, 'fire truck'), 'Fire Truck must be included in required equipment.'),
                $this->checkItem('fse_traffic_control', 'Traffic Control', $this->containsKeyword($plan['required_resources'] ?? null, 'traffic'), 'Traffic Control must be included in required resources.'),
                $this->checkItem('fse_evacuation_area', 'Evacuation Area', $this->hasText($plan['assembly_area'] ?? null), 'Evacuation Area is required for a Full-Scale Exercise.'),
                $this->checkItem('fse_media_coordinator', 'Media Coordinator', $this->hasText($plan['remarks'] ?? null), 'Media Coordinator details are required in remarks.'),
                $this->checkItem('fse_communication_team', 'Communication Team', $this->hasText($plan['communication_team'] ?? null), 'Communication Team is required for a Full-Scale Exercise.'),
                $this->checkItem('fse_logistics_team', 'Logistics Team', $this->hasText($plan['required_resources'] ?? null), 'Logistics Team planning is required for a Full-Scale Exercise.'),
                $this->checkItem('fse_safety_officer', 'Safety Officer', $this->hasText($plan['safety_officer'] ?? null), 'Safety Officer is required for a Full-Scale Exercise.'),
            ],
            default => [],
        };
    }

    /**
     * @param  mixed  $value
     */
    protected function containsKeyword($value, string $keyword): bool
    {
        return str_contains(strtolower((string) $value), strtolower($keyword));
    }

    protected function exerciseTypeTone(string $exerciseType): string
    {
        return self::EXERCISE_TYPES[$exerciseType]['tone'] ?? 'slate';
    }

    protected function mapExerciseTypeToEventCategory(?string $exerciseType): string
    {
        return match ($exerciseType) {
            'Functional Exercise' => 'Full-scale Exercise',
            'Full-Scale Exercise' => 'Full-scale Exercise',
            default => 'Drill',
        };
    }

    /**
     * @return array<int, string>
     */
    protected function scenarioLibrary(): array
    {
        return SimulationPlan::query()
            ->whereNotNull('simulation_scenario')
            ->where('simulation_scenario', '!=', '')
            ->orderBy('simulation_scenario')
            ->pluck('simulation_scenario')
            ->unique()
            ->values()
            ->all();
    }

    /**
     * @return array<int, array{id:int,name:string,specialization:?string}>
     */
    protected function trainerOptions(CampaignRequest $request): array
    {
        $payload = is_array($request->payload) ? $request->payload : [];
        $assigned = collect(is_array($payload['assigned_trainers'] ?? null) ? $payload['assigned_trainers'] : [])
            ->map(function ($trainer) {
                if (! is_array($trainer)) {
                    return null;
                }
                return [
                    'id' => (int) ($trainer['id'] ?? 0),
                    'name' => (string) ($trainer['name'] ?? ''),
                    'specialization' => isset($trainer['specialization']) ? (string) $trainer['specialization'] : null,
                ];
            })
            ->filter(fn ($item) => is_array($item) && $item['id'] > 0 && trim($item['name']) !== '');

        return $assigned->values()->all();
    }

    /**
     * @return array{simulation_title:string,objectives:array<int,string>}
     */
    protected function parseAiPlanningDraft(string $text, string $exerciseType, string $scenario): array
    {
        $cleanText = preg_replace('/```json\s*/i', '', $text);
        $cleanText = preg_replace('/```\s*/', '', $cleanText ?? '');
        $cleanText = trim((string) $cleanText);

        if (! preg_match('/\{[\s\S]*\}/', $cleanText, $matches)) {
            throw new \RuntimeException('Could not extract JSON from AI response.');
        }

        $json = json_decode($matches[0], true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new \RuntimeException('Invalid JSON in AI response: '.json_last_error_msg());
        }

        $title = trim((string) ($json['simulation_title'] ?? ''));
        if ($title === '') {
            $title = $exerciseType.' - '.$scenario;
        }

        $objectives = $json['objectives'] ?? [];
        if (! is_array($objectives)) {
            $objectives = [];
        }

        $objectives = array_values(array_filter(array_map(function ($item) {
            $value = trim((string) $item);
            $value = preg_replace('/^[+•\-\d\.\)\s]+/', '', $value ?? '');
            return trim((string) $value);
        }, $objectives)));

        if ($objectives === []) {
            throw new \RuntimeException('AI response did not include objectives.');
        }

        return [
            'simulation_title' => $title,
            'objectives' => $objectives,
        ];
    }

    /**
     * @return Collection<int, int>
     */
    public function qualifiedParticipantIdsForCampaign(CampaignRequest $request): Collection
    {
        $trainingModuleId = (int) $request->training_module_id;
        $participantIds = $this->registeredParticipantIdsForCampaign($request);
        $totalLessons = TrainingModule::query()->withCount('contents')->find($trainingModuleId)?->contents_count ?? 0;

        return $participantIds
            ->filter(fn (int $userId) => $this->resolveModuleTrainingStatus($userId, $trainingModuleId, $totalLessons) === 'Completed')
            ->values();
    }

    public function syncQualifiedParticipantsToEvent(SimulationEvent $event, ?int $approvedBy = null): int
    {
        if (! $event->campaign_request_id || ! $event->training_module_id) {
            return 0;
        }

        $campaign = CampaignRequest::query()->find($event->campaign_request_id);
        if (! $campaign) {
            return 0;
        }

        $qualifiedIds = $this->qualifiedParticipantIdsForCampaign($campaign);
        if ($qualifiedIds->isEmpty()) {
            return 0;
        }

        $now = now();
        $synced = 0;

        foreach ($qualifiedIds as $userId) {
            $registration = EventRegistration::query()->firstOrNew([
                'simulation_event_id' => $event->id,
                'user_id' => $userId,
            ]);

            if ($registration->exists && $registration->status === 'approved') {
                continue;
            }

            $registration->fill([
                'status' => 'approved',
                'registered_at' => $registration->registered_at ?? $now,
                'approved_at' => $registration->approved_at ?? $now,
                'approved_by' => $registration->approved_by ?? $approvedBy,
            ]);
            $registration->save();
            $synced++;
        }

        return $synced;
    }

    public function isModuleTrainingCompleted(int $userId, int $trainingModuleId): bool
    {
        $totalLessons = TrainingModule::query()->withCount('contents')->find($trainingModuleId)?->contents_count ?? 0;

        return $this->resolveModuleTrainingStatus($userId, $trainingModuleId, $totalLessons) === 'Completed';
    }

    public function syncQualifiedParticipantAcrossCampaignEvents(int $userId, int $trainingModuleId): void
    {
        $user = User::query()->find($userId);
        if ($user?->role !== 'PARTICIPANT') {
            return;
        }

        $campaignIds = CampaignRegistration::query()
            ->where('user_id', $userId)
            ->where('training_module_id', $trainingModuleId)
            ->where('registration_status', CampaignRegistration::STATUS_REGISTERED)
            ->pluck('campaign_request_id');

        foreach ($campaignIds as $campaignId) {
            $campaign = CampaignRequest::query()->find((int) $campaignId);
            if (! $campaign || (int) $campaign->training_module_id !== $trainingModuleId) {
                continue;
            }

            if (! $this->qualifiedParticipantIdsForCampaign($campaign)->contains($userId)) {
                continue;
            }

            SimulationEvent::query()
                ->where('campaign_request_id', $campaign->id)
                ->where('training_module_id', $trainingModuleId)
                ->whereNotIn('status', ['completed', 'ended', 'archived', 'cancelled'])
                ->each(fn (SimulationEvent $event) => $this->syncQualifiedParticipantsToEvent($event));
        }
    }
}
