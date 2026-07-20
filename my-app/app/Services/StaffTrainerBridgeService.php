<?php

namespace App\Services;

use App\Models\QualifiedTrainer;
use App\Models\User;
use Illuminate\Support\Collection;

class StaffTrainerBridgeService
{
    public const TRAINER_ROLE = 'LGU_TRAINER';

    /**
     * Ensure a qualified_trainers mirror exists for assignment FKs.
     * Trainer List source of truth is Users & Roles (LGU_TRAINER).
     */
    public function ensureMirror(User $user): ?QualifiedTrainer
    {
        if ($user->role !== self::TRAINER_ROLE) {
            $this->deactivateMirrorForUser($user);

            return null;
        }

        $status = $user->status === 'active'
            ? QualifiedTrainer::STATUS_ACTIVE
            : QualifiedTrainer::STATUS_INACTIVE;

        $attributes = [
            'name' => $user->name,
            'email' => $user->email,
            'phone' => $user->phone,
            'barangay' => $user->barangay,
            'status' => $status,
            'last_synced_at' => now(),
            'user_id' => $user->id,
        ];

        if (! empty($user->position)) {
            $attributes['specialization'] = $user->position;
        }

        $byUser = QualifiedTrainer::query()->where('user_id', $user->id)->first();
        if ($byUser) {
            $byUser->fill($attributes)->save();

            return $byUser->fresh();
        }

        if ($user->email) {
            $byEmail = QualifiedTrainer::query()
                ->whereNull('user_id')
                ->where('email', $user->email)
                ->first();
            if ($byEmail) {
                $byEmail->fill($attributes)->save();

                return $byEmail->fresh();
            }
        }

        return QualifiedTrainer::create(array_merge($attributes, [
            'qualified_at' => now(),
            'specialization' => $user->position ?: 'LGU Trainer',
            'certifications' => [],
            'metadata' => ['source' => 'users_roles'],
        ]));
    }

    public function syncAllTrainerMirrors(): int
    {
        $count = 0;

        User::query()
            ->where('role', self::TRAINER_ROLE)
            ->orderBy('name')
            ->each(function (User $user) use (&$count) {
                $this->ensureMirror($user);
                $count++;
            });

        // Deactivate orphan mirrors that no longer map to an LGU_TRAINER user.
        QualifiedTrainer::query()
            ->whereNotNull('user_id')
            ->whereDoesntHave('user', fn ($q) => $q->where('role', self::TRAINER_ROLE))
            ->update(['status' => QualifiedTrainer::STATUS_INACTIVE]);

        return $count;
    }

    public function deactivateMirrorForUser(User $user): void
    {
        QualifiedTrainer::query()
            ->where('user_id', $user->id)
            ->update(['status' => QualifiedTrainer::STATUS_INACTIVE]);
    }

    /**
     * @return Collection<int, User>
     */
    public function trainerUsersQuery()
    {
        return User::query()->where('role', self::TRAINER_ROLE);
    }

    /**
     * Active staff-trainer mirrors for simulation assignment dropdowns.
     *
     * @return array<int, array{id: int, name: string, specialization: string|null}>
     */
    public function activeForAssignment(): array
    {
        $this->syncAllTrainerMirrors();

        return QualifiedTrainer::query()
            ->whereNotNull('user_id')
            ->where('status', QualifiedTrainer::STATUS_ACTIVE)
            ->orderBy('name')
            ->get(['id', 'name', 'specialization'])
            ->all();
    }
}
