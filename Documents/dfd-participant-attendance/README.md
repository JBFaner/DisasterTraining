# DFD — Participant Registration & Attendance (Level 0 · 1 · 2)

**Scope:** Sidebar module **Participant Registration & Attendance** (registry, campaign reg, event reg, attendance).  
**External:** Campaign Planning (Group 6), Simulation Event Planning, Group 6 participant sync.

**Rule of thumb:** Campaign registration unlocks training. Cancel registration = simulation **event** only (module access stays).

---

## Draw.io files

| Order | File |
|-------|------|
| 1 | `13_DFD_Participant_Attendance_L0.drawio` |
| 2 | `13_DFD_Participant_Attendance_L1.drawio` |
| 3 | `13_DFD_Participant_Attendance_L2.drawio` |

**All-in-one (3 tabs):** `13_DFD_Participant_Attendance_L0_L1_L2.drawio`

---

## Level 0 — Context

**Process 0:** Participant Registration & Attendance

| External | Flows |
|----------|--------|
| Lead Trainer / Admin / Evaluator | Approve/reject, mark attendance, lock/export |
| Participant | Self-register, campaign/event reg, QR check-in |
| Campaign Planning (Group 6) | Open campaign registration window |
| Simulation Event Planning | Published events for event registration |
| Group 6 Participant Sync | Inbound participant profiles |

---

## Level 1 — Processes & stores

| Process | Purpose |
|---------|---------|
| **1.0** Manage Participant Registry | Create/sync/verify participants |
| **2.0** Campaign Registration | Unlock training module access |
| **3.0** Event Registration | Approve / reject / cancel event seat |
| **4.0** Record Attendance | QR, manual, bulk mark |
| **5.0** Lock & Export Attendance | Freeze sheet + CSV export |

| Store | Contents |
|-------|----------|
| **D1** | Participant registry |
| **D2** | Campaign registrations |
| **D3** | Event registrations |
| **D4** | Attendance records |
| **D5** | Published events (read from Simulation Event Planning) |

---

## Level 2 — Process 4.0 detail

| Sub-process | App mapping |
|-------------|-------------|
| **4.1** Load Approved Roster | `EventRegistration` list for event |
| **4.2** Mark Present (QR / Manual) | `AttendanceController::markPresentByQR` / `store` |
| **4.3** Bulk Mark / Update Status | `bulkMark` / `update` |
| **4.4** Validate & Persist Record | Attendance upsert + locked check |

---

## Captions

- **Figure __.** DFD Level 0 — Participant Registration & Attendance  
- **Figure __.** DFD Level 1 — Participant Registration & Attendance  
- **Figure __.** DFD Level 2 — Record Attendance (Process 4.0)

---

## Regenerate

```bash
php Documents/dfd-participant-attendance/generate_participant_attendance_dfd.php
```

## Module order (internal only)

1. ✅ Training Module  
2. ✅ AI Scenario Training  
3. ✅ Simulation Event Planning  
4. ✅ **Participant Registration & Attendance** (this folder)  
5. ✅ Resource & Equipment Inventory → `Documents/dfd-resource-inventory/`  
6. → Evaluation & Scoring System (next)
