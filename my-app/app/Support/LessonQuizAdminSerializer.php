<?php

namespace App\Support;

use App\Models\LessonQuizConfig;
use App\Models\LessonQuizVersion;
use App\Services\LessonQuizGenerationProcessor;

class LessonQuizAdminSerializer
{
    /**
     * @return list<string|callable>
     */
    public static function versionRelations(): array
    {
        return [
            'creator:id,name,email',
            'approver:id,name,email',
            'publisher:id,name,email',
            'lastEditor:id,name,email',
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public static function configRelations(): array
    {
        return [
            'trainingContent.module',
            'creator:id,name,email',
            'currentVersion' => fn ($query) => $query->with(self::versionRelations()),
            'publishedVersion' => fn ($query) => $query->with(self::versionRelations()),
            'versions' => fn ($query) => $query->with(self::versionRelations())->orderByDesc('version_number'),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public static function serializeConfig(LessonQuizConfig $config): array
    {
        return [
            'id' => $config->id,
            'training_content_id' => $config->training_content_id,
            'training_content' => $config->trainingContent,
            'difficulty' => $config->difficulty,
            'bank_question_count' => $config->bank_question_count,
            'quiz_question_count' => $config->quiz_question_count,
            'generation_language' => $config->generation_language,
            'is_enabled' => $config->is_enabled,
            'time_limit_minutes' => $config->time_limit_minutes,
            'max_attempts' => $config->max_attempts,
            'passing_score' => $config->passing_score,
            'shuffle_questions' => $config->shuffle_questions,
            'shuffle_answer_choices' => $config->shuffle_answer_choices,
            'current_version_id' => $config->current_version_id,
            'published_version_id' => $config->published_version_id,
            'current_version' => $config->currentVersion
                ? self::serializeVersion($config->currentVersion, $config)
                : null,
            'published_version' => $config->publishedVersion
                ? self::serializeVersion($config->publishedVersion, $config)
                : null,
            'versions' => $config->versions?->map(fn ($version) => self::serializeVersion($version, $config))->values() ?? [],
            'latest_generation_job' => app(LessonQuizGenerationProcessor::class)
                ->serializeJob($config->latestGenerationJob),
            'updated_at' => $config->updated_at,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public static function serializeVersion(
        LessonQuizVersion $version,
        ?LessonQuizConfig $config = null,
    ): array {
        $isCurrent = $config && (int) $config->published_version_id === (int) $version->id;

        return [
            'id' => $version->id,
            'lesson_quiz_config_id' => $version->lesson_quiz_config_id,
            'version_number' => $version->version_number,
            'status' => $version->status,
            'generated_questions' => $version->generated_questions ?? [],
            'generated_language' => $version->generated_language,
            'language_versions' => $version->language_versions ?? [],
            'change_note' => $version->change_note,
            'is_current' => $isCurrent,
            'created_at' => $version->created_at,
            'approved_at' => $version->approved_at,
            'published_at' => $version->published_at,
            'last_edited_at' => $version->last_edited_at,
            'creator' => $version->creator,
            'publisher' => $version->publisher,
            'approver' => $version->approver,
            'last_editor' => $version->lastEditor,
            'generated_by_name' => $version->creator?->name,
            'published_by_name' => $version->publisher?->name,
            'last_edited_by_name' => $version->lastEditor?->name,
        ];
    }
}
