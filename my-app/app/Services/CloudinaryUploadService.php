<?php

namespace App\Services;

use Cloudinary\Cloudinary;
use Illuminate\Http\UploadedFile;
use RuntimeException;

class CloudinaryUploadService
{
    /**
     * Upload an image file to Cloudinary and return the secure URL.
     */
    public function uploadImage(UploadedFile $file, string $folder = 'uploads'): string
    {
        $credentials = $this->resolveCredentials();
        if (! $credentials) {
            throw new RuntimeException(
                'Cloudinary is not configured. Add CLOUDINARY_URL or CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET to .env.'
            );
        }

        $cloudinary = new Cloudinary([
            'cloud' => [
                'cloud_name' => $credentials['cloudName'],
                'api_key' => $credentials['apiKey'],
                'api_secret' => $credentials['apiSecret'],
            ],
            'url' => [
                'secure' => true,
            ],
        ]);

        $uploadResult = $cloudinary->uploadApi()->upload($file->getRealPath(), [
            'resource_type' => 'image',
            'folder' => $folder,
            'overwrite' => true,
            'invalidate' => true,
        ]);

        $url = $uploadResult['secure_url'] ?? $uploadResult['url'] ?? null;
        if (! $url) {
            throw new RuntimeException('Cloudinary did not return a URL for the uploaded file.');
        }

        return $url;
    }

    /**
     * @return array{cloudName: string, apiKey: string, apiSecret: string}|null
     */
    public function resolveCredentials(): ?array
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
}
