<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('simulation_events', function (Blueprint $table) {
            $table->json('readiness_confirmations')->nullable()->after('started_by');
            $table->json('execution_progress')->nullable()->after('readiness_confirmations');
            $table->json('timeline_entries')->nullable()->after('execution_progress');
            $table->json('post_evaluation')->nullable()->after('timeline_entries');
        });
    }

    public function down(): void
    {
        Schema::table('simulation_events', function (Blueprint $table) {
            $table->dropColumn([
                'readiness_confirmations',
                'execution_progress',
                'timeline_entries',
                'post_evaluation',
            ]);
        });
    }
};
