<?php

namespace App\Services;

use App\Models\PortalNotification;
use App\Models\User;

class UserNotificationPreferenceService
{
    /**
     * @return array<string, bool>
     */
    public function defaults(): array
    {
        return [
            'in_app_enabled' => true,
            'registrations' => true,
            'events' => true,
            'attendance' => true,
            'evaluations' => true,
            'certificates' => true,
        ];
    }

    /**
     * @return array<string, bool>
     */
    public function resolve(User $user): array
    {
        $stored = is_array($user->notification_preferences)
            ? $user->notification_preferences
            : [];

        return array_merge($this->defaults(), $stored);
    }

    public function wants(User $user, string $type): bool
    {
        $preferences = $this->resolve($user);

        if (! $preferences['in_app_enabled']) {
            return false;
        }

        $category = $this->categoryForType($type);
        if ($category === null) {
            return true;
        }

        return (bool) ($preferences[$category] ?? true);
    }

    public function categoryForType(string $type): ?string
    {
        return match ($type) {
            PortalNotification::TYPE_REGISTRATION_APPROVED,
            PortalNotification::TYPE_REGISTRATION_REJECTED,
            PortalNotification::TYPE_REGISTRATION_SUBMITTED => 'registrations',
            PortalNotification::TYPE_EVENT_CANCELLED,
            PortalNotification::TYPE_REGISTRATION_PENDING => 'events',
            PortalNotification::TYPE_ATTENDANCE_MARKED => 'attendance',
            PortalNotification::TYPE_EVALUATION_RECORDED,
            PortalNotification::TYPE_ASSESSMENT_COMPLETED => 'evaluations',
            PortalNotification::TYPE_CERTIFICATE_ISSUED,
            PortalNotification::TYPE_CERTIFICATE_ELIGIBLE,
            PortalNotification::TYPE_CERTIFICATE_REVOKED => 'certificates',
            default => null,
        };
    }

    /**
     * @param  array<string, bool>  $preferences
     * @return array<string, bool>
     */
    public function sanitize(array $preferences): array
    {
        $defaults = $this->defaults();
        $sanitized = [];

        foreach ($defaults as $key => $defaultValue) {
            $sanitized[$key] = array_key_exists($key, $preferences)
                ? filter_var($preferences[$key], FILTER_VALIDATE_BOOLEAN)
                : $defaultValue;
        }

        return $sanitized;
    }
}
