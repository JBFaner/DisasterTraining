<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('training_modules', function (Blueprint $table) {
            $table->unsignedInteger('estimated_duration_minutes')->nullable()->after('learning_objectives');
            $table->string('thumbnail_path')->nullable()->after('estimated_duration_minutes');
        });
    }

    public function down(): void
    {
        Schema::table('training_modules', function (Blueprint $table) {
            $table->dropColumn(['estimated_duration_minutes', 'thumbnail_path']);
        });
    }
};
