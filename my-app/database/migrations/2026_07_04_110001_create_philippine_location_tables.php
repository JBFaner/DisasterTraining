<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('philippine_regions')) {
            return;
        }

        Schema::create('philippine_regions', function (Blueprint $table) {
            $table->id();
            $table->string('psgc_code', 20)->unique();
            $table->string('name');
            $table->timestamps();
        });

        Schema::create('philippine_provinces', function (Blueprint $table) {
            $table->id();
            $table->foreignId('region_id')->constrained('philippine_regions')->cascadeOnDelete();
            $table->string('psgc_code', 20)->unique();
            $table->string('name');
            $table->timestamps();
        });

        Schema::create('philippine_cities', function (Blueprint $table) {
            $table->id();
            $table->foreignId('region_id')->constrained('philippine_regions')->cascadeOnDelete();
            $table->foreignId('province_id')->nullable()->constrained('philippine_provinces')->nullOnDelete();
            $table->string('psgc_code', 20)->unique();
            $table->string('name');
            $table->string('type', 32)->default('city');
            $table->timestamps();
        });

        Schema::create('philippine_barangays', function (Blueprint $table) {
            $table->id();
            $table->foreignId('city_id')->constrained('philippine_cities')->cascadeOnDelete();
            $table->string('psgc_code', 20)->unique();
            $table->string('name');
            $table->timestamps();

            $table->index(['city_id', 'name']);
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('philippine_regions')) {
            return;
        }

        Schema::dropIfExists('philippine_barangays');
        Schema::dropIfExists('philippine_cities');
        Schema::dropIfExists('philippine_provinces');
        Schema::dropIfExists('philippine_regions');
    }
};
