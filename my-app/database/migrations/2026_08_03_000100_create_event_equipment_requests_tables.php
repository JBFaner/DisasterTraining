<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('event_equipment_requests')) {
            Schema::create('event_equipment_requests', function (Blueprint $table) {
                $table->id();
                $table->foreignId('simulation_event_id')->constrained('simulation_events')->cascadeOnDelete();
                $table->foreignId('requested_by')->constrained('users')->cascadeOnDelete();
                $table->string('status', 32)->default('pending'); // pending|approved|rejected|cancelled
                $table->text('notes')->nullable();
                $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamp('reviewed_at')->nullable();
                $table->text('rejection_reason')->nullable();
                $table->timestamps();

                $table->index(['simulation_event_id', 'status']);
                $table->index(['status', 'created_at']);
            });
        }

        if (! Schema::hasTable('event_equipment_request_items')) {
            Schema::create('event_equipment_request_items', function (Blueprint $table) {
                $table->id();
                $table->foreignId('event_equipment_request_id')->constrained('event_equipment_requests')->cascadeOnDelete();
                $table->foreignId('resource_id')->constrained('resources')->cascadeOnDelete();
                $table->unsignedInteger('quantity_requested')->default(1);
                $table->unsignedInteger('quantity_approved')->default(0);
                $table->string('status', 32)->default('pending'); // pending|approved|rejected|partial
                $table->text('notes')->nullable();
                $table->timestamps();

                $table->index(['event_equipment_request_id', 'status'], 'eer_items_request_status_idx');
                $table->unique(['event_equipment_request_id', 'resource_id'], 'eer_items_request_resource_unique');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('event_equipment_request_items');
        Schema::dropIfExists('event_equipment_requests');
    }
};
