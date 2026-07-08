<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('training_modules', function (Blueprint $table) {
            $table->foreignId('lead_trainer_id')
                ->nullable()
                ->after('owner_id')
                ->constrained('users')
                ->nullOnDelete();
            $table->json('trainer_availability')->nullable()->after('lead_trainer_id');
            $table->json('available_training_sessions')->nullable()->after('trainer_availability');
        });
    }

    public function down(): void
    {
        Schema::table('training_modules', function (Blueprint $table) {
            $table->dropConstrainedForeignId('lead_trainer_id');
            $table->dropColumn(['trainer_availability', 'available_training_sessions']);
        });
    }
};
