# Architecture Diagrams (Thesis Figures)

Thesis-style architecture diagrams matching capstone reference layout (IaC, Monitoring, API Gateway, Communication Pattern).

## Figure 46 — Layered Application Architecture

Four-column thesis layout (Figure 34 style): Presentation → Application → Data → Integration layers.

| File | Description |
|------|-------------|
| `46_Application_Architecture_Layered.drawio` | Editable source |
| `46_Application_Architecture_Layered.png` | Thesis-ready image |
| `46_Application_Architecture_Layered.svg` | Vector source |
| `generate_layered_architecture.php` | Regenerate script |

**Thesis copy:** `my-app/docs/Application_Architecture_Layered.png`

**Note:** The `.drawio` file embeds SVG icons inside each module card (no extra stencil libraries needed in diagrams.net).

## Figure 43 — Infrastructure as Code (IaC)

Developer → GitHub (IaC + app code) → CI/CD → **Hostinger VPS** → 7 deployed modules.

| File | Description |
|------|-------------|
| `43_IaC_Infrastructure_as_Code.drawio` | Editable source |
| `43_IaC_Infrastructure_as_Code.png` | Thesis-ready image |
| `43_IaC_Infrastructure_as_Code.svg` | Vector source |

**Thesis copy:** `my-app/docs/IaC_Infrastructure.png`

## Figure 44 — Monitoring and Alerting

Trainers/Admins + Web App → Monitoring (session, activity, health) → Issue Detected? → Email/SMS alerts.

| File | Description |
|------|-------------|
| `44_Monitoring_and_Alerting.drawio` | Editable source |
| `44_Monitoring_and_Alerting.png` | Thesis-ready image |
| `44_Monitoring_and_Alerting.svg` | Vector source |

**Thesis copy:** `my-app/docs/Monitoring_Alerting.png`

## Figure 45 — API Gateway

Web Users · LGU Staff · Participants → Laravel edge (session, CSRF, RBAC) → Auth → Training → Simulation → Gemini AI → Logging.

| File | Description |
|------|-------------|
| `45_API_Gateway.drawio` | Editable source |
| `45_API_Gateway.png` | Thesis-ready image |
| `45_API_Gateway.svg` | Vector source |

**Thesis copy:** `my-app/docs/API_Gateway.png`

## Combined (3 tabs)

| File | Description |
|------|-------------|
| `43_45_Thesis_Architecture_All.drawio` | All three figures in one Draw.io file |

## Figure 38 — Communication & Interaction Pattern

Layered diagram (Figure 35 style): Users → HTTP/HTTPS → Web Application modules → MySQL → External APIs

| File | Description |
|------|-------------|
| `38_Communication_Interaction_Pattern.drawio` | Editable source (diagrams.net) |
| `38_Communication_Interaction_Pattern.png` | Thesis-ready image |
| `38_Communication_Interaction_Pattern.svg` | Vector source |
| `generate_communication_pattern.php` | Regenerate script |

**Thesis copy:** `my-app/docs/Communication_Interaction_Pattern.png`

## Modules shown (inside Web Application)

1. Auth Module  
2. Training Module  
3. AI Scenario Module  
4. Simulation Event Module  
5. Attendance Module  
6. Evaluation Module  
7. Certification Module  
8. **Hazard Assessment Module**  
9. Resource Inventory Module (internal)

## External services

- SMTP Email  
- SMS API (optional)  
- Google Gemini API  
- Group 6 Campaign API  
- Cloudinary CDN  
- Public Certificate Verifier (QR)

## Regenerate

```bash
php Documents/architecture/generate_layered_architecture.php
php Documents/architecture/generate_thesis_figures.php
php Documents/architecture/generate_communication_pattern.php
```

## Suggested caption

*Figure X. Communication and Interaction Patterns of the Disaster Preparedness Training and Simulation System, showing synchronous HTTPS communication from LGU users through modular Laravel/React services, MySQL persistence, and external integrations (Gemini, Campaign Planning, email, and media storage).*
