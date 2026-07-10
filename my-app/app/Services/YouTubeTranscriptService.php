<?php

namespace App\Services;

use App\Support\Utf8Sanitizer;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class YouTubeTranscriptService
{
    public const METADATA_MARKER = '[YouTube video description - auto-generated captions were not available]';

    private const INNERTUBE_KEY = 'AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8';

    private const CLIENT_VERSION = '2.20250218.01.00';

    public function extractVideoId(?string $url): ?string
    {
        if (! $url) {
            return null;
        }

        if (preg_match('/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([A-Za-z0-9_-]{11})/', $url, $matches)) {
            return $matches[1];
        }

        return null;
    }

    /**
     * @return array{text: string, source: string}|null
     */
    public function fetchWithFallback(?string $url): ?array
    {
        $videoId = $this->extractVideoId($url);
        if (! $videoId) {
            return null;
        }

        $transcript = $this->fetchTranscript($videoId, $url);
        if ($transcript !== null && trim($transcript) !== '') {
            return [
                'text' => Utf8Sanitizer::clean($transcript),
                'source' => 'transcript',
            ];
        }

        $metadata = $this->fetchVideoMetadata($videoId, $url);
        if ($metadata !== null && trim($metadata) !== '') {
            return [
                'text' => self::METADATA_MARKER."\n\n".Utf8Sanitizer::clean($metadata),
                'source' => 'metadata',
            ];
        }

        return null;
    }

    public function fetchTranscript(?string $url): ?string
    {
        $videoId = $this->extractVideoId($url);
        if (! $videoId) {
            return null;
        }

        return $this->fetchTranscriptForVideo($videoId, $url);
    }

    private function fetchTranscriptForVideo(string $videoId, ?string $url = null): ?string
    {
        $pageHtml = $this->fetchWatchPage($videoId);
        $visitorData = $pageHtml ? $this->extractVisitorData($pageHtml) : null;
        $tracks = $pageHtml ? $this->extractCaptionTracks($pageHtml) : [];

        $transcript = $this->fetchViaInnertubeNext($videoId, $visitorData);
        if ($transcript !== null) {
            return $transcript;
        }

        foreach ($tracks as $track) {
            $language = (string) ($track['languageCode'] ?? 'en');
            $isAsr = ($track['kind'] ?? '') === 'asr';

            $transcript = $this->fetchViaInnertubeProtobuf($videoId, $language, $isAsr, $visitorData);
            if ($transcript !== null) {
                return $transcript;
            }

            if (! empty($track['baseUrl'])) {
                $transcript = $this->fetchCaptionUrl((string) $track['baseUrl'], $url ?? "https://www.youtube.com/watch?v={$videoId}");
                if ($transcript !== null) {
                    return $transcript;
                }
            }
        }

        foreach ($this->preferredLanguages($tracks) as [$language, $isAsr]) {
            $transcript = $this->fetchViaInnertubeProtobuf($videoId, $language, $isAsr, $visitorData);
            if ($transcript !== null) {
                return $transcript;
            }
        }

        return null;
    }

    public function fetchVideoMetadata(string $videoId, ?string $url = null): ?string
    {
        $parts = [];

        $oembed = Http::timeout(15)->get('https://www.youtube.com/oembed', [
            'url' => $url ?? "https://www.youtube.com/watch?v={$videoId}",
            'format' => 'json',
        ]);

        if ($oembed->successful()) {
            $data = $oembed->json();
            if (! empty($data['title'])) {
                $parts[] = 'Video Title: '.$data['title'];
            }
            if (! empty($data['author_name'])) {
                $parts[] = 'Channel: '.$data['author_name'];
            }
        }

        $pageHtml = $this->fetchWatchPage($videoId);
        if ($pageHtml) {
            $player = $this->extractPlayerResponse($pageHtml);
            $details = $player['videoDetails'] ?? [];
            if (! empty($details['title']) && ! in_array('Video Title: '.$details['title'], $parts, true)) {
                $parts[] = 'Video Title: '.$details['title'];
            }
            if (! empty($details['shortDescription'])) {
                $parts[] = 'Video Description: '.$details['shortDescription'];
            } elseif (preg_match('/"shortDescription":"((?:\\\\.|[^"\\\\])*)"/', $pageHtml, $matches)) {
                $description = json_decode('"'.$matches[1].'"');
                if (is_string($description) && trim($description) !== '') {
                    $parts[] = 'Video Description: '.$description;
                }
            }
        }

        $parts = array_values(array_unique(array_filter($parts)));

        return $parts === [] ? null : implode("\n\n", $parts);
    }

    private function fetchWatchPage(string $videoId): ?string
    {
        try {
            $response = Http::timeout(20)->withHeaders($this->browserHeaders())->get("https://www.youtube.com/watch?v={$videoId}");

            return $response->successful() ? $response->body() : null;
        } catch (\Throwable $e) {
            Log::warning('YouTube watch page fetch failed', [
                'video_id' => $videoId,
                'error' => $e->getMessage(),
            ]);

            return null;
        }
    }

    private function fetchViaInnertubeNext(string $videoId, ?string $visitorData): ?string
    {
        try {
            $context = $this->innertubeContext($visitorData);
            $response = Http::timeout(20)
                ->withHeaders($this->innertubeHeaders($visitorData))
                ->post($this->innertubeUrl('next'), [
                    'context' => $context,
                    'videoId' => $videoId,
                ]);

            if (! $response->successful()) {
                return null;
            }

            $params = $this->extractTranscriptParams($response->json());
            if (! $params) {
                return null;
            }

            return $this->requestInnertubeTranscript($params, $visitorData);
        } catch (\Throwable $e) {
            Log::warning('YouTube innertube next transcript fetch failed', [
                'video_id' => $videoId,
                'error' => $e->getMessage(),
            ]);

            return null;
        }
    }

    private function fetchViaInnertubeProtobuf(string $videoId, string $language, bool $isAsr, ?string $visitorData): ?string
    {
        try {
            $params = $this->buildTranscriptParams($videoId, $language, $isAsr);

            return $this->requestInnertubeTranscript($params, $visitorData);
        } catch (\Throwable $e) {
            return null;
        }
    }

    private function requestInnertubeTranscript(string $params, ?string $visitorData): ?string
    {
        $response = Http::timeout(20)
            ->withHeaders($this->innertubeHeaders($visitorData))
            ->post($this->innertubeUrl('get_transcript'), [
                'context' => $this->innertubeContext($visitorData),
                'params' => $params,
            ]);

        if (! $response->successful()) {
            return null;
        }

        return $this->parseInnertubeTranscript($response->json());
    }

    private function fetchCaptionUrl(string $captionUrl, string $referer): ?string
    {
        $variants = [
            $captionUrl,
            $captionUrl.'&fmt=json3',
            $captionUrl.'&fmt=vtt',
            $captionUrl.'&fmt=srv3',
        ];

        foreach (array_unique($variants) as $url) {
            try {
                $response = Http::timeout(20)->withHeaders([
                    ...$this->browserHeaders(),
                    'Referer' => $referer,
                    'Origin' => 'https://www.youtube.com',
                ])->get($url);

                if (! $response->successful()) {
                    continue;
                }

                $body = $response->body();
                if ($body === '') {
                    continue;
                }

                if (str_contains($url, 'fmt=json3') || str_starts_with(trim($body), '{')) {
                    $parsed = $this->parseCaptionJson($body);
                    if ($parsed !== null) {
                        return $parsed;
                    }
                }

                $parsed = $this->parseCaptionXml($body);
                if ($parsed !== null) {
                    return $parsed;
                }
            } catch (\Throwable) {
                continue;
            }
        }

        return null;
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function extractCaptionTracks(string $html): array
    {
        $player = $this->extractPlayerResponse($html);
        $tracks = $player['captions']['playerCaptionsTracklistRenderer']['captionTracks'] ?? null;
        if (is_array($tracks) && $tracks !== []) {
            return $tracks;
        }

        if (preg_match('/"captionTracks":(\[.*?\])/', $html, $matches)) {
            $decoded = json_decode($matches[1], true);

            return is_array($decoded) ? $decoded : [];
        }

        return [];
    }

    /**
     * @param  list<array<string, mixed>>  $tracks
     * @return list<array{0: string, 1: bool}>
     */
    private function preferredLanguages(array $tracks): array
    {
        $candidates = [];
        foreach ($tracks as $track) {
            $candidates[] = [
                (string) ($track['languageCode'] ?? 'en'),
                ($track['kind'] ?? '') === 'asr',
            ];
        }

        $defaults = [
            ['en', true],
            ['en', false],
            ['fil', true],
            ['fil', false],
            ['en-US', true],
            ['en-US', false],
        ];

        $merged = [];
        foreach (array_merge($candidates, $defaults) as $candidate) {
            $key = $candidate[0].':'.($candidate[1] ? 'asr' : 'manual');
            $merged[$key] = $candidate;
        }

        return array_values($merged);
    }

    private function extractTranscriptParams(array $data): ?string
    {
        foreach ($data['engagementPanels'] ?? [] as $panel) {
            $section = $panel['engagementPanelSectionListRenderer'] ?? null;
            if (($section['panelIdentifier'] ?? '') !== 'engagement-panel-searchable-transcript') {
                continue;
            }

            return $section['content']['continuationItemRenderer']['continuationEndpoint']['getTranscriptEndpoint']['params'] ?? null;
        }

        return null;
    }

    private function extractPlayerResponse(string $html): array
    {
        if (preg_match('/ytInitialPlayerResponse\s*=\s*(\{.+?\})\s*;/s', $html, $matches)) {
            $decoded = json_decode($matches[1], true);

            return is_array($decoded) ? $decoded : [];
        }

        return [];
    }

    private function extractVisitorData(string $html): ?string
    {
        if (preg_match('/"VISITOR_DATA":"([^"]+)"/', $html, $matches)) {
            return $matches[1];
        }

        return null;
    }

    private function buildTranscriptParams(string $videoId, string $language, bool $isAsr): string
    {
        $innerFields = $isAsr
            ? [1 => 'asr', 2 => $language]
            : [2 => $language];

        $innerB64 = $this->encodeProtobufMessage($innerFields);

        return $this->encodeProtobufMessage([1 => $videoId, 2 => $innerB64]);
    }

    /**
     * @param  array<int, string>  $fields
     */
    private function encodeProtobufMessage(array $fields): string
    {
        $buffer = '';
        ksort($fields);
        foreach ($fields as $fieldNumber => $value) {
            $buffer .= $this->encodeProtobufString((int) $fieldNumber, $value);
        }

        return base64_encode($buffer);
    }

    private function encodeProtobufString(int $fieldNumber, string $value): string
    {
        $tag = chr(($fieldNumber << 3) | 2);

        return $tag.$this->encodeVarint(strlen($value)).$value;
    }

    private function encodeVarint(int $value): string
    {
        $bytes = '';
        while ($value > 0x7F) {
            $bytes .= chr(($value & 0x7F) | 0x80);
            $value >>= 7;
        }

        return $bytes.chr($value);
    }

    private function parseInnertubeTranscript(array $data): ?string
    {
        $segments = $data['actions'][0]['updateEngagementPanelAction']['content']['transcriptRenderer']['content']['transcriptSearchPanelRenderer']['body']['transcriptSegmentListRenderer']['initialSegments'] ?? null;

        if (! is_array($segments) || $segments === []) {
            return null;
        }

        $lines = [];
        foreach ($segments as $segment) {
            $line = $segment['transcriptSectionHeaderRenderer'] ?? $segment['transcriptSegmentRenderer'] ?? null;
            if (! is_array($line)) {
                continue;
            }

            $text = $this->extractTextNode($line['snippet'] ?? []);
            $text = trim(preg_replace('/\s+/', ' ', $text) ?? '');
            if ($text !== '') {
                $lines[] = $text;
            }
        }

        return $lines === [] ? null : implode(' ', $lines);
    }

    private function parseCaptionJson(string $json): ?string
    {
        $data = json_decode($json, true);
        if (! is_array($data)) {
            return null;
        }

        $events = $data['events'] ?? [];
        $lines = [];
        foreach ($events as $event) {
            $segs = $event['segs'] ?? [];
            foreach ($segs as $seg) {
                $text = trim((string) ($seg['utf8'] ?? ''));
                if ($text !== '' && $text !== '\n') {
                    $lines[] = $text;
                }
            }
        }

        return $lines === [] ? null : Utf8Sanitizer::clean(implode(' ', $lines));
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

    private function extractTextNode(array $item): string
    {
        if (! empty($item['simpleText'])) {
            return (string) $item['simpleText'];
        }

        $runs = $item['runs'] ?? [];
        $parts = [];
        foreach ($runs as $run) {
            if (! empty($run['text'])) {
                $parts[] = $run['text'];
            }
        }

        return implode('', $parts);
    }

    /**
     * @return array<string, string>
     */
    private function browserHeaders(): array
    {
        return [
            'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept-Language' => 'en-US,en;q=0.9,fil;q=0.8',
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function innertubeContext(?string $visitorData): array
    {
        $client = [
            'clientName' => 'WEB',
            'clientVersion' => self::CLIENT_VERSION,
            'hl' => 'en',
        ];

        if ($visitorData) {
            $client['visitorData'] = $visitorData;
        }

        return ['client' => $client];
    }

    /**
     * @return array<string, string>
     */
    private function innertubeHeaders(?string $visitorData): array
    {
        $headers = [
            'Content-Type' => 'application/json',
            'User-Agent' => $this->browserHeaders()['User-Agent'],
        ];

        if ($visitorData) {
            $headers['X-Goog-Visitor-Id'] = $visitorData;
        }

        return $headers;
    }

    private function innertubeUrl(string $endpoint): string
    {
        return "https://www.youtube.com/youtubei/v1/{$endpoint}?key=".self::INNERTUBE_KEY;
    }
}
