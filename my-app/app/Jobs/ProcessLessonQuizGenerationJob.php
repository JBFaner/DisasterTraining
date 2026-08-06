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

    /** Retry on transient Gemini / network failures so generation can continue when connectivity returns. */
    public int $tries = 5;

    public function __construct(
        public int $generationJobId,
    ) {}

    /**
     * @return list<int>
     */
    public function backoff(): array
    {
        return [20, 45, 90, 180];
    }

    public function handle(LessonQuizGenerationProcessor $processor): void
    {
        $job = LessonQuizGenerationJob::query()->find($this->generationJobId);

        if (! $job) {
            return;
        }

        try {
            $processor->process($job, markFailedOnError: $this->attempts() >= $this->tries);
        } catch (\Throwable $e) {
            Log::warning('Lesson quiz generation attempt failed', [
                'generation_job_id' => $this->generationJobId,
                'attempt' => $this->attempts(),
                'tries' => $this->tries,
                'error' => $e->getMessage(),
            ]);

            throw $e;
        }
    }
}
