<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('training_modules', function (Blueprint $table) {
            if (! Schema::hasColumn('training_modules', 'campaign_registration_opens')) {
                $table->dateTime('campaign_registration_opens')->nullable()->after('available_training_sessions');
            }
            if (! Schema::hasColumn('training_modules', 'campaign_registration_deadline')) {
                $table->dateTime('campaign_registration_deadline')->nullable()->after('campaign_registration_opens');
            }
            if (! Schema::hasColumn('training_modules', 'campaign_training_completion_deadline')) {
                $table->dateTime('campaign_training_completion_deadline')->nullable()->after('campaign_registration_deadline');
            }
            if (! Schema::hasColumn('training_modules', 'campaign_maximum_participants')) {
                $table->unsignedInteger('campaign_maximum_participants')->nullable()->after('campaign_training_completion_deadline');
            }
            if (! Schema::hasColumn('training_modules', 'campaign_registration_enabled')) {
                $table->boolean('campaign_registration_enabled')->default(true)->after('campaign_maximum_participants');
            }
        });
    }

    public function down(): void
    {
        Schema::table('training_modules', function (Blueprint $table) {
            $columnsToDrop = [];
            foreach ([
                'campaign_registration_opens',
                'campaign_registration_deadline',
                'campaign_training_completion_deadline',
                'campaign_maximum_participants',
                'campaign_registration_enabled',
            ] as $column) {
                if (Schema::hasColumn('training_modules', $column)) {
                    $columnsToDrop[] = $column;
                }
            }
            if ($columnsToDrop !== []) {
                $table->dropColumn($columnsToDrop);
            }
        });
    }
};
