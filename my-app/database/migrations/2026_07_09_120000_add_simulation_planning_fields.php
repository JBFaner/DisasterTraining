<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('campaign_requests', function (Blueprint $table) {
            $table->unsignedInteger('expected_participants')->nullable()->after('status');
            $table->unsignedInteger('minimum_qualified_participants')->nullable()->after('expected_participants');
            $table->unsignedTinyInteger('session_index')->default(0)->after('minimum_qualified_participants');
            $table->timestamp('approved_at')->nullable()->after('submitted_at');
            $table->foreignId('simulation_event_id')->nullable()->after('training_module_id')
                ->constrained('simulation_events')->nullOnDelete();
        });

        Schema::table('simulation_events', function (Blueprint $table) {
            $table->foreignId('campaign_request_id')->nullable()->after('training_module_id')
                ->constrained('campaign_requests')->nullOnDelete();
        });

        Schema::create('simulation_plans', function (Blueprint $table) {
            $table->id();
            $table->foreignId('campaign_request_id')->unique()->constrained('campaign_requests')->cascadeOnDelete();
            $table->string('simulation_scenario')->nullable();
            $table->text('simulation_objectives')->nullable();
            $table->text('simulation_description')->nullable();
            $table->json('team_assignments')->nullable();
            $table->string('team_leader')->nullable();
            $table->text('required_equipment')->nullable();
            $table->text('required_resources')->nullable();
            $table->string('safety_officer')->nullable();
            $table->string('assembly_area')->nullable();
            $table->text('evacuation_route')->nullable();
            $table->text('evaluation_criteria')->nullable();
            $table->string('emergency_contact_person')->nullable();
            $table->text('additional_notes')->nullable();
            $table->string('status')->default('not_created');
            $table->foreignId('created_by_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('simulation_plans');

        Schema::table('simulation_events', function (Blueprint $table) {
            $table->dropConstrainedForeignId('campaign_request_id');
        });

        Schema::table('campaign_requests', function (Blueprint $table) {
            $table->dropConstrainedForeignId('simulation_event_id');
            $table->dropColumn([
                'expected_participants',
                'minimum_qualified_participants',
                'session_index',
                'approved_at',
            ]);
        });
    }
};
