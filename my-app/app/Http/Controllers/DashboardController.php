<?php

namespace App\Http\Controllers;

use App\Models\TrainingModule;
use App\Models\SimulationEvent;
use App\Models\User;
use App\Models\Certificate;
use App\Models\Evaluation;
use App\Models\Attendance;
use App\Models\ParticipantEvaluation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;

class DashboardController extends Controller
{
    /**
     * Dashboard as operations command center: modules, events, participants, and stats.
     */
    public function index(Request $request)
    {
        $user = Auth::user();
        if (! $user) {
            return redirect()->route('admin.login');
        }

        // Normalize event statuses (same as SimulationEventController)
        SimulationEvent::autoEndPastUnstartedEvents($user->id);
        $this->autoCompleteExpiredEvents();

        // Load data appropriate to role
        if ($user->role === 'PARTICIPANT') {
            $modules = TrainingModule::with('owner')
                ->where('status', 'published')
                ->orderByDesc('updated_at')
                ->get();
            $events = SimulationEvent::with(['scenario', 'registrations'])
                ->whereIn('status', ['published', 'ongoing', 'ended', 'completed', 'archived'])
                ->where('event_date', '>=', now()->subDays(7))
                ->orderBy('event_date')
                ->orderBy('start_time')
                ->get();
            $participants = collect(); // Participants list not for participant role
        } else {
            $modules = TrainingModule::with('owner')
                ->orderByDesc('updated_at')
                ->get();
            $events = SimulationEvent::with(['scenario', 'creator'])
                ->withCount([
                    'registrations',
                    'registrations as approved_registrations_count' => function ($q) {
                        $q->where('status', 'approved');
                    },
                ])
                ->orderByDesc('event_date')
                ->orderByDesc('created_at')
                ->get();
            $participants = User::where('role', 'PARTICIPANT')
                ->orderByDesc('created_at')
                ->get();
        }

        $today = Carbon::today();

        // Operational KPIs and attention metrics
        $activeEvents = $events->where('status', 'ongoing')->count();
        $upcomingEvents = $events->filter(function ($e) use ($today) {
            $date = $e->event_date instanceof \Carbon\Carbon ? $e->event_date : Carbon::parse($e->event_date);
            return $date->gte($today) && in_array($e->status, ['published', 'ongoing']);
        })->count();
        $totalParticipants = $participants->count();
        $certificatesCount = $user->role !== 'PARTICIPANT'
            ? Certificate::whereNull('revoked_at')->count()
            : 0;

        $eventsStartingToday = $user->role !== 'PARTICIPANT'
            ? $events->filter(function ($e) use ($today) {
                $date = $e->event_date instanceof \Carbon\Carbon ? $e->event_date : Carbon::parse($e->event_date);
                return $date->isSameDay($today) && in_array($e->status, ['published', 'ongoing']);
            })->count()
            : 0;

        // Pending evaluations: completed events where not all present participants are evaluated
        $pendingEvaluationsCount = 0;
        if ($user->role !== 'PARTICIPANT') {
            $completedEventIds = $events->where('status', 'completed')->pluck('id');
            foreach (Evaluation::whereIn('simulation_event_id', $completedEventIds)->get() as $eval) {
                $presentCount = Attendance::where('simulation_event_id', $eval->simulation_event_id)->where('status', 'present')->count();
                $evaluatedCount = ParticipantEvaluation::where('evaluation_id', $eval->id)->whereNotNull('submitted_at')->count();
                $pendingEvaluationsCount += max(0, $presentCount - $evaluatedCount);
            }
        }

        // Pending certificates: eligible participants without certificate for completed events (simplified)
        $pendingCertificatesCount = 0;
        if ($user->role !== 'PARTICIPANT') {
            $eligible = ParticipantEvaluation::where('is_eligible_for_certification', true)->whereNotNull('submitted_at')->count();
            $issued = Certificate::whereNull('revoked_at')->count();
            $pendingCertificatesCount = max(0, $eligible - $issued);
        }

        // Performance overview: average score, pass rate (from submitted evaluations)
        $averageScore = null;
        $passRate = null;
        $attendanceRate = null;
        if ($user->role !== 'PARTICIPANT') {
            $submitted = ParticipantEvaluation::whereNotNull('submitted_at');
            $submittedCount = $submitted->count();
            if ($submittedCount > 0) {
                $averageScore = round((float) ParticipantEvaluation::whereNotNull('submitted_at')->avg('average_score'), 1);
                $passedCount = ParticipantEvaluation::whereNotNull('submitted_at')->where('result', 'passed')->count();
                $passRate = $submittedCount > 0 ? round(100 * $passedCount / $submittedCount, 0) : null;
            }
            $totalPresent = Attendance::where('status', 'present')->count();
            $totalMarked = Attendance::count();
            if ($totalMarked > 0) {
                $attendanceRate = round(100 * $totalPresent / $totalMarked, 0);
            }
        }

        $dashboardStats = [
            'active_events' => $activeEvents,
            'upcoming_events' => $upcomingEvents,
            'total_participants' => $totalParticipants,
            'certificates_count' => $certificatesCount,
            'events_starting_today' => $eventsStartingToday,
            'pending_evaluations_count' => $pendingEvaluationsCount,
            'pending_certificates_count' => $pendingCertificatesCount,
            'average_score' => $averageScore,
            'pass_rate' => $passRate,
            'attendance_rate' => $attendanceRate,
        ];

        return view('app', [
            'section' => 'dashboard',
            'modules' => $modules,
            'events' => $events,
            'participants' => $participants,
            'dashboard_stats' => $dashboardStats,
        ]);
    }

    protected function autoCompleteExpiredEvents(): void
    {
        $now = now();
        SimulationEvent::where('status', 'ongoing')
            ->whereDate('event_date', '<=', $now->toDateString())
            ->get()
            ->each(function ($event) use ($now) {
                $endTime = $event->end_time;
                if (! $endTime) return;
                try {
                    [$endHour, $endMinute] = explode(':', $endTime);
                    $eventEnd = $event->event_date->copy()->setTime((int) $endHour, (int) $endMinute, 0);
                    if ($now->greaterThanOrEqualTo($eventEnd)) {
                        $event->update([
                            'status' => 'completed',
                            'completed_at' => $now,
                            'updated_by' => Auth::id(),
                        ]);
                    }
                } catch (\Exception $e) {
                    // skip
                }
            });
    }
}
