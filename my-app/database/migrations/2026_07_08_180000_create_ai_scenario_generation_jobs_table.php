<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('ai_scenario_generation_jobs')) {
            return;
        }

        Schema::create('ai_scenario_generation_jobs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ai_scenario_config_id')->constrained()->cascadeOnDelete();
            $table->foreignId('requested_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('status', 48)->default('queued');
            $table->text('error_message')->nullable();
            $table->unsignedBigInteger('ai_scenario_assessment_version_id')->nullable();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamp('failed_at')->nullable();
            $table->timestamps();

            $table->foreign('ai_scenario_assessment_version_id', 'as_gen_jobs_version_fk')
                ->references('id')
                ->on('ai_scenario_assessment_versions')
                ->nullOnDelete();

            $table->index(['ai_scenario_config_id', 'status']);
            $table->index(['requested_by', 'status']);
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('ai_scenario_generation_jobs')) {
            return;
        }

        Schema::dropIfExists('ai_scenario_generation_jobs');
    }
};
