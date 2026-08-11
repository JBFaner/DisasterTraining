<?php

namespace App\Policies;

use App\Models\Resource;
use App\Models\User;

class ResourcePolicy
{
    public function viewAny(User $user): bool
    {
        return \App\Support\PortalAuth::canManageOperations($user->role);
    }

    public function view(User $user, Resource $resource): bool
    {
        return \App\Support\PortalAuth::canManageOperations($user->role);
    }

    public function create(User $user): bool
    {
        return \App\Support\PortalAuth::canManageOperations($user->role);
    }

    public function update(User $user, Resource $resource): bool
    {
        return \App\Support\PortalAuth::canManageOperations($user->role);
    }

    public function delete(User $user, Resource $resource): bool
    {
        return $user->role === 'LGU_ADMIN';
    }
}
