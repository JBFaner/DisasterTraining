<?php

namespace App\Http\Controllers;

use App\Mail\AdminEmailVerificationMail;
use App\Models\AuditLog;
use App\Models\BarangayProfile;
use App\Models\SimulationExerciseTemplate;
use App\Models\User;
use App\Services\AuditLogger;
use App\Services\StaffTrainerBridgeService;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\URL;

class AdminUserController extends Controller
{
    /**
     * Check if the current user can manage the target user.
     * 
     * @param User $currentUser The authenticated user
     * @param User $targetUser The user being managed
     * @return bool
     */
    protected function canManageUser(User $currentUser, User $targetUser): bool
    {
        // Admin has full access - can manage everyone
        if ($currentUser->role === 'LGU_ADMIN') {
            return true;
        }

        // Other roles cannot manage users
        return false;
    }

    /**
     * Check if the current user has access to user management.
     * 
     * @param User|null $user
     * @return bool
     */
    protected function hasUserManagementAccess(?User $user): bool
    {
        return $user && $user->role === 'LGU_ADMIN';
    }

    /**
     * @return list<string>
     */
    public static function trainerOnlyPositions(): array
    {
        return ['Lead Trainer', 'Assistant Trainer'];
    }

    protected function normalizePosition(?string $position, string $accountType): ?string
    {
        $position = $position !== null ? trim($position) : null;
        if ($position === '' || $position === '__add__') {
            return null;
        }

        if (in_array($accountType, ['STAFF', 'VIEWER'], true)
            && in_array($position, self::trainerOnlyPositions(), true)) {
            return null;
        }

        return $position;
    }

    /**
     * Default + custom position labels for staff users (single primary position).
     *
     * @return list<string>
     */
    public static function positionOptions(): array
    {
        $defaults = SimulationExerciseTemplate::PERSONNEL_ROLES;

        $custom = User::query()
            ->whereIn('role', ['LGU_ADMIN', 'LGU_TRAINER', 'STAFF', 'VIEWER'])
            ->whereNotNull('position')
            ->where('position', '!=', '')
            ->distinct()
            ->orderBy('position')
            ->pluck('position')
            ->all();

        return array_values(array_unique([...$defaults, ...$custom]));
    }

    /**
     * List all admin/trainer/staff users (excluding participants).
     */
    public function index(Request $request)
    {
        $user = portal_user();

        if (! $this->hasUserManagementAccess($user)) {
            abort(403);
        }

        $query = User::query()
            ->with('barangayProfile')
            // Fetch only staff-type users (Super Admin, LGU Admin, Trainer, Staff), never participants
            ->whereIn('role', ['LGU_ADMIN', 'LGU_TRAINER', 'STAFF', 'VIEWER'])
            ->orderByDesc('created_at');

        // Search by name or email
        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', '%' . $search . '%')
                    ->orWhere('email', 'like', '%' . $search . '%')
                    ->orWhere('position', 'like', '%' . $search . '%');
            });
        }

        // Role / position filtering is handled client-side.
        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }

        $users = $query->get();

        return view('app', [
            'section' => 'admin_users_index',
            'users' => $users,
            'currentUser' => $user,
            'positionOptions' => self::positionOptions(),
        ]);
    }

    /**
     * Show the form to register a new LGU Admin, Trainer, or Participant.
     */
    public function create(Request $request)
    {
        $user = portal_user();

        if (! $this->hasUserManagementAccess($user)) {
            abort(403);
        }

        $barangayProfiles = BarangayProfile::orderBy('barangay_name')->get();
        $roles = DB::table('roles')->orderBy('name')->get();

        // Render inside the SPA shell so sidebar/navigation stays visible.
        // Note: currentUser is automatically available via auth()->user() in the blade template
        return view('app', [
            'section' => 'admin_users_create',
            'barangay_profiles' => $barangayProfiles,
            'roles' => $roles,
            'positionOptions' => self::positionOptions(),
        ]);
    }

    /**
     * Show the form to edit an existing user.
     */
    public function edit(User $user)
    {
        $currentUser = portal_user();

        if (! $this->hasUserManagementAccess($currentUser)) {
            abort(403);
        }
        if (! $this->canManageUser($currentUser, $user)) {
            abort(403, 'You do not have permission to edit this user.');
        }
        if (in_array($user->role, ['LGU_ADMIN', 'LGU_TRAINER', 'STAFF', 'VIEWER'], true) === false) {
            abort(404);
        }

        $user->load('barangayProfile');
        $barangayProfiles = BarangayProfile::orderBy('barangay_name')->get();
        $roles = DB::table('roles')->orderBy('name')->get();

        return view('app', [
            'section' => 'admin_users_edit',
            'user' => $user,
            'currentUser' => $currentUser,
            'barangay_profiles' => $barangayProfiles,
            'roles' => $roles,
            'positionOptions' => self::positionOptions(),
        ]);
    }

    /**
     * Show user details (read-only view).
     */
    public function show(User $user)
    {
        $currentUser = portal_user();

        if (! $this->hasUserManagementAccess($currentUser)) {
            abort(403);
        }

        // Check if current user can view this user
        $canView = false;

        if ($currentUser->role === 'LGU_ADMIN') {
            $canView = true;
        }

        if (! $canView) {
            abort(403, 'You do not have permission to view this user.');
        }

        // Only show staff users (not participants)
        if (! in_array($user->role, ['LGU_ADMIN', 'LGU_TRAINER', 'STAFF', 'VIEWER'], true)) {
            abort(404);
        }

        // Get recent login history (last 5 successful logins)
        $recentLogins = AuditLog::where('user_id', $user->id)
            ->where('action', 'LIKE', '%login%')
            ->where('status', 'success')
            ->orderByDesc('performed_at')
            ->limit(5)
            ->get();

        // Get recent system actions (last 10 actions)
        $recentActions = AuditLog::where('user_id', $user->id)
            ->orderByDesc('performed_at')
            ->limit(10)
            ->get();

        return view('app', [
            'section' => 'admin_users_show',
            'user' => $user,
            'currentUser' => $currentUser,
            'recent_logins' => $recentLogins,
            'recent_actions' => $recentActions,
        ]);
    }

    /**
     * Disable a staff account (soft lock).
     */
    public function disable(Request $request, User $user)
    {
        $currentUser = portal_user();

        if (! $this->hasUserManagementAccess($currentUser)) {
            if ($request->expectsJson() || $request->ajax()) {
                return response()->json(['error' => 'Unauthorized'], 403);
            }
            abort(403);
        }

        // Check if current user can manage this user
        if (! $this->canManageUser($currentUser, $user)) {
            if ($request->expectsJson() || $request->ajax()) {
                return response()->json(['error' => 'You do not have permission to manage this user.'], 403);
            }
            abort(403, 'You do not have permission to manage this user.');
        }

        if ($user->role === 'PARTICIPANT') {
            if ($request->expectsJson() || $request->ajax()) {
                return response()->json(['error' => 'Cannot disable participant accounts.'], 404);
            }
            abort(404);
        }

        // Validation: Prevent disabling yourself
        if ($currentUser->id === $user->id) {
            if ($request->expectsJson() || $request->ajax()) {
                return response()->json(['error' => 'You cannot disable your own account.'], 400);
            }
            return redirect()->back()->withErrors(['error' => 'You cannot disable your own account.']);
        }

        // Validation: Check if already disabled
        if ($user->status === 'disabled') {
            if ($request->expectsJson() || $request->ajax()) {
                return response()->json(['error' => 'User account is already disabled.'], 400);
            }
            return redirect()->back()->with('status', 'User account is already disabled.');
        }

        $old = $user->only(['status']);
        
        // Disable account
        $user->status = 'disabled';
        
        $user->save();

        app(StaffTrainerBridgeService::class)->ensureMirror($user);

        // Note: For session-based auth, we can't directly invalidate their session from here,
        // but the login check in AuthController will prevent them from accessing protected routes
        // The user will be logged out on their next request when the middleware checks their status

        AuditLogger::log([
            'user' => $currentUser,
            'action' => 'Account disabled',
            'module' => 'Users & Roles',
            'status' => 'success',
            'description' => 'Staff account disabled from Users & Roles. Session invalidated.',
            'old_values' => $old,
            'new_values' => $user->only(['status']),
        ]);

        if ($request->expectsJson() || $request->ajax()) {
            return response()->json([
                'success' => true,
                'message' => 'User account disabled.',
                'user' => [
                    'id' => $user->id,
                    'status' => $user->status,
                ],
            ]);
        }

        return redirect()->back()->with('status', 'User account disabled.');
    }

    /**
     * Enable a previously disabled staff account.
     */
    public function enable(Request $request, User $user)
    {
        $currentUser = portal_user();

        if (! $this->hasUserManagementAccess($currentUser)) {
            if ($request->expectsJson() || $request->ajax()) {
                return response()->json(['error' => 'Unauthorized'], 403);
            }
            abort(403);
        }

        // Check if current user can manage this user
        if (! $this->canManageUser($currentUser, $user)) {
            if ($request->expectsJson() || $request->ajax()) {
                return response()->json(['error' => 'You do not have permission to manage this user.'], 403);
            }
            abort(403, 'You do not have permission to manage this user.');
        }

        if ($user->role === 'PARTICIPANT') {
            if ($request->expectsJson() || $request->ajax()) {
                return response()->json(['error' => 'Cannot enable participant accounts.'], 404);
            }
            abort(404);
        }

        // Validation: Check if user is already active
        if ($user->status === 'active') {
            if ($request->expectsJson() || $request->ajax()) {
                return response()->json(['error' => 'User account is already active.'], 400);
            }
            return redirect()->back()->with('status', 'User account is already active.');
        }

        $old = $user->only(['status']);
        
        // Enable account
        $user->status = 'active';
        
        $user->save();

        app(StaffTrainerBridgeService::class)->ensureMirror($user);

        AuditLogger::log([
            'user' => $currentUser,
            'action' => 'Account enabled',
            'module' => 'Users & Roles',
            'status' => 'success',
            'description' => 'Staff account re-enabled from Users & Roles.',
            'old_values' => $old,
            'new_values' => $user->only(['status']),
        ]);

        if ($request->expectsJson() || $request->ajax()) {
            return response()->json([
                'success' => true,
                'message' => 'User account enabled.',
                'user' => [
                    'id' => $user->id,
                    'status' => $user->status,
                ],
            ]);
        }

        return redirect()->back()->with('status', 'User account enabled.');
    }


    /**
     * Reset password and send a temporary password via email.
     */
    public function resetPassword(User $user)
    {
        $currentUser = portal_user();

        if (! $this->hasUserManagementAccess($currentUser)) {
            abort(403);
        }

        // Check if current user can manage this user
        if (! $this->canManageUser($currentUser, $user)) {
            abort(403, 'You do not have permission to manage this user.');
        }

        if ($user->role === 'PARTICIPANT') {
            abort(404);
        }

        $temporaryPassword = str()->random(10);
        $old = $user->only(['id', 'email']);

        $user->password = Hash::make($temporaryPassword);
        $user->save();

        try {
            Mail::raw(
                "Your password has been reset by an administrator.\n\nTemporary password: {$temporaryPassword}\n\nPlease log in and change your password as soon as possible.",
                function ($message) use ($user) {
                    $message->to($user->email)
                        ->subject('Your LGU Training Portal temporary password');
                }
            );
        } catch (\Exception $e) {
            \Log::error('Failed to send reset password email: ' . $e->getMessage());
        }

        AuditLogger::log([
            'user' => $currentUser,
            'action' => 'Password reset',
            'module' => 'Users & Roles',
            'status' => 'success',
            'description' => 'Temporary password generated and emailed to staff user.',
            'old_values' => $old,
        ]);

        return redirect()->back()->with('status', 'Temporary password generated and emailed to the user.');
    }

    /**
     * Manually verify a staff account that is still pending_verification.
     */
    public function manualVerify(User $user)
    {
        $currentUser = portal_user();

        if (! $this->hasUserManagementAccess($currentUser)) {
            abort(403);
        }

        // Check if current user can manage this user
        if (! $this->canManageUser($currentUser, $user)) {
            abort(403, 'You do not have permission to manage this user.');
        }

        // Never allow verifying participants from this panel
        if ($user->role === 'PARTICIPANT') {
            abort(404);
        }

        if ($user->status !== 'pending_verification') {
            return redirect()->back()->with('status', 'User is already verified.');
        }

        $old = $user->only(['status', 'email_verified_at']);

        $user->status = 'active';
        if (! $user->email_verified_at) {
            $user->email_verified_at = now();
        }
        $user->save();

        app(StaffTrainerBridgeService::class)->ensureMirror($user);

        AuditLogger::log([
            'user' => $currentUser,
            'action' => 'Manually verified staff account',
            'module' => 'Users & Roles',
            'status' => 'success',
            'description' => 'Admin marked staff account as verified from Users & Roles panel.',
            'old_values' => $old,
            'new_values' => $user->only(['status', 'email_verified_at']),
        ]);

        return redirect()->back()->with('status', 'User account marked as verified and activated.');
    }

    /**
     * Store a newly created LGU Admin or Trainer with email verification.
     */
    public function store(Request $request)
    {
        $currentUser = portal_user();

        if (! $this->hasUserManagementAccess($currentUser)) {
            abort(403);
        }

        // Admin can create staff/viewer accounts from this screen (participants use a separate registration flow)
        $allowedRoles = ['LGU_ADMIN', 'LGU_TRAINER', 'STAFF', 'VIEWER'];

        $data = $request->validate([
            'last_name' => ['required', 'string', 'max:255'],
            'first_name' => ['required', 'string', 'max:255'],
            'middle_name' => ['nullable', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')],
            'password' => ['required', 'confirmed', 'min:8'],
            'account_type' => ['required', 'in:' . implode(',', $allowedRoles)],
            'barangay_id' => ['nullable', 'integer', 'exists:barangay_profiles,id'],
            'position' => ['nullable', 'string', 'max:120'],
        ], [
            'email.unique' => 'The email has already been taken.',
        ]);

        $fullName = trim(
            $data['first_name']
            . (isset($data['middle_name']) && $data['middle_name'] !== '' ? ' ' . $data['middle_name'] : '')
            . ' ' . $data['last_name']
        );

        $position = $this->normalizePosition($data['position'] ?? null, $data['account_type']);

        // Create the staff (admin, trainer, staff, or viewer) user in a pending state
        $admin = User::create([
            'name' => $fullName,
            'email' => $data['email'],
            'password' => $data['password'], // hashed via User model casts
            'role' => $data['account_type'],
            'position' => $position,
            'status' => 'pending_verification',
            'registered_at' => now(),
            'barangay_id' => $data['barangay_id'] ?? null,
        ]);

        // Generate a signed email verification URL for this admin
        $verificationUrl = URL::temporarySignedRoute(
            'admin.verify-email',
            now()->addMinutes(60),
            ['user' => $admin->id]
        );

        try {
            Mail::to($admin->email)->send(new AdminEmailVerificationMail($admin, $verificationUrl));
        } catch (\Exception $e) {
            \Log::error('Failed to send admin email verification: ' . $e->getMessage());

            return back()
                ->withErrors(['email' => 'Admin created but failed to send verification email. Please try again later.'])
                ->withInput($request->except('password', 'password_confirmation', 'face_image'));
        }

        AuditLogger::log([
            'user' => $currentUser,
            'action' => 'Created staff account',
            'module' => 'Users & Roles',
            'status' => 'success',
            'description' => 'New ' . ($admin->role === 'LGU_TRAINER' ? 'trainer' : 'admin') . ' account created from admin panel.',
            'new_values' => [
                'id' => $admin->id,
                'name' => $admin->name,
                'email' => $admin->email,
                'role' => $admin->role,
                'position' => $admin->position,
            ],
        ]);

        app(StaffTrainerBridgeService::class)->ensureMirror($admin);

        return redirect()->route('admin.users.index')
            ->with('status', 'Account created successfully. The user must verify their email before they can log in.');
    }

    /**
     * Update an existing user (name, email, role, barangay, optional password).
     */
    public function update(Request $request, User $user)
    {
        $currentUser = portal_user();

        if (! $this->hasUserManagementAccess($currentUser)) {
            abort(403);
        }
        if (! $this->canManageUser($currentUser, $user)) {
            abort(403, 'You do not have permission to edit this user.');
        }
        if (in_array($user->role, ['LGU_ADMIN', 'LGU_TRAINER', 'STAFF', 'VIEWER'], true) === false) {
            abort(404);
        }

        $allowedRoles = ['LGU_ADMIN', 'LGU_TRAINER', 'STAFF', 'VIEWER'];

        $rules = [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email,' . $user->id],
            'account_type' => ['required', 'in:' . implode(',', $allowedRoles)],
            'barangay_id' => ['nullable', 'integer', 'exists:barangay_profiles,id'],
            'position' => ['nullable', 'string', 'max:120'],
        ];
        if ($request->filled('password')) {
            $rules['password'] = ['required', 'confirmed', 'min:8'];
        }

        $data = $request->validate($rules);

        $old = $user->only(['name', 'email', 'role', 'barangay_id', 'position']);

        $position = $this->normalizePosition($data['position'] ?? null, $data['account_type']);

        $user->name = $data['name'];
        $user->email = $data['email'];
        $user->role = $data['account_type'];
        $user->position = $position;
        $user->barangay_id = $data['barangay_id'] ?? null;
        if (! empty($data['password'])) {
            $user->password = $data['password'];
        }
        $user->save();

        app(StaffTrainerBridgeService::class)->ensureMirror($user);

        AuditLogger::log([
            'user' => $currentUser,
            'action' => 'Updated user',
            'module' => 'Users & Roles',
            'status' => 'success',
            'description' => 'User account updated from Users & Roles.',
            'old_values' => $old,
            'new_values' => $user->only(['name', 'email', 'role', 'barangay_id']),
        ]);

        return redirect()->route('admin.users.index')
            ->with('status', 'User updated successfully.');
    }

    /**
     * Handle admin email verification via signed link.
     */
    public function verifyEmail(Request $request, User $user)
    {
        if (! $request->hasValidSignature()) {
            abort(403);
        }

        if (! in_array($user->role, ['LGU_ADMIN', 'LGU_TRAINER'], true)) {
            abort(403);
        }

        if (! $user->email_verified_at) {
            $user->email_verified_at = now();

            if ($user->status === 'pending_verification') {
                $user->status = 'active';
            }

            $user->save();
            app(StaffTrainerBridgeService::class)->ensureMirror($user);
        }

        AuditLogger::log([
            'user' => $user,
            'action' => 'Email verified',
            'module' => 'Auth',
            'status' => 'success',
            'description' => 'Admin/trainer email verified via signed link.',
        ]);

        return redirect()->route('participant.login')
            ->with('status', 'Your account email has been verified. You can now log in.');
    }

    /**
     * Generate a unique participant ID (same pattern as participant self-registration).
     */
    protected function generateParticipantId(): string
    {
        do {
            $id = 'PART-' . strtoupper(\Illuminate\Support\Str::random(8));
        } while (User::where('participant_id', $id)->exists());

        return $id;
    }
}

