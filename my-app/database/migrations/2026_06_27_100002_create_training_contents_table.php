<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('training_contents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('training_module_id')->constrained('training_modules')->cascadeOnDelete();
            $table->string('title');
            // text, pdf, youtube, video, image
            $table->string('content_type');
            $table->text('body')->nullable();
            $table->string('file_path')->nullable();
            $table->string('external_url')->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();

            $table->index(['training_module_id', 'sort_order']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('training_contents');
    }
};
