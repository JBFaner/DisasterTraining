<?php

namespace App\Support;

use App\Models\AiScenarioAssessmentVersion;
use App\Models\AiScenarioConfig;

class AiScenarioAdminSerializer
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
            'trainingModule',
            'creator:id,name,email',
            'currentVersion' => fn ($query) => $query->with(self::versionRelations()),
            'publishedVersion' => fn ($query) => $query->with(self::versionRelations()),
            'versions' => fn ($query) => $query->with(self::versionRelations())->orderByDesc('version_number'),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public static function serializeConfig(AiScenarioConfig $config): array
    {
        return [
            'id' => $config->id,
            'training_module_id' => $config->training_module_id,
            'training_module' => $config->trainingModule,
            'difficulty' => $config->difficulty,
            'number_of_questions' => $config->number_of_questions,
            'generation_language' => $config->generation_language,
            'is_enabled' => $config->is_enabled,
            'time_limit_minutes' => $config->time_limit_minutes,
            'max_attempts' => $config->max_attempts,
            'passing_score' => $config->passing_score,
            'fail_retake_policy' => $config->fail_retake_policy,
            'auto_submit_on_expire' => $config->auto_submit_on_expire,
            'allow_resume_attempt' => $config->allow_resume_attempt,
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
            'generated_at' => $config->generated_at,
            'updated_at' => $config->updated_at,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public static function serializeVersion(
        AiScenarioAssessmentVersion $version,
        ?AiScenarioConfig $config = null,
    ): array {
        $isCurrent = $config && (int) $config->published_version_id === (int) $version->id;

        return [
            'id' => $version->id,
            'ai_scenario_config_id' => $version->ai_scenario_config_id,
            'version_number' => $version->version_number,
            'status' => $version->status,
            'disaster_type' => $version->disaster_type,
            'difficulty' => $version->difficulty,
            'estimated_time_minutes' => $version->estimated_time_minutes,
            'scenario_title' => $version->scenario_title,
            'title_en' => $version->title_en,
            'title_fil' => $version->title_fil,
            'generated_scenario' => $version->generated_scenario,
            'description_en' => $version->description_en,
            'description_fil' => $version->description_fil,
            'learning_objectives_en' => $version->learning_objectives_en,
            'learning_objectives_fil' => $version->learning_objectives_fil,
            'generated_questions' => $version->generated_questions ?? [],
            'generated_language' => $version->generated_language,
            'change_note' => $version->change_note,
            'parent_version_id' => $version->parent_version_id,
            'created_by' => $version->created_by,
            'approved_by' => $version->approved_by,
            'approved_at' => $version->approved_at,
            'published_at' => $version->published_at,
            'published_by' => $version->published_by,
            'last_edited_by' => $version->last_edited_by,
            'last_edited_at' => $version->last_edited_at,
            'created_at' => $version->created_at,
            'updated_at' => $version->updated_at,
            'creator' => $version->creator,
            'approver' => $version->approver,
            'publisher' => $version->publisher,
            'last_editor' => $version->lastEditor,
            'question_count' => count($version->generated_questions ?? []),
            'is_current' => $isCurrent,
            'generated_by_name' => $version->creator?->name,
            'published_by_name' => $version->publisher?->name,
            'last_edited_by_name' => $version->lastEditor?->name,
        ];
    }
}
