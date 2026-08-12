<?php

namespace App\Http\Controllers;

use App\Models\SimulationEvent;
use App\Models\TrainingModule;
use App\Services\CampaignRegistrationService;
use App\Support\CampaignRegistrationLink;
use Illuminate\Support\Str;
use Illuminate\View\View;

class WelcomeController extends Controller
{
    public function __construct(
        private readonly CampaignRegistrationService $campaignRegistration,
    ) {}

    public function __invoke(): View
    {
        $landingTrainings = $this->buildLandingTrainings();
        $openCampaigns = $this->campaignRegistration->listOpenForRegistration();

        return view('welcome', [
            'landingTrainings' => $landingTrainings,
            'landingStats' => [
                'published_modules' => count($landingTrainings),
                'open_registrations' => count($openCampaigns),
            ],
            'landingAnnouncements' => $this->buildLandingAnnouncements($openCampaigns),
        ]);
    }

    /**
     * Public landing cards: one per published training module, with Register
     * when an approved campaign for that module is currently open.
     *
     * @return list<array<string, mixed>>
     */
    private function buildLandingTrainings(): array
    {
        $openByModule = collect($this->campaignRegistration->listOpenForRegistration())
            ->groupBy(fn (array $row) => (int) ($row['training_module_id'] ?? 0));

        return TrainingModule::query()
            ->where('status', 'published')
            ->orderBy('title')
            ->get(['id', 'title', 'short_description', 'description', 'category', 'thumbnail_path'])
            ->map(function (TrainingModule $module) use ($openByModule) {
                $moduleId = (int) $module->id;
                $openCampaign = $openByModule->get($moduleId)?->first();
                $isOpen = is_array($openCampaign);
                $theme = $this->themeForCategory((string) ($module->category ?? ''));
                $description = trim((string) ($module->short_description ?: $module->description ?: ''));
                if ($description === '') {
                    $description = 'Disaster preparedness training for your barangay community.';
                }

                return [
                    'id' => $moduleId,
                    'title' => $module->title,
                    'category' => $module->category,
                    'description' => Str::limit($description, 160),
                    'status' => $isOpen ? 'open' : 'upcoming',
                    'status_label' => $isOpen ? 'Open' : 'Upcoming',
                    'register_url' => $isOpen
                        ? CampaignRegistrationLink::forCampaignRequest((int) $openCampaign['campaign_request_id'])
                        : null,
                    'register_label' => $isOpen ? 'Register' : 'Coming Soon',
                    'details_url' => $isOpen
                        ? CampaignRegistrationLink::forCampaignRequest((int) $openCampaign['campaign_request_id'])
                        : url('/participant/login'),
                    'details_label' => $isOpen ? 'Details' : 'Login',
                    'batch_label' => $isOpen ? ($openCampaign['batch_label'] ?? null) : null,
                    'seats_remaining' => $isOpen ? ($openCampaign['seats_remaining'] ?? null) : null,
                    'image_url' => $this->imageForCategory((string) ($module->category ?? '')),
                    'theme' => $theme,
                ];
            })
            ->values()
            ->all();
    }

    /**
     * @param  list<array<string, mixed>>  $openCampaigns
     * @return list<array<string, mixed>>
     */
    private function buildLandingAnnouncements(array $openCampaigns): array
    {
        $announcements = collect($openCampaigns)
            ->map(function (array $campaign) {
                $title = $campaign['training_title'] ?? $campaign['module_title'] ?? 'Training campaign';
                $deadline = $campaign['registration_deadline'] ?? null;
                $seats = $campaign['seats_remaining'] ?? null;

                $message = 'Registration is open for this approved training campaign.';
                if ($deadline) {
                    $message = 'Register before '.(\Illuminate\Support\Carbon::parse($deadline)->format('M j, Y')).'.';
                }
                if ($seats !== null) {
                    $message .= ' '.$seats.' seat'.($seats === 1 ? '' : 's').' remaining.';
                }

                return [
                    'type' => 'registration',
                    'tone' => 'amber',
                    'title' => $title,
                    'message' => trim($message),
                    'date_label' => $deadline
                        ? \Illuminate\Support\Carbon::parse($deadline)->format('M j, Y')
                        : now()->format('M j, Y'),
                    'href' => CampaignRegistrationLink::forCampaignRequest((int) $campaign['campaign_request_id']),
                ];
            })
            ->values();

        $upcomingEvents = SimulationEvent::query()
            ->whereIn('status', ['published', 'ongoing'])
            ->whereDate('event_date', '>=', now()->toDateString())
            ->orderBy('event_date')
            ->limit(3)
            ->get(['id', 'title', 'event_date', 'status']);

        foreach ($upcomingEvents as $event) {
            $announcements->push([
                'type' => 'event',
                'tone' => 'sky',
                'title' => $event->title,
                'message' => 'Upcoming simulation event on '.$event->event_date->format('M j, Y').'.',
                'date_label' => $event->event_date->format('M j, Y'),
                'href' => url('/participant/login'),
            ]);
        }

        return $announcements->take(6)->all();
    }

    /**
     * @return array{accent: string, badge: string, icon_bg: string, image: string}
     */
    private function themeForCategory(string $category): array
    {
        $key = strtolower(trim($category));
        $image = $this->imageForCategory($category);

        return match (true) {
            str_contains($key, 'earthquake') => [
                'accent' => 'border-orange-200 bg-orange-50 text-orange-800',
                'badge' => 'bg-orange-100 text-orange-800 border-orange-200',
                'icon_bg' => 'bg-orange-100 text-orange-700',
                'image' => $image,
            ],
            str_contains($key, 'fire') => [
                'accent' => 'border-rose-200 bg-rose-50 text-rose-800',
                'badge' => 'bg-rose-100 text-rose-800 border-rose-200',
                'icon_bg' => 'bg-rose-100 text-rose-700',
                'image' => $image,
            ],
            str_contains($key, 'flood') => [
                'accent' => 'border-sky-200 bg-sky-50 text-sky-800',
                'badge' => 'bg-sky-100 text-sky-800 border-sky-200',
                'icon_bg' => 'bg-sky-100 text-sky-700',
                'image' => $image,
            ],
            default => [
                'accent' => 'border-emerald-200 bg-emerald-50 text-emerald-800',
                'badge' => 'bg-emerald-100 text-emerald-800 border-emerald-200',
                'icon_bg' => 'bg-emerald-100 text-emerald-700',
                'image' => $image,
            ],
        };
    }

    private function imageForCategory(string $category): string
    {
        $key = strtolower(trim($category));

        $filename = match (true) {
            str_contains($key, 'earthquake') => 'training-earthquake.jpg',
            str_contains($key, 'fire') => 'training-fire.jpg',
            str_contains($key, 'flood') => 'training-flood.jpg',
            str_contains($key, 'typhoon'), str_contains($key, 'storm') => 'training-flood.jpg',
            default => 'training-default.jpg',
        };

        return asset('images/landing/'.$filename);
    }
}
