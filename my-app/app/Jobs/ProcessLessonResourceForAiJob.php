<?php

namespace App\Jobs;

use App\Models\LessonResource;
use App\Services\LessonResourceProcessingService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;

class ProcessLessonResourceForAiJob implements ShouldQueue
{
    use Queueable;

    public int $timeout = 300;

    public int $tries = 2;

    public function __construct(
        public int $lessonResourceId,
    ) {}

    public function handle(LessonResourceProcessingService $processingService): void
    {
        $resource = LessonResource::query()->find($this->lessonResourceId);

        if (! $resource) {
            return;
        }

        try {
            $processingService->process($resource);
        } catch (\Throwable $e) {
            Log::error('Lesson resource preprocessing job failed', [
                'lesson_resource_id' => $this->lessonResourceId,
                'error' => $e->getMessage(),
            ]);

            throw $e;
        }
    }
}
