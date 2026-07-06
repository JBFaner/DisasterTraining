<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('group6_external_id')->nullable()->unique()->after('participant_id');
            $table->timestamp('last_synced_at')->nullable()->after('registered_at');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['group6_external_id', 'last_synced_at']);
        });
    }
};
