<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Session;
use Symfony\Component\HttpFoundation\Response;

class EnsureApiCsrfToken
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // For API routes, we'll use session-based CSRF protection
        if ($request->is('api/*')) {
            // Ensure session is started
            if (!Session::isStarted()) {
                Session::start();
            }
            
            // Verify CSRF token for non-GET requests
            if ($request->isMethod('GET')) {
                return $next($request);
            }
            
            $token = $request->header('X-CSRF-TOKEN') ?: $request->input('_token');
            
            if (!$token || !hash_equals(Session::token(), $token)) {
                return response()->json(['message' => 'CSRF token mismatch'], 419);
            }
        }
        
        return $next($request);
    }
} 