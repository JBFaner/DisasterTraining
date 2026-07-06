<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'phone',
        'email_verified_at',
        'pending_email',
        'pending_phone',
        'pending_email',
        'pending_phone',
        'province',
        'city',
        'barangay',
        'street',
        'participant_id',
        'status',
        'registered_at',
        'group6_external_id',
        'last_synced_at',
        'profile_picture',
        'barangay_id',
        'philippine_barangay_id',
        'last_activity',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'phone_verified_at' => 'datetime',
            'password' => 'hashed',
            'registered_at' => 'datetime',
            'last_synced_at' => 'datetime',
            'last_login' => 'datetime',
            'last_activity' => 'datetime',
        ];
    }

    public function eventRegistrations()
    {
        return $this->hasMany(EventRegistration::class);
    }

    public function attendances()
    {
        return $this->hasMany(Attendance::class);
    }

    public function isParticipant()
    {
        return $this->role === 'PARTICIPANT';
    }

    public function barangayProfile()
    {
        return $this->belongsTo(BarangayProfile::class, 'barangay_id');
    }

    public function lessonCompletions()
    {
        return $this->hasMany(LessonCompletion::class);
    }

    public function aiScenarioAttempts()
    {
        return $this->hasMany(AiScenarioAttempt::class);
    }

    public function evaluationResults()
    {
        return $this->hasMany(EvaluationResult::class, 'participant_id');
    }

    public function certificates()
    {
        return $this->hasMany(Certificate::class);
    }
}
