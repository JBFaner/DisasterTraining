<?php

namespace App\Policies;

use App\Models\Resource;
use App\Models\User;

class ResourcePolicy
{
    public function viewAny(User $user): bool
    {
        return in_array($user->role, ['LGU_ADMIN', 'LGU_TRAINER'], true);
    }

    public function view(User $user, Resource $resource): bool
    {
        return in_array($user->role, ['LGU_ADMIN', 'LGU_TRAINER'], true);
    }

    public function create(User $user): bool
    {
        return in_array($user->role, ['LGU_ADMIN', 'LGU_TRAINER'], true);
    }

    public function update(User $user, Resource $resource): bool
    {
        return in_array($user->role, ['LGU_ADMIN', 'LGU_TRAINER'], true);
    }

    public function delete(User $user, Resource $resource): bool
    {
        return $user->role === 'LGU_ADMIN';
    }
}
