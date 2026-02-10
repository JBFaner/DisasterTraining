<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('user_name')->nullable();
            $table->string('user_role')->nullable();
            $table->string('action'); // e.g. Logged in, Created user
            $table->string('module')->nullable(); // e.g. Auth, Users & Roles
            $table->string('status')->default('success'); // success, failed, warning
            $table->string('ip_address', 45)->nullable();
            $table->string('user_agent')->nullable();
            $table->string('url')->nullable();
            $table->string('description')->nullable();
            $table->json('metadata')->nullable();
            $table->json('old_values')->nullable();
            $table->json('new_values')->nullable();
            $table->text('failure_reason')->nullable();
            $table->timestamp('performed_at')->useCurrent();
            $table->timestamps();

            $table->index(['performed_at', 'module']);
            $table->index(['user_id', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
    }
};

