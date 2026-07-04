<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('group6_inbound_records', function (Blueprint $table) {
            $table->id();
            $table->string('record_type', 64)->index();
            $table->string('external_id')->nullable()->index();
            $table->json('payload');
            $table->string('status', 32)->default('pending')->index();
            $table->text('error_message')->nullable();
            $table->timestamp('received_at')->useCurrent();
            $table->timestamp('processed_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('group6_inbound_records');
    }
};
