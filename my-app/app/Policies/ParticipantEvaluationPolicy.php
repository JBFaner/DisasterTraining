<?php

namespace App\Policies;

use App\Models\ParticipantEvaluation;
use App\Models\User;
use App\Support\PortalAuth;

class ParticipantEvaluationPolicy
{
    public function view(User $user, ParticipantEvaluation $participantEvaluation): bool
    {
        if (PortalAuth::canEvaluate($user->role)) {
            return true;
        }

        return $user->role === 'PARTICIPANT'
            && (int) $participantEvaluation->user_id === (int) $user->id
            && $participantEvaluation->submitted_at !== null;
    }
}
