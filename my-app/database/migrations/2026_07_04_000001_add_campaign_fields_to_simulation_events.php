<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $needsTrainingModule = ! Schema::hasColumn('simulation_events', 'training_module_id');
        $needsAssignedTrainer = ! Schema::hasColumn('simulation_events', 'assigned_trainer_id');
        $needsTargetAudience = ! Schema::hasColumn('simulation_events', 'target_audience');
        $needsVenue = ! Schema::hasColumn('simulation_events', 'venue');
        $needsRegistrationDeadline = ! Schema::hasColumn('simulation_events', 'registration_deadline');

        if (! $needsTrainingModule && ! $needsAssignedTrainer && ! $needsTargetAudience && ! $needsVenue && ! $needsRegistrationDeadline) {
            return;
        }

        Schema::table('simulation_events', function (Blueprint $table) use (
            $needsTrainingModule,
            $needsAssignedTrainer,
            $needsTargetAudience,
            $needsVenue,
            $needsRegistrationDeadline
        ) {
            if ($needsTrainingModule) {
                $table->foreignId('training_module_id')->nullable()->after('scenario_id')->constrained('training_modules')->nullOnDelete();
            }
            if ($needsAssignedTrainer) {
                $table->foreignId('assigned_trainer_id')->nullable()->after('facilitators')->constrained('users')->nullOnDelete();
            }
            if ($needsTargetAudience) {
                $table->string('target_audience')->nullable()->after('allowed_participant_types');
            }
            if ($needsVenue) {
                $table->string('venue')->nullable()->after('location');
            }
            if ($needsRegistrationDeadline) {
                $table->dateTime('registration_deadline')->nullable()->after('max_participants');
            }
        });
    }

    public function down(): void
    {
        Schema::table('simulation_events', function (Blueprint $table) {
            if (Schema::hasColumn('simulation_events', 'training_module_id')) {
                $table->dropConstrainedForeignId('training_module_id');
            }
            if (Schema::hasColumn('simulation_events', 'assigned_trainer_id')) {
                $table->dropConstrainedForeignId('assigned_trainer_id');
            }
            $columnsToDrop = [];
            if (Schema::hasColumn('simulation_events', 'target_audience')) {
                $columnsToDrop[] = 'target_audience';
            }
            if (Schema::hasColumn('simulation_events', 'venue')) {
                $columnsToDrop[] = 'venue';
            }
            if (Schema::hasColumn('simulation_events', 'registration_deadline')) {
                $columnsToDrop[] = 'registration_deadline';
            }
            if ($columnsToDrop !== []) {
                $table->dropColumn($columnsToDrop);
            }
        });
    }
};
