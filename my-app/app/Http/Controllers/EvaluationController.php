<?php

namespace App\Http\Controllers;

use App\Models\Evaluation;
use App\Models\ParticipantEvaluation;
use App\Models\EvaluationScore;
use App\Models\SimulationEvent;
use App\Models\Attendance;
use App\Services\DatabaseBackupService;
use App\Services\EvaluationHubService;
use App\Support\SimulationEvaluationCriteria;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class EvaluationController extends Controller
{
    public function __construct(
        private readonly EvaluationHubService $hubService,
    ) {}

    /**
     * Display evaluation dashboard with list of completed events
     */
    public function index(Request $request)
    {
        $user = portal_user();

        // Participants: show their own evaluation results (read-only)
        if ($user && $user->role === 'PARTICIPANT') {
            $participantEvaluations = ParticipantEvaluation::with(['evaluation.simulationEvent'])
                ->where('user_id', $user->id)
                ->whereNotNull('submitted_at')
                ->orderByDesc('submitted_at')
                ->get()
                ->map(function (ParticipantEvaluation $pe) {
                    $event = $pe->evaluation?->simulationEvent;

                    return [
                        'id' => $pe->id,
                        'simulation_event_id' => $event?->id,
                        'event_title' => $event?->title ?? 'N/A',
                        'event_date' => $event?->event_date,
                        'average_score' => $pe->average_score,
                        'total_score' => $pe->total_score,
                        'result' => $pe->result,
                        'is_eligible_for_certification' => (bool) $pe->is_eligible_for_certification,
                        'submitted_at' => $pe->submitted_at,
                    ];
                });

            return view('app', [
                'section' => 'evaluation_results_participant',
                'participantEvaluations' => $participantEvaluations,
            ]);
        }

        $this->authorizeEvaluationAccess();

        $tab = $request->string('tab')->toString() ?: 'lessons';
        if (! in_array($tab, ['lessons', 'modules', 'events', 'overall'], true)) {
            $tab = 'lessons';
        }

        $viewData = [
            'section' => 'evaluation_hub',
            'evaluation_tab' => $tab,
            'evaluation_event_filters' => [
                'tab' => 'events',
                'search' => $request->search,
                'status' => $request->status,
            ],
        ];

        if ($tab === 'events') {
            $viewData['events'] = $this->loadCompletedEvents($request);
        } elseif ($tab === 'modules') {
            $viewData = array_merge($viewData, $this->hubService->moduleResultsPayload($request, $user));
        } elseif ($tab === 'overall') {
            $viewData = array_merge($viewData, $this->hubService->overallPayload($request));
        } else {
            $viewData = array_merge($viewData, $this->hubService->lessonQuizPayload($request));
        }

        return view('app', $viewData);
    }

    /**
     * @return \Illuminate\Support\Collection<int, array<string, mixed>>
     */
    protected function loadCompletedEvents(Request $request)
    {
        $query = SimulationEvent::where('status', 'completed')
            ->with(['scenario', 'evaluation', 'attendances', 'registrations']);

        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where('title', 'like', "%{$search}%");
        }

        if ($request->has('status') && $request->status) {
            $statusFilter = $request->status;
            if ($statusFilter === 'not_started') {
                $query->whereDoesntHave('evaluation');
            } else {
                $query->whereHas('evaluation', function ($q) use ($statusFilter) {
                    $q->where('status', $statusFilter);
                });
            }
        }

        return $query->orderByDesc('event_date')
            ->orderByDesc('start_time')
            ->get()
            ->map(function ($event) {
                $evaluation = $event->evaluation;
                $summary = $evaluation?->buildSummary();
                $presentCount = $event->attendances->where('status', 'present')->count();
                $registeredCount = $event->registrations->where('status', 'approved')->count();
                $evaluationStatus = $evaluation?->status ?? 'not_started';

                return [
                    'id' => $event->id,
                    'title' => $event->title,
                    'event_date' => $event->event_date,
                    'venue' => $event->venue ?: $event->location,
                    'simulation_type' => $event->event_category ?: $event->disaster_type,
                    'scenario_name' => $event->scenario ? $event->scenario->title : 'N/A',
                    'participant_count' => $presentCount,
                    'registered_participant_count' => $registeredCount,
                    'evaluation_status' => $evaluationStatus,
                    'evaluation' => $evaluation,
                    'status' => $event->status,
                    'average_score' => $summary['metrics']['average_score'] ?? 0,
                    'passing_rate' => $summary['metrics']['passing_rate'] ?? 0,
                    'overall_performance' => $summary['metrics']['overall_performance'] ?? 'Needs Improvement',
                ];
            });
    }

    /**
     * Show evaluation for a specific event
     */
    public function show(SimulationEvent $simulationEvent)
    {
        $this->authorizeEvaluationAccess();

        if (! in_array($simulationEvent->status, ['ongoing', 'completed', 'ended'], true)) {
            return redirect()->route('admin.evaluations.index')
                ->with('status', 'Evaluation & scoring opens after the simulation has started (or when completed). Mark attendance present first.');
        }

        $presentCount = $simulationEvent->attendances()
            ->whereIn('status', ['present', 'late'])
            ->count();

        if ($presentCount === 0) {
            return redirect("/admin/simulation-events/{$simulationEvent->id}/attendance")
                ->with('status', 'Mark at least one participant as Present (or Late) before Evaluation & Scoring.');
        }

        // Get or create evaluation
        $evaluation = Evaluation::firstOrCreate(
            ['simulation_event_id' => $simulationEvent->id],
            [
                'status' => 'not_started',
                'pass_threshold' => (float) config('simulation_evaluation.pass_threshold', 70),
                'created_by' => portal_id(),
            ]
        );

        $scenario = $simulationEvent->scenario;
        $criteria = SimulationEvaluationCriteria::resolve(
            is_array($scenario?->criteria) ? $scenario->criteria : null,
            $simulationEvent->disaster_type ?? $scenario?->disaster_type,
        );

        $attendances = $simulationEvent->attendances()
            ->whereIn('status', ['present', 'late'])
            ->with(['user', 'eventRegistration'])
            ->get();

        // Get participant evaluations
        $participantEvaluations = ParticipantEvaluation::where('evaluation_id', $evaluation->id)
            ->with(['user', 'scores', 'attendance'])
            ->get()
            ->map(function ($pe) {
                $hasScores = $pe->scores && $pe->scores->count() > 0;
                $pe->status = $hasScores ? 'submitted' : 'not_evaluated';
                return $pe;
            })
            ->keyBy('user_id');

        return view('app', [
            'section' => 'evaluation_participants',
            'event' => $simulationEvent,
            'evaluation' => $evaluation,
            'criteria' => $criteria,
            'attendances' => $attendances,
            'participantEvaluations' => $participantEvaluations,
        ]);
    }

    /**
     * Show evaluation form for a specific participant
     */
    public function evaluate(SimulationEvent $simulationEvent, $userId)
    {
        $this->authorizeEvaluationAccess();

        $evaluation = Evaluation::where('simulation_event_id', $simulationEvent->id)->firstOrFail();

        if ($evaluation->isLocked()) {
            return redirect()->route('admin.simulation-events.evaluation.show', $simulationEvent)
                ->with('status', 'Evaluation is locked and cannot be modified.');
        }

        $user = \App\Models\User::findOrFail($userId);

        $attendance = Attendance::where('simulation_event_id', $simulationEvent->id)
            ->where('user_id', $userId)
            ->whereIn('status', ['present', 'late'])
            ->first();

        if (!$attendance) {
            return redirect()->route('admin.simulation-events.evaluation.show', $simulationEvent)
                ->with('status', 'Cannot evaluate: Participant must be marked as present (or late) first.');
        }

        $scenario = $simulationEvent->scenario;
        $criteria = SimulationEvaluationCriteria::resolve(
            is_array($scenario?->criteria) ? $scenario->criteria : null,
            $simulationEvent->disaster_type ?? $scenario?->disaster_type,
        );

        if ($criteria === []) {
            return redirect()->route('admin.simulation-events.evaluation.show', $simulationEvent)
                ->with('status', 'Cannot evaluate: No scoring criteria available for this simulation.');
        }

        $participantEvaluation = ParticipantEvaluation::firstOrCreate(
            [
                'evaluation_id' => $evaluation->id,
                'user_id' => $userId,
            ],
            [
                'attendance_id' => $attendance->id,
                'attendance_status' => $attendance->status,
                'status' => 'draft',
                'evaluated_by' => portal_id(),
            ]
        );

        // Get existing scores as array for JSON serialization
        $scores = $participantEvaluation->scores->map(function ($score) {
            return [
                'criterion_name' => $score->criterion_name,
                'score' => $score->score,
                'comment' => $score->comment,
            ];
        });

        return view('app', [
            'section' => 'evaluation_form',
            'event' => $simulationEvent,
            'evaluation' => $evaluation,
            'user' => $user,
            'attendance' => $attendance,
            'participantEvaluation' => $participantEvaluation,
            'criteria' => $criteria,
            'scores' => $scores->values()->all(),
        ]);
    }

    /**
     * Store or update participant evaluation
     */
    public function storeEvaluation(Request $request, SimulationEvent $simulationEvent, $userId)
    {
        $this->authorizeEvaluationAccess();

        $evaluation = Evaluation::where('simulation_event_id', $simulationEvent->id)->firstOrFail();

        if ($evaluation->isLocked()) {
            return back()->with('status', 'Evaluation is locked and cannot be modified.');
        }

        $user = \App\Models\User::findOrFail($userId);
        $attendance = Attendance::where('simulation_event_id', $simulationEvent->id)
            ->where('user_id', $userId)
            ->whereIn('status', ['present', 'late'])
            ->first();

        if (!$attendance) {
            return redirect()->route('admin.simulation-events.evaluation.show', $simulationEvent)
                ->with('status', 'Cannot evaluate: Participant must be marked as present (or late) first.');
        }

        $scenario = $simulationEvent->scenario;
        $criteria = SimulationEvaluationCriteria::resolve(
            is_array($scenario?->criteria) ? $scenario->criteria : null,
            $simulationEvent->disaster_type ?? $scenario?->disaster_type,
        );

        if ($criteria === []) {
            if ($request->expectsJson() || $request->ajax()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cannot evaluate: No scoring criteria available for this simulation.',
                ], 400);
            }
            return back()->with('status', 'Cannot evaluate: No scoring criteria available for this simulation.');
        }

        try {
            $data = $request->validate([
                'scores' => ['required', 'array'],
                'scores.*.score' => ['required', 'numeric', 'min:0'],
                'scores.*.comment' => ['nullable', 'string', 'max:1000'],
                'overall_feedback' => ['nullable', 'string', 'max:2000'],
                'competency_rating' => ['required', 'string', 'in:Excellent,Good,Satisfactory,Needs Improvement'],
                'status' => ['required', 'string', 'in:draft,submitted'],
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            if ($request->expectsJson() || $request->ajax()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $e->errors(),
                ], 422);
            }
            throw $e;
        }

        DB::transaction(function () use ($evaluation, $simulationEvent, $user, $attendance, $criteria, $data) {
            $participantEvaluation = ParticipantEvaluation::updateOrCreate(
                [
                    'evaluation_id' => $evaluation->id,
                    'user_id' => $user->id,
                ],
                [
                    'attendance_id' => $attendance->id,
                    'attendance_status' => $attendance->status,
                    'status' => $data['status'],
                    'competency_rating' => $data['competency_rating'],
                    'overall_feedback' => $data['overall_feedback'] ?? null,
                    'evaluated_by' => portal_id(),
                    'submitted_at' => $data['status'] === 'submitted' ? now() : null,
                ]
            );

            // Delete existing scores
            $participantEvaluation->scores()->delete();

            // Create new scores
            $order = 0;
            foreach ($criteria as $criterion) {
                $criterionName = is_array($criterion) ? $criterion : $criterion;
                $scoreData = $data['scores'][$criterionName] ?? null;

                if ($scoreData) {
                    EvaluationScore::create([
                        'participant_evaluation_id' => $participantEvaluation->id,
                        'criterion_name' => $criterionName,
                        'criterion_description' => null,
                        'score' => $scoreData['score'],
                        'max_score' => (float) config('simulation_evaluation.max_score_per_criterion', 10),
                        'comment' => $scoreData['comment'] ?? null,
                        'order' => $order++,
                    ]);
                }
            }

            // Calculate scores
            $participantEvaluation->calculateScores();

            // Force final status to submitted (no more drafts via UI)
            if ($data['status'] === 'submitted') {
                $participantEvaluation->update([
                    'status' => 'submitted',
                    'submitted_at' => now(),
                    'competency_rating' => $data['competency_rating'],
                ]);
            }

            // Update evaluation status when first submission happens
            if ($evaluation->status === 'not_started') {
                $evaluation->update([
                    'status' => 'in_progress',
                    'started_at' => now(),
                    'updated_by' => portal_id(),
                ]);
            }

            $summary = $evaluation->fresh()->buildSummary();
            $presentCount = $summary['participant_summary']['present_participants'] ?? 0;
            $evaluatedCount = $summary['participant_summary']['evaluated_participants'] ?? 0;

            if ($presentCount > 0 && $evaluatedCount >= $presentCount && $evaluation->status !== 'completed') {
                $evaluation->update([
                    'status' => 'completed',
                    'completed_at' => now(),
                    'updated_by' => portal_id(),
                    'group6_outbound_payload' => $this->buildGroup6Payload($evaluation->fresh()),
                    'group6_payload_prepared_at' => now(),
                ]);

                app(DatabaseBackupService::class)->queueAfterCommit('final_evaluation_completed');
            }
        });

        $message = $data['status'] === 'submitted' 
            ? 'Evaluation submitted successfully.' 
            : 'Evaluation saved as draft.';

        // Return JSON response for AJAX requests, redirect for regular requests
        if ($request->expectsJson() || $request->ajax()) {
            return response()->json([
                'success' => true,
                'message' => $message,
                'redirect' => route('admin.simulation-events.evaluation.show', $simulationEvent),
            ]);
        }

        return redirect()->route('admin.simulation-events.evaluation.show', $simulationEvent)
            ->with('status', $message);
    }

    /**
     * Update evaluation status
     */
    public function updateStatus(Request $request, Evaluation $evaluation)
    {
        $this->authorizeEvaluationAccess();

        $data = $request->validate([
            'status' => ['required', 'string', 'in:not_started,in_progress,completed'],
        ]);

        if ($evaluation->isLocked()) {
            return back()->with('status', 'Evaluation is locked and cannot be modified.');
        }

        if ($data['status'] === 'completed') {
            $summary = $evaluation->buildSummary();
            $presentCount = $summary['participant_summary']['present_participants'] ?? 0;
            $evaluatedCount = $summary['participant_summary']['evaluated_participants'] ?? 0;

            if ($presentCount === 0 || $evaluatedCount < $presentCount) {
                return back()->with('status', 'All present participants must be evaluated before marking this event as completed.');
            }
        }

        $updateData = [
            'status' => $data['status'],
            'updated_by' => portal_id(),
        ];

        if ($data['status'] === 'completed' && !$evaluation->completed_at) {
            $updateData['completed_at'] = now();
            $updateData['group6_outbound_payload'] = $this->buildGroup6Payload($evaluation->fresh());
            $updateData['group6_payload_prepared_at'] = now();
        }

        $evaluation->update($updateData);

        if ($data['status'] === 'completed') {
            app(DatabaseBackupService::class)->queueAfterCommit('final_evaluation_completed');
        }

        return back()->with('status', 'Evaluation status updated successfully.');
    }

    /**
     * Lock evaluation
     */
    public function lock(Evaluation $evaluation)
    {
        $this->authorizeEvaluationAccess();

        if ($evaluation->isLocked()) {
            return back()->with('status', 'Evaluation is already locked.');
        }

        $evaluation->update([
            'status' => 'locked',
            'locked_at' => now(),
            'updated_by' => portal_id(),
        ]);

        return back()->with('status', 'Evaluation locked successfully. Scores are now read-only.');
    }

    /**
     * Show evaluation summary
     */
    public function summary(SimulationEvent $simulationEvent)
    {
        $this->authorizeEvaluationAccess();

        $evaluation = Evaluation::where('simulation_event_id', $simulationEvent->id)->firstOrFail();

        $summary = $evaluation->buildSummary();
        $participantEvaluations = collect($summary['participant_evaluations'] ?? [])->values()->all();
        $criteria = $summary['criteria'] ?? [];
        $criterionAverages = $summary['criterion_averages'] ?? [];
        $totalParticipants = $summary['participant_summary']['evaluated_participants'] ?? 0;
        $passedCount = $summary['metrics']['number_passed'] ?? 0;
        $failedCount = $summary['metrics']['number_failed'] ?? 0;
        $overallAverage = $summary['metrics']['average_score'] ?? 0;

        return view('app', [
            'section' => 'evaluation_summary',
            'event' => $simulationEvent,
            'evaluation' => $evaluation,
            'participantEvaluations' => $participantEvaluations,
            'criteria' => $criteria,
            // Keep camelCase for any direct Blade usage
            'criterionAverages' => $criterionAverages,
            'totalParticipants' => $totalParticipants,
            'passedCount' => $passedCount,
            'failedCount' => $failedCount,
            'overallAverage' => $overallAverage,

            // Provide snake_case keys to match `resources/views/app.blade.php` data-* attributes
            'criterion_averages' => $criterionAverages,
            'total_participants' => $totalParticipants,
            'passed_count' => $passedCount,
            'failed_count' => $failedCount,
            'overall_average' => $overallAverage,
            'summaryStats' => $summary,
            'evaluationSummaryStats' => $summary,
        ]);
    }

    /**
     * Export evaluation summary
     */
    public function export(SimulationEvent $simulationEvent, $format = 'csv')
    {
        $this->authorizeEvaluationAccess();

        $evaluation = Evaluation::where('simulation_event_id', $simulationEvent->id)->firstOrFail();

        $participantEvaluations = ParticipantEvaluation::where('evaluation_id', $evaluation->id)
            ->with(['user', 'scores'])
            ->get();

        if ($format === 'csv') {
            return $this->exportCsv($simulationEvent, $evaluation, $participantEvaluations);
        }

        // PDF export can be added later
        return back()->with('status', 'PDF export not yet implemented.');
    }

    protected function exportCsv($simulationEvent, $evaluation, $participantEvaluations)
    {
        $filename = 'evaluation_' . $simulationEvent->id . '_' . now()->format('Y-m-d') . '.csv';
        
        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
        ];

        $callback = function () use ($simulationEvent, $evaluation, $participantEvaluations) {
            $file = fopen('php://output', 'w');
            
            // Header row
            fputcsv($file, ['Participant Name', 'Total Score', 'Average Score', 'Result', 'Eligible for Certification']);
            
            // Data rows
            foreach ($participantEvaluations as $pe) {
                fputcsv($file, [
                    $pe->user->name,
                    $pe->total_score ?? 0,
                    $pe->average_score ?? 0,
                    $pe->result ?? 'N/A',
                    $pe->is_eligible_for_certification ? 'Yes' : 'No',
                ]);
            }
            
            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    protected function buildGroup6Payload(Evaluation $evaluation): array
    {
        $summary = $evaluation->buildSummary();

        return [
            'event_id' => $evaluation->simulation_event_id,
            'evaluation_id' => $evaluation->id,
            'average_evaluation_score' => $summary['metrics']['average_score'] ?? 0,
            'passing_rate' => $summary['metrics']['passing_rate'] ?? 0,
            'evaluation_completion_status' => $evaluation->status,
            'overall_performance' => $summary['metrics']['overall_performance'] ?? 'Needs Improvement',
            'participant_performance_summary' => $summary['participant_performance_summary'] ?? [],
            'prepared_at' => now()->toIso8601String(),
        ];
    }

    protected function authorizeEvaluationAccess(): void
    {
        $user = portal_user();
        if (!$user) {
            abort(403);
        }
        if (!in_array($user->role, ['LGU_ADMIN', 'LGU_TRAINER'], true)) {
            abort(403);
        }
    }
}
