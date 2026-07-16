<?php



namespace App\Services;



use App\Models\LessonQuizConfig;

use App\Models\LessonQuizVersion;

use Illuminate\Support\Facades\DB;

use Illuminate\Validation\ValidationException;



class LessonQuizWorkflowService

{

    public function __construct(

        private readonly AiScenarioLocaleService $localeService,

        private readonly LessonQuizTranslationService $translationService,

        private readonly GeminiService $gemini,

        private readonly LessonContentExtractorService $contentExtractor,

    ) {}



    /**

     * @param  array{generated_questions: array<int, array<string, mixed>>, generated_language?: string}  $content

     */

    public function createVersionFromGeneration(

        LessonQuizConfig $config,

        array $content,

        string $changeNote = 'AI Generated',

        ?int $actorUserId = null,

    ): LessonQuizVersion {

        return DB::transaction(function () use ($config, $content, $changeNote, $actorUserId) {

            $versionNumber = $this->nextVersionNumber($config);

            $sourceLocale = $this->localeService->resolveLocale($content['generated_language'] ?? 'en');

            $questions = $this->normalizeQuestionsForStorage($content['generated_questions'] ?? [], $sourceLocale);



            $version = LessonQuizVersion::create([

                'lesson_quiz_config_id' => $config->id,

                'version_number' => $versionNumber,

                'status' => LessonQuizVersion::STATUS_AI_GENERATED,

                'generated_questions' => $questions,

                'generated_language' => $sourceLocale,

                'language_versions' => $this->defaultLanguageVersions($sourceLocale),

                'change_note' => $changeNote,

                'parent_version_id' => $config->current_version_id,

                'created_by' => $actorUserId ?? portal_id(),

            ]);



            $config->update([

                'current_version_id' => $version->id,

                'is_enabled' => false,

            ]);



            return $version->fresh(['creator', 'config.trainingContent']);

        });

    }



    /**

     * @param  array{generated_questions: array<int, array<string, mixed>>, generated_language?: string}  $content

     */

    public function replaceDraftFromGeneration(

        LessonQuizVersion $version,

        array $content,

        string $changeNote = 'AI Regenerated',

        ?int $actorUserId = null,

    ): LessonQuizVersion {

        if (in_array($version->status, [

            LessonQuizVersion::STATUS_PUBLISHED,

            LessonQuizVersion::STATUS_ARCHIVED,

        ], true)) {

            throw ValidationException::withMessages([

                'version' => 'Published or archived versions cannot be replaced.',

            ]);

        }



        return DB::transaction(function () use ($version, $content, $changeNote, $actorUserId) {

            $sourceLocale = $this->localeService->resolveLocale($content['generated_language'] ?? $version->generated_language);

            $questions = $this->normalizeQuestionsForStorage($content['generated_questions'] ?? [], $sourceLocale);



            $version->update([

                'status' => LessonQuizVersion::STATUS_AI_GENERATED,

                'generated_questions' => $questions,

                'generated_language' => $sourceLocale,

                'language_versions' => $this->defaultLanguageVersions($sourceLocale),

                'change_note' => $changeNote,

                'approved_by' => null,

                'approved_at' => null,

                'published_by' => null,

                'published_at' => null,

                'last_edited_by' => $actorUserId ?? portal_id(),

                'last_edited_at' => now(),

            ]);



            return $version->fresh(['creator', 'config.trainingContent']);

        });

    }



    public function translateVersion(LessonQuizVersion $version, string $targetLocale, ?int $actorUserId = null): LessonQuizVersion

    {

        $this->assertEditable($version);



        $sourceLocale = $this->localeService->resolveLocale($version->generated_language ?? 'en');

        $targetLocale = $this->localeService->resolveLocale($targetLocale);



        if ($sourceLocale === $targetLocale) {

            throw ValidationException::withMessages([

                'locale' => 'Cannot translate to the same language as the source.',

            ]);

        }



        $questions = $version->generated_questions ?? [];

        if ($questions === []) {

            throw ValidationException::withMessages([

                'version' => 'No questions available to translate.',

            ]);

        }



        $translated = $this->translationService->translateQuestionBank($questions, $sourceLocale, $targetLocale);



        $languageVersions = $version->language_versions ?? $this->defaultLanguageVersions($sourceLocale);

        $languageVersions[$targetLocale] = array_merge($languageVersions[$targetLocale] ?? [], [

            'status' => 'draft',

            'outdated' => false,

            'translated_at' => now()->toIso8601String(),

        ]);



        $version->update([

            'generated_questions' => $this->normalizeQuestionsForStorage($translated, $sourceLocale),

            'language_versions' => $languageVersions,

            'status' => LessonQuizVersion::STATUS_UNDER_REVIEW,

            'last_edited_by' => $actorUserId ?? portal_id(),

            'last_edited_at' => now(),

        ]);



        return $version->fresh();

    }



    public function publishTranslation(LessonQuizVersion $version, string $locale): LessonQuizVersion

    {

        $this->assertEditable($version);

        $locale = $this->localeService->resolveLocale($locale);

        $sourceLocale = $this->localeService->resolveLocale($version->generated_language ?? 'en');



        if ($locale === $sourceLocale) {

            return $this->publish($version);

        }



        if (! $this->hasCompleteTranslation($version, $locale)) {

            throw ValidationException::withMessages([

                'locale' => 'Translation is incomplete. Review and finish all translated questions first.',

            ]);

        }



        $languageVersions = $version->language_versions ?? $this->defaultLanguageVersions($sourceLocale);

        $languageVersions[$locale] = array_merge($languageVersions[$locale] ?? [], [

            'status' => 'published',

            'outdated' => false,

            'published_at' => now()->toIso8601String(),

        ]);



        $version->update([

            'language_versions' => $languageVersions,

            'last_edited_by' => portal_id(),

            'last_edited_at' => now(),

        ]);



        return $version->fresh();

    }



    public function deleteTranslation(LessonQuizVersion $version, string $locale): LessonQuizVersion

    {

        $this->assertEditable($version);

        $locale = $this->localeService->resolveLocale($locale);

        $sourceLocale = $this->localeService->resolveLocale($version->generated_language ?? 'en');



        if ($locale === $sourceLocale) {

            throw ValidationException::withMessages([

                'locale' => 'The original language cannot be deleted.',

            ]);

        }



        $questions = $version->generated_questions ?? [];

        foreach ($questions as &$question) {

            unset($question["question_{$locale}"]);

            unset($question["explanation_{$locale}"]);

            foreach (['a', 'b', 'c', 'd'] as $letter) {

                unset($question["choice_{$letter}_{$locale}"]);

            }

        }

        unset($question);



        $languageVersions = $version->language_versions ?? $this->defaultLanguageVersions($sourceLocale);

        $languageVersions[$locale] = [

            'status' => 'not_started',

            'outdated' => false,

        ];



        $version->update([

            'generated_questions' => $questions,

            'language_versions' => $languageVersions,

            'last_edited_by' => portal_id(),

            'last_edited_at' => now(),

        ]);



        return $version->fresh();

    }



    public function saveDraft(LessonQuizVersion $version): LessonQuizVersion

    {

        $this->assertEditable($version);

        $version->update([

            'status' => LessonQuizVersion::STATUS_UNDER_REVIEW,

            'last_edited_by' => portal_id(),

            'last_edited_at' => now(),

        ]);



        return $version->fresh();

    }



    public function approve(LessonQuizVersion $version): LessonQuizVersion

    {

        $this->assertEditable($version);

        $version->update([

            'status' => LessonQuizVersion::STATUS_APPROVED,

            'approved_by' => portal_id(),

            'approved_at' => now(),

        ]);



        return $version->fresh();

    }



    public function publish(LessonQuizVersion $version): LessonQuizVersion
    {
        // Archived versions can be re-selected as the learner-facing bank.
        if ($version->status !== LessonQuizVersion::STATUS_ARCHIVED) {
            $this->assertEditable($version);
        }

        $questions = $version->generated_questions ?? [];
        if (! is_array($questions) || count($questions) < 1) {
            throw ValidationException::withMessages([
                'version' => 'This version has no questions to publish.',
            ]);
        }

        return DB::transaction(function () use ($version) {
            $config = $version->config()->firstOrFail();

            if (
                $version->status === LessonQuizVersion::STATUS_PUBLISHED
                && (int) $config->published_version_id === (int) $version->id
            ) {
                return $version->fresh();
            }

            $sourceLocale = $this->localeService->resolveLocale($version->generated_language ?? 'en');

            LessonQuizVersion::query()
                ->where('lesson_quiz_config_id', $config->id)
                ->where('status', LessonQuizVersion::STATUS_PUBLISHED)
                ->where('id', '!=', $version->id)
                ->update(['status' => LessonQuizVersion::STATUS_ARCHIVED]);

            $languageVersions = $version->language_versions ?? $this->defaultLanguageVersions($sourceLocale);
            $languageVersions[$sourceLocale] = array_merge($languageVersions[$sourceLocale] ?? [], [
                'status' => 'published',
                'outdated' => false,
                'published_at' => now()->toIso8601String(),
            ]);

            $version->update([
                'status' => LessonQuizVersion::STATUS_PUBLISHED,
                'language_versions' => $languageVersions,
                'published_by' => portal_id(),
                'published_at' => now(),
            ]);

            $config->update([
                'published_version_id' => $version->id,
                'current_version_id' => $version->id,
                'is_enabled' => true,
            ]);

            return $version->fresh();
        });
    }



    /**

     * @param  array<string, mixed>  $data

     */

    public function updateQuestion(

        LessonQuizVersion $version,

        int $questionNumber,

        array $data,

        string $locale = 'en',

    ): LessonQuizVersion {

        $this->assertEditable($version);

        $locale = $this->localeService->resolveLocale($locale);

        $sourceLocale = $this->localeService->resolveLocale($version->generated_language ?? 'en');

        $questions = $version->generated_questions ?? [];

        $updated = false;



        foreach ($questions as &$question) {

            if ((int) ($question['number'] ?? 0) !== $questionNumber) {

                continue;

            }



            $question = $this->localeService->normalizeQuestionToBilingual($question, $sourceLocale);



            if (isset($data['question'])) {

                $question["question_{$locale}"] = $data['question'];

            }

            if (isset($data['explanation'])) {

                $question["explanation_{$locale}"] = $data['explanation'];

            }

            if (isset($data['correct_answer'])) {

                $question['correct_answer'] = strtoupper((string) $data['correct_answer']);

            }

            foreach (['A', 'B', 'C', 'D'] as $letter) {

                $key = 'choice_'.strtolower($letter);

                if (isset($data[$key])) {

                    $question['choice_'.strtolower($letter).'_'.$locale] = $data[$key];

                }

            }

            $updated = true;

            break;

        }

        unset($question);



        if (! $updated) {

            throw ValidationException::withMessages(['question' => 'Question not found.']);

        }



        $languageVersions = $version->language_versions ?? $this->defaultLanguageVersions($sourceLocale);

        if ($locale === $sourceLocale) {

            $this->markTranslationsOutdated($languageVersions, $sourceLocale);

        }



        $version->update([

            'generated_questions' => $questions,

            'language_versions' => $languageVersions,

            'last_edited_by' => portal_id(),

            'last_edited_at' => now(),

        ]);



        return $version->fresh();

    }



    public function destroyQuestion(LessonQuizVersion $version, int $questionNumber): LessonQuizVersion

    {

        $this->assertEditable($version);

        $sourceLocale = $this->localeService->resolveLocale($version->generated_language ?? 'en');

        $questions = array_values(array_filter(

            $version->generated_questions ?? [],

            fn ($q) => (int) ($q['number'] ?? 0) !== $questionNumber,

        ));



        $languageVersions = $version->language_versions ?? $this->defaultLanguageVersions($sourceLocale);

        $this->markTranslationsOutdated($languageVersions, $sourceLocale);



        $version->update([

            'generated_questions' => $this->normalizeQuestionsForStorage($questions, $sourceLocale),

            'language_versions' => $languageVersions,

            'last_edited_by' => portal_id(),

            'last_edited_at' => now(),

        ]);



        return $version->fresh();

    }

    /**
     * @param  array<int, array<string, mixed>>  $items
     */
    public function bulkUpdateQuestions(LessonQuizVersion $version, array $items): LessonQuizVersion
    {
        $this->assertEditable($version);

        $sourceLocale = $this->localeService->resolveLocale($version->generated_language ?? 'en');
        $questions = $version->generated_questions ?? [];
        $languageVersions = $version->language_versions ?? $this->defaultLanguageVersions($sourceLocale);
        $sourceEdited = false;

        foreach ($items as $item) {
            $questionNumber = (int) ($item['number'] ?? 0);
            if ($questionNumber < 1) {
                continue;
            }

            foreach ($questions as &$question) {
                if ((int) ($question['number'] ?? 0) !== $questionNumber) {
                    continue;
                }

                $question = $this->localeService->normalizeQuestionToBilingual($question, $sourceLocale);

                foreach ($this->localeService->supportedLanguages() as $locale) {
                    if (isset($item["question_{$locale}"])) {
                        $question["question_{$locale}"] = $item["question_{$locale}"];
                    }
                    if (isset($item["explanation_{$locale}"])) {
                        $question["explanation_{$locale}"] = $item["explanation_{$locale}"];
                    }
                    foreach (['a', 'b', 'c', 'd'] as $letter) {
                        $key = "choice_{$letter}_{$locale}";
                        if (isset($item[$key])) {
                            $question[$key] = $item[$key];
                        }
                    }
                }

                if (isset($item['correct_answer'])) {
                    $question['correct_answer'] = strtoupper((string) $item['correct_answer']);
                }

                $sourceEdited = true;
                break;
            }
            unset($question);
        }

        if ($sourceEdited) {
            $this->markTranslationsOutdated($languageVersions, $sourceLocale);
        }

        $version->update([
            'generated_questions' => $questions,
            'language_versions' => $languageVersions,
            'last_edited_by' => portal_id(),
            'last_edited_at' => now(),
        ]);

        return $version->fresh();
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function addManualQuestion(LessonQuizVersion $version, array $data = []): LessonQuizVersion
    {
        $this->assertEditable($version);

        $sourceLocale = $this->localeService->resolveLocale($version->generated_language ?? 'en');
        $questions = $version->generated_questions ?? [];
        $maxNumber = collect($questions)->max(fn ($q) => (int) ($q['number'] ?? 0)) ?: 0;

        $newQuestion = $this->localeService->normalizeQuestionToBilingual([
            'number' => $maxNumber + 1,
            'competency' => $data['competency'] ?? 'knowledge',
            'question' => (string) ($data['question_en'] ?? ''),
            'explanation' => (string) ($data['explanation_en'] ?? ''),
            'correct_answer' => strtoupper((string) ($data['correct_answer'] ?? 'A')),
            'choices' => [
                'A' => (string) ($data['choice_a_en'] ?? ''),
                'B' => (string) ($data['choice_b_en'] ?? ''),
                'C' => (string) ($data['choice_c_en'] ?? ''),
                'D' => (string) ($data['choice_d_en'] ?? ''),
            ],
            'question_fil' => (string) ($data['question_fil'] ?? ''),
            'explanation_fil' => (string) ($data['explanation_fil'] ?? ''),
            'choice_a_fil' => (string) ($data['choice_a_fil'] ?? ''),
            'choice_b_fil' => (string) ($data['choice_b_fil'] ?? ''),
            'choice_c_fil' => (string) ($data['choice_c_fil'] ?? ''),
            'choice_d_fil' => (string) ($data['choice_d_fil'] ?? ''),
        ], $sourceLocale);

        $questions[] = $newQuestion;

        $languageVersions = $version->language_versions ?? $this->defaultLanguageVersions($sourceLocale);
        $this->markTranslationsOutdated($languageVersions, $sourceLocale);

        $version->update([
            'generated_questions' => $this->normalizeQuestionsForStorage($questions, $sourceLocale),
            'language_versions' => $languageVersions,
            'last_edited_by' => portal_id(),
            'last_edited_at' => now(),
        ]);

        return $version->fresh();
    }

    public function duplicateQuestion(LessonQuizVersion $version, int $questionNumber): LessonQuizVersion
    {
        $this->assertEditable($version);

        $sourceLocale = $this->localeService->resolveLocale($version->generated_language ?? 'en');
        $questions = $version->generated_questions ?? [];
        $source = collect($questions)->first(fn ($q) => (int) ($q['number'] ?? 0) === $questionNumber);

        if (! $source) {
            throw ValidationException::withMessages(['question' => 'Question not found.']);
        }

        $maxNumber = collect($questions)->max(fn ($q) => (int) ($q['number'] ?? 0)) ?: 0;
        $copy = $source;
        $copy['number'] = $maxNumber + 1;
        $questions[] = $copy;

        $languageVersions = $version->language_versions ?? $this->defaultLanguageVersions($sourceLocale);
        $this->markTranslationsOutdated($languageVersions, $sourceLocale);

        $version->update([
            'generated_questions' => $this->normalizeQuestionsForStorage($questions, $sourceLocale),
            'language_versions' => $languageVersions,
            'last_edited_by' => portal_id(),
            'last_edited_at' => now(),
        ]);

        return $version->fresh();
    }

    public function regenerateQuestion(LessonQuizVersion $version, int $questionNumber): LessonQuizVersion
    {
        $this->assertEditable($version);

        $config = $version->config()->with('trainingContent')->firstOrFail();
        $content = $config->trainingContent;

        if (! $content) {
            throw ValidationException::withMessages(['question' => 'Lesson content not found for regeneration.']);
        }

        $sourceText = $this->contentExtractor->buildAiSourceText($content);

        if (trim($sourceText) === '') {
            throw ValidationException::withMessages(['question' => 'No lesson content available to regenerate this question.']);
        }

        $sourceLocale = $this->localeService->resolveLocale($version->generated_language ?? 'en');
        $result = $this->gemini->generateLessonQuizBank($content, $sourceText, 1, $sourceLocale);
        $generated = $result['questions'][0] ?? null;

        if (! $generated) {
            throw ValidationException::withMessages(['question' => 'AI did not return a replacement question.']);
        }

        $questions = $version->generated_questions ?? [];
        $found = false;

        foreach ($questions as $index => $question) {
            if ((int) ($question['number'] ?? 0) !== $questionNumber) {
                continue;
            }

            $generated['number'] = $questionNumber;
            $questions[$index] = $this->localeService->normalizeQuestionToBilingual($generated, $sourceLocale);
            $found = true;
            break;
        }

        if (! $found) {
            throw ValidationException::withMessages(['question' => 'Question not found.']);
        }

        $languageVersions = $version->language_versions ?? $this->defaultLanguageVersions($sourceLocale);
        $this->markTranslationsOutdated($languageVersions, $sourceLocale);

        $version->update([
            'generated_questions' => $this->normalizeQuestionsForStorage($questions, $sourceLocale),
            'language_versions' => $languageVersions,
            'last_edited_by' => portal_id(),
            'last_edited_at' => now(),
        ]);

        return $version->fresh();
    }

    public function generateAndAppendQuestion(LessonQuizVersion $version): LessonQuizVersion
    {
        $this->assertEditable($version);

        $config = $version->config()->with('trainingContent')->firstOrFail();
        $content = $config->trainingContent;

        if (! $content) {
            throw ValidationException::withMessages(['question' => 'Lesson content not found for generation.']);
        }

        $sourceText = $this->contentExtractor->buildAiSourceText($content);

        if (trim($sourceText) === '') {
            throw ValidationException::withMessages(['question' => 'No lesson content available to generate a question.']);
        }

        $sourceLocale = $this->localeService->resolveLocale($version->generated_language ?? 'en');
        $result = $this->gemini->generateLessonQuizBank($content, $sourceText, 1, $sourceLocale);
        $generated = $result['questions'][0] ?? null;

        if (! $generated) {
            throw ValidationException::withMessages(['question' => 'AI did not return a new question.']);
        }

        $questions = $version->generated_questions ?? [];
        $maxNumber = collect($questions)->max(fn ($q) => (int) ($q['number'] ?? 0)) ?: 0;
        $generated['number'] = $maxNumber + 1;
        $questions[] = $this->localeService->normalizeQuestionToBilingual($generated, $sourceLocale);

        $languageVersions = $version->language_versions ?? $this->defaultLanguageVersions($sourceLocale);
        $this->markTranslationsOutdated($languageVersions, $sourceLocale);

        $version->update([
            'generated_questions' => $this->normalizeQuestionsForStorage($questions, $sourceLocale),
            'language_versions' => $languageVersions,
            'last_edited_by' => portal_id(),
            'last_edited_at' => now(),
        ]);

        return $version->fresh();
    }



    /**

     * @return list<string>

     */

    public function publishedLanguages(LessonQuizVersion $version): array

    {

        $languageVersions = $version->language_versions ?? [];

        $published = [];



        if ($languageVersions === [] && $version->status === LessonQuizVersion::STATUS_PUBLISHED) {

            return [$this->localeService->resolveLocale($version->generated_language ?? 'en')];

        }



        foreach ($this->localeService->supportedLanguages() as $locale) {

            if (($languageVersions[$locale]['status'] ?? '') === 'published') {

                $published[] = $locale;

            }

        }



        return $published;

    }



    public function isLanguagePublished(LessonQuizVersion $version, string $locale): bool

    {

        $locale = $this->localeService->resolveLocale($locale);

        $languageVersions = $version->language_versions ?? [];



        if ($languageVersions === [] && $version->status === LessonQuizVersion::STATUS_PUBLISHED) {

            $sourceLocale = $this->localeService->resolveLocale($version->generated_language ?? 'en');



            return $locale === $sourceLocale;

        }



        return ($languageVersions[$locale]['status'] ?? '') === 'published';

    }



    private function assertEditable(LessonQuizVersion $version): void

    {

        if (! $version->isEditable()) {

            throw ValidationException::withMessages([

                'version' => 'This version cannot be edited.',

            ]);

        }

    }



    private function nextVersionNumber(LessonQuizConfig $config): int

    {

        $max = LessonQuizVersion::query()

            ->where('lesson_quiz_config_id', $config->id)

            ->max('version_number');



        return ((int) $max) + 1;

    }



    /**

     * @param  array<int, array<string, mixed>>  $questions

     * @return array<int, array<string, mixed>>

     */

    private function normalizeQuestionsForStorage(array $questions, string $sourceLocale = 'en'): array

    {

        $normalized = $this->localeService->normalizeQuestionsToBilingual($questions, $sourceLocale);

        usort($normalized, fn ($a, $b) => $a['number'] <=> $b['number']);



        return array_values($normalized);

    }



    /**

     * @return array<string, array<string, mixed>>

     */

    private function defaultLanguageVersions(string $sourceLocale): array

    {

        $sourceLocale = $this->localeService->resolveLocale($sourceLocale);

        $versions = [];



        foreach ($this->localeService->supportedLanguages() as $locale) {

            $versions[$locale] = [

                'status' => $locale === $sourceLocale ? 'draft' : 'not_started',

                'outdated' => false,

            ];

        }



        return $versions;

    }



    /**

     * @param  array<string, array<string, mixed>>  $languageVersions

     */

    private function markTranslationsOutdated(array &$languageVersions, string $sourceLocale): void

    {

        foreach ($this->localeService->supportedLanguages() as $locale) {

            if ($locale === $sourceLocale) {

                continue;

            }



            $status = $languageVersions[$locale]['status'] ?? 'not_started';

            if (in_array($status, ['draft', 'published'], true)) {

                $languageVersions[$locale]['outdated'] = true;

            }

        }

    }



    private function hasCompleteTranslation(LessonQuizVersion $version, string $locale): bool

    {

        foreach ($version->generated_questions ?? [] as $question) {

            $resolved = $this->localeService->resolveQuestionForDisplay($question, $locale, false);

            if (trim((string) ($resolved['question'] ?? '')) === '') {

                return false;

            }



            foreach (['A', 'B', 'C', 'D'] as $letter) {

                if (trim((string) ($resolved['choices'][$letter] ?? '')) === '') {

                    return false;

                }

            }

        }



        return true;

    }

}


