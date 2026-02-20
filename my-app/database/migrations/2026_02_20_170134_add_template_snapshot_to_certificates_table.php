<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('certificates', function (Blueprint $table) {
            $table->string('template_background_path')->nullable()->after('certificate_template_id');
            $table->decimal('template_background_opacity', 3, 2)->nullable()->after('template_background_path');
            $table->string('template_paper_size')->nullable()->after('template_background_opacity');
            $table->longText('template_content')->nullable()->after('template_paper_size');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('certificates', function (Blueprint $table) {
            $table->dropColumn(['template_background_path', 'template_background_opacity', 'template_paper_size', 'template_content']);
        });
    }
};
