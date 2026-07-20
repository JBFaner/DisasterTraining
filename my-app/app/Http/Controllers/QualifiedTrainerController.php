<?php

namespace App\Http\Controllers;

use App\Models\QualifiedTrainer;
use App\Models\User;
use App\Services\StaffTrainerBridgeService;
use Illuminate\Http\Request;

class QualifiedTrainerController extends Controller
{
    public function __construct(
        private readonly StaffTrainerBridgeService $bridge,
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
     * Refresh trainer mirrors from Users & Roles (LGU_TRAINER accounts).
     */
    public function sync(Request $request)
    {
        $this->authorizeTrainerAccess();

        $count = $this->bridge->syncAllTrainerMirrors();
        $result = [
            'success' => true,
            'message' => $count > 0
                ? "Trainer list refreshed from Users & Roles ({$count} trainer account".($count === 1 ? '' : 's').').'
                : 'No LGU Trainer accounts found in Users & Roles. Create a trainer under Users & Roles first.',
            'synced' => $count,
        ];

        if ($request->expectsJson()) {
            return response()->json($result);
        }

        return redirect()
            ->route('admin.participants.index', ['tab' => 'trainers'])
            ->with('status', $result['message']);
    }

    public function show(QualifiedTrainer $qualifiedTrainer)
    {
        $this->authorizeTrainerAccess();

        if ($qualifiedTrainer->user_id && $qualifiedTrainer->user) {
            $this->bridge->ensureMirror($qualifiedTrainer->user);
        }

        $qualifiedTrainer->refresh();
        $qualifiedTrainer->load('user');
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
            return response()->json(['trainer' => $this->serializeTrainer($qualifiedTrainer)]);
        }

        return view('app', [
            'section' => 'qualified_trainer_detail',
            'qualifiedTrainer' => $this->serializeTrainer($qualifiedTrainer),
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    public static function buildListResponse(Request $request): array
    {
        $bridge = app(StaffTrainerBridgeService::class);
        $bridge->syncAllTrainerMirrors();

        $summaryBase = User::query()->where('role', StaffTrainerBridgeService::TRAINER_ROLE);
        $trainersSummary = [
            'total' => (clone $summaryBase)->count(),
            'active' => (clone $summaryBase)->where('status', 'active')->count(),
            'inactive' => (clone $summaryBase)->where('status', '!=', 'active')->count(),
            'synced_this_month' => (clone $summaryBase)
                ->where('updated_at', '>=', now()->startOfMonth())
                ->count(),
        ];

        $query = User::query()->where('role', StaffTrainerBridgeService::TRAINER_ROLE);

        if ($request->filled('search')) {
            $search = $request->string('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%")
                    ->orWhere('barangay', 'like', "%{$search}%");
            });
        }

        if ($request->filled('status_filter')) {
            $statusFilter = (string) $request->string('status_filter');
            if ($statusFilter === 'active') {
                $query->where('status', 'active');
            } elseif ($statusFilter === 'inactive') {
                $query->where('status', '!=', 'active');
            }
        }

        $sortBy = (string) $request->string('sort_by', 'name');
        $sortDir = (string) $request->string('sort_dir', 'asc') === 'desc' ? 'desc' : 'asc';
        $allowedSorts = ['name', 'email', 'status', 'created_at', 'updated_at'];
        if (! in_array($sortBy, $allowedSorts, true)) {
            $sortBy = 'name';
        }

        $perPage = 10;
        $paginator = $query->orderBy($sortBy, $sortDir)->paginate($perPage)->withQueryString();

        $trainers = collect($paginator->items())->map(function (User $user) use ($bridge) {
            $mirror = $bridge->ensureMirror($user);

            return [
                'id' => $mirror?->id,
                'user_id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'barangay' => $user->barangay,
                'specialization' => $mirror?->specialization ?: 'LGU Trainer',
                'status' => $user->status === 'active' ? 'active' : 'inactive',
                'account_status' => $user->status,
                'source' => 'users_roles',
                'role' => $user->role,
                'qualified_at' => $mirror?->qualified_at,
                'last_synced_at' => $mirror?->last_synced_at,
                'created_at' => $user->created_at,
            ];
        })->values()->all();

        return [
            'trainers' => $trainers,
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
        return app(StaffTrainerBridgeService::class)->activeForAssignment();
    }

    /**
     * @return array<string, mixed>
     */
    private function serializeTrainer(QualifiedTrainer $trainer): array
    {
        $user = $trainer->user;

        return [
            'id' => $trainer->id,
            'user_id' => $trainer->user_id,
            'name' => $user?->name ?? $trainer->name,
            'email' => $user?->email ?? $trainer->email,
            'phone' => $user?->phone ?? $trainer->phone,
            'barangay' => $user?->barangay ?? $trainer->barangay,
            'specialization' => $trainer->specialization ?: 'LGU Trainer',
            'status' => ($user?->status === 'active')
                ? QualifiedTrainer::STATUS_ACTIVE
                : ($trainer->status ?: QualifiedTrainer::STATUS_INACTIVE),
            'account_status' => $user?->status,
            'source' => 'users_roles',
            'role' => $user?->role ?? StaffTrainerBridgeService::TRAINER_ROLE,
            'certifications' => $trainer->certifications ?? [],
            'qualified_at' => $trainer->qualified_at,
            'last_synced_at' => $trainer->last_synced_at,
            'metadata' => $trainer->metadata,
            'simulation_events_count' => $trainer->simulation_events_count ?? $trainer->simulationEvents()->count(),
            'simulation_events' => $trainer->relationLoaded('simulationEvents')
                ? $trainer->simulationEvents
                : [],
        ];
    }

    private function authorizeTrainerAccess(): void
    {
        $user = portal_user();
        if (! $user || ! in_array($user->role, ['LGU_ADMIN', 'LGU_TRAINER'], true)) {
            abort(403, 'Unauthorized access.');
        }
    }
}
