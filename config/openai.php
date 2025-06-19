<?php

return [
    /*
    |--------------------------------------------------------------------------
    | OpenAI API Key and Organization
    |--------------------------------------------------------------------------
    |
    | Here you may specify your OpenAI API Key and organization. This will be
    | used to authenticate with the OpenAI API. You should set this in your
    | environment file.
    |
    */

    'api_key' => env('OPENAI_API_KEY'),
    'organization' => env('OPENAI_ORGANIZATION'),

    /*
    |--------------------------------------------------------------------------
    | Request Timeout
    |--------------------------------------------------------------------------
    |
    | The timeout may be used to specify the maximum number of seconds to wait
    | for a response. By default, the client will timeout after 30 seconds.
    |
    */

    'request_timeout' => env('OPENAI_REQUEST_TIMEOUT', 30),

    /*
    |--------------------------------------------------------------------------
    | Default Model
    |--------------------------------------------------------------------------
    |
    | Here you may specify the default OpenAI model that should be used for
    | content generation. This can be overridden per request.
    |
    */

    'default_model' => env('OPENAI_DEFAULT_MODEL', 'gpt-4o-mini'),

    /*
    |--------------------------------------------------------------------------
    | Content Moderation
    |--------------------------------------------------------------------------
    |
    | Enable content moderation to check AI-generated content for harmful
    | material before returning it to users.
    |
    */

    'enable_moderation' => env('OPENAI_ENABLE_MODERATION', true),

    /*
    |--------------------------------------------------------------------------
    | Rate Limiting
    |--------------------------------------------------------------------------
    |
    | Configure rate limiting to prevent exceeding OpenAI API limits.
    |
    */

    'rate_limit' => [
        'requests_per_minute' => env('OPENAI_REQUESTS_PER_MINUTE', 50),
        'tokens_per_minute' => env('OPENAI_TOKENS_PER_MINUTE', 40000),
    ],

    /*
    |--------------------------------------------------------------------------
    | Caching
    |--------------------------------------------------------------------------
    |
    | Configure caching for AI responses to reduce API calls and costs.
    |
    */

    'cache' => [
        'enabled' => env('OPENAI_CACHE_ENABLED', true),
        'ttl' => env('OPENAI_CACHE_TTL', 3600), // 1 hour in seconds
        'prefix' => env('OPENAI_CACHE_PREFIX', 'openai_'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Fallback Settings
    |--------------------------------------------------------------------------
    |
    | Configure fallback behavior when OpenAI requests fail.
    |
    */

    'fallback' => [
        'enabled' => env('OPENAI_FALLBACK_ENABLED', true),
        'use_local_suggestions' => env('OPENAI_USE_LOCAL_FALLBACK', true),
    ],
]; 