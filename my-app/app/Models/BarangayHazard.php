<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BarangayHazard extends Model
{
    protected $fillable = [
        'barangay_profile_id',
        'hazard_type',
        'risk_level',
        'risk_score',
        'description',
        'source_agency',
        'source_reference_number',
        'date_assessed',
        'external_source_id',
        'metadata',
    ];

    protected function casts(): array
    {
        return [
            'risk_score' => 'integer',
            'date_assessed' => 'date',
            'metadata' => 'array',
        ];
    }

    public function barangayProfile(): BelongsTo
    {
        return $this->belongsTo(BarangayProfile::class);
    }

    public function sourceAgencyLabel(): string
    {
        return config("hazard_assessment.source_agency_labels.{$this->source_agency}", $this->source_agency);
    }

    public function riskLevelOrder(): int
    {
        return match ($this->risk_level) {
            'Very High' => 4,
            'High' => 3,
            'Moderate' => 2,
            default => 1,
        };
    }
}
