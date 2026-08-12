# DFD Level 0 — Per Module (Draw.io)

**Folder:** `Documents/dfd-level0-modules/`  
**Notation:** Gane–Sarson · one process `0` per module · external entities only

---

## How to open

1. **All modules (tabs):** open `09_DFD_Level_0_All_Modules.drawio` in https://app.diagrams.net  
2. **Single module:** open any `m0X-*.drawio` file  
3. Export: **File → Export as → PNG / PDF**

---

## Module list (8)

| Tab / File | Module | Main externals |
|------------|--------|----------------|
| `m01-auth` | Authentication & User Management | Admin, Participant, Centralized Login |
| `m02-training` | Training Module Management | Lead Trainer, Participant, Gemini |
| `m03-campaign` | Campaign Planning Integration | Lead Trainer, Participant, Group 6 |
| `m04-simulation` | Simulation Event Lifecycle | Lead Trainer, Assistant/Staff, Participant, CPSQC |
| `m05-attendance` | Participant Registration & Attendance | Participant, Evaluator, Lead Trainer |
| `m06-evaluation` | Evaluation & Scoring | Participant, Evaluator, Admin, Gemini |
| `m07-certification` | Certification Issuance | Admin, Participant, Evaluation (eligibility) |
| `m08-hazard` | Hazard Assessment Profile | Admin, Reference sources, Simulation Planning |

---

## Regenerate files

```bash
php Documents/dfd-level0-modules/generate_dfd_level0_modules.php
```

---

## Relation to whole-system Level 0

| Diagram | Scope |
|---------|--------|
| `Documents/09_DFD_Level_0_Context.drawio` | Entire platform as one Process 0 |
| This folder | Each major module as its own Process 0 (for per-module defense slides) |

**Level 1** (next): decompose each module into sub-processes + data stores.
