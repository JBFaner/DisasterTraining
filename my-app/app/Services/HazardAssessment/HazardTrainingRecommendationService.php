<?php

namespace App\Services\HazardAssessment;

use App\Models\BarangayHazard;
use App\Models\BarangayProfile;
use App\Models\QualifiedTrainer;
use App\Models\TrainingModule;
use Illuminate\Support\Collection;

class HazardTrainingRecommendationService
{
    /**
     * @return array<int, array{id: int, title: string, category: ?string, reason: string}>
     */
    public function recommendTrainingModules(BarangayProfile $profile): array
    {
        $profile->loadMissing('hazardRecords');
        $hazards = $profile->hazardRecords;

        if ($hazards->isEmpty()) {
            return [];
        }

        $keywords = $this->collectRecommendationKeywords($hazards);
        $modules = TrainingModule::query()
            ->where('status', 'published')
            ->orderBy('title')
            ->get(['id', 'title', 'category']);

        $recommendations = [];

        foreach ($keywords as $item) {
            $match = $modules->first(function (TrainingModule $module) use ($item) {
                return stripos($module->title, $item['keyword']) !== false
                    || stripos((string) $module->category, $item['keyword']) !== false;
            });

            if ($match && ! isset($recommendations[$match->id])) {
                $recommendations[$match->id] = [
                    'id' => $match->id,
                    'title' => $match->title,
                    'category' => $match->category,
                    'reason' => $item['reason'],
                ];
            }
        }

        return array_values($recommendations);
    }

    /**
     * @return array<int, array{hazard_type: string, scenario: string, risk_level: string, risk_score: int}>
     */
    public function suggestScenarios(BarangayProfile $profile): array
    {
        $profile->loadMissing('hazardRecords');

        return $profile->hazardRecords
            ->sortByDesc('risk_score')
            ->map(fn (BarangayHazard $hazard) => [
                'hazard_type' => $hazard->hazard_type,
                'risk_level' => $hazard->risk_level,
                'risk_score' => $hazard->risk_score,
                'scenario' => config(
                    "hazard_assessment.scenario_suggestions.{$hazard->hazard_type}",
                    config('hazard_assessment.scenario_suggestions.Others'),
                ),
            ])
            ->values()
            ->all();
    }

    /**
     * @return array<int, string>
     */
    public function suggestEquipment(BarangayProfile $profile): array
    {
        $profile->loadMissing('hazardRecords');
        $equipment = [];

        foreach ($profile->hazardRecords as $hazard) {
            $items = config("hazard_assessment.equipment_suggestions.{$hazard->hazard_type}", []);
            foreach ($items as $item) {
                $equipment[$item] = true;
            }
        }

        return array_keys($equipment);
    }

    /**
     * @return array<int, string>
     */
    public function suggestParticipants(BarangayProfile $profile): array
    {
        $profile->loadMissing('hazardRecords');
        $groups = config('hazard_assessment.participant_suggestions.default', []);

        foreach ($profile->hazardRecords as $hazard) {
            $specific = config("hazard_assessment.participant_suggestions.{$hazard->hazard_type}", []);
            $groups = array_merge($groups, $specific);
        }

        return array_values(array_unique($groups));
    }

    /**
     * @return array<int, array{id: int, name: string, specialization: ?string}>
     */
    public function suggestTrainers(BarangayProfile $profile): array
    {
        $profile->loadMissing('hazardRecords');
        $hazardTypes = $profile->hazardRecords->pluck('hazard_type')->unique();

        $query = QualifiedTrainer::active()->orderBy('name');

        if ($profile->barangay_name) {
            $query->where(function ($q) use ($profile) {
                $q->where('barangay', 'like', "%{$profile->barangay_name}%")
                    ->orWhereNull('barangay');
            });
        }

        return $query->get(['id', 'name', 'specialization'])
            ->filter(function (QualifiedTrainer $trainer) use ($hazardTypes) {
                if ($hazardTypes->isEmpty()) {
                    return true;
                }
                $spec = strtolower((string) $trainer->specialization);

                return $hazardTypes->contains(fn ($type) => str_contains($spec, strtolower($type)));
            })
            ->take(5)
            ->map(fn (QualifiedTrainer $t) => [
                'id' => $t->id,
                'name' => $t->name,
                'specialization' => $t->specialization,
            ])
            ->values()
            ->all();
    }

    /**
     * @return array<string, mixed>
     */
    public function buildIntelligencePackage(BarangayProfile $profile): array
    {
        $scenarios = $this->suggestScenarios($profile);

        return [
            'profile' => $profile->toHazardIntelligenceArray(),
            'recommended_training_modules' => $this->recommendTrainingModules($profile),
            'suggested_scenarios' => $scenarios,
            'recommended_scenario' => $scenarios[0] ?? null,
            'suggested_equipment' => $this->suggestEquipment($profile),
            'suggested_participants' => $this->suggestParticipants($profile),
            'suggested_trainers' => $this->suggestTrainers($profile),
        ];
    }

    /**
     * @return array<string, int|float>
     */
    public function dashboardSummary(Collection $profiles): array
    {
        $profiles->loadMissing('hazardRecords');

        $highRiskBarangays = $profiles->filter(function (BarangayProfile $profile) {
            return $profile->hazardRecords->contains(
                fn (BarangayHazard $h) => in_array($h->risk_level, ['High', 'Very High'], true),
            );
        })->count();

        $countByHazard = function (string $type) use ($profiles): int {
            return $profiles->filter(
                fn (BarangayProfile $p) => $p->hazardRecords->contains(
                    fn (BarangayHazard $h) => strcasecmp($h->hazard_type, $type) === 0,
                ),
            )->count();
        };

        $allScores = $profiles->flatMap(fn (BarangayProfile $p) => $p->hazardRecords->pluck('risk_score'));
        $averageRiskScore = $allScores->isNotEmpty() ? round($allScores->avg(), 1) : 0;

        return [
            'total_barangays' => $profiles->count(),
            'high_risk_barangays' => $highRiskBarangays,
            'flood_prone' => $countByHazard('Flood'),
            'fire_prone' => $countByHazard('Fire'),
            'earthquake_prone' => $countByHazard('Earthquake'),
            'average_risk_score' => $averageRiskScore,
        ];
    }

    /**
     * Global hazard analytics for the main dashboard.
     *
     * @return array<string, mixed>
     */
    public function globalAnalytics(): array
    {
        $profiles = BarangayProfile::with('hazardRecords')->get();
        $summary = $this->dashboardSummary($profiles);

        $hazardDistribution = [];
        foreach (config('hazard_assessment.hazard_types', []) as $type) {
            $count = BarangayHazard::where('hazard_type', $type)->count();
            if ($count > 0) {
                $hazardDistribution[$type] = $count;
            }
        }

        $agencyDistribution = BarangayHazard::query()
            ->selectRaw('source_agency, COUNT(*) as total')
            ->groupBy('source_agency')
            ->orderByDesc('total')
            ->pluck('total', 'source_agency')
            ->all();

        return array_merge($summary, [
            'hazard_distribution' => $hazardDistribution,
            'agency_distribution' => $agencyDistribution,
        ]);
    }

    /**
     * Recommend communities (barangays) for a given training module based on related hazards.
     *
     * @return array<string, mixed>
     */
    public function recommendCommunitiesForTraining(TrainingModule $module): array
    {
        $hazardTypes = $this->normalizedTrainingHazards($module);

        if ($hazardTypes === []) {
            return [
                'summary' => [
                    'total_communities' => 0,
                    'high_priority' => 0,
                    'medium_priority' => 0,
                    'low_priority' => 0,
                ],
                'communities' => [],
            ];
        }

        $riskLevels = ['Moderate', 'High', 'Very High'];

        $hazards = BarangayHazard::query()
            ->with('barangayProfile')
            ->whereIn('hazard_type', $hazardTypes)
            ->whereIn('risk_level', $riskLevels)
            ->get();

        if ($hazards->isEmpty()) {
            return [
                'summary' => [
                    'total_communities' => 0,
                    'high_priority' => 0,
                    'medium_priority' => 0,
                    'low_priority' => 0,
                ],
                'communities' => [],
            ];
        }

        $byBarangay = $hazards->groupBy('barangay_profile_id');

        $communities = [];
        $high = 0;
        $medium = 0;
        $low = 0;

        foreach ($byBarangay as $barangayId => $records) {
            /** @var \Illuminate\Support\Collection<int, BarangayHazard> $records */
            $best = $records->sortByDesc('risk_score')->first();
            $profile = $best->barangayProfile;
            if (! $profile) {
                continue;
            }

            $priorityBucket = match ($best->risk_level) {
                'High', 'Very High' => 'high',
                'Moderate' => 'medium',
                default => 'low',
            };

            if ($priorityBucket === 'high') {
                $high++;
            } elseif ($priorityBucket === 'medium') {
                $medium++;
            } else {
                $low++;
            }

            $communities[] = [
                'barangay_profile_id' => (int) $barangayId,
                'barangay_name' => $profile->barangay_name,
                'municipality_city' => $profile->municipality_city,
                'province' => $profile->province,
                'related_hazard' => $best->hazard_type,
                'risk_level' => $best->risk_level,
                'priority_score' => (int) $best->risk_score,
                'recommendation' => $this->buildTrainingRecommendationText($module, $best),
            ];
        }

        usort($communities, fn ($a, $b) => $b['priority_score'] <=> $a['priority_score']);

        return [
            'summary' => [
                'total_communities' => count($communities),
                'high_priority' => $high,
                'medium_priority' => $medium,
                'low_priority' => $low,
            ],
            'communities' => $communities,
        ];
    }

    /**
     * @return list<string>
     */
    private function normalizedTrainingHazards(TrainingModule $module): array
    {
        $raw = (string) ($module->related_hazard ?? $module->category ?? '');
        if ($raw === '') {
            return [];
        }

        $tokens = preg_split('/[,&\/]+/', $raw) ?: [];
        $tokens = array_map(static fn ($value) => trim((string) $value), $tokens);
        $tokens = array_filter($tokens, static fn ($value) => $value !== '');

        if ($tokens === []) {
            return [];
        }

        $validTypes = config('hazard_assessment.hazard_types', []);
        $normalized = [];

        foreach ($tokens as $token) {
            foreach ($validTypes as $type) {
                if (strcasecmp($token, $type) === 0) {
                    $normalized[$type] = true;
                    continue 2;
                }
            }
        }

        return array_keys($normalized);
    }

    private function buildTrainingRecommendationText(TrainingModule $module, BarangayHazard $hazard): string
    {
        $base = $module->category ?: $hazard->hazard_type.' Preparedness Training';

        return match ($hazard->risk_level) {
            'High', 'Very High' => "Highly recommended for {$base}.",
            'Moderate' => "Recommended for {$base}.",
            default => "Suitable for {$base}.",
        };
    }

    /**
     * @param  Collection<int, BarangayHazard>  $hazards
     * @return array<int, array{keyword: string, reason: string}>
     */
    private function collectRecommendationKeywords(Collection $hazards): array
    {
        $keywords = [];

        foreach ($hazards as $hazard) {
            $titles = config("hazard_assessment.training_recommendations.{$hazard->hazard_type}", []);
            foreach ($titles as $title) {
                $keywords[] = [
                    'keyword' => $title,
                    'reason' => "{$hazard->hazard_type} ({$hazard->risk_level})",
                ];
            }
        }

        return $keywords;
    }

    /**
     * Build AI context string for Gemini prompts.
     */
    public function buildAiContext(BarangayProfile $profile): string
    {
        $profile->loadMissing('hazardRecords');

        if ($profile->hazardRecords->isEmpty()) {
            return '';
        }

        $lines = [
            "Target Barangay: {$profile->barangay_name}, {$profile->municipality_city}, {$profile->province}, {$profile->region}",
            'Detected Hazards:',
        ];

        foreach ($profile->hazardRecords as $hazard) {
            $lines[] = sprintf(
                '- %s: %s risk (score %d%%), source: %s%s',
                $hazard->hazard_type,
                $hazard->risk_level,
                $hazard->risk_score,
                $hazard->sourceAgencyLabel(),
                $hazard->description ? " — {$hazard->description}" : '',
            );
        }

        $types = $profile->hazardRecords->pluck('hazard_type')->unique()->implode(', ');
        $lines[] = "Generate a disaster preparedness scenario based on these hazards: {$types}. Do not include unrelated disaster types.";

        return implode("\n", $lines);
    }
}
