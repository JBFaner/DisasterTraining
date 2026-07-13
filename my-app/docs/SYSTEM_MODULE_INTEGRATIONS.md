# DISASTER TRAINING PLATFORM — MODULE INTEGRATION FORMAT (DRAFT)

This document uses the **same naming** as the left sidebar modules so other groups can quickly map responsibilities.

> Status: **Living document** — Campaign Planning (Group 6) and Simulation Event Planning integrations are implemented; other sections remain generalized.

---

## 1. Training Module Management

### 1.1 Training Module Authoring
**Purpose**
- Create and maintain training modules, lessons, learning objectives, and learning resources.

**Core Data (Owned)**
- Training Module ID
- Title / Description / Category (Hazard)
- Learning Objectives (list)
- Lessons / Contents (ordered)
- Learning Resources (PDF/text/image/video links)
- Target Audience (selected / recommended)
- Proposed Training Sessions (date, start/end time, venue/platform, capacity)
- Assigned / Recommended Trainers (directory references)

### 1.2 Campaign Request Submission (Training → Campaign Request)
**Purpose**
- Submit a published training module to the campaign approval workflow. The outbound payload is **announcement/registration intelligence only** — trainers, lesson lists, and session schedules are **not** sent to Group 6.

**Data Sent (Internal → stored on `campaign_requests.payload`)**
- Campaign Request ID
- Training Module ID
- Training Title / Short Description
- Recommended Communities (hazard-aware)
- Target Audience
- Registration Opens / Registration Deadline / Training Completion Deadline
- Expected Participants / Maximum Participants
- Published Status
- `registration_enabled` (computed: registered count less than maximum)
- Registration Link (generated when applicable)

**Data Received (Internal)**
- Approval Status: `waiting_for_approval` → `approved` | `rejected` → `scheduled` (after simulation event generated)
- Approval Remarks / Decision Metadata (`approved_at`, reviewer note)

**Registration Link Rules**
- `registration_link_active` = `true` only when `status === approved` **and** capacity is not full.
- Copy Link on the training module UI is disabled when the link is inactive.
- Participant registration page rejects unapproved or invalid campaign context.

**Implementation**
- Payload DTO: `app/Support/CampaignPlanningPayload.php`
- Link helper: `app/Support/CampaignRegistrationLink.php`
- Participants are tied to a campaign via `registration_campaign_id = campaign-request:{id}`.

### 1.3 FROM/TO External: Campaign Planning & Scheduling (Group 6)
**Purpose**
- Group 6 pulls submitted campaign requests from this app, approves/rejects them, and uses registration metadata for their scheduling workflow.

**Auth**
- Header: `X-Group6-Api-Key: {GROUP6_INBOUND_API_KEY}`
- Base URL: `{APP_URL}/api/integrations/group6`
- Feature flag: `GROUP6_INTEGRATION_ENABLED=true`

**Endpoints (Group 6 → our app)**
| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/campaign-requests` | List requests. Optional `?status=waiting_for_approval\|approved\|rejected` |
| `GET` | `/campaign-requests/{id}` | Single request with `campaign_planning` payload |
| `PATCH` | `/campaign-requests/{id}/status` | Approve/reject. Body: `{ "status": "approved"\|"rejected", "note": "optional" }` |

**`campaign_planning` payload fields (outbound)**
- `training_module_id`, `training_title`, `short_description`
- `recommended_communities`, `target_audience`
- `registration_opens`, `registration_deadline`, `training_completion_deadline`
- `expected_participants`, `maximum_participants`
- `published_status`, `registered_participants_count`
- `registration_enabled`, `registration_link_active`, `registration_link`
- `registration_form_path` (e.g. `/participant/register`)

Legacy trainer/session fields are omitted from the main payload; original request metadata may appear under `response.legacy`.

**Controller:** `app/Http/Controllers/Api/Group6CampaignPlanningController.php`

### 1.4 Admin Endpoints (Training Module Management)
**Purpose**
- Internal admin/trainer routes for authoring training modules, lessons, resources, and submitting campaign requests. Used by the React admin UI.

**Auth**
- Laravel session (`auth.portal` + `portal.admin` middleware)
- Roles: `LGU_ADMIN`, `LGU_TRAINER`
- Base URL: `{APP_URL}/admin`
- Mutating requests require CSRF token (`X-CSRF-TOKEN` or `_token`)
- Send `Accept: application/json` (or `X-Requested-With: XMLHttpRequest`) to receive JSON instead of HTML redirects

**Controller:** `app/Http/Controllers/Admin/TrainingModuleController.php`

#### Training Modules

| Method | Path | Description | JSON response |
|--------|------|-------------|---------------|
| `GET` | `/training-modules` | List modules (paginated). Query: `?search=&status=&category=` | `{ modules, pagination }` |
| `GET` | `/training-modules/create` | Create form shell (HTML) | — |
| `POST` | `/training-modules` | Create draft module | Redirect (HTML) |
| `GET` | `/training-modules/{id}` | Module detail with lessons/resources (HTML) | — |
| `GET` | `/training-modules/{id}/edit` | Edit form shell (HTML) | — |
| `PUT` | `/training-modules/{id}` | Update module metadata, campaign fields, sessions | `{ success, message }` |
| `POST` | `/training-modules/{id}/publish` | Publish module (requires title, category, difficulty, ≥1 lesson) | `{ success, message }` or `422` with `errors` |
| `POST` | `/training-modules/{id}/archive` | Archive module | Redirect |
| `DELETE` | `/training-modules/{id}` | Delete module (blocked if published) | `{ message }` or `422` |
| `POST` | `/training-modules/generate-ai` | AI draft from title. Body: `{ title, difficulty?, category? }` | `{ success, data }` |

**Key module fields (create/update)**
- `title`, `short_description`, `description`, `learning_objectives[]`
- `category`, `related_hazard`, `difficulty`, `delivery_method`
- `target_audience[]`, `lead_qualified_trainer_id`, `assigned_qualified_trainer_ids[]`
- `available_training_sessions[]` (date, start/end time, venue/platform, capacity)
- Campaign planning (update): `campaign_registration_opens`, `campaign_registration_deadline`, `campaign_training_completion_deadline`, `campaign_expected_participants`, `campaign_maximum_participants`
- `status`, `visibility`, `thumbnail` (file upload)

#### Lessons (Contents)

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/training-modules/{id}/contents` | Add lesson (+ text body, file uploads) |
| `PUT` | `/training-modules/{id}/contents/{content_id}` | Update lesson |
| `POST` | `/training-modules/{id}/contents/{content_id}/update` | Update lesson (POST fallback for multipart) |
| `DELETE` | `/training-modules/{id}/contents/{content_id}` | Delete lesson |
| `POST` | `/training-modules/{id}/contents/{content_id}/delete` | Delete lesson (POST fallback) |
| `POST` | `/training-modules/{id}/contents/reorder` | Reorder lessons. Body: `{ order: [content_id, ...] }` → `{ success, message }` |

**Lesson fields:** `title`, `description`, `learning_objectives[]`, `content_body` (rich text), file attachments (`attachments[]`)

#### Learning Resources (per lesson)

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/training-modules/{id}/contents/{content_id}/resources` | Add resource (PDF, image, video link, text) |
| `PUT` | `/training-modules/{id}/contents/{content_id}/resources/{resource_id}` | Update resource |
| `DELETE` | `/training-modules/{id}/contents/{content_id}/resources/{resource_id}` | Delete resource |
| `POST` | `/training-modules/{id}/contents/{content_id}/resources/{resource_id}/delete` | Delete resource (POST fallback) |
| `POST` | `/training-modules/{id}/contents/{content_id}/resources/reorder` | Reorder resources → `{ success, message }` |
| `POST` | `/training-modules/{id}/contents/{content_id}/resources/{resource_id}/reprocess` | Re-run text extraction on resource |

#### Campaign Requests (nested under training module)

**Controller:** `app/Http/Controllers/Admin/CampaignRequestController.php`

| Method | Path | Description | JSON response |
|--------|------|-------------|---------------|
| `GET` | `/training-modules/{id}/campaign-requests` | List campaign requests for module | `{ requests: [...] }` |
| `POST` | `/training-modules/{id}/campaign-requests` | Submit to Campaign Planning (module must be `published`) | `{ success, campaign_request: { id, status, registration_link } }` |
| `GET` | `/campaign-requests/{id}` | Campaign request detail | `{ request }` (JSON) or HTML page |

**Campaign request object includes:** `id`, `status`, `payload`, `campaign_planning`, `registration_link_active`, `registration_link`, `submitted_at`, `submitted_by`

### 1.5 Participant Endpoints (Training Consumption)
**Purpose**
- Self-paced training access for registered participants.

**Auth:** Session (`auth.portal` + `portal.participant`). Base URL: `{APP_URL}/participant`

**Controller:** `app/Http/Controllers/Participant/TrainingModuleController.php`

| Method | Path | Description | JSON response |
|--------|------|-------------|---------------|
| `GET` | `/training-modules` | List published modules. Query: `?search=&category=` | `{ modules, pagination }` |
| `GET` | `/training-modules/{id}` | Module detail with lessons (published only) | HTML or JSON |
| `POST` | `/training-modules/{id}/contents/{content_id}/completion` | Toggle lesson completion | JSON |
| `POST` | `/training-modules/{id}/lessons/{content_id}/completion` | Toggle lesson completion (alias) | JSON |

**Legacy redirects:** `/training-modules/*` (no portal prefix) redirect to the correct admin or participant URL based on role.

---

## 2. AI Scenario Training

### 2.1 AI Scenario Generation & Delivery
**Purpose**
- Provide AI-assisted scenario-based training and/or assessments aligned to the training module.

**Data Consumed**
- Training Module context (title, objectives, lesson content/resources)
- Difficulty setting / language preferences
- Participant identity and training cycle context

**Data Produced**
- AI Scenario Attempt ID
- Scenario narrative + questions
- Attempt Status (not_started / in_progress / completed)
- Scores / pass-fail (if assessment mode)
- Completion timestamps & progress checkpoints

### 2.2 Training Progress Contribution
**Purpose**
- Feed participant readiness calculations used by planning and reporting.

**Data Sent (Internal, Computed)**
- Participant training status derived from attempts (Not Started / In Progress / Completed)
- Qualified-for-simulation flag (rule-based)

---

## 3. Simulation Event Planning

> **No manual campaign creation.** The Approved Campaigns list imports only `status = approved` campaign requests from Campaign Planning.

### 3.1 Approved Campaign Intake (Campaign Request → Planning Workspace)
**Purpose**
- Convert an approved campaign request into a simulation planning workspace.

**Import contract** (`app/Support/SimulationPlanningCampaignImport.php`)

| Field | Description |
|-------|-------------|
| `campaign_id` / `campaign_request_id` | Campaign Request ID |
| `campaign_title` | Campaign/training title |
| `training_module_id` / `training_title` | Linked self-paced training module |
| `recommended_community` | Primary barangay from hazard recommendation |
| `target_audience` / `target_audience_label` | Audience tags |
| `expected_participants` | Campaign capacity target |
| `minimum_qualified_participants` | Threshold (stored or default 67% of expected) |
| `registration_deadline` | ISO datetime |
| `campaign_status` | Always `Approved` for imported rows |
| `approved_at` | Approval timestamp |
| `disaster_type` | Hazard/category from training module |
| `simulation_plan_status` | `Not Yet Created` / `Saved` / `Generated` |
| `simulation_event_id` | Set after event generation |

**Admin UI**
- List: `/admin/simulation-events` → tab **Approved Campaigns**
- Workspace: `/admin/simulation-planning/{campaign_request_id}`

### 3.2 Training Summary (Participant Readiness)
**Purpose**
- Count only participants registered under this campaign (`registration_campaign_id = campaign-request:{id}`).

**Per-participant training status** (`SimulationEventPlanningService::resolveModuleTrainingStatus`)
| Status | Rule |
|--------|------|
| **Not Started** | No lesson completions and no completed AI scenario |
| **In Progress** | Some progress but not yet qualified |
| **Completed (Qualified)** | AI scenario completed **OR** all lessons done **OR** ≥ 3 lessons completed |

**Summary counts**
- `registered_participants`
- `not_started` / `in_progress` / `completed`
- `qualified_for_simulation` (= completed count)

**API:** `GET /admin/simulation-planning/{id}/training-summary` (admin, authenticated)

### 3.3 Planning Inputs (Simulation Details)
**Purpose**
- Collect details needed to generate a simulation event. Event **date, start/end time, and venue** are set on the plan at generation time (not imported from campaign sessions).

**Core Data Captured**
- Simulation Type (`exercise_type`: Drill / Functional Exercise / Full-Scale Exercise)
- Disaster Scenario (`simulation_scenario`)
- Simulation Title (`simulation_title`; optional AI draft)
- Objectives (`simulation_objectives`; standardized prefix formatting on save)
- Event Date / Start Time / End Time / Venue (on `simulation_plans`)
- Equipment / resource selections (if enabled)

### 3.4 AI Draft (Optional)
**Purpose**
- Speed up planning using AI suggestions.

**AI Inputs:** Simulation Type, Disaster Scenario, campaign context (title/disaster/community)

**AI Outputs:** Suggested Simulation Title, Suggested Objectives list

### 3.5 Readiness Gate (Before “Generate Simulation Event”)
**Purpose**
- Prevent generation until business rules and plan fields are satisfied.

**Gate checks**
| Check | Requirement |
|-------|-------------|
| Approved Campaign | `campaign_status === Approved` |
| Registration Deadline Passed | Current time is after `registration_deadline` |
| Training Available | Linked training module exists |
| Simulation Type | Selected |
| Disaster Type | Present on plan |
| Objectives | Present on plan |
| Minimum Qualified Participants | `qualified_for_simulation` ≥ `minimum_qualified_participants` |
| Plan Saved | Simulation plan record exists |

**Validation messages (examples)**
- *"Registration is still open. Simulation planning will be available after the registration deadline."*
- *"Only X qualified participants. A minimum of Y qualified participants is required."*

**Generate button** is disabled until `readiness.is_ready === true`.

**After generation:** campaign request status moves to `scheduled`; `simulation_event_id` is linked.

### 3.6 FROM/TO External: Simulation Planning API (Group 6)
**Purpose**
- Allow Group 6 (or other consumers) to read approved campaigns and training readiness without using the admin UI.

**Auth:** Same as §1.3 (`X-Group6-Api-Key`)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/simulation-planning/approved-campaigns` | All approved campaigns (import contract) |
| `GET` | `/simulation-planning/approved-campaigns/{id}` | Single campaign + workspace metadata |
| `GET` | `/simulation-planning/approved-campaigns/{id}/training-summary` | Training summary + readiness checklist |

**Controller:** `app/Http/Controllers/Api/Group6SimulationPlanningController.php`

**Service:** `app/Services/SimulationEventPlanningService.php`

---

## 4. Participant Registration & Attendance

### 4.1 Participant Registration
**Purpose**
- Register participants in the platform and associate them with an approved campaign when registering via campaign link.

**Core Data**
- Participant ID
- Name / Contact
- Community (Barangay/City)
- Registration Source (`registration_campaign_id`, e.g. `campaign-request:6`)

**Campaign context rules**
- Registration link is active only for **approved** campaigns with available capacity.
- Unapproved or full campaigns are blocked at registration time.

### 4.2 Attendance Tracking (Simulation Events)
**Purpose**
- Record attendance status for simulation events.

**Data Captured**
- Event Registration ID
- Attendance status (present/late/etc.)
- Check-in method (manual/QR/etc.)
- Check-in timestamps

---

## 5. Resource & Equipment Inventory

### 5.1 Inventory Catalog
**Purpose**
- Manage available equipment/resources for disaster operations and training events.

**Core Data**
- Resource ID / Category / Status
- Availability / usage tracking
- Assignment to events (if enabled)

### 5.2 Event Resource Planning
**Purpose**
- Link planned resources/equipment to a simulation event for coordination.

**Data Sent / Received (Internal)**
- Event ID ↔ assigned resources list
- Status updates (reserved/in-use/returned)

### 5.3 FROM/TO External: Resource Allocation (Group 3)
**Purpose**
- Provide equipment availability information for emergency response operations.
- Keep `Resource & Equipment Inventory` as the source of truth for stock validation, reservation, and lifecycle status.
- Support two request paths:
  - **Direct path (internal):** Simulation Event Planning requests resources directly from Inventory.
  - **External path (cross-group):** Other groups request via `Resource Allocation (Group 3)`, which then coordinates with Inventory.

**Data Received (from Resource Allocation → to our Inventory)**
- Resource Request ID
- Requested Equipment
- Requested Quantity
- Emergency Operation ID

**Data Sent (from our Inventory → to Resource Allocation)**
- Equipment ID
- Equipment Name
- Available Quantity
- Equipment Condition
- Availability Status
- Storage Location

**Purpose of Integration**
- Allow the Emergency Response System to verify available equipment before deploying emergency response units during actual incidents.

**Suggested Integration Flow (General)**
- **Simulation request (internal):** Simulation module sends equipment need directly to Inventory → Inventory validates and reserves if available.
- **External group request:** External group sends request to Resource Allocation (Group 3) → Group 3 calls Inventory for availability check and reservation.
- Inventory returns allocation outcome (`reserved` or `insufficient inventory available`) and keeps movement history for audit/reporting.
- On return, Inventory updates stock buckets and status (`Available` or `Needs Repair`) based on returned condition.

---

## 6. Evaluation & Scoring System

### 6.1 Evaluation Workflow
**Purpose**
- Evaluate participant performance for completed simulation events and generate post-event performance summaries.

**Data Received**
- Simulation Event ID
- Event Title
- Simulation Type
- Disaster Scenario
- Event Date
- Venue
- Participant list
- Attendance status
- Event completion status

**Data Produced**
- Evaluation Result records (per participant)
- Score / competency ratings
- Evaluation status (in_progress / completed)

**Business Rules**
- Only simulation events marked `completed` can appear in the evaluation list.
- Only participants with attendance status `present` can receive evaluation scores.
- Evaluation completion is only allowed when all present participants have been evaluated.
- Event performance metrics are computed after participant evaluations are submitted.

### 6.2 Reporting Outputs
**Purpose**
- Provide performance reporting to admins and dashboards.

**Computed Data**
- Average score
- Highest score
- Lowest score
- Passing rate
- Number passed
- Number failed
- Evaluation completion percentage
- Overall performance classification

### 6.3 FROM/TO Internal: Simulation Event Planning / Simulation Events
**Purpose**
- Use completed simulation events as the evaluation source of truth.

**Data Received**
- Simulation Event ID
- Event Title
- Simulation Type
- Disaster Scenario
- Event Date
- Venue
- Participant List
- Attendance Status
- Event Completion Status

**Purpose of Integration**
- Ensure that evaluation only starts after a simulation event has been completed and participant attendance has already been finalized.

### 6.4 FROM/TO External: Event & Seminar Management (Group 6)
**Purpose**
- Prepare completed evaluation summaries for event reporting and seminar effectiveness analysis.

**Data Sent**
- Event ID
- Evaluation ID
- Average Evaluation Score
- Passing Rate
- Evaluation Completion Status
- Overall Performance
- Participant Performance Summary

**Integration Approach**
- The Evaluation & Scoring System prepares the outbound payload locally once the evaluation is completed.
- Group 6 integration can read the prepared payload later without requiring immediate direct push.

---

## 7. Certification Issuance

### 7.1 Certificate Generation
**Purpose**
- Issue certificates to participants who meet requirements.

**Data Received**
- Training Module reference
- Participant identity
- Evaluation/Completion criteria

**Data Produced**
- Certificate ID
- QR verification token (if enabled)
- Issue timestamp / status (issued/revoked)

---

## 8. Cross-Module Shared Concepts (General)

**Common IDs**
- Training Module ID
- Campaign Request ID
- Simulation Plan ID
- Simulation Event ID
- Participant/User ID
- Registration Campaign Key: `campaign-request:{campaign_request_id}`

**Common Status Values (Examples)**
- Campaign Request: `waiting_for_approval` / `approved` / `rejected` / `scheduled`
- Plan: `not_created` / `saved` / `generated`
- Training (per participant): `Not Started` / `In Progress` / `Completed`
- AI Attempt: `not_started` / `in_progress` / `completed`
- Event: `draft` / `published` / `ongoing` / `completed`

---

## 9. Group 6 Environment Variables

| Variable | Purpose |
|----------|---------|
| `GROUP6_INTEGRATION_ENABLED` | Master switch for inbound Group 6 APIs |
| `GROUP6_INBOUND_API_KEY` | Shared secret for `X-Group6-Api-Key` header |
| `GROUP6_INBOUND_API_HEADER` | Header name (default: `X-Group6-Api-Key`) |
| `GROUP6_API_BASE_URL` | Outbound Group 6 base URL (when we call them) |
| `GROUP6_API_KEY` | Outbound API key |
| `GROUP6_API_TIMEOUT` | HTTP timeout (seconds) |

See `env.template` for inline endpoint documentation.

---

## 10. Simulation Planning Test Seeders

Use these seeders to populate **Approved Campaigns** scenarios for QA and demos. Requires at least one **published** training module with lessons (`TrainingModuleSeeder`).

**Run all test campaigns:**
```bash
php artisan db:seed --class=SimulationPlanningTestDataSeeder
```

| Seeder | Purpose |
|--------|---------|
| `SimulationPlanningReadyCampaignSeeder` | Approved, registration deadline **passed**, quota **met** — ready to generate |
| `SimulationPlanningUnderQuotaCampaignsSeeder` | **3** approved campaigns that **fail** the qualified threshold |
| `SimulationPlanningBlockedCampaignSeeder` | Single blocked scenario (open registration + under quota) |
| `SimulationPlanningQuotaTestSeeder` | Legacy quota test with past deadline |

**Ready campaign** (`SEEDER: Simulation Planning Ready Test`)
- Expected 25, minimum qualified 17 (67%)
- 21 Completed, 3 In Progress, 2 Not Started
- Emails: `sim-ready.{bucket}.{n}@example.com`

**Under-quota campaigns** (3 examples)

| Label | Scenario |
|-------|----------|
| `SEEDER: Under Quota - Registration Open` | Approved, deadline **+7 days**, 4 qualified / 15 min |
| `SEEDER: Under Quota - Low Completion` | Approved, deadline **passed**, 6 qualified / 18 min |
| `SEEDER: Under Quota - Almost Ready` | Approved, deadline **passed**, 13 qualified / 15 min (2 short) |

Emails: `sim-underquota.{slug}.{bucket}.{n}@example.com`

**Test password for all seeded participants:** `password`

Seeders are idempotent-friendly: re-running updates the same labelled test campaigns rather than duplicating them.

