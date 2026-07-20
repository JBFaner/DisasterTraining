# Partner API — Training Intelligence → Campaign Approval (v1)

Handoff document for external Campaign Planning & Scheduling teams.

**Scope:** Pull submitted Training Intelligence (campaign requests) from this app, then approve or reject them. No other Operations modules.

**Internal flow (our side):** LGU Admin publishes a training module → fills Training Intelligence → submits to Campaign Planning → status `waiting_for_approval`.

**Your flow (partner side):** List / show pending requests → approve or reject via API.

---

## Base URL

```
{APP_URL}/api/integrations/campaign-planning
```

Legacy alias (same behavior, same auth):

```
{APP_URL}/api/integrations/group6
```

Prefer the `campaign-planning` prefix in new integrations.

---

## Authentication

| Item | Value |
|------|--------|
| Header | `X-Group6-Api-Key: {shared_secret}` |
| Alternative | `Authorization: Bearer {shared_secret}` |
| Server env | `GROUP6_INBOUND_API_KEY` |
| Feature flag | `GROUP6_INTEGRATION_ENABLED=true` |

If the feature flag is off, endpoints return **503**.  
If the API key is missing/wrong, endpoints return **401**.  
If the inbound key is not configured on the server, endpoints return **503**.

---

## How to enable (local / production)

1. Set in `.env`:

```env
GROUP6_INTEGRATION_ENABLED=true
GROUP6_INBOUND_API_KEY=replace-with-a-long-random-secret
GROUP6_INBOUND_API_HEADER=X-Group6-Api-Key
```

2. Share **only** the API key and base URL with the partner team (never commit real keys).
3. Confirm with a list call (see curl below). You should get `200` + JSON, not `401`/`503`.

---

## Status machine

```
waiting_for_approval  →  approved
waiting_for_approval  →  rejected
```

- Only requests in `waiting_for_approval` can be updated via `PATCH .../status`.
- After `approved`, our app activates the registration link when capacity and registration window allow.
- Later internal statuses (e.g. `scheduled`) are owned by Simulation Event Planning and are **out of scope** for this partner API.

---

## Endpoints

### 1. List campaign requests

`GET /api/integrations/campaign-planning/campaign-requests`

Query (optional):

| Param | Values |
|-------|--------|
| `status` | `waiting_for_approval` \| `approved` \| `rejected` |

**curl**

```bash
curl -sS -H "X-Group6-Api-Key: YOUR_KEY" \
  -H "Accept: application/json" \
  "{APP_URL}/api/integrations/campaign-planning/campaign-requests?status=waiting_for_approval"
```

**Sample response**

```json
{
  "success": true,
  "campaign_requests": [
    {
      "campaign_request_id": 12,
      "status": "waiting_for_approval",
      "submitted_to": "Public Safety Campaign Management System",
      "submitted_at": "2026-07-16T18:00:00+08:00",
      "campaign_planning": {
        "training_module_id": 5,
        "training_title": "Fire Safety and Emergency Response",
        "short_description": "…",
        "recommended_communities": {},
        "target_audience": ["Barangay responders"],
        "registration_opens": "2026-07-01T00:00:00+08:00",
        "registration_deadline": "2026-07-31T23:59:59+08:00",
        "training_completion_deadline": "2026-08-15T23:59:59+08:00",
        "expected_participants": 50,
        "maximum_participants": 100,
        "published_status": "published",
        "registration_form_path": "/campaigns/…/register",
        "registered_participants_count": 0,
        "registration_enabled": true,
        "registration_link_active": false,
        "registration_link": null
      },
      "legacy": {
        "proposed_session_label": null,
        "expected_participants": 50,
        "minimum_qualified_participants": null
      },
      "submitted_by": {
        "id": 3,
        "name": "JB"
      }
    }
  ]
}
```

---

### 2. Show one campaign request

`GET /api/integrations/campaign-planning/campaign-requests/{id}`

**curl**

```bash
curl -sS -H "X-Group6-Api-Key: YOUR_KEY" \
  -H "Accept: application/json" \
  "{APP_URL}/api/integrations/campaign-planning/campaign-requests/12"
```

**Sample response**

```json
{
  "success": true,
  "campaign_request": {
    "campaign_request_id": 12,
    "status": "waiting_for_approval",
    "submitted_at": "2026-07-16T18:00:00+08:00",
    "campaign_planning": { }
  }
}
```

---

### 3. Approve or reject

`PATCH /api/integrations/campaign-planning/campaign-requests/{id}/status`

**Body**

```json
{
  "status": "approved",
  "note": "Optional reviewer note"
}
```

`status` must be `approved` or `rejected`.

**curl (approve)**

```bash
curl -sS -X PATCH \
  -H "X-Group6-Api-Key: YOUR_KEY" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -d "{\"status\":\"approved\",\"note\":\"Approved for July batch\"}" \
  "{APP_URL}/api/integrations/campaign-planning/campaign-requests/12/status"
```

**curl (reject)**

```bash
curl -sS -X PATCH \
  -H "X-Group6-Api-Key: YOUR_KEY" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -d "{\"status\":\"rejected\",\"note\":\"Incomplete community targeting\"}" \
  "{APP_URL}/api/integrations/campaign-planning/campaign-requests/12/status"
```

**Sample success**

```json
{
  "success": true,
  "message": "Campaign request approved. Registration link is now active.",
  "campaign_request": {
    "campaign_request_id": 12,
    "status": "approved",
    "campaign_planning": {
      "registration_link_active": true,
      "registration_link": "https://example.com/campaigns/…/register"
    }
  }
}
```

**Sample error (already decided)**

```json
{
  "success": false,
  "message": "Only campaign requests waiting for approval can be updated.",
  "current_status": "approved"
}
```

HTTP status: **422**

---

## `campaign_planning` field meanings

| Field | Meaning |
|-------|---------|
| `training_module_id` / `training_title` / `short_description` | Module identity from Training Intelligence |
| `recommended_communities` | Hazard-aware community recommendations |
| `target_audience` | Audience labels from the module |
| `registration_opens` / `registration_deadline` | Registration window (ISO-8601) |
| `training_completion_deadline` | Expected completion deadline |
| `expected_participants` / `maximum_participants` | Capacity planning |
| `published_status` | Module publish state at submit time |
| `registered_participants_count` | Live count tied to this campaign |
| `registration_enabled` | `true` when under capacity (or no max set) |
| `registration_link_active` | `true` only when **approved** + under capacity + within registration window |
| `registration_link` | Absolute URL when active; otherwise `null` |
| `registration_form_path` | Path portion of the registration URL |

**Not included:** full lesson content, quiz banks, trainer directories, session schedules.

---

## Smoke checklist for partners

1. `GET .../campaign-requests?status=waiting_for_approval` → `200`
2. `GET .../campaign-requests/{id}` → `200` with matching `campaign_request_id`
3. `PATCH .../status` with `approved` → `200`, status becomes `approved`
4. Re-call list with `?status=approved` → request appears
5. Second `PATCH` on same id → `422`

---

## Implementation references (our repo)

- Controller: `app/Http/Controllers/Api/Group6CampaignPlanningController.php`
- Payload DTO: `app/Support/CampaignPlanningPayload.php`
- Routes: `routes/api.php` (`campaign-planning` + legacy `group6`)
- Auth middleware: `app/Http/Middleware/VerifyGroup6ApiKey.php`
- Config: `config/group6.php`
