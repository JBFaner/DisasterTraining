# DT-only approve callback (Campaign server patch)

Applied on Hostinger: `/var/www/html/safety_campaign_alertaraqc`

## Files touched
- `src/Services/DisasterTrainingNotifyService.php` (new)
- `src/Controllers/CampaignController.php` (store meta + notify on status→approved)
- `src/Controllers/AiRecommendationPlanningController.php` (notify after accept, DT-meta only)

## Backup
- `_backups_dt_callback_20260825_155226/`

## Behavior
- Only campaigns with `materials_json._disaster_training.source_system = disaster-training` call DT.
- Soft-fail: Campaign approve/accept never blocked by DT errors.
- Uses `.env` `DISASTER_TRAINING_API_*`.

## Verified
- Non-DT notify (#76): no callback log.
- DT-linked #77 → PATCH DT #34 → HTTP 200 approved.
