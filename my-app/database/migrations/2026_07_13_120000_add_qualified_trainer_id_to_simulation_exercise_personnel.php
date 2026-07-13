<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('simulation_exercise_personnel', function (Blueprint $table) {
            $table->foreignId('qualified_trainer_id')
                ->nullable()
                ->after('role')
                ->constrained('qualified_trainers')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('simulation_exercise_personnel', function (Blueprint $table) {
            $table->dropConstrainedForeignId('qualified_trainer_id');
        });
    }
};
