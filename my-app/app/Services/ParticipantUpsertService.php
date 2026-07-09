<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class ParticipantUpsertService
{
    /**
     * @param  array<string, mixed>  $attributes
     */
    public function upsert(array $attributes, ?string $externalId = null): User
    {
        $normalizedEmail = $this->normalizeEmail($attributes['email'] ?? null);
        $normalizedPhone = $this->normalizePhone($attributes['phone'] ?? null);

        $user = $this->locateExistingParticipant($externalId, $normalizedEmail, $normalizedPhone);
        $payload = $this->preparePayload($attributes, $externalId, $normalizedEmail, $normalizedPhone);

        if ($user) {
            $this->fillExistingUser($user, $payload);
            $user->save();

            return $user->fresh();
        }

        return User::create(array_merge($payload, [
            'password' => $payload['password'] ?? Hash::make(Str::random(32)),
            'participant_id' => $payload['participant_id'] ?? $this->generateParticipantId(),
            'role' => 'PARTICIPANT',
        ]));
    }

    public function normalizeEmail(?string $email): ?string
    {
        $value = is_string($email) ? trim(strtolower($email)) : null;

        return $value !== '' ? $value : null;
    }

    public function normalizePhone(?string $phone): ?string
    {
        if (! is_string($phone)) {
            return null;
        }

        $digits = preg_replace('/\D+/', '', $phone);

        return $digits !== '' ? $digits : null;
    }

    protected function locateExistingParticipant(?string $externalId, ?string $email, ?string $phone): ?User
    {
        if ($externalId) {
            $user = User::where('group6_external_id', $externalId)->where('role', 'PARTICIPANT')->first();
            if ($user) {
                return $user;
            }
        }

        if ($email) {
            $user = User::whereRaw('LOWER(email) = ?', [$email])->where('role', 'PARTICIPANT')->first();
            if ($user) {
                return $user;
            }
        }

        if ($phone) {
            return User::where('role', 'PARTICIPANT')
                ->get()
                ->first(function (User $user) use ($phone) {
                    return $this->normalizePhone($user->phone) === $phone;
                });
        }

        return null;
    }

    /**
     * @param  array<string, mixed>  $attributes
     * @return array<string, mixed>
     */
    protected function preparePayload(array $attributes, ?string $externalId, ?string $email, ?string $phone): array
    {
        $payload = Arr::only($attributes, [
            'name',
            'email',
            'phone',
            'province',
            'city',
            'barangay',
            'street',
            'organization',
            'status',
            'participant_id',
            'registered_at',
            'registration_source',
            'registration_campaign_id',
            'registration_campaign_title',
            'registration_campaign_registered_at',
            'last_synced_at',
            'password',
        ]);

        $payload['name'] = trim((string) ($payload['name'] ?? 'Participant')) ?: 'Participant';
        $payload['email'] = $email;
        $payload['phone'] = $phone ? trim((string) ($attributes['phone'] ?? '')) : null;
        $payload['status'] = in_array(($payload['status'] ?? 'active'), ['active', 'inactive'], true)
            ? $payload['status']
            : 'active';
        $payload['role'] = 'PARTICIPANT';

        if ($externalId) {
            $payload['group6_external_id'] = $externalId;
        }

        return $payload;
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    protected function fillExistingUser(User $user, array $payload): void
    {
        foreach ($payload as $key => $value) {
            if (in_array($key, ['participant_id', 'registered_at', 'password'], true) && ! empty($user->{$key})) {
                continue;
            }

            if ($value === null || $value === '') {
                continue;
            }

            $user->{$key} = $value;
        }

        if (! $user->role) {
            $user->role = 'PARTICIPANT';
        }
    }

    protected function generateParticipantId(): string
    {
        do {
            $id = 'PART-'.strtoupper(Str::random(8));
        } while (User::where('participant_id', $id)->exists());

        return $id;
    }
}
