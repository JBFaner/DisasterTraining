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
        if (!Schema::hasTable('resources') || !Schema::hasTable('simulation_events')) {
            return;
        }

        Schema::table('resources', function (Blueprint $table) {
            $table->foreign('assigned_to_event_id')
                ->references('id')
                ->on('simulation_events')
                ->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('resources', function (Blueprint $table) {
            $table->dropForeign(['assigned_to_event_id']);
        });
    }
};
