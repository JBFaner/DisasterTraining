<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('evaluation_results', function (Blueprint $table) {
            $table->unsignedSmallInteger('attempt_number')->nullable()->after('ai_scenario_attempt_id');
            $table->unsignedInteger('duration_seconds')->nullable()->after('attempt_number');
        });
    }

    public function down(): void
    {
        Schema::table('evaluation_results', function (Blueprint $table) {
            $table->dropColumn(['attempt_number', 'duration_seconds']);
        });
    }
};
