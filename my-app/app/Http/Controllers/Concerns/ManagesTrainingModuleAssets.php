<?php

namespace App\Http\Controllers\Concerns;

use App\Models\LessonResource;
use App\Models\TrainingContent;
use App\Models\TrainingModule;
use Cloudinary\Cloudinary;
use Illuminate\Http\Request;
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

        if ($storageTarget === 'local') {
            $shouldUseCloudinary = false;
        } elseif ($storageTarget === 'cloudinary') {
            $shouldUseCloudinary = $isVideo || $isImage;
        } else {
            // auto: images and videos use Cloudinary; PDF and other files stay local
            $shouldUseCloudinary = $isVideo || $isImage;
        }

        if ($shouldUseCloudinary && ($isVideo || $isImage)) {
            $credentials = $this->resolveCloudinaryCredentials();
            if (! $credentials) {
                throw new \RuntimeException('Cloudinary is not configured. Add CLOUDINARY_URL or CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET to .env.');
            }

            ['cloudName' => $cloudName, 'apiKey' => $apiKey, 'apiSecret' => $apiSecret] = $credentials;

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

    /**
     * @return array{cloudName: string, apiKey: string, apiSecret: string}|null
     */
    protected function resolveCloudinaryCredentials(): ?array
    {
        $cloudinaryUrl = env('CLOUDINARY_URL');
        if (is_string($cloudinaryUrl) && $cloudinaryUrl !== '') {
            $parsed = parse_url($cloudinaryUrl);
            $cloudName = $parsed['host'] ?? null;
            $apiKey = $parsed['user'] ?? null;
            $apiSecret = $parsed['pass'] ?? null;

            if ($cloudName && $apiKey && $apiSecret) {
                return [
                    'cloudName' => $cloudName,
                    'apiKey' => $apiKey,
                    'apiSecret' => $apiSecret,
                ];
            }
        }

        $cloudName = env('CLOUDINARY_CLOUD_NAME');
        $apiKey = env('CLOUDINARY_API_KEY');
        $apiSecret = env('CLOUDINARY_API_SECRET');

        if ($cloudName && $apiKey && $apiSecret) {
            return [
                'cloudName' => (string) $cloudName,
                'apiKey' => (string) $apiKey,
                'apiSecret' => (string) $apiSecret,
            ];
        }

        return null;
    }

    protected function trainingModuleFormResponse(
        Request $request,
        TrainingModule $trainingModule,
        string $message,
        bool $success = true,
        int $errorStatus = 422,
        array $errors = [],
    ) {
        if ($request->expectsJson()) {
            $payload = [
                'success' => $success,
                'message' => $message,
            ];

            if ($errors !== []) {
                $payload['errors'] = $errors;
            }

            return response()->json($payload, $success ? 200 : $errorStatus);
        }

        if (! $success) {
            return redirect()->back()
                ->withErrors($errors !== [] ? $errors : ['form' => $message])
                ->withInput();
        }

        return redirect()->route('admin.training-modules.show', $trainingModule)
            ->with('status', $message);
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
