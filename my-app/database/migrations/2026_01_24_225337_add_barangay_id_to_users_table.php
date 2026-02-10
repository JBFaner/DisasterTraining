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
        // This migration is a duplicate of an earlier one that already added the column.
        // To avoid "duplicate column" errors (especially on SQLite), only add it if missing.
        if (! Schema::hasColumn('users', 'barangay_id')) {
            Schema::table('users', function (Blueprint $table) {
                $table->unsignedBigInteger('barangay_id')->nullable()->after('id');
                $table->foreign('barangay_id')
                    ->references('id')
                    ->on('barangay_profiles')
                    ->onDelete('set null');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['barangay_id']);
            $table->dropColumn('barangay_id');
        });
    }
};
