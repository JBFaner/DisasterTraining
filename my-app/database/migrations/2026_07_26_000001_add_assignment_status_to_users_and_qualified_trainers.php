<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (! Schema::hasColumn('users', 'assignment_status')) {
                $table->string('assignment_status', 40)->default('available')->after('status');
            }
        });

        Schema::table('qualified_trainers', function (Blueprint $table) {
            if (! Schema::hasColumn('qualified_trainers', 'assignment_status')) {
                $table->string('assignment_status', 40)->default('available')->after('status');
            }
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'assignment_status')) {
                $table->dropColumn('assignment_status');
            }
        });
        Schema::table('qualified_trainers', function (Blueprint $table) {
            if (Schema::hasColumn('qualified_trainers', 'assignment_status')) {
                $table->dropColumn('assignment_status');
            }
        });
    }
};
