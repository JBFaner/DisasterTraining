<?php

namespace App\Support;

use Illuminate\Http\Request;
use Illuminate\Support\Str;

/**
 * Resolves which portal session (admin vs participant) applies to the current request.
 *
 * Each portal uses its own session cookie so administrator and participant logins
 * never share or overwrite the same session payload.
 */
class PortalSession
{
    public const ADMIN = 'admin';

    public const PARTICIPANT = 'participant';

    public const CONFIG_KEY = 'portal.session';

    /** @return list<string> */
    public static function portals(): array
    {
        return [self::ADMIN, self::PARTICIPANT];
    }

    public static function cookieName(string $portal): string
    {
        $slug = Str::slug((string) config('app.name', 'laravel'));

        return "{$slug}-{$portal}-session";
    }

    public static function legacyCookieName(): string
    {
        $slug = Str::slug((string) config('app.name', 'laravel'));

        return "{$slug}-session";
    }

    public static function guardForPortal(string $portal): string
    {
        return $portal === self::PARTICIPANT
            ? PortalAuth::PARTICIPANT_GUARD
            : PortalAuth::ADMIN_GUARD;
    }

    public static function currentPortal(): string
    {
        $portal = config(self::CONFIG_KEY);

        return in_array($portal, self::portals(), true) ? $portal : self::ADMIN;
    }

    public static function currentGuard(): string
    {
        return self::guardForPortal(self::currentPortal());
    }

    public static function configureForRequest(Request $request): string
    {
        $portal = self::resolvePortal($request);

        config([
            self::CONFIG_KEY => $portal,
            'session.cookie' => self::cookieName($portal),
        ]);

        return $portal;
    }

    public static function resolvePortal(Request $request): string
    {
        if ($request->attributes->has(self::CONFIG_KEY)) {
            return (string) $request->attributes->get(self::CONFIG_KEY);
        }

        if ($portal = self::resolvePortalFromPath($request)) {
            return $portal;
        }

        return self::resolvePortalFromCookies($request);
    }

    protected static function resolvePortalFromPath(Request $request): ?string
    {
        if ($request->is(
            'participant',
            'participant/*',
            'register',
            'password/*',
        )) {
            return self::PARTICIPANT;
        }

        if ($request->is(
            'admin/login',
            'admin/login/*',
            'admin/logout',
            'login',
            'logout',
            'auth/centralized',
            'auth/centralized/*',
        )) {
            return self::ADMIN;
        }

        if ($request->is('admin', 'admin/*')) {
            return self::ADMIN;
        }

        return null;
    }

    protected static function resolvePortalFromCookies(Request $request): string
    {
        $adminCookie = self::cookieName(self::ADMIN);
        $participantCookie = self::cookieName(self::PARTICIPANT);
        $legacyCookie = self::legacyCookieName();

        $hasAdmin = $request->cookies->has($adminCookie);
        $hasParticipant = $request->cookies->has($participantCookie);
        $hasLegacy = $request->cookies->has($legacyCookie)
            && $legacyCookie !== $adminCookie
            && $legacyCookie !== $participantCookie;

        if ($hasParticipant && ! $hasAdmin && ! $hasLegacy) {
            return self::PARTICIPANT;
        }

        if ($hasAdmin && ! $hasParticipant && ! $hasLegacy) {
            return self::ADMIN;
        }

        if ($hasLegacy && ! $hasAdmin && ! $hasParticipant) {
            return self::ADMIN;
        }

        if ($hasParticipant && ! $hasAdmin) {
            return self::PARTICIPANT;
        }

        if ($hasAdmin && ! $hasParticipant) {
            return self::ADMIN;
        }

        if ($hasParticipant && $hasAdmin) {
            return self::resolvePortalFromReferer($request)
                ?? self::resolvePortalFromSharedPath($request)
                ?? self::ADMIN;
        }

        return self::ADMIN;
    }

    protected static function resolvePortalFromReferer(Request $request): ?string
    {
        $referer = (string) $request->headers->get('referer', '');

        if ($referer === '') {
            return null;
        }

        if (str_contains($referer, '/participant/')) {
            return self::PARTICIPANT;
        }

        if (preg_match('#/admin(?:/|$)#', $referer)) {
            return self::ADMIN;
        }

        return null;
    }

    protected static function resolvePortalFromSharedPath(Request $request): ?string
    {
        if ($request->is(
            'training-modules/create',
            'training-modules/*/edit',
            'admin/training-modules/create',
            'admin/training-modules/*/edit',
            'admin/training-modules/*/contents',
            'admin/training-modules/*/contents/*',
            'admin/training-modules/*/archive',
            'admin/training-modules/*/publish',
            'scenarios',
            'scenarios/*',
            'simulation-events/*/registrations',
            'simulation-events/*/attendance',
            'simulation-events/*/attendance/*',
            'participants',
            'participants/*',
            'resources',
            'resources/*',
            'settings/*',
        )) {
            return self::ADMIN;
        }

        return null;
    }
}
