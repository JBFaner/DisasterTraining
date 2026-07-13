<?php

namespace App\Services;

use App\Models\AiScenarioAssessmentVersion;
use App\Models\AiScenarioConfig;
use App\Models\TrainingModule;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class AiScenarioWorkflowService
{
    public function __construct(
        private readonly AiScenarioLocaleService $localeService,
        private readonly AiScenarioTranslationService $translationService,
        private readonly GeminiService $gemini,
    ) {}

    /**
     * @param  array<string, mixed>  $bilingualContent
     */
    public function createVersionFromGeneration(
        AiScenarioConfig $config,
        array $bilingualContent,
        string $changeNote = 'AI Generated',
    ): AiScenarioAssessmentVersion {
        return DB::transaction(function () use ($config, $bilingualContent, $changeNote) {
            $versionNumber = $this->nextVersionNumber($config);
            $questions = $this->normalizeQuestionsForStorage($bilingualContent['generated_questions'] ?? []);

            $version = AiScenarioAssessmentVersion::create([
                'ai_scenario_config_id' => $config->id,
                'version_number' => $versionNumber,
                'status' => AiScenarioAssessmentVersion::STATUS_AI_GENERATED,
                'disaster_type' => $bilingualContent['disaster_type'] ?? $config->trainingModule?->category,
                'difficulty' => $config->difficulty,
                'estimated_time_minutes' => $config->time_limit_minutes,
                'scenario_title' => $bilingualContent['scenario_title'] ?? $bilingualContent['title_en'] ?? null,
                'title_en' => $bilingualContent['title_en'] ?? null,
                'title_fil' => $bilingualContent['title_fil'] ?? null,
                'generated_scenario' => $bilingualContent['generated_scenario'] ?? $bilingualContent['description_en'] ?? null,
                'description_en' => $bilingualContent['description_en'] ?? null,
                'description_fil' => $bilingualContent['description_fil'] ?? null,
                'learning_objectives_en' => $bilingualContent['learning_objectives_en'] ?? null,
                'learning_objectives_fil' => $bilingualContent['learning_objectives_fil'] ?? null,
                'generated_questions' => $questions,
                'generated_language' => $bilingualContent['generated_language'] ?? 'en',
                'change_note' => $changeNote,
                'parent_version_id' => $config->current_version_id,
                'created_by' => portal_id(),
            ]);

            $config->update([
                'current_version_id' => $version->id,
                'is_enabled' => false,
            ]);

            return $version->fresh(['creator', 'config.trainingModule']);
        });
    }

    /**
     * @param  array<string, mixed>  $bilingualContent
     */
    public function replaceDraftFromGeneration(
        AiScenarioAssessmentVersion $version,
        array $bilingualContent,
        string $changeNote = 'AI Regenerated',
    ): AiScenarioAssessmentVersion {
        if (in_array($version->status, [
            AiScenarioAssessmentVersion::STATUS_PUBLISHED,
            AiScenarioAssessmentVersion::STATUS_ARCHIVED,
        ], true)) {
            throw ValidationException::withMessages([
                'version' => 'Published or archived versions cannot be replaced. Generate a new version instead.',
            ]);
        }

        return DB::transaction(function () use ($version, $bilingualContent, $changeNote) {
            $questions = $this->normalizeQuestionsForStorage($bilingualContent['generated_questions'] ?? []);
            $config = $version->config()->firstOrFail();

            $version->update([
                'status' => AiScenarioAssessmentVersion::STATUS_AI_GENERATED,
                'disaster_type' => $bilingualContent['disaster_type'] ?? $config->trainingModule?->category,
                'difficulty' => $config->difficulty,
                'estimated_time_minutes' => $config->time_limit_minutes,
                'scenario_title' => $bilingualContent['scenario_title'] ?? $bilingualContent['title_en'] ?? null,
                'title_en' => $bilingualContent['title_en'] ?? null,
                'title_fil' => $bilingualContent['title_fil'] ?? null,
                'generated_scenario' => $bilingualContent['generated_scenario'] ?? $bilingualContent['description_en'] ?? null,
                'description_en' => $bilingualContent['description_en'] ?? null,
                'description_fil' => $bilingualContent['description_fil'] ?? null,
                'learning_objectives_en' => $bilingualContent['learning_objectives_en'] ?? null,
                'learning_objectives_fil' => $bilingualContent['learning_objectives_fil'] ?? null,
                'generated_questions' => $questions,
                'generated_language' => $bilingualContent['generated_language'] ?? 'en',
                'change_note' => $changeNote,
                'approved_by' => null,
                'approved_at' => null,
                'published_at' => null,
                'published_by' => null,
                'last_edited_by' => null,
                'last_edited_at' => null,
            ]);

            $config->update([
                'current_version_id' => $version->id,
                'is_enabled' => false,
            ]);

            return $version->fresh(['creator', 'config.trainingModule']);
        });
    }

    /**
     * @param  array<string, mixed>  $scenarioData
     */
    public function updateScenario(AiScenarioAssessmentVersion $version, array $scenarioData): AiScenarioAssessmentVersion
    {
        $version = $this->resolveEditableVersion($version, 'Edited by Administrator');

        $version->fill([
            'title_en' => $scenarioData['title_en'] ?? $version->title_en,
            'title_fil' => $scenarioData['title_fil'] ?? $version->title_fil,
            'description_en' => $scenarioData['description_en'] ?? $version->description_en,
            'description_fil' => $scenarioData['description_fil'] ?? $version->description_fil,
            'learning_objectives_en' => $scenarioData['learning_objectives_en'] ?? $version->learning_objectives_en,
            'learning_objectives_fil' => $scenarioData['learning_objectives_fil'] ?? $version->learning_objectives_fil,
            'disaster_type' => $scenarioData['disaster_type'] ?? $version->disaster_type,
            'difficulty' => $scenarioData['difficulty'] ?? $version->difficulty,
            'estimated_time_minutes' => $scenarioData['estimated_time_minutes'] ?? $version->estimated_time_minutes,
            'scenario_title' => $scenarioData['title_en'] ?? $version->scenario_title,
            'generated_scenario' => $scenarioData['description_en'] ?? $version->generated_scenario,
            'status' => AiScenarioAssessmentVersion::STATUS_UNDER_REVIEW,
        ]);
        $this->touchDraftEdit($version);
        $version->save();

        return $version->fresh();
    }

    /**
     * @param  array<string, mixed>  $questionData
     */
    public function addManualQuestion(AiScenarioAssessmentVersion $version, array $questionData): AiScenarioAssessmentVersion
    {
        $version = $this->resolveEditableVersion($version, 'Manual question added');

        $questions = $version->generated_questions ?? [];
        $number = (int) ($questionData['number'] ?? (count($questions) + 1));
        $questions[] = $this->buildQuestionRecord($questionData, $number, true);

        $version->generated_questions = $this->renumberQuestions($questions);
        $version->status = AiScenarioAssessmentVersion::STATUS_UNDER_REVIEW;
        $this->touchDraftEdit($version);
        $version->save();

        return $version->fresh();
    }

    /**
     * @param  array<string, mixed>  $questionData
     */
    public function updateQuestion(
        AiScenarioAssessmentVersion $version,
        int $questionNumber,
        array $questionData,
    ): AiScenarioAssessmentVersion {
        $version = $this->resolveEditableVersion($version, 'Question edited by administrator');

        $questions = $version->generated_questions ?? [];
        $found = false;

        foreach ($questions as $index => $question) {
            if ((int) ($question['number'] ?? 0) === $questionNumber) {
                $questions[$index] = array_merge($question, $this->buildQuestionRecord(
                    array_merge($question, $questionData),
                    $questionNumber,
                    (bool) ($question['is_manual'] ?? false),
                ));
                $questions[$index]['status'] = AiScenarioAssessmentVersion::QUESTION_STATUS_UNDER_REVIEW;
                $found = true;
                break;
            }
        }

        if (! $found) {
            throw ValidationException::withMessages(['question' => 'Question not found.']);
        }

        $version->generated_questions = $questions;
        $version->status = AiScenarioAssessmentVersion::STATUS_UNDER_REVIEW;
        $this->touchDraftEdit($version);
        $version->save();

        return $version->fresh();
    }

    /**
     * @param  array<int, array<string, mixed>>  $items
     */
    public function bulkUpdateQuestions(AiScenarioAssessmentVersion $version, array $items): AiScenarioAssessmentVersion
    {
        $version = $this->resolveEditableVersion($version, 'Questions bulk saved by administrator');

        $questions = $version->generated_questions ?? [];

        foreach ($items as $item) {
            $questionNumber = (int) ($item['number'] ?? 0);
            if ($questionNumber < 1) {
                continue;
            }

            foreach ($questions as $index => $question) {
                if ((int) ($question['number'] ?? 0) !== $questionNumber) {
                    continue;
                }

                $questions[$index] = array_merge($question, $this->buildQuestionRecord(
                    array_merge($question, $item),
                    $questionNumber,
                    (bool) ($question['is_manual'] ?? false),
                ));
                $questions[$index]['status'] = AiScenarioAssessmentVersion::QUESTION_STATUS_UNDER_REVIEW;
                break;
            }
        }

        $version->generated_questions = $questions;
        $version->status = AiScenarioAssessmentVersion::STATUS_UNDER_REVIEW;
        $this->touchDraftEdit($version);
        $version->save();

        return $version->fresh();
    }

    public function deleteQuestion(AiScenarioAssessmentVersion $version, int $questionNumber): AiScenarioAssessmentVersion
    {
        $version = $this->resolveEditableVersion($version, 'Question removed');

        $questions = array_values(array_filter(
            $version->generated_questions ?? [],
            fn (array $q) => (int) ($q['number'] ?? 0) !== $questionNumber,
        ));

        $version->generated_questions = $this->renumberQuestions($questions);
        $version->status = AiScenarioAssessmentVersion::STATUS_UNDER_REVIEW;
        $this->touchDraftEdit($version);
        $version->save();

        return $version->fresh();
    }

    public function duplicateQuestion(AiScenarioAssessmentVersion $version, int $questionNumber): AiScenarioAssessmentVersion
    {
        $version = $this->resolveEditableVersion($version, 'Question duplicated');

        $questions = $version->generated_questions ?? [];
        $source = collect($questions)->firstWhere('number', $questionNumber);

        if (! $source) {
            throw ValidationException::withMessages(['question' => 'Question not found.']);
        }

        $copy = $source;
        $copy['number'] = count($questions) + 1;
        $copy['status'] = AiScenarioAssessmentVersion::QUESTION_STATUS_UNDER_REVIEW;
        $copy['is_manual'] = true;
        $questions[] = $copy;

        $version->generated_questions = $this->renumberQuestions($questions);
        $version->status = AiScenarioAssessmentVersion::STATUS_UNDER_REVIEW;
        $this->touchDraftEdit($version);
        $version->save();

        return $version->fresh();
    }

    public function regenerateQuestion(AiScenarioAssessmentVersion $version, int $questionNumber): AiScenarioAssessmentVersion
    {
        $version = $this->resolveEditableVersion($version, 'Question regenerated by AI');
        $config = $version->config()->with('trainingModule')->firstOrFail();
        $module = $config->trainingModule;
        $locale = $this->localeService->resolveLocale($version->generated_language);
        $scenarioContext = $version->description_en ?: $version->generated_scenario;

        $raw = $this->gemini->generateSingleQuizQuestion(
            $module,
            (string) ($version->difficulty ?? $config->difficulty),
            $locale,
            $questionNumber,
            $scenarioContext,
        );

        $targetLocale = $locale === 'en' ? 'fil' : 'en';
        $translated = $this->translationService->translateScenarioQuiz(
            ['questions' => [$raw]],
            $locale,
            $targetLocale,
        );
        $bilingual = $this->localeService->mergeSourceAndTranslation(
            ['questions' => [$raw]],
            $translated,
            $locale,
        );
        $merged = $bilingual['generated_questions'][0] ?? $raw;

        $questions = $version->generated_questions ?? [];
        $found = false;

        foreach ($questions as $index => $question) {
            if ((int) ($question['number'] ?? 0) === $questionNumber) {
                $record = $this->buildQuestionRecord($merged, $questionNumber, false);
                $record['status'] = AiScenarioAssessmentVersion::QUESTION_STATUS_AI_GENERATED;
                $questions[$index] = $record;
                $found = true;
                break;
            }
        }

        if (! $found) {
            throw ValidationException::withMessages(['question' => 'Question not found.']);
        }

        $version->generated_questions = $questions;
        $version->status = AiScenarioAssessmentVersion::STATUS_UNDER_REVIEW;
        $this->touchDraftEdit($version);
        $version->save();

        return $version->fresh();
    }

    public function saveDraft(AiScenarioAssessmentVersion $version): AiScenarioAssessmentVersion
    {
        if (in_array($version->status, [
            AiScenarioAssessmentVersion::STATUS_PUBLISHED,
            AiScenarioAssessmentVersion::STATUS_ARCHIVED,
        ], true)) {
            throw ValidationException::withMessages([
                'version' => 'Published or archived versions cannot be returned to draft.',
            ]);
        }

        $version->update(['status' => AiScenarioAssessmentVersion::STATUS_UNDER_REVIEW]);

        return $version->fresh();
    }

    public function approveVersion(AiScenarioAssessmentVersion $version): AiScenarioAssessmentVersion
    {
        $this->validateForPublish($version->config, $version);

        $questions = array_map(function (array $question) {
            if (($question['status'] ?? '') !== AiScenarioAssessmentVersion::QUESTION_STATUS_ARCHIVED) {
                $question['status'] = AiScenarioAssessmentVersion::QUESTION_STATUS_APPROVED;
            }

            return $question;
        }, $version->generated_questions ?? []);

        $version->update([
            'generated_questions' => $questions,
            'status' => AiScenarioAssessmentVersion::STATUS_APPROVED,
            'approved_by' => portal_id(),
            'approved_at' => now(),
        ]);

        return $version->fresh(['approver', 'creator']);
    }

    public function publishVersion(AiScenarioAssessmentVersion $version): AiScenarioAssessmentVersion
    {
        if ($version->status === AiScenarioAssessmentVersion::STATUS_PUBLISHED) {
            throw ValidationException::withMessages([
                'status' => 'This assessment is already published.',
            ]);
        }

        if ($version->status !== AiScenarioAssessmentVersion::STATUS_APPROVED) {
            if (! in_array($version->status, AiScenarioAssessmentVersion::EDITABLE_STATUSES, true)) {
                throw ValidationException::withMessages([
                    'status' => 'This assessment cannot be published.',
                ]);
            }

            $version = $this->approveVersion($version);
        }

        $this->validateForPublish($version->config, $version);

        return DB::transaction(function () use ($version) {
            $config = $version->config;

            AiScenarioAssessmentVersion::query()
                ->where('ai_scenario_config_id', $config->id)
                ->where('status', AiScenarioAssessmentVersion::STATUS_PUBLISHED)
                ->update(['status' => AiScenarioAssessmentVersion::STATUS_ARCHIVED]);

            $questions = array_map(function (array $question) {
                if (($question['status'] ?? '') !== AiScenarioAssessmentVersion::QUESTION_STATUS_ARCHIVED) {
                    $question['status'] = AiScenarioAssessmentVersion::QUESTION_STATUS_PUBLISHED;
                }

                return $question;
            }, $version->generated_questions ?? []);

            $version->update([
                'generated_questions' => $questions,
                'status' => AiScenarioAssessmentVersion::STATUS_PUBLISHED,
                'published_at' => now(),
                'published_by' => portal_id(),
            ]);

            $config->update([
                'published_version_id' => $version->id,
                'current_version_id' => $version->id,
                'is_enabled' => true,
                'scenario_title' => $version->scenario_title,
                'title_en' => $version->title_en,
                'title_fil' => $version->title_fil,
                'generated_scenario' => $version->generated_scenario,
                'description_en' => $version->description_en,
                'description_fil' => $version->description_fil,
                'learning_objectives_en' => $version->learning_objectives_en,
                'learning_objectives_fil' => $version->learning_objectives_fil,
                'generated_questions' => $questions,
                'generated_language' => $version->generated_language,
            ]);

            return $version->fresh(['config.trainingModule', 'creator', 'approver', 'publisher', 'lastEditor']);
        });
    }

    protected function touchDraftEdit(AiScenarioAssessmentVersion $version): void
    {
        $version->last_edited_by = portal_id();
        $version->last_edited_at = now();
    }

    public function restoreVersion(AiScenarioAssessmentVersion $source): AiScenarioAssessmentVersion
    {
        $config = $source->config;

        return DB::transaction(function () use ($source, $config) {
            $versionNumber = $this->nextVersionNumber($config);
            $questions = $this->normalizeQuestionsForStorage($source->generated_questions ?? []);

            $version = AiScenarioAssessmentVersion::create([
                'ai_scenario_config_id' => $config->id,
                'version_number' => $versionNumber,
                'status' => AiScenarioAssessmentVersion::STATUS_UNDER_REVIEW,
                'disaster_type' => $source->disaster_type,
                'difficulty' => $source->difficulty,
                'estimated_time_minutes' => $source->estimated_time_minutes,
                'scenario_title' => $source->scenario_title,
                'title_en' => $source->title_en,
                'title_fil' => $source->title_fil,
                'generated_scenario' => $source->generated_scenario,
                'description_en' => $source->description_en,
                'description_fil' => $source->description_fil,
                'learning_objectives_en' => $source->learning_objectives_en,
                'learning_objectives_fil' => $source->learning_objectives_fil,
                'generated_questions' => $questions,
                'generated_language' => $source->generated_language,
                'change_note' => 'Restored from version '.$source->version_number,
                'parent_version_id' => $source->id,
                'created_by' => portal_id(),
            ]);

            $config->update(['current_version_id' => $version->id]);

            return $version->fresh();
        });
    }

    public function duplicateVersion(AiScenarioAssessmentVersion $source): AiScenarioAssessmentVersion
    {
        $config = $source->config;

        return DB::transaction(function () use ($source, $config) {
            $versionNumber = $this->nextVersionNumber($config);

            $version = AiScenarioAssessmentVersion::create([
                ...$source->only([
                    'disaster_type', 'difficulty', 'estimated_time_minutes', 'scenario_title',
                    'title_en', 'title_fil', 'generated_scenario', 'description_en', 'description_fil',
                    'learning_objectives_en', 'learning_objectives_fil', 'generated_language',
                ]),
                'ai_scenario_config_id' => $config->id,
                'version_number' => $versionNumber,
                'status' => AiScenarioAssessmentVersion::STATUS_UNDER_REVIEW,
                'generated_questions' => $this->normalizeQuestionsForStorage($source->generated_questions ?? []),
                'change_note' => 'Duplicated from version '.$source->version_number,
                'parent_version_id' => $source->id,
                'created_by' => portal_id(),
            ]);

            $config->update(['current_version_id' => $version->id]);

            return $version->fresh();
        });
    }

    public function destroyVersion(AiScenarioAssessmentVersion $version): void
    {
        if ($version->status === AiScenarioAssessmentVersion::STATUS_PUBLISHED) {
            throw ValidationException::withMessages([
                'version' => 'Published assessments cannot be deleted.',
            ]);
        }

        $config = $version->config;

        DB::transaction(function () use ($version, $config) {
            $versionId = $version->id;
            $version->delete();

            if ($config->current_version_id === $versionId) {
                $latest = AiScenarioAssessmentVersion::query()
                    ->where('ai_scenario_config_id', $config->id)
                    ->orderByDesc('version_number')
                    ->first();

                $config->update(['current_version_id' => $latest?->id]);
            }
        });
    }

    /**
     * @return array{valid: bool, errors: array<int, string>}
     */
    public function validateForPublish(AiScenarioConfig $config, AiScenarioAssessmentVersion $version): array
    {
        $errors = [];
        $snapshot = $version->toContentSnapshot();

        if (! $this->localeService->isReady($snapshot)) {
            $errors[] = 'Scenario must include bilingual title, description, and at least one question.';
        }

        $questions = $version->generated_questions ?? [];
        $activeQuestions = array_filter(
            $questions,
            fn (array $q) => ($q['status'] ?? '') !== AiScenarioAssessmentVersion::QUESTION_STATUS_ARCHIVED,
        );

        if (count($activeQuestions) < 1) {
            $errors[] = 'At least one question is required before publishing.';
        }

        foreach ($activeQuestions as $question) {
            $number = (int) ($question['number'] ?? 0);
            $correct = strtoupper((string) ($question['correct_answer'] ?? ''));

            if (! in_array($correct, ['A', 'B', 'C', 'D'], true)) {
                $errors[] = "Question {$number} must have a valid correct answer (A–D).";
            }

            foreach (['A', 'B', 'C', 'D'] as $choice) {
                $en = trim((string) ($question['choice_'.strtolower($choice).'_en'] ?? $question['choices'][$choice] ?? ''));
                if ($en === '') {
                    $errors[] = "Question {$number} is missing choice {$choice}.";
                }
            }
        }

        $passingScore = (int) ($config->passing_score ?? 75);
        if ($passingScore > 100) {
            $errors[] = 'Passing score cannot exceed 100%.';
        }

        if ($errors !== []) {
            throw ValidationException::withMessages(['publish' => $errors]);
        }

        return ['valid' => true, 'errors' => []];
    }

    protected function resolveEditableVersion(
        AiScenarioAssessmentVersion $version,
        string $forkNote,
    ): AiScenarioAssessmentVersion {
        if (in_array($version->status, [
            AiScenarioAssessmentVersion::STATUS_PUBLISHED,
            AiScenarioAssessmentVersion::STATUS_ARCHIVED,
        ], true)) {
            throw ValidationException::withMessages([
                'version' => 'Published or archived versions cannot be edited. Restore or duplicate a version first.',
            ]);
        }

        return $version;
    }

    protected function nextVersionNumber(AiScenarioConfig $config): int
    {
        $max = (int) AiScenarioAssessmentVersion::query()
            ->where('ai_scenario_config_id', $config->id)
            ->max('version_number');

        return $max + 1;
    }

    /**
     * @param  array<int, array<string, mixed>>  $questions
     * @return array<int, array<string, mixed>>
     */
    protected function normalizeQuestionsForStorage(array $questions): array
    {
        $normalized = [];

        foreach ($questions as $index => $question) {
            $number = (int) ($question['number'] ?? ($index + 1));
            $normalized[] = $this->buildQuestionRecord($question, $number, (bool) ($question['is_manual'] ?? false));
        }

        return $this->renumberQuestions($normalized);
    }

    /**
     * @param  array<string, mixed>  $question
     * @return array<string, mixed>
     */
    protected function buildQuestionRecord(array $question, int $number, bool $isManual): array
    {
        $locale = $this->localeService->resolveLocale($question['generated_language'] ?? 'en');
        $normalized = $this->localeService->normalizeQuestionToBilingual($question, $locale);
        $normalized['number'] = $number;
        $normalized['is_manual'] = $isManual;
        $normalized['status'] = $question['status']
            ?? ($isManual
                ? AiScenarioAssessmentVersion::QUESTION_STATUS_UNDER_REVIEW
                : AiScenarioAssessmentVersion::QUESTION_STATUS_AI_GENERATED);

        return $normalized;
    }

    /**
     * @param  array<int, array<string, mixed>>  $questions
     * @return array<int, array<string, mixed>>
     */
    protected function renumberQuestions(array $questions): array
    {
        $renumbered = [];
        $num = 1;

        foreach (array_values($questions) as $question) {
            $question['number'] = $num++;
            $renumbered[] = $question;
        }

        return $renumbered;
    }
}
