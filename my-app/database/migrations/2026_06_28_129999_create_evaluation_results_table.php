<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('evaluation_results')) {
            return;
        }

        Schema::create('evaluation_results', function (Blueprint $table) {
            $table->id();
            $table->foreignId('participant_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('training_module_id')->constrained()->cascadeOnDelete();
            $table->foreignId('ai_scenario_attempt_id')->nullable()->unique()->constrained()->nullOnDelete();
            $table->string('scenario_title');
            $table->enum('difficulty', ['easy', 'medium', 'hard'])->default('medium');
            $table->unsignedSmallInteger('score')->default(0);
            $table->unsignedSmallInteger('correct_answers')->default(0);
            $table->unsignedSmallInteger('wrong_answers')->default(0);
            $table->unsignedSmallInteger('total_questions')->default(0);
            $table->decimal('percentage', 5, 2)->default(0);
            $table->unsignedTinyInteger('rating')->default(0);
            $table->string('status', 32);
            $table->unsignedTinyInteger('knowledge_score')->default(0);
            $table->unsignedTinyInteger('decision_making_score')->default(0);
            $table->unsignedTinyInteger('emergency_response_score')->default(0);
            $table->unsignedTinyInteger('safety_awareness_score')->default(0);
            $table->text('feedback')->nullable();
            $table->json('recommendations')->nullable();
            $table->json('generated_questions')->nullable();
            $table->json('participant_answers')->nullable();
            $table->boolean('eligible_for_simulation')->default(false);
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            $table->index(['participant_id', 'training_module_id']);
            $table->index('status');
            $table->index('completed_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('evaluation_results');
    }
};
