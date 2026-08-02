<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('certificate_templates')) {
            return;
        }

        Schema::table('certificate_templates', function (Blueprint $table) {
            if (! Schema::hasColumn('certificate_templates', 'hazard_category')) {
                $table->string('hazard_category')->nullable()->after('type'); // Fire | Flood | Earthquake
            }
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('certificate_templates')) {
            return;
        }

        Schema::table('certificate_templates', function (Blueprint $table) {
            if (Schema::hasColumn('certificate_templates', 'hazard_category')) {
                $table->dropColumn('hazard_category');
            }
        });
    }
};
