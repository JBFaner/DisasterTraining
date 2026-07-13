<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SimulationExerciseTemplate extends Model
{
    public const STATUS_DRAFT = 'draft';

    public const STATUS_PUBLISHED = 'published';

    public const STATUS_ARCHIVED = 'archived';

    public const CATEGORIES = [
        'Fire Safety',
        'Earthquake',
        'Flood',
        'Typhoon',
        'Landslide',
        'First Aid',
        'Rescue',
        'Multi-Hazard',
    ];

    public const EXERCISE_TYPES = [
        'Drill',
        'Functional Exercise',
        'Full Scale Exercise',
    ];

    public const DIFFICULTY_LEVELS = [
        'Easy',
        'Intermediate',
        'Advanced',
    ];

    /** @var list<string> */
    public const PERSONNEL_ROLES = [
        'Lead Trainer',
        'Assistant Trainer',
        'Safety Officer',
        'Marshal',
        'Medical Team',
        'Evaluator',
        'Communication Officer',
    ];

    protected $fillable = [
        'title',
        'category',
        'exercise_type',
        'difficulty_level',
        'estimated_duration_minutes',
        'objectives',
        'scenario_summary',
        'expected_hazards',
        'learning_objectives',
        'safety_reminders',
        'status',
        'created_by_id',
        'updated_by_id',
    ];

    protected $casts = [
        'estimated_duration_minutes' => 'integer',
    ];

    public function activities(): HasMany
    {
        return $this->hasMany(SimulationExerciseActivity::class, 'template_id')->orderBy('sort_order');
    }

    public function equipment(): HasMany
    {
        return $this->hasMany(SimulationExerciseActivityEquipment::class, 'template_id')->orderBy('sort_order');
    }

    public function personnel(): HasMany
    {
        return $this->hasMany(SimulationExercisePersonnel::class, 'template_id')->orderBy('sort_order');
    }

    public function personnelAssignments(): HasMany
    {
        return $this->hasMany(SimulationExercisePersonnelAssignment::class, 'template_id')->orderBy('sort_order');
    }

    public function timelineItems(): HasMany
    {
        return $this->hasMany(SimulationExerciseTimelineItem::class, 'template_id')->orderBy('sort_order');
    }

    public function evaluationObjectives(): HasMany
    {
        return $this->hasMany(SimulationExerciseEvaluationObjective::class, 'template_id')->orderBy('sort_order');
    }

    public function events(): HasMany
    {
        return $this->hasMany(SimulationEvent::class, 'simulation_exercise_template_id');
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
