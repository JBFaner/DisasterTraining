<?php

namespace App\Http\Controllers;

use App\Models\Certificate;
use App\Models\CertificateTemplate;
use App\Models\CertificationSetting;
use App\Models\Evaluation;
use App\Models\ParticipantEvaluation;
use App\Models\SimulationEvent;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class CertificationController extends Controller
{
    public function __construct()
    {
        $this->authorizeCertificationAccess();
    }

    /**
     * Certification dashboard: summary stats, eligible list, templates, history, settings.
     */
    public function index(Request $request)
    {
        $eventFilter = $request->get('event_id');
        $dateFrom = $request->get('date_from');
        $dateTo = $request->get('date_to');
        $statusFilter = $request->get('status'); // eligible, not_eligible, pending
        $certificateTypeFilter = $request->get('certificate_type');
        $issuedStatusFilter = $request->get('issued_status'); // active, revoked, all - for Issued History

        // Summary cards
        $totalCertified = Certificate::whereNull('revoked_at')->count();
        $eligibleList = $this->buildEligibleParticipantsList($eventFilter, 'eligible');
        $pendingCount = collect($eligibleList)->where('cert_status', 'eligible')->where('certificate_issued', false)->count();
        $issuedToday = Certificate::whereNull('revoked_at')
            ->whereDate('issued_at', today())
            ->count();
        // Trend: this week vs last week
        $thisWeek = Certificate::whereNull('revoked_at')->whereBetween('issued_at', [now()->startOfWeek(), now()->endOfWeek()])->count();
        $lastWeek = Certificate::whereNull('revoked_at')->whereBetween('issued_at', [now()->subWeek()->startOfWeek(), now()->subWeek()->endOfWeek()])->count();
        $trendPct = $lastWeek > 0 ? (int) round((($thisWeek - $lastWeek) / $lastWeek) * 100) : ($thisWeek > 0 ? 100 : 0);

        // Eligible participants (for tab)
        $eligibleParticipants = $this->buildEligibleParticipantsList($eventFilter, $statusFilter);

        // Templates
        $templates = CertificateTemplate::orderBy('name')->get();

        // Issued certificates history (with filters)
        $issuedQuery = Certificate::with(['user', 'simulationEvent', 'issuer']);
        if ($issuedStatusFilter === 'revoked') {
            $issuedQuery->whereNotNull('revoked_at');
        } elseif ($issuedStatusFilter !== 'all') {
            $issuedQuery->whereNull('revoked_at');
        }
        if ($eventFilter) {
            $issuedQuery->where('simulation_event_id', $eventFilter);
        }
        if ($dateFrom) {
            $issuedQuery->whereDate('issued_at', '>=', $dateFrom);
        }
        if ($dateTo) {
            $issuedQuery->whereDate('issued_at', '<=', $dateTo);
        }
        if ($certificateTypeFilter) {
            $issuedQuery->where('type', $certificateTypeFilter);
        }
        $issuedCertificates = $issuedQuery->orderByDesc('issued_at')->limit(500)->get();

        // Events for filters dropdown
        $eventsForFilter = SimulationEvent::whereIn('status', ['published', 'ongoing', 'completed'])
            ->orderByDesc('event_date')
            ->get(['id', 'title', 'event_date']);

        // Automation settings
        $autoIssueWhenPassed = filter_var(CertificationSetting::get('auto_issue_when_passed', '0'), FILTER_VALIDATE_BOOLEAN);
        $requireAttendance = filter_var(CertificationSetting::get('require_attendance', '1'), FILTER_VALIDATE_BOOLEAN);
        $requireSupervisorApproval = filter_var(CertificationSetting::get('require_supervisor_approval', '0'), FILTER_VALIDATE_BOOLEAN);

        return view('app', [
            'section' => 'certification',
            'summaryStats' => [
                'total_certified' => $totalCertified,
                'pending_certifications' => $pendingCount,
                'issued_today' => $issuedToday,
                'trend_this_week' => $trendPct,
            ],
            'eligibleParticipants' => $eligibleParticipants,
            'templates' => $templates,
            'issuedCertificates' => $issuedCertificates,
            'eventsForFilter' => $eventsForFilter,
            'filters' => [
                'event_id' => $eventFilter,
                'date_from' => $dateFrom,
                'date_to' => $dateTo,
                'status' => $statusFilter,
                'certificate_type' => $certificateTypeFilter,
                'issued_status' => $issuedStatusFilter,
            ],
            'automationSettings' => [
                'auto_issue_when_passed' => $autoIssueWhenPassed,
                'require_attendance' => $requireAttendance,
                'require_supervisor_approval' => $requireSupervisorApproval,
            ],
        ]);
    }

    /**
     * Build list of eligible/not eligible/pending participants across events with evaluations.
     */
    private function buildEligibleParticipantsList(?string $eventIdFilter, ?string $statusFilter): array
    {
        $events = SimulationEvent::whereIn('status', ['published', 'ongoing', 'completed'])
            ->whereHas('evaluation')
            ->with(['evaluation.participantEvaluations' => function ($q) {
                $q->whereHas('scores')->with(['user', 'attendance']);
            }])
            ->when($eventIdFilter, fn ($q) => $q->where('id', $eventIdFilter))
            ->orderByDesc('event_date')
            ->get();

        $list = [];
        foreach ($events as $event) {
            $evaluation = $event->evaluation;
            if (!$evaluation) {
                continue;
            }
            $approvedRegistrations = $event->registrations()
                ->where('status', 'approved')
                ->with(['user', 'attendance'])
                ->get();

            $evaluatedUserIds = $evaluation->participantEvaluations->pluck('user_id')->unique();

            foreach ($approvedRegistrations as $reg) {
                $pe = $evaluation->participantEvaluations->firstWhere('user_id', $reg->user_id);
                $attendance = $reg->attendance;
                $attendanceStatus = $attendance ? $attendance->status : 'not_marked';
                $hasAttendance = in_array($attendanceStatus, ['present', 'completed', 'late'], true);

                if ($pe && $pe->scores->isNotEmpty()) {
                    $avg = (float) ($pe->average_score ?? 0);
                    $passed = $avg >= 75.0;
                    $certStatus = ($passed && $hasAttendance) ? 'eligible' : 'not_eligible';
                } else {
                    $certStatus = 'pending';
                    $pe = null;
                }

                if ($statusFilter && $certStatus !== $statusFilter) {
                    continue;
                }

                $existingCert = Certificate::where('user_id', $reg->user_id)
                    ->where('simulation_event_id', $event->id)
                    ->whereNull('revoked_at')
                    ->first();

                $list[] = [
                    'user_id' => $reg->user_id,
                    'user_name' => $reg->user->name ?? 'N/A',
                    'user_email' => $reg->user->email ?? '',
                    'event_id' => $event->id,
                    'event_title' => $event->title,
                    'event_date' => $event->event_date,
                    'score' => $pe ? round((float) $pe->average_score, 2) : null,
                    'attendance_status' => $attendanceStatus,
                    'cert_status' => $certStatus,
                    'participant_evaluation_id' => $pe?->id,
                    'certificate_issued' => $existingCert !== null,
                    'certificate_id' => $existingCert?->id,
                ];
            }
        }

        return $list;
    }

    /**
     * Issue a certificate.
     */
    public function issue(Request $request)
    {
        $data = $request->validate([
            'user_id' => ['required', 'exists:users,id'],
            'simulation_event_id' => ['required', 'exists:simulation_events,id'],
            'participant_evaluation_id' => ['nullable', 'exists:participant_evaluations,id'],
            'certificate_template_id' => ['nullable', 'exists:certificate_templates,id'],
            'type' => ['required', 'string', 'in:completion,participation'],
            'training_type' => ['nullable', 'string', 'max:255'],
            'completion_date' => ['nullable', 'date'],
        ]);

        $user = \App\Models\User::findOrFail($data['user_id']);
        $event = SimulationEvent::findOrFail($data['simulation_event_id']);
        $pe = $data['participant_evaluation_id']
            ? ParticipantEvaluation::find($data['participant_evaluation_id'])
            : null;

        $existing = Certificate::where('user_id', $user->id)
            ->where('simulation_event_id', $event->id)
            ->whereNull('revoked_at')
            ->first();
        if ($existing) {
            if ($request->expectsJson()) {
                return response()->json(['success' => false, 'message' => 'A certificate for this participant and event already exists.'], 422);
            }
            return redirect()->route('certification')->with('status', 'Certificate already issued for this participant and event.');
        }

        $templateId = $data['certificate_template_id'] ?? null;
        $template = $templateId
            ? CertificateTemplate::find($templateId)
            : CertificateTemplate::where('status', 'active')->first();

        $certNumber = $this->generateCertificateNumber();
        $completionDate = $data['completion_date'] ?? $event->event_date ?? now();
        $finalScore = $pe ? $pe->average_score : null;

        // Snapshot template assets so certificate history never changes
        $snapshotBackgroundPath = null;
        if ($template?->background_path && Storage::disk('public')->exists($template->background_path)) {
            $ext = pathinfo($template->background_path, PATHINFO_EXTENSION) ?: 'png';
            $snapshotBackgroundPath = 'issued-certificates/backgrounds/' . $certNumber . '.' . $ext;
            // Avoid collisions in case certificate numbers ever change format
            if (Storage::disk('public')->exists($snapshotBackgroundPath)) {
                $snapshotBackgroundPath = 'issued-certificates/backgrounds/' . $certNumber . '-' . uniqid() . '.' . $ext;
            }
            Storage::disk('public')->copy($template->background_path, $snapshotBackgroundPath);
        }

        $cert = Certificate::create([
            'user_id' => $user->id,
            'simulation_event_id' => $event->id,
            'participant_evaluation_id' => $pe?->id,
            'certificate_template_id' => $template?->id,
            'template_background_path' => $snapshotBackgroundPath ?? $template?->background_path,
            'template_background_opacity' => $template?->background_opacity,
            'template_paper_size' => $template?->paper_size,
            'template_content' => $template ? ($template->template_content ?? $template->defaultTemplateContent()) : null,
            'certificate_number' => $certNumber,
            'type' => $data['type'],
            'training_type' => $data['training_type'] ?? $event->scenario?->title ?? 'Disaster Preparedness Training',
            'completion_date' => $completionDate,
            'final_score' => $finalScore,
            'issued_at' => now(),
            'issued_by' => Auth::id(),
        ]);

        if ($template) {
            $template->update(['last_used_at' => now()]);
        }

        if ($request->expectsJson()) {
            return response()->json([
                'success' => true,
                'message' => 'Certificate issued successfully.',
                'certificate' => $cert->load(['user', 'simulationEvent']),
            ]);
        }
        return redirect()->route('certification')->with('status', 'Certificate issued successfully.');
    }

    private function generateCertificateNumber(): string
    {
        $year = date('Y');
        $seq = Certificate::whereYear('issued_at', $year)->count() + 1;
        return sprintf('CERT-%s-%05d', $year, $seq);
    }

    /**
     * Revoke certificate.
     */
    public function revoke(Request $request, Certificate $certificate)
    {
        $certificate->update([
            'revoked_at' => now(),
            'revoked_by' => Auth::id(),
            'revoke_reason' => $request->input('reason'),
        ]);
        if ($request->expectsJson()) {
            return response()->json(['success' => true, 'message' => 'Certificate revoked.']);
        }
        return redirect()->route('certification')->with('status', 'Certificate revoked.');
    }

    /**
     * Reissue: create a new certificate for same user/event (e.g. after revoke).
     */
    public function reissue(Request $request)
    {
        return $this->issue($request);
    }

    /**
     * Template CRUD (supports template_content with {name}, {date}, etc. and optional background upload)
     */
    public function storeTemplate(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'type' => ['required', 'string', 'in:completion,participation'],
            'title_text' => ['nullable', 'string', 'max:500'],
            'template_content' => ['nullable', 'string'],
            'certificate_number_format' => ['nullable', 'string', 'max:100'],
            'font_style' => ['nullable', 'string', 'max:100'],
            'status' => ['nullable', 'string', 'in:active,inactive'],
            'background_opacity' => ['nullable', 'numeric', 'min:0.1', 'max:0.8'],
            'background' => ['nullable', 'file', 'mimes:jpeg,png,gif,webp,pdf', 'max:10240'], // 10MB
            'paper_size' => ['nullable', 'string', 'in:a4,letter'],
        ]);
        $data['status'] = $data['status'] ?? 'active';
        $data['paper_size'] = $data['paper_size'] ?? 'a4';
        $data['background_opacity'] = isset($data['background_opacity']) ? (float) $data['background_opacity'] : 0.35;
        unset($data['background']);
        if ($request->hasFile('background')) {
            $data['background_path'] = $request->file('background')->store('certificate-templates', 'public');
        }
        CertificateTemplate::create($data);
        if ($request->expectsJson()) {
            return response()->json(['success' => true, 'message' => 'Template created.']);
        }
        return redirect()->route('certification')->with('status', 'Template created.');
    }

    public function updateTemplate(Request $request, CertificateTemplate $template)
    {
        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'type' => ['sometimes', 'string', 'in:completion,participation'],
            'title_text' => ['nullable', 'string', 'max:500'],
            'template_content' => ['nullable', 'string'],
            'certificate_number_format' => ['nullable', 'string', 'max:100'],
            'font_style' => ['nullable', 'string', 'max:100'],
            'status' => ['nullable', 'string', 'in:active,inactive'],
            'background_opacity' => ['nullable', 'numeric', 'min:0.1', 'max:0.8'],
            'background' => ['nullable', 'file', 'mimes:jpeg,png,gif,webp,pdf', 'max:10240'],
            'paper_size' => ['nullable', 'string', 'in:a4,letter'],
        ]);
        if (array_key_exists('paper_size', $data)) {
            $data['paper_size'] = in_array($data['paper_size'], ['a4', 'letter'], true) ? $data['paper_size'] : 'a4';
        }
        if (array_key_exists('background_opacity', $data)) {
            $data['background_opacity'] = (float) $data['background_opacity'];
        }
        unset($data['background']);
        if ($request->hasFile('background')) {
            if ($template->background_path) {
                // Do NOT delete old background if any issued certificate references it (history must not change)
                $isReferencedByIssuedCert = Certificate::where('template_background_path', $template->background_path)->exists();
                if (! $isReferencedByIssuedCert) {
                    Storage::disk('public')->delete($template->background_path);
                }
            }
            $data['background_path'] = $request->file('background')->store('certificate-templates', 'public');
        }
        $template->update($data);
        if ($request->expectsJson()) {
            return response()->json(['success' => true, 'message' => 'Template updated.']);
        }
        return redirect()->route('certification')->with('status', 'Template updated.');
    }

    /**
     * Serve the template background image (works without storage:link).
     * Includes cache headers to prevent stale images.
     */
    public function templateBackground(CertificateTemplate $template)
    {
        if (!$template->background_path || !Storage::disk('public')->exists($template->background_path)) {
            abort(404);
        }
        $path = Storage::disk('public')->path($template->background_path);
        $lastModified = filemtime($path);
        $etag = md5($path . $lastModified);
        
        return response()->file($path, [
            'Content-Type' => \Illuminate\Support\Facades\File::mimeType($path),
            'Cache-Control' => 'private, max-age=3600, must-revalidate',
            'ETag' => $etag,
            'Last-Modified' => gmdate('D, d M Y H:i:s', $lastModified) . ' GMT',
        ]);
    }

    /**
     * Wrap certificate HTML with a semi-transparent background image layer when template has one.
     */
    private function wrapContentWithBackground(string $html, ?CertificateTemplate $template): string
    {
        if (!$template || !$template->background_path) {
            return $html;
        }
        // Use app route so the image works even when public/storage symlink doesn't exist.
        // Use <img> instead of CSS background-image so the background prints / saves in PDF.
        // Add cache-busting query parameter based on updated_at timestamp to prevent stale images
        $updatedAt = $template->updated_at ? $template->updated_at->timestamp : time();
        $url = route('certification.templates.background', ['template' => $template->id]) . '?v=' . $updatedAt;
        $opacity = $template->background_opacity !== null
            ? (float) $template->background_opacity
            : 0.35;
        $opacity = max(0.1, min(0.8, $opacity)); // clamp between 0.1 and 0.8
        $safeUrl = e($url);
        // Size the wrapper to match the certificate template (max 800px) so the bg crops to the same box
        return '<div class="certificate-outer" style="position:relative; max-width:800px; margin:0 auto; width:100%;">'
            . '<img class="certificate-bg" src="' . $safeUrl . '" alt="" style="position:absolute; inset:0; width:100%; height:100%; object-fit:cover; object-position:center; opacity:' . $opacity . '; z-index:0;" />'
            . '<div class="certificate-content" style="position:relative; z-index:1; background:transparent;">' . $html . '</div>'
            . '</div>';
    }

    /**
     * Wrap certificate HTML with background from stored snapshot path.
     */
    private function wrapContentWithBackgroundFromPath(string $html, int $certificateId, string $backgroundPath, float $opacity): string
    {
        if (!$backgroundPath || !Storage::disk('public')->exists($backgroundPath)) {
            return $html;
        }
        // Use certificate-specific route for snapshot background
        // Add cache-busting based on file modification time
        $filePath = Storage::disk('public')->path($backgroundPath);
        $fileTime = file_exists($filePath) ? filemtime($filePath) : time();
        $url = route('certificates.background', ['certificate' => $certificateId]) . '?v=' . $fileTime;
        $opacity = max(0.1, min(0.8, $opacity)); // clamp between 0.1 and 0.8
        $safeUrl = e($url);
        return '<div class="certificate-outer" style="position:relative; max-width:800px; margin:0 auto; width:100%;">'
            . '<img class="certificate-bg" src="' . $safeUrl . '" alt="" style="position:absolute; inset:0; width:100%; height:100%; object-fit:cover; object-position:center; opacity:' . $opacity . '; z-index:0;" />'
            . '<div class="certificate-content" style="position:relative; z-index:1; background:transparent;">' . $html . '</div>'
            . '</div>';
    }

    /**
     * Merge content from stored template snapshot with participant data.
     */
    private function mergeContentFromSnapshot(string $templateContent, array $data, ?string $backgroundPath): string
    {
        // Don't include background_image in data since we handle it separately via wrapContentWithBackgroundFromPath
        foreach (CertificateTemplate::placeholders() as $key) {
            if ($key !== 'background_image') {
                $templateContent = str_replace('{' . $key . '}', (string) ($data[$key] ?? ''), $templateContent);
            }
        }
        return $templateContent;
    }

    /**
     * Serve the background image from a certificate's stored snapshot.
     */
    public function certificateBackground(Certificate $certificate)
    {
        if (!$certificate->template_background_path || !Storage::disk('public')->exists($certificate->template_background_path)) {
            abort(404);
        }
        $path = Storage::disk('public')->path($certificate->template_background_path);
        return response()->file($path, [
            'Content-Type' => \Illuminate\Support\Facades\File::mimeType($path),
        ]);
    }

    /**
     * Preview how the certificate would look for a specific participant (before issuing).
     */
    public function previewParticipant(Request $request)
    {
        $request->validate([
            'user_id' => ['required', 'exists:users,id'],
            'event_id' => ['required', 'exists:simulation_events,id'],
        ]);
        $user = \App\Models\User::findOrFail($request->user_id);
        $event = SimulationEvent::findOrFail($request->event_id);
        $pe = ParticipantEvaluation::where('user_id', $user->id)
            ->whereHas('evaluation', fn ($q) => $q->where('simulation_event_id', $event->id))
            ->with('evaluation')
            ->first();
        $template = CertificateTemplate::where('status', 'active')->first();
        if (!$template) {
            $template = new CertificateTemplate();
        }
        $data = [
            'name' => $user->name,
            'date' => $event->event_date ? $event->event_date->format('F j, Y') : now()->format('F j, Y'),
            'event' => $event->title,
            'certificate_number' => 'PREVIEW',
            'score' => $pe && $pe->average_score !== null ? (string) round((float) $pe->average_score, 1) : '',
            'training_type' => $event->scenario?->title ?? 'Disaster Preparedness Training',
        ];
        $html = $template->mergeContent($data);
        $html = $this->wrapContentWithBackground($html, $template->id ? $template : null);
        return view('certificate.preview', [
            'content' => $html,
            'template' => $template,
            'title' => 'Certificate preview — ' . $user->name,
            'subtitle' => 'Preview of how the certificate will look for this participant (not yet issued).',
        ]);
    }

    /**
     * Preview a template with sample data (placeholders replaced by example values).
     */
    public function previewTemplate(CertificateTemplate $template)
    {
        $sample = [
            'name' => 'Juan Dela Cruz',
            'date' => now()->format('F j, Y'),
            'event' => 'Sample Simulation Event',
            'certificate_number' => 'CERT-' . date('Y') . '-00001',
            'score' => '85',
            'training_type' => 'Disaster Preparedness Training',
        ];
        $html = $template->mergeContent($sample);
        $html = $this->wrapContentWithBackground($html, $template);
        $paperSize = $template && in_array($template->paper_size ?? '', ['a4', 'letter'], true) ? $template->paper_size : 'a4';
        return view('certificate.preview', ['content' => $html, 'template' => $template, 'paperSize' => $paperSize]);
    }

    /**
     * View issued certificate (merged template with real participant data).
     * Uses the stored template snapshot (background_path, opacity, paper_size) from when the certificate was issued.
     */
    public function viewCertificate(Certificate $certificate)
    {
        $certificate->load(['user', 'simulationEvent', 'certificateTemplate']);
        $template = $certificate->certificateTemplate ?? CertificateTemplate::where('status', 'active')->first();
        
        // Use stored snapshot if available, otherwise fall back to current template
        $backgroundPath = $certificate->template_background_path ?? $template?->background_path;
        $backgroundOpacity = $certificate->template_background_opacity !== null 
            ? (float) $certificate->template_background_opacity 
            : ($template?->background_opacity ?? 0.35);
        $paperSize = $certificate->template_paper_size ?? ($template?->paper_size ?? 'a4');
        
        $data = [
            'name' => $certificate->user->name ?? '',
            'date' => $certificate->completion_date ? $certificate->completion_date->format('F j, Y') : '',
            'event' => $certificate->simulationEvent->title ?? '',
            'certificate_number' => $certificate->certificate_number,
            'score' => $certificate->final_score ? (string) round((float) $certificate->final_score, 1) : '',
            'training_type' => $certificate->training_type ?? '',
        ];
        
        // Use stored template content snapshot if available, otherwise use current template
        if ($certificate->template_content) {
            // Use the stored template content from when certificate was issued
            $html = $this->mergeContentFromSnapshot($certificate->template_content, $data, $certificate->template_background_path);
        } else {
            // Fall back to current template (for certificates issued before snapshot was added)
            $html = $template ? $template->mergeContent($data) : $this->fallbackCertificateHtml($data);
        }
        
        // Use stored snapshot background if available
        if ($backgroundPath && $certificate->template_background_path) {
            // Use certificate-specific background route
            $html = $this->wrapContentWithBackgroundFromPath($html, $certificate->id, $backgroundPath, $backgroundOpacity);
        } else {
            // Fall back to template background (for certificates issued before snapshot was added)
            $html = $this->wrapContentWithBackground($html, $template);
        }
        
        $paperSize = in_array($paperSize, ['a4', 'letter'], true) ? $paperSize : 'a4';
        $orientation = request()->query('orientation', 'landscape');
        if (! in_array($orientation, ['portrait', 'landscape'], true)) {
            $orientation = 'landscape';
        }
        $autoPrint = request()->query('print') === '1' || request()->query('print') === 'true';
        return view('certificate.view', [
            'content' => $html,
            'certificate' => $certificate,
            'paperSize' => $paperSize,
            'orientation' => $orientation,
            'autoPrint' => $autoPrint,
        ]);
    }

    private function fallbackCertificateHtml(array $data): string
    {
        $t = new CertificateTemplate();
        return $t->mergeContent($data);
    }

    public function destroyTemplate(CertificateTemplate $template)
    {
        $template->delete();
        return response()->json(['success' => true]);
    }

    public function duplicateTemplate(CertificateTemplate $template)
    {
        $new = $template->replicate();
        $new->name = $template->name . ' (Copy)';
        $new->save();
        return response()->json(['success' => true, 'template' => $new]);
    }

    /**
     * Automation settings
     */
    public function updateSettings(Request $request)
    {
        $data = $request->validate([
            'auto_issue_when_passed' => ['nullable', 'boolean'],
            'require_attendance' => ['nullable', 'boolean'],
            'require_supervisor_approval' => ['nullable', 'boolean'],
        ]);
        foreach ($data as $key => $value) {
            CertificationSetting::set($key, $value ? '1' : '0');
        }
        return response()->json(['success' => true]);
    }

    /**
     * Export
     */
    public function export(Request $request, string $format = 'csv')
    {
        $query = Certificate::with(['user', 'simulationEvent', 'issuer'])
            ->whereNull('revoked_at');
        if ($request->get('event_id')) {
            $query->where('simulation_event_id', $request->get('event_id'));
        }
        if ($request->get('date_from')) {
            $query->whereDate('issued_at', '>=', $request->get('date_from'));
        }
        if ($request->get('date_to')) {
            $query->whereDate('issued_at', '<=', $request->get('date_to'));
        }
        $certificates = $query->orderByDesc('issued_at')->get();

        if ($format === 'csv') {
            $filename = 'certificates_' . date('Y-m-d_His') . '.csv';
            $headers = [
                'Content-Type' => 'text/csv',
                'Content-Disposition' => "attachment; filename=\"{$filename}\"",
            ];
            $callback = function () use ($certificates) {
                $file = fopen('php://output', 'w');
                fputcsv($file, ['Certificate ID', 'Participant Name', 'Event', 'Type', 'Score', 'Issue Date', 'Issued By']);
                foreach ($certificates as $c) {
                    fputcsv($file, [
                        $c->certificate_number,
                        $c->user->name ?? '',
                        $c->simulationEvent->title ?? '',
                        $c->type,
                        $c->final_score ?? '',
                        $c->issued_at->format('Y-m-d H:i'),
                        $c->issuer->name ?? '',
                    ]);
                }
                fclose($file);
            };
            return response()->stream($callback, 200, $headers);
        }

        return back()->with('status', 'PDF export not yet implemented.');
    }

    private function authorizeCertificationAccess(): void
    {
        $user = Auth::user();
        if (!$user || !in_array($user->role, ['SUPER_ADMIN', 'LGU_ADMIN', 'LGU_TRAINER'], true)) {
            abort(403);
        }
    }
}
