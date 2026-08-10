<?php

require __DIR__.'/../vendor/autoload.php';
$app = require __DIR__.'/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Contracts\Group6\Group6ApiClientInterface;
use App\Models\CampaignRequest;
use App\Services\Group6\CampaignSystemApiClient;
use Illuminate\Support\Facades\Http;

$client = app(CampaignSystemApiClient::class);
$bound = app(Group6ApiClientInterface::class);
$cr = CampaignRequest::query()->orderByDesc('id')->first();

echo 'bound='.get_class($bound).PHP_EOL;
echo 'configured='.($client->isConfigured() ? '1' : '0').PHP_EOL;
echo 'campaign_request_id='.($cr?->id ?? 'none').PHP_EOL;

$ref = new ReflectionClass($client);
$method = $ref->getMethod('resolveBearerToken');
$method->setAccessible(true);
$token = $method->invoke($client);
echo 'token_len='.strlen((string) $token).PHP_EOL;
echo 'token_jwt_parts='.substr_count((string) $token, '.').PHP_EOL;

if (! $cr) {
    exit(1);
}

$payload = $client->mapCampaignRequestToRemoteCampaign($cr);
$url = rtrim((string) config('group6.api.base_url'), '/')
    .(string) config('group6.api.endpoints.campaigns');
echo 'url='.$url.PHP_EOL;
echo 'payload_keys='.implode(',', array_keys($payload)).PHP_EOL;
foreach (['title', 'location', 'geographic_scope', 'category', 'objectives'] as $key) {
    $val = (string) ($payload[$key] ?? '');
    echo $key.'_len='.strlen($val).PHP_EOL;
}
echo 'zones_count='.count($payload['barangay_target_zones'] ?? []).PHP_EOL;
echo 'longest_zone_len='.max(array_map('strlen', array_map('strval', $payload['barangay_target_zones'] ?? ['']))).PHP_EOL;

$response = Http::timeout(30)->acceptJson()->withToken((string) $token)->post($url, $payload);
echo 'http_status='.$response->status().PHP_EOL;
echo 'body='.substr($response->body(), 0, 1500).PHP_EOL;

$log = storage_path('logs/laravel.log');
if (is_file($log)) {
    echo PHP_EOL.'--- recent campaign log hits ---'.PHP_EOL;
    $hits = [];
    foreach (file($log) as $line) {
        if (stripos($line, 'Campaign System') !== false
            || stripos($line, 'Training Intelligence outbound') !== false) {
            $hits[] = $line;
        }
    }
    echo implode('', array_slice($hits, -20));
}
