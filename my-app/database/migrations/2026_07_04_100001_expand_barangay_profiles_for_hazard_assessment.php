<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('barangay_profiles', function (Blueprint $table) {
            $table->string('region')->nullable()->after('province');
            $table->decimal('total_land_area', 12, 2)->nullable()->after('estimated_population');
            $table->unsignedInteger('number_of_households')->nullable()->after('total_land_area');
            $table->string('external_source_id')->nullable()->unique()->after('hazard_notes');
            $table->timestamp('last_assessed_at')->nullable()->after('external_source_id');
        });
    }

    public function down(): void
    {
        Schema::table('barangay_profiles', function (Blueprint $table) {
            $table->dropColumn([
                'region',
                'total_land_area',
                'number_of_households',
                'external_source_id',
                'last_assessed_at',
            ]);
        });
    }
};
