<?php

/**
 * CPSQC (Community Patrol / Safety QC) patrol request integration.
 *
 * We request marshals via POST /api/patrol_requests_receive.php
 * and pull approved assigned_personnel via GET /api/patrol_requests.php
 * for Exercise Plan Marshal assignments.
 *
 * Note: CPSQC currently allows source_group group_6 | group_8 only.
 */
return [

    'enabled' => env('CPSQC_INTEGRATION_ENABLED', false),

    'api' => [
        // Production: https://surveillance.alertaraqc.com
        'base_url' => rtrim((string) env('CPSQC_API_BASE_URL', 'https://surveillance.alertaraqc.com'), '/'),
        'key' => env('CPSQC_API_KEY', env('PATROL_REQUEST_API_KEY')),
        'timeout' => (int) env('CPSQC_API_TIMEOUT', 30),

        'endpoints' => [
            'receive' => env('CPSQC_ENDPOINT_RECEIVE', '/api/patrol_requests_receive.php'),
            'list' => env('CPSQC_ENDPOINT_LIST', '/api/patrol_requests.php'),
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Defaults stamped on outbound patrol requests
    |--------------------------------------------------------------------------
    */
    'defaults' => [
        'source' => env('CPSQC_SOURCE', 'partner_api'),
        // CPSQC whitelist: group_6 | group_8 (until they add disaster_training)
        'source_group' => env('CPSQC_SOURCE_GROUP', 'group_6'),
        'requesting_unit' => env('CPSQC_REQUESTING_UNIT', 'Disaster Preparedness Training and Simulation'),
        'contact_person' => env('CPSQC_CONTACT_PERSON', 'LGU Training Admin'),
        'contact_position' => env('CPSQC_CONTACT_POSITION', 'Training Coordinator'),
        'contact_number' => env('CPSQC_CONTACT_NUMBER', '09000000000'),
        'contact_email' => env('CPSQC_CONTACT_EMAIL'),
    ],

];
