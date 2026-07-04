<?php

namespace App\Contracts\Group6;

use App\Models\Group6InboundRecord;

/**
 * Receives and stages inbound data from Group 6's external system.
 *
 * Does not duplicate Group 6's business logic — only persists payloads for future processing.
 */
interface Group6InboundReceiverInterface
{
    /**
     * @param  array<string, mixed>  $payload
     */
    public function receive(string $recordType, array $payload, ?string $externalId = null): Group6InboundRecord;
}
