<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('certificate_templates', function (Blueprint $table) {
            if (! Schema::hasColumn('certificate_templates', 'design_json')) {
                $table->json('design_json')->nullable()->after('template_content');
            }
        });
    }

    public function down(): void
    {
        Schema::table('certificate_templates', function (Blueprint $table) {
            if (Schema::hasColumn('certificate_templates', 'design_json')) {
                $table->dropColumn('design_json');
            }
        });
    }
};
