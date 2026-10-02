# Possible Panelist Q&A — Disaster Preparedness Training & Simulation (ALERTARA)

**Para sa defense.** Taglish answers. I-memorize ang flow, hindi need i-memorize word-for-word.

**Core product flow na dapat naka-stick sa utak:**

> **Approved Campaign → Exercise Plan (template) → Use Template → Readiness → Publish → Monitoring**

System URL: `https://disaster-training.alertaraqc.com`  
Partners: Campaign Planning (Group 6) · CPSQC / Policy (patrol marshals)

---

## 0. Demo logins + Role access (review before defense)

> **Private cheat sheet** — huwag i-project ang passwords sa public slide kung may livestream.  
> Verified against production Hostinger (Aug 26, 2026). Admin login may **OTP** via email.

### Login portals
| Who | URL |
|-----|-----|
| Admin / Lead Trainer | `https://disaster-training.alertaraqc.com/admin/login` |
| Participant | `https://disaster-training.alertaraqc.com/participant/login` |

### Working demo accounts (production)

| Role | Email | Password | Notes |
|------|-------|----------|-------|
| **LGU_ADMIN** | `jbcursor@gmail.com` | `admin123` | Full ops — **main demo account** |
| **LGU_ADMIN** | `reyreyko2@gmail.com` | `admin123` | Full ops |
| **LGU_ADMIN** | `brogada.reymon09@gmail.com` | `admin123` | Full ops (Reymon) |
| **PARTICIPANT** | `demo.participant.001@barangay.qc.local` | `user@123` | Participant portal |
| **PARTICIPANT** | `demo.participant.003@barangay.qc.local` | `user@123` | May may certificate (#10) — Camille Lopez |
| **LGU_TRAINER** (Assistant) | `maria.santos.trainer@lgu.local` | `trainer123` | Seeded; **hindi full ops login** (see below) |
| **LGU_TRAINER** (Assistant) | `juan.delacruz.trainer@lgu.local` | `trainer123` | Same |

**Defense tip:** Gamitin ang **LGU_ADMIN** + **PARTICIPANT**. Huwag umasa sa Assistant Trainer (`LGU_TRAINER`) para sa full module demo — by design personnel/roster lang sila; **admin login allows only** `LGU_ADMIN` / `LEAD_TRAINER` / `SUPER_ADMIN` (`PortalAuth::canManageOperations`).

### Ano ang naa-access per role?

| Role | Portal | Sidebar / access |
|------|--------|------------------|
| **SUPER_ADMIN** / **LGU_ADMIN** | `/admin` | **Lahat:** Dashboard, Training Modules, AI Scenario Training, Simulation Event Planning, Participants & Attendance, Resources, Evaluation, Certification, Hazard Assessment, Budget Proposals, Users & Roles, Audit Logs, Backup & Recovery |
| **LEAD_TRAINER** | `/admin` | **Operations** (same ops modules as admin: training, simulation, participants, resources, evaluation, certification). **Walang** Administration block (Users/Roles, Audit, Backup, Hazard, Budget) |
| **EVALUATOR** | `/admin` | Evaluation & Scoring, Simulation Events, Participants & Attendance (scoring/attendance focus) |
| **LGU_TRAINER** (Assistant Trainer) | limited | Designed as **personnel/roster** account — **hindi** full Operations menu; typically **hindi** pinapapasok ng admin login filter |
| **STAFF** / **VIEWER** | limited | Support/view roles; hindi primary defense demo |
| **PARTICIPANT** | `/participant` | Dashboard, Training Modules, Simulation Events, My Trainings, My Attendance, Evaluation Results, My Certificates (+ Profile / notifications) |

### Capability helpers (code truth)
- `canManageOperations` → `LGU_ADMIN`, `LEAD_TRAINER`, `SUPER_ADMIN`
- `canEvaluate` / attendance manage → Admin + Lead Trainer + Evaluator (+ Super Admin)
- Participant-only routes → `/participant/*`

### Q0. Anong roles meron at sino ang may full access?
**A:** Primary roles: **LGU Admin**, **Lead Trainer**, **Assistant Trainer (LGU_TRAINER)**, **Evaluator**, **Participant**, (+ Staff/Viewer). Full system control = **LGU Admin / Super Admin**. Lead Trainer = operations. Participant = own learning/drill/certificate path only.

---

## A. Overview & Purpose (Q1–Q8)

### Q1. Ano ba ang system niyo, one sentence?
**A:** Web-based LGU platform for **disaster preparedness training and simulation** — from training modules and campaign registration, hanggang exercise planning, live monitoring, evaluation, at certification.

### Q2. Sino ang target users?
**A:**
- **LGU Admin / Super Admin** — full modules: training, campaigns/simulation, users, audit, backup
- **Lead Trainer** — operations (training, simulation, attendance, evaluation, certification)
- **Assistant Trainer (`LGU_TRAINER`)** — personnel/roster oriented (hindi full ops menu)
- **Evaluator** — scoring + attendance-focused screens
- **Participant** — train, register/join drills, view results & certificates
- **External partners** — Campaign Planning (approve campaigns), CPSQC (patrol marshals)

See **Section 0** for demo emails/passwords + access matrix.

### Q3. Anong problem ang sine-solve niyo?
**A:** Dating fragmented/manual ang training-to-drill pipeline. Kailangan ng end-to-end: content → community registration → approved schedule → reusable exercise plan → readiness checklist → monitored drill → scored evaluation → certificate.

### Q4. Bakit important sa LGU / disaster preparedness?
**A:** Consistent training quality, measurable participation, audit trail, at ready-to-run simulation events tied sa approved community campaigns — hindi “ad hoc” drills lang.

### Q5. Ano ang branding / ecosystem?
**A:** Part of **ALERTARA** public-safety ecosystem. DT (Disaster Training) integrates with Campaign Planning at Policy/CPSQC services under `alertaraqc.com`.

### Q6. Ano ang pinaka-important flow na i-demo?
**A:**  
`Approved Campaign → Exercise Plan → Use Template → Readiness → Publish → Monitoring`

### Q7. Ano ang “Approved Campaign”?
**A:** Campaign request na na-approve ng Campaign Planning partner (o demo force-approve). Lilitaw sa **Approved Campaigns** tab sa Simulation Events. Doon nagsisimula ang scheduling ng simulation.

### Q8. Ano ang difference ng Training Module vs Simulation Event?
**A:**
- **Training Module** = learning content (lessons, quizzes, AI scenario assessment)
- **Simulation Event** = actual drill/exercise run (date, venue, readiness, attendance, evaluation)

---

## B. Tech Stack & Architecture (Q9–Q15)

### Q9. Anong tech stack?
**A:**
- **Backend:** Laravel (PHP)
- **Frontend:** React (Vite) + Blade shell
- **DB:** MySQL/MariaDB
- **Deploy:** Hostinger VPS (Nginx + PHP-FPM)
- **Auth:** Portal roles + OTP for admin login
- **Integrations:** REST/JWT/API keys sa partners; AI via Gemini for scenarios/exercise drafts

### Q10. Monolith ba o microservices?
**A:** **Modular monolith** ang DT app (Laravel). External partner systems (Campaign, CPSQC/Policy) are separate apps na kino-communicate via APIs — hybrid: own system monolithic, ecosystem distributed.

### Q11. Paano naka-organize ang modules?
**A:** Sidebar modules: Training Modules, Simulation Events (planning + lifecycle), Participants, Resources, Evaluations, Certification, Hazard Assessment Profiles, Audit Logs, Backup & Recovery, Settings/Users (admin).

### Q12. Saan naka-store ang audit trail?
**A:** `audit_logs` table via `AuditLogger` service. Soft-fail: kung mag-fail ang audit write, hindi mababasag ang primary action.

### Q13. May role-based access ba?
**A:** Oo — `SUPER_ADMIN`, `LGU_ADMIN`, `LGU_TRAINER`, `PARTICIPANT` (+ portal middleware). Admin routes under `/admin/*`, participant under `/participant/*`.

### Q14. Paano ang frontend loading?
**A:** Laravel Vite build (`app.jsx`, `landing.js`, `auth.jsx`). Production needs `npm run build` para may `public/build/manifest.json`. Kung missing entry (e.g. landing.js), homepage 500.

### Q15. Bakit may Demo tools?
**A:** Para sa presentation/defense: force-approve campaign, meet readiness quota, etc. — when enabled — para hindi ma-block ng real partner delays habang naka-demo.

---

## C. Training Modules & Campaigns (Q16–Q24)

### Q16. Paano gumawa ng training?
**A:** Admin → Training Modules → create draft → lessons/contents → publish. Pwede may thumbnail, target audience, hazard category.

### Q17. Ano ang Campaign Request?
**A:** Pag-submit ng published training module papunta sa campaign approval workflow. Nagkakaroon ng registration window, expected/max participants, recommended communities.

### Q18. Ano ang status flow ng campaign?
**A:** Roughly:  
`waiting_for_approval` → `approved` | `rejected` → (after event generated) `scheduled`

### Q19. Paano naa-approve ang campaign?
**A:** Primary: **Group 6 / Campaign Planning** partner calls our API `PATCH .../campaign-requests/{id}/status`. May callback din from Campaign app papunta sa DT. May **Demo force-approve** for defense.

### Q20. Ano ang pinapadala sa Campaign Planning?
**A:** Announcement/registration intelligence — title, communities, audience, registration dates, capacity, registration link metadata. **Hindi** pinapadala ang full lesson list / internal trainer details as main planning payload.

### Q21. Kailan active ang registration link?
**A:** Kapag `approved` **at** within registration window **at** hindi pa full ang capacity.

### Q22. Paano nagre-register ang participants?
**A:** Via campaign registration link/form. Tied sa campaign request (`registration_campaign_id`). After approve registration (kung required), they can join trainings/events.

### Q23. Ano ang “defense seed” campaigns?
**A:** Pre-seeded approved campaigns (Fire/Flood/Earthquake, San Agustin communities) for stable demo inventory — para hindi empty ang Approved Campaigns tab.

### Q24. Kapag approved na, bakit nawawala sa Approved list after generate?
**A:** Expected — after simulation event is generated/scheduled, campaign status moves (e.g. `scheduled`) so hindi na “waiting to plan.” Fresh approved items remain for next Use Template.

---

## D. Exercise Plans / Templates (Q25–Q30)

### Q25. Ano ang Exercise Plan / Simulation Exercise Template?
**A:** Reusable drill blueprint — objectives, timeline, roles, resources, scenario notes. Publish once, reuse across approved campaigns.

### Q26. Bakit template-based instead of editing old “Edit Simulation Event” form?
**A:** Consistency + speed. One published plan → many events via **Use Template**. Deprecated path: manual Edit Simulation Event for template-based events — we protect the new flow.

### Q27. Ano ang “Use Template”?
**A:** From Approved Campaigns, pick a **published** template + date/venue → generates a Simulation Event, usually landing on **Readiness** tab.

### Q28. Pwede bang AI-assisted ang plan?
**A:** Oo — may AI draft/regenerate section helpers for exercise plans (Gemini-backed), tapos human review before publish.

### Q29. Ano ang difference ng draft vs published template?
**A:** Draft = editable work-in-progress. Published = available for Use Template when scheduling events. Archive = retire without deleting history.

### Q30. Ano ang acceptance check bago publish template?
**A:** System validates required plan sections; incomplete plans blocked with clear errors before publish.

---

## E. Readiness, Publish, Monitoring (Q31–Q37)

### Q31. Ano ang Readiness?
**A:** Pre-go checklist before live drill — confirmations, personnel/marshal assignments, resources, CPSQC patrol request if needed, quotas/deadlines related to campaign readiness.

### Q32. Ano ang Publish sa context ng event?
**A:** Event becomes ready/visible for execution/monitoring once readiness requirements are satisfied (and admin publishes/opens lifecycle).

### Q33. Ano ang Monitoring?
**A:** Live/ops view of simulation lifecycle — execution steps, attendance, personnel, post-evaluation hooks, status progression (draft → running/completed/ended).

### Q34. Paano naka-link ang CPSQC?
**A:** From event readiness/lifecycle, admin can **request patrol marshals** to Policy/CPSQC API. Assigned personnel can be refreshed and used in marshal assignments.

### Q35. Ano ang mangyayari kung may open CPSQC request na?
**A:** Blocked ang duplicate open request — wait until completed/rejected before requesting again (prevents spam/confusion).

### Q36. Paano ang attendance?
**A:** For approved registrants — mark present/late/absent (manual/QR/code). Pwede i-lock after event. Self check-in available for participants when enabled.

### Q37. Ano ang post-evaluation?
**A:** After drill, trainers score participants against criteria; evaluation can move to completed and prepare outbound payload for partners when configured.

---

## F. Evaluation & Certificates (Q38–Q42)

### Q38. Paano nae-evaluate ang participants?
**A:** Evaluation module per simulation event — competency rating + criterion scores. Requires attendance present/late first.

### Q39. Ano ang certificate eligibility?
**A:** Based on completion rules (module lessons/assessment and/or event evaluation). Eligible list in Certification module; admin issues certificate.

### Q40. Ano ang laman ng certificate?
**A:** Snapshot of template content/background at issue time + certificate number + QR verification token — para hindi magbago ang history kung i-edit ang template later.

### Q41. Paano i-verify ang certificate?
**A:** Public URL `/certificates/verify/{token}` — shows valid/revoked without needing admin login.

### Q42. Bakit 404 ang `/certificates/10/view`?
**A:** Walang unprefixed route. Correct:
- Admin: `/admin/certificates/{id}/view`
- Participant: `/participant/certificates/{id}/view`  
*(Normal UI flow automatic na tama ang URL; 404 lang kung manual mali ang path.)*

### Q42b. Nakakuha na ako ng certificate — ano sunod? Para saan ko ’to bilang participant? Di naman “license” ’to ah.
**A (short):** Tama — **preparedness credential**, hindi PRC/professional license. Proof na natapos at na-evaluate ka sa LGU disaster training/drill.

**Ano next bilang participant:**
1. **I-save / i-print / i-email** ang digital certificate mula sa portal.
2. **I-verify via QR** (`/certificates/verify/{token}`) — public proof, kahit walang login.
3. **Ilagay sa evaluation portfolio** / personal records — proof of competency ratings + completed drills.
4. **Gamitin bilang requirement gate** sa susunod na LGU activities (mas advanced drills, volunteer deployment lists, barangay response team roster, school/workplace DRRM compliance) — depende sa policy ng LGU.
5. **Mag-join ulit** ng bagong campaigns/modules (Flood → Fire → Earthquake) para mag-stack ang certificates per hazard.

**Para saan talaga:** accountability + readiness evidence para sa LGU at sa participant — “trained, attended, evaluated, certified” — hindi automatic job title, pero usable proof of preparedness participation.

---

## G. Integrations, Security, Audit (Q43–Q48)

### Q43. Paano authenticated ang partner APIs?
**A:**
- **Inbound Group 6:** API key header (`X-Group6-Api-Key`) / configured JWT secrets aligned with Campaign app
- **Outbound to Campaign:** JWT/API as configured in DT `.env`
- **CPSQC:** partner endpoints (public receive/list per their catalog) + our integration flags

### Q44. Ano ang ginagawa ng Audit Logs?
**A:** Records who did what (login, module CRUD, campaign submit/approve, plan save, template publish/reuse, attendance, roles, evaluations, etc.) for accountability — important for LGU defense questions on governance.

### Q45. Paano naka-secure ang admin login?
**A:** Portal auth + OTP verification step for admin. Session inactivity middleware. Role gates on routes.

### Q46. May backup & recovery ba?
**A:** Yes — Backup & Recovery admin module; also queues backups on certain critical completions (e.g. final evaluation completed).

### Q47. Ano ang Hazard Assessment Profiles?
**A:** Barangay/community hazard intelligence used to recommend communities/audiences for campaigns and ground training in local risk context.

### Q48. Paano niyo hina-handle ang integration failures?
**A:** Soft-fail where possible (notify/sync errors returned in API response; audit soft-fail; CPSQC clear error messages). Primary user action shouldn’t silently corrupt; admin sees status.

---

## H. Demo / Defense Pressure Questions (Q49–Q55)

### Q49. Ipakita niyo live ang full flow — saan magsisimula?
**A:**  
1. `/admin/simulation-events` → **Approved Campaigns**  
2. Ensure may **published** exercise plan  
3. **Use Template** (date + venue)  
4. Complete **Readiness**  
5. **Publish** / open monitoring  
6. (Optional) mark attendance → evaluate → issue certificate

### Q50. Ano ang limitations / honest gaps?
**A:** Possible answers (pick true ones you accept):
- Partner delays kung offline ang Campaign/CPSQC
- Demo tools exist for presentation resilience
- Some historical events may already be completed — for live monitoring, create fresh event from approved campaign
- Certificate UI dating mayakalito kung mali ang URL prefix — na-fix na sa `/admin/...`

### Q51. Kung biglang down ang partner Campaign system?
**A:** DT still holds campaign_requests locally. Demo force-approve / local status tools can unblock demo; production path expects partner callback/API. Registration/planning data remains in our DB.

### Q52. Paano niyo sine-ensure na hindi fake ang training completion?
**A:** Attendance lock, evaluation criteria, eligibility service checks lesson/assessment/event completion before certificate issue; revoke supported with reason + audit.

### Q53. Ano ang contribution ng group niyo vs partners?
**A:** **We own** training content, simulation planning/lifecycle, attendance, evaluation, certificates, audit. **Partners own** campaign political/scheduling approval (Group 6) and patrol marshal assignment (CPSQC).

### Q54. Scalability — kaya ba ng LGU rollout?
**A:** Modular monolith on VPS is enough for city/LGU pilot. Queue/jobs for heavy AI/backup. Next scale path: caching, queue workers, split read replicas, or extract high-traffic APIs if needed.

### Q55. Ano ang next improvements after defense?
**A:** Examples: tighter partner SLAs/monitoring dashboards, more automated certificate issuance rules, richer live monitoring analytics, stronger offline-resilient sync, expanded barangay coverage beyond demo communities.

---

## Quick “cheat sheet” URLs

| What | URL |
|------|-----|
| Landing | `/` |
| Admin login | `/admin/login` |
| Approved Campaigns / Events | `/admin/simulation-events` |
| Exercise Plans | `/admin/simulation-exercise-templates` |
| Certification | `/admin/certification` |
| Audit Logs | `/admin/audit-logs` |
| View certificate | `/admin/certificates/{id}/view` |
| Verify certificate (public) | `/certificates/verify/{token}` |

---

## 30-second elevator (memorize this)

> “Ang Disaster Training namin under ALERTARA ay end-to-end preparedness platform: gumagawa kami ng training modules, magpapasa ng campaign for approval, tapos once approved, gumagamit kami ng reusable exercise plan via Use Template, tinatapos ang Readiness, pino-publish, mine-monitor ang drill, then evaluation and certificate — with integrations sa Campaign Planning at CPSQC, plus audit logs for accountability.”

---

*Generated for defense prep · DisasterTraining / ALERTARA*
