# BPMN — AS-IS and TO-BE

**System:** Disaster Preparedness Training & Simulation Platform  
**Case:** Barangay / LGU drill & simulation conduct (San Agustin focus)  
**Status:** Draft ready for manuscript (unchecked → completed here)

Use [mermaid.live](https://mermaid.live) or Draw.io BPMN shapes to redraw if your adviser requires classic BPMN notation. Mermaid below is the **authoritative process content**.

---

## 1. Narrative (paste under figures)

### AS-IS
Before the platform, barangay drills were largely manual. Trainers prepared static scenarios on paper or slides, attendance was recorded by hand, evaluation was delayed, and there was little reusable digital history linking campaign approval, exercise design, and after-action results. Coordination with external campaign scheduling and city partners was informal (chat/email), which made readiness hard to audit.

### TO-BE
With the platform, an **approved campaign** becomes an **exercise plan**, optionally from a **template**, then passes a **readiness** checklist (personnel, resources, hazard context). When ready, the event is **published** and **monitored** (attendance, evaluation, lifecycle). AI-assisted scenario generation and partner integrations (Campaign Planning / CPSQC where applicable) support repeatable, documented drills aligned with RA 10121 preparedness practice.

---

## 2. AS-IS BPMN (manual drill)

```mermaid
flowchart TB
  start([Start: Drill requested]) --> prep[Trainer prepares static scenario<br/>Paper / slides]
  prep --> notify[Notify participants<br/>Chat / bulletin / word-of-mouth]
  notify --> day{Drill day?}
  day -->|No| wait[Wait / reschedule manually]
  wait --> day
  day -->|Yes| attend[Manual attendance sheet]
  attend --> run[Conduct drill on-site]
  run --> notes[Handwritten evaluator notes]
  notes --> report[Delayed summary report<br/>Word / Excel]
  report --> archive[(Paper / personal drive)]
  archive --> end([End: Limited reuse])

  style start fill:#e2e8f0
  style end fill:#e2e8f0
  style archive fill:#fef3c7
```

**Pools/lanes to draw in Draw.io:** LGU Trainer | Participants | Barangay Officials (optional)

**Pain points to label on the diagram:** no AI scenarios · weak audit trail · no readiness gate · slow evaluation · hard to repeat

---

## 3. TO-BE BPMN (platform lifecycle)

**Protected product flow:** Approved Campaign → Exercise Plan → Use Template → Readiness → Publish → Monitoring

```mermaid
flowchart TB
  start([Start]) --> camp[Campaign request from Training Module]
  camp --> g6{Campaign Planning<br/>approve / reject?}
  g6 -->|Rejected| fix[Revise module / request]
  fix --> camp
  g6 -->|Approved| plan[Create Exercise Plan<br/>Simulation Event Planning]
  plan --> tmpl{Use Exercise Template?}
  tmpl -->|Yes| apply[Apply template timeline / roles]
  tmpl -->|No| custom[Custom plan setup]
  apply --> ready
  custom --> ready[Readiness checklist<br/>Personnel · Resources · Hazard profile]
  ready --> gate{Ready to publish?}
  gate -->|No| gap[Resolve gaps / reassign]
  gap --> ready
  gate -->|Yes| pub[Publish simulation event]
  pub --> mon[Monitoring<br/>Attendance · Lifecycle · Evaluation]
  mon --> aar[After-action / certificates / reports]
  aar --> end([End: Digitized, reusable record])

  style start fill:#dbeafe
  style end fill:#bbf7d0
  style gate fill:#fde68a
  style g6 fill:#fde68a
```

**Pools/lanes to draw in Draw.io:**
1. Lead Trainer / Admin (ops)
2. System (Laravel app)
3. External: Campaign Planning (Group 6), Gemini AI (scenario), optional CPSQC
4. Participants / Evaluator

---

## 4. BPMN element checklist (for Draw.io redraw)

| Element | AS-IS | TO-BE |
|---------|-------|-------|
| Start event | Drill requested | Campaign submitted |
| User tasks | Prepare scenario, notify, attendance | Plan exercise, readiness, publish |
| Service tasks | — | AI scenario generate, integrations |
| XOR gateway | Drill day? | Approve? Ready? |
| Data store | Paper archive | DB + supporting documents |
| End event | Limited reuse | Digitized AAR |

---

## 5. Suggested manuscript captions

- **Figure A.** BPMN Diagram (AS-IS) of Manual Barangay Disaster Drill Conduct  
- **Figure B.** BPMN Diagram (TO-BE) of Simulation Event Lifecycle in the Training Platform  

---

## 6. Defense talking points

1. AS-IS shows **fragmented** process; TO-BE shows **gated** digital lifecycle.  
2. Readiness gate prevents publishing incomplete exercises.  
3. External approve step mirrors real LGU multi-system coordination.  
4. Monitoring closes the loop with evaluation and certificates.
