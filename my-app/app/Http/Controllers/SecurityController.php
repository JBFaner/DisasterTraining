<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\User;
use App\Services\AuditLogger;

class SecurityController extends Controller
{
    public function showUsbSettings(Request $request)
    {
        $user = $request->user();

        return view('admin.security.usb-settings', [
            'user' => $user,
        ]);
    }

    public function generateUsbKey(Request $request)
    {
        $user = $request->user();

        // Only allow for admin/trainer/super admin roles
        if (! in_array($user->role, ['SUPER_ADMIN', 'LGU_ADMIN', 'LGU_TRAINER'], true)) {
            abort(403);
        }

        $old = $user->only(['usb_key_enabled', 'usb_key_hash']);

        // Generate new key (this automatically revokes any existing key - only one active key per account)
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
            'user' => $user,
            'action' => 'Generated USB key',
            'module' => 'Security',
            'status' => 'success',
            'description' => 'USB key generated for own account.',
            'old_values' => $old,
            'new_values' => $user->only(['usb_key_enabled', 'usb_key_hash']),
        ]);

        $filename = 'disaster-training-usb-key-' . $user->id . '.txt';

        return response($content)
            ->header('Content-Type', 'text/plain')
            ->header('Content-Disposition', "attachment; filename=\"{$filename}\"");
    }

    /**
     * Revoke USB key for the current user (self-service).
     */
    public function revokeUsbKey(Request $request)
    {
        $user = $request->user();

        // Only allow for admin/trainer/super admin roles
        if (! in_array($user->role, ['SUPER_ADMIN', 'LGU_ADMIN', 'LGU_TRAINER'], true)) {
            abort(403);
        }

        if (! $user->usb_key_enabled || empty($user->usb_key_hash)) {
            return redirect()->back()
                ->with('status', 'You do not have an active USB key.');
        }

        $old = $user->only(['usb_key_enabled', 'usb_key_hash']);

        $user->usb_key_enabled = false;
        $user->usb_key_hash = null;
        $user->save();

        AuditLogger::log([
            'user' => $user,
            'action' => 'Revoked USB key',
            'module' => 'Security',
            'status' => 'success',
            'description' => 'USB key revoked for own account.',
            'old_values' => $old,
            'new_values' => $user->only(['usb_key_enabled', 'usb_key_hash']),
        ]);

        return redirect()->back()->with('status', 'USB key has been revoked. You can generate a new key at any time.');
    }

    public function showUsbCheck(Request $request)
    {
        $pendingId = $request->session()->get('pending_usb_admin_id');

        if (! $pendingId) {
            return redirect()->route('admin.login')
                ->withErrors(['email' => 'Your login session has expired. Please log in again.']);
        }

        $user = User::find($pendingId);
        if (! $user || ! $user->usb_key_enabled || ! $user->usb_key_hash) {
            $request->session()->forget('pending_usb_admin_id');
            return redirect()->route('admin.login')
                ->withErrors(['email' => 'USB key verification is not enabled for your account.']);
        }

        // Verify user role is allowed for USB key verification
        if (! in_array($user->role, ['SUPER_ADMIN', 'LGU_ADMIN', 'LGU_TRAINER'], true)) {
            $request->session()->forget('pending_usb_admin_id');
            return redirect()->route('admin.login')
                ->withErrors(['email' => 'USB key verification is not available for your account type.']);
        }

        return view('admin.security.usb-check');
    }

    public function verifyUsbKey(Request $request)
    {
        $request->validate([
            'usb_key_file' => ['required', 'file', 'max:1024'], // 1KB max (should be enough for the key file)
        ]);

        $pendingId = $request->session()->get('pending_usb_admin_id');

        if (! $pendingId) {
            return redirect()->route('admin.login')
                ->withErrors(['email' => 'Your login session has expired. Please log in again.']);
        }

        $user = User::find($pendingId);

        if (! $user || ! $user->usb_key_enabled || ! $user->usb_key_hash) {
            $request->session()->forget('pending_usb_admin_id');
            return redirect()->route('admin.login')
                ->withErrors(['email' => 'USB key verification is not enabled for your account.']);
        }

        // Verify user role is allowed for USB key verification
        if (! in_array($user->role, ['SUPER_ADMIN', 'LGU_ADMIN', 'LGU_TRAINER'], true)) {
            $request->session()->forget('pending_usb_admin_id');
            return redirect()->route('admin.login')
                ->withErrors(['email' => 'USB key verification is not available for your account type.']);
        }

        $contents = trim($request->file('usb_key_file')->get());
        $rawSecret = $this->extractKeyFromFile($contents);
        $calculatedHash = hash('sha256', $rawSecret);

        if (! hash_equals($user->usb_key_hash, $calculatedHash)) {
            AuditLogger::log([
                'user' => $user,
                'action' => 'USB verification failed',
                'module' => 'Auth',
                'status' => 'failed',
                'description' => 'Admin/trainer provided invalid USB key file.',
            ]);

            return back()->withErrors([
                'usb_key_file' => 'Invalid USB key file.',
            ]);
        }

        // USB key verified - complete login
        $request->session()->forget('pending_usb_admin_id');

        Auth::login($user, false);
        $request->session()->regenerate();
        $request->session()->put('last_activity', now()->timestamp);

        AuditLogger::log([
            'user' => $user,
            'action' => 'USB verified',
            'module' => 'Auth',
            'status' => 'success',
            'description' => 'Admin/trainer USB key verified and login completed.',
        ]);

        $user->last_login = now();
        $user->save();

        return redirect()->intended('/dashboard');
    }

    private function extractKeyFromFile(string $contents): string
    {
        foreach (preg_split('/\r\n|\r|\n/', $contents) as $line) {
            $line = trim($line);
            if (stripos($line, 'key:') === 0) {
                return trim(substr($line, 4));
            }
        }

        return trim($contents);
    }
}

