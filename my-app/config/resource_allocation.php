<?php

/**
 * Resource Allocation — external module/team.
 *
 * Inventory is the source of truth. This config enables inbound API calls
 * for reserving / marking in-use / returning equipment, with movement history.
 */
return [
    'enabled' => env('RESOURCE_ALLOCATION_INTEGRATION_ENABLED', false),

    'inbound' => [
        'api_key' => env('RESOURCE_ALLOCATION_INBOUND_API_KEY'),
        'header' => env('RESOURCE_ALLOCATION_INBOUND_API_HEADER', 'X-Resource-Allocation-Api-Key'),
    ],
];

