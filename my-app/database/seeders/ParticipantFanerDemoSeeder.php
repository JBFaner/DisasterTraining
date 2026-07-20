<?php

namespace Database\Seeders;

/**
 * Populates participant portal demo data for user id 55 / jfaner7@gmail.com.
 *
 * Run: php artisan db:seed --class=ParticipantFanerDemoSeeder
 */
class ParticipantFanerDemoSeeder extends ParticipantJbDemoSeeder
{
    protected int $targetUserId = 55;

    protected string $targetEmail = 'jfaner7@gmail.com';

    protected string $seedMarker = 'participant_faner_demo';

    protected string $campaignLabel = '[Faner Demo] Barangay Preparedness Campaign';

    protected string $defaultParticipantId = 'PART-FANER55';

    protected string $defaultDisplayName = 'Faner, John Benedict S.';

    protected string $eventTitlePrefix = '[Faner Demo]';

    protected string $certificatePrefix = 'FANER';
}
