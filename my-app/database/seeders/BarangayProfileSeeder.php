<?php

namespace Database\Seeders;

use App\Models\BarangayHazard;
use App\Models\BarangayProfile;
use App\Models\PhilippineBarangay;
use Illuminate\Database\Seeder;

class BarangayProfileSeeder extends Seeder
{
    public function run(): void
    {
        $profiles = [
            [
                'location_name' => 'Commonwealth',
                'contact_number' => '+63 2 1234 5678',
                'email_address' => 'commonwealth.brgy@example.gov.ph',
                'area_classification' => 'Urban',
                'hazard_notes' => 'Flood-prone areas along creeks; high-density residential zones.',
                'hazards' => [
                    ['type' => 'Flood', 'level' => 'High', 'score' => 85, 'agency' => 'MDRRMO', 'description' => 'Low-lying zones flood during habagat and typhoon season.'],
                    ['type' => 'Fire', 'level' => 'Moderate', 'score' => 55, 'agency' => 'BFP', 'description' => 'Dense residential blocks with informal electrical connections.'],
                ],
            ],
            [
                'location_name' => 'Batasan Hills',
                'contact_number' => '+63 2 2345 6789',
                'email_address' => 'batasan.brgy@example.gov.ph',
                'area_classification' => 'Urban',
                'hazard_notes' => 'Steep slopes in some areas; monitor rainfall during monsoon season.',
                'hazards' => [
                    ['type' => 'Flood', 'level' => 'Moderate', 'score' => 60, 'agency' => 'MDRRMO', 'description' => 'Creek overflow risk in southern sections.'],
                    ['type' => 'Landslide', 'level' => 'High', 'score' => 78, 'agency' => 'DENR-MGB', 'description' => 'Steep hillside communities require evacuation protocols.'],
                ],
            ],
            [
                'location_name' => 'Bagong Silangan',
                'contact_number' => '+63 2 3456 7890',
                'email_address' => 'bagongsilangan.brgy@example.gov.ph',
                'area_classification' => 'Urban',
                'hazard_notes' => 'Near fault line; ensure earthquake preparedness drills are regular.',
                'hazards' => [
                    ['type' => 'Flood', 'level' => 'Moderate', 'score' => 52, 'agency' => 'PAGASA', 'description' => 'Seasonal flooding in waterways.'],
                    ['type' => 'Earthquake', 'level' => 'High', 'score' => 88, 'agency' => 'PHIVOLCS', 'description' => 'Proximity to active fault segments increases seismic risk.'],
                    ['type' => 'Fire', 'level' => 'Moderate', 'score' => 48, 'agency' => 'BFP', 'description' => 'Informal settlement fire spread risk.'],
                ],
            ],
        ];

        foreach ($profiles as $profileData) {
            $hazardRows = $profileData['hazards'];
            unset($profileData['hazards']);

            $philippineBarangay = PhilippineBarangay::where('name', $profileData['location_name'])->first();
            unset($profileData['location_name']);

            if (! $philippineBarangay) {
                continue;
            }

            $location = $philippineBarangay->toLocationArray();
            $profileData = array_merge($profileData, $location, [
                'philippine_barangay_id' => $philippineBarangay->id,
            ]);

            $profileData['hazards'] = collect($hazardRows)->pluck('type')->all();
            $profileData['last_assessed_at'] = now();

            $profile = BarangayProfile::updateOrCreate(
                ['philippine_barangay_id' => $philippineBarangay->id],
                $profileData,
            );

            $profile->hazardRecords()->delete();

            foreach ($hazardRows as $hazard) {
                BarangayHazard::create([
                    'barangay_profile_id' => $profile->id,
                    'hazard_type' => $hazard['type'],
                    'risk_level' => $hazard['level'],
                    'risk_score' => $hazard['score'],
                    'description' => $hazard['description'],
                    'source_agency' => $hazard['agency'],
                    'date_assessed' => now()->toDateString(),
                ]);
            }
        }
    }
}
