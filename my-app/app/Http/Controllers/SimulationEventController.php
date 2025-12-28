<?php

namespace App\Http\Controllers;

use App\Models\SimulationEvent;
use App\Models\Scenario;
use App\Models\Resource;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class SimulationEventController extends Controller
{
    public function index()
    {
        $user = Auth::user();

        // Participants see published, ongoing, ended, completed, and archived events (not draft or cancelled)
        if ($user && $user->role === 'PARTICIPANT') {
            $events = SimulationEvent::with(['scenario.trainingModule.lessons', 'registrations'])
                ->whereIn('status', ['published', 'ongoing', 'ended', 'completed', 'archived'])
                ->where('event_date', '>=', now()->subDays(7)) // Include events from past week
                ->orderBy('event_date')
                ->orderBy('start_time')
                ->get();

            // Add registration status for current user
            $events->each(function ($event) use ($user) {
                $event->user_registration = $event->registrations->where('user_id', $user->id)->first();
            });

            return view('app', [
                'section' => 'simulation',
                'events' => $events,
            ]);
        }

        // Admin/Trainer see all events
        $this->authorizeEventAccess();

        $events = SimulationEvent::with(['scenario', 'creator'])
            ->withCount([
                'registrations',
                'registrations as approved_registrations_count' => function ($query) {
                    $query->where('status', 'approved');
                }
            ])
            ->orderByDesc('event_date')
            ->orderByDesc('created_at')
            ->get();

        return view('app', [
            'section' => 'simulation',
            'events' => $events,
            'scenarios' => Scenario::where('status', 'published')->orderBy('title')->get(),
        ]);
    }

    public function create()
    {
        $this->authorizeEventAccess();

        return view('app', [
            'section' => 'simulation_create',
            'scenarios' => Scenario::where('status', 'published')->orderBy('title')->get(),
        ]);
    }

    public function store(Request $request)
    {
        $this->authorizeEventAccess();

        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'disaster_type' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'event_category' => ['required', 'string', 'in:Drill,Full-scale Exercise,Tabletop,Training Session'],
            'event_date' => ['required', 'date'],
            'start_time' => ['required'],
            'end_time' => ['required'],
            'is_recurring' => ['nullable', 'boolean'],
            'recurrence_pattern' => ['nullable', 'string'],
            'location' => ['nullable', 'string', 'max:255'],
            'building' => ['nullable', 'string', 'max:255'],
            'room_zone' => ['nullable', 'string', 'max:255'],
            'location_notes' => ['nullable', 'string'],
            'accessibility_notes' => ['nullable', 'string'],
            'exits' => ['nullable', 'string'],
            'hazard_zones' => ['nullable', 'string'],
            'assembly_points' => ['nullable', 'string'],
            'is_high_risk_location' => ['nullable', 'boolean'],
            'scenario_id' => ['nullable', 'exists:scenarios,id'],
            'scenario_is_required' => ['nullable', 'boolean'],
            'max_participants' => ['nullable', 'integer', 'min:1'],
            'self_registration_enabled' => ['nullable', 'boolean'],
            'qr_code_enabled' => ['nullable', 'boolean'],
            'safety_guidelines' => ['nullable', 'string'],
            'hazard_warnings' => ['nullable', 'string'],
            'required_ppe' => ['nullable', 'string'],
            'email_notifications_enabled' => ['nullable', 'boolean'],
            'sms_notifications_enabled' => ['nullable', 'boolean'],
        ]);

        // Handle JSON fields and arrays
        $data['facilitators'] = $request->input('facilitators') ? json_decode($request->input('facilitators'), true) : null;
        $data['allowed_participant_types'] = $request->has('allowed_participant_types') && is_array($request->input('allowed_participant_types')) 
            ? $request->input('allowed_participant_types') 
            : ($request->input('allowed_participant_types') ? json_decode($request->input('allowed_participant_types'), true) : null);
        $data['reserved_resources'] = $request->input('reserved_resources') ? json_decode($request->input('reserved_resources'), true) : null;
        $data['event_phases'] = $request->input('event_phases') ? json_decode($request->input('event_phases'), true) : null;
        $data['inject_triggers'] = $request->input('inject_triggers') ? json_decode($request->input('inject_triggers'), true) : null;
        $data['notification_schedule'] = $request->input('notification_schedule') ? json_decode($request->input('notification_schedule'), true) : null;

        $data['status'] = $request->input('status', 'draft');
        $data['created_by'] = Auth::id();

        if ($data['status'] === 'published' && !isset($data['published_at'])) {
            $data['published_at'] = now();
        }

        $event = SimulationEvent::create($data);

        // Handle resource assignments if provided
        if ($request->has('resources')) {
            $resources = json_decode($request->input('resources'), true);
            if (is_array($resources)) {
                foreach ($resources as $resourceData) {
                    $event->resources()->attach($resourceData['id'], [
                        'quantity_needed' => $resourceData['quantity'] ?? 1,
                        'quantity_assigned' => 0,
                        'status' => 'Planned',
                    ]);
                }
            }
        }

        // If event is published, auto-assign resources
        if ($data['status'] === 'published') {
            $this->autoAssignResources($event);
        }

        $redirectTo = $request->input('return_to');

        return ($redirectTo ? redirect($redirectTo) : redirect()->route('simulation.events.index'))
            ->with('status', 'Simulation event created successfully.');
    }

    public function edit(SimulationEvent $simulationEvent)
    {
        $this->authorizeEventAccess();

        // Prevent editing of published, cancelled, or archived events
        if (in_array($simulationEvent->status, ['published', 'cancelled', 'archived'], true)) {
            return redirect()->route('simulation.events.index')
                ->with('status', 'This event cannot be edited. Unpublish or restore it first.');
        }

        return view('app', [
            'section' => 'simulation_edit',
            'event' => $simulationEvent->load('scenario'),
            'scenarios' => Scenario::where('status', 'published')->orderBy('title')->get(),
        ]);
    }

    public function update(Request $request, SimulationEvent $simulationEvent)
    {
        $this->authorizeEventAccess();

        // Prevent updating published, cancelled, or archived events
        if (in_array($simulationEvent->status, ['published', 'cancelled', 'archived'], true)) {
            return redirect()->route('simulation.events.index')
                ->with('status', 'This event cannot be edited. Unpublish or restore it first.');
        }

        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'disaster_type' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'event_category' => ['required', 'string', 'in:Drill,Full-scale Exercise,Tabletop,Training Session'],
            'event_date' => ['required', 'date'],
            'start_time' => ['required'],
            'end_time' => ['required'],
            'is_recurring' => ['nullable', 'boolean'],
            'recurrence_pattern' => ['nullable', 'string'],
            'location' => ['nullable', 'string', 'max:255'],
            'building' => ['nullable', 'string', 'max:255'],
            'room_zone' => ['nullable', 'string', 'max:255'],
            'location_notes' => ['nullable', 'string'],
            'accessibility_notes' => ['nullable', 'string'],
            'exits' => ['nullable', 'string'],
            'hazard_zones' => ['nullable', 'string'],
            'assembly_points' => ['nullable', 'string'],
            'is_high_risk_location' => ['nullable', 'boolean'],
            'scenario_id' => ['nullable', 'exists:scenarios,id'],
            'scenario_is_required' => ['nullable', 'boolean'],
            'max_participants' => ['nullable', 'integer', 'min:1'],
            'self_registration_enabled' => ['nullable', 'boolean'],
            'qr_code_enabled' => ['nullable', 'boolean'],
            'safety_guidelines' => ['nullable', 'string'],
            'hazard_warnings' => ['nullable', 'string'],
            'required_ppe' => ['nullable', 'string'],
            'email_notifications_enabled' => ['nullable', 'boolean'],
            'sms_notifications_enabled' => ['nullable', 'boolean'],
        ]);

        // Handle JSON fields and arrays
        $data['facilitators'] = $request->input('facilitators') ? json_decode($request->input('facilitators'), true) : null;
        $data['allowed_participant_types'] = $request->has('allowed_participant_types') && is_array($request->input('allowed_participant_types')) 
            ? $request->input('allowed_participant_types') 
            : ($request->input('allowed_participant_types') ? json_decode($request->input('allowed_participant_types'), true) : null);
        $data['reserved_resources'] = $request->input('reserved_resources') ? json_decode($request->input('reserved_resources'), true) : null;
        $data['event_phases'] = $request->input('event_phases') ? json_decode($request->input('event_phases'), true) : null;
        $data['inject_triggers'] = $request->input('inject_triggers') ? json_decode($request->input('inject_triggers'), true) : null;
        $data['notification_schedule'] = $request->input('notification_schedule') ? json_decode($request->input('notification_schedule'), true) : null;

        $data['updated_by'] = Auth::id();

        // Preserve existing status if not provided in request
        $wasPublished = $simulationEvent->status === 'published';
        if (!$request->has('status')) {
            $data['status'] = $simulationEvent->status;
        } else {
            $data['status'] = $request->input('status');
            if ($request->input('status') === 'published' && !$simulationEvent->published_at) {
                $data['published_at'] = now();
            }
        }

        $simulationEvent->update($data);

        // Handle resource assignments if provided
        if ($request->has('resources')) {
            $resources = json_decode($request->input('resources'), true);
            $syncData = [];
            
            if (is_array($resources)) {
                foreach ($resources as $resourceData) {
                    $syncData[$resourceData['id']] = [
                        'quantity_needed' => $resourceData['quantity'] ?? 1,
                        'quantity_assigned' => 0,
                        'status' => 'Planned',
                    ];
                }
            }
            
            $simulationEvent->resources()->sync($syncData);
        }

        // If event is newly published, auto-assign resources
        if (!$wasPublished && $data['status'] === 'published') {
            $this->autoAssignResources($simulationEvent);
        }

        $redirectTo = $request->input('return_to');

        return ($redirectTo ? redirect($redirectTo) : redirect()->route('simulation.events.index'))
            ->with('status', 'Simulation event updated successfully.');
    }

    public function destroy(SimulationEvent $simulationEvent)
    {
        $this->authorizeEventDelete();

        $simulationEvent->delete();

        return redirect()->route('simulation.events.index')
            ->with('status', 'Simulation event deleted permanently.');
    }

    public function publish(SimulationEvent $simulationEvent)
    {
        $this->authorizeEventAccess();

        $simulationEvent->update([
            'status' => 'published',
            'published_at' => now(),
            'updated_by' => Auth::id(),
        ]);

        // Auto-assign resources when event is published
        $this->autoAssignResources($simulationEvent);

        return redirect()->route('simulation.events.index')
            ->with('status', 'Simulation event published and resources assigned successfully.');
    }

    public function unpublish(SimulationEvent $simulationEvent)
    {
        $this->authorizeEventAccess();

        if ($simulationEvent->status !== 'published') {
            return redirect()->route('simulation.events.index')
                ->with('status', 'Only published events can be unpublished.');
        }

        $simulationEvent->update([
            'status' => 'draft',
            'updated_by' => Auth::id(),
        ]);

        return redirect()->route('simulation.events.index')
            ->with('status', 'Simulation event unpublished and set to draft.');
    }

    public function cancel(SimulationEvent $simulationEvent)
    {
        $this->authorizeEventAccess();

        // TODO: Send notifications to registered participants
        // $this->notifyParticipants($simulationEvent, 'cancelled');

        $simulationEvent->update([
            'status' => 'cancelled',
            'updated_by' => Auth::id(),
        ]);

        return redirect()->route('simulation.events.index')
            ->with('status', 'Simulation event cancelled. Participants will be notified.');
    }

    public function archive(SimulationEvent $simulationEvent)
    {
        $this->authorizeEventAccess();

        $simulationEvent->update([
            'status' => 'archived',
            'updated_by' => Auth::id(),
        ]);

        return redirect()->route('simulation.events.index')
            ->with('status', 'Simulation event archived.');
    }

    public function start(SimulationEvent $simulationEvent)
    {
        $this->authorizeEventAccess();

        $user = Auth::user();

        // Check event status is published
        if ($simulationEvent->status !== 'published') {
            return redirect()->route('simulation.events.index')
                ->with('status', 'Only published events can be started.');
        }

        // Check current date matches event date
        $eventDate = $simulationEvent->event_date;
        $today = now()->format('Y-m-d');
        if ($eventDate->format('Y-m-d') !== $today) {
            return redirect()->back()
                ->with('status', 'Event can only be started on the scheduled event date.');
        }

        // Check current time is >= scheduled start time
        $startTime = $simulationEvent->start_time; // format: HH:MM
        $currentTime = now()->format('H:i');
        if ($currentTime < $startTime) {
            return redirect()->back()
                ->with('status', 'Event cannot be started before the scheduled start time.');
        }

        // Update status to ongoing and log start details
        $simulationEvent->update([
            'status' => 'ongoing',
            'actual_start_time' => now(),
            'started_by' => Auth::id(),
            'updated_by' => Auth::id(),
        ]);

        return redirect()->back()
            ->with('status', 'Event started successfully. Status changed to Ongoing.');
    }

    protected function authorizeEventAccess(): void
    {
        $user = Auth::user();
        if (! $user) abort(403);
        if (! in_array($user->role, ['LGU_ADMIN', 'LGU_TRAINER'], true)) abort(403);
    }

    protected function authorizeEventDelete(): void
    {
        $user = Auth::user();
        if (! $user) abort(403);
        if ($user->role !== 'LGU_ADMIN') abort(403);
    }

    /**
     * Show event details for participant (read-only view with scenario info)
     */
    public function show(SimulationEvent $simulationEvent)
    {
        $user = Auth::user();

        // Participants can only view published and ongoing events
        if ($user && $user->role === 'PARTICIPANT') {
            if (!in_array($simulationEvent->status, ['published', 'ongoing'])) {
                abort(404);
            }

            // Load scenario with training module and lessons
            $simulationEvent->load([
                'scenario.trainingModule.lessons' => function ($query) {
                    $query->orderBy('order');
                },
                'registrations' => function ($query) use ($user) {
                    $query->where('user_id', $user->id);
                },
            ]);

            // Get user's registration status
            $userRegistration = $simulationEvent->registrations->first();

            // Get registration count
            $registrationCount = $simulationEvent->registrations()->count();

            return view('app', [
                'section' => 'simulation_detail',
                'event' => $simulationEvent,
                'user_registration' => $userRegistration,
                'registration_count' => $registrationCount,
            ]);
        }

        // Admin/Trainer view published/archived/cancelled events (read-only)
        $this->authorizeEventAccess();
        
        $simulationEvent->load([
            'scenario.trainingModule.lessons' => function ($query) {
                $query->orderBy('order');
            },
            'registrations',
            'resources',
        ]);

        return view('app', [
            'section' => 'simulation_detail',
            'event' => $simulationEvent,
        ]);
    }

    /**
     * Register participant for an event
     */
    public function register(Request $request, SimulationEvent $simulationEvent)
    {
        $user = Auth::user();

        // Only participants can register
        if (!$user || $user->role !== 'PARTICIPANT') {
            abort(403);
        }

        // Check if event is published and open for registration
        if ($simulationEvent->status !== 'published') {
            return back()->with('status', 'This event is not open for registration.');
        }

        // Check if self-registration is enabled
        if (!$simulationEvent->self_registration_enabled) {
            return back()->with('status', 'Self-registration is not allowed for this event.');
        }

        // Check if already registered
        if ($simulationEvent->registrations()->where('user_id', $user->id)->exists()) {
            return back()->with('status', 'You are already registered for this event.');
        }

        // Check max participants (only count approved registrations)
        if ($simulationEvent->max_participants) {
            $currentCount = $simulationEvent->registrations()->where('status', 'approved')->count();
            if ($currentCount >= $simulationEvent->max_participants) {
                return back()->with('status', 'This event has reached maximum capacity.');
            }
        }

        // Determine registration status based on GLOBAL auto-approval setting
        $autoApprovalEnabled = \App\Models\Setting::get('event_auto_approval_enabled', false);
        $status = $autoApprovalEnabled ? 'approved' : 'pending';
        $approvedAt = $autoApprovalEnabled ? now() : null;

        // Create registration
        $simulationEvent->registrations()->create([
            'user_id' => $user->id,
            'status' => $status,
            'registered_at' => now(),
            'approved_at' => $approvedAt,
        ]);

        // Return appropriate message based on approval setting
        if ($autoApprovalEnabled) {
            return back()->with('status', '✅ You are successfully registered for this simulation event!');
        } else {
            return back()->with('status', '⏳ Registration submitted successfully. Your registration is pending admin approval.');
        }
    }

    /**
     * Cancel participant registration
     */
    public function cancelRegistration(Request $request, SimulationEvent $simulationEvent)
    {
        $user = Auth::user();

        // Only participants can cancel their registration
        if (!$user || $user->role !== 'PARTICIPANT') {
            abort(403);
        }

        $registration = $simulationEvent->registrations()
            ->where('user_id', $user->id)
            ->whereIn('status', ['pending', 'approved'])
            ->first();

        if (!$registration) {
            return back()->with('status', 'No active registration found.');
        }

        // Update registration status
        $registration->update([
            'status' => 'cancelled',
        ]);

        return back()->with('status', 'Registration cancelled successfully.');
    }

    /**
     * Auto-assign resources to event when published
     */
    protected function autoAssignResources(SimulationEvent $event)
    {
        $event->load('resources');
        
        foreach ($event->resources as $resource) {
            $quantityNeeded = $resource->pivot->quantity_needed;
            
            // Check if resource has enough available quantity
            if ($resource->available >= $quantityNeeded) {
                // Assign the resource
                $success = $resource->assignToEvent($event, $quantityNeeded);
                
                if ($success) {
                    // Update pivot table
                    $event->resources()->updateExistingPivot($resource->id, [
                        'quantity_assigned' => $quantityNeeded,
                        'status' => 'Assigned',
                    ]);
                }
            } else {
                // Mark as partially assigned or insufficient
                $event->resources()->updateExistingPivot($resource->id, [
                    'quantity_assigned' => 0,
                    'status' => 'Insufficient',
                    'notes' => "Not enough available. Needed: {$quantityNeeded}, Available: {$resource->available}",
                ]);
            }
        }
    }
}
