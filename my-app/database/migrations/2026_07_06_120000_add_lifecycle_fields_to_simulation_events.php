<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('simulation_events', function (Blueprint $table) {
            if (! Schema::hasColumn('simulation_events', 'readiness_confirmations')) {
                $table->json('readiness_confirmations')->nullable()->after('started_by');
            }
            if (! Schema::hasColumn('simulation_events', 'execution_progress')) {
                $table->json('execution_progress')->nullable()->after('readiness_confirmations');
            }
            if (! Schema::hasColumn('simulation_events', 'timeline_entries')) {
                $table->json('timeline_entries')->nullable()->after('execution_progress');
            }
            if (! Schema::hasColumn('simulation_events', 'post_evaluation')) {
                $table->json('post_evaluation')->nullable()->after('timeline_entries');
            }
        });
    }

    public function down(): void
    {
        Schema::table('simulation_events', function (Blueprint $table) {
            $columnsToDrop = [];
            foreach ([
                'readiness_confirmations',
                'execution_progress',
                'timeline_entries',
                'post_evaluation',
            ] as $column) {
                if (Schema::hasColumn('simulation_events', $column)) {
                    $columnsToDrop[] = $column;
                }
            }
            if ($columnsToDrop !== []) {
                $table->dropColumn($columnsToDrop);
            }
        });
    }
};
