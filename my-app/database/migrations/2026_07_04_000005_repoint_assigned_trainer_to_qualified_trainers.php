<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('simulation_events', function (Blueprint $table) {
            $table->dropForeign(['assigned_trainer_id']);
        });

        DB::table('simulation_events')->update(['assigned_trainer_id' => null]);

        Schema::table('simulation_events', function (Blueprint $table) {
            $table->foreign('assigned_trainer_id')
                ->references('id')
                ->on('qualified_trainers')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('simulation_events', function (Blueprint $table) {
            $table->dropForeign(['assigned_trainer_id']);
        });

        DB::table('simulation_events')->update(['assigned_trainer_id' => null]);

        Schema::table('simulation_events', function (Blueprint $table) {
            $table->foreign('assigned_trainer_id')
                ->references('id')
                ->on('users')
                ->nullOnDelete();
        });
    }
};
