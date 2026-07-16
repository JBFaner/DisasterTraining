<?php

namespace App\Http\Controllers;

use App\Http\Controllers\QualifiedTrainerController;
use App\Models\User;
use App\Models\SimulationEvent;
use App\Mail\ParticipantVerificationEmail;
use App\Services\AuditLogger;
use App\Services\Group6\ParticipantSyncService;
use App\Services\ParticipantUpsertService;
use App\Services\ParticipantRegistryService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Mail;

class ParticipantController extends Controller
{
    public function __construct(
        private readonly ParticipantRegistryService $registry,
        private readonly ParticipantSyncService $syncService,
        private readonly ParticipantUpsertService $participantUpsertService,
    ) {}

    /**
     * Display the participant registry.
     */
    public function index(Request $request)
    {
        $this->authorizeParticipantAccess();

        $summaryBase = User::where('role', 'PARTICIPANT');
        $startOfMonth = now()->startOfMonth();

        $participantsSummary = [
            'total' => (clone $summaryBase)->count(),
            'active' => (clone $summaryBase)->where('status', 'active')->count(),
            'inactive' => (clone $summaryBase)->where('status', 'inactive')->count(),
            'synced_this_month' => (clone $summaryBase)->where('last_synced_at', '>=', $startOfMonth)->count(),
            'local' => (clone $summaryBase)->where(function ($query) {
                $query->whereNull('group6_external_id')
                    ->where(function ($inner) {
                        $inner->whereNull('registration_source')
                            ->orWhereNotIn('registration_source', ['synced', 'campaign_planning_scheduling']);
                    });
            })->count(),
            'campaign' => (clone $summaryBase)->where(function ($query) {
                $query->whereNotNull('group6_external_id')
                    ->orWhereIn('registration_source', ['synced', 'campaign_planning_scheduling']);
            })->count(),
        ];

        $query = User::where('role', 'PARTICIPANT')
            ->withCount(['eventRegistrations', 'attendances']);

        if ($request->filled('search')) {
            $search = $request->string('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('participant_id', 'like', "%{$search}%")
                    ->orWhere('group6_external_id', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        if ($request->filled('status_filter')) {
            $query->where('status', $request->string('status_filter'));
        }

        if ($request->filled('source_filter') && $request->string('source_filter') !== 'all') {
            $source = $request->string('source_filter')->toString();
            if (in_array($source, ['campaign', 'synced'], true)) {
                $query->where(function ($q) {
                    $q->whereNotNull('group6_external_id')
                        ->orWhereIn('registration_source', ['synced', 'campaign_planning_scheduling']);
                });
            } elseif (in_array($source, ['local', 'walk-in'], true)) {
                $query->where(function ($q) {
                    $q->whereNull('group6_external_id')
                        ->where(function ($inner) {
                            $inner->whereNull('registration_source')
                                ->orWhereNotIn('registration_source', ['synced', 'campaign_planning_scheduling']);
                        });
                });
            }
        }

        if ($request->filled('module_filter')) {
            $moduleId = (int) $request->input('module_filter');
            if ($moduleId > 0) {
                $query->whereHas('campaignRegistrations', function ($q) use ($moduleId) {
                    $q->where('training_module_id', $moduleId)
                        ->where('registration_status', \App\Models\CampaignRegistration::STATUS_REGISTERED);
                });
            }
        }

        if ($request->filled('batch_filter')) {
            $batchId = (int) $request->input('batch_filter');
            if ($batchId > 0) {
                $query->whereHas('campaignRegistrations', function ($q) use ($batchId) {
                    $q->where('campaign_request_id', $batchId)
                        ->where('registration_status', \App\Models\CampaignRegistration::STATUS_REGISTERED);
                });
            }
        }

        if ($request->filled('date_from')) {
            $dateFrom = $request->date('date_from');
            if ($dateFrom) {
                $query->whereRaw('DATE(COALESCE(registered_at, created_at)) >= ?', [$dateFrom->toDateString()]);
            }
        }

        if ($request->filled('date_to')) {
            $dateTo = $request->date('date_to');
            if ($dateTo) {
                $query->whereRaw('DATE(COALESCE(registered_at, created_at)) <= ?', [$dateTo->toDateString()]);
            }
        }

        if ($request->filled('barangay_filter')) {
            $query->where('barangay', $request->string('barangay_filter'));
        }

        if ($request->filled('municipality_filter')) {
            $query->where('city', $request->string('municipality_filter'));
        }

        if ($request->filled('training_status_filter')) {
            $this->applyTrainingStatusFilter($query, $request->string('training_status_filter'));
        }

        if ($request->filled('certificate_status_filter')) {
            $this->applyCertificateStatusFilter($query, $request->string('certificate_status_filter'));
        }

        $sortBy = $request->string('sort_by', 'name');
        $sortDir = $request->string('sort_dir', 'asc') === 'desc' ? 'desc' : 'asc';
        $allowedSorts = ['name', 'email', 'participant_id', 'status', 'barangay', 'city', 'last_synced_at', 'created_at'];
        if (! in_array($sortBy, $allowedSorts, true)) {
            $sortBy = 'name';
        }

        $exportAll = $request->boolean('export_all') || $request->string('per_page')->toString() === 'all';
        if ($exportAll && $request->expectsJson()) {
            $participants = collect($this->registry->enrichMany(
                $query->orderBy($sortBy, $sortDir)->limit(2000)->get()
            ));

            return response()->json([
                'participants' => $participants->values()->all(),
                'pagination' => [
                    'current_page' => 1,
                    'last_page' => 1,
                    'per_page' => $participants->count(),
                    'total' => $participants->count(),
                    'from' => $participants->isEmpty() ? null : 1,
                    'to' => $participants->isEmpty() ? null : $participants->count(),
                ],
                'filter_options' => $this->registry->buildFilterOptions(),
            ]);
        }

        $perPage = 10;
        $paginator = $query->orderBy($sortBy, $sortDir)->paginate($perPage)->withQueryString();
        $participants = collect($this->registry->enrichMany($paginator->items()));

        $participantsPagination = [
            'current_page' => $paginator->currentPage(),
            'last_page' => $paginator->lastPage(),
            'per_page' => $paginator->perPage(),
            'total' => $paginator->total(),
            'from' => $paginator->firstItem(),
            'to' => $paginator->lastItem(),
        ];

        $events = SimulationEvent::with(['scenario'])
            ->withCount([
                'registrations',
                'registrations as approved_registrations_count' => function ($query) {
                    $query->where('status', 'approved');
                },
            ])
            ->whereIn('status', ['published', 'ongoing', 'completed'])
            ->orderByDesc('event_date')
            ->get();

        if ($request->expectsJson()) {
            $payload = [
                'participants' => $participants->values()->all(),
                'pagination' => $participantsPagination,
                'filter_options' => $this->registry->buildFilterOptions(),
            ];

            if ($request->string('list') === 'trainers') {
                return response()->json(QualifiedTrainerController::buildListResponse($request));
            }

            return response()->json($payload);
        }

        $trainerList = QualifiedTrainerController::buildListResponse($request);

        return view('app', [
            'section' => 'participants',
            'participants' => $participants->values()->all(),
            'participantsPagination' => $participantsPagination,
            'participantsSummary' => $participantsSummary,
            'participantFilterOptions' => $this->registry->buildFilterOptions(),
            'qualifiedTrainers' => $trainerList['trainers'],
            'qualifiedTrainersPagination' => $trainerList['pagination'],
            'qualifiedTrainersSummary' => $trainerList['summary'],
            'events' => $events,
        ]);
    }

    /**
     * Sync participant records from the external registration system.
     */
    public function sync(Request $request)
    {
        $this->authorizeParticipantAccess();

        $result = $this->syncService->syncFromApi();

        AuditLogger::log([
            'user' => portal_user(),
            'action' => 'Synced participant registry',
            'module' => 'Participant Registry',
            'status' => $result['success'] ? 'success' : 'warning',
            'description' => $result['message'] ?? 'Participant registry sync attempted.',
        ]);

        if ($request->expectsJson()) {
            return response()->json($result, $result['success'] ? 200 : 501);
        }

        return redirect()
            ->route('admin.participants.index')
            ->with($result['success'] ? 'status' : 'error', $result['message']);
    }

    public function resendVerificationEmail(User $user, Request $request)
    {
        $this->authorizeParticipantAccess();
        if ($user->role !== 'PARTICIPANT') {
            abort(404);
        }

        if ($user->email_verified_at) {
            return response()->json([
                'success' => false,
                'message' => 'This participant email is already verified.',
            ], 422);
        }

        $code = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        Cache::put("participant_email_verification_code:{$user->id}", $code, now()->addMinutes(15));
        Cache::put("participant_email_verification_last_sent:{$user->id}", now()->getTimestamp(), now()->addMinutes(15));

        try {
            Mail::to($user->email)->send(new ParticipantVerificationEmail($code, $user->name));
        } catch (\Throwable $e) {
            \Log::error('Failed to resend participant verification email from admin panel: '.$e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to send verification email. Please try again later.',
            ], 500);
        }

        AuditLogger::log([
            'user' => portal_user(),
            'action' => 'Resent participant verification code',
            'module' => 'Participant Registry',
            'status' => 'success',
            'description' => "Resent verification code to {$user->email}.",
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Verification code resent successfully.',
        ]);
    }

    public function store(Request $request)
    {
        $this->authorizeParticipantAccess();

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255'],
            'phone' => ['required', 'string', 'max:50'],
            'barangay' => ['nullable', 'string', 'max:255'],
            'city' => ['nullable', 'string', 'max:255'],
            'province' => ['nullable', 'string', 'max:255'],
            'street' => ['nullable', 'string', 'max:255'],
            'status' => ['required', 'in:active,inactive'],
        ]);

        $participant = $this->participantUpsertService->upsert([
            'name' => $data['name'],
            'email' => $data['email'],
            'phone' => $data['phone'],
            'barangay' => $data['barangay'] ?? null,
            'city' => $data['city'] ?? null,
            'province' => $data['province'] ?? null,
            'street' => $data['street'] ?? null,
            'status' => $data['status'],
            'registered_at' => now(),
            'registration_source' => 'local',
        ]);

        AuditLogger::log([
            'user' => portal_user(),
            'action' => 'Registered participant',
            'module' => 'Participant Registry',
            'status' => 'success',
            'description' => "Participant {$participant->name} was registered in the unified registry.",
        ]);

        if ($request->expectsJson()) {
            return response()->json([
                'success' => true,
                'message' => 'Participant registered successfully.',
                'participant' => $this->registry->enrichParticipant($participant),
            ]);
        }

        return redirect()
            ->route('admin.participants.index')
            ->with('status', 'Participant registered successfully.');
    }

    /**
     * Show participant registry profile.
     */
    public function show(User $user)
    {
        $this->authorizeParticipantAccess();

        if ($user->role !== 'PARTICIPANT') {
            abort(404);
        }

        $user->load([
            'eventRegistrations.simulationEvent',
            'eventRegistrations.attendance',
            'attendances.simulationEvent',
            'lessonCompletions.module',
            'lessonCompletions.lesson',
            'aiScenarioAttempts.trainingModule',
            'evaluationResults.trainingModule',
            'certificates.simulationEvent',
            'certificates.trainingModule',
        ]);

        $this->registry->enrichParticipant($user);
        $user->registry_profile = [
            'statuses' => $this->registry->computeStatuses($user),
            'lesson_completions' => $user->lessonCompletions,
            'ai_scenario_attempts' => $user->aiScenarioAttempts,
            'evaluation_results' => $user->evaluationResults,
            'certificates' => $user->certificates,
            'attendance_summary' => [
                'total' => $user->attendances->count(),
                'present' => $user->attendances->whereIn('status', ['present', 'late', 'completed'])->count(),
                'absent' => $user->attendances->where('status', 'absent')->count(),
            ],
        ];

        if (request()->expectsJson()) {
            return response()->json(['participant' => $user]);
        }

        return view('app', [
            'section' => 'participant_detail',
            'participant' => $user,
        ]);
    }

    /**
     * Participant self-service attendance view.
     */
    public function myAttendance()
    {
        $user = portal_user();
        if (! $user || $user->role !== 'PARTICIPANT') {
            abort(403, 'Unauthorized access.');
        }

        $user->load(['attendances.simulationEvent']);

        return view('app', [
            'section' => 'my_attendance',
            'participant' => $user,
        ]);
    }

    /**
     * Export participant registry (CSV).
     */
    public function export(Request $request)
    {
        $this->authorizeParticipantAccess();

        $participants = User::where('role', 'PARTICIPANT')
            ->withCount(['eventRegistrations', 'attendances'])
            ->orderBy('name')
            ->get();

        $participants = $this->registry->enrichMany($participants);

        $filename = 'participant_registry_'.date('Y-m-d_His').'.csv';
        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ];

        $callback = function () use ($participants) {
            $file = fopen('php://output', 'w');
            fputcsv($file, [
                'Participant ID', 'Full Name', 'Email', 'Phone', 'Barangay', 'Municipality',
                'Status', 'Training Status', 'Attendance Status', 'Evaluation Status',
                'Certificate Status', 'Last Synced',
            ]);

            foreach ($participants as $participant) {
                fputcsv($file, [
                    $participant->participant_id ?? 'N/A',
                    $participant->name,
                    $participant->email,
                    $participant->phone ?? 'N/A',
                    $participant->barangay ?? 'N/A',
                    $participant->city ?? 'N/A',
                    $participant->status,
                    $participant->training_status ?? 'Not Started',
                    $participant->attendance_status ?? 'No Records',
                    $participant->evaluation_status ?? 'Not Evaluated',
                    $participant->certificate_status ?? 'None',
                    $participant->last_synced_at?->format('Y-m-d H:i:s') ?? 'N/A',
                ]);
            }

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    protected function applyTrainingStatusFilter($query, string $status): void
    {
        if ($status === 'Not Started') {
            $query->whereDoesntHave('lessonCompletions')
                ->whereDoesntHave('aiScenarioAttempts', fn ($q) => $q->where('status', 'completed'));
        } elseif ($status === 'In Progress') {
            $query->where(function ($q) {
                $q->whereHas('lessonCompletions')
                    ->orWhereHas('aiScenarioAttempts');
            })->whereDoesntHave('aiScenarioAttempts', fn ($q) => $q->where('status', 'completed'));
        } elseif ($status === 'Completed') {
            $query->where(function ($q) {
                $q->whereHas('aiScenarioAttempts', fn ($inner) => $inner->where('status', 'completed'))
                    ->orWhereIn('id', function ($sub) {
                        $sub->select('user_id')
                            ->from('lesson_completions')
                            ->groupBy('user_id')
                            ->havingRaw('COUNT(*) >= 3');
                    });
            });
        }
    }

    protected function applyCertificateStatusFilter($query, string $status): void
    {
        if ($status === 'Issued') {
            $query->whereHas('certificates', fn ($q) => $q->whereNull('revoked_at'));
        } elseif ($status === 'None') {
            $query->whereDoesntHave('certificates', fn ($q) => $q->whereNull('revoked_at'));
        }
    }

    private function authorizeParticipantAccess(): void
    {
        $user = portal_user();
        if (! $user || ! in_array($user->role, ['LGU_ADMIN', 'LGU_TRAINER'], true)) {
            abort(403, 'Unauthorized access.');
        }
    }
}
