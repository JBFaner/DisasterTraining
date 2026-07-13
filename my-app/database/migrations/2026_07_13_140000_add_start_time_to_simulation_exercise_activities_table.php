<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('simulation_exercise_activities', function (Blueprint $table) {
            $table->string('start_time', 10)->nullable()->after('duration_minutes');
        });
    }

    public function down(): void
    {
        Schema::table('simulation_exercise_activities', function (Blueprint $table) {
            $table->dropColumn('start_time');
        });
    }
};
