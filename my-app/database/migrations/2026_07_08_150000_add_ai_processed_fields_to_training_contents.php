<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('training_contents', function (Blueprint $table) {
            if (! Schema::hasColumn('training_contents', 'ai_processed_text')) {
                $table->longText('ai_processed_text')->nullable();
            }
            if (! Schema::hasColumn('training_contents', 'ai_processing_status')) {
                $table->string('ai_processing_status', 32)->nullable();
            }
            if (! Schema::hasColumn('training_contents', 'ai_processing_error')) {
                $table->text('ai_processing_error')->nullable();
            }
            if (! Schema::hasColumn('training_contents', 'ai_processed_at')) {
                $table->timestamp('ai_processed_at')->nullable();
            }
        });
    }

    public function down(): void
    {
        Schema::table('training_contents', function (Blueprint $table) {
            $columnsToDrop = [];
            foreach ([
                'ai_processed_text',
                'ai_processing_status',
                'ai_processing_error',
                'ai_processed_at',
            ] as $column) {
                if (Schema::hasColumn('training_contents', $column)) {
                    $columnsToDrop[] = $column;
                }
            }
            if ($columnsToDrop !== []) {
                $table->dropColumn($columnsToDrop);
            }
        });
    }
};
