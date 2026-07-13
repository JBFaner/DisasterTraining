<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SimulationPlan extends Model
{
    protected $fillable = [
        'campaign_request_id',
        'exercise_type',
        'exercise_complexity',
        'estimated_duration',
        'estimated_responders',
        'estimated_observers',
        'estimated_evaluators',
        'simulation_title',
        'simulation_scenario',
        'simulation_objectives',
        'simulation_description',
        'event_date',
        'start_time',
        'end_time',
        'venue',
        'team_assignments',
        'lead_coordinator',
        'planning_officer',
        'medical_team',
        'rescue_team',
        'communication_team',
        'team_leader',
        'required_equipment',
        'required_resources',
        'safety_officer',
        'assembly_area',
        'evacuation_route',
        'evaluation_criteria',
        'emergency_contact_person',
        'remarks',
        'additional_notes',
        'status',
        'created_by_id',
        'updated_by_id',
    ];

    protected $casts = [
        'team_assignments' => 'array',
        'event_date' => 'date',
        'estimated_responders' => 'integer',
        'estimated_observers' => 'integer',
        'estimated_evaluators' => 'integer',
    ];

    public function campaignRequest(): BelongsTo
    {
        return $this->belongsTo(CampaignRequest::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_id');
    }

    public function updatedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by_id');
    }
}
