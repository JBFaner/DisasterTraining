<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('simulation_exercise_templates', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('category');
            $table->string('exercise_type');
            $table->string('difficulty_level')->default('Intermediate');
            $table->unsignedSmallInteger('estimated_duration_minutes')->nullable();
            $table->text('objectives')->nullable();
            $table->text('scenario_summary')->nullable();
            $table->text('expected_hazards')->nullable();
            $table->text('learning_objectives')->nullable();
            $table->text('safety_reminders')->nullable();
            $table->string('status')->default('draft');
            $table->foreignId('created_by_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('simulation_exercise_activities', function (Blueprint $table) {
            $table->id();
            $table->foreignId('template_id')->constrained('simulation_exercise_templates')->cascadeOnDelete();
            $table->string('title');
            $table->text('description')->nullable();
            $table->unsignedSmallInteger('duration_minutes')->default(15);
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::create('simulation_exercise_activity_equipment', function (Blueprint $table) {
            $table->id();
            $table->foreignId('template_id')->constrained('simulation_exercise_templates')->cascadeOnDelete();
            $table->foreignId('activity_id')->nullable()->constrained('simulation_exercise_activities')->cascadeOnDelete();
            $table->foreignId('resource_id')->constrained('resources')->cascadeOnDelete();
            $table->unsignedInteger('required_quantity')->default(1);
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::create('simulation_exercise_personnel', function (Blueprint $table) {
            $table->id();
            $table->foreignId('template_id')->constrained('simulation_exercise_templates')->cascadeOnDelete();
            $table->string('role');
            $table->unsignedSmallInteger('recommended_count')->default(1);
            $table->text('notes')->nullable();
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::create('simulation_exercise_timeline_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('template_id')->constrained('simulation_exercise_templates')->cascadeOnDelete();
            $table->string('start_time', 10);
            $table->string('label');
            $table->text('description')->nullable();
            $table->foreignId('activity_id')->nullable()->constrained('simulation_exercise_activities')->nullOnDelete();
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::create('simulation_exercise_evaluation_objectives', function (Blueprint $table) {
            $table->id();
            $table->foreignId('template_id')->constrained('simulation_exercise_templates')->cascadeOnDelete();
            $table->foreignId('activity_id')->nullable()->constrained('simulation_exercise_activities')->nullOnDelete();
            $table->string('heading')->nullable();
            $table->string('objective_text');
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::table('simulation_events', function (Blueprint $table) {
            $table->foreignId('simulation_exercise_template_id')
                ->nullable()
                ->after('campaign_request_id')
                ->constrained('simulation_exercise_templates')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('simulation_events', function (Blueprint $table) {
            $table->dropConstrainedForeignId('simulation_exercise_template_id');
        });

        Schema::dropIfExists('simulation_exercise_evaluation_objectives');
        Schema::dropIfExists('simulation_exercise_timeline_items');
        Schema::dropIfExists('simulation_exercise_personnel');
        Schema::dropIfExists('simulation_exercise_activity_equipment');
        Schema::dropIfExists('simulation_exercise_activities');
        Schema::dropIfExists('simulation_exercise_templates');
    }
};
