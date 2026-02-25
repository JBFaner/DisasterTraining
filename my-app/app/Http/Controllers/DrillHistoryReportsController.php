<?php

namespace App\Http\Controllers;

use App\Models\SimulationEvent;
use Illuminate\Http\Request;

class DrillHistoryReportsController extends Controller
{
    /**
     * Show the Drill History Reports workspace inside the main admin shell.
     */
    public function index(Request $request)
    {
        // Only include completed events in drill history
        $events = SimulationEvent::with([
                'scenario',
                'creator',
                'evaluation.participantEvaluations',
            ])
            ->withCount([
                'registrations',
                'registrations as approved_registrations_count' => function ($q) {
                    $q->where('status', 'approved');
                },
            ])
            ->where('status', 'completed')
            ->orderByDesc('event_date')
            ->orderByDesc('start_time')
            ->get();

        // Attach a derived average score per event based on submitted participant evaluations
        $events->each(function (SimulationEvent $event) {
            $evaluation = $event->evaluation;
            if (! $evaluation) {
                $event->derived_average_score = null;
                return;
            }

            $submitted = $evaluation->participantEvaluations
                ? $evaluation->participantEvaluations->where('status', 'submitted')
                : collect();

            if ($submitted->isEmpty()) {
                $event->derived_average_score = null;
                return;
            }

            $avg = $submitted->avg('average_score') ?? 0;
            $event->derived_average_score = round($avg, 1);
        });

        return view('app', [
            'section' => 'drill_history_reports',
            'events' => $events,
        ]);
    }
}

