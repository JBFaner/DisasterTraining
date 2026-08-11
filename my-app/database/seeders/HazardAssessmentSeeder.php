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

        /*
         | Capstone focus: Barangay San Agustin, Novaliches, Quezon City.
         | Citations below point to publicly referenced QC/academic sources
         | (findings summarized for demo — verify latest official maps for ops use).
         */
        $this->purgeUnrelatedProfiles();

        $profiles = [
            [
                'location_name' => 'San Agustin',
                'city_name' => 'Quezon City',
                'profile' => [
                    'contact_number' => '+63 2 8988 4242',
                    'email_address' => 'sanagustin.brgy@quezoncity.gov.ph',
                    'estimated_population' => 22000,
                    'total_land_area' => 1.15,
                    'number_of_households' => 4800,
                    'area_classification' => 'Urban',
                    'hazard_notes' => 'Capstone study area: Barangay San Agustin, District 5 (Novaliches), Quezon City. Included in Quezon City Drainage Master Plan Phase I/II flood assessment coverage (all streets listed among field-validated flood-prone localities). Local BDRRM implementation studies also cite gaps in drills and early warning practice.',
                    'external_source_id' => 'HAZ-QC-SAN-AGUSTIN-NOVALICHES-2025',
                    'last_assessed_at' => now()->subWeeks(3),
                ],
                'hazards' => [
                    [
                        'type' => 'Flood',
                        'level' => 'High',
                        'score' => 75,
                        'agency' => 'MDRRMO',
                        'reference' => 'QCDMP-V1-APP-A / Brgy. San Agustin',
                        'reference_title' => 'Quezon City Drainage Master Plan (Phase I & II) — Areas Covered / Site Assessment',
                        'reference_year' => 2025,
                        'reference_url' => 'https://quezoncity.gov.ph/qc-profile/drainage-master-plan/',
                        'description' => 'San Agustin is listed under QC Drainage Master Plan coverage with ALL STREETS noted among Phase I/II assessed localities. Low-lying residential streets experience street flooding and prolonged ponding during intense rainfall and typhoon-enhanced monsoon events; drainage capacity and creek/tributary overflow are primary drivers.',
                        'exposure_scope' => 'zone_specific',
                        'focus_area' => 'Barangay San Agustin — all streets under QC Drainage Master Plan Phase I/II assessed coverage; prioritize low-lying / drainage-constrained residential streets and ponding hotspots during heavy rainfall.',
                        'assessed_days_ago' => 21,
                    ],
                    [
                        'type' => 'Typhoon',
                        'level' => 'High',
                        'score' => 75,
                        'agency' => 'PAGASA',
                        'reference' => 'PAGASA-NCR-TC / QCDMP rainfall context',
                        'reference_title' => 'Tropical cyclone / monsoon rainfall impacts in NCR urban catchments (context for QC flood studies)',
                        'reference_year' => 2024,
                        'reference_url' => 'https://www.pagasa.dost.gov.ph/',
                        'description' => 'Strong winds and extreme rainfall from tropical cyclones compound local flooding in Novaliches. Dense housing and roadside utilities raise exposure to wind damage, downed lines, and interrupted access during storms that also trigger flood conditions identified in the QC Drainage Master Plan.',
                        'exposure_scope' => 'barangay_wide',
                        'focus_area' => 'Whole of Barangay San Agustin (Novaliches, QC) — wind, rainfall, and utility disruption can affect residential areas barangay-wide during tropical cyclones.',
                        'assessed_days_ago' => 28,
                    ],
                    [
                        'type' => 'Earthquake',
                        'level' => 'Moderate',
                        'score' => 50,
                        'agency' => 'PHIVOLCS',
                        'reference' => 'PHIVOLCS / HazardHunterPH — NCR ground shaking',
                        'reference_title' => 'PHIVOLCS Earthquake Hazard Maps / HazardHunterPH location assessment (NCR)',
                        'reference_year' => 2024,
                        'reference_url' => 'https://hazardhunter.georisk.gov.ph/map',
                        'description' => 'Metro Manila including Quezon City is exposed to strong ground shaking from West Valley Fault and other regional sources. Barangay-level preparedness should assume damaging shaking scenarios; use HazardHunterPH / PHIVOLCS GeoHazards Portal for parcel-level ground shaking and related layers when planning drills.',
                        'exposure_scope' => 'barangay_wide',
                        'focus_area' => 'Whole of Barangay San Agustin — ground shaking is treated as barangay-wide (no single street pin); drills cover households and assembly areas across the barangay.',
                        'assessed_days_ago' => 40,
                    ],
                    [
                        'type' => 'Fire',
                        'level' => 'Moderate',
                        'score' => 50,
                        'agency' => 'BFP',
                        'reference' => 'BFP-QC urban densification context',
                        'reference_title' => 'Urban fire risk in dense residential blocks (BFP / LGU preparedness context)',
                        'reference_year' => 2024,
                        'reference_url' => 'https://bfp.gov.ph/',
                        'description' => 'Compact residential pockets in San Agustin create moderate structural fire-spread risk where access lanes are narrow and electrical loading is high. Community fire drills and egress planning remain priority BDRRM activities alongside flood readiness.',
                        'exposure_scope' => 'pattern_based',
                        'focus_area' => 'Dense residential clusters / closely packed houses and narrow access lanes in San Agustin — fire can ignite anywhere, but spread risk is higher where homes are adjacent and egress is constrained (pattern-based, not one fixed street).',
                        'assessed_days_ago' => 35,
                    ],
                ],
                'documents' => [
                    [
                        'document_type' => 'Flood Hazard Map',
                        'filename' => 'san-agustin-qcdmp-flood-coverage-summary.docx',
                        'asset' => 'san-agustin-qcdmp-flood-coverage-summary.docx',
                    ],
                    [
                        'document_type' => 'Hazard Assessment Report',
                        'filename' => 'san-agustin-hazard-profile-2025.docx',
                        'asset' => 'san-agustin-hazard-profile-2025.docx',
                    ],
                    [
                        'document_type' => 'Other',
                        'filename' => 'san-agustin-bdrrm-study-note.docx',
                        'asset' => 'san-agustin-bdrrm-study-note.docx',
                    ],
                ],
            ],
        ];

        $seededProfiles = [];

        foreach ($profiles as $entry) {
            $query = PhilippineBarangay::query()->where('name', $entry['location_name']);

            if (! empty($entry['city_name'])) {
                $query->whereHas('city', fn ($q) => $q->where('name', $entry['city_name']));
            }

            $philippineBarangay = $query->first();

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
                    'exposure_scope' => $hazard['exposure_scope'] ?? null,
                    'focus_area' => $hazard['focus_area'] ?? null,
                    'source_agency' => $hazard['agency'],
                    'source_reference_number' => $hazard['reference'] ?? null,
                    'reference_title' => $hazard['reference_title'] ?? null,
                    'reference_year' => $hazard['reference_year'] ?? null,
                    'reference_url' => $hazard['reference_url'] ?? null,
                    'date_assessed' => now()->subDays($hazard['assessed_days_ago'] ?? 30)->toDateString(),
                    'metadata' => [
                        'seeded' => true,
                        'capstone_focus' => $entry['location_name'] === 'San Agustin',
                        'training_recommendations' => config("hazard_assessment.training_recommendations.{$hazard['type']}", []),
                    ],
                ]);
            }

            $this->seedDocuments($profile, $documentRows, $uploader?->id);

            $seededProfiles[$entry['location_name']] = $profile;
        }

        $this->linkSimulationEvents($seededProfiles);

        $count = count($seededProfiles);
        $this->command?->info("Hazard assessment profiles seeded ({$count} barangays). Capstone focus: San Agustin, Novaliches, QC.");
    }

    /**
     * Keep only the San Agustin (Quezon City) capstone profile.
     */
    private function purgeUnrelatedProfiles(): void
    {
        $keepIds = BarangayProfile::query()
            ->where('barangay_name', 'San Agustin')
            ->where(function ($q) {
                $q->where('municipality_city', 'Quezon City')
                    ->orWhereHas('philippineBarangay.city', fn ($city) => $city->where('name', 'Quezon City'));
            })
            ->pluck('id');

        $deleteQuery = BarangayProfile::query();
        if ($keepIds->isNotEmpty()) {
            $deleteQuery->whereNotIn('id', $keepIds);
        }

        $deleteIds = $deleteQuery->pluck('id');
        if ($deleteIds->isEmpty()) {
            return;
        }

        if (\Illuminate\Support\Facades\Schema::hasColumn('users', 'barangay_id') && $keepIds->isNotEmpty()) {
            \Illuminate\Support\Facades\DB::table('users')
                ->whereIn('barangay_id', $deleteIds)
                ->update(['barangay_id' => $keepIds->first()]);
        }

        if (\Illuminate\Support\Facades\Schema::hasColumn('simulation_events', 'barangay_profile_id') && $keepIds->isNotEmpty()) {
            \Illuminate\Support\Facades\DB::table('simulation_events')
                ->whereIn('barangay_profile_id', $deleteIds)
                ->update(['barangay_profile_id' => $keepIds->first()]);
        }

        if (
            \Illuminate\Support\Facades\Schema::hasTable('resource_budget_proposals')
            && \Illuminate\Support\Facades\Schema::hasColumn('resource_budget_proposals', 'barangay_profile_id')
            && $keepIds->isNotEmpty()
        ) {
            \Illuminate\Support\Facades\DB::table('resource_budget_proposals')
                ->whereIn('barangay_profile_id', $deleteIds)
                ->update(['barangay_profile_id' => $keepIds->first()]);
        }

        BarangayProfile::query()->whereIn('id', $deleteIds)->each(function (BarangayProfile $profile) {
            $profile->documents()->delete();
            $profile->hazardRecords()->delete();
            $profile->delete();
        });

        $this->command?->info('Purged unrelated hazard profiles; kept San Agustin (QC) only.');
    }

    /**
     * @param  array<int, array{document_type: string, filename: string, asset?: string, content?: string}>  $documents
     */
    private function seedDocuments(BarangayProfile $profile, array $documents, ?int $uploaderId): void
    {
        if ($documents === []) {
            return;
        }

        $slug = Str::slug($profile->barangay_name ?: 'barangay');
        $assetsDir = database_path('seeders/assets/hazard-documents');

        // Drop legacy placeholder .txt rows so the profile shows Word docs only.
        $legacy = $profile->documents()
            ->where('original_filename', 'like', '%.txt')
            ->get();
        foreach ($legacy as $legacyDoc) {
            $legacyDoc->delete();
        }

        foreach ($documents as $document) {
            $binary = null;
            $mime = 'text/plain';

            if (! empty($document['asset'])) {
                $assetPath = $assetsDir.DIRECTORY_SEPARATOR.$document['asset'];
                if (! is_file($assetPath)) {
                    $this->command?->warn("Missing hazard document asset: {$document['asset']}");

                    continue;
                }
                $binary = file_get_contents($assetPath);
                $mime = str_ends_with(strtolower($document['filename']), '.docx')
                    ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
                    : (mime_content_type($assetPath) ?: 'application/octet-stream');
            } elseif (isset($document['content'])) {
                $binary = $document['content'];
            } else {
                continue;
            }

            $storagePath = "hazard-assessments/{$slug}/{$document['filename']}";
            Storage::disk('local')->put($storagePath, $binary);

            HazardAssessmentDocument::updateOrCreate(
                [
                    'barangay_profile_id' => $profile->id,
                    'document_type' => $document['document_type'],
                    'original_filename' => $document['filename'],
                ],
                [
                    'file_path' => $storagePath,
                    'mime_type' => $mime,
                    'file_size' => strlen($binary),
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
        $sanAgustin = $profiles['San Agustin'] ?? null;
        if (! $sanAgustin) {
            return;
        }

        SimulationEvent::query()
            ->whereNull('barangay_profile_id')
            ->orderByDesc('id')
            ->limit(3)
            ->update(['barangay_profile_id' => $sanAgustin->id]);
    }
}
