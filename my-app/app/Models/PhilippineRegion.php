<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PhilippineRegion extends Model
{
    protected $fillable = ['psgc_code', 'name'];

    public function provinces(): HasMany
    {
        return $this->hasMany(PhilippineProvince::class, 'region_id')->orderBy('name');
    }

    public function cities(): HasMany
    {
        return $this->hasMany(PhilippineCity::class, 'region_id')->orderBy('name');
    }
}
