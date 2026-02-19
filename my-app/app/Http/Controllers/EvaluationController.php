<?php

namespace App\Http\Controllers;

use App\Models\Evaluation;
use App\Models\ParticipantEvaluation;
use App\Models\EvaluationScore;
use App\Models\SimulationEvent;
use App\Models\Attendance;
use App\Models\Scenario;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class EvaluationController extends Controller
{
    /**
     * Display evaluation dashboard with list of completed events
     */
    public function index(Request $request)
    {
        $this->authorizeEvaluationAccess();

        $query = SimulationEvent::whereIn('status', ['published', 'ongoing', 'completed'])
            ->with(['scenario', 'evaluation']);

        // Search by event title
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where('title', 'like', "%{$search}%");
        }

        // Filter by evaluation status
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

        $events = $query->orderByDesc('event_date')
            ->orderByDesc('start_time')
            ->get()
            ->map(function ($event) {
                // Get attendance count (present participants)
                $attendanceCount = Attendance::where('simulation_event_id', $event->id)
                    ->where('status', 'present')
                    ->count();

                // Derive evaluation status from actual participant scores
                $evaluation = $event->evaluation;
                $evaluationStatus = 'not_started';

                if ($evaluation) {
                    // Count approved participants
                    $approvedCount = $event->registrations()
                        ->where('status', 'approved')
                        ->count();

                    // Count participants that have at least one score
                    $withScores = ParticipantEvaluation::where('evaluation_id', $evaluation->id)
                        ->whereHas('scores')
                        ->count();

                    if ($withScores === 0) {
                        $evaluationStatus = 'not_started';
                    } elseif ($approvedCount > 0 && $withScores >= $approvedCount) {
                        $evaluationStatus = 'completed';
                    } else {
                        $evaluationStatus = 'in_progress';
                    }
                }

                return [
                    'id' => $event->id,
                    'title' => $event->title,
                    'event_date' => $event->event_date,
                    'scenario_name' => $event->scenario ? $event->scenario->title : 'N/A',
                    'participant_count' => $attendanceCount,
                    'evaluation_status' => $evaluationStatus,
                    'evaluation' => $evaluation,
                    'status' => $event->status,
                ];
            });

        return view('app', [
            'section' => 'evaluation_dashboard',
            'events' => $events,
            'filters' => [
                'search' => $request->search,
                'status' => $request->status,
            ],
        ]);
    }

    /**
     * Show evaluation for a specific event
     */
    public function show(SimulationEvent $simulationEvent)
    {
        $this->authorizeEvaluationAccess();

        // Ensure event is in a relevant status
        if (!in_array($simulationEvent->status, ['published', 'ongoing', 'completed'])) {
            return redirect()->route('evaluations.index')
                ->with('status', 'Evaluation can only be viewed for published, ongoing, or completed events.');
        }

        // Get or create evaluation
        $evaluation = Evaluation::firstOrCreate(
            ['simulation_event_id' => $simulationEvent->id],
            [
                'status' => 'not_started',
                'pass_threshold' => 70.00,
                'created_by' => Auth::id(),
            ]
        );

        // Get scenario criteria
        $scenario = $simulationEvent->scenario;
        $criteria = [];
        if ($scenario && $scenario->criteria) {
            $criteria = is_array($scenario->criteria) ? $scenario->criteria : json_decode($scenario->criteria, true);
        }

        // Get all approved registrations for this event
        $registrations = $simulationEvent->registrations()
            ->where('status', 'approved')
            ->with(['user', 'attendance.user'])
            ->get();

        // Collect attendances from registrations for compatibility with existing React logic
        $attendances = $registrations->map(function ($reg) {
            if ($reg->attendance) {
                // Ensure attendance has user relationship loaded
                if (!$reg->attendance->relationLoaded('user')) {
                    $reg->attendance->load('user');
                }
                return $reg->attendance;
            }
            return [
                'id' => 'reg-' . $reg->id, // Mock ID for non-attendance records
                'user_id' => $reg->user_id,
                'simulation_event_id' => $reg->simulation_event_id,
                'status' => 'not_marked',
                'user' => $reg->user,
            ];
        });

        // Get participant evaluations
        $participantEvaluations = ParticipantEvaluation::where('evaluation_id', $evaluation->id)
            ->with(['user', 'scores'])
            ->get()
            ->map(function ($pe) {
                // Derive a simple status for the UI based on presence of scores
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
            return redirect()->route('evaluations.show', $simulationEvent)
                ->with('status', 'Evaluation is locked and cannot be modified.');
        }

        $user = \App\Models\User::findOrFail($userId);

        // Allow evaluation for any participant who has an attendance record for this event.
        // Frontend already restricts the Evaluate button to participants marked Present/Completed,
        // so we don't need a strict status guard here.
        $attendance = Attendance::where('simulation_event_id', $simulationEvent->id)
            ->where('user_id', $userId)
            ->first();

        if (!$attendance) {
            return redirect()->route('evaluations.show', $simulationEvent)
                ->with('status', 'Cannot evaluate: Participant must be marked as present first.');
        }

        $scenario = $simulationEvent->scenario;
        if (!$scenario || !$scenario->criteria) {
            return redirect()->route('evaluations.show', $simulationEvent)
                ->with('status', 'Cannot evaluate: Scenario must have criteria defined.');
        }

        $criteria = is_array($scenario->criteria) ? $scenario->criteria : json_decode($scenario->criteria, true);

        $participantEvaluation = ParticipantEvaluation::firstOrCreate(
            [
                'evaluation_id' => $evaluation->id,
                'user_id' => $userId,
            ],
            [
                'attendance_id' => $attendance->id,
                'status' => 'draft',
                'evaluated_by' => Auth::id(),
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
        // Allow saving as long as there is any attendance record for this event + user.
        // Frontend already restricts Evaluate to participants marked Present.
        $attendance = Attendance::where('simulation_event_id', $simulationEvent->id)
            ->where('user_id', $userId)
            ->first();

        if (!$attendance) {
            return redirect()->route('evaluations.show', $simulationEvent)
                ->with('status', 'Cannot evaluate: Participant must be marked as present first.');
        }

        $scenario = $simulationEvent->scenario;
        if (!$scenario || !$scenario->criteria) {
            if ($request->expectsJson() || $request->ajax()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cannot evaluate: Scenario must have criteria defined.',
                ], 400);
            }
            return back()->with('status', 'Cannot evaluate: Scenario must have criteria defined.');
        }

        $criteria = is_array($scenario->criteria) ? $scenario->criteria : json_decode($scenario->criteria, true);

        try {
            $data = $request->validate([
                'scores' => ['required', 'array'],
                'scores.*.score' => ['required', 'numeric', 'min:0'],
                'scores.*.comment' => ['nullable', 'string', 'max:1000'],
                'overall_feedback' => ['nullable', 'string', 'max:2000'],
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
                    'status' => $data['status'],
                    'overall_feedback' => $data['overall_feedback'] ?? null,
                    'evaluated_by' => Auth::id(),
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
                        'max_score' => 10.00, // Default max score, can be customized
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
                ]);
            }

            // Update evaluation status when first submission happens
            if ($evaluation->status === 'not_started') {
                $evaluation->update([
                    'status' => 'in_progress',
                    'started_at' => now(),
                    'updated_by' => Auth::id(),
                ]);
            }

            // If all participants have submitted final scores, mark evaluation as completed
            $approvedCount = $simulationEvent->registrations()
                ->where('status', 'approved')
                ->count();

            if ($approvedCount > 0) {
                $submittedCount = ParticipantEvaluation::where('evaluation_id', $evaluation->id)
                    ->where('status', 'submitted')
                    ->count();

                if ($submittedCount >= $approvedCount && $evaluation->status !== 'completed') {
                    $evaluation->update([
                        'status' => 'completed',
                        'completed_at' => now(),
                        'updated_by' => Auth::id(),
                    ]);
                }
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
                'redirect' => route('evaluations.show', $simulationEvent),
            ]);
        }

        return redirect()->route('evaluations.show', $simulationEvent)
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

        $updateData = [
            'status' => $data['status'],
            'updated_by' => Auth::id(),
        ];

        if ($data['status'] === 'completed' && !$evaluation->completed_at) {
            $updateData['completed_at'] = now();
        }

        $evaluation->update($updateData);

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
            'updated_by' => Auth::id(),
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

        // Only include participants that actually have scores (final evaluations)
        $participantEvaluations = ParticipantEvaluation::where('evaluation_id', $evaluation->id)
            ->with(['user', 'scores'])
            ->whereHas('scores')
            ->get();

        $scenario = $simulationEvent->scenario;
        $criteria = [];
        if ($scenario && $scenario->criteria) {
            $criteria = is_array($scenario->criteria) ? $scenario->criteria : json_decode($scenario->criteria, true);
        }

        // Apply pass/fail rule (>= 75%) and eligibility (passed => yes)
        $threshold = 75.00;
        foreach ($participantEvaluations as $pe) {
            $avg = (float) ($pe->average_score ?? 0);
            $pe->result = $avg >= $threshold ? 'passed' : 'failed';
            $pe->is_eligible_for_certification = $pe->result === 'passed';
        }

        // Calculate statistics
        $totalParticipants = $participantEvaluations->count();
        $passedCount = $participantEvaluations->where('result', 'passed')->count();
        $failedCount = $participantEvaluations->where('result', 'failed')->count();

        // Calculate average scores per criterion
        $criterionAverages = [];
        foreach ($criteria as $criterion) {
            $criterionName = is_array($criterion) ? $criterion : $criterion;
            $scores = [];
            foreach ($participantEvaluations as $pe) {
                $score = $pe->scores->where('criterion_name', $criterionName)->first();
                if ($score) {
                    $scores[] = $score->score;
                }
            }
            $criterionAverages[$criterionName] = count($scores) > 0 
                ? round(array_sum($scores) / count($scores), 2) 
                : 0;
        }

        $overallAverage = $participantEvaluations->avg('average_score') ?? 0;

        return view('app', [
            'section' => 'evaluation_summary',
            'event' => $simulationEvent,
            'evaluation' => $evaluation,
            'participantEvaluations' => $participantEvaluations->values()->all(),
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

    protected function authorizeEvaluationAccess(): void
    {
        $user = Auth::user();
        if (!$user) {
            abort(403);
        }
        if (!in_array($user->role, ['LGU_ADMIN', 'LGU_TRAINER'], true)) {
            abort(403);
        }
    }
}
