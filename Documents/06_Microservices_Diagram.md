# Microservices Diagram

**System:** Disaster Preparedness Training & Simulation System (AlertaraQC)  
**Image:** `Documents/06_Microservices_Diagram.png`  
**Status:** Thesis-ready figure

---

## Suggested caption

**Figure __.** Microservices Architecture of the Disaster Preparedness Training and Simulation System.

## Paragraph (paste under figure)

The platform is organized into logical microservices that map to LGU training domains: training modules, AI scenario generation, simulation event lifecycle, resources and equipment, participant attendance, evaluation and scoring, certification, and hazard assessment. Clients reach these services through an API gateway / application edge that enforces authentication and role-based access (Admin, Lead Trainer, Assistant Trainer, Evaluator, Staff, Participant). Cross-cutting platform capabilities cover identity, configuration, monitoring, audit logging, and notifications. Data stores follow logical ownership per service while the San Agustin pilot is deployed as a modular Laravel application integrated with Gemini, Campaign Planning (Group 6), and CPSQC Patrol.

## Defense talking points

1. **Logical vs physical** — services are domain boundaries; one Hostinger deploy for the pilot.  
2. **Gateway** — PortalAuth RBAC: Lead Trainer = Full Operations; Assistant = personnel only; Evaluator = eval + attendance.  
3. **Externals** — Gemini (AI), Group 6 (campaigns), CPSQC (patrol) never write directly to all DBs.  
4. **Events** — evaluation completion logically triggers certification eligibility (sync today; async bus = future).

## Service list (match the figure)

| # | Service | DB (logical) |
|---|---------|--------------|
| 1 | Training Module Management | training_db |
| 2 | AI Scenario Generator | scenario_db |
| 3 | Simulation Event Lifecycle | simulation_db |
| 4 | Resource & Equipment Inventory | inventory_db |
| 5 | Participant Registration & Attendance | participant_db |
| 6 | Evaluation & Scoring | evaluation_db |
| 7 | Certification Issuance | certification_db |
| 8 | Hazard Assessment Profile | hazard_db |
