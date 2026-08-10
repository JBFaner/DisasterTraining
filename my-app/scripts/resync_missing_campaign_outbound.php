<?php

/**
 * One-shot: push Campaign Requests that never synced to Campaign System.
 * Usage: php scripts/resync_missing_campaign_outbound.php
 */
require __DIR__.'/../vendor/autoload.php';
$app = require __DIR__.'/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Contracts\Group6\Group6ApiClientInterface;
use App\Models\CampaignRequest;

$client = app(Group6ApiClientInterface::class);
$rows = CampaignRequest::query()->orderBy('id')->get();

foreach ($rows as $row) {
    $payload = is_array($row->payload) ? $row->payload : [];
    $externalId = $payload['external_campaign_id'] ?? null;
    if ($externalId) {
        echo "skip #{$row->id} already synced ext={$externalId}".PHP_EOL;
        continue;
    }

    echo "syncing #{$row->id} status={$row->status} ... ";
    $outbound = $client->submitTrainingIntelligence($row);
    if ($outbound['success'] ?? false) {
        $payload['external_campaign_id'] = $outbound['external_campaign_id'] ?? null;
        $payload['external_campaign_synced_at'] = now()->toIso8601String();
        $remarks = is_array($row->remarks) ? $row->remarks : [];
        $remarks['campaign_system_outbound'] = [
            'success' => true,
            'external_campaign_id' => $outbound['external_campaign_id'] ?? null,
            'synced_at' => now()->toIso8601String(),
            'via' => 'resync_missing_campaign_outbound',
        ];
        $row->update(['payload' => $payload, 'remarks' => $remarks]);
        echo 'OK ext='.($outbound['external_campaign_id'] ?? 'null').PHP_EOL;
    } else {
        $remarks = is_array($row->remarks) ? $row->remarks : [];
        $remarks['campaign_system_outbound'] = [
            'success' => false,
            'error' => $outbound['error'] ?? 'Unknown error',
            'attempted_at' => now()->toIso8601String(),
            'via' => 'resync_missing_campaign_outbound',
        ];
        $row->update(['remarks' => $remarks]);
        echo 'FAIL '.($outbound['error'] ?? 'unknown').PHP_EOL;
    }
}
