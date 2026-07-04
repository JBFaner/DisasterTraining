<?php

namespace App\Http\Controllers;

use App\Models\QualifiedTrainer;
use App\Services\Group6\QualifiedTrainerSyncService;
use Illuminate\Http\Request;

class QualifiedTrainerController extends Controller
{
    public function __construct(
        private readonly QualifiedTrainerSyncService $syncService,
    ) {}

    /**
     * JSON list for the Trainer List data table (AJAX pagination).
     */
    public function apiIndex(Request $request)
    {
        $this->authorizeTrainerAccess();

        return response()->json($this->buildListResponse($request));
    }

    /**
     * Refresh the trainer directory from the Community Engagement System API.
     */
    public function sync(Request $request)
    {
        $this->authorizeTrainerAccess();

        $result = $this->syncService->syncFromApi();

        if ($request->expectsJson()) {
            return response()->json($result, $result['success'] ? 200 : 501);
        }

        return redirect()
            ->route('admin.participants.index', ['tab' => 'trainers'])
            ->with($result['success'] ? 'status' : 'error', $result['message']);
    }

    public function show(QualifiedTrainer $qualifiedTrainer)
    {
        $this->authorizeTrainerAccess();

        $qualifiedTrainer->loadCount('simulationEvents');
        $qualifiedTrainer->load([
            'simulationEvents' => function ($query) {
                $query
                    ->whereDate('event_date', '>=', now()->toDateString())
                    ->orderBy('event_date')
                    ->orderBy('start_time')
                    ->limit(10)
                    ->select(['id', 'title', 'event_date', 'start_time', 'end_time', 'status', 'assigned_trainer_id']);
            },
        ]);

        if (request()->expectsJson()) {
            return response()->json(['trainer' => $qualifiedTrainer]);
        }

        return view('app', [
            'section' => 'qualified_trainer_detail',
            'qualifiedTrainer' => $qualifiedTrainer,
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    public static function buildListResponse(Request $request): array
    {
        $summaryBase = QualifiedTrainer::query();
        $trainersSummary = [
            'total' => (clone $summaryBase)->count(),
            'active' => (clone $summaryBase)->where('status', QualifiedTrainer::STATUS_ACTIVE)->count(),
            'inactive' => (clone $summaryBase)->where('status', QualifiedTrainer::STATUS_INACTIVE)->count(),
            'synced_this_month' => (clone $summaryBase)
                ->where('last_synced_at', '>=', now()->startOfMonth())
                ->count(),
        ];

        $query = QualifiedTrainer::query();

        if ($request->filled('search')) {
            $search = $request->string('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('group6_external_id', 'like', "%{$search}%")
                    ->orWhere('specialization', 'like', "%{$search}%");
            });
        }

        if ($request->filled('status_filter')) {
            $query->where('status', $request->string('status_filter'));
        }

        $sortBy = $request->string('sort_by', 'name');
        $sortDir = $request->string('sort_dir', 'asc') === 'desc' ? 'desc' : 'asc';
        $allowedSorts = ['name', 'email', 'status', 'specialization', 'last_synced_at', 'created_at'];
        if (! in_array($sortBy, $allowedSorts, true)) {
            $sortBy = 'name';
        }

        $perPage = 10;
        $paginator = $query->orderBy($sortBy, $sortDir)->paginate($perPage)->withQueryString();

        return [
            'trainers' => $paginator->items(),
            'pagination' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
                'from' => $paginator->firstItem(),
                'to' => $paginator->lastItem(),
            ],
            'summary' => $trainersSummary,
        ];
    }

    /**
     * Active trainers for simulation event assignment dropdowns.
     *
     * @return array<int, array{id: int, name: string}>
     */
    public static function activeForDropdown(): array
    {
        return QualifiedTrainer::active()
            ->orderBy('name')
            ->get(['id', 'name'])
            ->all();
    }

    private function authorizeTrainerAccess(): void
    {
        $user = portal_user();
        if (! $user || ! in_array($user->role, ['LGU_ADMIN', 'LGU_TRAINER'], true)) {
            abort(403, 'Unauthorized access.');
        }
    }
}
