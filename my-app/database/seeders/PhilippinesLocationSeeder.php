<?php

namespace Database\Seeders;

use App\Models\PhilippineBarangay;
use App\Models\PhilippineCity;
use App\Models\PhilippineProvince;
use App\Models\PhilippineRegion;
use Illuminate\Database\Seeder;

class PhilippinesLocationSeeder extends Seeder
{
    public function run(): void
    {
        $data = require database_path('seeders/data/philippines_locations.php');

        foreach ($data['regions'] as $region) {
            PhilippineRegion::updateOrCreate(
                ['psgc_code' => $region['psgc_code']],
                ['name' => $region['name']],
            );
        }

        foreach ($data['provinces'] as $province) {
            $region = PhilippineRegion::where('psgc_code', $province['region_code'])->first();
            if (! $region) {
                continue;
            }

            PhilippineProvince::updateOrCreate(
                ['psgc_code' => $province['psgc_code']],
                ['region_id' => $region->id, 'name' => $province['name']],
            );
        }

        foreach ($data['cities'] as $city) {
            $region = PhilippineRegion::where('psgc_code', $city['region_code'])->first();
            if (! $region) {
                continue;
            }

            $province = null;
            if (! empty($city['province_code'])) {
                $province = PhilippineProvince::where('psgc_code', $city['province_code'])->first();
            }

            PhilippineCity::updateOrCreate(
                ['psgc_code' => $city['psgc_code']],
                [
                    'region_id' => $region->id,
                    'province_id' => $province?->id,
                    'name' => $city['name'],
                    'type' => $city['type'] ?? 'city',
                ],
            );
        }

        foreach ($data['barangays'] as $barangay) {
            $city = PhilippineCity::where('psgc_code', $barangay['city_code'])->first();
            if (! $city) {
                continue;
            }

            PhilippineBarangay::updateOrCreate(
                ['psgc_code' => $barangay['psgc_code']],
                ['city_id' => $city->id, 'name' => $barangay['name']],
            );
        }

        $validBarangayCodes = collect($data['barangays'])->pluck('psgc_code');
        PhilippineBarangay::whereNotIn('psgc_code', $validBarangayCodes)->delete();

        $validCityCodes = collect($data['cities'])->pluck('psgc_code');
        PhilippineCity::whereNotIn('psgc_code', $validCityCodes)->delete();

        $validProvinceCodes = collect($data['provinces'])->pluck('psgc_code');
        PhilippineProvince::whereNotIn('psgc_code', $validProvinceCodes)->delete();

        $validRegionCodes = collect($data['regions'])->pluck('psgc_code');
        PhilippineRegion::whereNotIn('psgc_code', $validRegionCodes)->delete();
    }
}
