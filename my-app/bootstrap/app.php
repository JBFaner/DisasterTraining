<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->alias([
            'portal.sync' => \App\Http\Middleware\SyncPortalGuard::class,
            'portal.admin' => \App\Http\Middleware\EnsureAdminPortal::class,
            'portal.participant' => \App\Http\Middleware\EnsureParticipantPortal::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->render(function (\Illuminate\Session\TokenMismatchException $e, \Illuminate\Http\Request $request) {
            if ($request->is('admin/login/verify', 'admin/login/resend-otp')) {
                return redirect('/admin/login/verify')
                    ->withErrors([
                        'otp' => 'Your session expired or the page was open too long. Please enter the code again, or request a new one.',
                    ]);
            }

            if ($request->is('participant/register/verify', 'participant/register/resend')) {
                return redirect('/participant/register/verify')
                    ->withErrors([
                        'code' => 'Your session expired or the page was open too long. Please try again.',
                    ]);
            }

            return null;
        });
    })->create();
