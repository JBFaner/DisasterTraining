<?php

namespace App\Http\Controllers;

use App\Support\PortalAuth;
use App\Support\PortalSession;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

/**
 * Redirects legacy shared URLs (without /admin/ or /participant/ prefix) to the correct portal route.
 */
class LegacyPortalRedirectController extends Controller
{
    public function redirectByPortal(Request $request, string $adminRoute, string $participantRoute, array $parameters = [])
    {
        $route = $this->resolveTargetRoute($request, $adminRoute, $participantRoute);

        return redirect()->route($route, $parameters + $request->query());
    }

    public function evaluations(Request $request)
    {
        return $this->redirectByPortal($request, 'admin.evaluations.index', 'participant.evaluations.index');
    }

    public function simulationEvents(Request $request)
    {
        return $this->redirectByPortal($request, 'admin.simulation-events.index', 'participant.simulation-events.index');
    }

    public function simulationEventShow(Request $request, \App\Models\SimulationEvent $simulationEvent)
    {
        return $this->redirectByPortal(
            $request,
            'admin.simulation-events.show',
            'participant.simulation-events.show',
            ['simulationEvent' => $simulationEvent->id],
        );
    }

    public function resources(Request $request)
    {
        return redirect()->route('admin.resources.index', $request->query());
    }

    public function participants(Request $request)
    {
        return redirect()->route('admin.participants.index', $request->query());
    }

    public function certification(Request $request)
    {
        return $this->redirectByPortal($request, 'admin.certification.index', 'participant.certification.index');
    }

    public function afterActionReview(Request $request)
    {
        return redirect()->route('admin.after-action-review.index', $request->query());
    }

    public function drillHistoryReports(Request $request)
    {
        return redirect()->route('admin.drill-history-reports.index', $request->query());
    }

    public function barangayProfile(Request $request)
    {
        return redirect()->route('admin.hazard-assessment-profiles.index', $request->query());
    }

    public function auditLogs(Request $request)
    {
        return redirect()->route('admin.audit-logs.index', $request->query());
    }

    public function myAttendance(Request $request)
    {
        return redirect()->route('participant.my-attendance.index', $request->query());
    }

    protected function resolveTargetRoute(Request $request, string $adminRoute, string $participantRoute): string
    {
        $portal = PortalSession::resolvePortal($request);

        if ($portal === PortalSession::ADMIN) {
            return $adminRoute;
        }

        if ($portal === PortalSession::PARTICIPANT) {
            return $participantRoute;
        }

        if (Auth::guard(PortalAuth::ADMIN_GUARD)->check()) {
            $user = Auth::guard(PortalAuth::ADMIN_GUARD)->user();
            if ($user && $user->role !== 'PARTICIPANT') {
                return $adminRoute;
            }
        }

        return $participantRoute;
    }
}
