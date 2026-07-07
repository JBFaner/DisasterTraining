<?php

namespace App\Http\Controllers\Concerns;

use App\Models\LessonResource;
use App\Models\TrainingContent;
use App\Models\TrainingModule;
use Cloudinary\Cloudinary;
use Illuminate\Support\Facades\Storage;

trait ManagesTrainingModuleAssets
{
    protected function normalizeObjectives(array $objectives): array
    {
        return array_values(array_filter(array_map('trim', $objectives)));
    }

    protected function storeContentFile($file, string $contentType, string $storageTarget = 'auto'): string
    {
        $mime = $file->getMimeType();
        $extension = strtolower($file->getClientOriginalExtension());

        $isVideo = ($mime && str_starts_with($mime, 'video/'))
            || in_array($extension, ['mp4', 'mov', 'avi'], true);
        $isImage = ($mime && str_starts_with($mime, 'image/'))
            || in_array($extension, ['jpg', 'jpeg', 'png', 'gif', 'webp'], true);

        $shouldUseCloudinary = false;

        if ($storageTarget === 'cloudinary' && ($isVideo || $isImage)) {
            $shouldUseCloudinary = true;
        } elseif ($storageTarget === 'local') {
            $shouldUseCloudinary = false;
        } else {
            $shouldUseCloudinary = $isVideo;
        }

        if ($shouldUseCloudinary && ($isVideo || $isImage)) {
            $cloudinaryUrl = getenv('CLOUDINARY_URL') ?: null;
            if (! $cloudinaryUrl) {
                throw new \RuntimeException('Cloudinary is not configured. Set CLOUDINARY_URL in .env or choose local storage.');
            }

            $parsed = parse_url($cloudinaryUrl);
            $cloudName = $parsed['host'] ?? null;
            $apiKey = $parsed['user'] ?? null;
            $apiSecret = $parsed['pass'] ?? null;

            if (! $cloudName || ! $apiKey || ! $apiSecret) {
                throw new \RuntimeException('Cloudinary is misconfigured.');
            }

            $cloudinary = new Cloudinary([
                'cloud' => [
                    'cloud_name' => $cloudName,
                    'api_key' => $apiKey,
                    'api_secret' => $apiSecret,
                ],
                'url' => [
                    'secure' => true,
                ],
            ]);

            $resourceType = $isVideo ? 'video' : 'image';
            $uploadResult = $cloudinary->uploadApi()->upload($file->getRealPath(), [
                'resource_type' => $resourceType,
                'folder' => 'training-contents',
            ]);

            $storedPath = $uploadResult['secure_url'] ?? $uploadResult['url'] ?? null;
            if (! $storedPath) {
                throw new \RuntimeException('Cloudinary did not return a URL for the uploaded file.');
            }

            return $storedPath;
        }

        $folder = match ($contentType) {
            LessonResource::TYPE_PDF => 'training-contents/pdf',
            LessonResource::TYPE_VIDEO => 'training-contents/video',
            LessonResource::TYPE_IMAGE => 'training-contents/images',
            default => 'training-contents',
        };

        $relativePath = $file->store($folder, 'public');

        return Storage::url($relativePath);
    }

    protected function deleteStoredContentFile(?string $path): void
    {
        if (! $path) {
            return;
        }

        if (str_starts_with($path, 'http://') || str_starts_with($path, 'https://')) {
            return;
        }

        $this->deleteLocalFile(str_replace('/storage/', '', $path));
    }

    protected function deleteLocalFile(?string $path): void
    {
        if (! $path) {
            return;
        }

        if (str_starts_with($path, 'http://') || str_starts_with($path, 'https://')) {
            return;
        }

        $relative = str_starts_with($path, '/storage/')
            ? ltrim(substr($path, strlen('/storage/')), '/')
            : $path;

        Storage::disk('public')->delete($relative);
    }

    protected function assertContentBelongsToModule(TrainingModule $module, TrainingContent $content): void
    {
        if ($content->training_module_id !== $module->id) {
            abort(404);
        }
    }

    protected function assertResourceBelongsToLesson(TrainingContent $lesson, LessonResource $resource): void
    {
        if ($resource->training_content_id !== $lesson->id) {
            abort(404);
        }
    }

    protected function authorizeOwner(TrainingModule $module): void
    {
        $user = portal_user();

        if (! $user) {
            abort(403);
        }

        if ($user->role !== 'LGU_ADMIN' && $user->id !== $module->owner_id) {
            abort(403);
        }
    }
}
