<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('resource_budget_proposal_items')) {
            Schema::table('resource_budget_proposal_items', function (Blueprint $table) {
                if (! Schema::hasColumn('resource_budget_proposal_items', 'resource_id')) {
                    $table->unsignedBigInteger('resource_id')->nullable()->after('notes');
                    $table->foreign('resource_id', 'rbp_items_resource_fk')
                        ->references('id')
                        ->on('resources')
                        ->nullOnDelete();
                }
            });
        }

        if (Schema::hasTable('resources')) {
            Schema::table('resources', function (Blueprint $table) {
                if (! Schema::hasColumn('resources', 'pending_quantity')) {
                    $table->unsignedInteger('pending_quantity')->default(0)->after('needs_repair_quantity');
                }
                if (! Schema::hasColumn('resources', 'resource_budget_proposal_id')) {
                    $table->unsignedBigInteger('resource_budget_proposal_id')->nullable()->after('updated_by');
                    $table->foreign('resource_budget_proposal_id', 'resources_rbp_fk')
                        ->references('id')
                        ->on('resource_budget_proposals')
                        ->nullOnDelete();
                }
                if (! Schema::hasColumn('resources', 'resource_budget_proposal_item_id')) {
                    $table->unsignedBigInteger('resource_budget_proposal_item_id')->nullable()->after('resource_budget_proposal_id');
                    $table->foreign('resource_budget_proposal_item_id', 'resources_rbp_item_fk')
                        ->references('id')
                        ->on('resource_budget_proposal_items')
                        ->nullOnDelete();
                }
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('resources')) {
            Schema::table('resources', function (Blueprint $table) {
                if (Schema::hasColumn('resources', 'resource_budget_proposal_item_id')) {
                    $table->dropForeign('resources_rbp_item_fk');
                    $table->dropColumn('resource_budget_proposal_item_id');
                }
                if (Schema::hasColumn('resources', 'resource_budget_proposal_id')) {
                    $table->dropForeign('resources_rbp_fk');
                    $table->dropColumn('resource_budget_proposal_id');
                }
                if (Schema::hasColumn('resources', 'pending_quantity')) {
                    $table->dropColumn('pending_quantity');
                }
            });
        }

        if (Schema::hasTable('resource_budget_proposal_items')) {
            Schema::table('resource_budget_proposal_items', function (Blueprint $table) {
                if (Schema::hasColumn('resource_budget_proposal_items', 'resource_id')) {
                    $table->dropForeign('rbp_items_resource_fk');
                    $table->dropColumn('resource_id');
                }
            });
        }
    }
};
