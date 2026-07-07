<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('training_contents', function (Blueprint $table) {
            $table->longText('ai_processed_text')->nullable()->after('external_url');
            $table->string('ai_processing_status', 32)->nullable()->after('ai_processed_text');
            $table->text('ai_processing_error')->nullable()->after('ai_processing_status');
            $table->timestamp('ai_processed_at')->nullable()->after('ai_processing_error');
        });
    }

    public function down(): void
    {
        Schema::table('training_contents', function (Blueprint $table) {
            $table->dropColumn([
                'ai_processed_text',
                'ai_processing_status',
                'ai_processing_error',
                'ai_processed_at',
            ]);
        });
    }
};
