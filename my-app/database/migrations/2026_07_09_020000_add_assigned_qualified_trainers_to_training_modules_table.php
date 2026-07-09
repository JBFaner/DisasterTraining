<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('training_modules', function (Blueprint $table) {
            if (! Schema::hasColumn('training_modules', 'assigned_qualified_trainer_ids')) {
                $table->json('assigned_qualified_trainer_ids')
                    ->nullable()
                    ->after('lead_qualified_trainer_id');
            }
        });
    }

    public function down(): void
    {
        Schema::table('training_modules', function (Blueprint $table) {
            if (Schema::hasColumn('training_modules', 'assigned_qualified_trainer_ids')) {
                $table->dropColumn('assigned_qualified_trainer_ids');
            }
        });
    }
};

