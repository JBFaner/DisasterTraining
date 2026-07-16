<?php

namespace App\Http\Controllers;

use App\Models\CampaignRequest;
use App\Services\CampaignRegistrationService;
use App\Services\DatabaseBackupService;
use App\Support\PortalAuth;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class CampaignRegistrationController extends Controller
{
    public function __construct(
        private readonly CampaignRegistrationService $registrationService,
    ) {}

    public function showRegister(Request $request, CampaignRequest $campaignRequest)
    {
        $context = $this->registrationService->buildContext($campaignRequest);
        if (! $context) {
            return view('campaigns.register-closed', [
                'campaign_request_id' => $campaignRequest->id,
            ]);
        }

        $user = PortalAuth::participantUser();

        if ($user) {
            if ($this->registrationService->isAlreadyRegistered($user, $campaignRequest)) {
                return view('campaigns.register', [
                    'campaign_context' => $context,
                    'already_registered' => true,
                    'authenticated' => true,
                ]);
            }

            try {
                $this->registrationService->register($user, $campaignRequest);
            } catch (ValidationException $exception) {
                return redirect()
                    ->route('campaigns.register', $campaignRequest)
                    ->withErrors($exception->errors());
            }

            app(DatabaseBackupService::class)->queueAfterCommit('campaign_registration_created');

            return redirect()->route('campaigns.register.success', $campaignRequest);
        }

        $request->session()->put('url.intended', route('campaigns.register', $campaignRequest));
        $request->session()->put('campaign_registration_context', $context);

        return view('campaigns.register', [
            'campaign_context' => $context,
            'already_registered' => false,
            'authenticated' => false,
        ]);
    }

    public function showSuccess(CampaignRequest $campaignRequest)
    {
        $user = PortalAuth::participantUser();
        if (! $user) {
            return redirect()->route('participant.login');
        }

        if (! $this->registrationService->isAlreadyRegistered($user, $campaignRequest)) {
            return redirect()->route('campaigns.register', $campaignRequest);
        }

        $context = $this->registrationService->buildContext($campaignRequest)
            ?? [
                'campaign_request_id' => $campaignRequest->id,
                'training_title' => $campaignRequest->trainingModule?->title,
            ];

        return view('campaigns.register-success', [
            'campaign_context' => $context,
        ]);
    }

    public function myTrainings()
    {
        $user = PortalAuth::participantUser();
        if (! $user || $user->role !== 'PARTICIPANT') {
            abort(403, 'Unauthorized access.');
        }

        return view('app', [
            'section' => 'my_trainings',
            'trainings' => $this->registrationService->trainingHistoryFor($user)->values()->all(),
        ]);
    }
}
