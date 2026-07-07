<?php

namespace App\Services;

use App\Models\LessonQuizGenerationJob;
use App\Models\PortalNotification;
use App\Models\User;
use Illuminate\Support\Collection;

class PortalNotificationService
{
    public function notify(User $user, array $payload): PortalNotification
    {
        return PortalNotification::create([
            'user_id' => $user->id,
            'type' => $payload['type'],
            'title' => $payload['title'],
            'body' => $payload['body'] ?? null,
            'icon' => $payload['icon'] ?? null,
            'action_label' => $payload['action_label'] ?? null,
            'action_url' => $payload['action_url'] ?? null,
            'metadata' => $payload['metadata'] ?? null,
        ]);
    }

    /**
     * @return Collection<int, PortalNotification>
     */
    public function listForUser(int $userId, int $limit = 30): Collection
    {
        return PortalNotification::query()
            ->where('user_id', $userId)
            ->orderByDesc('created_at')
            ->limit($limit)
            ->get();
    }

    public function unreadCount(int $userId): int
    {
        return PortalNotification::query()
            ->where('user_id', $userId)
            ->whereNull('read_at')
            ->count();
    }

    public function markRead(PortalNotification $notification, int $userId): void
    {
        if ((int) $notification->user_id !== $userId) {
            abort(403);
        }

        $notification->markRead();
    }

    public function markAllRead(int $userId): int
    {
        return PortalNotification::query()
            ->where('user_id', $userId)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);
    }

    public function serialize(PortalNotification $notification): array
    {
        return [
            'id' => $notification->id,
            'type' => $notification->type,
            'title' => $notification->title,
            'body' => $notification->body,
            'icon' => $notification->icon,
            'action_label' => $notification->action_label,
            'action_url' => $notification->action_url,
            'metadata' => $notification->metadata,
            'read_at' => $notification->read_at,
            'created_at' => $notification->created_at,
            'is_unread' => $notification->read_at === null,
        ];
    }
}
