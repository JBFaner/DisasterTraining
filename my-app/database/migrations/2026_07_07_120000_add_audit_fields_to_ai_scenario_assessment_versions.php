<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('ai_scenario_assessment_versions', function (Blueprint $table) {
            if (! Schema::hasColumn('ai_scenario_assessment_versions', 'published_by')) {
                $table->foreignId('published_by')->nullable()->after('published_at')
                    ->constrained('users')->nullOnDelete();
            }
            if (! Schema::hasColumn('ai_scenario_assessment_versions', 'last_edited_by')) {
                $table->foreignId('last_edited_by')->nullable()->after('published_by')
                    ->constrained('users')->nullOnDelete();
            }
            if (! Schema::hasColumn('ai_scenario_assessment_versions', 'last_edited_at')) {
                $table->timestamp('last_edited_at')->nullable()->after('last_edited_by');
            }
        });
    }

    public function down(): void
    {
        Schema::table('ai_scenario_assessment_versions', function (Blueprint $table) {
            if (Schema::hasColumn('ai_scenario_assessment_versions', 'last_edited_by')) {
                $table->dropConstrainedForeignId('last_edited_by');
            }
            if (Schema::hasColumn('ai_scenario_assessment_versions', 'published_by')) {
                $table->dropConstrainedForeignId('published_by');
            }
            if (Schema::hasColumn('ai_scenario_assessment_versions', 'last_edited_at')) {
                $table->dropColumn('last_edited_at');
            }
        });
    }
};
