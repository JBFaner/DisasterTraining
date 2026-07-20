<?php

namespace App\Services;

use App\Models\AiScenarioAttempt;
use App\Models\Certificate;
use App\Models\EvaluationResult;
use App\Models\TrainingModule;
use App\Models\User;
use Carbon\Carbon;

class ParticipantTrainingProgressSummaryService
{
    public function __construct(
        private readonly CampaignRegistrationService $registrationService,
        private readonly LessonQuizProgressionService $progression,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function buildAllModulesSummary(User $user): array
    {
        $registeredModuleIds = $this->registrationService->registeredModuleIdsFor($user);

        $query = TrainingModule::query()
            ->with('contents')
            ->where('status', 'published')
            ->orderBy('title');

        if ($registeredModuleIds !== []) {
            $query->whereIn('id', $registeredModuleIds);
        }

        $modules = $query->get();

        return [
            'generated_at' => now()->toIso8601String(),
            'participant' => [
                'name' => $user->name,
                'email' => $user->email,
            ],
            'modules' => $modules
                ->map(fn (TrainingModule $module) => $this->buildModuleSummary($user, $module))
                ->values()
                ->all(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function buildModuleSummary(User $user, TrainingModule $module): array
    {
        if (! $module->relationLoaded('contents')) {
            $module->load('contents');
        }

        $module->applyParticipantProgression((int) $user->id);

        $lessons = $module->contents->values()->map(function ($content, $index) use ($module, $user) {
            $hasQuiz = $this->progression->lessonHasPublishedQuiz((int) $content->id);
            $completed = $this->progression->participantHasCompletedLesson($module, (int) $user->id, $content);

            return [
                'number' => $index + 1,
                'id' => (int) $content->id,
                'title' => $content->title,
                'status' => $completed
                    ? ($hasQuiz ? 'Quiz passed' : 'Completed')
                    : (($content->is_unlocked ?? false) ? 'In progress' : 'Locked'),
                'has_quiz' => $hasQuiz,
            ];
        })->all();

        $completedLessons = collect($lessons)->whereIn('status', ['Completed', 'Quiz passed'])->count();
        $totalLessons = count($lessons);
        $progressPercent = $totalLessons > 0
            ? (int) round(($completedLessons / $totalLessons) * 100)
            : 0;

        $evaluation = EvaluationResult::query()
            ->where('participant_id', $user->id)
            ->where('training_module_id', $module->id)
            ->orderByDesc('completed_at')
            ->first();

        $certificate = Certificate::query()
            ->where('user_id', $user->id)
            ->where('training_module_id', $module->id)
            ->whereNull('revoked_at')
            ->orderByDesc('issued_at')
            ->first();

        $assessmentAttempt = AiScenarioAttempt::query()
            ->where('user_id', $user->id)
            ->where('training_module_id', $module->id)
            ->orderByDesc('updated_at')
            ->first();

        return [
            'module_id' => (int) $module->id,
            'title' => $module->title,
            'category' => $module->category,
            'progress_percent' => $progressPercent,
            'lessons_completed' => $completedLessons,
            'lessons_total' => $totalLessons,
            'lessons' => $lessons,
            'assessment' => $assessmentAttempt ? [
                'status' => $assessmentAttempt->status,
                'score' => $assessmentAttempt->score,
                'updated_at' => $assessmentAttempt->updated_at?->toIso8601String(),
            ] : null,
            'evaluation' => $evaluation ? [
                'status' => $evaluation->status,
                'percentage' => $evaluation->percentage,
                'completed_at' => $evaluation->completed_at?->toIso8601String(),
            ] : null,
            'certificate' => $certificate ? [
                'number' => $certificate->certificate_number,
                'issued_at' => $certificate->issued_at?->toIso8601String(),
            ] : null,
        ];
    }

    /**
     * @param  array<string, mixed>  $summary
     */
    public function renderText(array $summary): string
    {
        $lines = [];
        $generatedAt = isset($summary['generated_at'])
            ? Carbon::parse($summary['generated_at'])->timezone(config('app.timezone'))->format('M j, Y g:i A')
            : now()->format('M j, Y g:i A');

        $lines[] = 'LGU Disaster Training — Progress Summary';
        $lines[] = 'Generated: '.$generatedAt;

        if (isset($summary['participant'])) {
            $lines[] = 'Participant: '.($summary['participant']['name'] ?? 'Participant');
            if (! empty($summary['participant']['email'])) {
                $lines[] = 'Email: '.$summary['participant']['email'];
            }
        }

        $modules = $summary['modules'] ?? [$summary];

        foreach ($modules as $moduleSummary) {
            if (! is_array($moduleSummary)) {
                continue;
            }

            $lines[] = '';
            $lines[] = str_repeat('=', 60);
            $lines[] = $moduleSummary['title'] ?? 'Training Module';
            if (! empty($moduleSummary['category'])) {
                $lines[] = 'Category: '.$moduleSummary['category'];
            }
            $lines[] = 'Progress: '.($moduleSummary['progress_percent'] ?? 0).'%'
                .' ('.($moduleSummary['lessons_completed'] ?? 0).'/'.($moduleSummary['lessons_total'] ?? 0).' lessons)';

            $lines[] = '';
            $lines[] = 'Lessons:';
            foreach ($moduleSummary['lessons'] ?? [] as $lesson) {
                $lines[] = sprintf(
                    '  %d. %s — %s',
                    $lesson['number'] ?? 0,
                    $lesson['title'] ?? 'Lesson',
                    $lesson['status'] ?? 'Unknown',
                );
            }

            if (! empty($moduleSummary['assessment'])) {
                $lines[] = '';
                $lines[] = 'Final AI Assessment: '.ucfirst(str_replace('_', ' ', (string) $moduleSummary['assessment']['status']));
                if ($moduleSummary['assessment']['score'] !== null) {
                    $lines[] = 'Assessment score: '.$moduleSummary['assessment']['score'];
                }
            }

            if (! empty($moduleSummary['evaluation'])) {
                $lines[] = '';
                $lines[] = 'Evaluation: '.ucfirst(str_replace('_', ' ', (string) $moduleSummary['evaluation']['status']));
                if ($moduleSummary['evaluation']['percentage'] !== null) {
                    $lines[] = 'Evaluation score: '.$moduleSummary['evaluation']['percentage'].'%';
                }
            }

            if (! empty($moduleSummary['certificate'])) {
                $lines[] = '';
                $lines[] = 'Certificate #: '.($moduleSummary['certificate']['number'] ?? 'Issued');
            }
        }

        $lines[] = '';
        $lines[] = '— End of transcript —';

        return implode(PHP_EOL, $lines);
    }
}
