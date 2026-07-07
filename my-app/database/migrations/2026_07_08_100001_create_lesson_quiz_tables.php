<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lesson_quiz_configs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('training_content_id')->unique()->constrained()->cascadeOnDelete();
            $table->enum('difficulty', ['easy', 'medium', 'hard'])->default('medium');
            $table->unsignedSmallInteger('bank_question_count')->default(30);
            $table->unsignedTinyInteger('quiz_question_count')->default(10);
            $table->string('generation_language', 8)->default('en');
            $table->boolean('is_enabled')->default(false);
            $table->unsignedSmallInteger('time_limit_minutes')->nullable();
            $table->unsignedTinyInteger('max_attempts')->default(3);
            $table->unsignedTinyInteger('passing_score')->default(75);
            $table->boolean('shuffle_questions')->default(true);
            $table->boolean('shuffle_answer_choices')->default(true);
            $table->unsignedBigInteger('current_version_id')->nullable();
            $table->unsignedBigInteger('published_version_id')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('lesson_quiz_versions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lesson_quiz_config_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('version_number')->default(1);
            $table->string('status', 32)->default('ai_generated');
            $table->json('generated_questions')->nullable();
            $table->string('generated_language', 8)->default('en');
            $table->string('change_note')->nullable();
            $table->unsignedBigInteger('parent_version_id')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('approved_at')->nullable();
            $table->timestamp('published_at')->nullable();
            $table->foreignId('published_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('last_edited_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('last_edited_at')->nullable();
            $table->timestamps();

            $table->unique(['lesson_quiz_config_id', 'version_number']);
        });

        Schema::table('lesson_quiz_configs', function (Blueprint $table) {
            $table->foreign('current_version_id')
                ->references('id')
                ->on('lesson_quiz_versions')
                ->nullOnDelete();
            $table->foreign('published_version_id')
                ->references('id')
                ->on('lesson_quiz_versions')
                ->nullOnDelete();
        });

        Schema::create('lesson_quiz_attempts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('training_module_id')->constrained()->cascadeOnDelete();
            $table->foreignId('training_content_id')->constrained()->cascadeOnDelete();
            $table->foreignId('lesson_quiz_config_id')->constrained()->cascadeOnDelete();
            $table->unsignedTinyInteger('attempt_number')->default(1);
            $table->string('status', 32)->default('in_progress');
            $table->unsignedSmallInteger('current_question')->default(1);
            $table->json('generated_questions')->nullable();
            $table->json('question_order')->nullable();
            $table->json('shuffled_choices')->nullable();
            $table->json('participant_answers')->nullable();
            $table->unsignedSmallInteger('score')->nullable();
            $table->decimal('percentage', 5, 2)->nullable();
            $table->boolean('passed')->default(false);
            $table->unsignedSmallInteger('time_limit_minutes')->nullable();
            $table->unsignedInteger('time_remaining_seconds')->nullable();
            $table->string('display_language', 8)->default('en');
            $table->timestamp('started_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamp('last_activity_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamp('submitted_at')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'training_content_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lesson_quiz_attempts');
        Schema::table('lesson_quiz_configs', function (Blueprint $table) {
            $table->dropForeign(['current_version_id']);
            $table->dropForeign(['published_version_id']);
        });
        Schema::dropIfExists('lesson_quiz_versions');
        Schema::dropIfExists('lesson_quiz_configs');
    }
};
