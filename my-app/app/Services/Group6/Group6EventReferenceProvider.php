<?php

namespace App\Services\Group6;

use App\Contracts\Group6\Group6EventReferenceProviderInterface;
use App\Models\SimulationEvent;

class Group6EventReferenceProvider implements Group6EventReferenceProviderInterface
{
    public function referenceFor(SimulationEvent $event): array
    {
        return [
            'event_id' => $event->id,
            'event_title' => $event->title,
            'event_date' => $event->event_date?->format('Y-m-d'),
            'start_time' => $event->start_time,
            'end_time' => $event->end_time,
            'venue' => $event->venue ?? $event->location,
            'status' => $event->status,
        ];
    }
}
