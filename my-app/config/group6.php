<?php

/**
 * Group 6 / Public Safety Campaign Management System integration.
 *
 * Outbound (we → them): POST Training Intelligence to their campaigns API.
 * Inbound (they → us): approve/reject via /api/integrations/campaign-planning.
 */
return [

    'enabled' => env('GROUP6_INTEGRATION_ENABLED', false),

    /*
    |--------------------------------------------------------------------------
    | Campaign System API (their deployed app)
    |--------------------------------------------------------------------------
    */
    'api' => [
        'base_url' => rtrim((string) env('GROUP6_API_BASE_URL', 'https://campaign.alertaraqc.com'), '/'),
        // Optional pre-issued Bearer JWT. If empty, we mint one with jwt.* settings.
        'key' => env('GROUP6_API_KEY'),
        'timeout' => (int) env('GROUP6_API_TIMEOUT', 30),

        'endpoints' => [
            'campaigns' => env('GROUP6_ENDPOINT_CAMPAIGNS', '/api/v1/campaigns'),
            'campaigns_public' => env('GROUP6_ENDPOINT_CAMPAIGNS_PUBLIC', '/api/v1/campaigns/public'),
            'participants' => env('GROUP6_ENDPOINT_PARTICIPANTS', '/api/v1/participants'),
            'trainers' => env('GROUP6_ENDPOINT_TRAINERS', '/api/v1/trainers'),
            'campaign_requests' => env('GROUP6_ENDPOINT_CAMPAIGN_REQUESTS', '/api/integrations/group6/campaign-requests'),
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | JWT used to call their protected endpoints (POST /api/v1/campaigns)
    |--------------------------------------------------------------------------
    | Their auth expects Authorization: Bearer <jwt> with a valid numeric "sub".
    | Ask their team for a service-account user id + JWT secret for production.
    */
    'jwt' => [
        'secret' => env('GROUP6_JWT_SECRET'),
        'subject' => env('GROUP6_JWT_SUBJECT', '1'),
        'issuer' => env('GROUP6_JWT_ISSUER', 'public-safety-campaign-system'),
        'audience' => env('GROUP6_JWT_AUDIENCE', 'public-safety-campaign-system'),
        'expiry_seconds' => (int) env('GROUP6_JWT_EXPIRY_SECONDS', 86400),
    ],

    /*
    |--------------------------------------------------------------------------
    | Inbound webhook — Campaign System pushes / calls our approve/reject API
    |--------------------------------------------------------------------------
    */
    'inbound' => [
        'api_key' => env('GROUP6_INBOUND_API_KEY'),
        'header' => env('GROUP6_INBOUND_API_HEADER', 'X-Group6-Api-Key'),
    ],

];
