<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('training_modules', function (Blueprint $table) {
            if (! Schema::hasColumn('training_modules', 'short_description')) {
                $table->text('short_description')->nullable()->after('title');
            }
            if (! Schema::hasColumn('training_modules', 'related_hazard')) {
                $table->string('related_hazard')->nullable()->after('category');
            }
            if (! Schema::hasColumn('training_modules', 'delivery_method')) {
                $table->string('delivery_method')->nullable()->after('related_hazard');
            }
            if (! Schema::hasColumn('training_modules', 'recommended_audience')) {
                $table->text('recommended_audience')->nullable()->after('estimated_duration_minutes');
            }
        });
    }

    public function down(): void
    {
        Schema::table('training_modules', function (Blueprint $table) {
            $columnsToDrop = [];
            foreach ([
                'short_description',
                'related_hazard',
                'delivery_method',
                'recommended_audience',
            ] as $column) {
                if (Schema::hasColumn('training_modules', $column)) {
                    $columnsToDrop[] = $column;
                }
            }
            if ($columnsToDrop !== []) {
                $table->dropColumn($columnsToDrop);
            }
        });
    }
};
