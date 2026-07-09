<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (! Schema::hasColumn('users', 'registration_source')) {
                $table->string('registration_source', 40)
                    ->default('direct_registration')
                    ->after('group6_external_id');
                $table->index('registration_source');
            }
            if (! Schema::hasColumn('users', 'registration_campaign_id')) {
                $table->string('registration_campaign_id')->nullable()->after('registration_source');
            }
            if (! Schema::hasColumn('users', 'registration_campaign_title')) {
                $table->string('registration_campaign_title')->nullable()->after('registration_campaign_id');
            }
            if (! Schema::hasColumn('users', 'registration_campaign_registered_at')) {
                $table->timestamp('registration_campaign_registered_at')->nullable()->after('registration_campaign_title');
            }
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'registration_source')) {
                $table->dropIndex(['registration_source']);
            }
            $columnsToDrop = [];
            foreach ([
                'registration_source',
                'registration_campaign_id',
                'registration_campaign_title',
                'registration_campaign_registered_at',
            ] as $column) {
                if (Schema::hasColumn('users', $column)) {
                    $columnsToDrop[] = $column;
                }
            }
            if ($columnsToDrop !== []) {
                $table->dropColumn($columnsToDrop);
            }
        });
    }
};

