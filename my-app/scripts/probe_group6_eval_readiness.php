<?php

require __DIR__.'/../vendor/autoload.php';
$app = require __DIR__.'/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Group6InboundRecord;
use Illuminate\Support\Facades\Route;

echo 'inbound_total='.Group6InboundRecord::count().PHP_EOL;
echo 'inbound_pending='.Group6InboundRecord::where('status', 'pending')->count().PHP_EOL;
echo 'types='.Group6InboundRecord::query()->select('record_type')->distinct()->pluck('record_type')->implode(',').PHP_EOL;

$routes = collect(Route::getRoutes())
    ->map(fn ($r) => method_exists($r, 'uri') ? $r->uri() : '')
    ->filter(fn ($uri) => str_contains($uri, 'integrations') || str_contains($uri, 'survey') || str_contains($uri, 'feedback'))
    ->values()
    ->all();

echo 'integration_routes='.PHP_EOL;
foreach ($routes as $uri) {
    echo '  '.$uri.PHP_EOL;
}
