<?php

namespace App\Http\Controllers;

use App\Models\BarangayProfile;
use App\Models\HazardAssessmentDocument;
use App\Models\PhilippineBarangay;
use App\Services\AuditLogger;
use App\Services\HazardAssessment\HazardTrainingRecommendationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class HazardAssessmentProfileController extends Controller
{
    public function __construct(
        private readonly HazardTrainingRecommendationService $recommendations,
    ) {}

    public function apiIndex(Request $request)
    {
        $this->authorizeAccess();

        return response()->json(self::buildListResponse($request));
    }

    public function index(Request $request)
    {
        $this->authorizeAccess();

        $list = self::buildListResponse($request);

        if ($request->expectsJson()) {
            return response()->json($list);
        }

        return view('app', [
            'section' => 'hazard_assessment_profile',
            'barangay_profiles' => $list['profiles'],
            'hazard_assessment_summary' => $list['summary'],
            'hazard_assessment_options' => $this->formOptions(),
        ]);
    }

    public function create()
    {
        $this->authorizeAccess();

        return view('app', [
            'section' => 'hazard_assessment_profile_create',
            'hazard_assessment_options' => $this->formOptions(),
        ]);
    }

    public function store(Request $request)
    {
        $this->authorizeAccess();

        $data = $this->validatedProfileData($request);
        $hazards = $this->validatedHazards($request);

        $profile = BarangayProfile::create($data);
        $this->syncHazards($profile, $hazards);
        $this->handleDocumentUploads($request, $profile);

        AuditLogger::log([
            'action' => 'Created hazard assessment profile',
            'module' => 'Hazard Assessment Profile',
            'status' => 'success',
            'description' => $profile->barangay_name,
        ]);

        return redirect()->route('admin.hazard-assessment-profiles.index')
            ->with('status', 'Hazard assessment profile created successfully.');
    }

    public function show(BarangayProfile $barangayProfile)
    {
        $this->authorizeAccess();

        $barangayProfile->load(['hazardRecords', 'documents.uploader', 'philippineBarangay.city.region', 'philippineBarangay.city.province']);
        $intelligence = $this->recommendations->buildIntelligencePackage($barangayProfile);

        if (request()->expectsJson()) {
            return response()->json($intelligence);
        }

        return view('app', [
            'section' => 'hazard_assessment_profile_show',
            'barangay_profile' => $barangayProfile,
            'hazard_intelligence' => $intelligence,
            'hazard_assessment_options' => $this->formOptions(),
        ]);
    }

    public function edit(BarangayProfile $barangayProfile)
    {
        $this->authorizeAccess();

        $barangayProfile->load(['hazardRecords', 'documents', 'philippineBarangay.city.region', 'philippineBarangay.city.province']);

        return view('app', [
            'section' => 'hazard_assessment_profile_edit',
            'barangay_profile' => $barangayProfile,
            'hazard_assessment_options' => $this->formOptions(),
        ]);
    }

    public function update(Request $request, BarangayProfile $barangayProfile)
    {
        $this->authorizeAccess();

        $data = $this->validatedProfileData($request, $barangayProfile);
        $hazards = $this->validatedHazards($request);

        $barangayProfile->update($data);
        $this->syncHazards($barangayProfile, $hazards);
        $this->handleDocumentUploads($request, $barangayProfile);

        AuditLogger::log([
            'action' => 'Updated hazard assessment profile',
            'module' => 'Hazard Assessment Profile',
            'status' => 'success',
            'description' => $barangayProfile->barangay_name,
        ]);

        return redirect()->route('admin.hazard-assessment-profiles.show', $barangayProfile)
            ->with('status', 'Hazard assessment profile updated successfully.');
    }

    public function destroy(BarangayProfile $barangayProfile)
    {
        $this->authorizeAccess();

        $name = $barangayProfile->barangay_name;
        $barangayProfile->delete();

        AuditLogger::log([
            'action' => 'Deleted hazard assessment profile',
            'module' => 'Hazard Assessment Profile',
            'status' => 'warning',
            'description' => $name,
        ]);

        return redirect()->route('admin.hazard-assessment-profiles.index')
            ->with('status', 'Hazard assessment profile deleted.');
    }

    public function intelligence(BarangayProfile $barangayProfile)
    {
        $this->authorizeAccess();

        $barangayProfile->load(['hazardRecords', 'documents']);

        return response()->json(
            $this->recommendations->buildIntelligencePackage($barangayProfile),
        );
    }

    public function downloadDocument(BarangayProfile $barangayProfile, HazardAssessmentDocument $document)
    {
        $this->authorizeAccess();

        abort_unless($document->barangay_profile_id === $barangayProfile->id, 404);

        return Storage::disk('local')->download($document->file_path, $document->original_filename);
    }

    public function deleteDocument(BarangayProfile $barangayProfile, HazardAssessmentDocument $document)
    {
        $this->authorizeAccess();

        abort_unless($document->barangay_profile_id === $barangayProfile->id, 404);
        $document->delete();

        if (request()->expectsJson()) {
            return response()->json(['success' => true]);
        }

        return back()->with('status', 'Document removed.');
    }

    /**
     * @return array<string, mixed>
     */
    public static function buildListResponse(Request $request): array
    {
        $service = app(HazardTrainingRecommendationService::class);
        $allProfiles = BarangayProfile::with('hazardRecords')->get();
        $summary = $service->dashboardSummary($allProfiles);

        $query = BarangayProfile::query()->with('hazardRecords');

        if ($search = $request->string('search')->trim()) {
            $query->where(function ($q) use ($search) {
                $q->where('barangay_name', 'like', "%{$search}%")
                    ->orWhere('municipality_city', 'like', "%{$search}%")
                    ->orWhere('province', 'like', "%{$search}%")
                    ->orWhere('region', 'like', "%{$search}%");
            });
        }

        if ($request->filled('hazard_filter')) {
            $hazardType = $request->string('hazard_filter');
            $query->whereHas('hazardRecords', fn ($q) => $q->where('hazard_type', $hazardType));
        }

        if ($request->filled('risk_filter')) {
            $riskLevel = $request->string('risk_filter');
            $query->whereHas('hazardRecords', fn ($q) => $q->where('risk_level', $riskLevel));
        }

        if ($request->filled('region_filter')) {
            $query->where('region', $request->string('region_filter'));
        }

        $sortBy = $request->string('sort_by', 'barangay_name');
        $sortDir = $request->string('sort_dir', 'asc') === 'desc' ? 'desc' : 'asc';
        $allowedSorts = ['barangay_name', 'municipality_city', 'province', 'last_assessed_at', 'updated_at'];
        if (! in_array($sortBy, $allowedSorts, true)) {
            $sortBy = 'barangay_name';
        }

        $paginator = $query->orderBy($sortBy, $sortDir)->paginate(10)->withQueryString();

        return [
            'profiles' => $paginator->items(),
            'pagination' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
                'from' => $paginator->firstItem(),
                'to' => $paginator->lastItem(),
            ],
            'summary' => $summary,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    protected function validatedProfileData(Request $request, ?BarangayProfile $existing = null): array
    {
        $data = $request->validate([
            'philippine_barangay_id' => [
                'required',
                'integer',
                'exists:philippine_barangays,id',
                Rule::unique('barangay_profiles', 'philippine_barangay_id')->ignore($existing?->id),
            ],
        ]);

        $barangay = PhilippineBarangay::findOrFail($data['philippine_barangay_id']);
        $location = $barangay->toLocationArray();

        return [
            'philippine_barangay_id' => $barangay->id,
            'barangay_name' => $location['barangay_name'],
            'municipality_city' => $location['municipality_city'],
            'province' => $location['province'],
            'region' => $location['region'],
            'barangay_address' => $location['barangay_address'],
        ];
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    protected function validatedHazards(Request $request): array
    {
        $hazardTypes = config('hazard_assessment.hazard_types', []);
        $riskLevels = config('hazard_assessment.risk_levels', []);
        $agencies = config('hazard_assessment.source_agencies', []);

        return $request->validate([
            'hazards' => ['nullable', 'array'],
            'hazards.*.hazard_type' => ['required', 'string', Rule::in($hazardTypes)],
            'hazards.*.risk_level' => ['required', 'string', Rule::in($riskLevels)],
            'hazards.*.risk_score' => ['required', 'integer', 'min:0', 'max:100'],
            'hazards.*.description' => ['nullable', 'string'],
            'hazards.*.source_agency' => ['required', 'string', Rule::in($agencies)],
            'hazards.*.date_assessed' => ['nullable', 'date'],
        ])['hazards'] ?? [];
    }

    /**
     * @param  array<int, array<string, mixed>>  $hazards
     */
    protected function syncHazards(BarangayProfile $profile, array $hazards): void
    {
        $profile->hazardRecords()->delete();

        $latestAssessed = null;

        foreach ($hazards as $hazard) {
            $assessed = $hazard['date_assessed'] ?? now()->toDateString();
            $profile->hazardRecords()->create([
                'hazard_type' => $hazard['hazard_type'],
                'risk_level' => $hazard['risk_level'],
                'risk_score' => (int) $hazard['risk_score'],
                'description' => $hazard['description'] ?? null,
                'source_agency' => $hazard['source_agency'],
                'date_assessed' => $assessed,
            ]);
            $latestAssessed = $assessed;
        }

        $profile->update([
            'hazards' => collect($hazards)->pluck('hazard_type')->values()->all() ?: null,
            'last_assessed_at' => $latestAssessed ? \Illuminate\Support\Carbon::parse($latestAssessed) : now(),
        ]);
    }

    protected function handleDocumentUploads(Request $request, BarangayProfile $profile): void
    {
        if (! $request->hasFile('documents')) {
            return;
        }

        $documentTypes = config('hazard_assessment.document_types', []);

        foreach ($request->file('documents') as $index => $file) {
            if (! $file || ! $file->isValid()) {
                continue;
            }

            $type = $request->input("document_types.{$index}", 'Other');
            if (! in_array($type, $documentTypes, true)) {
                $type = 'Other';
            }

            $path = $file->store("hazard-assessments/{$profile->id}", 'local');

            $profile->documents()->create([
                'document_type' => $type,
                'file_path' => $path,
                'original_filename' => $file->getClientOriginalName(),
                'mime_type' => $file->getMimeType(),
                'file_size' => $file->getSize(),
                'uploaded_by' => portal_id(),
            ]);
        }
    }

    /**
     * @return array<string, mixed>
     */
    protected function formOptions(): array
    {
        return [
            'hazard_types' => config('hazard_assessment.hazard_types', []),
            'risk_levels' => config('hazard_assessment.risk_levels', []),
            'source_agencies' => config('hazard_assessment.source_agencies', []),
            'source_agency_labels' => config('hazard_assessment.source_agency_labels', []),
            'document_types' => config('hazard_assessment.document_types', []),
            'hazard_colors' => config('hazard_assessment.hazard_colors', []),
        ];
    }

    protected function authorizeAccess(): void
    {
        $user = portal_user();

        if (! $user || ! in_array($user->role, ['LGU_ADMIN', 'LGU_TRAINER'], true)) {
            abort(403, 'Unauthorized access.');
        }
    }
}
