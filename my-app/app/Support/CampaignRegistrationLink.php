<?php

namespace App\Support;

use App\Models\CampaignRequest;
use App\Models\SimulationEvent;

class CampaignRegistrationLink
{
    public static function forCampaignRequest(CampaignRequest|int $campaignRequest): string
    {
        $id = $campaignRequest instanceof CampaignRequest ? $campaignRequest->id : $campaignRequest;

        return url('/campaigns/'.$id.'/register');
    }

    public static function forSimulationEvent(SimulationEvent|int $event): string
    {
        $id = $event instanceof SimulationEvent ? $event->id : $event;

        return url('/participant/register?campaign_event='.$id);
    }
}
