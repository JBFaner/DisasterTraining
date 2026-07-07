<?php

namespace App\Services;

use App\Support\Utf8Sanitizer;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class YouTubeTranscriptService
{
    public function extractVideoId(?string $url): ?string
    {
        if (! $url) {
            return null;
        }

        if (preg_match('/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([A-Za-z0-9_-]{11})/', $url, $matches)) {
            return $matches[1];
        }

        return null;
    }

    public function fetchTranscript(?string $url): ?string
    {
        $videoId = $this->extractVideoId($url);
        if (! $videoId) {
            return null;
        }

        try {
            $pageResponse = Http::timeout(20)
                ->withHeaders(['User-Agent' => 'Mozilla/5.0'])
                ->get("https://www.youtube.com/watch?v={$videoId}");

            if (! $pageResponse->successful()) {
                return null;
            }

            $html = $pageResponse->body();
            $captionUrl = $this->resolveCaptionTrackUrl($html, $videoId);

            if (! $captionUrl) {
                return null;
            }

            $captionResponse = Http::timeout(20)->get($captionUrl);
            if (! $captionResponse->successful()) {
                return null;
            }

            return $this->parseCaptionXml($captionResponse->body());
        } catch (\Throwable $e) {
            Log::warning('YouTube transcript fetch failed', [
                'video_id' => $videoId,
                'error' => $e->getMessage(),
            ]);

            return null;
        }
    }

    private function resolveCaptionTrackUrl(string $html, string $videoId): ?string
    {
        if (preg_match('/"captionTracks":(\[.*?\])/', $html, $matches)) {
            $tracks = json_decode($matches[1], true);
            if (is_array($tracks) && $tracks !== []) {
                foreach ($tracks as $track) {
                    if (! empty($track['baseUrl'])) {
                        return (string) $track['baseUrl'];
                    }
                }
            }
        }

        return "https://www.youtube.com/api/timedtext?v={$videoId}&lang=en";
    }

    private function parseCaptionXml(string $xml): ?string
    {
        if ($xml === '') {
            return null;
        }

        $lines = [];
        if (preg_match_all('/<text[^>]*>(.*?)<\/text>/s', $xml, $matches)) {
            foreach ($matches[1] as $line) {
                $decoded = html_entity_decode(strip_tags($line), ENT_QUOTES | ENT_HTML5, 'UTF-8');
                $decoded = trim(preg_replace('/\s+/', ' ', $decoded) ?? '');
                if ($decoded !== '') {
                    $lines[] = $decoded;
                }
            }
        }

        if ($lines === []) {
            return null;
        }

        return Utf8Sanitizer::clean(implode(' ', $lines));
    }
}
