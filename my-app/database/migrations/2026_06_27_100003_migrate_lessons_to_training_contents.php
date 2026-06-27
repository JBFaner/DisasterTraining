<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('training_lessons') || ! Schema::hasTable('training_contents')) {
            return;
        }

        $lessons = DB::table('training_lessons')->orderBy('training_module_id')->orderBy('order')->get();

        foreach ($lessons as $lesson) {
            $sortOrder = (int) ($lesson->order ?? 0);

            DB::table('training_contents')->insert([
                'training_module_id' => $lesson->training_module_id,
                'title' => $lesson->title,
                'content_type' => 'text',
                'body' => $lesson->description,
                'file_path' => null,
                'external_url' => null,
                'sort_order' => $sortOrder,
                'created_at' => $lesson->created_at,
                'updated_at' => $lesson->updated_at,
            ]);

            if (! Schema::hasTable('lesson_materials')) {
                continue;
            }

            $materials = DB::table('lesson_materials')
                ->where('training_lesson_id', $lesson->id)
                ->orderBy('id')
                ->get();

            foreach ($materials as $index => $material) {
                $path = $material->path;
                $mappedType = $this->mapMaterialType($material->type, $path);

                DB::table('training_contents')->insert([
                    'training_module_id' => $lesson->training_module_id,
                    'title' => $material->label ?: ($lesson->title.' — '.$material->type),
                    'content_type' => $mappedType,
                    'body' => null,
                    'file_path' => in_array($mappedType, ['pdf', 'video', 'image'], true) ? $path : null,
                    'external_url' => in_array($mappedType, ['youtube'], true) ? $path : ($mappedType === 'text' ? $path : null),
                    'sort_order' => $sortOrder + $index + 1,
                    'created_at' => $material->created_at,
                    'updated_at' => $material->updated_at,
                ]);
            }
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('training_contents')) {
            DB::table('training_contents')->truncate();
        }
    }

    protected function mapMaterialType(?string $type, ?string $path): string
    {
        $normalized = strtolower(trim((string) $type));

        if ($this->isYouTubeUrl($path)) {
            return 'youtube';
        }

        return match ($normalized) {
            'pdf' => 'pdf',
            'video' => 'video',
            'image' => 'image',
            'link' => $this->isYouTubeUrl($path) ? 'youtube' : 'text',
            default => 'text',
        };
    }

    protected function isYouTubeUrl(?string $url): bool
    {
        if (! $url) {
            return false;
        }

        return (bool) preg_match('/(?:youtube\.com\/watch\?v=|youtu\.be\/)[A-Za-z0-9_-]{11}/', $url);
    }
};
