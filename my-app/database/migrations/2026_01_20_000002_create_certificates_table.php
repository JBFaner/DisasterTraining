<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('certificates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('simulation_event_id')->constrained('simulation_events')->cascadeOnDelete();
            $table->foreignId('participant_evaluation_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('certificate_template_id')->nullable()->constrained()->nullOnDelete();
            $table->string('certificate_number')->unique();
            $table->string('type')->default('completion'); // completion, participation
            $table->string('training_type')->nullable();
            $table->date('completion_date')->nullable();
            $table->decimal('final_score', 5, 2)->nullable();
            $table->timestamp('issued_at');
            $table->foreignId('issued_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('file_path')->nullable();
            $table->timestamp('revoked_at')->nullable();
            $table->foreignId('revoked_by')->nullable()->constrained('users')->nullOnDelete();
            $table->text('revoke_reason')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'simulation_event_id', 'type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('certificates');
    }
};
