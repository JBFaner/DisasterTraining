<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('training_modules', function (Blueprint $table) {
            if (! Schema::hasColumn('training_modules', 'campaign_expected_participants')) {
                $table->unsignedInteger('campaign_expected_participants')
                    ->nullable()
                    ->after('campaign_training_completion_deadline');
            }
        });
    }

    public function down(): void
    {
        Schema::table('training_modules', function (Blueprint $table) {
            if (Schema::hasColumn('training_modules', 'campaign_expected_participants')) {
                $table->dropColumn('campaign_expected_participants');
            }
        });
    }
};

