# Sequence Diagrams — AlertaraQC

UML sequence diagrams for **Barangay San Agustin** pilot. One scenario per figure (thesis guideline).

**Open first:** `39_Sequence_All.drawio` (3 tabs)

| # | File | Scenario |
|---|------|----------|
| 1 | `39_Sequence_Admin_OTP_Login.drawio` | Admin login → OTP email → session |
| 2 | `40_Sequence_AI_Scenario.drawio` | Lead Trainer → Laravel → Gemini → DB |
| 3 | `41_Sequence_Publish_Event.drawio` | Readiness checklist → publish → monitoring |

## Regenerate

```bash
php Documents/sequence/generate_sequence.php
```

Exports `.drawio`, `.svg`, and `.png` (PNG via `@resvg/resvg-js` in `Documents/erd/`).

## Thesis captions

- **Figure __.** Sequence Diagram of Admin OTP Login for AlertaraQC.
- **Figure __.** Sequence Diagram of AI Scenario Generation (Gemini API).
- **Figure __.** Sequence Diagram of Simulation Event Publish (Readiness to Monitoring).

### Defense one-liner

> “Shows time-ordered calls for one critical feature.”

## Notation

- Solid arrow — synchronous request
- Dashed arrow — return message
- Open arrow — optional async notification (Campaign Planning, CPSQC)
