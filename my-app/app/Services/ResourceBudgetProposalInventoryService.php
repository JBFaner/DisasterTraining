<?php

namespace App\Services;

use App\Models\Resource;
use App\Models\ResourceBudgetProposal;
use App\Models\ResourceBudgetProposalItem;
use App\Models\ResourceMaintenanceLog;
use Illuminate\Support\Facades\DB;

class ResourceBudgetProposalInventoryService
{
    public const PENDING_STATUS = 'Pending Approval';

    public const DEFAULT_PENDING_LOCATION = 'Pending procurement';

    public const DEFAULT_ACTIVE_LOCATION = 'Main warehouse';

    /**
     * Create or mark pending inventory records when a proposal is submitted.
     */
    public function syncOnSubmit(ResourceBudgetProposal $proposal): void
    {
        $proposal->load('items');

        DB::transaction(function () use ($proposal) {
            foreach ($proposal->items as $item) {
                if ($item->resource_id) {
                    continue;
                }

                if ($this->isRestockProposal($proposal)) {
                    $this->markExistingResourcePending($proposal, $item);

                    continue;
                }

                $this->createPendingResource($proposal, $item);
            }
        });
    }

    /**
     * Activate pending inventory when a proposal is approved.
     */
    public function fulfillOnApprove(ResourceBudgetProposal $proposal): void
    {
        $proposal->load('items');

        DB::transaction(function () use ($proposal) {
            foreach ($proposal->items as $item) {
                if (! $item->resource_id) {
                    continue;
                }

                $resource = Resource::query()->lockForUpdate()->find($item->resource_id);
                if (! $resource) {
                    continue;
                }

                if ($resource->status === self::PENDING_STATUS
                    && (int) $resource->resource_budget_proposal_id === (int) $proposal->id) {
                    $this->activatePendingResource($resource, $item, $proposal);
                    continue;
                }

                if ((int) ($resource->pending_quantity ?? 0) > 0) {
                    $this->fulfillRestock($resource, $item, $proposal);
                }
            }
        });
    }

    /**
     * Remove or revert pending inventory when a proposal is rejected or reset.
     */
    public function revertOnReject(ResourceBudgetProposal $proposal): void
    {
        $proposal->load('items');

        DB::transaction(function () use ($proposal) {
            foreach ($proposal->items as $item) {
                if (! $item->resource_id) {
                    continue;
                }

                $resource = Resource::query()->lockForUpdate()->find($item->resource_id);
                if (! $resource) {
                    $item->update(['resource_id' => null]);

                    continue;
                }

                if ($resource->status === self::PENDING_STATUS
                    && (int) $resource->resource_budget_proposal_id === (int) $proposal->id) {
                    $this->deletePendingResource($resource, $proposal);
                    $item->update(['resource_id' => null]);

                    continue;
                }

                if ((int) ($resource->pending_quantity ?? 0) > 0) {
                    $this->revertRestock($resource, $item, $proposal);
                }
            }
        });
    }

    /**
     * Clear pending inventory links before a rejected proposal is edited.
     */
    public function cleanupBeforeItemResync(ResourceBudgetProposal $proposal): void
    {
        if (! in_array($proposal->status, ['draft', 'rejected'], true)) {
            return;
        }

        $this->revertOnReject($proposal);
    }

    protected function isRestockProposal(ResourceBudgetProposal $proposal): bool
    {
        return $proposal->resource_id !== null && $proposal->items->count() === 1;
    }

    protected function markExistingResourcePending(
        ResourceBudgetProposal $proposal,
        ResourceBudgetProposalItem $item
    ): void {
        $resource = Resource::query()->lockForUpdate()->find($proposal->resource_id);
        if (! $resource) {
            $this->createPendingResource($proposal, $item);

            return;
        }

        $resource->update([
            'pending_quantity' => (int) ($resource->pending_quantity ?? 0) + (int) $item->quantity,
            'updated_by' => portal_id() ?? $proposal->created_by,
        ]);

        $item->update(['resource_id' => $resource->id]);

        $this->logAction(
            $resource,
            'budget_proposal_submitted',
            "Pending restock of {$item->quantity} unit(s) from proposal {$proposal->reference_number}.",
            $proposal->created_by
        );
    }

    protected function createPendingResource(
        ResourceBudgetProposal $proposal,
        ResourceBudgetProposalItem $item
    ): Resource {
        $resource = Resource::create([
            'name' => $item->item_name,
            'category' => $item->category ?: 'Other',
            'description' => $this->buildDescription($proposal, $item),
            'quantity' => (int) $item->quantity,
            'available' => 0,
            'pending_quantity' => 0,
            'condition' => 'New',
            'status' => self::PENDING_STATUS,
            'location' => self::DEFAULT_PENDING_LOCATION,
            'resource_budget_proposal_id' => $proposal->id,
            'resource_budget_proposal_item_id' => $item->id,
            'created_by' => portal_id() ?? $proposal->created_by,
            'updated_by' => portal_id() ?? $proposal->created_by,
        ]);

        $item->update(['resource_id' => $resource->id]);

        $this->logAction(
            $resource,
            'budget_proposal_submitted',
            "Pending approval from proposal {$proposal->reference_number}.",
            $proposal->created_by
        );

        return $resource;
    }

    protected function activatePendingResource(
        Resource $resource,
        ResourceBudgetProposalItem $item,
        ResourceBudgetProposal $proposal
    ): void {
        $quantity = (int) $item->quantity;

        $resource->update([
            'status' => 'Available',
            'quantity' => $quantity,
            'available' => $quantity,
            'location' => $resource->location === self::DEFAULT_PENDING_LOCATION
                ? self::DEFAULT_ACTIVE_LOCATION
                : $resource->location,
            'updated_by' => portal_id() ?? $proposal->reviewed_by,
        ]);

        $this->logAction(
            $resource,
            'budget_proposal_approved',
            "Approved from proposal {$proposal->reference_number} and added to inventory.",
            $proposal->reviewed_by
        );
    }

    protected function fulfillRestock(
        Resource $resource,
        ResourceBudgetProposalItem $item,
        ResourceBudgetProposal $proposal
    ): void {
        $addQuantity = min((int) ($resource->pending_quantity ?? 0), (int) $item->quantity);
        if ($addQuantity <= 0) {
            return;
        }

        $resource->update([
            'quantity' => (int) $resource->quantity + $addQuantity,
            'available' => (int) $resource->available + $addQuantity,
            'pending_quantity' => max(0, (int) $resource->pending_quantity - $addQuantity),
            'updated_by' => portal_id() ?? $proposal->reviewed_by,
        ]);

        $resource->refreshStockStatus();

        $this->logAction(
            $resource,
            'budget_proposal_approved',
            "Approved restock of {$addQuantity} unit(s) from proposal {$proposal->reference_number}.",
            $proposal->reviewed_by
        );
    }

    protected function revertRestock(
        Resource $resource,
        ResourceBudgetProposalItem $item,
        ResourceBudgetProposal $proposal
    ): void {
        $removeQuantity = min((int) ($resource->pending_quantity ?? 0), (int) $item->quantity);
        if ($removeQuantity <= 0) {
            return;
        }

        $resource->update([
            'pending_quantity' => max(0, (int) $resource->pending_quantity - $removeQuantity),
            'updated_by' => portal_id() ?? $proposal->reviewed_by ?? $proposal->created_by,
        ]);

        $this->logAction(
            $resource,
            'budget_proposal_rejected',
            "Removed pending restock of {$removeQuantity} unit(s) from proposal {$proposal->reference_number}.",
            $proposal->reviewed_by ?? $proposal->created_by
        );
    }

    protected function deletePendingResource(Resource $resource, ResourceBudgetProposal $proposal): void
    {
        $this->logAction(
            $resource,
            'budget_proposal_rejected',
            "Removed pending inventory created by proposal {$proposal->reference_number}.",
            $proposal->reviewed_by ?? $proposal->created_by
        );

        $resource->delete();
    }

    protected function buildDescription(
        ResourceBudgetProposal $proposal,
        ResourceBudgetProposalItem $item
    ): string {
        $parts = ["Procurement requested via {$proposal->reference_number}."];

        if ($proposal->justification) {
            $parts[] = $proposal->justification;
        }

        if ($item->notes) {
            $parts[] = "Item notes: {$item->notes}";
        }

        return implode(' ', $parts);
    }

    protected function logAction(Resource $resource, string $action, string $notes, ?int $recordedBy): void
    {
        ResourceMaintenanceLog::create([
            'resource_id' => $resource->id,
            'action' => $action,
            'notes' => $notes,
            'recorded_by' => $recordedBy ?? portal_id(),
        ]);
    }
}
