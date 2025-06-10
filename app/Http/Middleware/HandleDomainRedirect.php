<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class HandleDomainRedirect
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Only redirect in production
        if (app()->environment('production')) {
            $host = $request->getHost();
            $preferredDomain = parse_url(env('APP_URL'), PHP_URL_HOST);
            
            // If accessing with www, redirect to non-www version
            if ($host === 'www.' . $preferredDomain) {
                return redirect()->away('https://' . $preferredDomain . $request->getRequestUri(), 301);
            }
        }

        return $next($request);
    }
} 