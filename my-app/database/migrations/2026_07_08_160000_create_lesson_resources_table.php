<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('lesson_resources')) {
            return;
        }

        Schema::create('lesson_resources', function (Blueprint $table) {
            $table->id();
            $table->foreignId('training_content_id')->constrained('training_contents')->cascadeOnDelete();
            $table->string('title');
            $table->string('resource_type');
            $table->text('body')->nullable();
            $table->string('file_path')->nullable();
            $table->string('external_url')->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->longText('ai_processed_text')->nullable();
            $table->string('ai_processing_status', 32)->nullable();
            $table->text('ai_processing_error')->nullable();
            $table->timestamp('ai_processed_at')->nullable();
            $table->timestamps();

            $table->index(['training_content_id', 'sort_order']);
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('lesson_resources')) {
            return;
        }

        Schema::dropIfExists('lesson_resources');
    }
};
