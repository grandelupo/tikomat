<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Inertia\Response;

class LegalController extends Controller
{
    /**
     * Show privacy policy.
     */
    public function privacy(): Response
    {
        return Inertia::render('Legal/Privacy');
    }

    /**
     * Show data deletion page.
     */
    public function dataDeletion(): Response
    {
        return Inertia::render('Legal/DataDeletion');
    }

    /**
     * Show terms of service.
     */
    public function terms(): Response
    {
        return Inertia::render('Legal/Terms');
    }
} 