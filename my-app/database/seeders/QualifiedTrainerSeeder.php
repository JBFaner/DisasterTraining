<?php

namespace Database\Seeders;

use App\Models\QualifiedTrainer;
use Illuminate\Database\Seeder;

class QualifiedTrainerSeeder extends Seeder
{
    public function run(): void
    {
        $trainers = [
            [
                'group6_external_id' => 'G6-TR-001',
                'name' => 'Maria Santos',
                'email' => 'maria.santos@example.com',
                'phone' => '09171234567',
                'specialization' => 'Fire Safety & Evacuation',
                'barangay' => 'Barangay San Jose',
                'certifications' => ['BFP Certified Trainer', 'First Aid Level 2'],
                'status' => 'active',
                'qualified_at' => now()->subMonths(6),
                'last_synced_at' => now(),
            ],
            [
                'group6_external_id' => 'G6-TR-002',
                'name' => 'Juan Dela Cruz',
                'email' => 'juan.delacruz@example.com',
                'phone' => '09189876543',
                'specialization' => 'Earthquake Response',
                'barangay' => 'Barangay Poblacion',
                'certifications' => ['NDRRMC Trainer', 'Search & Rescue'],
                'status' => 'active',
                'qualified_at' => now()->subYear(),
                'last_synced_at' => now(),
            ],
            [
                'group6_external_id' => 'G6-TR-003',
                'name' => 'Ana Reyes',
                'email' => 'ana.reyes@example.com',
                'phone' => '09201112233',
                'specialization' => 'Flood & Landslide Preparedness',
                'barangay' => 'Barangay Riverside',
                'certifications' => ['DRRM Trainer'],
                'status' => 'active',
                'qualified_at' => now()->subMonths(3),
                'last_synced_at' => now(),
            ],
            [
                'group6_external_id' => 'G6-TR-004',
                'name' => 'Roberto Garcia',
                'email' => 'roberto.garcia@example.com',
                'phone' => '09334445566',
                'specialization' => 'Medical First Response',
                'barangay' => 'Barangay Hillside',
                'certifications' => ['EMT-Basic', 'CPR Instructor'],
                'status' => 'inactive',
                'qualified_at' => now()->subMonths(18),
                'last_synced_at' => now()->subMonths(2),
            ],
            [
                'group6_external_id' => 'G6-TR-REYMON',
                'name' => 'Reymon',
                'email' => 'brogada.reymon09@gmail.com',
                'phone' => '09633405152',
                'specialization' => 'Fire Safety and Emergency Response',
                'barangay' => 'Caloocan City',
                'certifications' => ['LGU DRRM Trainer', 'Fire Safety Instructor'],
                'status' => 'active',
                'qualified_at' => now()->subMonths(8),
                'last_synced_at' => now(),
            ],
            [
                'group6_external_id' => 'G6-TR-JB',
                'name' => 'JB',
                'email' => 'jbcursor@gmail.com',
                'phone' => '09170000001',
                'specialization' => 'Disaster Simulation Facilitation',
                'barangay' => 'Quezon City',
                'certifications' => ['Simulation Drill Facilitator'],
                'status' => 'active',
                'qualified_at' => now()->subMonths(4),
                'last_synced_at' => now(),
            ],
        ];

        foreach ($trainers as $trainer) {
            QualifiedTrainer::updateOrCreate(
                ['group6_external_id' => $trainer['group6_external_id']],
                $trainer,
            );
        }

        $this->command?->info('Qualified trainers seeded ('.count($trainers).' records).');
    }
}
