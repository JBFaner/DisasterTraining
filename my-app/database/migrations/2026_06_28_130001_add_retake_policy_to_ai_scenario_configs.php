<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('ai_scenario_configs', function (Blueprint $table) {
            $table->string('fail_retake_policy', 32)
                ->default('require_lesson_review')
                ->after('passing_score');
        });
    }

    public function down(): void
    {
        Schema::table('ai_scenario_configs', function (Blueprint $table) {
            $table->dropColumn('fail_retake_policy');
        });
    }
};
