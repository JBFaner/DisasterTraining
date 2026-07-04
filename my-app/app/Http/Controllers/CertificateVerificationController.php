<?php

namespace App\Http\Controllers;

use App\Models\Certificate;
use Illuminate\Http\Request;

class CertificateVerificationController extends Controller
{
    public function show(string $token)
    {
        $certificate = Certificate::query()
            ->with(['user', 'simulationEvent', 'trainingModule', 'issuer'])
            ->where('qr_verification_token', $token)
            ->firstOrFail();

        $isValid = $certificate->revoked_at === null;

        return view('certificate.verify', [
            'certificate' => $certificate,
            'isValid' => $isValid,
        ]);
    }

    public function verifyApi(string $token)
    {
        $certificate = Certificate::query()
            ->with(['user', 'simulationEvent', 'trainingModule'])
            ->where('qr_verification_token', $token)
            ->first();

        if (! $certificate) {
            return response()->json(['valid' => false, 'message' => 'Certificate not found.'], 404);
        }

        return response()->json([
            'valid' => $certificate->revoked_at === null,
            'status' => $certificate->revoked_at ? 'revoked' : 'issued',
            'certificate_number' => $certificate->certificate_number,
            'participant_name' => $certificate->user?->name,
            'training_module' => $certificate->trainingModule?->title,
            'simulation_event' => $certificate->simulationEvent?->title,
            'final_score' => $certificate->final_score,
            'completion_date' => $certificate->completion_date?->format('Y-m-d'),
            'issued_at' => $certificate->issued_at?->toIso8601String(),
        ]);
    }
}
