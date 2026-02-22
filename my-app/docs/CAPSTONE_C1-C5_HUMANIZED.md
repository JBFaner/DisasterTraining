# Capstone C1–C5: Humanized Paragraphs and Corrections

This document lists **humanized wording** and **corrections** you can apply to your Word file. Use Find & Replace or copy-paste into `CAPSTONE_-C1-C5-FORMAT (2).docx` as needed.

---

## Summary of changes

| Location | Issue | Correction |
|----------|--------|------------|
| **Acknowledgement** | "persons who ... has contributed" | "persons who ... **have** contributed" |
| **Acknowledgement** | "share their knowledge with **them**" | "share their knowledge with **the researchers**" |
| **Dedication** | "This **business research study**" | "This **capstone project**" |
| **Dedication** | "in conducting this **business research study**" | "in conducting this **capstone project**" |
| **Abstract** | "IMRAD TYPE" + Lorem ipsum | Replace with the **Abstract text** below. |
| **Approval** | "acceptance and approval Oral Defense" | "acceptance and approval **for** Oral Defense" |
| **Degree** | "Bachelor of Science **of** Information Technology" | "Bachelor of Science **in** Information Technology" |
| **1.2** | "Flooding and Typhoons, Fires" | "**flooding, typhoons, and fires**" (lowercase, add "and") |
| **1.1** | "conditions effectively challenging" | "conditions**,** effectively challenging" (add comma) |
| **3.3 Sprint Cycles** | Latin placeholder (Sed ut perspiciatis...) | Use the **Sprint Cycles paragraph** below. |
| **Table no. 2** | Caption says "Sprint Cycle" but content is To Do / In Progress / Done | Change caption to **"Scrum Board"**. |
| **3.5, 3.6, 3.7** | Lorem ipsum blocks | Use the **project-specific paragraphs** below. |
| **3.4.7 Increment table** | E-commerce (Product Catalog, Shopping Cart, Checkout) | Replace with **LGU training increments** below or add note: "*(Example from generic template; replace with LGU training deliverables.)*" |
| **Figure 5 / DFD** | "e-commerce system", "Customer", "Browse Products" | Change to **LGU training context** (see below). |
| **CHAPTER IV** | "CHAPTERIV" / "4Requirements" | "**CHAPTER IV**" and "**4. Requirements** Analysis" (spacing). |
| **CHAPTER V** | "13.1" … "13.4" | Use **5.1** … **5.4** (Conclusion). |

---

## Replacement text (copy into your Word file)

### Abstract (replace the Lorem ipsum block)

**Abstract (IMRAD-style placeholder—replace with your actual findings when ready):**

This capstone developed a web-based disaster preparedness training and simulation platform for Local Government Unit 4 (LGU 4), integrating the Google Gemini API for automated scenario generation. The system addresses static, repetitive drills by providing dynamic, AI-generated scenarios that improve adaptive decision-making among LGU personnel. Using Agile Scrum and a modular architecture, the team delivered authentication, training modules, scenario design, simulation events, participant registration, evaluation and scoring, and certification issuance. The platform was validated through iterative demos and is intended for pilot use with Barangay San Agustin (LGU 4) to strengthen local disaster resilience. *[Expand with specific results, methods, and conclusions after your pilot and analysis.]*

---

### 3.3 Sprint Cycles (replace the Latin paragraph)

Work was organized into time-boxed Sprints (typically two weeks). Each Sprint followed a clear cycle: the team selected high-priority items from the Product Backlog in Sprint Planning, committed to a Sprint Goal, and then designed, coded, and tested features daily. Progress was tracked on the Scrum Board (To Do, In Progress, Done) and reviewed in the Daily Standup. At the end of each Sprint, the team demonstrated the working increment to the Product Owner and LGU stakeholders in the Sprint Review, then reflected on process and teamwork in the Sprint Retrospective. This cycle kept the project aligned with LGU needs and allowed quick adjustments when integrating the Gemini API and other components.

---

### 3.5 Microservices Architecture (replace Lorem ipsum)

The LGU Disaster Preparedness platform is structured as a set of focused services that work together through well-defined interfaces. The Authentication Service handles user identity and access; the Simulation Core runs scenario logic and event flow; the AI Scenario Generator communicates with the Gemini API to produce dynamic scenarios; and the Reporting Service produces training and performance metrics. This separation allows each part to be developed, tested, and updated with minimal impact on the others, and supports scalability and clearer maintenance. See Figure 3 for the microservices diagram and Figure 4 for the communication pattern.

---

### 3.6 DevOps Implementation (replace Lorem ipsum)

The project applies DevOps practices to keep development and deployment aligned. The CI/CD pipeline automates build, test, and deploy steps so that each change is verified before it reaches staging or production. Infrastructure is described as code where applicable, so environments stay consistent and repeatable. Monitoring and alerting (e.g., Prometheus, Grafana, Alertmanager) give the team visibility into system health and performance, so issues can be detected and addressed quickly. These practices help keep the disaster training platform stable and ready for LGU use. See Figures 6, 7, and 8 for the CI/CD pipeline, IaC, and monitoring concepts.

---

### 3.7 Integration Approach (replace Lorem ipsum)

The LGU training system is integrated with internal modules and external services in a controlled way. An API Gateway provides a single entry point for authentication, rate limiting, and routing to the correct service. The Gemini API is integrated for scenario generation via secure, well-defined requests and responses. Data and events are exchanged using consistent formats and, where needed, a canonical model to avoid mismatches between systems. Security (e.g., TLS, secure API keys, role-based access) is applied across these integrations. See Figures 9, 10, and 11 for business process, API gateway, and data flow.

---

### 3.4.7 Increment table – LGU-focused example (replace e-commerce rows)

| Sprint No. | Increment / Feature Delivered | User Story / Backlog Reference | Definition of Done (DoD) Criteria | Status | Remarks |
|------------|-------------------------------|--------------------------------|----------------------------------|--------|---------|
| Sprint 1 | User Registration & Login Module | IS-1, IS-2 | Code complete, unit tested, integrated with DB, documentation updated | Done | Basic authentication working |
| Sprint 1 | Database Schema Setup | F-1 | Schema created, tables normalized, tested with sample data | Done | Ready for integration |
| Sprint 2 | Audit Logging & Training Module | IS-3, F11 | UI designed, CRUD functional, tested on staging | Done | Audit logs and training CRUD |
| Sprint 2 | Scenario Design (AI) & Event Planning | F20, F21 | Gemini API integrated, scenarios generated; event CRUD working | Done | AI scenarios and events |
| Sprint 3+ | *(Continue with your actual Sprint deliverables)* | *(Backlog refs)* | *(Your DoD)* | *(Status)* | *(Remarks)* |

---

### Figure 5 / DFD Level 1 – LGU context (replace e-commerce description)

**Level 1 DFD (Context Diagram)**  
The diagram shows the LGU Disaster Preparedness system as one process and how external entities interact with it.

- **External entities:** LGU staff (admins, trainers), participants.  
- **System (process):** LGU Disaster Preparedness Training & Simulation System (with Gemini API integration).  
- **Data stores:** User/Account DB, Training DB, Simulation/Scenario DB, Certification/Reporting DB.  
- **Data flows:** Login, manage training modules, create/run scenarios, register for events, submit responses, view evaluations and certificates.

---

### Chapter 5 numbering

Use **5.1**, **5.2**, **5.3**, **5.4** (not 13.1–13.4) for:

- 5.1 Key Takeaways and Summary  
- 5.2 Project Achievements and Contributions  
- 5.3 Future Work and Enhancements  
- 5.4 Closing Remarks  

---

## Light humanization (optional)

- **1.1** – You can soften “pose serious challenges” to “continue to pose significant challenges” if you prefer.  
- **1.3** – “This project, utilizing” → “This project uses” (more direct).  
- **2.1** – “Scrum is simply a structured way” is already conversational; you can keep it.  
- **Acknowledgement** – “heartfelt thanks and gratitude” can stay; “extended willingness and support” could be “their willingness and support.”  

If you want, the next step can be a second pass focused only on Chapter 4 and Chapter 5 body text (filling in or humanizing the outline sections).
