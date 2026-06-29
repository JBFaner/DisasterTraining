<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('ai_scenario_attempts', function (Blueprint $table) {
            $table->unsignedSmallInteger('training_cycle')->default(1)->after('attempt_number');
            $table->index(['user_id', 'training_module_id', 'training_cycle', 'status'], 'asa_user_module_cycle_status_idx');
        });
    }

    public function down(): void
    {
        Schema::table('ai_scenario_attempts', function (Blueprint $table) {
            $table->dropIndex('asa_user_module_cycle_status_idx');
            $table->dropColumn('training_cycle');
        });
    }
};
