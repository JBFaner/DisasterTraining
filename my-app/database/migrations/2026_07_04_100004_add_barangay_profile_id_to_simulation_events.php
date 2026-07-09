<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasColumn('simulation_events', 'barangay_profile_id')) {
            return;
        }

        Schema::table('simulation_events', function (Blueprint $table) {
            $table->foreignId('barangay_profile_id')
                ->nullable()
                ->after('training_module_id')
                ->constrained('barangay_profiles')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('simulation_events', function (Blueprint $table) {
            if (Schema::hasColumn('simulation_events', 'barangay_profile_id')) {
                $table->dropConstrainedForeignId('barangay_profile_id');
            }
        });
    }
};
