<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $needsProfileBarangay = ! Schema::hasColumn('barangay_profiles', 'philippine_barangay_id');
        $needsUserBarangay = ! Schema::hasColumn('users', 'philippine_barangay_id');

        Schema::table('barangay_profiles', function (Blueprint $table) use ($needsProfileBarangay) {
            if ($needsProfileBarangay) {
                $table->foreignId('philippine_barangay_id')
                    ->nullable()
                    ->after('id')
                    ->constrained('philippine_barangays')
                    ->nullOnDelete();
            }
            if ($needsProfileBarangay) {
                $table->unique('philippine_barangay_id');
            }
        });

        Schema::table('users', function (Blueprint $table) use ($needsUserBarangay) {
            if ($needsUserBarangay) {
                $table->foreignId('philippine_barangay_id')
                    ->nullable()
                    ->after('barangay_id')
                    ->constrained('philippine_barangays')
                    ->nullOnDelete();
            }
        });
    }

    public function down(): void
    {
        Schema::table('barangay_profiles', function (Blueprint $table) {
            if (Schema::hasColumn('barangay_profiles', 'philippine_barangay_id')) {
                $table->dropConstrainedForeignId('philippine_barangay_id');
            }
        });

        if (Schema::hasColumn('users', 'philippine_barangay_id')) {
            Schema::table('users', function (Blueprint $table) {
                $table->dropConstrainedForeignId('philippine_barangay_id');
            });
        }
    }
};
