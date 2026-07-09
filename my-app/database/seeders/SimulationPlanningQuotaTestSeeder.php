<?php

namespace Database\Seeders;

use App\Models\CampaignRequest;
use App\Models\LessonCompletion;
use App\Models\TrainingContent;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class SimulationPlanningQuotaTestSeeder extends Seeder
{
    public function run(): void
    {
        DB::transaction(function () {
            $request = CampaignRequest::query()
                ->where('status', 'approved')
                ->orderByDesc('approved_at')
                ->orderByDesc('id')
                ->first();

            if (! $request) {
                $this->command?->warn('No approved CampaignRequest found. Run ApproveCampaignScheduleSeeder first.');
                return;
            }

            $trainingModuleId = (int) $request->training_module_id;
            if ($trainingModuleId <= 0) {
                $this->command?->warn('Approved CampaignRequest has no training_module_id.');
                return;
            }

            $payload = is_array($request->payload) ? $request->payload : [];
            $community = '—';
            $recommended = $payload['recommended_communities'] ?? null;
            if (is_array($recommended) && is_array($recommended['communities'] ?? null)) {
                $first = $recommended['communities'][0] ?? null;
                if (is_array($first)) {
                    $community = (string) ($first['barangay_name'] ?? $community);
                }
            }

            $contents = TrainingContent::query()
                ->where('training_module_id', $trainingModuleId)
                ->orderBy('sort_order')
                ->limit(3)
                ->get(['id', 'training_module_id']);

            if ($contents->count() === 0) {
                $this->command?->warn("Training module {$trainingModuleId} has no lessons/contents. Seed TrainingModuleSeeder first.");
                return;
            }

            // Default mix for testing:
            // - completed users meet the minimum qualified quota
            // - in progress users show up in monitoring
            // - not started users show up in monitoring
            $minimumQualified = (int) ($request->minimum_qualified_participants ?? 0);
            if ($minimumQualified <= 0) {
                $minimumQualified = 5;
            }

            $completedCount = $minimumQualified;
            $inProgressCount = 3;
            $notStartedCount = 2;

            // Ensure the request's minimum reflects what we will seed (so quota becomes met).
            $request->update([
                'minimum_qualified_participants' => $minimumQualified,
                'expected_participants' => max((int) ($request->expected_participants ?? 0), $minimumQualified + $inProgressCount + $notStartedCount),
            ]);

            $created = [
                'completed' => 0,
                'in_progress' => 0,
                'not_started' => 0,
            ];

            $nowStamp = now()->format('YmdHis');

            $makeParticipant = function (string $suffix) use ($community, $nowStamp): User {
                $participantId = $this->uniqueParticipantId();
                return User::create([
                    'name' => "Planning {$suffix} {$nowStamp}",
                    'email' => "planning.{$suffix}+".Str::lower(Str::random(6))."@example.com",
                    'password' => bcrypt('password'),
                    'role' => 'PARTICIPANT',
                    'status' => 'active',
                    'participant_id' => $participantId,
                    'registered_at' => now(),
                    'barangay' => $community !== '—' ? $community : null,
                ]);
            };

            $seedCompletions = function (User $user, int $count) use ($trainingModuleId, $contents) {
                $targets = $contents->take($count);
                foreach ($targets as $content) {
                    LessonCompletion::updateOrCreate(
                        [
                            'user_id' => $user->id,
                            'training_module_id' => $trainingModuleId,
                            'training_content_id' => $content->id,
                        ],
                        [
                            'completed_at' => now()->subMinutes(random_int(5, 180)),
                        ],
                    );
                }
            };

            // Completed (>=3 lesson completions)
            for ($i = 0; $i < $completedCount; $i++) {
                $user = $makeParticipant('completed');
                $seedCompletions($user, min(3, $contents->count()));
                $created['completed']++;
            }

            // In progress (1 lesson completion)
            for ($i = 0; $i < $inProgressCount; $i++) {
                $user = $makeParticipant('inprogress');
                $seedCompletions($user, 1);
                $created['in_progress']++;
            }

            // Not started (no records)
            for ($i = 0; $i < $notStartedCount; $i++) {
                $makeParticipant('notstarted');
                $created['not_started']++;
            }

            $this->command?->info(
                "Seeded Simulation Planning quota test data for CampaignRequest {$request->id} (TrainingModule {$trainingModuleId}). ".
                "Community: {$community}. ".
                "Completed={$created['completed']} InProgress={$created['in_progress']} NotStarted={$created['not_started']}. ".
                "MinimumQualified={$minimumQualified}."
            );
        });
    }

    private function uniqueParticipantId(): string
    {
        do {
            $id = 'PART-' . strtoupper(Str::random(8));
        } while (User::where('participant_id', $id)->exists());

        return $id;
    }
}

