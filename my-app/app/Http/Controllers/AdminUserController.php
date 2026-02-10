<?php

namespace App\Http\Controllers;

use App\Mail\AdminEmailVerificationMail;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\URL;

class AdminUserController extends Controller
{
    /**
     * Show the form to register a new LGU Admin or Trainer.
     */
    public function create(Request $request)
    {
        $user = Auth::user();

        if (! $user || $user->role !== 'LGU_ADMIN') {
            abort(403);
        }

        return view('admin.users.create');
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

            User::create([
                'name' => $fullName,
                'email' => $data['email'],
                'password' => $data['password'],
                'role' => 'PARTICIPANT',
                'participant_id' => $participantId,
                'status' => 'active',
                'registered_at' => now(),
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

