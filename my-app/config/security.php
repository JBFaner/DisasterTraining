<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Session Timeout (Inactivity)
    |--------------------------------------------------------------------------
    | After this many minutes of no activity (no mouse, keyboard, etc.),
    | the user is automatically logged out. Activity is reported by the
    | frontend via the session activity endpoint.
    */
    'session_timeout_minutes' => (int) env('SESSION_TIMEOUT_MINUTES', 10),

    /*
    | Seconds before logout to show the warning modal.
    */
    'warning_before_logout_seconds' => (int) env('WARNING_BEFORE_LOGOUT_SECONDS', 60),

    /*
    |--------------------------------------------------------------------------
    | Login Attempt Limit & Lockout
    |--------------------------------------------------------------------------
    */
    'max_login_attempts' => (int) env('MAX_LOGIN_ATTEMPTS', 3),
    'lockout_duration_seconds' => (int) env('LOCKOUT_DURATION_SECONDS', 30),
    'enable_progressive_delay' => env('ENABLE_PROGRESSIVE_DELAY', true),

    /*
    | Progressive lockout durations in seconds: 1st lockout, 2nd, 3rd, ...
    */
    'progressive_lockout_seconds' => [
        30,   // 1st lock → 30 sec
        60,   // 2nd lock → 1 min
        300,  // 3rd lock → 5 min
    ],
];
