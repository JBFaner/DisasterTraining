<?php

namespace App\Policies;

use App\Models\ParticipantEvaluation;
use App\Models\User;

class ParticipantEvaluationPolicy
{
    public function view(User $user, ParticipantEvaluation $participantEvaluation): bool
    {
        if (in_array($user->role, ['LGU_ADMIN', 'LGU_TRAINER'], true)) {
            return true;
        }

        return $user->role === 'PARTICIPANT'
            && (int) $participantEvaluation->user_id === (int) $user->id
            && $participantEvaluation->submitted_at !== null;
    }
}
