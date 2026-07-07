<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('lesson_resources') || ! Schema::hasTable('training_contents')) {
            return;
        }

        if (! Schema::hasColumn('training_contents', 'content_type')) {
            return;
        }

        $contents = DB::table('training_contents')->orderBy('id')->get();

        foreach ($contents as $content) {
            DB::table('lesson_resources')->insert([
                'training_content_id' => $content->id,
                'title' => $this->resourceTitle($content),
                'resource_type' => $content->content_type,
                'body' => $content->body,
                'file_path' => $content->file_path,
                'external_url' => $content->external_url,
                'sort_order' => 1,
                'ai_processed_text' => $content->ai_processed_text ?? null,
                'ai_processing_status' => $content->ai_processing_status ?? null,
                'ai_processing_error' => $content->ai_processing_error ?? null,
                'ai_processed_at' => $content->ai_processed_at ?? null,
                'created_at' => $content->created_at,
                'updated_at' => $content->updated_at,
            ]);
        }

        Schema::table('training_contents', function (Blueprint $table) {
            if (! Schema::hasColumn('training_contents', 'description')) {
                $table->text('description')->nullable()->after('title');
            }
        });

        Schema::table('training_contents', function (Blueprint $table) {
            $table->dropColumn([
                'content_type',
                'body',
                'file_path',
                'external_url',
                'ai_processed_text',
                'ai_processing_status',
                'ai_processing_error',
                'ai_processed_at',
            ]);
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('training_contents')) {
            return;
        }

        Schema::table('training_contents', function (Blueprint $table) {
            if (! Schema::hasColumn('training_contents', 'content_type')) {
                $table->string('content_type')->default('text')->after('title');
                $table->text('body')->nullable()->after('content_type');
                $table->string('file_path')->nullable()->after('body');
                $table->string('external_url')->nullable()->after('file_path');
                $table->longText('ai_processed_text')->nullable();
                $table->string('ai_processing_status', 32)->nullable();
                $table->text('ai_processing_error')->nullable();
                $table->timestamp('ai_processed_at')->nullable();
            }
        });

        if (Schema::hasTable('lesson_resources')) {
            $resources = DB::table('lesson_resources')
                ->orderBy('training_content_id')
                ->orderBy('sort_order')
                ->get()
                ->groupBy('training_content_id');

            foreach ($resources as $contentId => $group) {
                $primary = $group->first();
                if (! $primary) {
                    continue;
                }

                DB::table('training_contents')
                    ->where('id', $contentId)
                    ->update([
                        'content_type' => $primary->resource_type,
                        'body' => $primary->body,
                        'file_path' => $primary->file_path,
                        'external_url' => $primary->external_url,
                        'ai_processed_text' => $primary->ai_processed_text,
                        'ai_processing_status' => $primary->ai_processing_status,
                        'ai_processing_error' => $primary->ai_processing_error,
                        'ai_processed_at' => $primary->ai_processed_at,
                    ]);
            }

            DB::table('lesson_resources')->truncate();
        }

        if (Schema::hasColumn('training_contents', 'description')) {
            Schema::table('training_contents', function (Blueprint $table) {
                $table->dropColumn('description');
            });
        }
    }

    private function resourceTitle(object $content): string
    {
        if ($content->content_type === 'text') {
            return 'Introduction';
        }

        if ($content->content_type === 'pdf' && $content->file_path) {
            return basename(str_replace('\\', '/', $content->file_path));
        }

        return $content->title;
    }
};
