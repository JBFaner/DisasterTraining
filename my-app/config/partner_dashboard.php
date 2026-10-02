<?php

/**
 * Partner dashboard analytics API — for any external group/system that needs
 * read-only access to Disaster Training operations KPIs and charts.
 *
 * Not tied to Group 6 campaign integration.
 */
return [
    'enabled' => env('DASHBOARD_PARTNER_API_ENABLED', true),

    'inbound' => [
        'api_key' => env('DASHBOARD_PARTNER_API_KEY'),
        'header' => env('DASHBOARD_PARTNER_API_HEADER', 'X-Dashboard-Api-Key'),
    ],
];
