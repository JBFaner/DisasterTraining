<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('training_contents', function (Blueprint $table) {
            if (! Schema::hasColumn('training_contents', 'created_by')) {
                $table->foreignId('created_by')->nullable()->after('sort_order')->constrained('users')->nullOnDelete();
            }
            if (! Schema::hasColumn('training_contents', 'updated_by')) {
                $table->foreignId('updated_by')->nullable()->after('created_by')->constrained('users')->nullOnDelete();
            }
        });

        Schema::table('lesson_resources', function (Blueprint $table) {
            if (! Schema::hasColumn('lesson_resources', 'created_by')) {
                $table->foreignId('created_by')->nullable()->after('sort_order')->constrained('users')->nullOnDelete();
            }
            if (! Schema::hasColumn('lesson_resources', 'updated_by')) {
                $table->foreignId('updated_by')->nullable()->after('created_by')->constrained('users')->nullOnDelete();
            }
        });
    }

    public function down(): void
    {
        Schema::table('training_contents', function (Blueprint $table) {
            if (Schema::hasColumn('training_contents', 'updated_by')) {
                $table->dropConstrainedForeignId('updated_by');
            }
            if (Schema::hasColumn('training_contents', 'created_by')) {
                $table->dropConstrainedForeignId('created_by');
            }
        });

        Schema::table('lesson_resources', function (Blueprint $table) {
            if (Schema::hasColumn('lesson_resources', 'updated_by')) {
                $table->dropConstrainedForeignId('updated_by');
            }
            if (Schema::hasColumn('lesson_resources', 'created_by')) {
                $table->dropConstrainedForeignId('created_by');
            }
        });
    }
};
