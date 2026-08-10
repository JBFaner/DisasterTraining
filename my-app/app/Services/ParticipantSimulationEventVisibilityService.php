<?php

namespace App\Services;

use App\Models\AiScenarioAttempt;
use App\Models\CampaignRegistration;
use App\Models\EventRegistration;
use App\Models\SimulationEvent;
use App\Models\TrainingModule;
use App\Models\User;
use Illuminate\Support\Collection;

class ParticipantSimulationEventVisibilityService
{
    /** @var array<int, list<int>> */
    private array $finishedModuleIdsByUser = [];

    /**
     * Events a participant should see:
     * - any event they already registered for (history, including cancelled/completed)
     * - published upcoming batches for campaigns they are enrolled in, only when they
     *   have finished that event's training module (module-specific unlock)
     * - excluding published upcoming batches for modules whose simulation they already completed
     *
     * @return Collection<int, SimulationEvent>
     */
    public function visibleEventsFor(User $user): Collection
    {
        $campaignIds = $this->enrolledCampaignIds($user);
        $completedModuleIds = $this->completedModuleIdsForSimulation($user);
        $registeredEventIds = EventRegistration::query()
            ->where('user_id', $user->id)
            ->pluck('simulation_event_id')
            ->map(fn ($id) => (int) $id)
            ->all();

        $query = SimulationEvent::query()
            ->with([
                'scenario.trainingModule.lessons',
                'campaignRequest:id,training_module_id',
                'registrations',
            ])
            ->whereIn('status', ['published', 'ongoing', 'ended', 'completed', 'archived'])
            ->where(function ($builder) use ($registeredEventIds, $campaignIds, $completedModuleIds) {
                if ($registeredEventIds !== []) {
                    $builder->whereIn('id', $registeredEventIds);
                } else {
                    $builder->whereRaw('1 = 0');
                }

                // Open upcoming batches: enrolled campaign + finished that module
                if ($campaignIds !== [] && $completedModuleIds !== []) {
                    $builder->orWhere(function ($open) use ($campaignIds, $completedModuleIds) {
                        $open->where('status', 'published')
                            ->whereIn('campaign_request_id', $campaignIds)
                            ->where(function ($moduleScope) use ($completedModuleIds) {
                                $moduleScope->whereIn('training_module_id', $completedModuleIds)
                                    ->orWhereHas('campaignRequest', function ($campaign) use ($completedModuleIds) {
                                        $campaign->whereIn('training_module_id', $completedModuleIds);
                                    });
                            });
                    });
                }
            })
            ->orderByRaw("CASE
                WHEN status = 'published' THEN 0
                WHEN status = 'ongoing' THEN 1
                WHEN status = 'ended' THEN 2
                WHEN status = 'completed' THEN 3
                ELSE 4
            END")
            ->orderBy('event_date')
            ->orderBy('start_time');

        $events = $query->get();

        // Modules where this participant already finished a simulation batch.
        // Hide other upcoming (published) batches for those modules.
        $finishedSimulationModuleIds = $this->finishedSimulationModuleIds($user);

        if ($finishedSimulationModuleIds !== []) {
            $events = $events
                ->filter(function (SimulationEvent $event) use ($finishedSimulationModuleIds) {
                    if ($event->status !== 'published') {
                        return true;
                    }

                    $moduleId = $this->resolveEventModuleId($event);
                    if (! $moduleId) {
                        return true;
                    }

                    return ! in_array($moduleId, $finishedSimulationModuleIds, true);
                })
                ->values();
        }

        $events->each(function (SimulationEvent $event) use ($user) {
            $event->user_registration = $event->registrations
                ->where('user_id', $user->id)
                ->first();
            $event->can_self_register = $this->canRegister($user, $event);
            $event->module_unlocked = $this->hasCompletedEventModule($user, $event);
            $event->participation_status = $this->participationStatusFor($user, $event);
        });

        return $events;
    }

    /**
     * Module IDs where the participant already completed/ended a registered simulation.
     *
     * @return list<int>
     */
    public function finishedSimulationModuleIds(User $user): array
    {
        $userId = (int) $user->id;
        if (array_key_exists($userId, $this->finishedModuleIdsByUser)) {
            return $this->finishedModuleIdsByUser[$userId];
        }

        $eventIds = EventRegistration::query()
            ->where('user_id', $user->id)
            ->whereIn('status', ['approved', 'pending'])
            ->pluck('simulation_event_id')
            ->map(fn ($id) => (int) $id)
            ->all();

        if ($eventIds === []) {
            return $this->finishedModuleIdsByUser[$userId] = [];
        }

        $events = SimulationEvent::query()
            ->with(['campaignRequest:id,training_module_id', 'scenario:id,training_module_id'])
            ->whereIn('id', $eventIds)
            ->whereIn('status', ['completed', 'ended', 'archived'])
            ->get();

        return $this->finishedModuleIdsByUser[$userId] = $events
            ->map(fn (SimulationEvent $event) => $this->resolveEventModuleId($event))
            ->filter()
            ->map(fn ($id) => (int) $id)
            ->unique()
            ->values()
            ->all();
    }

    /**
     * @return array{joined: bool, completed: bool, label: string|null}
     */
    public function participationStatusFor(User $user, SimulationEvent $event): array
    {
        $registration = $event->relationLoaded('registrations')
            ? $event->registrations->where('user_id', $user->id)->first()
            : EventRegistration::query()
                ->where('simulation_event_id', $event->id)
                ->where('user_id', $user->id)
                ->first();

        $joined = $registration
            && in_array($registration->status, ['approved', 'pending'], true);
        $eventDone = in_array($event->status, ['completed', 'ended', 'archived'], true);
        $completed = $joined && $eventDone && ($registration->status === 'approved');

        $label = null;
        if ($completed) {
            $label = 'Completed';
        } elseif ($joined && $registration->status === 'pending') {
            $label = 'Joined — pending approval';
        } elseif ($joined) {
            $label = 'Joined';
        }

        return [
            'joined' => (bool) $joined,
            'completed' => (bool) $completed,
            'label' => $label,
        ];
    }

    public function canView(User $user, SimulationEvent $event): bool
    {
        if (! in_array($event->status, ['published', 'ongoing', 'ended', 'completed', 'archived'], true)) {
            return false;
        }

        $isRegistered = EventRegistration::query()
            ->where('simulation_event_id', $event->id)
            ->where('user_id', $user->id)
            ->exists();

        if ($isRegistered) {
            return true;
        }

        if ($event->status !== 'published') {
            return false;
        }

        $moduleId = $this->resolveEventModuleId($event);
        if ($moduleId && in_array($moduleId, $this->finishedSimulationModuleIds($user), true)) {
            return false;
        }

        if (! $event->campaign_request_id
            || ! $this->enrolledCampaignIds($user)->contains((int) $event->campaign_request_id)) {
            return false;
        }

        return $this->hasCompletedEventModule($user, $event);
    }

    /**
     * Campaign-enrolled participants may join published sibling batches when the
     * matching training module is finished (even if self_registration_enabled is off).
     */
    public function canRegister(User $user, SimulationEvent $event): bool
    {
        if ($event->status !== 'published') {
            return false;
        }

        $moduleId = $this->resolveEventModuleId($event);
        if ($moduleId && in_array($moduleId, $this->finishedSimulationModuleIds($user), true)) {
            return false;
        }

        if (! $this->hasCompletedEventModule($user, $event)) {
            return false;
        }

        if (EventRegistration::query()
            ->where('simulation_event_id', $event->id)
            ->where('user_id', $user->id)
            ->whereIn('status', ['pending', 'approved'])
            ->exists()) {
            return false;
        }

        if ($event->max_participants) {
            $currentCount = $event->registrations()
                ->where('status', 'approved')
                ->count();
            if ($currentCount >= (int) $event->max_participants) {
                return false;
            }
        }

        if ($event->registration_deadline && now()->greaterThan($event->registration_deadline)) {
            return false;
        }

        $eventStart = $this->eventStartDateTime($event);
        if ($eventStart && now()->greaterThanOrEqualTo($eventStart)) {
            return false;
        }

        if ($event->self_registration_enabled) {
            return true;
        }

        return $event->campaign_request_id
            && $this->enrolledCampaignIds($user)->contains((int) $event->campaign_request_id);
    }

    public function hasCompletedEventModule(User $user, SimulationEvent $event): bool
    {
        $moduleId = $this->resolveEventModuleId($event);
        if (! $moduleId) {
            return false;
        }

        return $this->hasCompletedModuleForSimulation($user, $moduleId);
    }

    /**
     * Module is ready for simulation when all required lessons/quizzes are done,
     * and the Final AI Scenario is passed when that assessment is published.
     */
    public function hasCompletedModuleForSimulation(User $user, int $trainingModuleId): bool
    {
        $module = TrainingModule::query()
            ->with(['contents', 'aiScenarioConfig'])
            ->find($trainingModuleId);

        if (! $module) {
            return false;
        }

        if (! $module->participantHasCompletedAllContents($user->id)) {
            return false;
        }

        if ($module->hasPublishedFinalScenarioAssessment()) {
            return AiScenarioAttempt::query()
                ->where('user_id', $user->id)
                ->where('training_module_id', $trainingModuleId)
                ->where('passed', true)
                ->exists();
        }

        return true;
    }

    /**
     * @return list<int>
     */
    public function completedModuleIdsForSimulation(User $user): array
    {
        $moduleIds = CampaignRegistration::query()
            ->where('user_id', $user->id)
            ->where('registration_status', CampaignRegistration::STATUS_REGISTERED)
            ->pluck('training_module_id')
            ->map(fn ($id) => (int) $id)
            ->unique()
            ->values()
            ->all();

        return array_values(array_filter(
            $moduleIds,
            fn (int $moduleId) => $this->hasCompletedModuleForSimulation($user, $moduleId),
        ));
    }

    /**
     * @return Collection<int, int>
     */
    public function enrolledCampaignIds(User $user): Collection
    {
        return CampaignRegistration::query()
            ->where('user_id', $user->id)
            ->where('registration_status', CampaignRegistration::STATUS_REGISTERED)
            ->pluck('campaign_request_id')
            ->map(fn ($id) => (int) $id)
            ->unique()
            ->values();
    }

    private function resolveEventModuleId(SimulationEvent $event): ?int
    {
        if ($event->training_module_id) {
            return (int) $event->training_module_id;
        }

        $event->loadMissing('campaignRequest:id,training_module_id', 'scenario:id,training_module_id');

        if ($event->campaignRequest?->training_module_id) {
            return (int) $event->campaignRequest->training_module_id;
        }

        if ($event->scenario?->training_module_id) {
            return (int) $event->scenario->training_module_id;
        }

        return null;
    }

    private function eventStartDateTime(SimulationEvent $event): ?\DateTimeInterface
    {
        if (! $event->event_date) {
            return null;
        }

        $eventDate = new \DateTime((string) $event->event_date);
        $parts = $event->start_time ? explode(':', (string) $event->start_time) : [0, 0];
        $eventDate->setTime((int) ($parts[0] ?? 0), (int) ($parts[1] ?? 0), 0);

        return $eventDate;
    }
}
