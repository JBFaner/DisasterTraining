# DFD — Evaluation & Scoring System (Level 0 · 1 · 2)

**Scope:** Sidebar module **Evaluation & Scoring System** (training results hub + simulation event drill scoring).  
**Linked modules:** AI Scenario Training, Simulation Event Planning, Attendance, Certification (consumer).

---

## Draw.io files

| Order | File |
|-------|------|
| 1 | `15_DFD_Evaluation_Scoring_L0.drawio` |
| 2 | `15_DFD_Evaluation_Scoring_L1.drawio` |
| 3 | `15_DFD_Evaluation_Scoring_L2.drawio` |

**All-in-one (3 tabs):** `15_DFD_Evaluation_Scoring_L0_L1_L2.drawio`

---

## Level 0 — Context

**Process 0:** Evaluation & Scoring System

| External | Flows |
|----------|--------|
| Evaluator / Lead Trainer | Score drills, review, lock/export |
| Participant | View portfolio / drill scores |
| Simulation Event Planning | Completed events + objectives |
| AI Scenario Training | Quiz/scenario attempt scores |
| Participant Reg. & Attendance | Present roster for scoring eligibility |
| Certification Issuance | Eligible pass results |

---

## Level 1 — Processes & stores

| Process | Purpose |
|---------|---------|
| **1.0** Ingest Training Assessment Results | Lesson quiz / AI scenario → `EvaluationResult` |
| **2.0** Score Simulation Event Drill | Manual criteria scoring per participant |
| **3.0** Aggregate & Summarize | Hub dashboard / event summary |
| **4.0** Lock / Reset Finalize | Lock evaluation, status, bulk reset |
| **5.0** Publish Portfolio & Export | Participant portfolio + CSV export |

| Store | Contents |
|-------|----------|
| **D1** | Training evaluation results |
| **D2** | Event evaluations & participant evaluations |
| **D3** | Criteria score lines |
| **D4** | Quiz/scenario attempts (read) |
| **D5** | Locked status & exports |

---

## Level 2 — Process 2.0 detail

| Sub-process | App mapping |
|-------------|-------------|
| **2.1** Load Event & Eligible Roster | `EvaluationController::show` / `evaluate` |
| **2.2** Apply Evaluation Criteria | Score form + `SimulationEvaluationCriteria` |
| **2.3** Compute Total & Pass/Fail | `EvaluationScoringService` |
| **2.4** Save Participant Evaluation | `storeEvaluation` → `ParticipantEvaluation` + `EvaluationScore` |

---

## Captions

- **Figure __.** DFD Level 0 — Evaluation & Scoring System  
- **Figure __.** DFD Level 1 — Evaluation & Scoring System  
- **Figure __.** DFD Level 2 — Score Simulation Event Drill (Process 2.0)

---

## Regenerate

```bash
php Documents/dfd-evaluation-scoring/generate_evaluation_scoring_dfd.php
```

## Module order (internal only)

1. ✅ Training Module  
2. ✅ AI Scenario Training  
3. ✅ Simulation Event Planning  
4. ✅ Participant Registration & Attendance  
5. ✅ Resource & Equipment Inventory  
6. ✅ **Evaluation & Scoring System** (this folder)  
7. ✅ Certification Issuance → `Documents/dfd-certification/`  
8. → Hazard Assessment Profile (next)
