<?php

namespace App\Providers;

use App\Contracts\Group6\Group6ApiClientInterface;
use App\Contracts\Group6\Group6DataConsumerInterface;
use App\Contracts\Group6\Group6EventReferenceProviderInterface;
use App\Contracts\Group6\Group6InboundReceiverInterface;
use App\Mail\CustomMailManager;
use App\Services\Group6\Group6EventReferenceProvider;
use App\Services\Group6\Group6InboundReceiver;
use App\Services\Group6\PlaceholderGroup6ApiClient;
use App\Services\Group6\PlaceholderGroup6DataConsumer;
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

        // Group 6 — external system integration (placeholders until API is available)
        $this->app->bind(Group6InboundReceiverInterface::class, Group6InboundReceiver::class);
        $this->app->bind(Group6ApiClientInterface::class, PlaceholderGroup6ApiClient::class);
        $this->app->bind(Group6DataConsumerInterface::class, PlaceholderGroup6DataConsumer::class);
        $this->app->bind(Group6EventReferenceProviderInterface::class, Group6EventReferenceProvider::class);

        $this->app->bind(
            \App\Contracts\HazardAssessment\HazardAssessmentDataProviderInterface::class,
            \App\Services\HazardAssessment\LocalHazardAssessmentDataProvider::class,
        );
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
