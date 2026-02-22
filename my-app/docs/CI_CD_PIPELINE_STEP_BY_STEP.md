# CI/CD Pipeline — Step-by-Step Explanation

**Disaster Preparedness Training & Simulation System**

This document explains how to describe the CI/CD (Continuous Integration / Continuous Delivery) pipeline from **code creation** to **production**. Use it when presenting the diagram or writing about your deployment process.

---

## Overview

The pipeline has **three main phases**:

1. **Development** — Where code is written and tested locally  
2. **Version Control & CI/CD Pipeline** — Where code is stored, built, tested, and prepared for release  
3. **Deployment Environments** — Where the application runs (local, staging, production)

**Key technologies:** Cursor • VS Code • Git • GitHub • Postman • Hostinger • cPanel • PHP 8.x

---

## Phase 1: Development

### Step 1 — Developer and code creation

- A **developer** writes and edits code on a laptop.
- **Tools used:** **Cursor** and **VS Code** (Visual Studio Code) as the main code editors/IDEs.
- This is where all application logic, UI, and integrations (including the Gemini API) are created.

**How to explain it:**  
“We write the application code in Cursor and VS Code. This is where the disaster training platform—Laravel, React, and the Gemini API integration—is developed.”

---

### Step 2 — Web code (tech stack)

- The result of coding is **web application code**.
- **Technologies:** **PHP 8.x**, **Laravel** (PHP framework), and **Vite** (front-end build tool).
- The PHP elephant and `< />` symbols represent server-side and web markup/code.

**How to explain it:**  
“The project uses PHP 8.x with the Laravel framework for the backend, and Vite for building the front-end assets. This is the actual ‘web code’ that will run on the server.”

---

### Step 3 — Create code (build and refine)

- The **wrench** icon represents **creating and refining** the code: implementing features, fixing bugs, and preparing for tests.
- This step is the ongoing “create code” loop before changes are sent to version control.

**How to explain it:**  
“We continuously create and refine the code—adding features, fixing issues, and making sure everything works before we commit.”

---

### Step 4 — Local environment (XAMPP / Local)

- Code is first run and tested **locally** on the developer’s machine.
- **Environment:** **XAMPP** (or similar) for PHP and **local MySQL** (or SQLite).
- **Purpose:** Local testing, debugging, and making sure the app runs before pushing to GitHub.

**How to explain it:**  
“Before any code goes to GitHub, we run it locally using XAMPP and a local database. This lets us debug and test without affecting anyone else.”

---

## Phase 2: Version Control & CI/CD Pipeline

### Step 5 — Version control (Git / GitHub)

- All code is stored and managed in **Git**, hosted on **GitHub**.
- Developers **commit** and **push** changes; the repository is the single source of truth for the project.

**How to explain it:**  
“We use Git and GitHub for version control. Every change is committed and pushed so the whole team has the same codebase and we can track history.”

---

### Step 6 — Code (commit and push)

- This is the **start of the CI/CD loop**: new or updated code is **committed** and **pushed** to the repository.
- The pipeline is triggered when code enters the repo (e.g. on push or merge).

**How to explain it:**  
“When we push our code to GitHub, that’s the ‘Code’ step. It kicks off the rest of the pipeline: build, test, and deploy.”

---

### Step 7 — Build

- The pipeline **builds** the application and installs dependencies.
- For this project: **`composer install`** (PHP dependencies) and typically **`npm install`** and **`npm run build`** (front-end).
- Ensures the project can be built successfully with no missing packages.

**How to explain it:**  
“In the Build step, we run composer install and build the front-end so all dependencies are in place and the application compiles correctly.”

---

### Step 8 — Plan (migrations)

- **Plan** covers **database migrations**: updating the database schema (tables, columns) to match the application.
- In Laravel this is done with **`php artisan migrate`** (and optionally **`php artisan db:seed`**).

**How to explain it:**  
“Plan is where we run database migrations so the database structure stays in sync with the code. This keeps staging and production consistent.”

---

### Step 9 — Test

- The application is **tested** automatically.
- Includes unit tests, integration tests, and (as shown in the diagram) **API testing**.
- **Postman** is used for **API testing** — checking that endpoints behave correctly.

**How to explain it:**  
“In the Test step we run automated tests and use Postman to verify our APIs. We only deploy if tests pass.”

---

### Step 10 — Deploy

- **Deploy** takes the tested code and puts it on a server.
- Actions typically include: **`git pull`** on the server and/or **GitHub Actions** (or similar) to run deploy scripts.
- For this project you can also use the **Admin Deployment** buttons (Git pull, then Laravel & build) on the server.

**How to explain it:**  
“Deploy means moving the approved code to the server—either via git pull and scripts or through our admin deployment page. GitHub Actions can automate this when we merge to a release branch.”

---

### Step 11 — Operate (cPanel)

- **Operate** is the day-to-day **management** of the live (or staging) environment.
- **cPanel** is used for server and hosting management (files, PHP settings, databases) on **Hostinger**.

**How to explain it:**  
“Operate is where we manage the server using cPanel on Hostinger—updating settings, checking logs, and keeping the application running.”

---

### Step 12 — Monitor

- After deployment, the system is **monitored** for health, performance, and errors.
- Includes watching server load, response times, and logs so issues can be fixed quickly.

**How to explain it:**  
“We monitor the application after release to catch errors and performance issues early and keep the training platform stable for LGU users.”

---

### Step 13 — Release

- **Release** is the moment the new version is **released** and available to users.
- The cycle then repeats: the next code changes go through the same pipeline (back to **Code**).

**How to explain it:**  
“Release is when the new version goes live. After that, we continue developing, and the next changes go through the same pipeline again.”

---

## Phase 3: Deployment Environments

### Production

- **What it is:** The **live** system used by real users (LGU staff, trainers, participants).
- **Stack:** Apache, PHP 8.x, cPanel, Hostinger, live database.
- **Purpose:** Stable, production-ready application (e.g. disaster-training.alertaraqc.com).

**How to explain it:**  
“Production is our live site on Hostinger. It runs on Apache and PHP 8.x, with a real database. This is what the LGU uses every day.”

---

### Staging

- **What it is:** A **near-copy of production** used for final checks before going live.
- **Uses:** Smoke tests, sandbox data, **User Acceptance Testing (UAT)**, staging database.
- **Purpose:** Validate that new features and fixes work correctly without risking production.

**How to explain it:**  
“Staging is a copy of production where we run smoke tests and UAT. We only push to production after everything passes on staging.”

---

### XAMPP / WAMP (Local)

- **What it is:** The **developer’s local** environment (same idea as in Phase 1).
- **Includes:** Local MySQL (or SQLite), developer tools, debugging, local testing.
- **Purpose:** Fast iteration and debugging on the developer’s machine.

**How to explain it:**  
“Local is each developer’s own environment—XAMPP or similar—with a local database. We use it for daily development and debugging before pushing to GitHub.”

---

## Quick reference: order of steps

| Order | Phase        | Step              | What happens                                      |
|-------|--------------|-------------------|---------------------------------------------------|
| 1     | Development  | Developer + IDEs  | Write code in Cursor / VS Code                    |
| 2     | Development  | Web code          | Laravel, PHP 8.x, Vite stack                      |
| 3     | Development  | Create code       | Implement and refine features                    |
| 4     | Development  | Local (XAMPP)     | Run and test locally                             |
| 5     | CI/CD        | Version control   | Push code to Git / GitHub                        |
| 6     | CI/CD        | Code              | Commit/push starts the pipeline                  |
| 7     | CI/CD        | Build             | composer install, npm build                      |
| 8     | CI/CD        | Plan              | Database migrations                              |
| 9     | CI/CD        | Test              | Automated tests + Postman API testing            |
| 10    | CI/CD        | Deploy            | git pull / GitHub Actions / Admin Deploy         |
| 11    | CI/CD        | Operate           | Manage server (cPanel)                            |
| 12    | CI/CD        | Monitor           | Watch health and performance                     |
| 13    | CI/CD        | Release           | New version live → cycle repeats                 |
| —     | Environments | Production        | Live site (Hostinger)                             |
| —     | Environments | Staging           | UAT and smoke tests                               |
| —     | Environments | Local             | Developer machines (XAMPP)                       |

---

## One-paragraph summary (for reports or oral defense)

*“Our CI/CD pipeline starts in the Development phase, where we write code in Cursor and VS Code using Laravel, PHP 8.x, and Vite, and test it locally with XAMPP. We then push our code to GitHub (Version Control). The CI/CD pipeline takes over: it builds the project with composer and npm, runs database migrations, and executes tests including Postman API tests. If everything passes, we deploy to the server via git pull or GitHub Actions and manage the environment with cPanel on Hostinger. We use three environments—local for development, staging for UAT and smoke tests, and production for the live Disaster Preparedness Training & Simulation System—and we monitor the system after each release.”*

---

*Reference: CI/CD Pipeline diagram — Disaster Preparedness Training & Simulation System.*
