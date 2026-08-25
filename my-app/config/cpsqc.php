<?php

/**
 * CPSQC (Community Patrol / Safety QC) patrol request integration.
 *
 * We request marshals via POST /api/patrol_requests_receive.php
 * and pull approved assigned_personnel via GET /api/patrol_requests.php
 * for Exercise Plan Marshal assignments.
 *
 * Patrol source_group whitelist: campaign | disaster-preparedness
 * Legacy aliases still accepted by Patrol: group_6 → campaign, group_8 → disaster-preparedness
 */
return [

    'enabled' => env('CPSQC_INTEGRATION_ENABLED', false),

    'api' => [
        // Production partner API (catalog: https://policy.alertaraqc.com/api/partner-api.php)
        'base_url' => rtrim((string) env('CPSQC_API_BASE_URL', 'https://policy.alertaraqc.com'), '/'),
        // Optional for list/receive (inbound partner APIs are public per catalog).
        'key' => env('CPSQC_API_KEY', env('PATROL_REQUEST_API_KEY')),
        'timeout' => (int) env('CPSQC_API_TIMEOUT', 30),
        // policy.alertaraqc.com has a matching certificate — keep verify on unless overridden.
        'verify_ssl' => filter_var(env('CPSQC_API_VERIFY_SSL', true), FILTER_VALIDATE_BOOLEAN),

        'endpoints' => [
            'receive' => env('CPSQC_ENDPOINT_RECEIVE', '/api/patrol_requests_receive.php'),
            'list' => env('CPSQC_ENDPOINT_LIST', '/api/patrol_requests.php'),
            'lifecycle' => env('CPSQC_ENDPOINT_LIFECYCLE', '/api/patrol_requests_lifecycle.php'),
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Defaults stamped on outbound patrol requests
    |--------------------------------------------------------------------------
    */
    'defaults' => [
        'source' => env('CPSQC_SOURCE', 'partner_api'),
        // Canonical value for Disaster Training on current Patrol deploy
        'source_group' => env('CPSQC_SOURCE_GROUP', 'disaster-preparedness'),
        'requesting_unit' => env('CPSQC_REQUESTING_UNIT', 'Disaster Preparedness Training and Simulation'),
        'contact_person' => env('CPSQC_CONTACT_PERSON', 'LGU Training Admin'),
        'contact_position' => env('CPSQC_CONTACT_POSITION', 'Training Coordinator'),
        'contact_number' => env('CPSQC_CONTACT_NUMBER', '09000000000'),
        'contact_email' => env('CPSQC_CONTACT_EMAIL'),
    ],

];
