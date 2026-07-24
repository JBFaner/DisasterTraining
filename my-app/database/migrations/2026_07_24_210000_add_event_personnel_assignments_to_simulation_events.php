<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('simulation_events', function (Blueprint $table) {
            if (! Schema::hasColumn('simulation_events', 'event_personnel_assignments')) {
                $table->json('event_personnel_assignments')->nullable()->after('readiness_confirmations');
            }
        });
    }

    public function down(): void
    {
        Schema::table('simulation_events', function (Blueprint $table) {
            if (Schema::hasColumn('simulation_events', 'event_personnel_assignments')) {
                $table->dropColumn('event_personnel_assignments');
            }
        });
    }
};
