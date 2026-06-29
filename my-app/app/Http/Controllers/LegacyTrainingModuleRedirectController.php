<?php

namespace App\Http\Controllers;

use App\Support\PortalSession;
use Illuminate\Http\Request;

/**
 * Redirects legacy shared /training-modules URLs to the correct portal prefix.
 */
class LegacyTrainingModuleRedirectController extends Controller
{
    public function redirectIndex(Request $request)
    {
        $user = portal_user();

        if ($user?->role === 'PARTICIPANT') {
            return redirect()->route('participant.training-modules.index', $request->query());
        }

        return redirect()->route('admin.training-modules.index', $request->query());
    }

    public function redirectShow(Request $request, \App\Models\TrainingModule $trainingModule)
    {
        $user = portal_user();

        if ($user?->role === 'PARTICIPANT') {
            return redirect()->route('participant.training-modules.show', ['trainingModule' => $trainingModule->id] + $request->query());
        }

        return redirect()->route('admin.training-modules.show', ['trainingModule' => $trainingModule->id] + $request->query());
    }

    public function redirectCreate(Request $request)
    {
        return redirect()->route('admin.training-modules.create', $request->query());
    }

    public function redirectEdit(Request $request, \App\Models\TrainingModule $trainingModule)
    {
        return redirect()->route('admin.training-modules.edit', ['trainingModule' => $trainingModule->id] + $request->query());
    }
}
