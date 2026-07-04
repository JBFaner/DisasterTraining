<?php

namespace App\Services\Group6;

use App\Contracts\Group6\Group6InboundReceiverInterface;
use App\Models\Group6InboundRecord;

class Group6InboundReceiver implements Group6InboundReceiverInterface
{
    public function receive(string $recordType, array $payload, ?string $externalId = null): Group6InboundRecord
    {
        return Group6InboundRecord::create([
            'record_type' => $recordType,
            'external_id' => $externalId,
            'payload' => $payload,
            'status' => Group6InboundRecord::STATUS_PENDING,
            'received_at' => now(),
        ]);
    }
}
