<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('ai_scenario_configs', function (Blueprint $table) {
            $table->unsignedSmallInteger('bank_question_count')->default(20)->after('number_of_questions');
            $table->unsignedTinyInteger('quiz_question_count')->default(10)->after('bank_question_count');
        });

        DB::table('ai_scenario_configs')->orderBy('id')->get()->each(function ($config) {
            $legacyCount = (int) ($config->number_of_questions ?? 20);
            $bankCount = match (true) {
                $legacyCount <= 10 => 10,
                $legacyCount >= 30 => 30,
                default => 20,
            };
            $quizCount = match ($bankCount) {
                10 => 5,
                30 => 15,
                default => 10,
            };

            DB::table('ai_scenario_configs')
                ->where('id', $config->id)
                ->update([
                    'bank_question_count' => $bankCount,
                    'quiz_question_count' => $quizCount,
                    'number_of_questions' => $bankCount,
                ]);
        });

        DB::table('ai_scenario_configs')
            ->whereNotNull('published_version_id')
            ->update(['is_enabled' => true]);
    }

    public function down(): void
    {
        Schema::table('ai_scenario_configs', function (Blueprint $table) {
            $table->dropColumn(['bank_question_count', 'quiz_question_count']);
        });
    }
};
