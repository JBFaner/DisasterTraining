<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('campaign_requests', function (Blueprint $table) {
            $table->foreignId('submitted_by_id')->nullable()->constrained('users')->nullOnDelete()->after('proposed_session_label');
        });
    }

    public function down(): void
    {
        Schema::table('campaign_requests', function (Blueprint $table) {
            $table->dropConstrainedForeignId('submitted_by_id');
        });
    }
};
