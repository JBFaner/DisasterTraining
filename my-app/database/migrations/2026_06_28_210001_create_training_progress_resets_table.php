<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('training_progress_resets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('participant_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('training_module_id')->constrained()->cascadeOnDelete();
            $table->foreignId('reset_by_user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('evaluation_result_id')->nullable()->constrained()->nullOnDelete();
            $table->unsignedSmallInteger('cycle_number')->default(1);
            $table->text('reason')->nullable();
            $table->timestamp('reset_at');
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['participant_id', 'training_module_id', 'is_active'], 'tpr_participant_module_active_idx');
            $table->index(['participant_id', 'training_module_id', 'cycle_number'], 'tpr_participant_module_cycle_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('training_progress_resets');
    }
};
