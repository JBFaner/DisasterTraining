<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SimulationEvent extends Model
{
    protected $fillable = [
        'title',
        'disaster_type',
        'description',
        'event_category',
        'status',
        'event_date',
        'start_time',
        'end_time',
        'is_recurring',
        'recurrence_pattern',
        'location',
        'building',
        'room_zone',
        'location_notes',
        'accessibility_notes',
        'exits',
        'hazard_zones',
        'assembly_points',
        'is_high_risk_location',
        'scenario_id',
        'scenario_is_required',
        'training_module_id',
        'campaign_request_id',
        'simulation_exercise_template_id',
        'barangay_profile_id',
        'facilitators',
        'assigned_trainer_id',
        'allowed_participant_types',
        'target_audience',
        'max_participants',
        'registration_deadline',
        'venue',
        'self_registration_enabled',
        'approval_required',
        'qr_code_enabled',
        'attendance_code',
        'reserved_resources',
        'safety_guidelines',
        'hazard_warnings',
        'required_ppe',
        'event_phases',
        'inject_triggers',
        'facilitator_instructions',
        'email_notifications_enabled',
        'sms_notifications_enabled',
        'notification_schedule',
        'created_by',
        'updated_by',
        'published_at',
        'completed_at',
        'actual_start_time',
        'started_by',
        'readiness_confirmations',
        'event_personnel_assignments',
        'execution_progress',
        'timeline_entries',
        'post_evaluation',
    ];

    protected $casts = [
        'event_date' => 'date',
        'registration_deadline' => 'datetime',
        'is_recurring' => 'boolean',
        'is_high_risk_location' => 'boolean',
        'scenario_is_required' => 'boolean',
        'self_registration_enabled' => 'boolean',
        'approval_required' => 'boolean',
        'qr_code_enabled' => 'boolean',
        'email_notifications_enabled' => 'boolean',
        'sms_notifications_enabled' => 'boolean',
        'facilitators' => 'array',
        'allowed_participant_types' => 'array',
        'reserved_resources' => 'array',
        'event_phases' => 'array',
        'inject_triggers' => 'array',
        'notification_schedule' => 'array',
        'published_at' => 'datetime',
        'completed_at' => 'datetime',
        'actual_start_time' => 'datetime',
        'readiness_confirmations' => 'array',
        'event_personnel_assignments' => 'array',
        'execution_progress' => 'array',
        'timeline_entries' => 'array',
        'post_evaluation' => 'array',
    ];

    public function assignedTrainer()
    {
        return $this->belongsTo(QualifiedTrainer::class, 'assigned_trainer_id');
    }

    public function trainingModule()
    {
        return $this->belongsTo(TrainingModule::class);
    }

    public function campaignRequest()
    {
        return $this->belongsTo(CampaignRequest::class);
    }

    public function simulationExerciseTemplate()
    {
        return $this->belongsTo(SimulationExerciseTemplate::class);
    }

    public function barangayProfile()
    {
        return $this->belongsTo(BarangayProfile::class, 'barangay_profile_id');
    }

    public function scenario()
    {
        return $this->belongsTo(Scenario::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updater()
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    public function registrations()
    {
        return $this->hasMany(EventRegistration::class);
    }

    public function attendances()
    {
        return $this->hasMany(Attendance::class);
    }

    public function resources()
    {
        return $this->belongsToMany(Resource::class, 'event_resource')
                    ->withPivot('quantity_needed', 'quantity_assigned', 'status', 'notes')
                    ->withTimestamps();
    }

    public function assignedResources()
    {
        return $this->hasMany(ResourceEventAssignment::class, 'event_id');
    }

    public function approvedRegistrations()
    {
        return $this->registrations()->where('status', 'approved');
    }

    public function registeredParticipantsCount()
    {
        return $this->approvedRegistrations()->count();
    }

    public function isRegistrationFull()
    {
        if (!$this->max_participants) {
            return false;
        }
        return $this->registeredParticipantsCount() >= $this->max_participants;
    }

    public function evaluation()
    {
        return $this->hasOne(Evaluation::class, 'simulation_event_id');
    }

    /**
     * Mark published events whose scheduled date has already passed and
     * which never actually started as "ended".
     *
     * This is used so that long-forgotten published events don't remain
     * in a published state forever and can be treated like completed
     * events for resource return workflows.
     */
    public static function autoEndPastUnstartedEvents(?int $userId = null): void
    {
        $now = now();

        $candidates = static::where('status', 'published')
            ->whereNull('actual_start_time')
            ->whereDate('event_date', '<=', $now->toDateString())
            ->get(['id', 'event_date', 'end_time']);

        foreach ($candidates as $event) {
            // If event date is before today, it is definitely ended.
            if ($event->event_date && $event->event_date->lt($now->copy()->startOfDay())) {
                $event->update([
                    'status' => 'ended',
                    'updated_by' => $userId,
                ]);
                continue;
            }

            // Same-day: end only if we can parse end_time and current time is past it.
            if (! $event->event_date || ! $event->end_time) {
                continue;
            }

            try {
                [$endHour, $endMinute] = explode(':', $event->end_time);
                $endDateTime = $event->event_date->copy()->setTime((int) $endHour, (int) $endMinute, 0);

                if ($now->gt($endDateTime)) {
                    $event->update([
                        'status' => 'ended',
                        'updated_by' => $userId,
                    ]);
                }
            } catch (\Throwable $e) {
                // Skip invalid end_time formats; keep stored status.
                continue;
            }
        }
    }
}
