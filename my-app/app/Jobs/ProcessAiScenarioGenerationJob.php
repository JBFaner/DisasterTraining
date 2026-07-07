<?php

namespace App\Jobs;

use App\Models\AiScenarioGenerationJob;
use App\Services\AiScenarioGenerationProcessor;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;

class ProcessAiScenarioGenerationJob implements ShouldQueue
{
    use Queueable;

    public int $timeout = 900;

    public int $tries = 1;

    public function __construct(
        public int $generationJobId,
    ) {}

    public function handle(AiScenarioGenerationProcessor $processor): void
    {
        $job = AiScenarioGenerationJob::query()->find($this->generationJobId);

        if (! $job) {
            return;
        }

        try {
            $processor->process($job);
        } catch (\Throwable $e) {
            Log::error('AI scenario generation job failed', [
                'generation_job_id' => $this->generationJobId,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
