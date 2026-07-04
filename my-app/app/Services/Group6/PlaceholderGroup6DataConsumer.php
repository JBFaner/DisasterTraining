<?php

namespace App\Services\Group6;

use App\Contracts\Group6\Group6DataConsumerInterface;
use App\Models\Group6InboundRecord;

/**
 * Placeholder consumer — records stay pending until Group 6's API contract is implemented.
 */
class PlaceholderGroup6DataConsumer implements Group6DataConsumerInterface
{
    public function consume(int $inboundRecordId): array
    {
        $record = Group6InboundRecord::find($inboundRecordId);

        if (! $record) {
            return ['success' => false, 'message' => 'Inbound record not found.'];
        }

        return [
            'success' => false,
            'message' => 'Group 6 data consumer is not yet implemented. Record remains pending.',
        ];
    }
}
