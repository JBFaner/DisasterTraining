<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('ai_scenario_attempts', function (Blueprint $table) {
            $table->unsignedTinyInteger('attempt_number')->default(1)->after('ai_scenario_config_id');
            $table->string('status', 32)->default('in_progress')->after('attempt_number');
            $table->unsignedSmallInteger('current_question')->default(1)->after('status');
            $table->unsignedSmallInteger('time_limit_minutes')->nullable()->after('current_question');
            $table->unsignedInteger('time_remaining_seconds')->nullable()->after('time_limit_minutes');
            $table->timestamp('expires_at')->nullable()->after('started_at');
            $table->timestamp('last_activity_at')->nullable()->after('expires_at');
            $table->timestamp('submitted_at')->nullable()->after('completed_at');
            $table->json('question_order')->nullable()->after('generated_questions');
            $table->json('shuffled_choices')->nullable()->after('question_order');

            $table->index(['user_id', 'training_module_id', 'status']);
        });

        \Illuminate\Support\Facades\DB::table('ai_scenario_attempts')
            ->whereNotNull('completed_at')
            ->update(['status' => 'completed', 'submitted_at' => \Illuminate\Support\Facades\DB::raw('completed_at')]);

        \Illuminate\Support\Facades\DB::table('ai_scenario_attempts')
            ->whereNull('completed_at')
            ->update(['status' => 'in_progress']);
    }

    public function down(): void
    {
        Schema::table('ai_scenario_attempts', function (Blueprint $table) {
            $table->dropIndex(['user_id', 'training_module_id', 'status']);
            $table->dropColumn([
                'attempt_number',
                'status',
                'current_question',
                'time_limit_minutes',
                'time_remaining_seconds',
                'expires_at',
                'last_activity_at',
                'submitted_at',
                'question_order',
                'shuffled_choices',
            ]);
        });
    }
};
