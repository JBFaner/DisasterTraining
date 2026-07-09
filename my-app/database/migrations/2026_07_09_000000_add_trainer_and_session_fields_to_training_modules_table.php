<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('training_modules', function (Blueprint $table) {
            if (! Schema::hasColumn('training_modules', 'lead_trainer_id')) {
                $table->foreignId('lead_trainer_id')
                    ->nullable()
                    ->after('owner_id')
                    ->constrained('users')
                    ->nullOnDelete();
            }
            if (! Schema::hasColumn('training_modules', 'trainer_availability')) {
                $table->json('trainer_availability')->nullable()->after('lead_trainer_id');
            }
            if (! Schema::hasColumn('training_modules', 'available_training_sessions')) {
                $table->json('available_training_sessions')->nullable()->after('trainer_availability');
            }
        });
    }

    public function down(): void
    {
        Schema::table('training_modules', function (Blueprint $table) {
            if (Schema::hasColumn('training_modules', 'lead_trainer_id')) {
                $table->dropConstrainedForeignId('lead_trainer_id');
            }
            $columnsToDrop = [];
            foreach (['trainer_availability', 'available_training_sessions'] as $column) {
                if (Schema::hasColumn('training_modules', $column)) {
                    $columnsToDrop[] = $column;
                }
            }
            if ($columnsToDrop !== []) {
                $table->dropColumn($columnsToDrop);
            }
        });
    }
};
