<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('qualified_trainers')) {
            return;
        }

        Schema::table('qualified_trainers', function (Blueprint $table) {
            if (! Schema::hasColumn('qualified_trainers', 'user_id')) {
                $table->foreignId('user_id')
                    ->nullable()
                    ->after('id')
                    ->constrained('users')
                    ->nullOnDelete();
                $table->unique('user_id');
            }
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('qualified_trainers') || ! Schema::hasColumn('qualified_trainers', 'user_id')) {
            return;
        }

        Schema::table('qualified_trainers', function (Blueprint $table) {
            $table->dropConstrainedForeignId('user_id');
        });
    }
};
