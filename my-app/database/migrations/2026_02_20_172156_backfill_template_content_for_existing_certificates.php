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
        // Backfill template_content for existing certificates that have a template but no stored content
        \DB::table('certificates')
            ->whereNull('template_content')
            ->whereNotNull('certificate_template_id')
            ->chunkById(100, function ($certificates) {
                foreach ($certificates as $cert) {
                    $template = \App\Models\CertificateTemplate::find($cert->certificate_template_id);
                    if ($template && $template->template_content) {
                        \DB::table('certificates')
                            ->where('id', $cert->id)
                            ->update(['template_content' => $template->template_content]);
                    }
                }
            });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Cannot reverse backfill - data would be lost
    }
};
