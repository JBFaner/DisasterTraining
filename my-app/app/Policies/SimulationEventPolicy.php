<?php

namespace App\Policies;

use App\Models\SimulationEvent;
use App\Models\User;
use App\Support\PortalAuth;

class SimulationEventPolicy
{
    public function viewAny(User $user): bool
    {
        return PortalAuth::canAccessAdminSimulationEvents($user->role)
            || $user->role === 'PARTICIPANT';
    }

    public function view(User $user, SimulationEvent $event): bool
    {
        if (PortalAuth::canAccessAdminSimulationEvents($user->role)) {
            return true;
        }

        return $user->role === 'PARTICIPANT'
            && in_array($event->status, ['published', 'ongoing', 'ended', 'completed', 'archived'], true);
    }

    public function create(User $user): bool
    {
        return PortalAuth::canManageOperations($user->role);
    }

    public function update(User $user, SimulationEvent $event): bool
    {
        return PortalAuth::canManageOperations($user->role);
    }

    public function delete(User $user, SimulationEvent $event): bool
    {
        return $user->role === 'LGU_ADMIN' && $event->status === 'draft';
    }

    public function export(User $user): bool
    {
        return PortalAuth::canManageOperations($user->role);
    }
}
