<?php

/**
 * Group 6 — external Campaign Planning & Scheduling team (separate system).
 *
 * This app does NOT implement Group 6's modules. These settings only configure
 * integration points for receiving data from their API when it becomes available.
 */
return [

    'enabled' => env('GROUP6_INTEGRATION_ENABLED', false),

    /*
    |--------------------------------------------------------------------------
    | Group 6 API (their system — we consume data from them)
    |--------------------------------------------------------------------------
    */
    'api' => [
        'base_url' => rtrim((string) env('GROUP6_API_BASE_URL', ''), '/'),
        'key' => env('GROUP6_API_KEY'),
        'timeout' => (int) env('GROUP6_API_TIMEOUT', 30),

        // Endpoint paths — update when Group 6 team provides their API spec
        'endpoints' => [
            'participants' => env('GROUP6_ENDPOINT_PARTICIPANTS', '/api/v1/participants'),
            'trainers' => env('GROUP6_ENDPOINT_TRAINERS', '/api/v1/trainers'),
            'campaign_requests' => env('GROUP6_ENDPOINT_CAMPAIGN_REQUESTS', '/api/integrations/group6/campaign-requests'),
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Inbound webhook — Group 6 pushes data to our app
    |--------------------------------------------------------------------------
    */
    'inbound' => [
        'api_key' => env('GROUP6_INBOUND_API_KEY'),
        'header' => env('GROUP6_INBOUND_API_HEADER', 'X-Group6-Api-Key'),
    ],

];
