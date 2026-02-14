<?php

namespace App\Http\Controllers;

use App\Mail\AdminEmailVerificationMail;
use App\Models\AuditLog;
use App\Models\BarangayProfile;
use App\Models\User;
use App\Services\AuditLogger;
use Illuminate\Http\Request;
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
        // Super Admin can manage everyone
        if ($currentUser->role === 'SUPER_ADMIN') {
            return true;
        }

        // LGU Admin can only manage their own account
        if ($currentUser->role === 'LGU_ADMIN') {
            return $currentUser->id === $targetUser->id;
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
        return $user && in_array($user->role, ['SUPER_ADMIN', 'LGU_ADMIN'], true);
    }

    /**
     * List all admin/trainer/staff users (excluding participants).
     */
    public function index(Request $request)
    {
        $user = Auth::user();

        if (! $this->hasUserManagementAccess($user)) {
            abort(403);
        }

        $query = User::query()
            ->with('barangayProfile')
            // Fetch only staff-type users (Super Admin, LGU Admin, Trainer, Staff), never participants
            ->whereIn('role', ['SUPER_ADMIN', 'LGU_ADMIN', 'LGU_TRAINER', 'STAFF'])
            ->orderByDesc('created_at');

        // Search by name or email
        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', '%' . $search . '%')
                    ->orWhere('email', 'like', '%' . $search . '%');
            });
        }

        // Filter by role
        if ($role = $request->query('role')) {
            $query->where('role', $role);
        }

        // Filter by status
        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }

        $users = $query->get();

        return view('app', [
            'section' => 'admin_users_index',
            'users' => $users,
            'currentUser' => $user, // Pass current user for frontend authorization
        ]);
    }

    /**
     * Show the form to register a new LGU Admin, Trainer, or Participant.
     */
    public function create(Request $request)
    {
        $user = Auth::user();

        if (! $this->hasUserManagementAccess($user)) {
            abort(403);
        }

        $barangayProfiles = BarangayProfile::orderBy('barangay_name')->get();

        // Render inside the SPA shell so sidebar/navigation stays visible.
        return view('app', [
            'section' => 'admin_users_create',
            'barangay_profiles' => $barangayProfiles,
        ]);
    }

    /**
     * Show the form to edit an existing user.
     */
    public function edit(User $user)
    {
        $currentUser = Auth::user();

        if (! $this->hasUserManagementAccess($currentUser)) {
            abort(403);
        }
        if (! $this->canManageUser($currentUser, $user)) {
            abort(403, 'You do not have permission to edit this user.');
        }
        if (in_array($user->role, ['SUPER_ADMIN', 'LGU_ADMIN', 'LGU_TRAINER', 'STAFF'], true) === false) {
            abort(404);
        }

        $user->load('barangayProfile');
        $barangayProfiles = BarangayProfile::orderBy('barangay_name')->get();

        return view('app', [
            'section' => 'admin_users_edit',
            'user' => $user,
            'currentUser' => $currentUser,
            'barangay_profiles' => $barangayProfiles,
            'canViewSecurity' => false,
            'maskedUsbKeyHash' => '',
        ]);
    }

    /**
     * Show user details (read-only view).
     */
    public function show(User $user)
    {
        $currentUser = Auth::user();

        if (! $this->hasUserManagementAccess($currentUser)) {
            abort(403);
        }

        // Check if current user can view this user
        // Super Admin can view all, LGU Admin can only view themselves
        $canView = false;
        $canViewSecurity = false;

        if ($currentUser->role === 'SUPER_ADMIN') {
            $canView = true;
            $canViewSecurity = true;
        } elseif ($currentUser->role === 'LGU_ADMIN' && $currentUser->id === $user->id) {
            $canView = true;
            $canViewSecurity = true;
        } elseif ($currentUser->role === 'LGU_ADMIN') {
            // LGU Admin can view basic info of other users, but not security details
            $canView = true;
            $canViewSecurity = false;
        }

        if (! $canView) {
            abort(403, 'You do not have permission to view this user.');
        }

        // Only show staff users (not participants)
        if (! in_array($user->role, ['SUPER_ADMIN', 'LGU_ADMIN', 'LGU_TRAINER', 'STAFF'], true)) {
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

        // Mask USB key hash for display (show first 8 and last 4 characters)
        $maskedUsbKeyHash = null;
        if ($user->usb_key_hash && $canViewSecurity) {
            $hash = $user->usb_key_hash;
            if (strlen($hash) > 12) {
                $maskedUsbKeyHash = substr($hash, 0, 8) . '...' . substr($hash, -4);
            } else {
                $maskedUsbKeyHash = str_repeat('*', strlen($hash));
            }
        }

        return view('app', [
            'section' => 'admin_users_show',
            'user' => $user,
            'currentUser' => $currentUser,
            'canViewSecurity' => $canViewSecurity,
            'recent_logins' => $recentLogins,
            'recent_actions' => $recentActions,
            'maskedUsbKeyHash' => $maskedUsbKeyHash,
        ]);
    }

    /**
     * Disable a staff account (soft lock).
     */
    public function disable(User $user)
    {
        $currentUser = Auth::user();

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

        $old = $user->only(['status']);
        $user->status = 'inactive';
        $user->save();

        AuditLogger::log([
            'user' => $currentUser,
            'action' => 'Account disabled',
            'module' => 'Users & Roles',
            'status' => 'success',
            'description' => 'Staff account disabled from Users & Roles.',
            'old_values' => $old,
            'new_values' => $user->only(['status']),
        ]);

        return redirect()->back()->with('status', 'User account disabled.');
    }

    /**
     * Enable a previously disabled staff account.
     */
    public function enable(User $user)
    {
        $currentUser = Auth::user();

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

        $old = $user->only(['status']);
        $user->status = 'active';
        $user->save();

        AuditLogger::log([
            'user' => $currentUser,
            'action' => 'Account enabled',
            'module' => 'Users & Roles',
            'status' => 'success',
            'description' => 'Staff account re-enabled from Users & Roles.',
            'old_values' => $old,
            'new_values' => $user->only(['status']),
        ]);

        return redirect()->back()->with('status', 'User account enabled.');
    }

    /**
     * Archive (soft delete) a staff account.
     */
    public function archive(User $user)
    {
        $currentUser = Auth::user();

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

        $old = $user->only(['status']);
        $user->status = 'archived';
        $user->save();

        AuditLogger::log([
            'user' => $currentUser,
            'action' => 'Account archived',
            'module' => 'Users & Roles',
            'status' => 'success',
            'description' => 'Staff account archived (soft delete) from Users & Roles.',
            'old_values' => $old,
            'new_values' => $user->only(['status']),
        ]);

        return redirect()->back()->with('status', 'User account archived.');
    }

    /**
     * Reset password and send a temporary password via email.
     */
    public function resetPassword(User $user)
    {
        $currentUser = Auth::user();

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
        $currentUser = Auth::user();

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
        $currentUser = Auth::user();

        if (! $this->hasUserManagementAccess($currentUser)) {
            abort(403);
        }

        // Only Super Admin can create Super Admin accounts
        $allowedRoles = ['LGU_ADMIN', 'LGU_TRAINER', 'PARTICIPANT'];
        if ($currentUser->role === 'SUPER_ADMIN') {
            $allowedRoles[] = 'SUPER_ADMIN';
        }

        $data = $request->validate([
            'last_name' => ['required', 'string', 'max:255'],
            'first_name' => ['required', 'string', 'max:255'],
            'middle_name' => ['nullable', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'confirmed', 'min:8'],
            'account_type' => ['required', 'in:' . implode(',', $allowedRoles)],
            'barangay_id' => ['nullable', 'integer', 'exists:barangay_profiles,id'],
        ]);

        $fullName = trim(
            $data['first_name']
            . (isset($data['middle_name']) && $data['middle_name'] !== '' ? ' ' . $data['middle_name'] : '')
            . ' ' . $data['last_name']
        );

        // Participant registration: create active participant with participant_id and no email verification step.
        if ($data['account_type'] === 'PARTICIPANT') {
            $participantId = $this->generateParticipantId();

            $participant = User::create([
                'name' => $fullName,
                'email' => $data['email'],
                'password' => $data['password'],
                'role' => 'PARTICIPANT',
                'participant_id' => $participantId,
                'status' => 'active',
                'registered_at' => now(),
                'barangay_id' => $data['barangay_id'] ?? null,
            ]);

            AuditLogger::log([
                'user' => $currentUser,
                'action' => 'Created participant',
                'module' => 'Users & Roles',
                'status' => 'success',
                'description' => 'New participant account created from admin panel.',
                'new_values' => [
                    'id' => $participant->id,
                    'name' => $participant->name,
                    'email' => $participant->email,
                    'role' => $participant->role,
                ],
            ]);

            return redirect()->back()
                ->with('status', 'New participant registered. They can now log in using their email and password.');
        }

        // Create the staff (admin or trainer) user in a pending state
        $admin = User::create([
            'name' => $fullName,
            'email' => $data['email'],
            'password' => $data['password'], // hashed via User model casts
            'role' => $data['account_type'],
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
            ],
        ]);

        return redirect()->back()
            ->with('status', 'New account registered. The user must verify their email before they can log in.');
    }

    /**
     * Update an existing user (name, email, role, barangay, optional password).
     */
    public function update(Request $request, User $user)
    {
        $currentUser = Auth::user();

        if (! $this->hasUserManagementAccess($currentUser)) {
            abort(403);
        }
        if (! $this->canManageUser($currentUser, $user)) {
            abort(403, 'You do not have permission to edit this user.');
        }
        if (in_array($user->role, ['SUPER_ADMIN', 'LGU_ADMIN', 'LGU_TRAINER', 'STAFF'], true) === false) {
            abort(404);
        }

        $allowedRoles = ['LGU_ADMIN', 'LGU_TRAINER', 'STAFF'];
        if ($currentUser->role === 'SUPER_ADMIN') {
            $allowedRoles[] = 'SUPER_ADMIN';
        }

        $rules = [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email,' . $user->id],
            'account_type' => ['required', 'in:' . implode(',', $allowedRoles)],
            'barangay_id' => ['nullable', 'integer', 'exists:barangay_profiles,id'],
        ];
        if ($request->filled('password')) {
            $rules['password'] = ['required', 'confirmed', 'min:8'];
        }

        $data = $request->validate($rules);

        $old = $user->only(['name', 'email', 'role', 'barangay_id']);

        $user->name = $data['name'];
        $user->email = $data['email'];
        $user->role = $data['account_type'];
        $user->barangay_id = $data['barangay_id'] ?? null;
        if (! empty($data['password'])) {
            $user->password = $data['password'];
        }
        $user->save();

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
     * Generate USB key for a user (admin managing other users).
     */
    public function generateUsbKey(User $user, Request $request)
    {
        $currentUser = Auth::user();

        if (! $this->hasUserManagementAccess($currentUser)) {
            abort(403);
        }

        // Check if current user can manage this user
        if (! $this->canManageUser($currentUser, $user)) {
            if ($request->expectsJson()) {
                return response()->json(['error' => 'You do not have permission to manage this user.'], 403);
            }
            abort(403, 'You do not have permission to manage this user.');
        }

        // Only allow for admin/trainer/super admin roles
        if (! in_array($user->role, ['SUPER_ADMIN', 'LGU_ADMIN', 'LGU_TRAINER'], true)) {
            if ($request->expectsJson()) {
                return response()->json(['error' => 'USB key can only be generated for Admin or Trainer accounts.'], 400);
            }
            return redirect()->back()
                ->withErrors(['error' => 'USB key can only be generated for Admin or Trainer accounts.']);
        }

        $old = $user->only(['usb_key_enabled', 'usb_key_hash']);

        // Generate new key (this automatically revokes any existing key)
        $rawSecret = bin2hex(random_bytes(32));
        $user->usb_key_hash = hash('sha256', $rawSecret);
        $user->usb_key_enabled = true;
        $user->save();

        $content = <<<TXT
DISASTER-TRAINING-USB-KEY
user: {$user->email}
key: {$rawSecret}
TXT;

        AuditLogger::log([
            'user' => $currentUser,
            'action' => 'Generated USB key for user',
            'module' => 'Users & Roles',
            'status' => 'success',
            'description' => "USB key generated for {$user->name} ({$user->email}).",
            'old_values' => $old,
            'new_values' => $user->only(['usb_key_enabled', 'usb_key_hash']),
        ]);

        $filename = 'disaster-training-usb-key-' . $user->id . '.txt';

        // Return file download (works for both regular and AJAX requests)
        return response($content)
            ->header('Content-Type', 'text/plain')
            ->header('Content-Disposition', "attachment; filename=\"{$filename}\"");
    }

    /**
     * Revoke USB key for a user (admin managing other users).
     */
    public function revokeUsbKey(User $user, Request $request)
    {
        $currentUser = Auth::user();

        if (! $this->hasUserManagementAccess($currentUser)) {
            abort(403);
        }

        // Check if current user can manage this user
        if (! $this->canManageUser($currentUser, $user)) {
            if ($request->expectsJson()) {
                return response()->json(['error' => 'You do not have permission to manage this user.'], 403);
            }
            abort(403, 'You do not have permission to manage this user.');
        }

        // Only allow for admin/trainer/super admin roles
        if (! in_array($user->role, ['SUPER_ADMIN', 'LGU_ADMIN', 'LGU_TRAINER'], true)) {
            if ($request->expectsJson()) {
                return response()->json(['error' => 'USB key can only be revoked for Admin or Trainer accounts.'], 400);
            }
            return redirect()->back()
                ->withErrors(['error' => 'USB key can only be revoked for Admin or Trainer accounts.']);
        }

        if (! $user->usb_key_enabled || empty($user->usb_key_hash)) {
            if ($request->expectsJson()) {
                return response()->json(['error' => 'User does not have an active USB key.'], 400);
            }
            return redirect()->back()
                ->with('status', 'User does not have an active USB key.');
        }

        $old = $user->only(['usb_key_enabled', 'usb_key_hash']);

        $user->usb_key_enabled = false;
        $user->usb_key_hash = null;
        $user->save();

        AuditLogger::log([
            'user' => $currentUser,
            'action' => 'Revoked USB key for user',
            'module' => 'Users & Roles',
            'status' => 'success',
            'description' => "USB key revoked for {$user->name} ({$user->email}).",
            'old_values' => $old,
            'new_values' => $user->only(['usb_key_enabled', 'usb_key_hash']),
        ]);

        if ($request->expectsJson()) {
            return response()->json([
                'success' => true,
                'message' => 'USB key has been revoked. The user will need to generate a new key to use USB authentication.',
            ]);
        }

        return redirect()->back()->with('status', 'USB key has been revoked. The user will need to generate a new key to use USB authentication.');
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

