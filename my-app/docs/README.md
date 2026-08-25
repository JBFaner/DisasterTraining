# Disaster Preparedness Training & Simulation System - Documentation

## Overview

This directory contains comprehensive documentation for the Disaster Preparedness Training & Simulation System, organized according to the project's Agile Scrum methodology and Enterprise Information System (EIS) standards.

## Documentation Structure

### 10.2 Tools and Technologies Used
- **File**: `10.2_Tools_and_Technologies_Used.md` / `10.2_Tools_and_Technologies_Used.docx`
- **Description**: Thesis-ready tools and technologies table (Section 10.2)
- **Content**: Summary paragraph, Table 10.2 (Category | Tool | Version | Purpose), stack diagram, notes
- **Regenerate Word**: `php docs/build_10_2_tools_docx.php`

### 3.3 Sprint Cycles
- **File**: `3.3_Sprint_Cycles.md`
- **Description**: Overview of sprint structure, Scrum board, and sprint goals
- **Content**: Sprint duration, goals, definition of done

### 3.4 Scrum Artifacts (realistic table sizes)
- **File**: `3.4_Scrum_Artifacts.md`
- **Description**: Overview + target entry counts per table (thesis guide)
- **Regenerate all 3.4 tables**: `php docs/generate_realistic_scrum_artifacts.php`
- **Thesis Word export**: `Chapter_3.3_to_3.4.7_Scrum_Artifacts.docx` — `php docs/build_chapter_docx.php`

| Table | Target | Generated |
|-------|--------|-----------|
| Product Backlog (F*) | 60–80 | 70 |
| EIS Information Security | 25–35 | 30 |
| EIS UI/UX Standards | 25–35 | 30 |
| EIS Integration | 20–30 | 25 |
| Application Analytics | 20–30 | 25 |
| EIS Analytics | 20–30 | 25 |
| Sprint Backlog | 30–40 tasks | 32 |
| Increment | 20–30 items | 24 |

### 3.4.1 – 3.4.7 artifact files
- `3.4.1_Product_Backlog_User_Stories.md` — functional user stories (AlertaraQC / San Agustin)
- `3.4.2_Product_Backlog_EIS_Information_Security.md`
- `3.4.3_Product_Backlog_EIS_Standards_UI_UX.md`
- `3.4.4_Product_Backlog_EIS_Integration.md`
- `3.4.5_Product_Backlog_Analytics.md` (ASA + EA)
- `3.4.6_Sprint_Backlog.md` — 32 tasks + burndown sample
- `3.4.7_Increment.md` — 24 delivered increments

**Full source** (120+ rows per EIS table, for regeneration only): `docs/chapter-3-scrum-artifacts-alertara.md` at repo root.

## Key Features Documented

### ✅ Completed Features

1. **Authentication & Security**
   - Multi-factor authentication (OTP, USB Key)
   - Role-based access control
   - Session management
   - Audit logging
   - Security event tracking

2. **User Management**
   - User registration
   - Profile management
   - User monitoring
   - Activity tracking

3. **Training System**
   - Training module management
   - Scenario-based exercises
   - AI-powered scenario generation

4. **Event Management**
   - Simulation event planning
   - Participant registration
   - Attendance tracking

5. **Evaluation System**
   - Evaluation criteria setup
   - Participant scoring
   - Performance analytics

6. **UI/UX**
   - Consistent design system
   - Responsive design
   - Component library
   - Light/dark theme (Settings → Appearance)
   - Accessibility baseline (WCAG polish planned)

7. **Capstone Documentation** (`Documents/`)
   - Diagram guidelines for groupmates
   - BPMN AS-IS/TO-BE, IaC, microservices DFD/comms, CI/CD & architecture PNGs, BPA
   - Per-module DFD L0–L2 (8 internal modules)
   - Overall system DFD L0 + L1
   - Week 4 IT Auditing risk case study (answered)

### 🚧 In Progress

*(None — pilot scope items above are Done for thesis submission.)*

### Removed from scope (not in Chapter 3 tables)

- SMS notifications, external cert authority API, custom report builder, full WCAG pass — out of pilot backlog for this manuscript

## Certification Tracking Integration

The system's primary integration focus is on **Certification Tracking**. This includes:

- Automatic certification eligibility determination
- Certificate generation and issuance
- Certificate verification system
- Certification analytics and reporting
- Integration with external certification authorities

See `3.4.4_Product_Backlog_EIS_Integration.md` for detailed information.

## System Architecture

### Technology Stack

See **`10.2_Tools_and_Technologies_Used.md`** for the full thesis-ready table (Category | Tool | Version | Purpose) and summary paragraph.

- **Backend**: Laravel 12 (PHP 8.2)
- **Frontend**: React 19 with Vite 7 and Tailwind CSS 4 (Blade + React; not Inertia.js)
- **Database**: MySQL 8.0 InnoDB (production); MariaDB/SQLite (local dev and tests)
- **Authentication**: Session-based auth with RBAC
- **File Storage**: Local filesystem and Cloudinary
- **AI**: Google Gemini API via Laravel HTTP Client
- **Email**: Laravel Mail (SMTP); Mailpit for local dev

### Key Components

1. **Authentication System**
   - Multi-role support (Super Admin, LGU Admin, Trainer, Staff, Participant)
   - OTP verification
   - USB key authentication
   - Session management

2. **Training Management**
   - Module creation and management
   - Scenario design
   - Event planning
   - Resource inventory

3. **Evaluation System**
   - Criteria-based evaluation
   - Automated scoring
   - Certification eligibility
   - Performance analytics

4. **User Monitoring**
   - Real-time status tracking
   - Activity monitoring
   - Online/offline detection
   - Inactive time tracking

## Status Legend

- ✅ **Completed**: Feature fully implemented and deployed
- ✅ **Completed**: Implemented and available in production
- 🚧 **In Progress**: Currently under development (if any)

## How to Use This Documentation

1. **For Project Managers**: Review sprint backlogs and product backlogs to track progress
2. **For Developers**: Use sprint backlogs for task assignments and implementation details
3. **For Stakeholders**: Review product backlogs to understand feature priorities and status
4. **For QA**: Use documentation to understand requirements and test cases

## Updates

This documentation is maintained as part of the Agile development process. Updates are made:
- After each sprint completion
- When new features are added
- When priorities change
- When integration requirements are updated

## Related Documentation

- `10.2_Tools_and_Technologies_Used.md` / `.docx` - Tools and technologies (thesis Section 10.2)
- `ERD_Overall.png` - Overall Entity-Relationship Diagram (database schema)
- `Communication_Interaction_Pattern.png` - Communication & Interaction Pattern diagram
- `Sequence_Publish_Simulation_Event.png` - UML sequence (publish flow); full set in `Documents/sequence/`
- `Network_Topology.png` - Star-tree hybrid network topology (`Documents/network-topology/`)
- `README.md` - Main project README
- `IMPLEMENTATION_COMPLETE.md` - Implementation status
- `VERIFICATION_CHECKLIST.md` - System verification checklist
- `PRODUCTION_DEPLOYMENT_STEPS.md` - Deployment guide

## Contact

For questions or updates to this documentation, please contact the development team.
