<?php

/**
 * Resource Allocation — external module/team.
 *
 * Disabled by default: Disaster Inventory is standalone.
 * Reserved / in-use quantities remain for internal event assignment only.
 * Set RESOURCE_ALLOCATION_INTEGRATION_ENABLED=true only if an external
 * Allocation system must mutate stock via the inbound API.
 */
return [
    'enabled' => env('RESOURCE_ALLOCATION_INTEGRATION_ENABLED', false),

    'inbound' => [
        'api_key' => env('RESOURCE_ALLOCATION_INBOUND_API_KEY'),
        'header' => env('RESOURCE_ALLOCATION_INBOUND_API_HEADER', 'X-Resource-Allocation-Api-Key'),
    ],
];

