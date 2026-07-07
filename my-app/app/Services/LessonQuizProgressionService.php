<?php

namespace App\Services;

use App\Models\LessonQuizAttempt;
use App\Models\LessonQuizConfig;
use App\Models\TrainingContent;
use App\Models\TrainingModule;

class LessonQuizProgressionService
{
    public function participantHasPassedLessonQuiz(int $userId, int $contentId): bool
    {
        return LessonQuizAttempt::query()
            ->where('user_id', $userId)
            ->where('training_content_id', $contentId)
            ->where('passed', true)
            ->exists();
    }

    public function lessonHasPublishedQuiz(int $contentId): bool
    {
        $config = LessonQuizConfig::query()
            ->where('training_content_id', $contentId)
            ->first();

        return $config?->isReady() ?? false;
    }

    public function participantHasCompletedLesson(TrainingModule $module, int $userId, TrainingContent $content): bool
    {
        if ($this->lessonHasPublishedQuiz($content->id)) {
            return $this->participantHasPassedLessonQuiz($userId, $content->id);
        }

        return in_array($content->id, $module->participantCompletedContentIds($userId), true);
    }

    public function participantHasPassedAllRequiredLessonQuizzes(TrainingModule $module, int $userId): bool
    {
        $module->loadMissing('contents');

        if ($module->contents->isEmpty()) {
            return false;
        }

        foreach ($module->contents as $content) {
            if ($this->lessonHasPublishedQuiz($content->id)) {
                if (! $this->participantHasPassedLessonQuiz($userId, $content->id)) {
                    return false;
                }
            } elseif (! in_array($content->id, $module->participantCompletedContentIds($userId), true)) {
                return false;
            }
        }

        return true;
    }
}
