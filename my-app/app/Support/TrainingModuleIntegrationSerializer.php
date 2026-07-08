<?php

namespace App\Support;

use App\Models\TrainingModule;
use App\Services\HazardAssessment\HazardTrainingRecommendationService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;

class TrainingModuleIntegrationSerializer
{
    public static function publishedModulesQuery(): Builder
    {
        return TrainingModule::query()
            ->publishedForIntegration()
            ->with('aiScenarioConfig:id,training_module_id,is_enabled,published_version_id')
            ->withCount('contents as lesson_count')
            ->orderBy('title');
    }

    public static function findPublishedOrFail(int $id): TrainingModule
    {
        return self::publishedModulesQuery()->whereKey($id)->firstOrFail();
    }

    /**
     * @param  Collection<int, TrainingModule>|array<int, TrainingModule>  $modules
     * @return list<array<string, mixed>>
     */
    public static function serializeCollection(Collection|array $modules): array
    {
        $collection = $modules instanceof Collection ? $modules : collect($modules);

        return $collection
            ->map(fn (TrainingModule $module) => self::serializeOne($module))
            ->values()
            ->all();
    }

    /**
     * @return array<string, mixed>
     */
    public static function serializeOne(TrainingModule $module): array
    {
        if (! $module->relationLoaded('aiScenarioConfig')) {
            $module->load('aiScenarioConfig:id,training_module_id,is_enabled,published_version_id');
        }

        if (! isset($module->lesson_count)) {
            $module->loadCount('contents as lesson_count');
        }

        if (! isset($module->recommended_communities)) {
            $module->recommended_communities = app(HazardTrainingRecommendationService::class)
                ->recommendCommunitiesForTraining($module);
        }

        $module->assigned_trainers = $module->assignedQualifiedTrainers();

        return $module->toIntegrationArray();
    }
}
