<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('lesson_completions', function (Blueprint $table) {
            $table->foreignId('training_content_id')
                ->nullable()
                ->after('training_lesson_id')
                ->constrained('training_contents')
                ->nullOnDelete();
        });

        if (! Schema::hasTable('training_contents') || ! Schema::hasTable('training_lessons')) {
            return;
        }

        $completions = DB::table('lesson_completions')->get();

        foreach ($completions as $completion) {
            $lesson = DB::table('training_lessons')->where('id', $completion->training_lesson_id)->first();
            if (! $lesson) {
                continue;
            }

            $content = DB::table('training_contents')
                ->where('training_module_id', $lesson->training_module_id)
                ->where('title', $lesson->title)
                ->where('content_type', 'text')
                ->orderBy('sort_order')
                ->first();

            if ($content) {
                DB::table('lesson_completions')
                    ->where('id', $completion->id)
                    ->update(['training_content_id' => $content->id]);
            }
        }
    }

    public function down(): void
    {
        Schema::table('lesson_completions', function (Blueprint $table) {
            $table->dropConstrainedForeignId('training_content_id');
        });
    }
};
