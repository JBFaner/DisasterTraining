# DFD — Certification Issuance (Level 0 · 1 · 2)

**Scope:** Sidebar module **Certification Issuance** (templates, eligibility, issue/revoke, verify, email/export).  
**Linked modules:** Evaluation & Scoring, Training Module.  
**Public:** Certificate QR / verify link (no login).

---

## Draw.io files

| Order | File |
|-------|------|
| 1 | `16_DFD_Certification_L0.drawio` |
| 2 | `16_DFD_Certification_L1.drawio` |
| 3 | `16_DFD_Certification_L2.drawio` |

**All-in-one (3 tabs):** `16_DFD_Certification_L0_L1_L2.drawio`

---

## Level 0 — Context

**Process 0:** Certification Issuance

| External | Flows |
|----------|--------|
| Lead Trainer / Admin | Templates, issue, revoke, export |
| Participant | View / email certificate |
| Evaluation & Scoring | Pass / eligible results |
| Training Module | Module title / completion context |
| Public Verifier | QR / verify token |

---

## Level 1 — Processes & stores

| Process | Purpose |
|---------|---------|
| **1.0** Manage Templates & Settings | Template CRUD + certification settings |
| **2.0** Check Eligibility | Eligible participants list |
| **3.0** Issue Certificate | Generate number, render, save |
| **4.0** Revoke / Reissue | Revoke or reissue certificate |
| **5.0** Deliver & Verify | View, email, public verify, export |

| Store | Contents |
|-------|----------|
| **D1** | Certificate templates |
| **D2** | Certification settings |
| **D3** | Issued certificates |
| **D4** | Eligibility snapshot (read from Evaluation/Training) |
| **D5** | Verify tokens & exports |

---

## Level 2 — Process 3.0 detail

| Sub-process | App mapping |
|-------------|-------------|
| **3.1** Validate Eligibility | `ParticipantCertificateEligibilityService` |
| **3.2** Select Template & Preview | `previewParticipant` / template select |
| **3.3** Generate Number & Render | `generateCertificateNumber` + `CertificateDesignRenderer` |
| **3.4** Persist & Notify | `CertificationController::issue` + optional email |

---

## Captions

- **Figure __.** DFD Level 0 — Certification Issuance  
- **Figure __.** DFD Level 1 — Certification Issuance  
- **Figure __.** DFD Level 2 — Issue Certificate (Process 3.0)

---

## Regenerate

```bash
php Documents/dfd-certification/generate_certification_dfd.php
```

## Module order (internal only)

1. ✅ Training Module  
2. ✅ AI Scenario Training  
3. ✅ Simulation Event Planning  
4. ✅ Participant Registration & Attendance  
5. ✅ Resource & Equipment Inventory  
6. ✅ Evaluation & Scoring System  
7. ✅ **Certification Issuance** (this folder)  
8. ✅ Hazard Assessment Profile → `Documents/dfd-hazard-assessment/`  
9. → Users & Roles (optional)
