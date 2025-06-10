<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class HandleDomainRedirect
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
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

        $response = $next($request);

        // Add security headers for HTTPS
        if ($request->secure()) {
            $response->headers->set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
            $response->headers->set('X-Content-Type-Options', 'nosniff');
            $response->headers->set('X-Frame-Options', 'DENY');
            $response->headers->set('X-XSS-Protection', '1; mode=block');
            $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');
        }

        return $response;
    }
} 