<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('lesson_quiz_versions', function (Blueprint $table) {
            if (! Schema::hasColumn('lesson_quiz_versions', 'language_versions')) {
                $table->json('language_versions')->nullable()->after('generated_language');
            }
        });
    }

    public function down(): void
    {
        Schema::table('lesson_quiz_versions', function (Blueprint $table) {
            if (Schema::hasColumn('lesson_quiz_versions', 'language_versions')) {
                $table->dropColumn('language_versions');
            }
        });
    }
};
