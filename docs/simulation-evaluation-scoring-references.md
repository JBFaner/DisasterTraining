# Simulation Evaluation & Scoring — References

Document for panel defense / Q&A: where our scoring and evaluation ideas came from.

**Project:** DisasterTraining — Simulation Event Attendance → Evaluation & Scoring → Post Evaluation  
**Focus:** Local Philippine practice for drills / simulation exercises (LGU, BFP, NSED-style)

---

## How we used these sources

| Source type | What we borrowed | How we adapted it in the system |
|-------------|------------------|----------------------------------|
| BFP fire drill checklist | Phases (alarm → mobilization → evacuation/medical → demobilization) and Excellent / Satisfactory / Poor banding | Converted to **per-participant** criteria (0–10 each) + competency labels |
| NSED / DepEd earthquake drill forms | Duck-Cover-Hold, alarm clarity, buddy system, route compliance, accountability | Mapped to individual scoring items for earthquake simulations |
| Community drill / LGU after-action guides | Problems encountered, participation, lessons learned, recommendations | Used for **Post Evaluation** (event-level debrief), not individual scores |

We did **not** copy any form verbatim as a legal requirement. We used them as **practice-aligned design references** for criteria that Filipino evaluators and LGUs already recognize.

---

## Primary references (Philippines)

### 1. Bureau of Fire Protection (BFP) — Fire Drill Evaluation Checklist

- **Form:** FSID-11F *Fire Drill Evaluation Checklist* (Rev 00)
- **Official forms page:** [BFP Fire Safety Information Division (FSID) Forms](https://bfp.gov.ph/fsid-forms/)
- **Direct download (Word):** [FSID-11F Fire Drill Evaluation Checklist](https://bfp.gov.ph/wp-content/uploads/2023/09/FSID-11F-Fire-Drill-Evaluation-Checklist-Rev00.docx)
- **What it covers:**
  - Incident / Alarm phase
  - Mobilization / Response phase
  - Evacuation and emergency medical operations
  - Demobilization / critique
- **Scoring idea often cited in local practice:** count of “Yes” items → Excellent / Satisfactory / Poor bands (commonly referenced as roughly 18–25 / 9–17 / 0–8 on longer checklists used in barangay drills)

**Talking point:** *“Our fire-related criteria follow BFP drill evaluation phases—alarm response, safe firefighting role, evacuation accountability—then score each participant instead of only a barangay Yes/No sheet.”*

---

### 2. National Simultaneous Earthquake Drill (NSED) — NDRRMC guidance

- **Document:** NDRRMC Memorandum No. 71, s. 2020 — *Interim Guidelines on the Conduct of NSED*  
  (CSC / NDRRMC dissemination copy commonly used by agencies)
- **Example hosted copy:** [NDRRMC Memorandum No. 71, s. 2020 (PDF)](https://www.csc.gov.ph/phocadownload/userupload/irmo/announcements/2020/AnnouncementNo27s2020/NDRRMC%20Memorandum%20No.%2071,%20s.%202020%20Interim%20Guidelines%20on%20the%20Conduct%20of%20NSED.pdf)
- **What we used conceptually:**
  - Drill/exercise as a preparedness activity with evaluation after conduct
  - Role of evaluators / exercise evaluation in government practice
  - Alignment with national drill culture (not a software standard, but institutional context)

**Talking point:** *“NSED establishes that earthquake drills are evaluated as a formal preparedness activity; our earthquake criteria mirror common NSED school/LGU observation items.”*

---

### 3. Earthquake drill evaluation forms (DepEd / LGU / school practice)

- **Example format widely used locally:** *Annex A – Earthquake Drill Evaluation Form* (evaluation of the Disaster Control Group / drill participants)
- **Public mirror example:** [Annex A Earthquake Drill Evaluation Form (PDFCoffee mirror)](https://pdfcoffee.com/annex-a-earthquake-drill-evaluation-form-evaluation-of-the-disaster-control-group-pdf-free.html)
- **Typical rated items (1–5 scale in many school forms):**
  - Alarm loud enough / heard by participants
  - Duck, Cover, and Hold during alarm
  - Wait for alarm to stop before evacuating
  - Buddy-buddy system
  - Evacuation route compliance
  - Head protection while vacating
  - Injury check / accountability at assembly
  - Site security, maintenance, communications team protocols

**Talking point:** *“We adapted the 1–5 observer checklist into 0–10 participant scores so trainers can grade individuals after attendance is marked Present.”*

---

### 4. Community drill after-action / LGU practice

- **Guide:** *Guide to Conducting a Community Drill* (Resilient Philippines / community DRRM materials)
- **Resource portal:** [Resilient Philippines resources](http://resilientphilippines.com/)
- **Debrief questions commonly emphasized:**
  - What problems were encountered and how were they resolved?
  - How did the BDRRMC / task groups perform?
  - Level of community participation
  - Lessons learned and improvements for the next drill / contingency plan

**Talking point:** *“Post Evaluation in our system is the after-action review—remarks, problems, recommendations, lessons learned—matching LGU community drill debrief practice.”*

---

### 5. Barangay DRRM planning quality / drills in M&E (contextual)

- **Document:** LGA *Quality Assessment Tool* for BDRRM Plans (includes drills/simulations under monitoring & evaluation practice)
- **Example host:** [LGA publication attachment (PDF)](https://cdn.lga.gov.ph/publication/attachments/1704791839.pdf)
- **Why cited:** supports that **regular drills/simulations** and **review/updating** are expected in barangay DRRM practice—not that this PDF defines our score sheet.

---

### 6. Related BFP operational forms (supporting context)

- **FSID forms index:** https://bfp.gov.ph/fsid-forms/
- **FSED forms (e.g. Certification for Fire Drill):** https://bfp.gov.ph/fsed-forms/
- Useful if panelists ask whether fire drills are formally documented by BFP (yes—evaluation checklist + related certificates/reports exist in BFP form sets).

---

## Legal / policy backdrop (optional if asked “under what law?”)

These are **policy context**, not the scoring spreadsheet itself:

| Instrument | Relevance |
|------------|-----------|
| **RA 10121** — Philippine Disaster Risk Reduction and Management Act of 2010 | Institutionalizes DRRM; LGUs conduct preparedness activities including drills |
| **NDRRMC issuances on NSED** | National simultaneous earthquake drill practice and evaluation culture |
| **BFP fire safety / community fire volunteer practice** | Fire drill evaluation and barangay fire preparedness documentation |

---

## Mapping: reference → our system criteria

Configured in: `my-app/config/simulation_evaluation.php`

### Core criteria (all hazard types)

1. Alarm recognition and immediate response  
2. Evacuation discipline and route compliance  
3. Accountability at assembly / headcount participation  
4. PPE and personal safety compliance  
5. Following marshal / Incident Commander instructions  
6. Communication and teamwork during the drill  
7. Serious participation and role performance  

### Hazard add-ons

- **Fire:** extinguisher/role handling; safe distance / upwind position *(BFP mobilization & PPE themes)*  
- **Earthquake:** Duck-Cover-Hold; wait for all-clear; buddy/head protection *(NSED / school forms)*  
- **Flood:** early warning response; assist vulnerable persons *(community evacuation practice)*  

### Scoring model in-app

- Each criterion: **0–10**  
- Pass threshold: **70%**  
- Competency: **Excellent / Good / Satisfactory / Needs Improvement**  
  *(aligned with BFP-style Excellent / Satisfactory / Poor language, expanded for training feedback)*

### Process gate (design decision grounded in practice)

1. Mark attendance (**Present / Late**)  
2. Evaluate only attendees who checked in  
3. Complete event  
4. Post Evaluation (event debrief)

**Talking point:** *“You cannot fairly score someone who did not participate or was absent—same idea as evaluating only drill participants who actually joined.”*

---

## Suggested short answer if a panelist asks

> “We based the criteria on local Philippine drill evaluation practice—especially the **BFP Fire Drill Evaluation Checklist (FSID-11F)** for fire phases and PPE/response, **NSED / DepEd-style earthquake observation forms** for Duck-Cover-Hold and evacuation discipline, and **LGU community drill after-action guides** for post-exercise lessons learned. We adapted those into per-participant 0–10 scores with a 70% pass mark so our trainers can score individuals after attendance, then capture an event-level debrief in Post Evaluation.”

---

## Files in this repo

| File | Purpose |
|------|---------|
| `my-app/config/simulation_evaluation.php` | Default criteria + pass threshold |
| `my-app/app/Support/SimulationEvaluationCriteria.php` | Resolves scenario vs default criteria |
| `my-app/database/seeders/SimulationEvaluationCriteriaSeeder.php` | Applies defaults to scenarios |

---

## Note on citations

- Prefer citing **official BFP / NDRRMC / LGA** pages when possible.  
- PDFCoffee / Scribd mirrors are **examples of forms in circulation**; if the panel asks for the official copy, point to **bfp.gov.ph** (FSID-11F) and **NDRRMC memo** PDFs.  
- Keep a downloaded copy of FSID-11F and NSED Memo 71 in your defense folder for offline showing.
