<?php

namespace App\Http\Controllers;

use App\Mail\AdminEmailVerificationMail;
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
     * List all admin/trainer/staff users (excluding participants).
     */
    public function index(Request $request)
    {
        $user = Auth::user();

        if (! $user || $user->role !== 'LGU_ADMIN') {
            abort(403);
        }

        $query = User::query()
            // Fetch only staff-type users (LGU Admin, Trainer, Staff), never participants
            ->whereIn('role', ['LGU_ADMIN', 'LGU_TRAINER', 'STAFF'])
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
        ]);
    }

    /**
     * Show the form to register a new LGU Admin, Trainer, or Participant.
     */
    public function create(Request $request)
    {
        $user = Auth::user();

        if (! $user || $user->role !== 'LGU_ADMIN') {
            abort(403);
        }

        // Render inside the SPA shell so sidebar/navigation stays visible.
        return view('app', [
            'section' => 'admin_users_create',
        ]);
    }

    /**
     * Disable a staff account (soft lock).
     */
    public function disable(User $user)
    {
        $currentUser = Auth::user();

        if (! $currentUser || $currentUser->role !== 'LGU_ADMIN') {
            abort(403);
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

        if (! $currentUser || $currentUser->role !== 'LGU_ADMIN') {
            abort(403);
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

        if (! $currentUser || $currentUser->role !== 'LGU_ADMIN') {
            abort(403);
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

        if (! $currentUser || $currentUser->role !== 'LGU_ADMIN') {
            abort(403);
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

        if (! $currentUser || $currentUser->role !== 'LGU_ADMIN') {
            abort(403);
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

        if (! $currentUser || $currentUser->role !== 'LGU_ADMIN') {
            abort(403);
        }

        $data = $request->validate([
            'last_name' => ['required', 'string', 'max:255'],
            'first_name' => ['required', 'string', 'max:255'],
            'middle_name' => ['nullable', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'confirmed', 'min:8'],
            'account_type' => ['required', 'in:LGU_ADMIN,LGU_TRAINER,PARTICIPANT'],
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

