<?php

namespace App\Policies;

use App\Models\SimulationEvent;
use App\Models\User;

class SimulationEventPolicy
{
    public function viewAny(User $user): bool
    {
        return in_array($user->role, ['LGU_ADMIN', 'LGU_TRAINER', 'PARTICIPANT'], true);
    }

    public function view(User $user, SimulationEvent $event): bool
    {
        if (in_array($user->role, ['LGU_ADMIN', 'LGU_TRAINER'], true)) {
            return true;
        }

        return $user->role === 'PARTICIPANT'
            && in_array($event->status, ['published', 'ongoing', 'ended', 'completed', 'archived'], true);
    }

    public function create(User $user): bool
    {
        return in_array($user->role, ['LGU_ADMIN', 'LGU_TRAINER'], true);
    }

    public function update(User $user, SimulationEvent $event): bool
    {
        return in_array($user->role, ['LGU_ADMIN', 'LGU_TRAINER'], true);
    }

    public function delete(User $user, SimulationEvent $event): bool
    {
        return $user->role === 'LGU_ADMIN' && $event->status === 'draft';
    }

    public function export(User $user): bool
    {
        return in_array($user->role, ['LGU_ADMIN', 'LGU_TRAINER'], true);
    }
}
