<?php

namespace App\Http\Controllers;

use App\Models\LessonQuizGenerationJob;
use App\Models\PortalNotification;
use App\Services\PortalNotificationService;
use Illuminate\Http\Request;

class PortalNotificationController extends Controller
{
    public function __construct(
        private readonly PortalNotificationService $notificationService,
    ) {}

    public function index(Request $request)
    {
        $user = portal_user();
        if (! $user) {
            abort(403);
        }

        $notifications = $this->notificationService
            ->listForUser((int) $user->id, 50)
            ->map(fn (PortalNotification $notification) => $this->notificationService->serialize($notification));

        return response()->json([
            'notifications' => $notifications,
            'unread_count' => $this->notificationService->unreadCount((int) $user->id),
        ]);
    }

    public function unreadCount()
    {
        $user = portal_user();
        if (! $user) {
            abort(403);
        }

        return response()->json([
            'unread_count' => $this->notificationService->unreadCount((int) $user->id),
        ]);
    }

    public function markRead(PortalNotification $notification)
    {
        $user = portal_user();
        if (! $user) {
            abort(403);
        }

        $this->notificationService->markRead($notification, (int) $user->id);

        return response()->json(['message' => 'Notification marked as read.']);
    }

    public function markAllRead()
    {
        $user = portal_user();
        if (! $user) {
            abort(403);
        }

        $updated = $this->notificationService->markAllRead((int) $user->id);

        return response()->json([
            'message' => 'All notifications marked as read.',
            'updated' => $updated,
        ]);
    }
}
