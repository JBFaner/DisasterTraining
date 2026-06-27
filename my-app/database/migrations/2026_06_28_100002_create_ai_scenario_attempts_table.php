<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ai_scenario_attempts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('training_module_id')->constrained()->cascadeOnDelete();
            $table->foreignId('ai_scenario_config_id')->nullable()->constrained()->nullOnDelete();
            $table->string('scenario_title');
            $table->text('generated_scenario');
            $table->json('generated_questions');
            $table->json('participant_answers')->nullable();
            $table->unsignedSmallInteger('score')->default(0);
            $table->decimal('percentage', 5, 2)->default(0);
            $table->enum('difficulty', ['easy', 'medium', 'hard']);
            $table->unsignedTinyInteger('number_of_questions');
            $table->boolean('passed')->default(false);
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'training_module_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ai_scenario_attempts');
    }
};
