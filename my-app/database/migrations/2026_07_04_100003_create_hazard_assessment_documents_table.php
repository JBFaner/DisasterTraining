<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('hazard_assessment_documents')) {
            return;
        }

        Schema::create('hazard_assessment_documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('barangay_profile_id')->constrained('barangay_profiles')->cascadeOnDelete();
            $table->string('document_type');
            $table->string('file_path');
            $table->string('original_filename');
            $table->string('mime_type')->nullable();
            $table->unsignedBigInteger('file_size')->nullable();
            $table->foreignId('uploaded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('hazard_assessment_documents')) {
            return;
        }

        Schema::dropIfExists('hazard_assessment_documents');
    }
};
