<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('ai_scenario_assessment_versions', function (Blueprint $table) {
            $table->foreignId('published_by')->nullable()->after('published_at')
                ->constrained('users')->nullOnDelete();
            $table->foreignId('last_edited_by')->nullable()->after('published_by')
                ->constrained('users')->nullOnDelete();
            $table->timestamp('last_edited_at')->nullable()->after('last_edited_by');
        });
    }

    public function down(): void
    {
        Schema::table('ai_scenario_assessment_versions', function (Blueprint $table) {
            $table->dropConstrainedForeignId('last_edited_by');
            $table->dropConstrainedForeignId('published_by');
            $table->dropColumn('last_edited_at');
        });
    }
};
