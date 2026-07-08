<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('training_modules', function (Blueprint $table) {
            $table->text('short_description')->nullable()->after('title');
            $table->string('related_hazard')->nullable()->after('category');
            $table->string('delivery_method')->nullable()->after('related_hazard');
            $table->text('recommended_audience')->nullable()->after('estimated_duration_minutes');
        });
    }

    public function down(): void
    {
        Schema::table('training_modules', function (Blueprint $table) {
            $table->dropColumn([
                'short_description',
                'related_hazard',
                'delivery_method',
                'recommended_audience',
            ]);
        });
    }
};
