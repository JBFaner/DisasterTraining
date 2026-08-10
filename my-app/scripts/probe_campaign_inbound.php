<?php

require __DIR__.'/../vendor/autoload.php';
$app = require __DIR__.'/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\Http;

$key = (string) config('group6.inbound.api_key');
$base = rtrim((string) config('app.url'), '/');
$url = $base.'/api/integrations/campaign-planning/campaign-requests?status=waiting_for_approval';

echo 'app_url='.$base.PHP_EOL;
echo 'inbound_key_set='.(filled($key) ? '1' : '0').PHP_EOL;
echo 'list_url='.$url.PHP_EOL;

$response = Http::timeout(30)
    ->withHeaders([
        'X-Group6-Api-Key' => $key,
        'Accept' => 'application/json',
    ])
    ->get($url);

echo 'http_status='.$response->status().PHP_EOL;
echo 'body='.substr($response->body(), 0, 800).PHP_EOL;
