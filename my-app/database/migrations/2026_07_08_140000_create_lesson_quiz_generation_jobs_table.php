<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('lesson_quiz_generation_jobs')) {
            return;
        }

        Schema::create('lesson_quiz_generation_jobs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lesson_quiz_config_id')->constrained()->cascadeOnDelete();
            $table->foreignId('requested_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('status', 48)->default('queued');
            $table->boolean('auto_translate_fil')->default(true);
            $table->text('error_message')->nullable();
            $table->foreignId('lesson_quiz_version_id')->nullable()->constrained('lesson_quiz_versions')->nullOnDelete();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamp('failed_at')->nullable();
            $table->timestamps();

            $table->index(['lesson_quiz_config_id', 'status']);
            $table->index(['requested_by', 'status']);
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('lesson_quiz_generation_jobs')) {
            return;
        }

        Schema::dropIfExists('lesson_quiz_generation_jobs');
    }
};
