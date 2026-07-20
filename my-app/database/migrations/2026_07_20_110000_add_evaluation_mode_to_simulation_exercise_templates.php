<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('simulation_exercise_templates')) {
            return;
        }

        Schema::table('simulation_exercise_templates', function (Blueprint $table) {
            if (! Schema::hasColumn('simulation_exercise_templates', 'evaluation_mode')) {
                $table->string('evaluation_mode', 32)
                    ->default('team')
                    ->after('exercise_type');
            }
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('simulation_exercise_templates')
            || ! Schema::hasColumn('simulation_exercise_templates', 'evaluation_mode')) {
            return;
        }

        Schema::table('simulation_exercise_templates', function (Blueprint $table) {
            $table->dropColumn('evaluation_mode');
        });
    }
};
