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
        'token' => env('POSTMARK_TOKEN'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'resend' => [
        'key' => env('RESEND_KEY'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Social Media OAuth Providers
    |--------------------------------------------------------------------------
    */

    'google' => [
        'client_id' => env('GOOGLE_CLIENT_ID'),
        'client_secret' => env('GOOGLE_CLIENT_SECRET'),
        'redirect' => rtrim(env('APP_URL'), '/') . '/auth/youtube/callback',
    ],

    'instagram' => [
        'client_id' => env('INSTAGRAM_CLIENT_ID'),
        'client_secret' => env('INSTAGRAM_CLIENT_SECRET'),
        'redirect' => rtrim(env('APP_URL'), '/') . '/auth/instagram/callback',
    ],

    'tiktok' => [
        'client_id' => env('TIKTOK_CLIENT_ID'),
        'client_secret' => env('TIKTOK_CLIENT_SECRET'),
        'redirect' => rtrim(env('APP_URL'), '/') . '/auth/tiktok/callback',
    ],

    'facebook' => [
        'client_id' => env('FACEBOOK_CLIENT_ID'),
        'client_secret' => env('FACEBOOK_CLIENT_SECRET'),
        'redirect' => rtrim(env('APP_URL'), '/') . '/auth/facebook/callback',
    ],

    'snapchat' => [
        'client_id' => env('SNAPCHAT_CLIENT_ID'),
        'client_secret' => env('SNAPCHAT_CLIENT_SECRET'),
        'redirect' => rtrim(env('APP_URL'), '/') . '/auth/snapchat/callback',
    ],

    'pinterest' => [
        'client_id' => env('PINTEREST_CLIENT_ID'),
        'client_secret' => env('PINTEREST_CLIENT_SECRET'),
        'redirect' => rtrim(env('APP_URL'), '/') . '/auth/pinterest/callback',
    ],

    'x' => [
        'client_id' => env('X_CLIENT_ID'),
        'client_secret' => env('X_CLIENT_SECRET'),
        'redirect' => rtrim(env('APP_URL'), '/') . '/auth/x/callback',
    ],

    /*
    |--------------------------------------------------------------------------
    | Cloud Storage Providers
    |--------------------------------------------------------------------------
    */

    'google_drive' => [
        'client_id' => env('GOOGLE_DRIVE_CLIENT_ID'),
        'client_secret' => env('GOOGLE_DRIVE_CLIENT_SECRET'),
        'redirect' => rtrim(env('APP_URL'), '/') . '/cloud-storage/google_drive/callback',
    ],

    'dropbox' => [
        'client_id' => env('DROPBOX_CLIENT_ID'),
        'client_secret' => env('DROPBOX_CLIENT_SECRET'),
        'redirect' => rtrim(env('APP_URL'), '/') . '/cloud-storage/dropbox/callback',
    ],

    /*
    |--------------------------------------------------------------------------
    | AI Services
    |--------------------------------------------------------------------------
    */

    'openai' => [
        'api_key' => env('OPENAI_API_KEY'),
        'organization' => env('OPENAI_ORGANIZATION'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Trend Analysis Services
    |--------------------------------------------------------------------------
    */

    'serpapi' => [
        'key' => env('SERPAPI_API_KEY'),
        'timeout' => env('SERPAPI_TIMEOUT', 30),
    ],

    'newsapi' => [
        'key' => env('NEWSAPI_KEY'),
        'timeout' => env('NEWSAPI_TIMEOUT', 30),
    ],

    'searchapi' => [
        'key' => env('SEARCHAPI_KEY'),
        'timeout' => env('SEARCHAPI_TIMEOUT', 30),
    ],

];
