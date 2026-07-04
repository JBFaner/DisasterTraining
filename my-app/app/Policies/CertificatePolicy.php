<?php

namespace App\Policies;

use App\Models\Certificate;
use App\Models\User;

class CertificatePolicy
{
    public function viewAny(User $user): bool
    {
        return in_array($user->role, ['LGU_ADMIN', 'LGU_TRAINER', 'PARTICIPANT'], true);
    }

    public function view(User $user, Certificate $certificate): bool
    {
        if (in_array($user->role, ['LGU_ADMIN', 'LGU_TRAINER'], true)) {
            return true;
        }

        return $user->role === 'PARTICIPANT' && $certificate->user_id === $user->id;
    }

    public function issue(User $user): bool
    {
        return in_array($user->role, ['LGU_ADMIN', 'LGU_TRAINER'], true);
    }

    public function revoke(User $user, Certificate $certificate): bool
    {
        return $user->role === 'LGU_ADMIN' && $certificate->revoked_at === null;
    }
}
