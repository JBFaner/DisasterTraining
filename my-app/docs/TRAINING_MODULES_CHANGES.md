# Training Modules – Changes Reference

This document summarizes the UI/UX changes made to the Training Modules section. Use it as a reference for what was implemented and where.

---

## 1. Training Modules List (`/training-modules`)

### 1.1 Card view (replaced table)
- **Layout:** Responsive grid — 1 column (mobile), 2 (tablet), 3 (desktop).  
  Classes: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5`
- **Each card includes:**
  - Small **module icon** (BookOpen in rounded box)
  - **Title** (e.g. “Training Earthquake Drill”)
  - **Pills:** Disaster type (amber), Difficulty (emerald), Status (published/draft/etc.)
  - **Created date** (e.g. “Created: Feb 20, 2026”)
  - **Actions:** View, Publish (draft only), Edit, Archive, Delete — each as **Icon + label** (e.g. “View”, “Edit”) with `rounded-lg` and hover styles

### 1.2 Micro-interactions
- **Cards:** `rounded-2xl`, `shadow-md`, `hover:shadow-xl`, `hover:-translate-y-1`, `transition-all duration-300 ease-out`
- **Page load:** Staggered fade-in via CSS class `training-module-card-enter` and `animationDelay` per card
- **Status badges:** `transition-all duration-200`
- **Buttons:** `hover:shadow-sm`, `transition-all duration-200`

### 1.3 Create button
- **Style:** `rounded-xl`, `shadow-md`, `hover:shadow-lg`, `hover:-translate-y-0.5`
- **Gradient:** `bg-gradient-to-r from-emerald-500 to-emerald-600` (hover darker)
- **Content:** Plus icon + “Create Training Module”

### 1.4 Empty states
- **No modules at all:**  
  Illustration (e.g. 📦), “No training modules yet.”, “Create your first disaster simulation module to begin.”, primary CTA button
- **No results from filters:**  
  🔍, “No modules match your filters.”, “Try adjusting search or filter criteria.”, “Clear filters” button

### 1.5 CSS (in `resources/css/app.css`)
- `@keyframes training-module-fade-in` — opacity 0→1, translateY 12px→0
- `.training-module-card-enter` — `opacity: 0` + animation, used for cards and form

---

## 2. Training Module Detail / Lessons (`/training-modules/:id`)

### 2.1 Back link & module header
- **Back:** ChevronLeft icon + “Back to Training Modules”, hover transition
- **Module card:** `rounded-2xl`, `shadow-md`, `hover:shadow-lg`. Meta pills: Difficulty, Disaster type (amber), Status (emerald). Edit button: `rounded-xl`, hover shadow

### 2.2 Lessons as cards (replaced list)
- **Layout:** `grid grid-cols-1 sm:grid-cols-2 gap-4`
- **Each lesson card:**
  - **Style:** `rounded-2xl`, `shadow-md`, `hover:shadow-xl`, `hover:-translate-y-1`, `transition-all duration-300 ease-out`
  - **Content:** FileText icon, lesson #, title, description (line-clamp-2), materials (pills or “No materials”)
  - **Actions row:** [View] (opens modal), [Remove] (with confirm). `stopPropagation` so clicks don’t open lesson
  - **Add material:** Form (type, label, url) + list of materials with Remove, in a bottom section with border-top

### 2.3 Add Lesson sidebar
- **Container:** `rounded-2xl`, `shadow-md`, `hover:shadow-lg`, `p-5`
- **Inputs:** `rounded-xl`, focus ring
- **Submit:** Full-width gradient button, Plus icon + “Add lesson”, `rounded-xl`, hover lift

### 2.4 Empty state (no lessons)
- Centered block: 📖, “No lessons yet.”, “Add your first lesson using the form on the right.”

### 2.5 CSS
- `.lesson-card-enter` — same fade-in keyframes as training module cards

---

## 3. Create Training Module (`/training-modules/create`)

### 3.1 Layout
- **Container:** `w-full max-w-full`
- **Grid:** `grid grid-cols-1 lg:grid-cols-12 gap-6`
  - **Form:** `lg:col-span-8` (wider, ~2/3)
  - **Right sidebar:** `lg:col-span-4` — Module Writing Tips + Quick Templates

### 3.2 Page header
- Back link with ChevronLeft
- BookOpen icon in emerald rounded box + “Create Training Module” + subtitle “Add a new disaster preparedness training module”

### 3.3 Form
- **Controlled fields:** Title, description, difficulty, disaster type (for Quick Templates auto-fill)
- **Inputs:** `rounded-xl`, shared `inputClass` / `labelClass`
- **Learning objectives:** Toggle “Hide/Show Objectives” (gradient button), add/remove objectives, rounded-xl remove buttons
- **Submit:** “Create Module” with Plus icon, gradient, `rounded-xl`, shadow, hover lift  
- **Cancel:** `rounded-xl`, border, hover shadow

### 3.4 Right sidebar – Module Writing Tips
- **Card:** ClipboardList icon, title “Module Writing Tips”
- **Bullets:**
  - Keep title clear and scenario-based
  - Limit description to 3–5 sentences
  - Objectives should be measurable
  - Match difficulty to target participants

### 3.5 Right sidebar – Quick Templates
- **Card:** Zap icon, title “Quick Templates”, subtext “Click one to auto-fill the form.”
- **Templates (click to fill form):**
  1. **Basic Earthquake Drill** — Beginner, Earthquake, sample title/description/objectives  
  2. **Fire Evacuation Drill** — Beginner, Fire  
  3. **Flood Response Simulation** — Intermediate, Flood  
- **Data filled:** title, description, difficulty, disaster type, learning objectives (array). Objectives section is shown when a template is applied.
- **Disaster type select:** If barangay has hazards, options = hazards + Earthquake, Fire, Flood so template values always appear.

---

## 4. Pagination (shared; used on `/training-modules` and others)

### 4.1 Container
- **Before:** Flat bar, `border-t`, `bg-slate-50`
- **After:** Card-style — `rounded-2xl`, `bg-white`, `border border-slate-200`, `shadow-sm`, `px-5 py-4`

### 4.2 “Showing” text
- Format: **X** – **Y** of **Z** results (en dash, bold numbers)

### 4.3 Prev/Next
- `rounded-xl`, fixed height `h-9`, hover shadow and border. Disabled: reduced opacity, no hover

### 4.4 Page number buttons
- `rounded-xl`. **Current:** gradient `from-emerald-500 to-emerald-600`, white text, shadow. **Others:** white, hover emerald-50 / emerald border / emerald text
- Ellipsis “…” with consistent spacing

### 4.5 Other
- Transitions: `duration-200`. Mobile: page controls first, then “Showing” text. `type="button"` and `aria-label` on prev/next.

---

## 5. Files touched

| Area              | File(s) |
|-------------------|--------|
| List + Create + Detail | `resources/js/app.jsx` |
| Card/lesson animations | `resources/css/app.css` |
| Pagination       | `resources/js/app.jsx` (shared `Pagination` component) |

---

## 6. Quick reference – main classes

- **Card container:** `rounded-2xl shadow-md border border-slate-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 ease-out`
- **Primary button:** `rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-md hover:shadow-lg transition-all duration-200 ease-out hover:-translate-y-0.5`
- **Input:** `rounded-xl border border-slate-300 ... focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-shadow duration-200`
- **Fade-in:** `.training-module-card-enter` / `.lesson-card-enter` + `animationDelay` for stagger

---

*Last updated as a reference for Training Modules changes.*
