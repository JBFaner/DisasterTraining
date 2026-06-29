<?php

namespace App\Support;

use App\Models\User;
use Illuminate\Support\Facades\Auth;

class PortalAuth
{
    public const ADMIN_GUARD = 'admin';

    public const PARTICIPANT_GUARD = 'participant';

    public const SESSION_PORTAL_KEY = 'active_portal';

    /** @return list<string> */
    public static function guards(): array
    {
        return [self::ADMIN_GUARD, self::PARTICIPANT_GUARD];
    }

    public static function guardForRole(string $role): string
    {
        return $role === 'PARTICIPANT' ? self::PARTICIPANT_GUARD : self::ADMIN_GUARD;
    }

    public static function isAdminRole(string $role): bool
    {
        return in_array($role, ['LGU_ADMIN', 'LGU_TRAINER', 'STAFF', 'SUPER_ADMIN'], true);
    }

    public static function adminUser(): ?User
    {
        return Auth::guard(self::ADMIN_GUARD)->user();
    }

    public static function participantUser(): ?User
    {
        return Auth::guard(self::PARTICIPANT_GUARD)->user();
    }

    public static function user(): ?User
    {
        $activePortal = session(self::SESSION_PORTAL_KEY);

        if ($activePortal === self::PARTICIPANT_GUARD) {
            return self::participantUser() ?? self::adminUser();
        }

        if ($activePortal === self::ADMIN_GUARD) {
            return self::adminUser() ?? self::participantUser();
        }

        return self::adminUser() ?? self::participantUser();
    }

    public static function id(): ?int
    {
        return self::user()?->id;
    }

    public static function check(): bool
    {
        return self::adminUser() !== null || self::participantUser() !== null;
    }

    public static function login(User $user, bool $remember = false): void
    {
        $guard = self::guardForRole($user->role);

        Auth::guard($guard)->login($user, $remember);
        session([self::SESSION_PORTAL_KEY => $guard]);
    }

    public static function logoutGuard(string $guard): void
    {
        Auth::guard($guard)->logout();

        if (session(self::SESSION_PORTAL_KEY) === $guard) {
            session()->forget(self::SESSION_PORTAL_KEY);
        }
    }

    public static function logoutAll(): void
    {
        foreach (self::guards() as $guard) {
            Auth::guard($guard)->logout();
        }

        session()->forget(self::SESSION_PORTAL_KEY);
    }

    public static function syncDefaultGuard(): void
    {
        $activePortal = session(self::SESSION_PORTAL_KEY);

        if ($activePortal === self::PARTICIPANT_GUARD && Auth::guard(self::PARTICIPANT_GUARD)->check()) {
            Auth::shouldUse(self::PARTICIPANT_GUARD);

            return;
        }

        if ($activePortal === self::ADMIN_GUARD && Auth::guard(self::ADMIN_GUARD)->check()) {
            Auth::shouldUse(self::ADMIN_GUARD);

            return;
        }

        if (Auth::guard(self::ADMIN_GUARD)->check()) {
            Auth::shouldUse(self::ADMIN_GUARD);
            session([self::SESSION_PORTAL_KEY => self::ADMIN_GUARD]);

            return;
        }

        if (Auth::guard(self::PARTICIPANT_GUARD)->check()) {
            Auth::shouldUse(self::PARTICIPANT_GUARD);
            session([self::SESSION_PORTAL_KEY => self::PARTICIPANT_GUARD]);
        }
    }

    public static function activeGuard(): ?string
    {
        if (session(self::SESSION_PORTAL_KEY)) {
            return session(self::SESSION_PORTAL_KEY);
        }

        if (Auth::guard(self::ADMIN_GUARD)->check()) {
            return self::ADMIN_GUARD;
        }

        if (Auth::guard(self::PARTICIPANT_GUARD)->check()) {
            return self::PARTICIPANT_GUARD;
        }

        return null;
    }
}
