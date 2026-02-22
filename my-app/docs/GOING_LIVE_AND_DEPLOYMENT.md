# Going Live Checklist & Admin Deployment

This document covers (1) what to do before going live (Terms, Privacy, contact info) and (2) the admin-only deployment feature (Git pull and Laravel/build from the dashboard).

---

## Part 1: Before Going Live

### 1. Privacy Policy URL (Section 8 of Terms)

The Terms and Conditions page references “our Privacy Policy” but does not yet link to a URL.

- **File:** `resources/views/terms.blade.php`
- **Section 8:** “Privacy Policy Reference”
- **Action:** Either:
  - Add a link to your Privacy Policy in that section, e.g.:
    - `<a href="{{ url('/privacy') }}">Privacy Policy</a>` if you add a `/privacy` route and view, or
    - `<a href="https://your-domain.com/privacy">Privacy Policy</a>` for an external URL.
  - Or create a dedicated Privacy Policy page and add a route (e.g. `GET /privacy`) and link it in Section 8.

### 2. Contact Information (Section 16 of Terms)

Section 16 currently uses generic text: “contact the system administrator or the relevant LGU” and “Data Protection Officer of the LGU or AlertaraQC.”

- **File:** `resources/views/terms.blade.php`
- **Section 16:** “Contact Information”
- **Action:** Replace the placeholders with your real:
  - Support email
  - Physical/postal address (if applicable)
  - Data Protection Officer or LGU contact details

---

## Part 2: Admin-Only Deployment Feature

An admin-only deployment page lets LGU admins run **Step 1 (Git pull)** and **Step 2 (Laravel & build)** from the browser instead of typing commands over SSH.

### Overview

- **Who can use it:** Only users with role **LGU_ADMIN** (enforced in controller + routes in auth group).
- **Where:** Sidebar → **Deployment** (under Administration) → `/admin/deploy`.
- **What it does:**
  - **Step 1 – Git Pull:** `git stash` → `git pull` → `git stash pop` in the app root.
  - **Step 2 – Laravel & Build:** `php artisan migrate --force`, `db:seed --force`, `config:clear`, `cache:clear`, `route:clear`, `view:clear`, then `npm run build`.
- **Scope:** Only this app’s folder and this app’s database (from its `.env`). It does **not** deploy or change `.env`, and it does **not** affect other subdomains or systems (e.g. centralized login).

### Files and Routes

| Item | Location |
|------|----------|
| Controller | `app/Http/Controllers/DeployController.php` |
| Routes | `routes/web.php` (inside auth + session group) |
| React page | `resources/js/pages/DeploymentPage.jsx` |
| Sidebar link | `resources/js/components/SidebarLayout.jsx` |
| SPA wiring | `resources/js/app.jsx` (section `deployment`, breadcrumb, title) |

**Routes:**

- `GET /admin/deploy` → deployment page (DeployController@index)
- `POST /admin/deploy/git-pull` → run Git step (DeployController@gitPull)
- `POST /admin/deploy/laravel-build` → run Laravel + build step (DeployController@laravelBuild)

### DeployController Summary

- **index()** – Returns `view('app', ['section' => 'deployment'])` for the SPA; access restricted to LGU_ADMIN.
- **gitPull()** – Runs `git stash`, `git pull`, `git stash pop` from `base_path()`; returns JSON with command output and exit codes.
- **laravelBuild()** – Runs the Artisan commands and `npm run build` from `base_path()`; returns JSON with output.
- **canDeploy()** – Ensures the authenticated user’s role is `LGU_ADMIN`; otherwise 403 with a consistent JSON shape for the UI.

Auth is enforced by the route group (no `middleware('auth')` in the controller; Laravel 11+ base Controller does not support `$this->middleware()`).

### Working Directory

- All commands run in the **Laravel app root** via `Process::path(base_path())`.
- On production at `/var/www/html/disaster_training_alertaraqc/my-app`, `base_path()` is that folder. No extra config is required for the path.

### .env and Deployment

- The deployment flow **does not** deploy or overwrite `.env`. You can keep editing `.env` manually over SSH (DB, APP_KEY, etc.). Keep `.env` in `.gitignore` so `git pull` never overwrites it.

### When `git` / `php` / `npm` Are Not in PATH

The web server (or `php artisan serve`) often runs with a minimal PATH, so `git`, `php`, and `npm` may not be found and you’ll see “not recognized” errors.

**Fix:** Set full paths in `.env` so the deploy buttons use the correct executables:

```env
# Optional: full paths for deploy buttons (when not in web server PATH)
DEPLOY_GIT_PATH=/usr/bin/git
DEPLOY_PHP_PATH=/usr/bin/php
DEPLOY_NPM_PATH=/usr/bin/npm
```

- On Linux, get paths with: `which git`, `which php`, `which npm`.
- If you use **nvm**, npm might be e.g. `/home/youruser/.nvm/versions/node/v20.x.x/bin/npm`.
- These are documented in `.env.example` as optional.

### Production Notes

- Deploy actions run as the **web server user** (e.g. `www-data`). If `git` or `npm run build` fail (permissions, credentials, PATH), either:
  - Set `DEPLOY_*_PATH` in `.env` as above, and/or
  - Fix ownership/permissions for the app directory and `node_modules`, or
  - Run Git/build steps via SSH or a separate deploy script and use the Deployment page only when the environment is correctly set up.

### UI Behavior

- **DeploymentPage.jsx** has two buttons: “Run Git Pull” and “Run Laravel & Build”. Each sends a POST (with CSRF token) to the corresponding route and shows loading state and command output in a terminal-style block.
- 403 and network errors are handled and shown in the same output format so the UI does not break.

---

## Quick Reference

| Task | Where |
|------|--------|
| Set Privacy Policy URL | `resources/views/terms.blade.php` – Section 8 |
| Set contact/support info | `resources/views/terms.blade.php` – Section 16 |
| Deployment page | Sidebar → Deployment → `/admin/deploy` |
| Deploy executables not found | Add `DEPLOY_GIT_PATH`, `DEPLOY_PHP_PATH`, `DEPLOY_NPM_PATH` in `.env` |
| App root on server | Uses `base_path()` (e.g. `/var/www/html/disaster_training_alertaraqc/my-app`) |
