<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class BarangayProfile extends Model
{
    use HasFactory;

    protected $fillable = [
        'philippine_barangay_id',
        'barangay_name',
        'municipality_city',
        'province',
        'region',
        'barangay_address',
        'contact_number',
        'email_address',
        'estimated_population',
        'total_land_area',
        'number_of_households',
        'area_classification',
        'hazards',
        'hazard_notes',
        'external_source_id',
        'last_assessed_at',
    ];

    protected $casts = [
        'hazards' => 'array',
        'estimated_population' => 'integer',
        'number_of_households' => 'integer',
        'total_land_area' => 'decimal:2',
        'last_assessed_at' => 'datetime',
    ];

    protected $appends = [
        'highest_risk_hazard',
        'highest_risk_level',
        'highest_risk_score',
        'highest_risk_source_agency',
    ];

    public function hazardRecords(): HasMany
    {
        return $this->hasMany(BarangayHazard::class)->orderByDesc('risk_score');
    }

    public function documents(): HasMany
    {
        return $this->hasMany(HazardAssessmentDocument::class)->latest();
    }

    public function simulationEvents(): HasMany
    {
        return $this->hasMany(SimulationEvent::class, 'barangay_profile_id');
    }

    public function philippineBarangay(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(PhilippineBarangay::class, 'philippine_barangay_id');
    }

    public function syncLocationFromPhilippineBarangay(?PhilippineBarangay $barangay): void
    {
        if (! $barangay) {
            return;
        }

        $location = $barangay->toLocationArray();
        $this->fill([
            'philippine_barangay_id' => $barangay->id,
            'barangay_name' => $location['barangay_name'],
            'municipality_city' => $location['municipality_city'],
            'province' => $location['province'],
            'region' => $location['region'],
            'barangay_address' => $location['barangay_address'],
        ]);
    }

    public function getHighestRiskHazardAttribute(): ?string
    {
        $hazard = $this->resolveHighestRiskRecord();

        return $hazard?->hazard_type;
    }

    public function getHighestRiskLevelAttribute(): ?string
    {
        $hazard = $this->resolveHighestRiskRecord();

        return $hazard?->risk_level;
    }

    public function getHighestRiskScoreAttribute(): ?int
    {
        $hazard = $this->resolveHighestRiskRecord();

        return $hazard?->risk_score;
    }

    public function getHighestRiskSourceAgencyAttribute(): ?string
    {
        $hazard = $this->resolveHighestRiskRecord();

        return $hazard?->source_agency;
    }

    public function resolveHighestRiskRecord(): ?BarangayHazard
    {
        if ($this->relationLoaded('hazardRecords')) {
            return $this->hazardRecords->sortByDesc('risk_score')->first();
        }

        return $this->hazardRecords()->orderByDesc('risk_score')->first();
    }

    public function hazardTypes(): array
    {
        if ($this->relationLoaded('hazardRecords')) {
            return $this->hazardRecords->pluck('hazard_type')->unique()->values()->all();
        }

        return $this->hazardRecords()->pluck('hazard_type')->unique()->values()->all();
    }

    public function toHazardIntelligenceArray(): array
    {
        $this->loadMissing(['hazardRecords', 'documents']);

        return [
            'id' => $this->id,
            'barangay_name' => $this->barangay_name,
            'municipality_city' => $this->municipality_city,
            'province' => $this->province,
            'region' => $this->region,
            'barangay_address' => $this->barangay_address,
            'last_assessed_at' => $this->last_assessed_at,
            'highest_risk_hazard' => $this->highest_risk_hazard,
            'highest_risk_level' => $this->highest_risk_level,
            'highest_risk_score' => $this->highest_risk_score,
            'highest_risk_source_agency' => $this->highest_risk_source_agency,
            'hazard_types' => $this->hazardTypes(),
            'source_agencies' => $this->hazardRecords->pluck('source_agency')->unique()->values()->all(),
            'hazards' => $this->hazardRecords->map(fn (BarangayHazard $h) => [
                'id' => $h->id,
                'hazard_type' => $h->hazard_type,
                'risk_level' => $h->risk_level,
                'risk_score' => $h->risk_score,
                'description' => $h->description,
                'source_agency' => $h->source_agency,
                'source_agency_label' => $h->sourceAgencyLabel(),
                'date_assessed' => $h->date_assessed,
                'last_updated' => $h->updated_at,
            ])->values(),
        ];
    }
}
