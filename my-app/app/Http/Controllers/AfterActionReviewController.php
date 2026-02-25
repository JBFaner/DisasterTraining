<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class AfterActionReviewController extends Controller
{
    /**
     * Show the After-Action Review (AAR) workspace.
     * Renders inside the main React admin shell so it shares the sidebar/topbar.
     */
    public function index(Request $request)
    {
        return view('app', [
            'section' => 'after_action_review',
        ]);
    }
}
