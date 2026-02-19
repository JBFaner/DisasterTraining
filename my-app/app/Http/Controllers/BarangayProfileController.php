<?php

namespace App\Http\Controllers;

use App\Models\BarangayProfile;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class BarangayProfileController extends Controller
{
    /**
     * Display list of barangay profiles (table with Create button and search).
     */
    public function index(Request $request)
    {
        $this->authorizeAdmin();

        $query = BarangayProfile::query()->orderBy('barangay_name');

        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('barangay_name', 'like', '%' . $search . '%')
                    ->orWhere('municipality_city', 'like', '%' . $search . '%')
                    ->orWhere('province', 'like', '%' . $search . '%');
            });
        }

        $barangayProfiles = $query->get();

        return view('app', [
            'section' => 'barangay_profile',
            'barangay_profiles' => $barangayProfiles,
        ]);
    }

    /**
     * Show the form for creating a new barangay profile.
     */
    public function create()
    {
        $this->authorizeAdmin();

        return view('app', [
            'section' => 'barangay_profile_create',
        ]);
    }

    /**
     * Store a newly created barangay profile.
     */
    public function store(Request $request)
    {
        $this->authorizeAdmin();

        $data = $request->validate([
            'barangay_name' => ['required', 'string', 'max:255'],
            'municipality_city' => ['required', 'string', 'max:255'],
            'province' => ['required', 'string', 'max:255'],
            'barangay_address' => ['nullable', 'string'],
            'hazards' => ['nullable', 'array'],
            'hazards.*' => ['string'],
        ]);

        if (isset($data['hazards'])) {
            $data['hazards'] = array_values(array_filter($data['hazards']));
            if (empty($data['hazards'])) {
                $data['hazards'] = null;
            }
        }

        BarangayProfile::create($data);

        return redirect()->route('barangay.profile')
            ->with('status', 'Barangay profile created successfully.');
    }

    /**
     * Display the specified barangay profile (view all details including address).
     */
    public function show(BarangayProfile $barangayProfile)
    {
        $this->authorizeAdmin();

        return view('app', [
            'section' => 'barangay_profile_show',
            'barangay_profile' => $barangayProfile,
        ]);
    }

    /**
     * Show the form for editing the specified barangay profile.
     */
    public function edit(BarangayProfile $barangayProfile)
    {
        $this->authorizeAdmin();

        return view('app', [
            'section' => 'barangay_profile_edit',
            'barangay_profile' => $barangayProfile,
        ]);
    }

    /**
     * Update the specified barangay profile.
     */
    public function update(Request $request, BarangayProfile $barangayProfile)
    {
        $this->authorizeAdmin();

        $data = $request->validate([
            'barangay_name' => ['required', 'string', 'max:255'],
            'municipality_city' => ['required', 'string', 'max:255'],
            'province' => ['required', 'string', 'max:255'],
            'barangay_address' => ['nullable', 'string'],
            'hazards' => ['nullable', 'array'],
            'hazards.*' => ['string'],
        ]);

        if (isset($data['hazards'])) {
            $data['hazards'] = array_values(array_filter($data['hazards']));
            if (empty($data['hazards'])) {
                $data['hazards'] = null;
            }
        }

        $barangayProfile->update($data);

        return redirect()->route('barangay.profile')
            ->with('status', 'Barangay profile updated successfully.');
    }

    /**
     * Remove the specified barangay profile.
     */
    public function destroy(BarangayProfile $barangayProfile)
    {
        $this->authorizeAdmin();

        $barangayProfile->delete();

        return redirect()->route('barangay.profile')
            ->with('status', 'Barangay profile deleted.');
    }

    protected function authorizeAdmin(): void
    {
        $user = Auth::user();

        if (!$user || $user->role !== 'LGU_ADMIN') {
            abort(403, 'Unauthorized. Only Admin can access this module.');
        }
    }
}
