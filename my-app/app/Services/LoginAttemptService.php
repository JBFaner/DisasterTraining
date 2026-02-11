<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class LoginAttemptService
{
    public function isLockedOut(string $email, string $ip): array|null
    {
        $emailKey = $this->emailLockoutKey($email);
        $ipKey = $this->ipLockoutKey($ip);

        $emailLockedUntil = Cache::get($emailKey);
        $ipLockedUntil = Cache::get($ipKey);

        $now = now()->timestamp;
        $retryAfter = null;

        if ($emailLockedUntil && $emailLockedUntil > $now) {
            $retryAfter = max($retryAfter ?? 0, $emailLockedUntil - $now);
        }
        if ($ipLockedUntil && $ipLockedUntil > $now) {
            $retryAfter = max($retryAfter ?? 0, $ipLockedUntil - $now);
        }

        if ($retryAfter !== null) {
            return ['retry_after_seconds' => (int) $retryAfter];
        }

        return null;
    }

    public function recordFailedAttempt(string $email, string $ip): array
    {
        $maxAttempts = config('security.max_login_attempts', 3);
        $baseDuration = config('security.lockout_duration_seconds', 30);
        $progressive = config('security.enable_progressive_delay', true);
        $durations = config('security.progressive_lockout_seconds', [30, 60, 300]);

        $emailAttemptsKey = 'login_attempts:email:' . $email;
        $ipAttemptsKey = 'login_attempts:ip:' . $ip;
        $emailLockoutKey = $this->emailLockoutKey($email);
        $ipLockoutKey = $this->ipLockoutKey($ip);
        $emailLockoutCountKey = 'login_lockout_count:email:' . $email;
        $ipLockoutCountKey = 'login_lockout_count:ip:' . $ip;

        $emailAttempts = (int) Cache::get($emailAttemptsKey, 0) + 1;
        $ipAttempts = (int) Cache::get($ipAttemptsKey, 0) + 1;

        Cache::put($emailAttemptsKey, $emailAttempts, now()->addHours(1));
        Cache::put($ipAttemptsKey, $ipAttempts, now()->addHours(1));

        $this->logAttempt($email, $ip, 'failed');

        $retryAfter = 0;

        if ($emailAttempts >= $maxAttempts) {
            $lockoutCount = (int) Cache::get($emailLockoutCountKey, 0) + 1;
            Cache::put($emailLockoutCountKey, $lockoutCount, now()->addHours(24));
            $duration = $progressive && isset($durations[$lockoutCount - 1])
                ? $durations[$lockoutCount - 1]
                : $baseDuration;
            Cache::put($emailLockoutKey, now()->timestamp + $duration, now()->addSeconds($duration + 1));
            $retryAfter = max($retryAfter, $duration);
            $this->logAttempt($email, $ip, 'locked');
        }

        if ($ipAttempts >= $maxAttempts) {
            $lockoutCount = (int) Cache::get($ipLockoutCountKey, 0) + 1;
            Cache::put($ipLockoutCountKey, $lockoutCount, now()->addHours(24));
            $duration = $progressive && isset($durations[$lockoutCount - 1])
                ? $durations[$lockoutCount - 1]
                : $baseDuration;
            Cache::put($ipLockoutKey, now()->timestamp + $duration, now()->addSeconds($duration + 1));
            $retryAfter = max($retryAfter, $duration);
            if ($emailAttempts < $maxAttempts) {
                $this->logAttempt($email, $ip, 'locked');
            }
        }

        return ['retry_after_seconds' => $retryAfter];
    }

    public function clearAttempts(string $email, string $ip): void
    {
        $prefixes = [
            'login_attempts:email:' . $email,
            'login_attempts:ip:' . $ip,
            $this->emailLockoutKey($email),
            $this->ipLockoutKey($ip),
            'login_lockout_count:email:' . $email,
            'login_lockout_count:ip:' . $ip,
        ];
        foreach ($prefixes as $key) {
            Cache::forget($key);
        }
    }

    private function emailLockoutKey(string $email): string
    {
        return 'login_lockout_until:email:' . $email;
    }

    private function ipLockoutKey(string $ip): string
    {
        return 'login_lockout_until:ip:' . $ip;
    }

    private function logAttempt(string $email, string $ip, string $status): void
    {
        try {
            DB::table('login_attempt_logs')->insert([
                'email' => $email,
                'ip_address' => $ip,
                'status' => $status,
                'created_at' => now(),
            ]);
        } catch (\Throwable $e) {
            report($e);
        }
    }
}
