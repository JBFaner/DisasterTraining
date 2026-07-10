<?php

namespace App\Services;

use App\Models\LessonResource;
use App\Models\TrainingContent;
use App\Support\LessonTextCleaner;
use App\Support\Utf8Sanitizer;
use Illuminate\Support\Str;

class LessonContentExtractorService
{
    public function __construct(
        private readonly LessonResourceProcessingService $processingService,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function serializeLessonForAdmin(TrainingContent $lesson): array
    {
        $lesson = $this->processingService->ensureLessonResourcesProcessed($lesson);
        $resources = $lesson->resources
            ->map(fn (LessonResource $resource) => $this->serializeResource($resource))
            ->values()
            ->all();

        $hasReadable = collect($resources)->contains(fn (array $resource) => $resource['has_readable_content'] === true);

        return [
            'id' => $lesson->id,
            'title' => $lesson->title,
            'description' => $lesson->description,
            'sort_order' => $lesson->sort_order,
            'resources' => $resources,
            'has_readable_content' => $hasReadable,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function serializeResource(LessonResource $resource): array
    {
        $resource = $this->processingService->ensureProcessed($resource);

        return [
            'id' => $resource->id,
            'title' => $resource->title,
            'resource_type' => $resource->resource_type,
            'resource_label' => $this->resourceLabel($resource),
            'ai_processing_status' => $resource->ai_processing_status,
            'ai_processing_status_label' => $resource->aiProcessingStatusLabel(),
            'ai_processing_error' => $resource->ai_processing_error,
            'has_readable_content' => $resource->hasReadableAiContent(),
            'processed_text_preview' => $resource->ai_processed_text
                ? Str::limit($resource->ai_processed_text, 400)
                : null,
            'external_url' => $resource->external_url,
            'file_url' => in_array($resource->resource_type, [
                LessonResource::TYPE_PDF,
                LessonResource::TYPE_IMAGE,
                LessonResource::TYPE_VIDEO,
            ], true) ? $resource->display_url : null,
            'body' => $resource->resource_type === LessonResource::TYPE_TEXT ? $resource->body : null,
            'sort_order' => $resource->sort_order,
        ];
    }

    public function buildAiSourceText(TrainingContent $lesson): string
    {
        $lesson->loadMissing('resources');

        $textResource = $lesson->resources->first(
            fn (LessonResource $resource) => $resource->resource_type === LessonResource::TYPE_TEXT
                && $resource->title === 'Training Content'
        ) ?? $lesson->resources->first(
            fn (LessonResource $resource) => $resource->resource_type === LessonResource::TYPE_TEXT
        );

        $parts = [
            'Lesson Title: '.Utf8Sanitizer::clean($lesson->title),
        ];

        if ($textResource && trim(strip_tags((string) $textResource->body)) !== '') {
            $parts[] = 'Training Content (Rich Text): '.LessonTextCleaner::cleanHtml((string) $textResource->body);
        }

        return trim(implode("\n\n", array_filter($parts)));
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function extractModuleLessons(int $trainingModuleId): array
    {
        return TrainingContent::query()
            ->with('resources')
            ->where('training_module_id', $trainingModuleId)
            ->orderBy('sort_order')
            ->get()
            ->map(fn (TrainingContent $lesson) => $this->serializeLessonForAdmin($lesson))
            ->values()
            ->all();
    }

    private function resourceSectionHeading(LessonResource $resource): string
    {
        return match ($resource->resource_type) {
            LessonResource::TYPE_TEXT => 'Rich Text ('.$resource->title.')',
            LessonResource::TYPE_PDF => 'PDF ('.$resource->title.')',
            LessonResource::TYPE_IMAGE => 'Image OCR ('.$resource->title.')',
            LessonResource::TYPE_YOUTUBE => 'YouTube Transcript ('.$resource->title.')',
            default => $resource->title,
        };
    }

    private function resourceLabel(LessonResource $resource): string
    {
        if ($resource->resource_type === LessonResource::TYPE_PDF && $resource->file_path) {
            return basename(str_replace('\\', '/', $resource->file_path));
        }

        if ($resource->resource_type === LessonResource::TYPE_TEXT) {
            return $resource->title ?: 'Rich Text';
        }

        return $resource->title;
    }
}
