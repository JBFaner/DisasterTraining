<?php

namespace Database\Seeders;

use App\Models\CampaignRegistration;
use App\Models\CampaignRequest;
use App\Models\LessonQuizAttempt;
use App\Models\TrainingModule;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * Assign Fire Safety lesson-quiz participants (without a campaign batch)
 * into separate approved batches filled up to the module quota.
 *
 * Run: php artisan db:seed --class=EvaluationFireBatchAssignmentSeeder
 */
class EvaluationFireBatchAssignmentSeeder extends Seeder
{
    private const LABEL_PREFIX = 'Fire Safety — Eval Batch ';

    public function run(): void
    {
        $module = TrainingModule::query()
            ->where('title', 'Fire Safety and Emergency Response')
            ->first();

        if (! $module) {
            $this->command?->error('Fire Safety and Emergency Response module not found.');

            return;
        }

        $quota = (int) ($module->campaign_expected_participants ?: 20);
        $maximum = (int) ($module->campaign_maximum_participants ?: max($quota, 30));
        if ($quota < 1) {
            $quota = 20;
        }
        if ($maximum < $quota) {
            $maximum = $quota;
        }

        $quizUserIds = LessonQuizAttempt::query()
            ->where('training_module_id', $module->id)
            ->distinct()
            ->pluck('user_id');

        $alreadyBatched = CampaignRegistration::query()
            ->where('training_module_id', $module->id)
            ->where('registration_status', CampaignRegistration::STATUS_REGISTERED)
            ->whereIn('user_id', $quizUserIds)
            ->pluck('user_id')
            ->unique();

        $unassignedIds = $quizUserIds->diff($alreadyBatched)->values();

        // Prefer coverage demo users first, then others by id.
        $coverageIds = User::query()
            ->whereIn('id', $unassignedIds)
            ->where('email', 'like', 'eval.coverage.%')
            ->orderBy('id')
            ->pluck('id');
        $otherIds = User::query()
            ->whereIn('id', $unassignedIds->diff($coverageIds))
            ->orderBy('id')
            ->pluck('id');

        $orderedUserIds = $coverageIds->concat($otherIds)->values();

        if ($orderedUserIds->isEmpty()) {
            $this->command?->info('All Fire lesson-quiz participants already have a batch.');

            return;
        }

        $chunks = $orderedUserIds->chunk($quota)->values();
        $existingEvalBatches = CampaignRequest::query()
            ->where('training_module_id', $module->id)
            ->where('proposed_session_label', 'like', self::LABEL_PREFIX.'%')
            ->count();
        $nextSession = $existingEvalBatches + 1;

        $this->command?->info(sprintf(
            'Assigning %d Fire participants into %d batch(es) (quota %d / max %d).',
            $orderedUserIds->count(),
            $chunks->count(),
            $quota,
            $maximum,
        ));

        $adminId = User::query()
            ->whereIn('role', ['LGU_ADMIN', 'SUPER_ADMIN', 'ADMIN'])
            ->orderBy('id')
            ->value('id');

        DB::transaction(function () use ($chunks, $module, $quota, $maximum, $nextSession, $adminId) {
            foreach ($chunks as $offset => $userIds) {
                $sessionIndex = $nextSession + $offset;
                $label = self::LABEL_PREFIX.$sessionIndex;
                $minimum = (int) max(1, round($quota * 0.67));

                $payload = [
                    'submitted_at' => now()->toIso8601String(),
                    'training_module_id' => $module->id,
                    'training_title' => $module->title,
                    'short_description' => $module->description,
                    'recommended_communities' => null,
                    'target_audience' => ['residents', 'barangay_officials', 'emergency_responders', 'community_leaders'],
                    'registration_opens' => now()->subDays(14)->toIso8601String(),
                    'registration_deadline' => now()->addDays(14)->toIso8601String(),
                    'training_completion_deadline' => now()->addDays(30)->toIso8601String(),
                    'expected_participants' => $quota,
                    'maximum_participants' => $maximum,
                    'published_status' => 'published',
                    'registration_enabled' => true,
                    'seed_source' => 'EvaluationFireBatchAssignmentSeeder',
                ];

                $campaign = CampaignRequest::create([
                    'training_module_id' => $module->id,
                    'submitted_to' => 'Public Safety Campaign Management System',
                    'proposed_session_label' => $label,
                    'submitted_at' => now(),
                    'approved_at' => now(),
                    'status' => 'approved',
                    'expected_participants' => $quota,
                    'minimum_qualified_participants' => $minimum,
                    'session_index' => $sessionIndex,
                    'payload' => $payload,
                    'remarks' => [
                        'seed_source' => 'EvaluationFireBatchAssignmentSeeder',
                        'note' => 'Evaluation demo batches for Lesson Quiz coverage participants.',
                    ],
                    'submitted_by_id' => $adminId,
                ]);

                $payload['registration_link'] = url('/campaigns/'.$campaign->id.'/register');
                $payload['registration_form_path'] = '/campaigns/'.$campaign->id.'/register';
                $campaign->update(['payload' => $payload]);

                $now = Carbon::now();
                foreach ($userIds as $userId) {
                    CampaignRegistration::updateOrCreate(
                        [
                            'user_id' => (int) $userId,
                            'campaign_request_id' => $campaign->id,
                        ],
                        [
                            'training_module_id' => $module->id,
                            'registration_status' => CampaignRegistration::STATUS_REGISTERED,
                            'registered_at' => $now,
                            'attendance_status' => CampaignRegistration::ATTENDANCE_NOT_STARTED,
                            'evaluation_status' => CampaignRegistration::EVALUATION_NOT_STARTED,
                            'certificate_status' => CampaignRegistration::CERTIFICATE_NOT_ISSUED,
                        ],
                    );
                }

                $this->command?->info(sprintf(
                    'Created %s (campaign #%d) with %d participants.',
                    $label,
                    $campaign->id,
                    $userIds->count(),
                ));
            }
        });
    }
}
