<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('resource_budget_proposals')) {
            Schema::create('resource_budget_proposals', function (Blueprint $table) {
                $table->id();
                $table->string('reference_number')->unique();
                $table->string('title');
                $table->text('justification')->nullable();
                $table->string('justification_source')->default('general');
                $table->string('fund_source');
                $table->string('priority')->default('medium');
                $table->string('status')->default('draft');
                $table->decimal('total_estimated_cost', 14, 2)->default(0);
                $table->foreignId('resource_id')->nullable()->constrained('resources')->nullOnDelete();
                $table->unsignedBigInteger('simulation_event_id')->nullable();
                $table->unsignedBigInteger('barangay_profile_id')->nullable();
                $table->timestamp('submitted_at')->nullable();
                $table->timestamp('reviewed_at')->nullable();
                $table->text('review_notes')->nullable();
                $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
                $table->unsignedBigInteger('reviewed_by')->nullable();
                $table->timestamps();
            });
        }

        Schema::table('resource_budget_proposals', function (Blueprint $table) {
            if (! $this->foreignKeyExists('resource_budget_proposals', 'rbp_simulation_event_fk')) {
                $table->foreign('simulation_event_id', 'rbp_simulation_event_fk')
                    ->references('id')
                    ->on('simulation_events')
                    ->nullOnDelete();
            }

            if (! $this->foreignKeyExists('resource_budget_proposals', 'rbp_barangay_profile_fk')) {
                $table->foreign('barangay_profile_id', 'rbp_barangay_profile_fk')
                    ->references('id')
                    ->on('barangay_profiles')
                    ->nullOnDelete();
            }

            if (! $this->foreignKeyExists('resource_budget_proposals', 'rbp_reviewed_by_fk')) {
                $table->foreign('reviewed_by', 'rbp_reviewed_by_fk')
                    ->references('id')
                    ->on('users')
                    ->nullOnDelete();
            }
        });

        if (! Schema::hasTable('resource_budget_proposal_items')) {
            Schema::create('resource_budget_proposal_items', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('resource_budget_proposal_id');
                $table->string('item_name');
                $table->string('category')->nullable();
                $table->unsignedInteger('quantity')->default(1);
                $table->decimal('unit_cost', 12, 2)->default(0);
                $table->decimal('total_cost', 14, 2)->default(0);
                $table->text('notes')->nullable();
                $table->timestamps();

                $table->foreign('resource_budget_proposal_id', 'rbp_items_proposal_fk')
                    ->references('id')
                    ->on('resource_budget_proposals')
                    ->cascadeOnDelete();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('resource_budget_proposal_items');
        Schema::dropIfExists('resource_budget_proposals');
    }

    private function foreignKeyExists(string $table, string $name): bool
    {
        $connection = Schema::getConnection();
        $database = $connection->getDatabaseName();

        $result = $connection->select(
            'SELECT CONSTRAINT_NAME FROM information_schema.TABLE_CONSTRAINTS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND CONSTRAINT_NAME = ? AND CONSTRAINT_TYPE = ? LIMIT 1',
            [$database, $table, $name, 'FOREIGN KEY']
        );

        return count($result) > 0;
    }
};
