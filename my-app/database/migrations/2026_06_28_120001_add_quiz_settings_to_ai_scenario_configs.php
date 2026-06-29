<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('ai_scenario_configs', function (Blueprint $table) {
            $table->unsignedSmallInteger('time_limit_minutes')->default(60)->after('number_of_questions');
            $table->unsignedTinyInteger('max_attempts')->default(3)->after('time_limit_minutes');
            $table->unsignedTinyInteger('passing_score')->default(75)->after('max_attempts');
            $table->boolean('auto_submit_on_expire')->default(true)->after('passing_score');
            $table->boolean('allow_resume_attempt')->default(true)->after('auto_submit_on_expire');
            $table->boolean('shuffle_questions')->default(true)->after('allow_resume_attempt');
            $table->boolean('shuffle_answer_choices')->default(true)->after('shuffle_questions');
        });
    }

    public function down(): void
    {
        Schema::table('ai_scenario_configs', function (Blueprint $table) {
            $table->dropColumn([
                'time_limit_minutes',
                'max_attempts',
                'passing_score',
                'auto_submit_on_expire',
                'allow_resume_attempt',
                'shuffle_questions',
                'shuffle_answer_choices',
            ]);
        });
    }
};
