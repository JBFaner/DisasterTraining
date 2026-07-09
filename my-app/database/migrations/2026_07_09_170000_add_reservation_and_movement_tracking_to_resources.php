<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('resources')) {
            Schema::table('resources', function (Blueprint $table) {
                if (! Schema::hasColumn('resources', 'reserved_quantity')) {
                    $table->unsignedInteger('reserved_quantity')->default(0)->after('available');
                }
                if (! Schema::hasColumn('resources', 'in_use_quantity')) {
                    $table->unsignedInteger('in_use_quantity')->default(0)->after('reserved_quantity');
                }
                if (! Schema::hasColumn('resources', 'needs_repair_quantity')) {
                    $table->unsignedInteger('needs_repair_quantity')->default(0)->after('in_use_quantity');
                }
            });
        }

        if (! Schema::hasTable('resource_movements')) {
            Schema::create('resource_movements', function (Blueprint $table) {
                $table->id();
                $table->foreignId('resource_id')->constrained('resources')->cascadeOnDelete();
                $table->foreignId('simulation_event_id')->nullable()->constrained('simulation_events')->nullOnDelete();
                $table->string('requested_by')->nullable();
                $table->string('source_module')->default('Resource Allocation');
                $table->unsignedInteger('quantity')->default(0);
                $table->string('status'); // Reserved, In Use, Returned, Needs Repair
                $table->text('notes')->nullable();
                $table->timestamps();

                $table->index(['resource_id', 'created_at']);
                $table->index(['simulation_event_id', 'created_at']);
                $table->index(['status', 'created_at']);
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('resource_movements')) {
            Schema::dropIfExists('resource_movements');
        }

        if (Schema::hasTable('resources')) {
            Schema::table('resources', function (Blueprint $table) {
                $drop = [];
                foreach (['reserved_quantity', 'in_use_quantity', 'needs_repair_quantity'] as $column) {
                    if (Schema::hasColumn('resources', $column)) {
                        $drop[] = $column;
                    }
                }
                if ($drop !== []) {
                    $table->dropColumn($drop);
                }
            });
        }
    }
};

