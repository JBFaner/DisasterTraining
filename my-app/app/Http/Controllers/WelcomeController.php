<?php

namespace App\Http\Controllers;

use App\Models\TrainingModule;
use App\Services\CampaignRegistrationService;
use App\Support\CampaignRegistrationLink;
use Illuminate\View\View;

class WelcomeController extends Controller
{
    public function __construct(
        private readonly CampaignRegistrationService $campaignRegistration,
    ) {}

    public function __invoke(): View
    {
        return view('welcome', [
            'landingTrainings' => $this->buildLandingTrainings(),
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
                    'description' => \Illuminate\Support\Str::limit($description, 160),
                    'status' => $isOpen ? 'open' : 'upcoming',
                    'status_label' => $isOpen ? 'OPEN' : 'UPCOMING',
                    'register_url' => $isOpen
                        ? CampaignRegistrationLink::forCampaignRequest((int) $openCampaign['campaign_request_id'])
                        : null,
                    'register_label' => $isOpen ? 'Register' : 'Coming Soon',
                    'details_url' => $isOpen
                        ? CampaignRegistrationLink::forCampaignRequest((int) $openCampaign['campaign_request_id'])
                        : url('/login'),
                    'details_label' => $isOpen ? 'Details' : 'Login',
                    'batch_label' => $isOpen ? ($openCampaign['batch_label'] ?? null) : null,
                    'seats_remaining' => $isOpen ? ($openCampaign['seats_remaining'] ?? null) : null,
                    'theme' => $theme,
                ];
            })
            ->values()
            ->all();
    }

    /**
     * @return array{gradient: string, badge: string, emoji: string}
     */
    private function themeForCategory(string $category): array
    {
        $key = strtolower(trim($category));

        return match (true) {
            str_contains($key, 'earthquake') => [
                'gradient' => 'from-orange-400 to-orange-600',
                'badge' => 'bg-orange-100 text-orange-800',
                'emoji' => '🟠',
            ],
            str_contains($key, 'fire') => [
                'gradient' => 'from-red-400 to-red-600',
                'badge' => 'bg-red-100 text-red-800',
                'emoji' => '🔴',
            ],
            str_contains($key, 'flood') => [
                'gradient' => 'from-blue-400 to-blue-600',
                'badge' => 'bg-blue-100 text-blue-800',
                'emoji' => '🔵',
            ],
            default => [
                'gradient' => 'from-teal-400 to-teal-700',
                'badge' => 'bg-teal-100 text-teal-800',
                'emoji' => '🟢',
            ],
        };
    }
}
