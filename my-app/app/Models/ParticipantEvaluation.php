<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ParticipantEvaluation extends Model
{
    protected $fillable = [
        'evaluation_id',
        'user_id',
        'attendance_id',
        'attendance_status',
        'status',
        'total_score',
        'average_score',
        'weighted_score',
        'result',
        'competency_rating',
        'overall_feedback',
        'is_eligible_for_certification',
        'evaluated_by',
        'submitted_at',
    ];

    protected $casts = [
        'total_score' => 'decimal:2',
        'average_score' => 'decimal:2',
        'weighted_score' => 'decimal:2',
        'is_eligible_for_certification' => 'boolean',
        'submitted_at' => 'datetime',
    ];

    public function evaluation()
    {
        return $this->belongsTo(Evaluation::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function attendance()
    {
        return $this->belongsTo(Attendance::class);
    }

    public function scores()
    {
        return $this->hasMany(EvaluationScore::class)->orderBy('order');
    }

    public function evaluator()
    {
        return $this->belongsTo(User::class, 'evaluated_by');
    }

    public function calculateScores()
    {
        $scores = $this->scores;
        $threshold = (float) ($this->evaluation?->pass_threshold ?? 75.00);
        
        if ($scores->isEmpty()) {
            $this->total_score = 0;
            $this->average_score = 0;
            $this->weighted_score = 0;
            $this->result = 'failed';
            $this->is_eligible_for_certification = false;
            $this->competency_rating = $this->competency_rating ?: 'Needs Improvement';
            $this->save();
            return;
        }

        $totalScore = $scores->sum('score');
        $maxScore = $scores->sum('max_score');
        $averageScore = $maxScore > 0 ? ($totalScore / $maxScore) * 100 : 0;

        $this->total_score = $totalScore;
        $this->average_score = $averageScore;
        $this->weighted_score = $averageScore; // Can be customized for weighted scoring

        // Determine pass/fail
        // Business rule:
        // - Passed if average score >= 75%
        // - Certification eligible: Yes if Passed, else No
        $this->result = $averageScore >= $threshold ? 'passed' : 'failed';
        $this->is_eligible_for_certification = $this->result === 'passed';
        $this->competency_rating = $this->competencyRatingFromAverage($averageScore);

        $this->save();
    }

    public function competencyRatingFromAverage(float $averageScore): string
    {
        if ($averageScore >= 90) {
            return 'Excellent';
        }

        if ($averageScore >= 80) {
            return 'Good';
        }

        if ($averageScore >= 70) {
            return 'Satisfactory';
        }

        return 'Needs Improvement';
    }
}
