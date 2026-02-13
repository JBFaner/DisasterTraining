<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\User;

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

        // Only allow for admin/trainer roles
        if (! in_array($user->role, ['LGU_ADMIN', 'LGU_TRAINER'], true)) {
            abort(403);
        }

        $rawSecret = bin2hex(random_bytes(32));
        $user->usb_key_hash = hash('sha256', $rawSecret);
        $user->usb_key_enabled = true;
        $user->save();

        $content = <<<TXT
DISASTER-TRAINING-USB-KEY
user: {$user->email}
key: {$rawSecret}
TXT;

        $filename = 'disaster-training-usb-key-' . $user->id . '.txt';

        return response($content)
            ->header('Content-Type', 'text/plain')
            ->header('Content-Disposition', "attachment; filename=\"{$filename}\"");
    }

    public function showUsbCheck(Request $request)
    {
        $pendingId = $request->session()->get('pending_usb_admin_id');

        if (! $pendingId) {
            return redirect()->route('login');
        }

        return view('admin.security.usb-check');
    }

    public function verifyUsbKey(Request $request)
    {
        $request->validate([
            'usb_key_file' => ['required', 'file', 'max:16'],
        ]);

        $pendingId = $request->session()->get('pending_usb_admin_id');

        if (! $pendingId) {
            return redirect()->route('login');
        }

        $user = User::find($pendingId);

        if (! $user || ! $user->usb_key_enabled || ! $user->usb_key_hash) {
            return redirect()->route('login');
        }

        $contents = trim($request->file('usb_key_file')->get());
        $rawSecret = $this->extractKeyFromFile($contents);
        $calculatedHash = hash('sha256', $rawSecret);

        if (! hash_equals($user->usb_key_hash, $calculatedHash)) {
            return back()->withErrors([
                'usb_key_file' => 'Invalid USB key file.',
            ]);
        }

        $request->session()->forget('pending_usb_admin_id');

        return redirect('/dashboard');
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

