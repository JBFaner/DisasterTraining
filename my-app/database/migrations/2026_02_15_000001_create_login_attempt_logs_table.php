<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('login_attempt_logs')) {
            return;
        }

        Schema::create('login_attempt_logs', function (Blueprint $table) {
            $table->id();
            $table->string('email', 255)->nullable();
            $table->string('ip_address', 45);
            $table->string('status', 20); // 'failed', 'locked'
            $table->timestamp('created_at')->useCurrent();
        });

        Schema::table('login_attempt_logs', function (Blueprint $table) {
            $table->index(['email', 'created_at']);
            $table->index(['ip_address', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('login_attempt_logs');
    }
};
