<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class UserMonitoringController extends Controller
{
    /**
     * Show the user monitoring page.
     */
    public function index(Request $request)
    {
        $user = Auth::user();

        // Only Admin can access
        if ($user->role !== 'LGU_ADMIN') {
            abort(403, 'Unauthorized access to user monitoring.');
        }

        // Check if last_activity column exists
        $hasLastActivityColumn = DB::getSchemaBuilder()->hasColumn('users', 'last_activity');
        
        // Build select array conditionally
        $selectFields = [
            'users.id',
            'users.name',
            'users.email',
            'users.role',
            'users.status',
            'users.last_login',
            'users.created_at',
        ];
        
        if ($hasLastActivityColumn) {
            $selectFields[] = 'users.last_activity';
        }
        
        // Get all users with their activity status
        $users = User::select($selectFields)
        ->orderBy('users.role')
        ->orderBy('users.name')
        ->get()
        ->map(function ($user) use ($hasLastActivityColumn) {
            $isOnline = $this->isUserOnline($user, $hasLastActivityColumn);
            $inactiveMinutes = $isOnline ? 0 : $this->getInactiveMinutes($user, $hasLastActivityColumn);
            
            return [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'role_display' => $this->getRoleDisplayName($user->role),
                'status' => $user->status,
                'is_online' => $isOnline,
                'inactive_minutes' => $inactiveMinutes,
                'last_login' => $user->last_login ? $user->last_login->toIso8601String() : null,
                'last_activity' => ($hasLastActivityColumn && $user->last_activity) ? $user->last_activity->toIso8601String() : null,
                'created_at' => $user->created_at->toIso8601String(),
            ];
        });

        return view('app', [
            'section' => 'user_monitoring',
            'users' => $users,
        ]);
    }

    /**
     * API endpoint to get current user statuses (for real-time updates).
     */
    public function status(Request $request)
    {
        $user = Auth::user();

        // Only Admin can access
        if ($user->role !== 'LGU_ADMIN') {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        // Check if last_activity column exists
        $hasLastActivityColumn = DB::getSchemaBuilder()->hasColumn('users', 'last_activity');
        
        $selectFields = ['users.id'];
        if ($hasLastActivityColumn) {
            $selectFields[] = 'users.last_activity';
        }
        
        $users = User::select($selectFields)
        ->get()
        ->map(function ($user) use ($hasLastActivityColumn) {
            $isOnline = $this->isUserOnline($user, $hasLastActivityColumn);
            $inactiveMinutes = $isOnline ? 0 : $this->getInactiveMinutes($user, $hasLastActivityColumn);
            
            return [
                'id' => $user->id,
                'is_online' => $isOnline,
                'inactive_minutes' => $inactiveMinutes,
                'last_activity' => ($hasLastActivityColumn && $user->last_activity) ? $user->last_activity->toIso8601String() : null,
            ];
        });

        return response()->json($users);
    }

    /**
     * Determine if a user is currently online.
     * A user is considered online if they were active within the last 5 minutes.
     */
    private function isUserOnline(User $user, bool $hasLastActivityColumn = true): bool
    {
        if ($hasLastActivityColumn && $user->last_activity) {
            $inactiveMinutes = now()->diffInMinutes($user->last_activity);
            return $inactiveMinutes <= 5;
        }
        
        // Fallback to last_login if last_activity column doesn't exist
        if ($user->last_login) {
            $inactiveMinutes = now()->diffInMinutes($user->last_login);
            return $inactiveMinutes <= 5;
        }

        return false;
    }

    /**
     * Get the number of minutes a user has been inactive.
     */
    private function getInactiveMinutes(User $user, bool $hasLastActivityColumn = true): int
    {
        if ($hasLastActivityColumn && $user->last_activity) {
            return now()->diffInMinutes($user->last_activity);
        }
        
        // If no last_activity, use last_login or created_at
        $referenceTime = $user->last_login ?? $user->created_at;
        if (!$referenceTime) {
            return 0;
        }
        return now()->diffInMinutes($referenceTime);
    }

    /**
     * Get a user-friendly display name for a role.
     */
    private function getRoleDisplayName(string $role): string
    {
        return match ($role) {
            'LGU_ADMIN' => 'LGU Admin',
            'LGU_TRAINER' => 'LGU Trainer',
            'STAFF' => 'Staff',
            'PARTICIPANT' => 'Participant',
            default => $role,
        };
    }
}
