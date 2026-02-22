# API Gateway – Table of Endpoints

This document is a **template/reference** for the table of gateway API. It matches the architecture where **Web/Mobile Users (LGU Staff, Trainers, Responders)** send requests to an **API Gateway**, which routes to these backend services:

1. **Authentication & Authorization**
2. **Disaster Training Management** → Training Database
3. **Simulation Engine** → Simulation Results Database
4. **AI Scenario Generation** → Gemini AI API
5. **Logging & Monitoring**

Use the tables below to list every endpoint that goes through the gateway. You can change paths, add rows, or add columns (e.g. Request body, Response codes).

---

## 1. Authentication & Authorization Services

| Method | Endpoint (path) | Description | Auth required |
|--------|------------------|-------------|---------------|
| GET | `/admin/login` | Show admin login page | No |
| POST | `/admin/login` | Admin login (credentials) | No |
| GET | `/admin/login/method` | Show login method (password/OTP) | No |
| POST | `/admin/login/method` | Select login method | No |
| GET | `/admin/login/verify` | Show OTP verify page | No |
| POST | `/admin/login/verify` | Verify admin OTP | No |
| POST | `/admin/login/resend-otp` | Resend OTP | No |
| GET | `/admin/usb-check` | Show USB key check | No |
| POST | `/admin/usb-check` | Verify USB key | No |
| GET | `/participant/login` | Show participant login | No |
| POST | `/participant/login` | Participant login | No |
| GET | `/participant/register` | Show participant registration | No |
| POST | `/participant/register/start` | Start registration | No |
| GET | `/participant/register/verify` | Show verify step | No |
| POST | `/participant/register/verify` | Submit verification | No |
| GET | `/participant/register/verify-email/{token}` | Verify email link | No |
| GET | `/auth/centralized` | Centralized login (JWT from login.alertaraqc.com) | No |
| GET | `/auth/centralized/logout` | Centralized logout | Session |
| POST | `/logout` | Logout | Session |
| GET | `/password/reset` | Show password reset request | No |
| POST | `/password/email` | Send reset link | No |
| GET | `/password/reset/{token}` | Show reset form | No |
| POST | `/password/reset` | Submit new password | No |
| GET | `/session/activity` | Ping session activity (keep-alive) | Yes |
| GET | `/session/config` | Get session config (timeout, etc.) | Yes |

*Add or edit rows so this table is the single source of truth for auth endpoints.*

---

## 2. Disaster Training Management Services → (Training Database)

| Method | Endpoint (path) | Description | Auth required |
|--------|------------------|-------------|---------------|
| GET | `/training-modules` | List training modules | Yes |
| GET | `/training-modules/create` | Show create form | Yes |
| POST | `/training-modules` | Create module | Yes |
| GET | `/training-modules/{id}` | Show module | Yes |
| GET | `/training-modules/{id}/edit` | Show edit form | Yes |
| PUT | `/training-modules/{id}` | Update module | Yes |
| POST | `/training-modules/{id}/publish` | Publish module | Yes |
| POST | `/training-modules/{id}/archive` | Archive module | Yes |
| DELETE | `/training-modules/{id}` | Delete module | Yes |
| POST | `/training-modules/{id}/lessons` | Add lesson | Yes |
| PUT | `/training-modules/{id}/lessons/{lessonId}` | Update lesson | Yes |
| DELETE | `/training-modules/{id}/lessons/{lessonId}` | Delete lesson | Yes |
| POST | `/training-modules/{id}/lessons/{lessonId}/completion` | Toggle lesson completion | Yes |
| POST | `/training-modules/{id}/lessons/{lessonId}/materials` | Add material | Yes |
| DELETE | `/training-modules/{id}/lessons/{lessonId}/materials/{materialId}` | Delete material | Yes |
| GET | `/resources` | List resources (API) | No (or Yes – adjust as needed) |
| GET | `/resources/available` | List available resources | No |
| GET | `/resources/{id}/history` | Resource maintenance history | No |
| GET | `/barangay-profile` | Barangay profile (admin) | Yes |
| *(add certification, evaluations, etc. as needed)* | | | |

*Map all training-related and resource endpoints here. Add rows for certification, evaluations, exports, etc.*

---

## 3. Simulation Engine Services → (Simulation Results Database)

| Method | Endpoint (path) | Description | Auth required |
|--------|------------------|-------------|---------------|
| GET | `/scenarios` | List scenarios | Yes |
| GET | `/scenarios/create` | Show create scenario | Yes |
| POST | `/scenarios` | Create scenario | Yes |
| GET | `/scenarios/{id}` | Show scenario | Yes |
| GET | `/scenarios/{id}/edit` | Edit scenario | Yes |
| PUT | `/scenarios/{id}` | Update scenario | Yes |
| POST | `/scenarios/{id}/publish` | Publish scenario | Yes |
| POST | `/scenarios/{id}/archive` | Archive scenario | Yes |
| DELETE | `/scenarios/{id}` | Delete scenario | Yes |
| POST | `/scenarios/{id}/injects` | Add inject | Yes |
| DELETE | `/scenarios/{id}/injects/{injectId}` | Delete inject | Yes |
| POST | `/scenarios/{id}/expected-actions` | Add expected action | Yes |
| DELETE | `/scenarios/{id}/expected-actions/{actionId}` | Delete expected action | Yes |
| GET | `/simulation-events` | List simulation events | Yes |
| GET | `/simulation-events/create` | Show create event | Yes |
| POST | `/simulation-events` | Create event | Yes |
| GET | `/simulation-events/{id}` | Show event | Yes |
| GET | `/simulation-events/{id}/edit` | Edit event | Yes |
| PUT | `/simulation-events/{id}` | Update event | Yes |
| POST | `/simulation-events/{id}/publish` | Publish event | Yes |
| POST | `/simulation-events/{id}/unpublish` | Unpublish event | Yes |
| POST | `/simulation-events/{id}/start` | Start event | Yes |
| POST | `/simulation-events/{id}/complete` | Complete event | Yes |
| POST | `/simulation-events/{id}/cancel` | Cancel event | Yes |
| POST | `/simulation-events/{id}/archive` | Archive event | Yes |
| DELETE | `/simulation-events/{id}` | Delete event | Yes |
| POST | `/simulation-events/{id}/register` | Register for event | Yes |
| POST | `/simulation-events/{id}/cancel-registration` | Cancel registration | Yes |
| GET | `/simulation-events` (API) | List events (e.g. for mobile) | No |
| GET | `/simulation-events/completed-with-resources` | Completed events with resources | No |
| *(add evaluation, attendance, event registrations routes as needed)* | | | |

*Add any evaluation, attendance, or results endpoints that belong to the Simulation Engine.*

---

## 4. AI Scenario Generation Services → (Gemini AI API)

| Method | Endpoint (path) | Description | Auth required |
|--------|------------------|-------------|---------------|
| POST | `/scenarios/generate-ai` | Generate scenario using AI (Gemini) | Yes |

*Add any other AI-related endpoints (e.g. generate injects, suggest actions) here.*

---

## 5. Logging & Monitoring Services

| Method | Endpoint (path) | Description | Auth required |
|--------|------------------|-------------|---------------|
| GET | `/audit-logs` | Audit logs page (SPA) | Yes |
| GET | `/api/audit-logs` | Audit log history (API) | Yes |
| GET | `/api/audit-logs/export` | Export audit logs | Yes |
| GET | `/api/user-monitoring/status` | User online/inactive status | Yes |

*Add metrics, health checks, or other logging/monitoring endpoints here.*

---

## Optional: Admin & System (not in diagram)

If you want to document admin-only or deployment endpoints in the same file, you can add:

| Method | Endpoint (path) | Description | Auth required |
|--------|------------------|-------------|---------------|
| GET | `/admin/deploy` | Deployment dashboard page | Yes (LGU_ADMIN) |
| POST | `/admin/deploy/git-pull` | Run git pull step | Yes (LGU_ADMIN) |
| POST | `/admin/deploy/laravel-build` | Run Laravel + npm build step | Yes (LGU_ADMIN) |
| GET | `/admin/users` | Admin user management | Yes |
| GET | `/admin/roles` | Roles | Yes |
| GET | `/admin/permissions` | Permissions | Yes |
| GET | `/admin/user-monitoring` | User monitoring page | Yes |

---

## How to use this file

1. **Keep one row per endpoint** that goes through the gateway.
2. **Path**: Use the path the gateway exposes (e.g. `/auth/login` or `/api/v1/training/modules` if you version).
3. **Auth required**: Yes / No / Session / Role (e.g. LGU_ADMIN).
4. **Add columns** if you need: Request body, Response type, Rate limit, etc.
5. When you add or remove routes in the app, update this table so it stays the single source of truth for the gateway API.

Your architecture (single gateway → five services) is clear and scalable. This table documents the *contract* of what the gateway exposes so you (or another system) can implement or replicate it correctly.
