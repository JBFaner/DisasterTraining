<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

/**
 * @deprecated Use HazardAssessmentSeeder directly. Kept for backward compatibility.
 */
class BarangayProfileSeeder extends Seeder
{
    public function run(): void
    {
        $this->call(HazardAssessmentSeeder::class);
    }
}
