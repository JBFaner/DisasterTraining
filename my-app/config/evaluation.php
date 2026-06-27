<?php

return [
    'passing_score' => (float) env('EVALUATION_PASSING_SCORE', 75),

    'competencies' => [
        'knowledge' => 'Knowledge',
        'decision_making' => 'Decision Making',
        'emergency_response' => 'Emergency Response',
        'safety_awareness' => 'Safety Awareness',
    ],

    'status_passed' => 'passed',
    'status_needs_improvement' => 'needs_improvement',
];
