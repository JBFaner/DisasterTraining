<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('campaign_requests', function (Blueprint $table) {
            $table->id();

            $table->foreignId('training_module_id')
                ->constrained('training_modules')
                ->cascadeOnDelete();

            $table->string('submitted_to')->default('Public Safety Campaign Management System');
            $table->string('proposed_session_label')->nullable();

            $table->timestamp('submitted_at')->nullable();
            $table->string('status')->default('waiting_for_approval');

            $table->json('payload')->nullable();
            $table->json('remarks')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('campaign_requests');
    }
};

