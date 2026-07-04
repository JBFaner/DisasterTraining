<?php

namespace App\Contracts\Group6;

/**
 * Future hook: map staged Group 6 payloads into this application's domain models.
 *
 * Not implemented until Group 6's API contract is finalized.
 */
interface Group6DataConsumerInterface
{
    /**
     * Process a single staged inbound record.
     *
     * @return array{success: bool, message: string}
     */
    public function consume(int $inboundRecordId): array;
}
