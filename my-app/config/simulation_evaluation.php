<?php

/**
 * Default participant scoring criteria for simulation drills,
 * aligned with common Philippine practice:
 * - BFP Fire Drill Evaluation Checklist (FSID-11F) phases
 * - NSED / DepEd-style earthquake drill evaluation forms (1–5 style adapted to 0–10)
 * - Community drill after-action questions (Resilient Philippines / LGU drill guides)
 *
 * Scoring model in-app:
 * - Each criterion: 0–10 points
 * - Pass threshold: 70%
 * - Competency labels: Excellent / Good / Satisfactory / Needs Improvement
 */
return [
    'pass_threshold' => 70.0,
    'max_score_per_criterion' => 10.0,

    'competency_labels' => [
        'Excellent',
        'Good',
        'Satisfactory',
        'Needs Improvement',
    ],

    /**
     * Shared core criteria used across hazard types (participant-level scoring).
     */
    'core_criteria' => [
        'Alarm recognition and immediate response',
        'Evacuation discipline and route compliance',
        'Accountability at assembly / headcount participation',
        'PPE and personal safety compliance',
        'Following marshal / Incident Commander instructions',
        'Communication and teamwork during the drill',
        'Serious participation and role performance',
    ],

    /**
     * Hazard-specific add-ons (merged with core when scenario disaster type matches).
     */
    'by_disaster_type' => [
        'Fire' => [
            'Proper use / handling of fire extinguisher or assigned firefighting role',
            'Maintains safe distance and upwind position during fire simulation',
        ],
        'Earthquake' => [
            'Correct Duck, Cover, and Hold during alarm phase',
            'Waited for all-clear / alarm stop before evacuating',
            'Buddy-buddy system and head protection during evacuation',
        ],
        'Flood' => [
            'Timely response to early warning / evacuation order',
            'Assistance to vulnerable persons during evacuation',
        ],
        'Mass Casualty' => [
            'Correct triage tagging / casualty handling role',
            'Radio / reporting discipline during medical response',
        ],
    ],

    /**
     * Event-level post evaluation prompts (debrief), not per-participant scores.
     * Inspired by community drill after-action guides.
     */
    'post_evaluation_prompts' => [
        'overall_remarks' => 'Overall assessment of drill conduct and objectives met',
        'success_level' => 'Excellent / Satisfactory / Needs Improvement',
        'problems_encountered' => 'Gaps in alarm, mobilization, evacuation, medical, or demobilization',
        'recommendations' => 'Adjustments to contingency plan, equipment, routes, or training',
        'lessons_learned' => 'What to sustain and what to improve for the next drill',
    ],
];
