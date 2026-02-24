<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('pending_email')->nullable()->after('email');
            $table->string('email_change_token', 128)->nullable()->after('pending_email');
            $table->timestamp('email_change_requested_at')->nullable()->after('email_change_token');

            $table->string('pending_phone')->nullable()->after('phone');
            $table->string('phone_change_token', 128)->nullable()->after('pending_phone');
            $table->timestamp('phone_change_requested_at')->nullable()->after('phone_change_token');
            $table->timestamp('phone_verified_at')->nullable()->after('phone_change_requested_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'pending_email',
                'email_change_token',
                'email_change_requested_at',
                'pending_phone',
                'phone_change_token',
                'phone_change_requested_at',
                'phone_verified_at',
            ]);
        });
    }
};

