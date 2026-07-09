# DISASTER TRAINING PLATFORM — MODULE INTEGRATION FORMAT (DRAFT)

This document uses the **same naming** as the left sidebar modules so other groups can quickly map responsibilities.

> Status: **Draft / Generalized** (fields and flows may change as the system evolves)

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
- Submit a training proposal to the campaign approval workflow and scheduling pipeline.

**Data Sent (Internal)**
- Campaign Request ID
- Training Module ID
- Training Title
- Proposed Training Sessions (schedule options)
- Expected Participants
- Minimum Qualified Participants (threshold)
- Recommended Communities (hazard-aware)
- Target Audience
- Assigned Trainers (list)

**Data Received (Internal)**
- Approval Status (e.g., waiting_for_approval / approved / rejected)
- Approved Session Index / Approved Schedule
- Approval Remarks / Decision Metadata

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

### 3.1 Approved Schedule Intake (Campaign Request → Planning Workspace)
**Purpose**
- Convert an approved training campaign request into a simulation planning workspace.

**Data Received**
- Approved Schedule details (date/time/venue/capacity)
- Training Module reference
- Target Community context
- Minimum Qualified Participants threshold
- Assigned Trainers list (from campaign payload, if provided)

### 3.2 Planning Inputs (Simulation Details)
**Purpose**
- Collect planning details needed to generate a simulation event.

**Core Data Captured**
- Simulation Type (e.g., Drill / Functional Exercise / Full-Scale Exercise)
- Disaster Scenario (template/library/custom)
- Simulation Title (auto/manual; optional AI draft)
- Objectives (list; standardized prefix formatting on save)
- Trainer / Lead Coordinator (auto-fetch from assigned trainers; editable)

### 3.3 AI Draft (Optional)
**Purpose**
- Speed up planning using AI suggestions.

**AI Inputs**
- Simulation Type
- Disaster Scenario
- Campaign context (title/disaster/community)

**AI Outputs**
- Suggested Simulation Title
- Suggested Objectives list (clean text; no bullets/prefix in payload)

### 3.4 Readiness Gate (Before “Generate Simulation Event”)
**Purpose**
- Prevent generation until minimum requirements are satisfied.

**Typical Gate Checks**
- Approved schedule exists
- Simulation Type selected
- Scenario selected
- Objectives provided
- Minimum qualified participants reached
- Plan saved (latest version)

---

## 4. Participant Registration & Attendance

### 4.1 Participant Registration
**Purpose**
- Register participants in the platform and optionally associate them with campaign/event context.

**Core Data**
- Participant ID
- Name / Contact
- Community (Barangay/City)
- Registration Source (direct / campaign context)

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

### 5.2 (Optional) Event Resource Planning
**Purpose**
- Link planned resources/equipment to a simulation event for coordination.

**Data Sent / Received (Internal)**
- Event ID ↔ assigned resources list
- Status updates (reserved/in-use/returned)

### 5.3 FROM/TO External: Resource Allocation (Other Group Module)
**Purpose**
- Allow a separate “Resource Allocation” module to request, reserve, and dispatch equipment/resources using our inventory as the source of truth.

**Data Received (from Resource Allocation → to our Inventory)**
- Allocation Request ID (external reference)
- Operation / Incident / Event reference (optional; can map to Simulation Event ID if applicable)
- Requested Resources list
  - Resource Category / Type
  - Quantity
  - Priority / urgency (optional)
  - Requested time window (start/end) (optional)
- Delivery / staging location (optional)
- Requesting unit / office (optional)

**Data Sent (from our Inventory → to Resource Allocation)**
- Resource Catalog snapshot (filterable)
  - Resource ID
  - Resource Name / Category / Type
  - Current Availability Status (available / reserved / in_use / maintenance / unavailable)
  - Location / storage site (if tracked)
- Reservation / allocation results
  - Reservation ID (our reference)
  - Allocated resource items (Resource ID + quantity)
  - Reservation status (reserved / partially_reserved / rejected)
  - Reason codes (e.g., insufficient stock, maintenance, conflict)
- Status updates / lifecycle events (optional)
  - reserved → in_use → returned
  - damage report / maintenance flag

**Suggested Integration Flow (General)**
- Resource Allocation submits a request → Inventory validates availability and returns allocatable items.
- Resource Allocation confirms selection → Inventory marks as reserved for a defined window.
- During operations → Inventory receives state changes (in-use/returned/damaged) and updates availability.

---

## 6. Evaluation & Scoring System

### 6.1 Evaluation Workflow
**Purpose**
- Evaluate participant performance for a simulation event.

**Data Received**
- Simulation Event ID
- Participant list (registered/approved)
- Attendance status

**Data Produced**
- Evaluation Result records (per participant)
- Score / competency ratings
- Evaluation status (in_progress / completed)

### 6.2 Reporting Outputs
**Purpose**
- Provide performance reporting to admins and dashboards.

**Computed Data**
- Completion rate
- Score distribution summaries
- Pass/fail counts (if configured)

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

**Common Status Values (Examples)**
- Campaign Request: waiting_for_approval / approved / scheduled
- Plan: saved / generated
- Attempt: not_started / in_progress / completed
- Event: draft / published / ongoing / completed

