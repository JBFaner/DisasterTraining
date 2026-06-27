<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('ai_scenario_configs', function (Blueprint $table) {
            $table->string('title_en')->nullable()->after('scenario_title');
            $table->string('title_fil')->nullable()->after('title_en');
            $table->text('description_en')->nullable()->after('generated_scenario');
            $table->text('description_fil')->nullable()->after('description_en');
            $table->text('learning_objectives_en')->nullable()->after('description_fil');
            $table->text('learning_objectives_fil')->nullable()->after('learning_objectives_en');
            $table->string('generation_language', 8)->default('en')->after('number_of_questions');
            $table->string('generated_language', 8)->nullable()->after('generation_language');
            $table->timestamp('translated_at')->nullable()->after('generated_at');
        });

        Schema::table('ai_scenario_attempts', function (Blueprint $table) {
            $table->string('title_en')->nullable()->after('scenario_title');
            $table->string('title_fil')->nullable()->after('title_en');
            $table->text('description_en')->nullable()->after('generated_scenario');
            $table->text('description_fil')->nullable()->after('description_en');
            $table->text('learning_objectives_en')->nullable()->after('description_fil');
            $table->text('learning_objectives_fil')->nullable()->after('learning_objectives_en');
            $table->string('generated_language', 8)->default('en')->after('learning_objectives_fil');
            $table->string('display_language', 8)->default('en')->after('generated_language');
        });

        $this->backfillConfigs();
        $this->backfillAttempts();
    }

    public function down(): void
    {
        Schema::table('ai_scenario_attempts', function (Blueprint $table) {
            $table->dropColumn([
                'title_en',
                'title_fil',
                'description_en',
                'description_fil',
                'learning_objectives_en',
                'learning_objectives_fil',
                'generated_language',
                'display_language',
            ]);
        });

        Schema::table('ai_scenario_configs', function (Blueprint $table) {
            $table->dropColumn([
                'title_en',
                'title_fil',
                'description_en',
                'description_fil',
                'learning_objectives_en',
                'learning_objectives_fil',
                'generation_language',
                'generated_language',
                'translated_at',
            ]);
        });
    }

    protected function backfillConfigs(): void
    {
        $locale = app(\App\Services\AiScenarioLocaleService::class);

        foreach (DB::table('ai_scenario_configs')->orderBy('id')->get() as $row) {
            if (empty($row->scenario_title) && empty($row->generated_scenario)) {
                continue;
            }

            $questions = json_decode($row->generated_questions ?? '[]', true) ?: [];

            DB::table('ai_scenario_configs')->where('id', $row->id)->update([
                'title_en' => $row->scenario_title,
                'title_fil' => $row->scenario_title,
                'description_en' => $row->generated_scenario,
                'description_fil' => $row->generated_scenario,
                'generated_language' => 'en',
                'generation_language' => 'en',
                'generated_questions' => json_encode(array_map(function (array $q) use ($locale) {
                    $bilingual = $locale->normalizeQuestionToBilingual($q, 'en');
                    foreach (['question', 'explanation'] as $field) {
                        if (empty($bilingual["{$field}_fil"])) {
                            $bilingual["{$field}_fil"] = $bilingual["{$field}_en"] ?? '';
                        }
                    }
                    foreach (['a', 'b', 'c', 'd'] as $letter) {
                        if (empty($bilingual["choice_{$letter}_fil"])) {
                            $bilingual["choice_{$letter}_fil"] = $bilingual["choice_{$letter}_en"] ?? '';
                        }
                    }

                    return $bilingual;
                }, $questions)),
            ]);
        }
    }

    protected function backfillAttempts(): void
    {
        $locale = app(\App\Services\AiScenarioLocaleService::class);

        foreach (DB::table('ai_scenario_attempts')->orderBy('id')->get() as $row) {
            if (empty($row->scenario_title) && empty($row->generated_scenario)) {
                continue;
            }

            $questions = json_decode($row->generated_questions ?? '[]', true) ?: [];

            DB::table('ai_scenario_attempts')->where('id', $row->id)->update([
                'title_en' => $row->scenario_title,
                'title_fil' => $row->scenario_title,
                'description_en' => $row->generated_scenario,
                'description_fil' => $row->generated_scenario,
                'generated_language' => 'en',
                'display_language' => 'en',
                'generated_questions' => json_encode(array_map(function (array $q) use ($locale) {
                    $bilingual = $locale->normalizeQuestionToBilingual($q, 'en');
                    foreach (['question', 'explanation'] as $field) {
                        if (empty($bilingual["{$field}_fil"])) {
                            $bilingual["{$field}_fil"] = $bilingual["{$field}_en"] ?? '';
                        }
                    }
                    foreach (['a', 'b', 'c', 'd'] as $letter) {
                        if (empty($bilingual["choice_{$letter}_fil"])) {
                            $bilingual["choice_{$letter}_fil"] = $bilingual["choice_{$letter}_en"] ?? '';
                        }
                    }

                    return $bilingual;
                }, $questions)),
            ]);
        }
    }
};
