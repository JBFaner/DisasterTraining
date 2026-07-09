<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Attendance;

class Evaluation extends Model
{
    protected $fillable = [
        'simulation_event_id',
        'status',
        'pass_threshold',
        'overall_notes',
        'group6_outbound_payload',
        'group6_payload_prepared_at',
        'created_by',
        'updated_by',
        'started_at',
        'completed_at',
        'locked_at',
    ];

    protected $casts = [
        'pass_threshold' => 'decimal:2',
        'group6_outbound_payload' => 'array',
        'group6_payload_prepared_at' => 'datetime',
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
        'locked_at' => 'datetime',
    ];

    public function simulationEvent()
    {
        return $this->belongsTo(SimulationEvent::class, 'simulation_event_id');
    }

    public function participantEvaluations()
    {
        return $this->hasMany(ParticipantEvaluation::class, 'evaluation_id');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updater()
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    public function isLocked()
    {
        return $this->status === 'locked' || $this->locked_at !== null;
    }

    public function canBeEdited()
    {
        return !$this->isLocked() && $this->status !== 'completed';
    }

    public function presentAttendances()
    {
        return $this->simulationEvent
            ? $this->simulationEvent->attendances()->where('status', 'present')
            : Attendance::query()->whereRaw('1 = 0');
    }

    public function buildSummary(): array
    {
        $event = $this->simulationEvent()->with(['scenario', 'registrations', 'attendances.user'])->first();
        $presentAttendances = $event
            ? $event->attendances->where('status', 'present')->values()
            : collect();

        $presentUserIds = $presentAttendances->pluck('user_id')->filter()->unique()->values();

        $participantEvaluations = $this->participantEvaluations()
            ->with(['user', 'scores', 'attendance'])
            ->whereIn('user_id', $presentUserIds)
            ->where('status', 'submitted')
            ->get()
            ->values();

        $scores = $participantEvaluations->pluck('average_score')->map(fn ($value) => (float) $value)->values();
        $evaluatedParticipants = $participantEvaluations->count();
        $presentParticipants = $presentUserIds->count();
        $registeredParticipants = $event ? $event->registrations->where('status', 'approved')->count() : 0;
        $averageScore = round($scores->avg() ?? 0, 2);
        $highestScore = round($scores->max() ?? 0, 2);
        $lowestScore = round($scores->min() ?? 0, 2);
        $passedCount = $participantEvaluations->where('result', 'passed')->count();
        $failedCount = $participantEvaluations->where('result', 'failed')->count();
        $passingRate = $evaluatedParticipants > 0 ? round(($passedCount / $evaluatedParticipants) * 100, 2) : 0;
        $completionPercentage = $presentParticipants > 0 ? round(($evaluatedParticipants / $presentParticipants) * 100, 2) : 0;

        $criteria = [];
        if ($event?->scenario?->criteria) {
            $criteria = is_array($event->scenario->criteria)
                ? $event->scenario->criteria
                : (json_decode($event->scenario->criteria, true) ?: []);
        }

        $criterionAverages = [];
        foreach ($criteria as $criterion) {
            $criterionName = is_array($criterion) ? ($criterion['name'] ?? '') : $criterion;
            if ($criterionName === '') {
                continue;
            }

            $criterionScores = $participantEvaluations
                ->flatMap(fn ($pe) => $pe->scores->where('criterion_name', $criterionName)->pluck('score'))
                ->map(fn ($value) => (float) $value)
                ->values();

            $criterionAverages[$criterionName] = round($criterionScores->avg() ?? 0, 2);
        }

        return [
            'simulation_information' => [
                'event_id' => $event?->id,
                'event_title' => $event?->title,
                'simulation_type' => $event?->event_category,
                'disaster_scenario' => $event?->scenario?->title ?? null,
                'venue' => $event?->venue ?: $event?->location,
                'date' => optional($event?->event_date)->toDateString(),
                'completion_status' => $event?->status,
            ],
            'participant_summary' => [
                'registered_participants' => $registeredParticipants,
                'present_participants' => $presentParticipants,
                'evaluated_participants' => $evaluatedParticipants,
            ],
            'metrics' => [
                'average_score' => $averageScore,
                'highest_score' => $highestScore,
                'lowest_score' => $lowestScore,
                'passing_rate' => $passingRate,
                'number_passed' => $passedCount,
                'number_failed' => $failedCount,
                'evaluation_completion_percentage' => $completionPercentage,
                'overall_performance' => $this->overallPerformanceFromAverage($averageScore),
            ],
            'criterion_averages' => $criterionAverages,
            'participant_performance_summary' => $participantEvaluations->map(function ($pe) {
                return [
                    'user_id' => $pe->user_id,
                    'participant_name' => $pe->user?->name,
                    'attendance_status' => $pe->attendance_status,
                    'evaluation_score' => (float) ($pe->average_score ?? 0),
                    'competency_rating' => $pe->competency_rating,
                    'remarks' => $pe->overall_feedback,
                    'result' => $pe->result,
                ];
            })->values()->all(),
            'participant_evaluations' => $participantEvaluations,
            'criteria' => $criteria,
        ];
    }

    public function overallPerformanceFromAverage(float $averageScore): string
    {
        if ($averageScore >= 90) {
            return 'Excellent';
        }

        if ($averageScore >= 80) {
            return 'Very Good';
        }

        if ($averageScore >= 70) {
            return 'Good';
        }

        if ($averageScore >= 60) {
            return 'Fair';
        }

        return 'Needs Improvement';
    }
}
