# LabScan — Known Limitations & Pending Items

This document lists known gaps in the current LabScan build. It is intended for whoever takes ownership of the system after handoff (the college's IT team and/or faculty administrators), so that issues are discovered here rather than in production.

> **Updated:** this revision was checked directly against the current codebase, not against the previous version of this document. Several items previously marked "fixed" are not actually true of the current code — they're corrected below.

---

## 1. Security — current status

- **Live secrets are shipped in this codebase, unrotated.** `server/.env` contains a real database password, real JWT secrets, and a real Cloudinary API secret — not placeholders. There is no `.env.example`, and no `.gitignore` excluding `.env`. **Action: rotate the database password, both JWT secrets, and the Cloudinary secret before this code is deployed anywhere reachable, and before it's ever pushed to a shared/public repo.** See the Admin Runbook, section 0.
- **No `.gitignore` exists.** `.env`, `node_modules/`, and build output are not excluded from version control anywhere in this codebase. Add one before using git with this project.
- **`POST /api/submissions` has no rate limiting.** This is the public, no-auth endpoint students use to submit observations. Only `POST /api/auth/register` currently has a rate limiter (10 requests / 15 minutes). A scripted client can submit to this endpoint at any rate.
- **Seed script is not hardened.** `server/prisma/seed.js` creates demo accounts with fixed, hardcoded passwords (`admin123`, `hod123`, `faculty123`, `student123`) and has no guard against running with `NODE_ENV=production`. Anyone who can read this codebase knows the demo credentials.
- **`GET /api/auth/me` returns a reduced set of fields.** It currently returns only `id`, `name`, `email`, `role`, `createdAt` — not `rollNumber`, `employeeId`, `department`, or `sectionId`. If any frontend page expects those fields from this endpoint, check it still works as intended.
- **The `/scan` → experiment-view flow is still gated**, and this part holds up: the underlying API call to fetch experiment/session data requires a valid authenticated session, so an unauthenticated visitor can't actually load experiment content even if they reach the page.

---

## 2. UI redesign — resolved

The visual redesign (dark theme, shared design tokens, Syne/Space Mono/DM Sans fonts) now covers the whole app, including the faculty session monitor, the submissions review page, and the student-facing join/scan pages. No follow-up needed here.

---

## 3. PDF report uploads — removed, not just unwired

The `reportPdfUrl` field and its associated Cloudinary upload path no longer exist anywhere in the database schema or backend code. This isn't a "backend exists, just needs a UI" situation anymore — if the college wants PDF lab-report submissions as part of the workflow, it needs to be designed and built from scratch (schema field, upload handling, and UI for upload/view/download).

---

## 4. Public submission endpoint — design tradeoff

`POST /api/submissions` intentionally requires **no login** — this is by design so students can submit without needing an account, identified only by a session code + roll number(s).

Tradeoffs to be aware of:

- Anyone who knows or guesses a valid session code can submit a fake entry with **any roll number** and a photo — the roll number is trusted client-side input, not verified against a logged-in identity.
- A submission can list **multiple comma-separated roll numbers** (for group work) — one photo can be credited to several students at once. This is useful for group experiments but also slightly widens the trust assumption above.
- There is currently **no rate limiting at all** on this endpoint (see section 1) — a determined user could script a large number of fake entries with no throttling.

**Recommended follow-up (not done in this build):** either tie submissions to a logged-in student session (removing the free-text roll number), or at minimum add a rate limiter to this endpoint matching or stricter than the one on registration.

This no-login design is a deliberate product decision, not a bug — flagging it, together with the missing rate limit, so the college can decide if the combined tradeoff is acceptable for their use case.

---

## 5. Architectural overlap: two parallel data models

The database schema currently has **two systems that overlap**:

1. **Legacy system** — `Experiment` / `Session` / `Submission`. A faculty member creates an Experiment linked to an ArUco marker, opens a Session with a join code, and students submit observations + photos against that session.
2. **Newer system** — `Section` / `Subject` / `SubjectAssignment` / `ExperimentSlot` / `StudentLabRecord`. The HOD assigns subjects to sections and faculty; each assignment has numbered experiment slots, and students accumulate `StudentLabRecord` entries (marks per slot).

**How they currently connect:** when a submission comes in, the backend tries to parse an `experimentNumber` out of the submission's `resultNotes` JSON field, and uses that number to find a matching `ExperimentSlot` (by `slotNumber`) in the student's section — then creates/updates a `StudentLabRecord`.

**Why this matters:**

- This bridging logic works but is fragile: it depends on `resultNotes` containing a specific JSON shape (`{ "experimentNumber": N }`), which isn't enforced by the schema — if the frontend ever stops sending this, marks silently stop syncing to `StudentLabRecord` with no error.
- New developers may not realize both systems exist, or which one is "current."

**Recommended follow-up (not done in this build):** pick one of:

- **Document clearly** which system is primary going forward (likely the newer Section/Subject/Slot model, since it supports marks and HOD oversight), and treat the legacy Experiment/Session/Submission model as the "delivery mechanism" that feeds into it — formalizing the bridge with a proper foreign key instead of JSON parsing.
- **Unify the models** in a future migration — e.g. add a direct `experimentSlotId` foreign key on `Submission` instead of inferring it from `resultNotes`.

---

## 6. New since last handoff: Admin CSV bulk-import

Admins can now bulk-create student accounts via `POST /api/admin/bulk-import/students` (CSV upload, ADMIN-only, 5 MB max, processed in batches of 100; template at `GET /api/admin/bulk-import/template`). Required columns: `name`, `email`, `rollNumber`, `department`, `password`; optional: `sectionId`. Duplicate emails/roll numbers are skipped and reported per-row rather than failing the whole import.

**Worth knowing:**

- Passwords are supplied as **plain text in the CSV**, and there's no forced-password-change-on-first-login feature — whoever holds that file holds live student passwords until each student changes their own. Recommend treating the file as sensitive and deleting it after use, and considering a forced-reset flow as a follow-up.
- The import has no dry-run/preview mode — errors are only reported after the batch runs.

---

## 8. ArUco marker generation — use `/marker-generator.html`, not a third-party site

Markers **must** be generated from the app's own `/marker-generator.html` page, which calls the same `AR.Dictionary.generateSVG()` function bundled in `client/public/aruco.js` that the scanner detects against.

**Why this exists:** third-party generators (e.g. chev.me/arucogen) can claim to support the same dictionary (`ARUCO_MIP_36h12`) but render it with a different bit-reading/orientation convention. The dictionary name matching is not sufficient — a marker printed from a different generator can scan as a completely different, wrong ID even though everything looks correctly configured. This caused a real incident where marker ID 10 consistently scanned as 97.

Two related fixes were made alongside discovering this:

- `useArucoScanner.js` now picks the detected marker with the lowest Hamming distance (best match) across a frame, instead of blindly trusting whichever candidate came back first — a loose candidate-size filter (see below) could otherwise let an unrelated background object outrank the real marker.
- `aruco.js`'s candidate-size filter was raised from 1% to 5% of frame width, so small background clutter (phone cases, keyboard keys, picture frames, etc.) is rejected before it's decoded, rather than being loosely Hamming-matched into a false-positive marker ID.

If markers still misread after using the in-app generator, check for other rectangular high-contrast objects in the camera's frame before assuming it's a marker/print issue.

---

## 9. Operational risks (not code issues)

- **Maintenance ownership.** If nobody is responsible for periodically patching dependencies (`npm audit`, Prisma/Express updates) and rotating secrets, that should be treated as an explicit risk, not discovered later. See the Admin Runbook for a starter checklist.
- **Database backups.** Confirm Supabase backup retention on whatever plan is used — automated backups are typically a paid-tier feature. This system stores academic records (marks, submissions); losing this data has real consequences for students.
- **HTTPS required in production.** JWTs and photo uploads must not travel over plain HTTP. Ensure both the API and frontend are served over HTTPS before any real student data is involved.
