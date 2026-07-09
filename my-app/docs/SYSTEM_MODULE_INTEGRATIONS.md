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

**Common Status Values (Examples)**
- Campaign Request: waiting_for_approval / approved / scheduled
- Plan: saved / generated
- Attempt: not_started / in_progress / completed
- Event: draft / published / ongoing / completed

