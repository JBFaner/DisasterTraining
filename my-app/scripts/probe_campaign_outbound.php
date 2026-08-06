<?php
use App\Contracts\Group6\Group6ApiClientInterface;
use App\Models\CampaignRequest;
use Illuminate\Contracts\Console\Kernel;
require __DIR__.'/../vendor/autoload.php';
$app = require __DIR__.'/../bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();
$rows = CampaignRequest::orderByDesc('id')->limit(8)->get();
foreach ($rows as $r) {
    $remarks = is_array($r->remarks) ? $r->remarks : [];
    $payload = is_array($r->payload) ? $r->payload : [];
    echo json_encode([
        'id' => $r->id,
        'status' => $r->status,
        'outbound' => $remarks['campaign_system_outbound'] ?? null,
        'external_campaign_id' => $payload['external_campaign_id'] ?? null,
    ], JSON_UNESCAPED_SLASHES) . PHP_EOL;
}
$latest = CampaignRequest::orderByDesc('id')->first();
if ($latest) {
    $client = app(Group6ApiClientInterface::class);
    $mapped = $client->mapCampaignRequestToRemoteCampaign($latest);
    echo "MAPPED_FOR_ID=" . $latest->id . PHP_EOL;
    echo json_encode([
        'title_len' => strlen((string)$mapped['title']),
        'location' => $mapped['location'],
        'location_len' => strlen((string)$mapped['location']),
        'geographic_scope' => $mapped['geographic_scope'],
        'geographic_scope_len' => strlen((string)$mapped['geographic_scope']),
        'category' => $mapped['category'],
        'assigned_staff_type' => gettype($mapped['assigned_staff']),
        'barangay_target_zones_type' => gettype($mapped['barangay_target_zones']),
        'assigned_staff' => $mapped['assigned_staff'],
        'barangay_target_zones' => $mapped['barangay_target_zones'],
        'staff_count' => $mapped['staff_count'],
    ], JSON_PRETTY_PRINT|JSON_UNESCAPED_SLASHES) . PHP_EOL;
}
