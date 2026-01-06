<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('simulation_events', function (Blueprint $table) {
            $table->dateTime('actual_start_time')->nullable()->after('status');
            $table->unsignedBigInteger('started_by')->nullable()->after('actual_start_time');
            
            // Add foreign key constraint for started_by
            $table->foreign('started_by')->references('id')->on('users')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('simulation_events', function (Blueprint $table) {
            $table->dropForeignKey(['started_by']);
            $table->dropColumn(['actual_start_time', 'started_by']);
        });
    }
};
