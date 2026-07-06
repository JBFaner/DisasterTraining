<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('certificates', 'training_module_id')) {
            Schema::table('certificates', function (Blueprint $table) {
                $table->foreignId('training_module_id')
                    ->nullable()
                    ->after('simulation_event_id')
                    ->constrained('training_modules')
                    ->nullOnDelete();
            });
        }

        if (! Schema::hasColumn('certificates', 'evaluation_result_id')) {
            Schema::table('certificates', function (Blueprint $table) {
                $table->foreignId('evaluation_result_id')
                    ->nullable()
                    ->after('training_module_id')
                    ->constrained('evaluation_results')
                    ->nullOnDelete();
            });
        } else {
            Schema::table('certificates', function (Blueprint $table) {
                $table->foreign('evaluation_result_id')
                    ->references('id')
                    ->on('evaluation_results')
                    ->nullOnDelete();
            });
        }

        if (Schema::getConnection()->getDriverName() === 'mysql') {
            DB::statement('ALTER TABLE certificates MODIFY simulation_event_id BIGINT UNSIGNED NULL');
        }
    }

    public function down(): void
    {
        Schema::table('certificates', function (Blueprint $table) {
            $table->dropForeign(['training_module_id']);
            $table->dropForeign(['evaluation_result_id']);
            $table->dropColumn(['training_module_id', 'evaluation_result_id']);
        });
    }
};
