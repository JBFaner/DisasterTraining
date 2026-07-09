<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('qualified_trainers')) {
            return;
        }
        Schema::create('qualified_trainers', function (Blueprint $table) {
            $table->id();
            $table->string('group6_external_id')->nullable()->unique();
            $table->string('name');
            $table->string('email')->nullable();
            $table->string('phone')->nullable();
            $table->string('specialization')->nullable();
            $table->string('barangay')->nullable();
            $table->json('certifications')->nullable();
            $table->string('status')->default('active');
            $table->timestamp('qualified_at')->nullable();
            $table->timestamp('last_synced_at')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->index('status');
            $table->index('name');
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('qualified_trainers')) {
            return;
        }

        Schema::dropIfExists('qualified_trainers');
    }
};
