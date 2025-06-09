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
            $preferredDomain = 'www.tikomat.karolkrakowski.pl';
            
            // If accessing without www, redirect to www version
            if ($host === 'tikomat.karolkrakowski.pl') {
                return redirect()->away('https://' . $preferredDomain . $request->getRequestUri(), 301);
            }
        }

        return $next($request);
    }
} 