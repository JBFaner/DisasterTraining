# CI/CD Pipeline — Disaster Preparedness Training & Simulation System

Visual presentation of the pipeline from **code creation (Cursor AI, VS Code)** to **deployment (Hostinger)**.

**Key technologies:** Cursor · VS Code · Git · GitHub · Laravel 12 · PHP 8.x · Node.js · Vite · Postman · Hostinger · cPanel (or SSH)

---

## Pipeline overview (Mermaid)

Copy the block below into any Mermaid-supported viewer (GitHub, VS Code with Mermaid extension, or [mermaid.live](https://mermaid.live)) to render the diagram.

```mermaid
flowchart LR
    subgraph DEV["DEVELOPMENT"]
        A[Developer]
        B[Cursor AI / VS Code]
        C[Web Code<br/>Laravel · React · PHP 8.x · Vite]
        A --> B --> C
    end

    subgraph VC["VERSION CONTROL"]
        G[GitHub]
    end

    subgraph PIPELINE["CI/CD PIPELINE"]
        direction TB
        P1[Code<br/>Commit & Push]
        P2[Build<br/>composer install<br/>npm install]
        P3[Plan<br/>migrations]
        P4[Test<br/>PHPUnit · Postman API]
        P5[Deploy<br/>git pull · Admin Deploy or GitHub Actions]
        P6[Operate<br/>Hostinger cPanel / SSH]
        P7[Release]
        P1 --> P2 --> P3 --> P4 --> P5 --> P6 --> P7 --> P1
    end

    subgraph ENV["DEPLOYMENT ENVIRONMENTS"]
        E1[Production<br/>disaster-training.alertaraqc.com<br/>Apache · PHP 8.x · Live DB]
        E2[Staging<br/>UAT · Staging DB]
        E3[Local<br/>php artisan serve · npm run dev<br/>XAMPP / SQLite]
    end

    C --> G
    G --> P1
    P4 -.-> E2
    P6 --> E1
    C -.-> E3
```

---

## Linear pipeline (simplified)

```mermaid
flowchart LR
    subgraph Development
        D[Developer]
        IDE[Cursor / VS Code]
        CODE[Laravel + React<br/>PHP 8.x · Vite]
        D --> IDE --> CODE
    end

    subgraph VersionControl
        GIT[Git]
        GH[GitHub]
        GIT --> GH
    end

    subgraph Build
        C[composer install]
        N[npm install<br/>npm run build]
        C --> N
    end

    subgraph Deploy
        PULL[git pull]
        ART[php artisan migrate<br/>config:clear · cache:clear]
        PULL --> ART
    end

    subgraph Production
        H[Hostinger<br/>cPanel / SSH]
        LIVE[disaster-training.alertaraqc.com]
        H --> LIVE
    end

    CODE --> GIT
    GH --> C
    N --> PULL
    ART --> H
```

---

## Stage summary

| Stage | What happens |
|-------|----------------------|
| **Development** | Code in Cursor AI or VS Code (Laravel, React/JSX, PHP 8.x, Vite). Local run: `php artisan serve`, `npm run dev`. |
| **Version control** | Commit and push to Git → GitHub (or your repo). |
| **Build** | On server or in CI: `composer install`, `npm install`, `npm run build`. |
| **Plan** | `php artisan migrate --force` (and optional `db:seed`). |
| **Test** | PHPUnit, Postman for API; optional staging/UAT. |
| **Deploy** | **Option A:** Admin Deployment page (Git pull → Laravel & Build). **Option B:** SSH `git pull` then run Artisan + npm. **Option C:** GitHub Actions → Hostinger (if configured). |
| **Operate** | Hostinger: cPanel file manager, PHP settings, or SSH. |
| **Release** | Live at https://disaster-training.alertaraqc.com. |

---

## Deployment options on Hostinger

1. **Manual (SSH):** `cd /var/www/html/.../my-app` → `git pull` → `php artisan migrate --force` → `npm run build` (and clears as in Admin Deploy).
2. **Admin Deployment buttons:** Log in as LGU Admin → Deployment → Run Git Pull, then Run Laravel & Build (set `DEPLOY_*_PATH` in `.env` if needed).
3. **GitHub Actions (optional):** Add `.github/workflows/deploy.yml` to run on push and deploy to Hostinger via SSH or Hostinger API.

For a printable or slide-ready visual, open `docs/CI_CD_PIPELINE.html` in a browser or export the Mermaid diagrams from [mermaid.live](https://mermaid.live).
