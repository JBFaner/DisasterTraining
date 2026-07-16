<?php

namespace App\Support;

class SimulationEvaluationCriteria
{
    /**
     * Resolve participant scoring criteria for a disaster type / scenario list.
     *
     * @param  list<string>|null  $scenarioCriteria
     * @return list<string>
     */
    public static function resolve(?array $scenarioCriteria, ?string $disasterType = null): array
    {
        $scenarioCriteria = array_values(array_filter(array_map(
            static fn ($item) => trim((string) $item),
            $scenarioCriteria ?? [],
        )));

        if ($scenarioCriteria !== []) {
            return $scenarioCriteria;
        }

        $core = config('simulation_evaluation.core_criteria', []);
        $byType = config('simulation_evaluation.by_disaster_type', []);
        $extras = [];

        if ($disasterType) {
            foreach ($byType as $type => $criteria) {
                if (strcasecmp((string) $type, (string) $disasterType) === 0) {
                    $extras = $criteria;
                    break;
                }
            }

            // Soft match (e.g. "Fire Safety" contains Fire)
            if ($extras === []) {
                foreach ($byType as $type => $criteria) {
                    if (stripos((string) $disasterType, (string) $type) !== false) {
                        $extras = $criteria;
                        break;
                    }
                }
            }
        }

        return array_values(array_unique(array_merge($core, $extras)));
    }
}
