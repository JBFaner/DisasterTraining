<?php

namespace App\Services;

use App\Models\AiScenarioAttempt;
use App\Models\Certificate;
use App\Models\EvaluationResult;
use App\Models\EventRegistration;
use App\Models\SimulationEvent;
use App\Models\TrainingModule;
use App\Models\User;
use Carbon\Carbon;

class ParticipantDashboardService
{
    public function __construct(
        private readonly CampaignRegistrationService $registrationService,
        private readonly TrainingModuleCardStatsService $moduleStatsService,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function buildPayload(User $user): array
    {
        $registeredModuleIds = $this->registrationService->registeredModuleIdsFor($user);

        $modulesQuery = TrainingModule::query()
            ->withCount('contents as lesson_count')
            ->where('status', 'published')
            ->orderByDesc('updated_at');

        if ($registeredModuleIds !== []) {
            $modulesQuery->whereIn('id', $registeredModuleIds);
        }

        $modules = $modulesQuery->limit(12)->get();
        $this->moduleStatsService->enrichParticipantModules($modules, (int) $user->id);

        $moduleIds = $modules->pluck('id')->map(fn ($id) => (int) $id)->all();

        $passedEvaluationModuleIds = EvaluationResult::query()
            ->where('participant_id', $user->id)
            ->where('status', EvaluationResult::STATUS_PASSED)
            ->when($moduleIds !== [], fn ($q) => $q->whereIn('training_module_id', $moduleIds))
            ->pluck('training_module_id')
            ->map(fn ($id) => (int) $id)
            ->unique()
            ->all();

        $inProgressAttempts = AiScenarioAttempt::query()
            ->where('user_id', $user->id)
            ->where('status', AiScenarioAttempt::STATUS_IN_PROGRESS)
            ->when($moduleIds !== [], fn ($q) => $q->whereIn('training_module_id', $moduleIds))
            ->get()
            ->keyBy('training_module_id');

        $moduleProgress = $modules->map(function (TrainingModule $module) use ($passedEvaluationModuleIds, $inProgressAttempts) {
            $moduleId = (int) $module->id;
            $progress = (int) ($module->completion_percentage ?? 0);
            $hasPassedAssessment = in_array($moduleId, $passedEvaluationModuleIds, true);
            $inProgressAttempt = $inProgressAttempts->get($moduleId);

            return [
                'id' => $moduleId,
                'title' => $module->title,
                'category' => $module->category,
                'lesson_count' => (int) ($module->lesson_count ?? 0),
                'progress_percent' => $progress,
                'assessment_passed' => $hasPassedAssessment,
                'assessment_in_progress' => $inProgressAttempt !== null,
                'assessment_attempt_id' => $inProgressAttempt?->id,
            ];
        })->values()->all();

        $continueModule = $this->resolveContinueModule($moduleProgress);

        $evaluationsCount = EvaluationResult::query()
            ->where('participant_id', $user->id)
            ->count();

        $certificatesCount = Certificate::query()
            ->where('user_id', $user->id)
            ->whereNull('revoked_at')
            ->count();

        $today = Carbon::today();

        $registrations = EventRegistration::query()
            ->with('simulationEvent')
            ->where('user_id', $user->id)
            ->whereIn('status', ['pending', 'approved'])
            ->get();

        $events = SimulationEvent::query()
            ->whereIn('status', ['published', 'ongoing'])
            ->whereDate('event_date', '>=', $today)
            ->orderBy('event_date')
            ->orderBy('start_time')
            ->limit(8)
            ->get();

        $registeredEventIds = $registrations
            ->pluck('simulation_event_id')
            ->map(fn ($id) => (int) $id)
            ->all();

        $upcomingEvents = $events->map(function (SimulationEvent $event) use ($registeredEventIds, $registrations) {
            $registration = $registrations->firstWhere('simulation_event_id', $event->id);

            return [
                'id' => (int) $event->id,
                'title' => $event->title,
                'event_date' => $event->event_date?->toDateString(),
                'start_time' => $event->start_time,
                'location' => $event->location,
                'disaster_type' => $event->disaster_type,
                'status' => $event->status,
                'is_registered' => in_array((int) $event->id, $registeredEventIds, true),
                'registration_status' => $registration?->status,
            ];
        })->values()->all();

        $modulesInProgress = collect($moduleProgress)->filter(
            fn (array $module) => $module['progress_percent'] > 0 && $module['progress_percent'] < 100
        )->count();

        $modulesCompleted = collect($moduleProgress)->filter(
            fn (array $module) => $module['progress_percent'] >= 100 || $module['assessment_passed']
        )->count();

        $campaignTrainings = $this->registrationService
            ->trainingHistoryFor($user)
            ->take(3)
            ->values()
            ->all();

        $nextSteps = $this->buildNextSteps(
            $moduleProgress,
            $continueModule,
            $upcomingEvents,
            $evaluationsCount,
            $certificatesCount,
            $campaignTrainings,
            $registeredModuleIds,
        );

        return [
            'user_name' => $user->name,
            'summary' => [
                'modules_available' => count($moduleProgress),
                'modules_in_progress' => $modulesInProgress,
                'modules_completed' => $modulesCompleted,
                'evaluations_count' => $evaluationsCount,
                'certificates_count' => $certificatesCount,
                'registered_events' => $registrations->where('status', 'approved')->count(),
                'pending_event_registrations' => $registrations->where('status', 'pending')->count(),
            ],
            'continue_learning' => $continueModule,
            'module_progress' => $moduleProgress,
            'upcoming_events' => $upcomingEvents,
            'campaign_trainings' => $campaignTrainings,
            'next_steps' => $nextSteps,
            'has_campaign_enrollment' => $registeredModuleIds !== [],
        ];
    }

    /**
     * @param  list<array<string, mixed>>  $moduleProgress
     * @return array<string, mixed>|null
     */
    private function resolveContinueModule(array $moduleProgress): ?array
    {
        $collection = collect($moduleProgress);

        $inProgress = $collection->first(
            fn (array $module) => $module['progress_percent'] > 0 && $module['progress_percent'] < 100
        );

        if ($inProgress) {
            return $inProgress;
        }

        $needsAssessment = $collection->first(
            fn (array $module) => $module['progress_percent'] >= 100 && ! $module['assessment_passed']
        );

        if ($needsAssessment) {
            return $needsAssessment;
        }

        return $collection->first(fn (array $module) => $module['progress_percent'] === 0)
            ?? $collection->first();
    }

    /**
     * @param  list<array<string, mixed>>  $moduleProgress
     * @param  array<string, mixed>|null  $continueModule
     * @param  list<array<string, mixed>>  $upcomingEvents
     * @param  list<array<string, mixed>>  $campaignTrainings
     * @param  list<int>  $registeredModuleIds
     * @return list<array<string, mixed>>
     */
    private function buildNextSteps(
        array $moduleProgress,
        ?array $continueModule,
        array $upcomingEvents,
        int $evaluationsCount,
        int $certificatesCount,
        array $campaignTrainings,
        array $registeredModuleIds,
    ): array {
        $steps = [];

        if ($continueModule) {
            $moduleId = (int) $continueModule['id'];
            $progress = (int) ($continueModule['progress_percent'] ?? 0);

            if ($progress === 0) {
                $steps[] = [
                    'id' => 'start-module',
                    'priority' => 1,
                    'title' => 'Start your training',
                    'description' => "Open \"{$continueModule['title']}\" and complete the first lesson.",
                    'href' => "/participant/training-modules/{$moduleId}",
                    'action_label' => 'Open module',
                ];
            } elseif ($progress < 100) {
                $steps[] = [
                    'id' => 'continue-module',
                    'priority' => 1,
                    'title' => 'Continue learning',
                    'description' => "You are {$progress}% through \"{$continueModule['title']}\". Pick up where you left off.",
                    'href' => "/participant/training-modules/{$moduleId}",
                    'action_label' => 'Continue',
                ];
            } elseif (! ($continueModule['assessment_passed'] ?? false)) {
                if ($continueModule['assessment_in_progress'] ?? false) {
                    $attemptId = $continueModule['assessment_attempt_id'] ?? null;
                    $steps[] = [
                        'id' => 'resume-assessment',
                        'priority' => 1,
                        'title' => 'Resume Final AI Assessment',
                        'description' => "Finish your in-progress assessment for \"{$continueModule['title']}\".",
                        'href' => $attemptId
                            ? "/participant/ai-scenario-attempts/{$attemptId}"
                            : "/participant/training-modules/{$moduleId}",
                        'action_label' => 'Resume assessment',
                    ];
                } else {
                    $steps[] = [
                        'id' => 'take-assessment',
                        'priority' => 1,
                        'title' => 'Take Final AI Scenario Assessment',
                        'description' => "All lessons are done for \"{$continueModule['title']}\". Pass the assessment to unlock your evaluation report.",
                        'href' => "/participant/training-modules/{$moduleId}",
                        'action_label' => 'Start assessment',
                    ];
                }
            }
        } elseif ($registeredModuleIds !== []) {
            $steps[] = [
                'id' => 'wait-modules',
                'priority' => 2,
                'title' => 'Training modules coming soon',
                'description' => 'You are enrolled in a campaign. Modules will appear here once they are published.',
                'href' => '/participant/my-trainings',
                'action_label' => 'View My Trainings',
            ];
        } else {
            $steps[] = [
                'id' => 'browse-modules',
                'priority' => 2,
                'title' => 'Browse training modules',
                'description' => 'Explore published disaster preparedness courses and start self-paced learning.',
                'href' => '/participant/training-modules',
                'action_label' => 'View modules',
            ];
        }

        $today = Carbon::today()->toDateString();
        $eventToday = collect($upcomingEvents)->first(
            fn (array $event) => ($event['event_date'] ?? null) === $today && ($event['is_registered'] ?? false)
        );

        if ($eventToday) {
            $steps[] = [
                'id' => 'event-today',
                'priority' => 1,
                'title' => 'Simulation event today',
                'description' => "\"{$eventToday['title']}\" is scheduled for today. Check event details and arrive on time.",
                'href' => '/participant/simulation-events/'.((int) $eventToday['id']),
                'action_label' => 'View event',
            ];
        } else {
            $openEvent = collect($upcomingEvents)->first(fn (array $event) => ! ($event['is_registered'] ?? false));
            if ($openEvent) {
                $steps[] = [
                    'id' => 'register-event',
                    'priority' => 3,
                    'title' => 'Join a simulation event',
                    'description' => "Register for \"{$openEvent['title']}\" to practice in a live drill.",
                    'href' => '/participant/simulation-events/'.((int) $openEvent['id']),
                    'action_label' => 'Register',
                ];
            }
        }

        if ($evaluationsCount === 0 && $continueModule && (int) ($continueModule['progress_percent'] ?? 0) === 0) {
            // Already covered by start-module step; skip duplicate evaluation hint.
        } elseif ($evaluationsCount === 0 && ! empty($moduleProgress)) {
            $steps[] = [
                'id' => 'evaluation-empty',
                'priority' => 4,
                'title' => 'Evaluation results appear after assessment',
                'description' => 'Complete a module\'s Final AI Scenario Assessment to see scores under Evaluation Results.',
                'href' => '/participant/evaluations',
                'action_label' => 'Evaluation Results',
            ];
        }

        if ($certificatesCount > 0) {
            $steps[] = [
                'id' => 'view-certificates',
                'priority' => 5,
                'title' => 'View your certificates',
                'description' => "You have {$certificatesCount} certificate(s) ready to view or download.",
                'href' => '/participant/certification',
                'action_label' => 'My Certificates',
            ];
        } elseif ($evaluationsCount > 0 || ! empty($moduleProgress)) {
            $steps[] = [
                'id' => 'certificate-eligibility',
                'priority' => 5,
                'title' => 'Check certificate eligibility',
                'description' => 'See self-paced vs event paths, requirements met, and what to do next on My Certificates.',
                'href' => '/participant/certification',
                'action_label' => 'My Certificates',
            ];
        }

        if ($campaignTrainings === [] && $registeredModuleIds === []) {
            $steps[] = [
                'id' => 'campaign-hint',
                'priority' => 6,
                'title' => 'Joined via campaign link?',
                'description' => 'If your barangay shared a registration link, use it to enroll — then track progress under My Trainings.',
                'href' => '/participant/my-trainings',
                'action_label' => 'My Trainings',
            ];
        }

        usort($steps, fn (array $a, array $b) => ($a['priority'] ?? 99) <=> ($b['priority'] ?? 99));

        return array_slice($steps, 0, 5);
    }
}
