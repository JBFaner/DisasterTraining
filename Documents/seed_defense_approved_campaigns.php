<?php
/**
 * Defense demo seed: 10 approved campaigns (4 Fire, 3 Flood, 3 Earthquake)
 * with realistic registered participants (mix completed / in-progress / not started).
 *
 * Max participants = 30, Expected = 20.
 * Tag: payload.defense_seed = 2026-08-26
 *
 * Usage: php /tmp/seed_defense_approved_campaigns.php
 */
declare(strict_types=1);

require '/var/www/html/disaster_training_alertaraqc/my-app/vendor/autoload.php';
$app = require '/var/www/html/disaster_training_alertaraqc/my-app/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\CampaignRegistration;
use App\Models\CampaignRequest;
use App\Models\LessonCompletion;
use App\Models\TrainingContent;
use App\Models\TrainingModule;
use App\Models\User;
use App\Services\SimulationEventPlanningService;
use App\Support\CampaignRegistrationLink;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

const SEED_TAG = 'defense-2026-08-26';

$filipinoFirst = [
    'Juan', 'Maria', 'Jose', 'Ana', 'Pedro', 'Rosa', 'Carlos', 'Elena', 'Miguel', 'Sofia',
    'Antonio', 'Isabel', 'Ramon', 'Carmen', 'Luis', 'Patricia', 'Diego', 'Angela', 'Andres', 'Lucia',
    'Francisco', 'Teresa', 'Rafael', 'Gloria', 'Manuel', 'Beatriz', 'Gabriel', 'Camila', 'Emilio', 'Diana',
    'Ricardo', 'Andrea', 'Paolo', 'Bianca', 'Noel', 'Katrina', 'Jerome', 'Michelle', 'Mark', 'Christine',
    'Kevin', 'Jasmine', 'Allan', 'Princess', 'Bryan', 'Nicole', 'Christian', 'Angel', 'Joshua', 'Mary Joy',
];
$filipinoLast = [
    'Santos', 'Reyes', 'Cruz', 'Bautista', 'Ocampo', 'Garcia', 'Mendoza', 'Torres', 'Flores', 'Villanueva',
    'Ramos', 'Gonzales', 'Castillo', 'Aquino', 'Navarro', 'Domingo', 'Salazar', 'Pascual', 'Lopez', 'Dizon',
    'Mercado', 'Santiago', 'Del Rosario', 'Fernandez', 'Lim', 'Tan', 'Chua', 'Go', 'Sy', 'Urbano',
];

// Scope: Barangay San Agustin only — vary by purok/sitio/focus area, never other barangays.
$campaigns = [
    // 4 Fire — module 5
    [
        'hazard' => 'Fire', 'module_id' => 5,
        'title' => 'Fire Safety and Emergency Response — San Agustin Batch A',
        'barangay' => 'San Agustin',
        'area' => 'Purok 1–2 Residential Cluster',
        'focus' => 'Dense residential clusters and narrow access lanes in San Agustin Purok 1–2 — fire spread risk where homes are adjacent.',
        'registered' => 28, 'completed' => 16, 'in_progress' => 8,
        'reg_deadline_days' => -5, 'train_deadline_days' => -2,
    ],
    [
        'hazard' => 'Fire', 'module_id' => 5,
        'title' => 'Fire Extinguisher Drill — San Agustin Purok 3',
        'barangay' => 'San Agustin',
        'area' => 'Purok 3',
        'focus' => 'Household fire extinguisher competency for tightly packed homes in San Agustin Purok 3.',
        'registered' => 24, 'completed' => 10, 'in_progress' => 9,
        'reg_deadline_days' => -3, 'train_deadline_days' => -1,
    ],
    [
        'hazard' => 'Fire', 'module_id' => 5,
        'title' => 'Workplace Fire Evacuation — San Agustin Barangay Hall Area',
        'barangay' => 'San Agustin',
        'area' => 'Barangay Hall / Covered Court',
        'focus' => 'Barangay hall, covered court, and nearby offices — evacuation routes within San Agustin.',
        'registered' => 22, 'completed' => 6, 'in_progress' => 12,
        'reg_deadline_days' => -1, 'train_deadline_days' => 3,
    ],
    [
        'hazard' => 'Fire', 'module_id' => 5,
        'title' => 'Community Fire Watch Orientation — San Agustin Purok 5',
        'barangay' => 'San Agustin',
        'area' => 'Purok 5',
        'focus' => 'Neighborhood fire-watch volunteers and early reporting for San Agustin Purok 5.',
        'registered' => 18, 'completed' => 4, 'in_progress' => 10,
        'reg_deadline_days' => 4, 'train_deadline_days' => 10,
    ],
    // 3 Flood — module 7
    [
        'hazard' => 'Flood', 'module_id' => 7,
        'title' => 'Flood Preparedness and Response — San Agustin Low-Lying Areas',
        'barangay' => 'San Agustin',
        'area' => 'Creek-side / Low-lying Zones',
        'focus' => 'Flood-prone drainage corridors and family go-bag readiness in San Agustin low-lying zones.',
        'registered' => 26, 'completed' => 15, 'in_progress' => 7,
        'reg_deadline_days' => -6, 'train_deadline_days' => -2,
    ],
    [
        'hazard' => 'Flood', 'module_id' => 7,
        'title' => 'Flood Early Warning Drill — San Agustin Riverside Sitio',
        'barangay' => 'San Agustin',
        'area' => 'Riverside Sitio',
        'focus' => 'Early warning dissemination and vertical evacuation along San Agustin riverside sitio.',
        'registered' => 23, 'completed' => 9, 'in_progress' => 10,
        'reg_deadline_days' => -2, 'train_deadline_days' => 2,
    ],
    [
        'hazard' => 'Flood', 'module_id' => 7,
        'title' => 'Family Flood Evacuation Plan — San Agustin Purok 4',
        'barangay' => 'San Agustin',
        'area' => 'Purok 4',
        'focus' => 'Household evacuation mapping for San Agustin Purok 4 flood-exposed households.',
        'registered' => 20, 'completed' => 5, 'in_progress' => 11,
        'reg_deadline_days' => 5, 'train_deadline_days' => 12,
    ],
    // 3 Earthquake — module 8
    [
        'hazard' => 'Earthquake', 'module_id' => 8,
        'title' => 'Earthquake Preparedness — San Agustin ShakeOut',
        'barangay' => 'San Agustin',
        'area' => 'Whole Barangay (Phase 1)',
        'focus' => 'Drop-Cover-Hold On drills for residential blocks and schools within Barangay San Agustin.',
        'registered' => 27, 'completed' => 17, 'in_progress' => 6,
        'reg_deadline_days' => -7, 'train_deadline_days' => -3,
    ],
    [
        'hazard' => 'Earthquake', 'module_id' => 8,
        'title' => 'Drop Cover Hold Community Drill — San Agustin Elementary Zone',
        'barangay' => 'San Agustin',
        'area' => 'School / Covered Court Zone',
        'focus' => 'School and covered-court assembly after seismic event — San Agustin elementary zone.',
        'registered' => 25, 'completed' => 11, 'in_progress' => 9,
        'reg_deadline_days' => -4, 'train_deadline_days' => 1,
    ],
    [
        'hazard' => 'Earthquake', 'module_id' => 8,
        'title' => 'Post-Earthquake Safety Walkthrough — San Agustin Purok 6',
        'barangay' => 'San Agustin',
        'area' => 'Purok 6',
        'focus' => 'Aftershock awareness, utility shutoff, and first-aid staging for San Agustin Purok 6.',
        'registered' => 19, 'completed' => 3, 'in_progress' => 12,
        'reg_deadline_days' => 6, 'train_deadline_days' => 14,
    ],
];

function contentsForModule(int $moduleId): array
{
    return TrainingContent::query()
        ->where('training_module_id', $moduleId)
        ->orderBy('sort_order')
        ->orderBy('id')
        ->get(['id', 'training_module_id'])
        ->all();
}

function pickName(array $first, array $last, int $n): string
{
    return $first[$n % count($first)].' '.$last[($n * 7) % count($last)];
}

echo "=== Defense seed start ===\n";

// Optional: remove prior seed with same tag
$removed = 0;
$existing = CampaignRequest::query()->get();
foreach ($existing as $cr) {
    $payload = is_array($cr->payload) ? $cr->payload : [];
    if (($payload['defense_seed'] ?? null) === SEED_TAG) {
        $uids = CampaignRegistration::query()->where('campaign_request_id', $cr->id)->pluck('user_id');
        LessonCompletion::query()
            ->where('training_module_id', $cr->training_module_id)
            ->whereIn('user_id', $uids)
            ->where('created_at', '>=', now()->subDay())
            ->delete();
        CampaignRegistration::query()->where('campaign_request_id', $cr->id)->delete();
        $cr->delete();
        $removed++;
    }
}
echo "removed_prior_seed={$removed}\n";

$adminId = User::query()->where('role', 'LGU_ADMIN')->orderBy('id')->value('id') ?? 3;
$pool = User::query()->where('role', 'PARTICIPANT')->orderBy('id')->pluck('id')->all();
$neededParticipants = 0;
foreach ($campaigns as $spec) {
    $neededParticipants += min($spec['registered'], 30);
}
if (count($pool) < $neededParticipants + 10) {
    echo 'Creating extra demo participants to reach '.$neededParticipants."...\n";
    $start = count($pool);
    for ($i = $start; $i < $neededParticipants + 20; $i++) {
        $name = pickName($filipinoFirst, $filipinoLast, $i + 100);
        $email = 'defense.part.'.($i + 1).'.'.Str::lower(Str::random(4)).'@lgu.local';
        $u = User::create([
            'name' => $name,
            'email' => $email,
            'password' => Hash::make('Password123!'),
            'role' => 'PARTICIPANT',
            'status' => 'active',
            'barangay' => 'San Agustin',
            'city' => 'Quezon City',
            'province' => 'Metro Manila',
            'phone' => '09'.str_pad((string) (170000000 + $i), 9, '0', STR_PAD_LEFT),
            'email_verified_at' => now(),
        ]);
        $pool[] = $u->id;
    }
}
echo 'participant_pool='.count($pool).' needed='.$neededParticipants.PHP_EOL;

$moduleContents = [];
foreach ([5, 7, 8] as $mid) {
    $moduleContents[$mid] = contentsForModule($mid);
    if (count($moduleContents[$mid]) < 1) {
        fwrite(STDERR, "Module {$mid} has no contents/lessons — abort\n");
        exit(1);
    }
    echo "module{$mid}_contents=".count($moduleContents[$mid]).PHP_EOL;
}

$createdIds = [];
$cursor = 0;

DB::beginTransaction();
try {
    foreach ($campaigns as $idx => $spec) {
        $module = TrainingModule::findOrFail($spec['module_id']);
        $opens = Carbon::now()->subDays(20)->setTime(8, 0);
        $regDeadline = Carbon::now()->addDays($spec['reg_deadline_days'])->setTime(17, 0);
        $trainDeadline = Carbon::now()->addDays($spec['train_deadline_days'])->setTime(17, 0);
        $expected = 20;
        $maximum = 30;
        $minimum = 13; // ~65% of expected

        $payload = [
            'defense_seed' => SEED_TAG,
            'submitted_at' => now()->subDays(12 - $idx)->toIso8601String(),
            'training_module_id' => $module->id,
            'training_title' => $spec['title'],
            'short_description' => $module->short_description ?: $module->description,
            'related_hazards' => $spec['hazard'],
            'recommended_communities' => [
                'summary' => [
                    'total_communities' => 1,
                    'high_priority' => 0,
                    'medium_priority' => 1,
                    'low_priority' => 0,
                ],
                'communities' => [[
                    'barangay_profile_id' => 9,
                    'barangay_name' => 'San Agustin',
                    'municipality_city' => 'Quezon City',
                    'province' => 'Metro Manila',
                    'related_hazard' => $spec['hazard'],
                    'risk_level' => 'Medium',
                    'exposure_scope' => 'pattern_based',
                    'focus_area' => $spec['focus'],
                    'area_label' => $spec['area'] ?? 'San Agustin',
                    'priority_level' => 'Priority 2',
                    'priority_score' => 50,
                    'recommendation_reason' => 'Barangay San Agustin ('.($spec['area'] ?? 'local area').') — scoped for local preparedness training.',
                ]],
            ],
            'target_audience' => ['Residents', 'Barangay responders', 'School personnel'],
            'registration_opens' => $opens->toIso8601String(),
            'registration_deadline' => $regDeadline->toIso8601String(),
            'training_completion_deadline' => $trainDeadline->toIso8601String(),
            'expected_participants' => $expected,
            'maximum_participants' => $maximum,
            'published_status' => 'published',
            'registration_enabled' => true,
        ];

        $req = CampaignRequest::create([
            'training_module_id' => $module->id,
            'submitted_to' => 'Public Safety Campaign Management System',
            'proposed_session_label' => 'Defense demo — San Agustin · '.($spec['area'] ?? 'local'),
            'submitted_at' => now()->subDays(12 - $idx),
            'approved_at' => now()->subDays(10 - $idx),
            'status' => 'approved',
            'expected_participants' => $expected,
            'minimum_qualified_participants' => $minimum,
            'session_index' => $idx + 1,
            'payload' => $payload,
            'remarks' => ['defense_seed' => SEED_TAG, 'note' => 'Seeded for final defense presentation'],
            'submitted_by_id' => $adminId,
        ]);

        $payload['registration_link'] = CampaignRegistrationLink::forCampaignRequest($req);
        $req->payload = $payload;
        $req->save();

        $need = min($spec['registered'], $maximum);
        if ($cursor + $need > count($pool)) {
            throw new RuntimeException('Participant pool exhausted at campaign '.$spec['title']);
        }
        $userIds = array_slice($pool, $cursor, $need);
        $cursor += $need;

        $completedN = min($spec['completed'], count($userIds));
        $inProgressN = min($spec['in_progress'], max(0, count($userIds) - $completedN));
        $contents = $moduleContents[$module->id];

        foreach ($userIds as $i => $userId) {
            CampaignRegistration::create([
                'user_id' => $userId,
                'campaign_request_id' => $req->id,
                'training_module_id' => $module->id,
                'registration_status' => CampaignRegistration::STATUS_REGISTERED,
                'registered_at' => now()->subDays(rand(2, 18))->subHours(rand(0, 20)),
                'attendance_status' => CampaignRegistration::ATTENDANCE_NOT_STARTED,
                'evaluation_status' => CampaignRegistration::EVALUATION_NOT_STARTED,
                'certificate_status' => CampaignRegistration::CERTIFICATE_NOT_ISSUED,
            ]);

            if ($i < $completedN) {
                // Completed: at least 3 lesson completions (service treats >=3 as Completed)
                $take = min(max(3, count($contents)), count($contents));
                foreach (array_slice($contents, 0, $take) as $c) {
                    LessonCompletion::firstOrCreate(
                        [
                            'user_id' => $userId,
                            'training_module_id' => $module->id,
                            'training_content_id' => $c->id,
                        ],
                        [
                            'training_lesson_id' => null,
                            'completed_at' => now()->subDays(rand(1, 8)),
                        ]
                    );
                }
            } elseif ($i < $completedN + $inProgressN) {
                // In progress: 1–2 lessons only
                $take = rand(1, min(2, count($contents)));
                foreach (array_slice($contents, 0, $take) as $c) {
                    LessonCompletion::firstOrCreate(
                        [
                            'user_id' => $userId,
                            'training_module_id' => $module->id,
                            'training_content_id' => $c->id,
                        ],
                        [
                            'training_lesson_id' => null,
                            'completed_at' => now()->subDays(rand(0, 3)),
                        ]
                    );
                }
            }
            // else: not started
        }

        $createdIds[] = $req->id;
        echo sprintf(
            "OK #%d [%s] %s | reg=%d completed~%d inprog~%d | barangay=%s\n",
            $req->id,
            $spec['hazard'],
            $spec['title'],
            count($userIds),
            $completedN,
            $inProgressN,
            $spec['barangay']
        );
    }
    DB::commit();
} catch (Throwable $e) {
    DB::rollBack();
    fwrite(STDERR, 'SEED FAILED: '.$e->getMessage().PHP_EOL.$e->getTraceAsString().PHP_EOL);
    exit(1);
}

echo "\n=== Verify planning list ===\n";
$planning = app(SimulationEventPlanningService::class);
$rows = $planning->listApprovedSchedules();
$seedRows = $rows->filter(fn ($r) => in_array((int) ($r['campaign_request_id'] ?? $r['campaign_id'] ?? 0), $createdIds, true));
echo 'approved_total='.$rows->count().' seeded_in_list='.$seedRows->count().PHP_EOL;

$ready = 0;
$waitingQual = 0;
$waitingReg = 0;
foreach ($seedRows as $r) {
    $label = $r['simulation_readiness_label'] ?? $r['simulation_readiness'] ?? '?';
    $title = $r['training_title'] ?? $r['campaign_title'] ?? '?';
    $reg = $r['registered_participants_count'] ?? '?';
    $qual = $r['qualified_participants'] ?? '?';
    $max = $r['maximum_participants'] ?? 30;
    echo sprintf(
        "  #%s | %s | %s/%s reg | %s qual | %s | plan=%s\n",
        $r['campaign_request_id'] ?? $r['campaign_id'] ?? '?',
        $title,
        $reg,
        $max,
        $qual,
        $label,
        $r['simulation_plan_badge_label'] ?? $r['simulation_plan_badge'] ?? 'Not Created'
    );
    $key = (string) ($r['simulation_readiness'] ?? '');
    if ($key === 'ready') {
        $ready++;
    } elseif (str_contains(strtolower($label), 'qualif')) {
        $waitingQual++;
    } elseif (str_contains(strtolower($label), 'regist')) {
        $waitingReg++;
    }
}

echo "\nSUMMARY ready~{$ready} waiting_qual~{$waitingQual} waiting_reg~{$waitingReg}\n";
echo 'SEED_IDS='.implode(',', $createdIds).PHP_EOL;
echo "DONE\n";
