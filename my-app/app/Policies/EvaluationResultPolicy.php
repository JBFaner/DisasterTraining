<?php

namespace App\Policies;

use App\Models\EvaluationResult;
use App\Models\User;
use App\Support\PortalAuth;

class EvaluationResultPolicy
{
    public function viewAny(User $user): bool
    {
        return PortalAuth::canEvaluate($user->role) || $user->role === 'PARTICIPANT';
    }

    public function view(User $user, EvaluationResult $evaluationResult): bool
    {
        if (PortalAuth::canEvaluate($user->role)) {
            return true;
        }

        return $user->role === 'PARTICIPANT' && $evaluationResult->participant_id === $user->id;
    }

    public function delete(User $user, EvaluationResult $evaluationResult): bool
    {
        return $user->role === 'LGU_ADMIN';
    }

    public function reset(User $user, EvaluationResult $evaluationResult): bool
    {
        return $user->role === 'LGU_ADMIN'
            && $evaluationResult->status === EvaluationResult::STATUS_NEEDS_IMPROVEMENT;
    }
}
