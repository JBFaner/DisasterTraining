<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Supported display / generation languages
    |--------------------------------------------------------------------------
    | Add new locales here (e.g. ceb, ilo) without changing service architecture.
    */
    'languages' => [
        'en' => [
            'label' => 'English',
            'native_label' => 'English',
            'flag' => '🇺🇸',
        ],
        'fil' => [
            'label' => 'Filipino',
            'native_label' => 'Filipino',
            'flag' => '🇵🇭',
        ],
    ],

    'default_language' => 'en',

    'language_codes' => ['en', 'fil'],

    /*
    |--------------------------------------------------------------------------
    | Generation timeout (seconds)
    |--------------------------------------------------------------------------
    | Bilingual generation calls Gemini twice (generate + translate) and can
    | exceed PHP's default 30s max_execution_time.
    */
    'generation_max_execution_seconds' => (int) env('AI_SCENARIO_GENERATION_TIMEOUT', 300),
];
