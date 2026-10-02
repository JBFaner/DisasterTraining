<?php

namespace App\Services;

use App\Models\Attendance;
use App\Models\Certificate;
use App\Models\Evaluation;
use App\Models\ParticipantEvaluation;
use App\Models\SimulationEvent;
use App\Models\User;
use App\Services\HazardAssessment\HazardTrainingRecommendationService;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class AdminDashboardAnalyticsService
{
    public function __construct(
        private readonly AdminDashboardMetricsService $dashboardMetrics,
        private readonly EvaluationScoringService $evaluationScoring,
        private readonly HazardTrainingRecommendationService $hazardAnalytics,
    ) {}

    /**
     * Operations dashboard analytics payload for partner API consumers.
     *
     * @return array<string, mixed>
     */
    public function buildPayload(): array
    {
        $today = Carbon::today();
        $year = $today->year;

        $events = SimulationEvent::query()
            ->with(['scenario', 'creator'])
            ->withCount([
                'registrations',
                'registrations as approved_registrations_count' => function ($q) {
                    $q->where('status', 'approved');
                },
            ])
            ->orderByDesc('event_date')
            ->orderByDesc('created_at')
            ->get();

        $activeEvents = $events->where('status', 'ongoing')->count();
        $upcomingEvents = $events->filter(function ($event) use ($today) {
            if ($event->status !== 'published') {
                return false;
            }

            $date = $event->event_date instanceof Carbon
                ? $event->event_date
                : Carbon::parse($event->event_date);

            return $date->gte($today);
        })->count();

        $totalParticipants = User::query()->where('role', 'PARTICIPANT')->count();
        $certificatesCount = Certificate::query()->whereNull('revoked_at')->count();

        $eventsStartingToday = $events->filter(function ($event) use ($today) {
            $date = $event->event_date instanceof Carbon
                ? $event->event_date
                : Carbon::parse($event->event_date);

            return $date->isSameDay($today) && in_array($event->status, ['published', 'ongoing'], true);
        })->count();

        $pendingEvaluationsCount = 0;
        $completedEventIds = $events->where('status', 'completed')->pluck('id');
        foreach (Evaluation::query()->whereIn('simulation_event_id', $completedEventIds)->get() as $evaluation) {
            $presentCount = Attendance::query()
                ->where('simulation_event_id', $evaluation->simulation_event_id)
                ->where('status', 'present')
                ->count();
            $evaluatedCount = ParticipantEvaluation::query()
                ->where('evaluation_id', $evaluation->id)
                ->whereNotNull('submitted_at')
                ->count();
            $pendingEvaluationsCount += max(0, $presentCount - $evaluatedCount);
        }

        $submittedCount = ParticipantEvaluation::query()->whereNotNull('submitted_at')->count();
        $averageScore = null;
        $passRate = null;
        if ($submittedCount > 0) {
            $averageScore = round((float) ParticipantEvaluation::query()
                ->whereNotNull('submitted_at')
                ->avg('average_score'), 1);
            $passedCount = ParticipantEvaluation::query()
                ->whereNotNull('submitted_at')
                ->where('result', 'passed')
                ->count();
            $passRate = round(100 * $passedCount / $submittedCount, 0);
        }

        $totalPresent = Attendance::query()->where('status', 'present')->count();
        $totalMarked = Attendance::query()->count();
        $attendanceRate = $totalMarked > 0
            ? round(100 * $totalPresent / $totalMarked, 0)
            : null;

        $disasterCounts = $events
            ->filter(fn ($event) => ! empty($event->disaster_type))
            ->groupBy('disaster_type')
            ->map->count()
            ->sortDesc();

        $drillsPerMonth = array_fill(1, 12, 0);
        foreach ($events as $event) {
            if (! $event->event_date) {
                continue;
            }

            $date = $event->event_date instanceof Carbon
                ? $event->event_date
                : Carbon::parse($event->event_date);

            if ((int) $date->year !== $year) {
                continue;
            }

            $month = (int) $date->month;
            if ($month >= 1 && $month <= 12) {
                $drillsPerMonth[$month]++;
            }
        }

        $monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        $performanceTrend = [
            'labels' => $monthLabels,
            'data' => array_fill(0, 12, null),
        ];

        $monthSql = DB::connection()->getDriverName() === 'sqlite'
            ? "CAST(strftime('%m', submitted_at) AS INTEGER)"
            : 'MONTH(submitted_at)';

        $perMonth = ParticipantEvaluation::query()
            ->whereNotNull('submitted_at')
            ->whereYear('submitted_at', $year)
            ->selectRaw("{$monthSql} as month, AVG(average_score) as avg_score")
            ->groupByRaw($monthSql)
            ->orderBy('month')
            ->get();

        foreach ($perMonth as $row) {
            $monthIndex = (int) $row->month - 1;
            if ($monthIndex >= 0 && $monthIndex < 12) {
                $performanceTrend['data'][$monthIndex] = round((float) $row->avg_score, 1);
            }
        }

        $evaluationEventIds = Evaluation::query()->pluck('simulation_event_id');
        $presentAttendances = Attendance::query()
            ->whereIn('simulation_event_id', $evaluationEventIds)
            ->where('status', 'present')
            ->get();
        $evaluations = ParticipantEvaluation::query()
            ->whereHas('evaluation', function ($q) use ($evaluationEventIds) {
                $q->whereIn('simulation_event_id', $evaluationEventIds);
            })
            ->get()
            ->keyBy('attendance_id');

        $evaluatedTotal = 0;
        $notEvaluatedTotal = 0;
        foreach ($presentAttendances as $attendance) {
            $participantEvaluation = $evaluations->get($attendance->id);
            if ($participantEvaluation && $participantEvaluation->status === 'submitted') {
                $evaluatedTotal++;
            } else {
                $notEvaluatedTotal++;
            }
        }

        $eventsByStatus = $events
            ->groupBy('status')
            ->map->count()
            ->sortKeys()
            ->all();

        return [
            'generated_at' => now()->toIso8601String(),
            'kpis' => [
                'active_events' => $activeEvents,
                'upcoming_events' => $upcomingEvents,
                'total_participants' => $totalParticipants,
                'certificates_count' => $certificatesCount,
                'events_starting_today' => $eventsStartingToday,
                'pending_evaluations_count' => $pendingEvaluationsCount,
                'pending_certificates_count' => $this->dashboardMetrics->pendingCertificatesCount(),
                'average_score' => $averageScore,
                'pass_rate' => $passRate,
                'attendance_rate' => $attendanceRate,
            ],
            'charts' => [
                'disaster_distribution' => [
                    'labels' => $disasterCounts->keys()->values()->all(),
                    'data' => $disasterCounts->values()->all(),
                ],
                'drills_per_month' => [
                    'labels' => $monthLabels,
                    'data' => array_values($drillsPerMonth),
                    'year' => $year,
                ],
                'performance_trend' => $performanceTrend,
                'evaluation_status' => [
                    'labels' => ['Evaluated', 'Not evaluated'],
                    'data' => [$evaluatedTotal, $notEvaluatedTotal],
                ],
            ],
            'training_modules' => $this->dashboardMetrics->trainingModuleStats(),
            'campaign_pipeline' => $this->dashboardMetrics->campaignPipeline(5),
            'performance_trends' => $this->dashboardMetrics->performanceTrends(),
            'recent_activity' => $this->dashboardMetrics->recentActivity(10),
            'hazard_analytics' => $this->hazardAnalytics->globalAnalytics(),
            'final_ai_scenario_evaluations' => $this->evaluationScoring->buildAnalyticsSummary(),
            'simulation_events' => [
                'total' => $events->count(),
                'by_status' => $eventsByStatus,
            ],
        ];
    }
}
