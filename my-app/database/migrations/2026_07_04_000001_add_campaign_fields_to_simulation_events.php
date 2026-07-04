<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('simulation_events', function (Blueprint $table) {
            $table->foreignId('training_module_id')->nullable()->after('scenario_id')->constrained('training_modules')->nullOnDelete();
            $table->foreignId('assigned_trainer_id')->nullable()->after('facilitators')->constrained('users')->nullOnDelete();
            $table->string('target_audience')->nullable()->after('allowed_participant_types');
            $table->string('venue')->nullable()->after('location');
            $table->dateTime('registration_deadline')->nullable()->after('max_participants');
        });
    }

    public function down(): void
    {
        Schema::table('simulation_events', function (Blueprint $table) {
            $table->dropConstrainedForeignId('training_module_id');
            $table->dropConstrainedForeignId('assigned_trainer_id');
            $table->dropColumn(['target_audience', 'venue', 'registration_deadline']);
        });
    }
};
