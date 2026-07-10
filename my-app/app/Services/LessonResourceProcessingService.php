<?php

namespace App\Services;

use App\Jobs\ProcessLessonResourceForAiJob;
use App\Models\LessonResource;
use App\Models\TrainingContent;
use App\Support\LessonTextCleaner;
use App\Support\Utf8Sanitizer;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Smalot\PdfParser\Parser;

class LessonResourceProcessingService
{
    public function __construct(
        private readonly YouTubeTranscriptService $youtubeTranscript,
        private readonly GeminiService $gemini,
    ) {}

    public function supportsAiProcessing(string $resourceType): bool
    {
        return in_array($resourceType, [
            LessonResource::TYPE_TEXT,
            LessonResource::TYPE_PDF,
            LessonResource::TYPE_IMAGE,
            LessonResource::TYPE_YOUTUBE,
        ], true);
    }

    public function afterResourceSaved(LessonResource $resource): void
    {
        if ($resource->resource_type === LessonResource::TYPE_TEXT) {
            $this->process($resource);

            return;
        }

        if ($this->supportsAiProcessing($resource->resource_type)) {
            $resource->update([
                'ai_processed_text' => null,
                'ai_processing_status' => LessonResource::AI_STATUS_PENDING,
                'ai_processing_error' => null,
                'ai_processed_at' => null,
            ]);
            ProcessLessonResourceForAiJob::dispatch($resource->id);

            return;
        }

        $this->process($resource);
    }

    public function reprocess(LessonResource $resource): void
    {
        $resource->update([
            'ai_processed_text' => null,
            'ai_processing_status' => LessonResource::AI_STATUS_PENDING,
            'ai_processing_error' => null,
            'ai_processed_at' => null,
        ]);

        if ($resource->resource_type === LessonResource::TYPE_TEXT) {
            $this->process($resource);

            return;
        }

        if ($this->supportsAiProcessing($resource->resource_type)) {
            ProcessLessonResourceForAiJob::dispatch($resource->id);

            return;
        }

        $this->process($resource);
    }

    public function ensureProcessed(LessonResource $resource): LessonResource
    {
        $resource->refresh();

        if (! $this->supportsAiProcessing($resource->resource_type)) {
            if ($resource->ai_processing_status === null) {
                $this->process($resource);
                $resource->refresh();
            }

            return $resource;
        }

        if (in_array($resource->ai_processing_status, [
            LessonResource::AI_STATUS_READY,
            LessonResource::AI_STATUS_PROCESSING,
        ], true)) {
            return $resource;
        }

        if ($resource->ai_processing_status === null
            || $resource->ai_processing_status === LessonResource::AI_STATUS_PENDING) {
            if ($resource->resource_type === LessonResource::TYPE_TEXT) {
                $this->process($resource);
            } else {
                $resource->update([
                    'ai_processing_status' => LessonResource::AI_STATUS_PENDING,
                    'ai_processing_error' => null,
                ]);
                ProcessLessonResourceForAiJob::dispatch($resource->id);
            }

            $resource->refresh();
        }

        return $resource;
    }

    public function ensureLessonResourcesProcessed(TrainingContent $lesson): TrainingContent
    {
        $lesson->loadMissing('resources');

        foreach ($lesson->resources as $resource) {
            $this->ensureProcessed($resource);
        }

        return $lesson->refresh()->load('resources');
    }

    public function process(LessonResource $resource): void
    {
        if (! $this->supportsAiProcessing($resource->resource_type)) {
            $resource->update([
                'ai_processed_text' => null,
                'ai_processing_status' => LessonResource::AI_STATUS_NOT_APPLICABLE,
                'ai_processing_error' => null,
                'ai_processed_at' => now(),
            ]);

            return;
        }

        $resource->update([
            'ai_processing_status' => LessonResource::AI_STATUS_PROCESSING,
            'ai_processing_error' => null,
        ]);

        try {
            $text = match ($resource->resource_type) {
                LessonResource::TYPE_TEXT => $this->processRichText($resource),
                LessonResource::TYPE_PDF => $this->processPdf($resource),
                LessonResource::TYPE_IMAGE => $this->processImage($resource),
                LessonResource::TYPE_YOUTUBE => $this->processYouTube($resource),
                default => null,
            };

            if ($text === null || trim($text) === '') {
                $this->markFailed($resource, $this->failureMessage($resource->resource_type));

                return;
            }

            $resource->update([
                'ai_processed_text' => $text,
                'ai_processing_status' => LessonResource::AI_STATUS_READY,
                'ai_processing_error' => null,
                'ai_processed_at' => now(),
            ]);
        } catch (\Throwable $e) {
            Log::warning('Lesson resource AI preprocessing failed', [
                'lesson_resource_id' => $resource->id,
                'resource_type' => $resource->resource_type,
                'error' => $e->getMessage(),
            ]);

            $this->markFailed($resource, $this->failureMessage($resource->resource_type));
        }
    }

    public function failureMessage(string $resourceType): string
    {
        return match ($resourceType) {
            LessonResource::TYPE_PDF => 'Unable to extract text from the uploaded PDF.',
            LessonResource::TYPE_IMAGE => 'Unable to extract text from the uploaded image.',
            LessonResource::TYPE_YOUTUBE => 'Unable to retrieve a transcript for this YouTube video. Paste a manual transcript in the Transcript field, or use a video with captions enabled on YouTube.',
            default => 'No readable lesson content is available for AI Question Bank generation.',
        };
    }

    private function processRichText(LessonResource $resource): ?string
    {
        $text = LessonTextCleaner::cleanHtml($resource->body);

        return $text !== '' ? $text : null;
    }

    private function processPdf(LessonResource $resource): ?string
    {
        $extracted = $this->extractPdfText($resource->file_path);
        if ($extracted === null || trim($extracted) === '') {
            return null;
        }

        return LessonTextCleaner::clean($extracted) ?: null;
    }

    private function processImage(LessonResource $resource): ?string
    {
        $absolutePath = $this->resolveLocalAbsolutePath($resource->file_path);
        if ($absolutePath === null) {
            return null;
        }

        $mime = mime_content_type($absolutePath) ?: 'image/jpeg';
        $text = $this->gemini->extractTextFromImageFile($absolutePath, $mime);

        return LessonTextCleaner::clean($text) ?: null;
    }

    private function processYouTube(LessonResource $resource): ?string
    {
        if (is_string($resource->body) && trim($resource->body) !== '') {
            $text = LessonTextCleaner::clean($resource->body);

            return $text !== '' ? $text : null;
        }

        $result = $this->youtubeTranscript->fetchWithFallback($resource->external_url);
        if ($result === null || trim($result['text']) === '') {
            return null;
        }

        $text = LessonTextCleaner::clean($result['text']);

        return $text !== '' ? $text : null;
    }

    private function extractPdfText(?string $filePath): ?string
    {
        $absolute = $this->resolveLocalAbsolutePath($filePath);
        if ($absolute === null) {
            return null;
        }

        try {
            $parser = new Parser;
            $pdf = $parser->parseFile($absolute);
            $text = Utf8Sanitizer::clean($pdf->getText());

            return trim($text) !== '' ? $text : null;
        } catch (\Throwable $e) {
            Log::warning('PDF text extraction failed', [
                'file_path' => $filePath,
                'error' => $e->getMessage(),
            ]);

            return null;
        }
    }

    private function resolveLocalAbsolutePath(?string $filePath): ?string
    {
        if (! $filePath) {
            return null;
        }

        if (str_starts_with($filePath, 'http://') || str_starts_with($filePath, 'https://')) {
            return null;
        }

        $diskPath = str_starts_with($filePath, '/storage/')
            ? str_replace('/storage/', '', $filePath)
            : $filePath;

        if (! Storage::disk('public')->exists($diskPath)) {
            return null;
        }

        return Storage::disk('public')->path($diskPath);
    }

    private function markFailed(LessonResource $resource, string $message): void
    {
        $resource->update([
            'ai_processed_text' => null,
            'ai_processing_status' => LessonResource::AI_STATUS_FAILED,
            'ai_processing_error' => $message,
            'ai_processed_at' => now(),
        ]);
    }
}
