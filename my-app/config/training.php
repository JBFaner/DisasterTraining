<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Quiz / AI Scenario Attempt Cooldown
    |--------------------------------------------------------------------------
    | After a participant uses all attempts without passing, they must wait
    | this many hours before attempts auto-reset. Admins can reset sooner.
    */
    'attempt_cooldown_hours' => (int) env('TRAINING_ATTEMPT_COOLDOWN_HOURS', 24),

];
