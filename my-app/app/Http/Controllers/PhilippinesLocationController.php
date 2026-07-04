<?php

namespace App\Http\Controllers;

use App\Models\PhilippineBarangay;
use App\Models\PhilippineCity;
use App\Models\PhilippineProvince;
use App\Models\PhilippineRegion;
use Illuminate\Http\Request;

class PhilippinesLocationController extends Controller
{
    public function regions()
    {
        return response()->json([
            'regions' => PhilippineRegion::orderBy('name')->get(['id', 'name', 'psgc_code']),
        ]);
    }

    public function provinces(Request $request)
    {
        $request->validate(['region_id' => ['required', 'integer', 'exists:philippine_regions,id']]);

        $provinces = PhilippineProvince::query()
            ->where('region_id', $request->integer('region_id'))
            ->orderBy('name')
            ->get(['id', 'name', 'psgc_code', 'region_id']);

        return response()->json(['provinces' => $provinces]);
    }

    public function cities(Request $request)
    {
        $request->validate([
            'region_id' => ['nullable', 'integer', 'exists:philippine_regions,id'],
            'province_id' => ['nullable', 'integer', 'exists:philippine_provinces,id'],
        ]);

        $query = PhilippineCity::query()->orderBy('name');

        if ($request->filled('province_id')) {
            $query->where('province_id', $request->integer('province_id'));
        } elseif ($request->filled('region_id')) {
            $query->where('region_id', $request->integer('region_id'));
        } else {
            return response()->json(['cities' => []]);
        }

        return response()->json([
            'cities' => $query->get(['id', 'name', 'psgc_code', 'region_id', 'province_id', 'type']),
        ]);
    }

    public function barangays(Request $request)
    {
        $request->validate(['city_id' => ['required', 'integer', 'exists:philippine_cities,id']]);

        $barangays = PhilippineBarangay::query()
            ->where('city_id', $request->integer('city_id'))
            ->orderBy('name')
            ->get(['id', 'name', 'psgc_code', 'city_id']);

        return response()->json(['barangays' => $barangays]);
    }

    public function resolve(Request $request)
    {
        $request->validate(['barangay_id' => ['required', 'integer', 'exists:philippine_barangays,id']]);

        $barangay = PhilippineBarangay::with(['city.region', 'city.province', 'hazardProfile'])
            ->findOrFail($request->integer('barangay_id'));

        $location = $barangay->toLocationArray();

        return response()->json([
            'location' => $location,
            'region_id' => $barangay->city?->region_id,
            'province_id' => $barangay->city?->province_id,
            'city_id' => $barangay->city_id,
            'barangay_id' => $barangay->id,
            'hazard_profile_id' => $barangay->hazardProfile?->id,
        ]);
    }
}
