<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('training_progress_resets')) {
            return;
        }

        // Allow system/cooldown auto-resets without an admin actor.
        try {
            Schema::table('training_progress_resets', function ($table) {
                $table->dropForeign(['reset_by_user_id']);
            });
        } catch (\Throwable) {
            // FK name may differ across environments.
        }

        $driver = Schema::getConnection()->getDriverName();
        if ($driver === 'mysql') {
            DB::statement('ALTER TABLE training_progress_resets MODIFY reset_by_user_id BIGINT UNSIGNED NULL');
        } elseif ($driver === 'pgsql') {
            DB::statement('ALTER TABLE training_progress_resets ALTER COLUMN reset_by_user_id DROP NOT NULL');
        }

        Schema::table('training_progress_resets', function ($table) {
            $table->foreign('reset_by_user_id')->references('id')->on('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        // Irreversible safely without inventing admin IDs for null rows.
    }
};
