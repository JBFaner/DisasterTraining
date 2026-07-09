<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('simulation_plans', function (Blueprint $table) {
            $table->string('simulation_title')->nullable()->after('campaign_request_id');
            $table->string('lead_coordinator')->nullable()->after('team_assignments');
            $table->string('planning_officer')->nullable()->after('lead_coordinator');
            $table->text('medical_team')->nullable()->after('safety_officer');
            $table->text('rescue_team')->nullable()->after('medical_team');
            $table->text('communication_team')->nullable()->after('rescue_team');
            $table->text('remarks')->nullable()->after('emergency_contact_person');
        });
    }

    public function down(): void
    {
        Schema::table('simulation_plans', function (Blueprint $table) {
            $table->dropColumn([
                'simulation_title',
                'lead_coordinator',
                'planning_officer',
                'medical_team',
                'rescue_team',
                'communication_team',
                'remarks',
            ]);
        });
    }
};
