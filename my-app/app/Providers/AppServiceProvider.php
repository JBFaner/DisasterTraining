<?php

namespace App\Providers;

use App\Mail\CustomMailManager;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\URL;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->extend('mail.manager', function ($manager, $app) {
            return new CustomMailManager($app);
        });
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $caBundle = storage_path('certs/cacert.pem');
        if (is_file($caBundle)) {
            $systemCa = ini_get('curl.cainfo') ?: ini_get('openssl.cafile');
            if (! $systemCa || ! is_file($systemCa)) {
                Http::globalOptions(['verify' => $caBundle]);
            }
        }

        // Dynamically set the URL scheme based on the request
        // This ensures HTTPS is used when the request is HTTPS, regardless of APP_URL
        if (request()->isSecure() || request()->header('X-Forwarded-Proto') === 'https') {
            URL::forceScheme('https');
        }

        // Don't force a specific domain - let Laravel use the request's domain
        // This allows each subdomain to work independently
    }
}
