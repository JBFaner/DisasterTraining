<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ai_scenario_configs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('training_module_id')->unique()->constrained()->cascadeOnDelete();
            $table->enum('difficulty', ['easy', 'medium', 'hard'])->default('medium');
            $table->unsignedTinyInteger('number_of_questions')->default(10);
            $table->boolean('is_enabled')->default(false);
            $table->string('scenario_title')->nullable();
            $table->text('generated_scenario')->nullable();
            $table->json('generated_questions')->nullable();
            $table->timestamp('generated_at')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ai_scenario_configs');
    }
};
