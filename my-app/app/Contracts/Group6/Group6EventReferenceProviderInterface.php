<?php

namespace App\Contracts\Group6;

use App\Models\SimulationEvent;

/**
 * Read-only reference data we may expose to Group 6 so they can link registrations to our events.
 *
 * This is not Group 6's campaign module — only a minimal integration DTO.
 */
interface Group6EventReferenceProviderInterface
{
    /**
     * @return array<string, mixed>
     */
    public function referenceFor(SimulationEvent $event): array;
}
