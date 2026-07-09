<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('barangay_hazards')) {
            return;
        }

        Schema::create('barangay_hazards', function (Blueprint $table) {
            $table->id();
            $table->foreignId('barangay_profile_id')->constrained('barangay_profiles')->cascadeOnDelete();
            $table->string('hazard_type');
            $table->string('risk_level');
            $table->unsignedTinyInteger('risk_score')->default(0);
            $table->text('description')->nullable();
            $table->string('source_agency');
            $table->string('source_reference_number')->nullable();
            $table->date('date_assessed')->nullable();
            $table->string('external_source_id')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->index(['barangay_profile_id', 'hazard_type']);
            $table->index('risk_level');
        });

        $this->migrateLegacyHazards();
    }

    public function down(): void
    {
        if (! Schema::hasTable('barangay_hazards')) {
            return;
        }

        Schema::dropIfExists('barangay_hazards');
    }

    private function migrateLegacyHazards(): void
    {
        if (! Schema::hasTable('barangay_profiles')) {
            return;
        }

        $profiles = DB::table('barangay_profiles')->whereNotNull('hazards')->get();

        foreach ($profiles as $profile) {
            $hazards = json_decode($profile->hazards, true);
            if (! is_array($hazards)) {
                continue;
            }

            foreach ($hazards as $hazardType) {
                if (! is_string($hazardType) || $hazardType === '') {
                    continue;
                }

                DB::table('barangay_hazards')->insert([
                    'barangay_profile_id' => $profile->id,
                    'hazard_type' => $this->normalizeHazardType($hazardType),
                    'risk_level' => 'Moderate',
                    'risk_score' => 50,
                    'description' => $profile->hazard_notes,
                    'source_agency' => 'MDRRMO',
                    'date_assessed' => now()->toDateString(),
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            if (count($hazards) > 0) {
                DB::table('barangay_profiles')
                    ->where('id', $profile->id)
                    ->update(['last_assessed_at' => now()]);
            }
        }
    }

    private function normalizeHazardType(string $type): string
    {
        $map = [
            'flood' => 'Flood',
            'fire' => 'Fire',
            'earthquake' => 'Earthquake',
            'landslide' => 'Landslide',
            'typhoon' => 'Typhoon',
            'storm surge' => 'Storm Surge',
            'tsunami' => 'Tsunami',
        ];

        $key = strtolower(trim($type));

        return $map[$key] ?? ucwords($type);
    }
};
