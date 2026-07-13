<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'sms' => [
        'provider' => env('SMS_PROVIDER', 'log'), // 'twilio', 'vonage', or 'log'
        'twilio' => [
            'account_sid' => env('TWILIO_ACCOUNT_SID'),
            'auth_token' => env('TWILIO_AUTH_TOKEN'),
            'from' => env('TWILIO_FROM_NUMBER'),
        ],
        'vonage' => [
            'api_key' => env('VONAGE_API_KEY'),
            'api_secret' => env('VONAGE_API_SECRET'),
            'from' => env('VONAGE_FROM_NUMBER'),
        ],
    ],

    'gemini' => [
        'api_key' => env('GEMINI_API_KEY'),
        // Use v1beta + a current model (gemini-pro and 1.5 models are deprecated)
        'model' => env('GEMINI_MODEL', 'gemini-2.0-flash'),
        'api_version' => env('GEMINI_API_VERSION', 'v1beta'),
    ],

    'youtube' => [
        'innertube_api_key' => env('YOUTUBE_INNERTUBE_API_KEY'),
        'innertube_client_version' => env('YOUTUBE_INNERTUBE_CLIENT_VERSION', '2.20260708.00.00'),
    ],

    'centralized_login' => [
        'url' => env('CENTRALIZED_LOGIN_URL', 'https://login.alertaraqc.com'),
        'api_endpoint' => env('AUTH_API_ENDPOINT', 'https://login.alertaraqc.com/api/auth/validate'),
        'main_domain' => env('MAIN_DOMAIN', 'https://alertaraqc.com'),
    ],

];
