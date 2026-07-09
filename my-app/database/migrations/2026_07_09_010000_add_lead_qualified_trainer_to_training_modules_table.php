<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('training_modules', function (Blueprint $table) {
            if (! Schema::hasColumn('training_modules', 'lead_qualified_trainer_id')) {
                $table->foreignId('lead_qualified_trainer_id')
                    ->nullable()
                    ->after('owner_id')
                    ->constrained('qualified_trainers')
                    ->nullOnDelete();
            }
        });
    }

    public function down(): void
    {
        Schema::table('training_modules', function (Blueprint $table) {
            if (Schema::hasColumn('training_modules', 'lead_qualified_trainer_id')) {
                $table->dropConstrainedForeignId('lead_qualified_trainer_id');
            }
        });
    }
};

