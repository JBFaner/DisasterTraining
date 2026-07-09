<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('barangay_profiles', function (Blueprint $table) {
            if (! Schema::hasColumn('barangay_profiles', 'region')) {
                $table->string('region')->nullable()->after('province');
            }
            if (! Schema::hasColumn('barangay_profiles', 'total_land_area')) {
                $table->decimal('total_land_area', 12, 2)->nullable()->after('estimated_population');
            }
            if (! Schema::hasColumn('barangay_profiles', 'number_of_households')) {
                $table->unsignedInteger('number_of_households')->nullable()->after('total_land_area');
            }
            if (! Schema::hasColumn('barangay_profiles', 'external_source_id')) {
                $table->string('external_source_id')->nullable()->unique()->after('hazard_notes');
            }
            if (! Schema::hasColumn('barangay_profiles', 'last_assessed_at')) {
                $table->timestamp('last_assessed_at')->nullable()->after('external_source_id');
            }
        });
    }

    public function down(): void
    {
        Schema::table('barangay_profiles', function (Blueprint $table) {
            $columnsToDrop = [];
            foreach ([
                'region',
                'total_land_area',
                'number_of_households',
                'external_source_id',
                'last_assessed_at',
            ] as $column) {
                if (Schema::hasColumn('barangay_profiles', $column)) {
                    $columnsToDrop[] = $column;
                }
            }

            if ($columnsToDrop !== []) {
                $table->dropColumn($columnsToDrop);
            }
        });
    }
};
