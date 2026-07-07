<?php

namespace App\Http\Controllers;

use App\Models\BarangayProfile;
use App\Models\Resource;
use App\Models\ResourceBudgetProposal;
use App\Models\SimulationEvent;
use App\Services\AuditLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class ResourceBudgetProposalController extends Controller
{
    public function apiIndex(Request $request)
    {
        $this->authorizeAccess();

        return response()->json($this->buildListResponse($request));
    }

    public function index(Request $request)
    {
        $this->authorizeAccess();

        $list = $this->buildListResponse($request);

        if ($request->expectsJson()) {
            return response()->json($list);
        }

        return view('app', [
            'section' => 'resource_budget_proposal',
            'budget_proposals' => $list['proposals'],
            'budget_proposal_summary' => $list['summary'],
            'budget_proposal_options' => $this->formOptions(),
        ]);
    }

    public function create()
    {
        $this->authorizeAccess();

        return view('app', [
            'section' => 'resource_budget_proposal_create',
            'budget_proposal_options' => $this->formOptions(),
        ]);
    }

    public function store(Request $request)
    {
        $this->authorizeAccess();

        $data = $this->validatedProposalData($request);

        $proposal = DB::transaction(function () use ($data, $request) {
            $proposal = ResourceBudgetProposal::create([
                'reference_number' => $this->generateReferenceNumber(),
                ...$data['proposal'],
                'status' => 'draft',
                'created_by' => portal_id(),
            ]);

            $this->syncItems($proposal, $data['items']);
            $proposal->recalculateTotal();

            return $proposal->load(['items', 'creator', 'resource', 'simulationEvent', 'barangayProfile']);
        });

        AuditLogger::log([
            'action' => 'Created resource budget proposal',
            'module' => 'Resource Budget Proposal',
            'status' => 'success',
            'description' => $proposal->reference_number.' — '.$proposal->title,
        ]);

        return redirect()->route('admin.resource-budget-proposals.show', $proposal)
            ->with('status', 'Budget proposal created successfully.');
    }

    public function show(ResourceBudgetProposal $resourceBudgetProposal)
    {
        $this->authorizeAccess();

        $resourceBudgetProposal->load([
            'items',
            'creator',
            'reviewer',
            'resource',
            'simulationEvent',
            'barangayProfile',
        ]);

        if (request()->expectsJson()) {
            return response()->json($resourceBudgetProposal);
        }

        return view('app', [
            'section' => 'resource_budget_proposal_show',
            'budget_proposal' => $resourceBudgetProposal,
            'budget_proposal_options' => $this->formOptions(),
        ]);
    }

    public function edit(ResourceBudgetProposal $resourceBudgetProposal)
    {
        $this->authorizeAccess();

        if (! in_array($resourceBudgetProposal->status, ['draft', 'rejected'], true)) {
            return redirect()->route('admin.resource-budget-proposals.show', $resourceBudgetProposal)
                ->withErrors(['status' => 'Only draft or rejected proposals can be edited.']);
        }

        $resourceBudgetProposal->load(['items', 'resource', 'simulationEvent', 'barangayProfile']);

        return view('app', [
            'section' => 'resource_budget_proposal_edit',
            'budget_proposal' => $resourceBudgetProposal,
            'budget_proposal_options' => $this->formOptions(),
        ]);
    }

    public function update(Request $request, ResourceBudgetProposal $resourceBudgetProposal)
    {
        $this->authorizeAccess();

        if (! in_array($resourceBudgetProposal->status, ['draft', 'rejected'], true)) {
            return back()->withErrors(['status' => 'Only draft or rejected proposals can be edited.']);
        }

        $data = $this->validatedProposalData($request);

        DB::transaction(function () use ($resourceBudgetProposal, $data) {
            $resourceBudgetProposal->update([
                ...$data['proposal'],
                'status' => 'draft',
                'reviewed_at' => null,
                'reviewed_by' => null,
                'review_notes' => null,
                'submitted_at' => null,
            ]);

            $resourceBudgetProposal->items()->delete();
            $this->syncItems($resourceBudgetProposal, $data['items']);
            $resourceBudgetProposal->recalculateTotal();
        });

        AuditLogger::log([
            'action' => 'Updated resource budget proposal',
            'module' => 'Resource Budget Proposal',
            'status' => 'success',
            'description' => $resourceBudgetProposal->reference_number,
        ]);

        return redirect()->route('admin.resource-budget-proposals.show', $resourceBudgetProposal)
            ->with('status', 'Budget proposal updated successfully.');
    }

    public function destroy(ResourceBudgetProposal $resourceBudgetProposal)
    {
        $this->authorizeAccess();

        if ($resourceBudgetProposal->status !== 'draft') {
            return back()->withErrors(['status' => 'Only draft proposals can be deleted.']);
        }

        $ref = $resourceBudgetProposal->reference_number;
        $resourceBudgetProposal->delete();

        AuditLogger::log([
            'action' => 'Deleted resource budget proposal',
            'module' => 'Resource Budget Proposal',
            'status' => 'success',
            'description' => $ref,
        ]);

        return redirect()->route('admin.resource-budget-proposals.index')
            ->with('status', 'Budget proposal deleted.');
    }

    public function submit(ResourceBudgetProposal $resourceBudgetProposal)
    {
        $this->authorizeAccess();

        if ($resourceBudgetProposal->status !== 'draft') {
            return back()->withErrors(['status' => 'Only draft proposals can be submitted.']);
        }

        if ($resourceBudgetProposal->items()->count() === 0) {
            return back()->withErrors(['items' => 'Add at least one line item before submitting.']);
        }

        $resourceBudgetProposal->update([
            'status' => 'submitted',
            'submitted_at' => now(),
        ]);

        AuditLogger::log([
            'action' => 'Submitted resource budget proposal',
            'module' => 'Resource Budget Proposal',
            'status' => 'success',
            'description' => $resourceBudgetProposal->reference_number,
        ]);

        return back()->with('status', 'Budget proposal submitted for review.');
    }

    public function approve(Request $request, ResourceBudgetProposal $resourceBudgetProposal)
    {
        $this->authorizeApprove();

        if ($resourceBudgetProposal->status !== 'submitted') {
            return back()->withErrors(['status' => 'Only submitted proposals can be approved.']);
        }

        $data = $request->validate([
            'review_notes' => ['nullable', 'string', 'max:2000'],
        ]);

        $resourceBudgetProposal->update([
            'status' => 'approved',
            'reviewed_at' => now(),
            'reviewed_by' => portal_id(),
            'review_notes' => $data['review_notes'] ?? null,
        ]);

        AuditLogger::log([
            'action' => 'Approved resource budget proposal',
            'module' => 'Resource Budget Proposal',
            'status' => 'success',
            'description' => $resourceBudgetProposal->reference_number,
        ]);

        return back()->with('status', 'Budget proposal approved.');
    }

    public function reject(Request $request, ResourceBudgetProposal $resourceBudgetProposal)
    {
        $this->authorizeApprove();

        if ($resourceBudgetProposal->status !== 'submitted') {
            return back()->withErrors(['status' => 'Only submitted proposals can be rejected.']);
        }

        $data = $request->validate([
            'review_notes' => ['required', 'string', 'max:2000'],
        ]);

        $resourceBudgetProposal->update([
            'status' => 'rejected',
            'reviewed_at' => now(),
            'reviewed_by' => portal_id(),
            'review_notes' => $data['review_notes'],
        ]);

        AuditLogger::log([
            'action' => 'Rejected resource budget proposal',
            'module' => 'Resource Budget Proposal',
            'status' => 'success',
            'description' => $resourceBudgetProposal->reference_number,
        ]);

        return back()->with('status', 'Budget proposal rejected.');
    }

    /**
     * @return array<string, mixed>
     */
    protected function buildListResponse(Request $request): array
    {
        $query = ResourceBudgetProposal::query()
            ->with(['creator', 'items'])
            ->withCount('items');

        if ($search = trim((string) $request->input('search'))) {
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('reference_number', 'like', "%{$search}%");
            });
        }

        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        if ($request->filled('fund_source') && $request->fund_source !== 'all') {
            $query->where('fund_source', $request->fund_source);
        }

        if ($request->filled('priority') && $request->priority !== 'all') {
            $query->where('priority', $request->priority);
        }

        $sortBy = $request->input('sort_by', 'created_at');
        $sortDir = $request->input('sort_dir', 'desc') === 'asc' ? 'asc' : 'desc';
        $allowedSort = ['reference_number', 'title', 'total_estimated_cost', 'status', 'priority', 'created_at'];
        if (! in_array($sortBy, $allowedSort, true)) {
            $sortBy = 'created_at';
        }

        $query->orderBy($sortBy, $sortDir);

        $proposals = $query->paginate(10)->withQueryString();

        return [
            'proposals' => $proposals->items(),
            'pagination' => [
                'current_page' => $proposals->currentPage(),
                'last_page' => $proposals->lastPage(),
                'per_page' => $proposals->perPage(),
                'total' => $proposals->total(),
            ],
            'summary' => [
                'total' => ResourceBudgetProposal::count(),
                'draft' => ResourceBudgetProposal::where('status', 'draft')->count(),
                'submitted' => ResourceBudgetProposal::where('status', 'submitted')->count(),
                'approved' => ResourceBudgetProposal::where('status', 'approved')->count(),
                'rejected' => ResourceBudgetProposal::where('status', 'rejected')->count(),
                'approved_amount' => (float) ResourceBudgetProposal::where('status', 'approved')->sum('total_estimated_cost'),
                'pending_amount' => (float) ResourceBudgetProposal::where('status', 'submitted')->sum('total_estimated_cost'),
            ],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    protected function validatedProposalData(Request $request): array
    {
        $fundSources = array_keys(config('budget_proposal.fund_sources', []));
        $priorities = array_keys(config('budget_proposal.priorities', []));
        $justificationSources = array_keys(config('budget_proposal.justification_sources', []));
        $categories = config('budget_proposal.resource_categories', []);

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'justification' => ['nullable', 'string', 'max:5000'],
            'justification_source' => ['required', Rule::in($justificationSources)],
            'fund_source' => ['required', Rule::in($fundSources)],
            'priority' => ['required', Rule::in($priorities)],
            'resource_id' => ['nullable', 'exists:resources,id'],
            'simulation_event_id' => ['nullable', 'exists:simulation_events,id'],
            'barangay_profile_id' => ['nullable', 'exists:barangay_profiles,id'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.item_name' => ['required', 'string', 'max:255'],
            'items.*.category' => ['nullable', Rule::in($categories)],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
            'items.*.unit_cost' => ['required', 'numeric', 'min:0'],
            'items.*.notes' => ['nullable', 'string', 'max:1000'],
        ]);

        return [
            'proposal' => [
                'title' => $validated['title'],
                'justification' => $validated['justification'] ?? null,
                'justification_source' => $validated['justification_source'],
                'fund_source' => $validated['fund_source'],
                'priority' => $validated['priority'],
                'resource_id' => $validated['resource_id'] ?? null,
                'simulation_event_id' => $validated['simulation_event_id'] ?? null,
                'barangay_profile_id' => $validated['barangay_profile_id'] ?? null,
            ],
            'items' => $validated['items'],
        ];
    }

    /**
     * @param  array<int, array<string, mixed>>  $items
     */
    protected function syncItems(ResourceBudgetProposal $proposal, array $items): void
    {
        foreach ($items as $item) {
            $quantity = (int) $item['quantity'];
            $unitCost = round((float) $item['unit_cost'], 2);

            $proposal->items()->create([
                'item_name' => $item['item_name'],
                'category' => $item['category'] ?? null,
                'quantity' => $quantity,
                'unit_cost' => $unitCost,
                'total_cost' => round($quantity * $unitCost, 2),
                'notes' => $item['notes'] ?? null,
            ]);
        }
    }

    protected function generateReferenceNumber(): string
    {
        $year = now()->format('Y');
        $latest = ResourceBudgetProposal::where('reference_number', 'like', "RBP-{$year}-%")
            ->orderByDesc('id')
            ->value('reference_number');

        $sequence = 1;
        if ($latest && preg_match('/RBP-\d{4}-(\d+)/', $latest, $matches)) {
            $sequence = ((int) $matches[1]) + 1;
        }

        return sprintf('RBP-%s-%04d', $year, $sequence);
    }

    /**
     * @return array<string, mixed>
     */
    protected function formOptions(): array
    {
        return [
            'fund_sources' => config('budget_proposal.fund_sources', []),
            'priorities' => config('budget_proposal.priorities', []),
            'statuses' => config('budget_proposal.statuses', []),
            'justification_sources' => config('budget_proposal.justification_sources', []),
            'resource_categories' => config('budget_proposal.resource_categories', []),
            'resources' => Resource::query()->orderBy('name')->get(['id', 'name', 'category', 'quantity', 'available']),
            'simulation_events' => SimulationEvent::query()
                ->orderByDesc('event_date')
                ->limit(50)
                ->get(['id', 'title', 'event_date', 'status']),
            'barangay_profiles' => BarangayProfile::query()
                ->orderBy('barangay_name')
                ->get(['id', 'barangay_name']),
        ];
    }

    protected function authorizeAccess(): void
    {
        $user = portal_user();

        if (! $user || ! in_array($user->role, ['LGU_ADMIN', 'LGU_TRAINER', 'STAFF'], true)) {
            abort(403, 'Unauthorized access.');
        }
    }

    protected function authorizeApprove(): void
    {
        $user = portal_user();

        if (! $user || $user->role !== 'LGU_ADMIN') {
            abort(403, 'Only LGU administrators can approve or reject proposals.');
        }
    }
}
