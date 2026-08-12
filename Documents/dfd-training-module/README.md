# DFD — Training Module Management (Level 0 · 1 · 2)

**Scope:** Training Module Management only (not Campaign, Simulation, or Evaluation).  
**Folder:** `Documents/dfd-training-module/`  
**Notation:** Gane–Sarson

---

## Draw.io files (open in order)

| Order | File | What it shows |
|-------|------|----------------|
| 1 | `10_DFD_Training_Module_L0.drawio` | **Level 0** — whole module as Process `0` |
| 2 | `10_DFD_Training_Module_L1.drawio` | **Level 1** — processes 1.0–4.0 + data stores D1–D3 |
| 3 | `10_DFD_Training_Module_L2.drawio` | **Level 2** — detail of **Process 2.0** (lessons & resources) |

**All-in-one (3 tabs):** `10_DFD_Training_Module_L0_L1_L2.drawio`

Open at https://app.diagrams.net → File → Export PNG/PDF for thesis.

---

## Level 0 — Context

**Process 0:** Training Module Management

| External entity | Data flows |
|-----------------|------------|
| Lead Trainer / Admin | → module metadata, lessons, publish · ← module list, status |
| Participant | → view lessons, progress · ← published content |
| Google Gemini API | ↔ AI draft prompt / generated outline |

---

## Level 1 — Decomposition

| Process | Purpose |
|---------|---------|
| **1.0** Create & Publish Module | Draft/publish `training_modules` |
| **2.0** Manage Lessons & Resources | CRUD lessons, PDF/video resources |
| **3.0** Deliver Training Content | Participant reads content, progress to D3 |
| **4.0** Generate AI Draft | Gemini → draft module/lessons |

| Data store | Contents |
|------------|----------|
| **D1** Module Catalog | `training_modules` (title, category, status, objectives) |
| **D2** Lessons & Resources | `contents`, `resources` |
| **D3** Participant Progress | `lesson_completions`, lesson quiz attempts |

**Note:** Campaign request submit belongs to **Campaign Integration DFD**, not this module.

---

## Level 2 — Process 2.0 detail

| Sub-process | Maps to app |
|-------------|-------------|
| **2.1** Validate & Save Lesson | `storeContent` / `updateContent` |
| **2.2** Attach Learning Resource | `storeResource`, file storage |
| **2.3** Reorder Contents | `reorderContents` |
| **2.4** Remove Lesson or Resource | `destroyContent` / `destroyResource` |

| Store | Role |
|-------|------|
| D1 | Parent module link |
| D2 | Lesson rows + resource metadata |
| D2b | Physical files (`storage/`) |

---

## Suggested captions

- **Figure A.** DFD Level 0 — Training Module Management  
- **Figure B.** DFD Level 1 — Training Module Management  
- **Figure C.** DFD Level 2 — Manage Lessons and Resources (Process 2.0)

---

## Regenerate

```bash
php Documents/dfd-training-module/generate_training_module_dfd.php
```
