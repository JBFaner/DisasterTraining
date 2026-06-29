<?php

namespace App\Policies;

use App\Models\EvaluationResult;
use App\Models\User;

class EvaluationResultPolicy
{
    public function viewAny(User $user): bool
    {
        return in_array($user->role, ['LGU_ADMIN', 'LGU_TRAINER', 'PARTICIPANT'], true);
    }

    public function view(User $user, EvaluationResult $evaluationResult): bool
    {
        if (in_array($user->role, ['LGU_ADMIN', 'LGU_TRAINER'], true)) {
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
