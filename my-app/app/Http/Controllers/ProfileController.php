<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\AuditLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class ProfileController extends Controller
{
    public function show(Request $request)
    {
        /** @var User $user */
        $user = $request->user();

        return view('profile', [
            'user' => $user,
        ]);
    }

    public function updateBasic(Request $request)
    {
        /** @var User $user */
        $user = $request->user();

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'street' => ['required', 'string', 'max:255'],
        ]);

        $oldValues = $user->only(['name', 'street']);

        $user->fill([
            'name' => $data['name'],
            'street' => $data['street'],
        ]);
        $user->save();

        AuditLogger::log([
            'user' => $user,
            'action' => 'Updated profile information',
            'module' => 'Profile',
            'status' => 'success',
            'description' => 'User updated their profile name and address.',
            'old_values' => $oldValues,
            'new_values' => $user->only(['name', 'street']),
        ]);

        return back()->with('status', 'Profile updated successfully.');
    }

    public function requestEmailChange(Request $request)
    {
        /** @var User $user */
        $user = $request->user();

        $data = $request->validate([
            'new_email' => ['required', 'email', 'max:255', 'unique:users,email'],
        ]);

        if ($data['new_email'] === $user->email) {
            return back()->withErrors(['new_email' => 'This is already your current email address.']);
        }

        $token = Str::random(64);

        $user->pending_email = $data['new_email'];
        $user->email_change_token = $token;
        $user->email_change_requested_at = now();
        $user->save();

        $verifyUrl = url(route('profile.email.confirm', ['token' => $token], false));

        Mail::send('emails.profile-email-change', [
            'user' => $user,
            'verifyUrl' => $verifyUrl,
            'newEmail' => $data['new_email'],
        ], function ($message) use ($data) {
            $message->to($data['new_email'])
                ->subject('Confirm your new email address');
        });

        AuditLogger::log([
            'user' => $user,
            'action' => 'Requested email change',
            'module' => 'Profile',
            'status' => 'success',
            'description' => 'User requested to change their email address.',
            'old_values' => ['email' => $user->email],
            'new_values' => ['pending_email' => $data['new_email']],
        ]);

        return back()->with('status', 'We sent a confirmation link to your new email address.');
    }

    public function confirmEmailChange(Request $request, string $token)
    {
        /** @var User|null $user */
        $user = User::where('email_change_token', $token)->first();

        if (! $user || ! $user->pending_email) {
            return redirect()->route('profile.show')->withErrors([
                'email' => 'This email change link is invalid or has already been used.',
            ]);
        }

        $oldEmail = $user->email;
        $newEmail = $user->pending_email;

        $user->email = $newEmail;
        $user->pending_email = null;
        $user->email_change_token = null;
        $user->email_change_requested_at = null;
        $user->email_verified_at = now();
        $user->save();

        AuditLogger::log([
            'user' => $user,
            'action' => 'Email changed',
            'module' => 'Profile',
            'status' => 'success',
            'description' => 'User confirmed their new email address.',
            'old_values' => ['email' => $oldEmail],
            'new_values' => ['email' => $newEmail],
        ]);

        return redirect()->route('profile.show')->with('status', 'Your email address has been updated.');
    }

    public function resendEmailChange(Request $request)
    {
        /** @var User $user */
        $user = $request->user();

        if (! $user->pending_email || ! $user->email_change_token) {
            return back()->withErrors(['new_email' => 'There is no pending email change to resend.']);
        }

        $lastResent = session('email_change_last_resent_at');
        if ($lastResent && now()->diffInSeconds($lastResent) < 60) {
            $remaining = 60 - now()->diffInSeconds($lastResent);
            return back()->withErrors([
                'new_email' => "Please wait {$remaining} seconds before requesting another verification email.",
            ]);
        }

        $verifyUrl = url(route('profile.email.confirm', ['token' => $user->email_change_token], false));

        Mail::send('emails.profile-email-change', [
            'user' => $user,
            'verifyUrl' => $verifyUrl,
            'newEmail' => $user->pending_email,
        ], function ($message) use ($user) {
            $message->to($user->pending_email)
                ->subject('Confirm your new email address');
        });

        session(['email_change_last_resent_at' => now()]);

        return back()->with('status', 'We have resent the confirmation link to your pending email.');
    }

    public function requestPhoneChange(Request $request)
    {
        /** @var User $user */
        $user = $request->user();

        $data = $request->validate([
            'new_phone' => ['required', 'string', 'max:255', 'unique:users,phone'],
        ]);

        if ($data['new_phone'] === $user->phone) {
            return back()->withErrors(['new_phone' => 'This is already your current phone number.']);
        }

        if (! $user->email) {
            return back()->withErrors(['new_phone' => 'You must have an email address on file to change your phone number.']);
        }

        $token = Str::random(64);

        $user->pending_phone = $data['new_phone'];
        $user->phone_change_token = $token;
        $user->phone_change_requested_at = now();
        $user->save();

        $confirmUrl = url(route('profile.phone.confirm', ['token' => $token], false));

        Mail::send('emails.profile-phone-change', [
            'user' => $user,
            'confirmUrl' => $confirmUrl,
            'newPhone' => $data['new_phone'],
        ], function ($message) use ($user) {
            $message->to($user->email)
                ->subject('Confirm your new phone number');
        });

        AuditLogger::log([
            'user' => $user,
            'action' => 'Requested phone change',
            'module' => 'Profile',
            'status' => 'success',
            'description' => 'User requested to change their phone number.',
            'old_values' => ['phone' => $user->phone],
            'new_values' => ['pending_phone' => $data['new_phone']],
        ]);

        return back()->with('status', 'We sent a confirmation email to your current address to approve this phone change.');
    }

    public function confirmPhoneChange(Request $request, string $token)
    {
        /** @var User|null $user */
        $user = User::where('phone_change_token', $token)->first();

        if (! $user || ! $user->pending_phone) {
            return redirect()->route('profile.show')->withErrors([
                'new_phone' => 'This phone change link is invalid or has already been used.',
            ]);
        }

        $oldPhone = $user->phone;
        $newPhone = $user->pending_phone;

        $user->phone = $newPhone;
        $user->pending_phone = null;
        $user->phone_change_token = null;
        $user->phone_change_requested_at = null;
        $user->phone_verified_at = now();
        $user->save();

        AuditLogger::log([
            'user' => $user,
            'action' => 'Phone changed',
            'module' => 'Profile',
            'status' => 'success',
            'description' => 'User confirmed their new phone number.',
            'old_values' => ['phone' => $oldPhone],
            'new_values' => ['phone' => $newPhone],
        ]);

        return redirect()->route('profile.show')->with('status', 'Your phone number has been updated.');
    }

    public function changePassword(Request $request)
    {
        /** @var User $user */
        $user = $request->user();

        $request->validate([
            'current_password' => ['required'],
            'password' => [
                'required',
                'confirmed',
                'min:8',
                'regex:/[A-Z]/',
                'regex:/[a-z]/',
                'regex:/[0-9]/',
            ],
        ], [
            'password.regex' => 'Password must contain at least one uppercase letter, one lowercase letter, and one number.',
        ]);

        if (! Hash::check($request->current_password, $user->password)) {
            return back()->withErrors(['current_password' => 'Your current password is incorrect.']);
        }

        $user->password = Hash::make($request->password);
        $user->save();

        AuditLogger::log([
            'user' => $user,
            'action' => 'Password changed',
            'module' => 'Profile',
            'status' => 'success',
            'description' => 'User changed their password from profile page.',
        ]);

        return back()->with('status', 'Your password has been updated.');
    }
}

