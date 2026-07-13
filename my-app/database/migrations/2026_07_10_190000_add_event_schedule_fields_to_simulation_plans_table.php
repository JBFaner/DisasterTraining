<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('simulation_plans', function (Blueprint $table) {
            if (! Schema::hasColumn('simulation_plans', 'event_date')) {
                $table->date('event_date')->nullable()->after('simulation_description');
            }
            if (! Schema::hasColumn('simulation_plans', 'start_time')) {
                $table->string('start_time', 20)->nullable()->after('event_date');
            }
            if (! Schema::hasColumn('simulation_plans', 'end_time')) {
                $table->string('end_time', 20)->nullable()->after('start_time');
            }
            if (! Schema::hasColumn('simulation_plans', 'venue')) {
                $table->string('venue')->nullable()->after('end_time');
            }
        });
    }

    public function down(): void
    {
        Schema::table('simulation_plans', function (Blueprint $table) {
            foreach (['event_date', 'start_time', 'end_time', 'venue'] as $column) {
                if (Schema::hasColumn('simulation_plans', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
