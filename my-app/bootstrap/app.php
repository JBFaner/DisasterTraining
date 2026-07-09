<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use App\Http\Middleware\AuthenticatePortal;
use App\Http\Middleware\ConfigurePortalSession;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->web(prepend: [
            ConfigurePortalSession::class,
        ]);

        $middleware->alias([
            'auth.portal' => AuthenticatePortal::class,
            'portal.sync' => \App\Http\Middleware\SyncPortalGuard::class,
            'portal.admin' => \App\Http\Middleware\EnsureAdminPortal::class,
            'portal.participant' => \App\Http\Middleware\EnsureParticipantPortal::class,
            'group6.api' => \App\Http\Middleware\VerifyGroup6ApiKey::class,
            'resource_allocation.api' => \App\Http\Middleware\VerifyResourceAllocationApiKey::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->render(function (\Symfony\Component\HttpKernel\Exception\HttpException $e, \Illuminate\Http\Request $request) {
            if ($e->getStatusCode() !== 419) {
                return null;
            }

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

            if ($request->is('participant/login')) {
                return redirect()->route('participant.login')
                    ->withErrors([
                        'email' => 'Your session expired. Please try logging in again.',
                    ]);
            }

            if ($request->is('admin/login', 'login')) {
                return redirect()->route('admin.login')
                    ->withErrors([
                        'email' => 'Your session expired. Please try logging in again.',
                    ]);
            }

            return null;
        });
    })->create();
