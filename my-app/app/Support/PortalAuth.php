<?php

namespace App\Support;

use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cookie;

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
        return in_array($role, [
            'LGU_ADMIN',
            'LGU_TRAINER',
            'LEAD_TRAINER',
            'EVALUATOR',
            'STAFF',
            'SUPER_ADMIN',
            'VIEWER',
        ], true);
    }

    /** Any trainer account type (lead or assistant) — used for roster / mirrors. */
    public static function isTrainerRole(string $role): bool
    {
        return in_array($role, ['LGU_TRAINER', 'LEAD_TRAINER'], true);
    }

    /** Assistant Trainer accounts (`LGU_TRAINER`) — personnel/roster only. */
    public static function isAssistantTrainerRole(string $role): bool
    {
        return $role === 'LGU_TRAINER';
    }

    /** Lead Trainer accounts. */
    public static function isLeadTrainerRole(string $role): bool
    {
        return $role === 'LEAD_TRAINER';
    }

    /**
     * Full Operations (modules, planning, inventory management, etc.).
     * Admin + Lead Trainer only — not Assistant Trainer.
     */
    public static function canManageOperations(string $role): bool
    {
        return in_array($role, ['LGU_ADMIN', 'LEAD_TRAINER', 'SUPER_ADMIN'], true);
    }

    /**
     * Score evaluations and manage attendance during drills.
     * Admin + Lead Trainer + Evaluator (Assistant Trainer excluded).
     */
    public static function canEvaluate(string $role): bool
    {
        return in_array($role, ['LGU_ADMIN', 'LEAD_TRAINER', 'EVALUATOR', 'SUPER_ADMIN'], true);
    }

    /** Participant registry + attendance screens (Evaluator handles attendance). */
    public static function canViewParticipantRegistry(string $role): bool
    {
        return self::canEvaluate($role);
    }

    /** Mark / update attendance records. */
    public static function canManageAttendance(string $role): bool
    {
        return self::canEvaluate($role);
    }

    /** Admin simulation event screens (view/score; create gated separately). */
    public static function canAccessAdminSimulationEvents(string $role): bool
    {
        return self::canEvaluate($role) || self::canManageOperations($role);
    }

    /** Admin or Lead Trainer (operations operators). */
    public static function isAdminOrTrainer(string $role): bool
    {
        return self::canManageOperations($role);
    }

    public static function adminUser(): ?User
    {
        return Auth::guard(self::ADMIN_GUARD)->user();
    }

    public static function participantUser(): ?User
    {
        return Auth::guard(self::PARTICIPANT_GUARD)->user();
    }

    /**
     * Return the authenticated user for the portal session handling this request.
     * Never falls back to the other portal's guard.
     */
    public static function user(): ?User
    {
        $guard = PortalSession::currentGuard();

        return Auth::guard($guard)->user();
    }

    public static function id(): ?int
    {
        return self::user()?->id;
    }

    public static function check(): bool
    {
        return Auth::guard(PortalSession::currentGuard())->check();
    }

    public static function login(User $user, bool $remember = false): void
    {
        $guard = self::guardForRole($user->role);

        Auth::guard($guard)->login($user, $remember);
        Auth::shouldUse($guard);
        session([self::SESSION_PORTAL_KEY => $guard]);

        Cookie::queue(Cookie::forget(PortalSession::legacyCookieName()));
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
        $guard = PortalSession::currentGuard();

        if (Auth::guard($guard)->check()) {
            Auth::shouldUse($guard);
            session([self::SESSION_PORTAL_KEY => $guard]);
        }
    }

    public static function activeGuard(): ?string
    {
        $guard = PortalSession::currentGuard();

        if (Auth::guard($guard)->check()) {
            return $guard;
        }

        return null;
    }
}
