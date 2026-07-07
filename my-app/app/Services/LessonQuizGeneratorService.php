<?php

namespace App\Services;

use App\Models\LessonQuizConfig;
use App\Models\User;

class LessonQuizGeneratorService
{
    public function __construct(
        private readonly LessonQuizGenerationProcessor $processor,
    ) {}

    public function dispatchGeneration(LessonQuizConfig $config, User $user, bool $autoTranslateFil = true)
    {
        return $this->processor->queueGeneration($config, $user, $autoTranslateFil);
    }
}
