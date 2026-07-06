<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ai_scenario_assessment_versions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ai_scenario_config_id')->constrained()->cascadeOnDelete();
            $table->unsignedSmallInteger('version_number');
            $table->string('status', 32)->default('ai_generated');
            $table->string('disaster_type')->nullable();
            $table->string('difficulty', 16)->nullable();
            $table->unsignedSmallInteger('estimated_time_minutes')->nullable();
            $table->string('scenario_title')->nullable();
            $table->string('title_en')->nullable();
            $table->string('title_fil')->nullable();
            $table->text('generated_scenario')->nullable();
            $table->text('description_en')->nullable();
            $table->text('description_fil')->nullable();
            $table->text('learning_objectives_en')->nullable();
            $table->text('learning_objectives_fil')->nullable();
            $table->json('generated_questions')->nullable();
            $table->string('generated_language', 8)->nullable();
            $table->string('change_note')->nullable();
            $table->foreignId('parent_version_id')->nullable()->constrained('ai_scenario_assessment_versions')->nullOnDelete();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('approved_at')->nullable();
            $table->timestamp('published_at')->nullable();
            $table->timestamps();

            $table->unique(['ai_scenario_config_id', 'version_number'], 'ai_scenario_ver_config_num_uq');
            $table->index(['ai_scenario_config_id', 'status'], 'ai_scenario_ver_config_status_idx');
        });

        Schema::table('ai_scenario_configs', function (Blueprint $table) {
            $table->foreignId('current_version_id')->nullable()->after('shuffle_answer_choices')
                ->constrained('ai_scenario_assessment_versions')->nullOnDelete();
            $table->foreignId('published_version_id')->nullable()->after('current_version_id')
                ->constrained('ai_scenario_assessment_versions')->nullOnDelete();
        });

        $this->migrateExistingConfigs();
    }

    public function down(): void
    {
        Schema::table('ai_scenario_configs', function (Blueprint $table) {
            $table->dropConstrainedForeignId('published_version_id');
            $table->dropConstrainedForeignId('current_version_id');
        });

        Schema::dropIfExists('ai_scenario_assessment_versions');
    }

    private function migrateExistingConfigs(): void
    {
        if (! Schema::hasTable('ai_scenario_configs')) {
            return;
        }

        $configs = DB::table('ai_scenario_configs')
            ->whereNotNull('generated_questions')
            ->get();

        foreach ($configs as $config) {
            $questions = json_decode($config->generated_questions, true);
            if (! is_array($questions) || $questions === []) {
                continue;
            }

            $questions = array_map(function (array $question) {
                $question['status'] = $question['status'] ?? 'published';

                return $question;
            }, $questions);

            $versionId = DB::table('ai_scenario_assessment_versions')->insertGetId([
                'ai_scenario_config_id' => $config->id,
                'version_number' => 1,
                'status' => $config->is_enabled ? 'published' : 'ai_generated',
                'disaster_type' => null,
                'difficulty' => $config->difficulty,
                'estimated_time_minutes' => $config->time_limit_minutes,
                'scenario_title' => $config->scenario_title,
                'title_en' => $config->title_en,
                'title_fil' => $config->title_fil,
                'generated_scenario' => $config->generated_scenario,
                'description_en' => $config->description_en,
                'description_fil' => $config->description_fil,
                'learning_objectives_en' => $config->learning_objectives_en,
                'learning_objectives_fil' => $config->learning_objectives_fil,
                'generated_questions' => json_encode($questions),
                'generated_language' => $config->generated_language,
                'change_note' => 'Migrated from legacy configuration',
                'created_by' => $config->created_by,
                'published_at' => $config->is_enabled ? $config->generated_at : null,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            DB::table('ai_scenario_configs')->where('id', $config->id)->update([
                'current_version_id' => $versionId,
                'published_version_id' => $config->is_enabled ? $versionId : null,
            ]);
        }
    }
};
