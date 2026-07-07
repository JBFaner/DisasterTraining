<?php

namespace App\Jobs;

use App\Models\LessonQuizGenerationJob;
use App\Services\LessonQuizGenerationProcessor;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;

class ProcessLessonQuizGenerationJob implements ShouldQueue
{
    use Queueable;

    public int $timeout = 900;

    public int $tries = 1;

    public function __construct(
        public int $generationJobId,
    ) {}

    public function handle(LessonQuizGenerationProcessor $processor): void
    {
        $job = LessonQuizGenerationJob::query()->find($this->generationJobId);

        if (! $job) {
            return;
        }

        try {
            $processor->process($job);
        } catch (\Throwable $e) {
            Log::error('Lesson quiz generation job failed', [
                'generation_job_id' => $this->generationJobId,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
