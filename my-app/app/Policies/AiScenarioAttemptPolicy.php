<?php

namespace App\Policies;

use App\Models\AiScenarioAttempt;
use App\Models\User;

class AiScenarioAttemptPolicy
{
    public function view(User $user, AiScenarioAttempt $attempt): bool
    {
        return $user->role === 'PARTICIPANT' && $attempt->user_id === $user->id;
    }

    public function update(User $user, AiScenarioAttempt $attempt): bool
    {
        return $this->view($user, $attempt) && $attempt->isInProgress();
    }

    public function submit(User $user, AiScenarioAttempt $attempt): bool
    {
        return $this->view($user, $attempt) && ! $attempt->isCompleted();
    }
}
