<?php

namespace Database\Seeders;

use App\Models\BarangayProfile;
use Illuminate\Database\Seeder;

class BarangayProfileSeeder extends Seeder
{
    public function run(): void
    {
        $profiles = [
            [
                'barangay_name' => 'Barangay Commonwealth',
                'municipality_city' => 'Quezon City',
                'province' => 'Metro Manila',
                'barangay_address' => 'Commonwealth Avenue, Quezon City',
                'contact_number' => '+63 2 1234 5678',
                'email_address' => 'commonwealth.brgy@example.gov.ph',
                'estimated_population' => 190000,
                'area_classification' => 'Urban',
                'hazards' => ['Flood', 'Fire'],
                'hazard_notes' => 'Flood-prone areas along creeks; high-density residential zones.',
            ],
            [
                'barangay_name' => 'Barangay Batasan Hills',
                'municipality_city' => 'Quezon City',
                'province' => 'Metro Manila',
                'barangay_address' => 'Batasan Road, Quezon City',
                'contact_number' => '+63 2 2345 6789',
                'email_address' => 'batasan.brgy@example.gov.ph',
                'estimated_population' => 150000,
                'area_classification' => 'Urban',
                'hazards' => ['Flood', 'Landslide'],
                'hazard_notes' => 'Steep slopes in some areas; monitor rainfall during monsoon season.',
            ],
            [
                'barangay_name' => 'Barangay Bagong Silangan',
                'municipality_city' => 'Quezon City',
                'province' => 'Metro Manila',
                'barangay_address' => 'Bagong Silangan Road, Quezon City',
                'contact_number' => '+63 2 3456 7890',
                'email_address' => 'bagongsilangan.brgy@example.gov.ph',
                'estimated_population' => 80000,
                'area_classification' => 'Urban',
                'hazards' => ['Flood', 'Earthquake'],
                'hazard_notes' => 'Near fault line; ensure earthquake preparedness drills are regular.',
            ],
        ];

        foreach ($profiles as $profile) {
            BarangayProfile::firstOrCreate(
                [
                    'barangay_name' => $profile['barangay_name'],
                    'municipality_city' => $profile['municipality_city'],
                ],
                $profile
            );
        }
    }
}

