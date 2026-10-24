# SANCTUM — Ahmedabad University Library Focus Challenge

**SANCTUM** is a mobile-first, university-grade web application built for students who study inside the **Ahmedabad University Library**. It transforms everyday study blocks into a competitive, unbroken concentration challenge: students scan a universal QR code at their library desk, commit to an immersion target, and compete on the university leaderboard based **exclusively on their single best unbroken focus session**.

---

## 1. Visual & Product Identity

- **Design Aesthetic:** High-craft collegiate laboratory & architectural editorial aesthetic. Deep ink surfaces (`#0C0D0F`, `#121417`), warm parchment accents, and high-visibility **Electric Signal Flare** (`#FF5722`) highlights.
- **Typography:** Display typography powered by *Syne*, high-legibility interface typography with *Inter*, and tabular monospaced numbers with *JetBrains Mono*.
- **No Generic AI Patterns:** No generic purple gradients, no glassmorphism overload, and no SaaS template cards. Custom SVG dial with geometric radial tick divisions and live playhead beacon.

---

## 2. Strict Core Product & Scoring Rules

1. **Single Best Attempt Invariant:**
   - A student’s leaderboard score is strictly their **single highest unbroken duration achieved across all attempts** (completed or interrupted).
   - Multiple attempts are **NEVER summed, accumulated, or averaged together**.
   - *Example:*
     | Student | Challenge attempts | Best individual attempt | Leaderboard score | Final Rank |
     | :--- | :--- | :--- | :--- | :--- |
     | **Student D** | 1 hour, 30 min, 2 hours | 120 min | **120 min** | **1st** |
     | **Student A** | 30 min, 20 min, 1 hour | 60 min | **60 min** | **2nd** |
     | **Student B** | 45 min, 25 min, 35 min | 45 min | **45 min** | **3rd** |
     | **Student C** | 20 min, 28 min, 15 min | 28 min | **28 min** | **4th** |
   - **Interrupted attempts count:** If a student attempts a 1-hour challenge and leaves after 22 minutes, those 22 uninterrupted minutes count towards their personal best score.
   - **Previous best scores are preserved:** If a student already has a 45-minute personal record and later gets interrupted after 20 minutes, their score remains 45 minutes.
2. **Page Visibility Enforcement:**
   - Students must keep the challenge page visible on screen.
   - Leaving the page, switching apps (e.g. WhatsApp, Instagram), minimizing the browser, or locking the phone triggers the browser’s `visibilitychange` / `pagehide` events, immediately halting the attempt and saving the valid unbroken elapsed focus time.
3. **Screen Wake Lock API:**
   - The app automatically requests `navigator.wakeLock.request('screen')` when a challenge begins to keep the phone screen awake during active immersion.
4. **Server-Authoritative Timing:**
   - Client countdown display uses monotonic performance timestamps, but the server is the supreme scoring authority. Client-reported scores are bounded by server-validated timestamps to prevent tampering or drift.
5. **Deterministic Rankings & Tie-Breaking:**
   - 1st Priority: Highest `best_score_seconds` (DESC)
   - 2nd Priority: Earliest timestamp when that record was achieved (`best_achieved_at` ASC)
   - 3rd Priority: Stable student ID ASC tie-breaker.
6. **Student Privacy:**
   - Public leaderboards display student names and avatars/initials only. Student emails, student IDs, and private attempt logs are never exposed.

---

## 3. Technology Stack

- **Frontend:** React 18, TypeScript, Tailwind CSS, Lucide React, Canvas Confetti, QRCode generator.
- **Build Tool:** Vite 6 with proxy to FastAPI backend (`/api`).
- **Backend:** Python FastAPI, Pydantic, PyJWT (HMAC-SHA256 session cookies), Async Motor (MongoDB).
- **Database:** Online MongoDB Atlas cluster (or local MongoDB).
- **Authentication:** Google OAuth 2.0 restricted to `@ahduni.edu.in` accounts, plus local development authentication helper.

---

## 4. Universal Library QR Code & Poster

Students access the challenge by scanning a QR code placed on library desks and study carrels:

1. **Universal URL:** The QR code encodes only the root URL of the website: `https://<deployed-domain>/` (or `http://localhost:5173/` during testing).
2. **Session Resolution Flow:**
   - When scanned, `/` checks if the student has a valid session.
   - **Returning student with active session:** Redirected directly to `/timer`.
   - **Unauthenticated student:** Redirected to `/login`. Upon successful sign-in with their university account, returned to `/timer`.
3. **Built-in Poster Generator:**
   - Click the **QR Code icon** in the application header to open the interactive Library Poster modal.
   - Click **Download QR** (saves high-res PNG) or **Print Poster** to print desk cards directly.

---

## 5. Setup & Installation Guide

### Prerequisites
- **Python:** 3.10+ (Tested on Python 3.12)
- **Node.js:** v18+ (Tested on Node v24)
- **Online MongoDB Cluster:** MongoDB Atlas connection string URI (e.g. `mongodb+srv://...`)

---

### Step 1: Clone and Configure Environment

#### Backend Configuration
Navigate to the `backend/` folder and create `.env` (or copy from `.env.example`):
```bash
cd backend
cp .env.example .env
```
Fill in your configuration:
```env
ENVIRONMENT=development
DEBUG=True

# Online MongoDB Atlas Cluster URI
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxx.mongodb.net/?retryWrites=true&w=majority
MONGODB_DB_NAME=sanctum_db

# Permitted University Domain
ALLOWED_EMAIL_DOMAIN=ahduni.edu.in

# Session Secret (change to random 32+ char string in production)
SESSION_SECRET=sanctum-ahduni-dev-session-secret-key-2026-unbroken-focus
SESSION_COOKIE_NAME=sanctum_session
SESSION_COOKIE_SECURE=False

# Google OAuth (optional for local testing; use Dev Sign-In helper)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:5173/auth/callback

FRONTEND_ORIGIN=http://localhost:5173
DEV_AUTH_ENABLED=True
```

#### Frontend Configuration
Navigate to `frontend/` and create `.env`:
```bash
cd ../frontend
cp .env.example .env
```
```env
VITE_API_URL=
VITE_GOOGLE_CLIENT_ID=
```

---

### Step 2: Install Backend Dependencies & Start FastAPI

In the `backend/` folder:
```bash
cd backend

# If using a virtual environment:
python -m venv venv
# Windows:
venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# Install dependencies:
pip install -r requirements.txt
```

#### Run the Backend Server:
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
The FastAPI API documentation is available at: `http://localhost:8000/docs`

---

### Step 3: Install Frontend Dependencies & Start Vite

In the `frontend/` folder:
```bash
cd frontend

# Install npm packages:
npm install

# Start Vite development server:
npm run dev
```
The frontend is available at: `http://localhost:5173`

---

## 6. Running the Test Suites

### Backend Tests
The backend includes a comprehensive, self-contained automated test suite covering:
- Permitted domain verification (`@ahduni.edu.in` vs spoofed/malicious domains)
- Session JWT encoding and decoding
- Server-authoritative timing calculations and bounding
- Challenge creation and duration validation (1–240m)
- Duplicate active challenge prevention (409 Conflict)
- Strict single-best-attempt scoring invariant (separate attempts are never summed)
- Idempotent finalization
- Deterministic leaderboard ranking and privacy checks

Run the test suite:
```bash
cd backend
python run_tests.py
```
*(All 8 test suites execute and pass with zero failures.)*

### Frontend Tests
Using Vitest and React Testing Library:
```bash
cd frontend
npm test
```
Tests cover:
- Tabular digit countdown and human duration formatters
- Duration preset selection and custom stepper bounds
- Active FocusTimer display, screen wake lock status, and early conclusion flow

---

## 7. Google OAuth 2.0 Configuration

To configure Google OAuth with Ahmedabad University’s Google Workspace:

1. Open [Google Cloud Console](https://console.cloud.google.com/).
2. Create a Project (e.g., `AhdUni-Library-Focus`).
3. Configure the **OAuth Consent Screen**:
   - User Type: **Internal** (restricts logins to Ahmedabad University Google Workspace accounts).
   - Application Name: **Sanctum Library Focus**.
   - Authorized Domains: `ahduni.edu.in`.
4. Create **Credentials** -> **OAuth Client ID**:
   - Application Type: **Web application**.
   - Authorized JavaScript origins: `http://localhost:5173` (and production domain).
   - Authorized redirect URIs: `http://localhost:5173/auth/callback` (and production callback).
5. Copy the generated **Client ID** into:
   - `backend/.env` (`GOOGLE_CLIENT_ID=...`)
   - `frontend/.env` (`VITE_GOOGLE_CLIENT_ID=...`)

> **Note on Local Development Sign-in:** If Google OAuth credentials are not yet generated, Sanctum includes a built-in **Local Development Sign-in** on `/login` that allows entering any valid `@ahduni.edu.in` email to test all timer and leaderboard workflows. Non-university domains are rejected server-side even in dev mode.

---

## 8. Browser Limitations & Realistic Platform Guarantees

While the application implements standard modern web APIs to protect challenge integrity, standard browser sandboxes have inherent limitations:

1. **Page Visibility API (`document.visibilityState`):**
   - Reliably triggers when switching browser tabs, opening another app, minimizing, or locking the device.
   - However, split-screen views (where the browser remains partially visible) or certain transient OS dialogs / floating banners might not register as hidden.
2. **Screen Wake Lock API (`navigator.wakeLock`):**
   - Supported on modern mobile Chrome, Edge, and Safari 16.4+.
   - Browsers and operating systems may release wake locks under extreme low battery or OS thermal throttling.
   - When released, the UI displays a `"KEEP SCREEN ON"` status pill. Scoring continues accurately regardless of wake lock status.
3. **Network Disconnects:**
   - Active challenges record heartbeats every 6 seconds to minimize data loss.
   - Interruption requests use `fetch` with `keepalive: true` to maximize completion chances when tabs close.
