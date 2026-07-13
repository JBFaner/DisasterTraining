<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SimulationExerciseTemplate;
use App\Services\SimulationExerciseTemplateAiService;
use App\Services\SimulationExerciseTemplateService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SimulationExerciseTemplateController extends Controller
{
    public function __construct(
        private readonly SimulationExerciseTemplateService $templateService,
        private readonly SimulationExerciseTemplateAiService $aiService,
    ) {}

    public function index(Request $request)
    {
        $this->authorizeAccess();

        $templates = $this->templateService
            ->listForDashboard($request->string('status')->toString() ?: null)
            ->values()
            ->all();

        $summary = [
            'total' => count($templates),
            'published' => collect($templates)->where('status', 'published')->count(),
            'draft' => collect($templates)->where('status', 'draft')->count(),
            'archived' => collect($templates)->where('status', 'archived')->count(),
        ];

        if ($request->expectsJson()) {
            return response()->json([
                'templates' => $templates,
                'summary' => $summary,
            ]);
        }

        return view('app', [
            'section' => 'simulation_exercise_templates',
            'exercise_templates' => $templates,
            'exercise_template_summary' => $summary,
        ]);
    }

    public function create()
    {
        $this->authorizeAccess();

        return view('app', [
            'section' => 'simulation_exercise_template_create',
            'exercise_template_form' => $this->templateService->serializeDetail(
                new SimulationExerciseTemplate([
                    'status' => SimulationExerciseTemplate::STATUS_DRAFT,
                    'difficulty_level' => 'Intermediate',
                    'exercise_type' => 'Drill',
                    'category' => 'Fire Safety',
                ]),
            ),
        ]);
    }

    public function generatePlan(Request $request): JsonResponse
    {
        $this->authorizeAccess();

        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'category' => ['required', 'string', 'in:'.implode(',', SimulationExerciseTemplate::CATEGORIES)],
            'exercise_type' => ['required', 'string', 'in:'.implode(',', SimulationExerciseTemplate::EXERCISE_TYPES)],
            'estimated_duration_minutes' => ['nullable', 'integer', 'min:15', 'max:1440'],
        ]);

        if (! array_key_exists('estimated_duration_minutes', $data) || $data['estimated_duration_minutes'] === null || $data['estimated_duration_minutes'] === '') {
            unset($data['estimated_duration_minutes']);
        }

        return response()->json([
            'success' => true,
            'plan' => $this->aiService->generateExercisePlan($data),
        ]);
    }

    public function regenerateSection(Request $request): JsonResponse
    {
        $this->authorizeAccess();

        $data = $request->validate([
            'section' => ['required', 'string', 'in:objectives,activities,timeline,personnel,equipment,scenario,evaluation_objectives'],
            'title' => ['required', 'string', 'max:255'],
            'category' => ['required', 'string', 'in:'.implode(',', SimulationExerciseTemplate::CATEGORIES)],
            'exercise_type' => ['required', 'string', 'in:'.implode(',', SimulationExerciseTemplate::EXERCISE_TYPES)],
            'estimated_duration_minutes' => ['nullable', 'integer', 'min:15', 'max:1440'],
            'context' => ['nullable', 'array'],
        ]);

        $section = (string) $data['section'];
        unset($data['section']);

        return response()->json([
            'success' => true,
            'section' => $section,
            'result' => $this->aiService->regenerateSection(
                $section,
                $data,
                $request->input('context', []),
            ),
        ]);
    }

    public function store(Request $request)
    {
        $this->authorizeAccess();

        $data = $this->validatePayload($request);
        $template = $this->templateService->saveTemplate(null, $data, $request->user()?->id);

        if ($request->expectsJson()) {
            return response()->json([
                'success' => true,
                'template' => $this->templateService->serializeListItem($template),
                'redirect' => '/admin/simulation-exercise-templates/'.$template->id,
            ]);
        }

        return redirect()
            ->route('admin.simulation-exercise-templates.show', $template)
            ->with('status', 'Simulation exercise template saved.');
    }

    public function show(Request $request, SimulationExerciseTemplate $simulationExerciseTemplate)
    {
        $this->authorizeAccess();

        $detail = $this->templateService->serializeDetail($simulationExerciseTemplate);

        if ($request->expectsJson()) {
            return response()->json($detail);
        }

        return view('app', [
            'section' => 'simulation_exercise_template_show',
            'exercise_template_form' => $detail,
        ]);
    }

    public function edit(SimulationExerciseTemplate $simulationExerciseTemplate)
    {
        $this->authorizeAccess();

        return view('app', [
            'section' => 'simulation_exercise_template_edit',
            'exercise_template_form' => $this->templateService->serializeDetail($simulationExerciseTemplate),
        ]);
    }

    public function update(Request $request, SimulationExerciseTemplate $simulationExerciseTemplate)
    {
        $this->authorizeAccess();

        $data = $this->validatePayload($request);
        $template = $this->templateService->saveTemplate($simulationExerciseTemplate, $data, $request->user()?->id);

        if ($request->expectsJson()) {
            return response()->json([
                'success' => true,
                'template' => $this->templateService->serializeListItem($template),
            ]);
        }

        return redirect()
            ->route('admin.simulation-exercise-templates.show', $template)
            ->with('status', 'Simulation exercise template updated.');
    }

    public function publish(Request $request, SimulationExerciseTemplate $simulationExerciseTemplate): JsonResponse
    {
        $this->authorizeAccess();

        $template = $this->templateService->publish($simulationExerciseTemplate, $request->user()?->id);

        return response()->json([
            'success' => true,
            'template' => $this->templateService->serializeListItem($template),
        ]);
    }

    public function archive(Request $request, SimulationExerciseTemplate $simulationExerciseTemplate): JsonResponse
    {
        $this->authorizeAccess();

        $template = $this->templateService->archive($simulationExerciseTemplate, $request->user()?->id);

        return response()->json([
            'success' => true,
            'template' => $this->templateService->serializeListItem($template),
        ]);
    }

    public function reuse(Request $request, SimulationExerciseTemplate $simulationExerciseTemplate)
    {
        $this->authorizeAccess();

        $data = $request->validate([
            'campaign_request_id' => ['nullable', 'integer', 'exists:campaign_requests,id'],
            'title' => ['nullable', 'string', 'max:255'],
            'event_date' => ['nullable', 'date'],
            'start_time' => ['nullable', 'string', 'max:20'],
            'end_time' => ['nullable', 'string', 'max:20'],
            'venue' => ['nullable', 'string', 'max:255'],
        ]);

        $event = $this->templateService->reuseTemplate(
            $simulationExerciseTemplate,
            $data,
            $request->user()?->id,
        );

        if ($request->expectsJson()) {
            return response()->json([
                'success' => true,
                'event_id' => $event->id,
                'redirect' => '/admin/simulation-events/'.$event->id,
            ]);
        }

        return redirect()
            ->route('admin.simulation-events.show', $event)
            ->with('status', 'Simulation event created from template.');
    }

    public function destroy(Request $request, SimulationExerciseTemplate $simulationExerciseTemplate)
    {
        $this->authorizeAccess();

        if ($simulationExerciseTemplate->events()->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Templates linked to simulation events cannot be deleted. Archive instead.',
            ], 422);
        }

        $simulationExerciseTemplate->delete();

        if ($request->expectsJson()) {
            return response()->json(['success' => true]);
        }

        return redirect()
            ->route('admin.simulation-exercise-templates.index')
            ->with('status', 'Template deleted.');
    }

    /**
     * @return array<string, mixed>
     */
    private function validatePayload(Request $request): array
    {
        return $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'category' => ['required', 'string', 'in:'.implode(',', SimulationExerciseTemplate::CATEGORIES)],
            'exercise_type' => ['required', 'string', 'in:'.implode(',', SimulationExerciseTemplate::EXERCISE_TYPES)],
            'difficulty_level' => ['required', 'string', 'in:'.implode(',', SimulationExerciseTemplate::DIFFICULTY_LEVELS)],
            'estimated_duration_minutes' => ['nullable', 'integer', 'min:15', 'max:1440'],
            'objectives' => ['nullable', 'string'],
            'scenario_summary' => ['nullable', 'string'],
            'expected_hazards' => ['nullable', 'string'],
            'learning_objectives' => ['nullable', 'string'],
            'safety_reminders' => ['nullable', 'string'],
            'status' => ['nullable', 'string', 'in:draft,published,archived'],
            'activities' => ['nullable', 'array'],
            'activities.*.id' => ['nullable', 'integer'],
            'activities.*.title' => ['nullable', 'string', 'max:255'],
            'activities.*.description' => ['nullable', 'string'],
            'activities.*.duration_minutes' => ['nullable', 'integer', 'min:1', 'max:480'],
            'activities.*.equipment' => ['nullable', 'array'],
            'activities.*.equipment.*.id' => ['nullable', 'integer'],
            'activities.*.equipment.*.resource_id' => ['nullable', 'integer', 'exists:resources,id'],
            'activities.*.equipment.*.required_quantity' => ['nullable', 'integer', 'min:1'],
            'personnel' => ['nullable', 'array'],
            'personnel.*.id' => ['nullable', 'integer'],
            'personnel.*.role' => ['nullable', 'string', 'max:255'],
            'personnel.*.recommended_count' => ['nullable', 'integer', 'min:1'],
            'personnel.*.notes' => ['nullable', 'string'],
            'personnel_assignments' => ['nullable', 'array'],
            'personnel_assignments.*.id' => ['nullable', 'integer'],
            'personnel_assignments.*.role' => ['nullable', 'string', 'max:255'],
            'personnel_assignments.*.source_group' => ['nullable', 'string', 'max:255'],
            'personnel_assignments.*.qualified_trainer_id' => ['nullable', 'integer', 'exists:qualified_trainers,id'],
            'personnel_assignments.*.person_name' => ['nullable', 'string', 'max:255'],
            'personnel_assignments.*.person_external_id' => ['nullable', 'string', 'max:255'],
            'personnel_assignments.*.notes' => ['nullable', 'string'],
            'timeline_items' => ['nullable', 'array'],
            'timeline_items.*.id' => ['nullable', 'integer'],
            'timeline_items.*.start_time' => ['nullable', 'string', 'max:10'],
            'timeline_items.*.label' => ['nullable', 'string', 'max:255'],
            'timeline_items.*.description' => ['nullable', 'string'],
            'timeline_items.*.activity_id' => ['nullable', 'integer'],
            'evaluation_objectives' => ['nullable', 'array'],
            'evaluation_objectives.*.id' => ['nullable', 'integer'],
            'evaluation_objectives.*.activity_id' => ['nullable', 'integer'],
            'evaluation_objectives.*.heading' => ['nullable', 'string', 'max:255'],
            'evaluation_objectives.*.objective_text' => ['nullable', 'string', 'max:500'],
        ]);
    }

    private function authorizeAccess(): void
    {
        $user = auth()->user();
        abort_unless($user && in_array($user->role, ['LGU_ADMIN', 'LGU_TRAINER'], true), 403);
    }
}
