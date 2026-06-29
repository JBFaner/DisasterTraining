<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement('ALTER TABLE lesson_completions MODIFY training_lesson_id BIGINT UNSIGNED NULL');

        $indexNames = collect(DB::select('SHOW INDEX FROM lesson_completions'))
            ->pluck('Key_name')
            ->unique();

        if (! $indexNames->contains('lesson_completion_content_unique')) {
            Schema::table('lesson_completions', function (Blueprint $table) {
                $table->unique(['user_id', 'training_content_id'], 'lesson_completion_content_unique');
            });
        }
    }

    public function down(): void
    {
        $indexNames = collect(DB::select('SHOW INDEX FROM lesson_completions'))
            ->pluck('Key_name')
            ->unique();

        if ($indexNames->contains('lesson_completion_content_unique')) {
            Schema::table('lesson_completions', function (Blueprint $table) {
                $table->dropUnique('lesson_completion_content_unique');
            });
        }

        DB::statement('ALTER TABLE lesson_completions MODIFY training_lesson_id BIGINT UNSIGNED NOT NULL');
    }
};
