<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('campaign_registrations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('campaign_request_id')->constrained()->cascadeOnDelete();
            $table->foreignId('training_module_id')->constrained()->cascadeOnDelete();
            $table->string('registration_status', 40)->default('registered');
            $table->timestamp('registered_at')->nullable();
            $table->string('attendance_status', 40)->default('not_started');
            $table->string('evaluation_status', 40)->default('not_started');
            $table->string('certificate_status', 40)->default('not_issued');
            $table->timestamps();

            $table->unique(['user_id', 'campaign_request_id'], 'campaign_regs_user_campaign_unique');
            $table->index(['campaign_request_id', 'registration_status'], 'campaign_regs_campaign_status_idx');
        });

        if (Schema::hasColumn('users', 'registration_campaign_id')) {
            $users = DB::table('users')
                ->where('role', 'PARTICIPANT')
                ->whereNotNull('registration_campaign_id')
                ->where('registration_campaign_id', 'like', 'campaign-request:%')
                ->get(['id', 'registration_campaign_id', 'registration_campaign_registered_at']);

            foreach ($users as $user) {
                if (! preg_match('/^campaign-request:(\d+)$/', (string) $user->registration_campaign_id, $matches)) {
                    continue;
                }

                $campaignRequestId = (int) $matches[1];
                $campaignRequest = DB::table('campaign_requests')->where('id', $campaignRequestId)->first(['id', 'training_module_id']);
                if (! $campaignRequest || ! $campaignRequest->training_module_id) {
                    continue;
                }

                DB::table('campaign_registrations')->insertOrIgnore([
                    'user_id' => $user->id,
                    'campaign_request_id' => $campaignRequest->id,
                    'training_module_id' => $campaignRequest->training_module_id,
                    'registration_status' => 'registered',
                    'registered_at' => $user->registration_campaign_registered_at ?? now(),
                    'attendance_status' => 'not_started',
                    'evaluation_status' => 'not_started',
                    'certificate_status' => 'not_issued',
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('campaign_registrations');
    }
};
