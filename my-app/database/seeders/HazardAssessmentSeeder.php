<?php

namespace Database\Seeders;

use App\Models\BarangayHazard;
use App\Models\BarangayProfile;
use App\Models\HazardAssessmentDocument;
use App\Models\PhilippineBarangay;
use App\Models\SimulationEvent;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class HazardAssessmentSeeder extends Seeder
{
    public function run(): void
    {
        if (PhilippineBarangay::count() === 0) {
            $this->call(PhilippinesLocationSeeder::class);
        }

        $uploader = User::whereIn('role', ['LGU_ADMIN', 'LGU_TRAINER'])->first();

        $profiles = [
            [
                'location_name' => 'Commonwealth',
                'profile' => [
                    'contact_number' => '+63 2 1234 5678',
                    'email_address' => 'commonwealth.brgy@example.gov.ph',
                    'estimated_population' => 190000,
                    'total_land_area' => 12.48,
                    'number_of_households' => 42150,
                    'area_classification' => 'Urban',
                    'hazard_notes' => 'Flood-prone areas along creeks; high-density residential zones near Commonwealth Avenue.',
                    'external_source_id' => 'HAZ-QC-COMMONWEALTH-2026',
                    'last_assessed_at' => now()->subMonths(2),
                ],
                'hazards' => [
                    [
                        'type' => 'Flood',
                        'level' => 'High',
                        'score' => 85,
                        'agency' => 'MDRRMO',
                        'reference' => 'QC-FLD-2026-014',
                        'description' => 'Low-lying zones along waterways flood during habagat and intense typhoon rainfall.',
                        'assessed_days_ago' => 45,
                    ],
                    [
                        'type' => 'Fire',
                        'level' => 'Moderate',
                        'score' => 55,
                        'agency' => 'BFP',
                        'reference' => 'BFP-QC-FIRE-088',
                        'description' => 'Dense residential blocks with informal electrical connections increase structural fire spread risk.',
                        'assessed_days_ago' => 60,
                    ],
                    [
                        'type' => 'Typhoon',
                        'level' => 'Moderate',
                        'score' => 58,
                        'agency' => 'PAGASA',
                        'reference' => 'PAGASA-WIND-2026-03',
                        'description' => 'Strong winds can topple billboards and damage informal structures along major roads.',
                        'assessed_days_ago' => 30,
                    ],
                ],
                'documents' => [
                    [
                        'document_type' => 'Flood Hazard Map',
                        'filename' => 'commonwealth-flood-hazard-map.txt',
                        'content' => "Commonwealth Barangay Flood Hazard Map (Seeded Sample)\n\nHigh-risk zones: creek-adjacent sitios, underpass catchments, and low-lying pockets near Commonwealth Avenue service roads.\n\nRecommended action: pre-position sandbags before habagat season and activate barangay flood monitors.",
                    ],
                    [
                        'document_type' => 'Hazard Assessment Report',
                        'filename' => 'commonwealth-hazard-assessment-2026.txt',
                        'content' => "Barangay Commonwealth Hazard Assessment Report (2026)\n\nPrepared by: Quezon City MDRRMO\n\nPrimary hazards: Flood (High), Fire (Moderate), Typhoon (Moderate).\n\nPopulation exposed in flood zones: approx. 28,000 residents.",
                    ],
                ],
            ],
            [
                'location_name' => 'Batasan Hills',
                'profile' => [
                    'contact_number' => '+63 2 2345 6789',
                    'email_address' => 'batasan.brgy@example.gov.ph',
                    'estimated_population' => 150000,
                    'total_land_area' => 8.20,
                    'number_of_households' => 33200,
                    'area_classification' => 'Urban',
                    'hazard_notes' => 'Steep slopes in hillside sections; monitor rainfall during monsoon season and after prolonged downpours.',
                    'external_source_id' => 'HAZ-QC-BATASAN-2026',
                    'last_assessed_at' => now()->subMonths(3),
                ],
                'hazards' => [
                    [
                        'type' => 'Landslide',
                        'level' => 'High',
                        'score' => 78,
                        'agency' => 'DENR-MGB',
                        'reference' => 'MGB-QC-LS-017',
                        'description' => 'Steep hillside communities require slope stabilization and rapid evacuation when soil saturation is high.',
                        'assessed_days_ago' => 50,
                    ],
                    [
                        'type' => 'Flood',
                        'level' => 'Moderate',
                        'score' => 60,
                        'agency' => 'MDRRMO',
                        'reference' => 'QC-FLD-2026-021',
                        'description' => 'Creek overflow risk in southern sections after sustained rainfall.',
                        'assessed_days_ago' => 40,
                    ],
                    [
                        'type' => 'Earthquake',
                        'level' => 'Moderate',
                        'score' => 62,
                        'agency' => 'PHIVOLCS',
                        'reference' => 'PHIVOLCS-QC-EQ-09',
                        'description' => 'Moderate ground shaking expected; hillside structures need structural integrity checks.',
                        'assessed_days_ago' => 90,
                    ],
                ],
                'documents' => [
                    [
                        'document_type' => 'Evacuation Map',
                        'filename' => 'batasan-hills-evacuation-routes.txt',
                        'content' => "Batasan Hills Evacuation Route Map (Seeded Sample)\n\nPrimary evacuation centers: covered court, elementary school gym, and Batasan multi-purpose hall.\n\nLandslide-prone ridges: follow ridge-line safe corridors marked in green on the official map.",
                    ],
                ],
            ],
            [
                'location_name' => 'Bagong Silangan',
                'profile' => [
                    'contact_number' => '+63 2 3456 7890',
                    'email_address' => 'bagongsilangan.brgy@example.gov.ph',
                    'estimated_population' => 80000,
                    'total_land_area' => 6.15,
                    'number_of_households' => 17850,
                    'area_classification' => 'Urban',
                    'hazard_notes' => 'Near active fault segments; ensure earthquake preparedness drills and fire safety inspections are regular.',
                    'external_source_id' => 'HAZ-QC-BAGONGSILANGAN-2026',
                    'last_assessed_at' => now()->subMonth(),
                ],
                'hazards' => [
                    [
                        'type' => 'Earthquake',
                        'level' => 'High',
                        'score' => 88,
                        'agency' => 'PHIVOLCS',
                        'reference' => 'PHIVOLCS-QC-EQ-04',
                        'description' => 'Proximity to the Valley Fault System increases seismic hazard for unreinforced residential structures.',
                        'assessed_days_ago' => 35,
                    ],
                    [
                        'type' => 'Flood',
                        'level' => 'Moderate',
                        'score' => 52,
                        'agency' => 'PAGASA',
                        'reference' => 'PAGASA-FLD-2026-11',
                        'description' => 'Seasonal flooding in waterways and low-lying access roads.',
                        'assessed_days_ago' => 25,
                    ],
                    [
                        'type' => 'Fire',
                        'level' => 'Moderate',
                        'score' => 48,
                        'agency' => 'BFP',
                        'reference' => 'BFP-QC-FIRE-041',
                        'description' => 'Informal settlement clusters have limited firebreak spacing and narrow access lanes.',
                        'assessed_days_ago' => 55,
                    ],
                ],
                'documents' => [
                    [
                        'document_type' => 'Disaster Risk Reduction Report',
                        'filename' => 'bagong-silangan-drr-report-2026.txt',
                        'content' => "Bagong Silangan DRR Report (2026)\n\nFocus: earthquake drill readiness, fire lane clearing, and flood early warning via barangay SMS chain.\n\nNext review date: December 2026.",
                    ],
                ],
            ],
            [
                'location_name' => 'Holy Spirit',
                'profile' => [
                    'contact_number' => '+63 2 4567 8901',
                    'email_address' => 'holyspirit.brgy@example.gov.ph',
                    'estimated_population' => 110500,
                    'total_land_area' => 9.75,
                    'number_of_households' => 24680,
                    'area_classification' => 'Urban',
                    'hazard_notes' => 'Mixed residential-commercial zones; prioritize fire code compliance in dense market areas.',
                    'external_source_id' => 'HAZ-QC-HOLYSPIRIT-2026',
                    'last_assessed_at' => now()->subWeeks(3),
                ],
                'hazards' => [
                    [
                        'type' => 'Fire',
                        'level' => 'High',
                        'score' => 72,
                        'agency' => 'BFP',
                        'reference' => 'BFP-QC-FIRE-112',
                        'description' => 'Market stalls and closely spaced housing elevate fire load and response difficulty.',
                        'assessed_days_ago' => 20,
                    ],
                    [
                        'type' => 'Typhoon',
                        'level' => 'Moderate',
                        'score' => 54,
                        'agency' => 'PAGASA',
                        'reference' => 'PAGASA-WIND-2026-07',
                        'description' => 'Roof damage and flying debris risk during signal #2 and above events.',
                        'assessed_days_ago' => 28,
                    ],
                    [
                        'type' => 'Earthquake',
                        'level' => 'Moderate',
                        'score' => 65,
                        'agency' => 'PHIVOLCS',
                        'reference' => 'PHIVOLCS-QC-EQ-12',
                        'description' => 'Moderate shaking may affect older commercial buildings near main roads.',
                        'assessed_days_ago' => 70,
                    ],
                ],
                'documents' => [
                    [
                        'document_type' => 'Fire Risk Assessment',
                        'filename' => 'holy-spirit-fire-risk-assessment.txt',
                        'content' => "Holy Spirit Fire Risk Assessment (Seeded Sample)\n\nHigh-risk nodes: public market, welding shops, and stacked residential alleys.\n\nMitigation: hydrant access clearing, BFP auxiliary training, and quarterly fire drills.",
                    ],
                ],
            ],
            [
                'location_name' => 'Fairview',
                'profile' => [
                    'contact_number' => '+63 2 5678 9012',
                    'email_address' => 'fairview.brgy@example.gov.ph',
                    'estimated_population' => 95000,
                    'total_land_area' => 7.40,
                    'number_of_households' => 21100,
                    'area_classification' => 'Urban',
                    'hazard_notes' => 'Flood-prone tributaries and liquefaction-susceptible soils in reclaimed sections.',
                    'external_source_id' => 'HAZ-QC-FAIRVIEW-2026',
                    'last_assessed_at' => now()->subWeeks(5),
                ],
                'hazards' => [
                    [
                        'type' => 'Flood',
                        'level' => 'High',
                        'score' => 80,
                        'agency' => 'MDRRMO',
                        'reference' => 'QC-FLD-2026-033',
                        'description' => 'Tributary overflow affects subdivisions and access roads during habagat and typhoon-enhanced rainfall events.',
                        'assessed_days_ago' => 18,
                    ],
                    [
                        'type' => 'Liquefaction',
                        'level' => 'Moderate',
                        'score' => 57,
                        'agency' => 'GeoRiskPH',
                        'reference' => 'GEO-QC-LIQ-05',
                        'description' => 'Saturated sandy soils may liquefy under strong earthquake shaking in select low-lying parcels.',
                        'assessed_days_ago' => 95,
                    ],
                    [
                        'type' => 'Typhoon',
                        'level' => 'Moderate',
                        'score' => 51,
                        'agency' => 'PAGASA',
                        'reference' => 'PAGASA-WIND-2026-02',
                        'description' => 'Tree fall and power line damage risk across residential subdivisions.',
                        'assessed_days_ago' => 32,
                    ],
                ],
                'documents' => [
                    [
                        'document_type' => 'Flood Hazard Map',
                        'filename' => 'fairview-flood-zones.txt',
                        'content' => "Fairview Flood Zone Map (Seeded Sample)\n\nZone A (red): creek buffers and underpass-adjacent streets.\nZone B (yellow): moderate ponding in subdivisions after 80mm+ rainfall.\n\nAssembly: barangay hall and nearby school grounds.",
                    ],
                ],
            ],
        ];

        $seededProfiles = [];

        foreach ($profiles as $entry) {
            $philippineBarangay = PhilippineBarangay::where('name', $entry['location_name'])->first();

            if (! $philippineBarangay) {
                $this->command?->warn("Skipping hazard profile for {$entry['location_name']}: barangay not found. Run PhilippinesLocationSeeder first.");

                continue;
            }

            $location = $philippineBarangay->toLocationArray();
            $hazardRows = $entry['hazards'];
            $documentRows = $entry['documents'] ?? [];

            $profileAttributes = array_merge($entry['profile'], $location, [
                'philippine_barangay_id' => $philippineBarangay->id,
                'hazards' => collect($hazardRows)->pluck('type')->all(),
            ]);

            $profile = BarangayProfile::updateOrCreate(
                ['philippine_barangay_id' => $philippineBarangay->id],
                $profileAttributes,
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
                    'source_reference_number' => $hazard['reference'] ?? null,
                    'date_assessed' => now()->subDays($hazard['assessed_days_ago'] ?? 30)->toDateString(),
                    'metadata' => [
                        'seeded' => true,
                        'training_recommendations' => config("hazard_assessment.training_recommendations.{$hazard['type']}", []),
                    ],
                ]);
            }

            $this->seedDocuments($profile, $documentRows, $uploader?->id);

            $seededProfiles[$entry['location_name']] = $profile;
        }

        $this->linkSimulationEvents($seededProfiles);

        $count = count($seededProfiles);
        $this->command?->info("Hazard assessment profiles seeded ({$count} barangays).");
    }

  /**
     * @param  array<int, array{document_type: string, filename: string, content: string}>  $documents
     */
    private function seedDocuments(BarangayProfile $profile, array $documents, ?int $uploaderId): void
    {
        if ($documents === []) {
            return;
        }

        $slug = Str::slug($profile->barangay_name ?: 'barangay');

        foreach ($documents as $document) {
            $storagePath = "hazard-assessments/{$slug}/{$document['filename']}";
            Storage::disk('local')->put($storagePath, $document['content']);

            HazardAssessmentDocument::updateOrCreate(
                [
                    'barangay_profile_id' => $profile->id,
                    'document_type' => $document['document_type'],
                    'original_filename' => $document['filename'],
                ],
                [
                    'file_path' => $storagePath,
                    'mime_type' => 'text/plain',
                    'file_size' => strlen($document['content']),
                    'uploaded_by' => $uploaderId,
                ],
            );
        }
    }

    /**
     * @param  array<string, BarangayProfile>  $profiles
     */
    private function linkSimulationEvents(array $profiles): void
    {
        $links = [
            'Quarterly Fire Drill - Barangay Hall' => $profiles['Commonwealth'] ?? null,
            'Completed Earthquake Drill - Municipal Hall' => $profiles['Bagong Silangan'] ?? null,
        ];

        foreach ($links as $title => $profile) {
            if (! $profile) {
                continue;
            }

            SimulationEvent::query()
                ->where('title', $title)
                ->whereNull('barangay_profile_id')
                ->update(['barangay_profile_id' => $profile->id]);
        }
    }
}
