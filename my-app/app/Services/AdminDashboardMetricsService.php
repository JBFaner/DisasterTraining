<?php

namespace App\Services;

use App\Models\AuditLog;
use App\Models\CampaignRequest;
use App\Models\Certificate;
use App\Models\ParticipantEvaluation;
use App\Models\SimulationEvent;
use App\Models\TrainingModule;
use Carbon\Carbon;

class AdminDashboardMetricsService
{
    public function __construct(
        private readonly CertificationEligibleParticipantsService $eligibleParticipants,
        private readonly SimulationEventPlanningService $planningService,
    ) {}

    public function pendingCertificatesCount(): int
    {
        return $this->eligibleParticipants->countPendingIssuance();
    }

    /**
     * @return array<string, int>
     */
    public function trainingModuleStats(): array
    {
        return [
            'total' => TrainingModule::count(),
            'published' => TrainingModule::where('status', 'published')->count(),
            'draft' => TrainingModule::where('status', 'draft')->count(),
            'archived' => TrainingModule::where('status', 'archived')->count(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function campaignPipeline(int $limit = 5): array
    {
        return [
            'pending_review_count' => CampaignRequest::where('status', 'pending')->count(),
            'approved_schedules' => $this->planningService
                ->listApprovedSchedules()
                ->take($limit)
                ->values()
                ->all(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function performanceTrends(): array
    {
        $now = Carbon::now();
        $thisMonthStart = $now->copy()->startOfMonth();
        $lastMonthStart = $now->copy()->subMonth()->startOfMonth();
        $lastMonthEnd = $now->copy()->subMonth()->endOfMonth();

        $avgThisMonth = ParticipantEvaluation::whereNotNull('submitted_at')
            ->where('submitted_at', '>=', $thisMonthStart)
            ->avg('average_score');
        $avgLastMonth = ParticipantEvaluation::whereNotNull('submitted_at')
            ->whereBetween('submitted_at', [$lastMonthStart, $lastMonthEnd])
            ->avg('average_score');

        $submittedThisMonth = ParticipantEvaluation::whereNotNull('submitted_at')
            ->where('submitted_at', '>=', $thisMonthStart)
            ->count();
        $passedThisMonth = ParticipantEvaluation::whereNotNull('submitted_at')
            ->where('submitted_at', '>=', $thisMonthStart)
            ->where('result', 'passed')
            ->count();
        $passRateThisMonth = $submittedThisMonth > 0
            ? round(100 * $passedThisMonth / $submittedThisMonth, 0)
            : null;

        $submittedLastMonth = ParticipantEvaluation::whereNotNull('submitted_at')
            ->whereBetween('submitted_at', [$lastMonthStart, $lastMonthEnd])
            ->count();
        $passedLastMonth = ParticipantEvaluation::whereNotNull('submitted_at')
            ->whereBetween('submitted_at', [$lastMonthStart, $lastMonthEnd])
            ->where('result', 'passed')
            ->count();
        $passRateLastMonth = $submittedLastMonth > 0
            ? round(100 * $passedLastMonth / $submittedLastMonth, 0)
            : null;

        $drillsThisMonth = SimulationEvent::query()
            ->whereYear('event_date', $now->year)
            ->whereMonth('event_date', $now->month)
            ->count();
        $drillsLastMonth = SimulationEvent::query()
            ->whereBetween('event_date', [$lastMonthStart, $lastMonthEnd])
            ->count();

        $certificatesThisWeek = Certificate::whereNull('revoked_at')
            ->whereBetween('issued_at', [$now->copy()->startOfWeek(), $now->copy()->endOfWeek()])
            ->count();

        return [
            'average_score_hint' => $this->monthOverMonthHint($avgThisMonth, $avgLastMonth, 'pts'),
            'pass_rate_hint' => $this->monthOverMonthHint($passRateThisMonth, $passRateLastMonth, 'pts'),
            'drills_this_month' => $drillsThisMonth,
            'drills_hint' => $this->monthOverMonthHint($drillsThisMonth, $drillsLastMonth, 'drills'),
            'certificates_this_week' => $certificatesThisWeek,
        ];
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function recentActivity(int $limit = 5): array
    {
        return AuditLog::query()
            ->orderByDesc('performed_at')
            ->limit($limit)
            ->get(['id', 'action', 'module', 'description', 'user_name', 'status', 'performed_at'])
            ->map(fn (AuditLog $log) => [
                'id' => $log->id,
                'action' => $log->action,
                'module' => $log->module,
                'description' => $log->description,
                'user_name' => $log->user_name,
                'status' => $log->status,
                'performed_at' => $log->performed_at?->toIso8601String(),
            ])
            ->all();
    }

    private function monthOverMonthHint(?float $current, ?float $previous, string $unit): ?string
    {
        if ($current === null && $previous === null) {
            return null;
        }

        $currentValue = (float) ($current ?? 0);
        $previousValue = (float) ($previous ?? 0);

        if ($previousValue <= 0) {
            return $currentValue > 0 ? 'New activity this month' : 'No data this month yet';
        }

        $delta = round($currentValue - $previousValue, $unit === 'pts' ? 1 : 0);
        if ($delta === 0.0) {
            return 'Flat vs last month';
        }

        $sign = $delta > 0 ? '+' : '';

        return match ($unit) {
            'pts' => "{$sign}{$delta} pts vs last month",
            'drills' => "{$sign}{$delta} vs last month",
            default => "{$sign}{$delta} vs last month",
        };
    }
}
