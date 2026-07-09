<?php

namespace Database\Seeders;

use App\Models\CampaignRequest;
use App\Services\SimulationEventPlanningService;
use Illuminate\Database\Seeder;

class ApproveCampaignScheduleSeeder extends Seeder
{
    public function run(): void
    {
        $requests = CampaignRequest::query()->orderBy('id')->get();

        foreach ($requests as $request) {
            $payload = is_array($request->payload) ? $request->payload : [];
            $sessions = is_array($payload['available_training_sessions'] ?? null)
                ? $payload['available_training_sessions']
                : [];
            $thresholds = SimulationEventPlanningService::resolveParticipantThresholds($sessions);

            $request->update([
                'status' => 'approved',
                'approved_at' => $request->approved_at ?? now(),
                'expected_participants' => $request->expected_participants ?: $thresholds['expected_participants'],
                'minimum_qualified_participants' => $request->minimum_qualified_participants ?: $thresholds['minimum_qualified_participants'],
            ]);
        }

        $this->command?->info('Approved '.$requests->count().' campaign schedule(s) for simulation planning.');
    }
}
