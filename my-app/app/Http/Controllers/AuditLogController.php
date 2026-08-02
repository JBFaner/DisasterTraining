<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use Illuminate\Http\Request;

class AuditLogController extends Controller
{
    /** Roles allowed to view system audit logs. */
    private function authorizeAuditAccess(): void
    {
        $user = portal_user();
        $role = $user?->role;

        if (! $user || ! in_array($role, ['LGU_ADMIN', 'SUPER_ADMIN'], true)) {
            abort(403, 'Only LGU Admin can access audit logs.');
        }
    }

    public function index(Request $request)
    {
        $this->authorizeAuditAccess();

        return view('app', [
            'section' => 'audit_logs',
        ]);
    }

    public function history(Request $request)
    {
        $this->authorizeAuditAccess();

        $query = AuditLog::query()->with('user');

        if ($request->filled('user')) {
            $query->where(function ($q) use ($request) {
                $q->where('user_name', 'like', '%' . $request->user . '%')
                    ->orWhereHas('user', function ($uq) use ($request) {
                        $uq->where('name', 'like', '%' . $request->user . '%');
                    });
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('module')) {
            $query->where('module', $request->module);
        }

        if ($request->filled('action')) {
            $query->where('action', $request->action);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('description', 'like', '%' . $search . '%')
                    ->orWhere('action', 'like', '%' . $search . '%')
                    ->orWhere('user_name', 'like', '%' . $search . '%')
                    ->orWhere('module', 'like', '%' . $search . '%');
            });
        }

        if ($request->filled('date_from')) {
            $query->whereDate('performed_at', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->whereDate('performed_at', '<=', $request->date_to);
        }

        $sortBy = $request->get('sort_by', 'performed_at');
        $sortDir = $request->get('sort_dir', 'desc');

        if (! in_array($sortBy, ['performed_at', 'user_name', 'status', 'module', 'action'], true)) {
            $sortBy = 'performed_at';
        }

        if (! in_array($sortDir, ['asc', 'desc'], true)) {
            $sortDir = 'desc';
        }

        $query->orderBy($sortBy, $sortDir);

        $perPage = (int) $request->get('per_page', 15);
        $perPage = max(5, min(50, $perPage));

        $logs = $query->paginate($perPage);

        $modules = AuditLog::query()
            ->whereNotNull('module')
            ->where('module', '!=', '')
            ->distinct()
            ->orderBy('module')
            ->pluck('module')
            ->values();

        return response()->json([
            'data' => $logs->items(),
            'meta' => [
                'current_page' => $logs->currentPage(),
                'last_page' => $logs->lastPage(),
                'per_page' => $logs->perPage(),
                'total' => $logs->total(),
            ],
            'filters' => [
                'modules' => $modules,
            ],
        ]);
    }

    public function export(Request $request)
    {
        $this->authorizeAuditAccess();

        $format = $request->get('format', 'csv');

        $query = AuditLog::query()->orderBy('performed_at', 'desc');

        if ($request->filled('module')) {
            $query->where('module', $request->module);
        }
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }
        if ($request->filled('date_from')) {
            $query->whereDate('performed_at', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->whereDate('performed_at', '<=', $request->date_to);
        }
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('description', 'like', '%' . $search . '%')
                    ->orWhere('action', 'like', '%' . $search . '%')
                    ->orWhere('user_name', 'like', '%' . $search . '%');
            });
        }

        $logs = $query->get();

        if ($format === 'xlsx') {
            $format = 'csv';
        }

        if ($format === 'pdf') {
            $filename = 'audit_logs_' . date('Y-m-d_His') . '.pdf';
            $headers = [
                'Content-Type' => 'application/pdf',
                'Content-Disposition' => "attachment; filename=\"{$filename}\"",
            ];

            $html = view('emails.audit-logs-pdf', ['logs' => $logs])->render();

            return response($html, 200, $headers);
        }

        $filename = 'audit_logs_' . date('Y-m-d_His') . '.csv';
        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ];

        $callback = function () use ($logs) {
            $file = fopen('php://output', 'w');
            fputcsv($file, ['When', 'User', 'Role', 'Action', 'Module', 'Status', 'IP Address', 'Description']);

            foreach ($logs as $log) {
                fputcsv($file, [
                    optional($log->performed_at)->format('Y-m-d H:i:s'),
                    $log->user_name,
                    $log->user_role,
                    $log->action,
                    $log->module,
                    $log->status,
                    $log->ip_address,
                    $log->description,
                ]);
            }

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }
}
