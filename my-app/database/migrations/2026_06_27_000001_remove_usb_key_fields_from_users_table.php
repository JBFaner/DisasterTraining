<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'usb_key_enabled')) {
                $table->dropColumn('usb_key_enabled');
            }
            if (Schema::hasColumn('users', 'usb_key_hash')) {
                $table->dropColumn('usb_key_hash');
            }
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (! Schema::hasColumn('users', 'usb_key_enabled')) {
                $table->boolean('usb_key_enabled')->default(false);
            }
            if (! Schema::hasColumn('users', 'usb_key_hash')) {
                $table->string('usb_key_hash')->nullable();
            }
        });
    }
};
