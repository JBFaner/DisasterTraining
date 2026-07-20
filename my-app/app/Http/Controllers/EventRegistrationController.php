<?php

namespace App\Http\Controllers;

use App\Models\EventRegistration;
use App\Models\SimulationEvent;
use App\Services\PortalNotificationFactory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class EventRegistrationController extends Controller
{
    public function __construct(
        private readonly PortalNotificationFactory $notificationFactory,
    ) {}
    /**
     * Display registrations for a specific event.
     */
    public function index(SimulationEvent $simulationEvent)
    {
        $this->authorizeRegistrationAccess();

        $registrations = $simulationEvent->registrations()
            ->with(['user', 'attendance', 'approver'])
            ->orderBy('registered_at', 'desc')
            ->get();

        return view('app', [
            'section' => 'event_registrations',
            'event' => $simulationEvent,
            'registrations' => $registrations,
        ]);
    }

    /**
     * Approve a registration.
     */
    public function approve(EventRegistration $eventRegistration)
    {
        $this->authorizeRegistrationAccess();

        if ($eventRegistration->status !== 'pending') {
            return back()->with('status', 'Only pending registrations can be approved.');
        }

        $event = $eventRegistration->simulationEvent;

        // Check if event is full
        if ($event->isRegistrationFull()) {
            return back()->with('status', 'Event registration is full.');
        }

        $eventRegistration->update([
            'status' => 'approved',
            'approved_at' => now(),
            'approved_by' => portal_id(),
        ]);

        $eventRegistration->loadMissing(['user', 'simulationEvent']);
        if ($eventRegistration->user && $eventRegistration->simulationEvent) {
            $this->notificationFactory->registrationApproved(
                $eventRegistration->user,
                $eventRegistration->simulationEvent,
            );
        }

        return back()->with('status', 'Registration approved.');
    }

    /**
     * Reject a registration.
     */
    public function reject(Request $request, EventRegistration $eventRegistration)
    {
        $this->authorizeRegistrationAccess();

        if ($eventRegistration->status !== 'pending') {
            return back()->with('status', 'Only pending registrations can be rejected.');
        }

        $data = $request->validate([
            'rejection_reason' => ['required', 'string', 'max:500'],
        ]);

        $eventRegistration->update([
            'status' => 'rejected',
            'rejection_reason' => $data['rejection_reason'],
            'rejected_at' => now(),
            'approved_by' => portal_id(),
        ]);

        $eventRegistration->loadMissing(['user', 'simulationEvent']);
        if ($eventRegistration->user && $eventRegistration->simulationEvent) {
            $this->notificationFactory->registrationRejected(
                $eventRegistration->user,
                $eventRegistration->simulationEvent,
                $data['rejection_reason'],
            );
        }

        return back()->with('status', 'Registration rejected.');
    }

    /**
     * Cancel a registration.
     */
    public function cancel(EventRegistration $eventRegistration)
    {
        $this->authorizeRegistrationAccess();

        $eventRegistration->update([
            'status' => 'cancelled',
        ]);

        return back()->with('status', 'Registration cancelled.');
    }

    /**
     * Authorize registration access (Admin and Trainer only).
     */
    private function authorizeRegistrationAccess()
    {
        $user = portal_user();
        if (!$user || !in_array($user->role, ['LGU_ADMIN', 'LGU_TRAINER'], true)) {
            abort(403, 'Unauthorized access.');
        }
    }
}



