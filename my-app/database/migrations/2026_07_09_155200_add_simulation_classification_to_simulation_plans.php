<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('simulation_plans', function (Blueprint $table) {
            $table->string('exercise_type')->nullable()->after('campaign_request_id');
            $table->string('exercise_complexity')->nullable()->after('exercise_type');
            $table->string('estimated_duration')->nullable()->after('exercise_complexity');
            $table->unsignedInteger('estimated_responders')->nullable()->after('estimated_duration');
            $table->unsignedInteger('estimated_observers')->nullable()->after('estimated_responders');
            $table->unsignedInteger('estimated_evaluators')->nullable()->after('estimated_observers');
        });
    }

    public function down(): void
    {
        Schema::table('simulation_plans', function (Blueprint $table) {
            $table->dropColumn([
                'exercise_type',
                'exercise_complexity',
                'estimated_duration',
                'estimated_responders',
                'estimated_observers',
                'estimated_evaluators',
            ]);
        });
    }
};
