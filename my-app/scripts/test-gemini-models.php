<?php

require __DIR__.'/../vendor/autoload.php';

$app = require_once __DIR__.'/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$key = config('services.gemini.api_key');

echo 'GEMINI_API_KEY loaded: '.($key ? 'yes' : 'no').PHP_EOL;
if ($key) {
    echo 'Key length: '.strlen($key).PHP_EOL;
    echo 'Format OK (AIza...): '.(str_starts_with($key, 'AIza') ? 'yes' : 'no — key may be invalid').PHP_EOL;
}

$candidates = [
    'gemini-2.5-flash',
    'gemini-2.5-pro',
    'gemini-2.0-flash',
    'gemini-2.0-flash-lite',
    'gemini-flash-latest',
    'gemini-pro-latest',
    'gemini-1.5-flash',
    'gemini-1.5-pro',
    'gemini-pro',
];

foreach (['v1beta', 'v1'] as $version) {
    echo PHP_EOL.'=== LIST MODELS ('.$version.') ==='.PHP_EOL;
    $url = 'https://generativelanguage.googleapis.com/'.$version.'/models?key='.$key;
    $response = Illuminate\Support\Facades\Http::timeout(30)->get($url);

    echo 'HTTP '.$response->status().PHP_EOL;

    if (! $response->successful()) {
        $err = $response->json('error.message') ?? $response->body();
        echo 'Error: '.$err.PHP_EOL;
        continue;
    }

    $models = $response->json('models') ?? [];
    echo 'Total models: '.count($models).PHP_EOL;

    $generateContent = [];
    foreach ($models as $model) {
        $methods = $model['supportedGenerationMethods'] ?? [];
        if (in_array('generateContent', $methods, true)) {
            $name = $model['name'] ?? '';
            $generateContent[] = str_replace('models/', '', $name);
        }
    }

    echo 'generateContent-capable ('.count($generateContent).'):'.PHP_EOL;
    foreach ($generateContent as $name) {
        echo '  - '.$name.PHP_EOL;
    }
}

echo PHP_EOL.'=== GENERATE CONTENT SMOKE TESTS ==='.PHP_EOL;
$prompt = ['contents' => [['parts' => [['text' => 'Reply with exactly: OK']]]]];

foreach (['v1beta', 'v1'] as $version) {
    foreach ($candidates as $model) {
        $url = 'https://generativelanguage.googleapis.com/'.$version.'/models/'.$model.':generateContent?key='.$key;
        $response = Illuminate\Support\Facades\Http::timeout(45)->post($url, $prompt);
        $status = $response->status();
        if ($response->successful()) {
            $text = $response->json('candidates.0.content.parts.0.text') ?? '';
            echo "OK  {$version}/{$model} => ".trim(substr($text, 0, 80)).PHP_EOL;
        } else {
            $msg = $response->json('error.message') ?? 'unknown';
            if (strlen($msg) > 120) {
                $msg = substr($msg, 0, 120).'...';
            }
            echo "FAIL {$version}/{$model} HTTP {$status}: {$msg}".PHP_EOL;
        }
    }
}
