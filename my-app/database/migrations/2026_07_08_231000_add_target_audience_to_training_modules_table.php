<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('training_modules', function (Blueprint $table) {
            if (! Schema::hasColumn('training_modules', 'target_audience')) {
                $table->json('target_audience')->nullable()->after('delivery_method');
            }
        });
    }

    public function down(): void
    {
        Schema::table('training_modules', function (Blueprint $table) {
            if (Schema::hasColumn('training_modules', 'target_audience')) {
                $table->dropColumn('target_audience');
            }
        });
    }
};
