# DFD — AI Scenario Training (Level 0 · 1 · 2)

**Scope:** Sidebar module **AI Scenario Training** (Lesson Quiz Generator + Final AI Scenario Assessment).  
**Not included:** Campaign Planning (Group 6) — external system, not this module.

---

## Draw.io files (open in order)

| Order | File |
|-------|------|
| 1 | `11_DFD_AI_Scenario_L0.drawio` |
| 2 | `11_DFD_AI_Scenario_L1.drawio` |
| 3 | `11_DFD_AI_Scenario_L2.drawio` |

**All-in-one (3 tabs):** `11_DFD_AI_Scenario_L0_L1_L2.drawio`

---

## Level 0 — Context

**Process 0:** AI Scenario Training

| External | Flows |
|----------|--------|
| Lead Trainer / Admin | Configure, generate, publish |
| Participant | Take quiz / final scenario, submit |
| Training Module | Lesson content (read for prompts) |
| Google Gemini API | Generate questions / scenario |

---

## Level 1 — Processes & stores

| Process | Purpose |
|---------|---------|
| **1.0** Configure Lesson Quiz | `LessonQuizConfig`, bank size, passing score |
| **2.0** Configure Final AI Scenario | `AiScenarioConfig`, retake policy |
| **3.0** Generate AI Content | Queue job → Gemini → draft |
| **4.0** Review & Publish Version | Admin approves published quiz/scenario |
| **5.0** Deliver & Score Attempts | Participant attempts, progress, submit |

| Store | Contents |
|-------|----------|
| **D1** | Lesson quiz config & question bank |
| **D2** | AI scenario config & assessment versions |
| **D3** | Generation jobs (queued / completed / failed) |
| **D4** | Participant attempts & scores |
| **D5** | Training lesson source content (from Training Module) |

---

## Level 2 — Process 3.0 detail

| Sub-process | App mapping |
|-------------|-------------|
| **3.1** Queue Generation Job | `AiScenarioGenerationProcessor::queueGeneration` |
| **3.2** Extract Lesson/Module Context | `LessonContentExtractorService` |
| **3.3** Call Gemini & Parse Response | `GeminiService` |
| **3.4** Save Draft Version & Notify | `AiScenarioWorkflowService`, notifications |

---

## Captions

- **Figure __.** DFD Level 0 — AI Scenario Training  
- **Figure __.** DFD Level 1 — AI Scenario Training  
- **Figure __.** DFD Level 2 — Generate AI Content (Process 3.0)

---

## Regenerate

```bash
php Documents/dfd-ai-scenario/generate_ai_scenario_dfd.php
```

## Module order (internal only)

1. ✅ Training Module  
2. ✅ **AI Scenario Training** (this folder)  
3. ✅ Simulation Event Planning → `Documents/dfd-simulation-event/`  
4. → Participant Registration & Attendance (next)
