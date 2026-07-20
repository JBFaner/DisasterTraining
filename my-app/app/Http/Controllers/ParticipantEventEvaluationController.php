<?php

namespace App\Http\Controllers;

use App\Models\ParticipantEvaluation;
use App\Support\SimulationEvaluationCriteria;
use Illuminate\Http\Request;

class ParticipantEventEvaluationController extends Controller
{
    public function show(Request $request, ParticipantEvaluation $participantEvaluation)
    {
        $this->authorize('view', $participantEvaluation);

        $participantEvaluation->load([
            'evaluation.simulationEvent.scenario',
            'scores',
            'evaluator:id,name',
            'attendance',
        ]);

        $event = $participantEvaluation->evaluation?->simulationEvent;
        $scenario = $event?->scenario;
        $criteria = SimulationEvaluationCriteria::resolve(
            is_array($scenario?->criteria) ? $scenario->criteria : null,
            $event?->disaster_type ?? $scenario?->disaster_type,
        );

        $passThreshold = (float) ($participantEvaluation->evaluation?->pass_threshold ?? 75.0);

        return view('app', [
            'section' => 'participant_event_evaluation',
            'participant_event_evaluation' => [
                'id' => $participantEvaluation->id,
                'result' => $participantEvaluation->result,
                'competency_rating' => $participantEvaluation->competency_rating,
                'overall_feedback' => $participantEvaluation->overall_feedback,
                'total_score' => $participantEvaluation->total_score !== null
                    ? (float) $participantEvaluation->total_score
                    : null,
                'average_score' => $participantEvaluation->average_score !== null
                    ? (float) $participantEvaluation->average_score
                    : null,
                'is_eligible_for_certification' => (bool) $participantEvaluation->is_eligible_for_certification,
                'submitted_at' => $participantEvaluation->submitted_at?->toIso8601String(),
                'attendance_status' => $participantEvaluation->attendance_status,
                'evaluator' => $participantEvaluation->evaluator ? [
                    'id' => $participantEvaluation->evaluator->id,
                    'name' => $participantEvaluation->evaluator->name,
                ] : null,
                'event' => $event ? [
                    'id' => $event->id,
                    'title' => $event->title,
                    'disaster_type' => $event->disaster_type,
                    'event_date' => $event->event_date?->toDateString(),
                    'venue' => $event->venue ?? $event->location,
                    'scenario' => $scenario ? [
                        'id' => $scenario->id,
                        'title' => $scenario->title,
                    ] : null,
                ] : null,
                'criteria' => $criteria,
                'scores' => $participantEvaluation->scores->map(fn ($score) => [
                    'criterion_name' => $score->criterion_name,
                    'criterion_description' => $score->criterion_description,
                    'score' => $score->score !== null ? (float) $score->score : null,
                    'max_score' => $score->max_score !== null ? (float) $score->max_score : 10.0,
                    'comment' => $score->comment,
                    'order' => $score->order,
                ])->values()->all(),
                'pass_threshold' => $passThreshold,
            ],
        ]);
    }
}
