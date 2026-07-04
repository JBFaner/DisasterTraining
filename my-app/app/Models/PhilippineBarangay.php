<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class PhilippineBarangay extends Model
{
    protected $fillable = ['city_id', 'psgc_code', 'name'];

    public function city(): BelongsTo
    {
        return $this->belongsTo(PhilippineCity::class, 'city_id');
    }

    public function hazardProfile(): HasOne
    {
        return $this->hasOne(BarangayProfile::class, 'philippine_barangay_id');
    }

    /**
     * @return array{region: string, province: string, municipality_city: string, barangay_name: string, barangay_address: string}
     */
    public function toLocationArray(): array
    {
        $this->loadMissing(['city.region', 'city.province']);

        $city = $this->city;
        $province = $city?->province?->name ?? $city?->region?->name ?? '';
        $region = $city?->region?->name ?? '';

        return [
            'region' => $region,
            'province' => $province,
            'municipality_city' => $city?->name ?? '',
            'barangay_name' => $this->name,
            'barangay_address' => trim("{$this->name}, {$city?->name}, {$province}"),
        ];
    }
}
