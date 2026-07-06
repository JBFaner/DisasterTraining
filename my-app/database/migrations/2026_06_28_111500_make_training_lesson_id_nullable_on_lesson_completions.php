<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $driver = Schema::getConnection()->getDriverName();

        if ($driver === 'mysql') {
            DB::statement('ALTER TABLE lesson_completions MODIFY training_lesson_id BIGINT UNSIGNED NULL');
        } else {
            Schema::table('lesson_completions', function (Blueprint $table) {
                $table->unsignedBigInteger('training_lesson_id')->nullable()->change();
            });
        }

        if (! $this->indexExists('lesson_completions', 'lesson_completion_content_unique')) {
            Schema::table('lesson_completions', function (Blueprint $table) {
                $table->unique(['user_id', 'training_content_id'], 'lesson_completion_content_unique');
            });
        }
    }

    public function down(): void
    {
        if ($this->indexExists('lesson_completions', 'lesson_completion_content_unique')) {
            Schema::table('lesson_completions', function (Blueprint $table) {
                $table->dropUnique('lesson_completion_content_unique');
            });
        }

        $driver = Schema::getConnection()->getDriverName();

        if ($driver === 'mysql') {
            DB::statement('ALTER TABLE lesson_completions MODIFY training_lesson_id BIGINT UNSIGNED NOT NULL');
        } else {
            Schema::table('lesson_completions', function (Blueprint $table) {
                $table->unsignedBigInteger('training_lesson_id')->nullable(false)->change();
            });
        }
    }

    private function indexExists(string $table, string $indexName): bool
    {
        $driver = Schema::getConnection()->getDriverName();

        if ($driver === 'mysql') {
            return collect(DB::select("SHOW INDEX FROM {$table}"))
                ->pluck('Key_name')
                ->unique()
                ->contains($indexName);
        }

        if ($driver === 'sqlite') {
            $indexes = DB::select("PRAGMA index_list('{$table}')");

            return collect($indexes)->contains(fn ($index) => $index->name === $indexName);
        }

        return false;
    }
};
