<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('training_contents', function (Blueprint $table) {
            if (! Schema::hasColumn('training_contents', 'learning_objectives')) {
                $table->json('learning_objectives')->nullable()->after('description');
            }
        });
    }

    public function down(): void
    {
        Schema::table('training_contents', function (Blueprint $table) {
            if (Schema::hasColumn('training_contents', 'learning_objectives')) {
                $table->dropColumn('learning_objectives');
            }
        });
    }
};
