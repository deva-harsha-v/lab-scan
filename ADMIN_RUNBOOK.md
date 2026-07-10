# LabScan — Admin Runbook

A practical guide for the person/team running LabScan day-to-day at the college. Written for someone without deep familiarity with the codebase.

> **Updated:** this revision was checked directly against the current codebase. Several steps below changed from the previous version of this doc — see the callouts.

---

## 0. Before anything else: rotate the shipped secrets

> **This codebase currently ships with a real, live `server/.env` file** — actual database password, JWT secrets, and Cloudinary API secret, not placeholders. There is also no `.gitignore` and no `.env.example`, so nothing currently stops this file from being committed or shared further.
>
> Do this **before** any of the steps below, and before this code touches anything public:
> 1. Rotate the Supabase database password.
> 2. Generate new `JWT_SECRET` / `JWT_REFRESH_SECRET` values (this will invalidate all existing logins — expected).
> 3. Rotate the Cloudinary API secret.
> 4. Replace `server/.env` with your new values, add a `.gitignore` that excludes `.env`, `node_modules/`, and build output, and create a `.env.example` template with blank values for future setups.
>
> See `KNOWN_LIMITATIONS.md` section 1 for details.

---

## 1. First-time setup: creating the first real admin account

The seed script (`server/prisma/seed.js`) creates demo accounts with **fixed, hardcoded passwords** — useful for initial testing, but not safe to leave active and **not** intended as the long-term admin account.

To create the real, permanent admin account:

1. Run the seed script once (if not already done) to get a working demo ADMIN account:

   ```bash
   cd server
   npm run prisma:seed
   ```

   This creates `admin@labscan.edu` with the password `admin123` (along with demo HOD, faculty, and student accounts — see step 4).

2. Log in to LabScan as that demo admin.
3. Use the admin's **Users** management screen (or `POST /api/auth/register` with `role: "ADMIN"`, which requires an already-authenticated ADMIN to call) to create the college's real admin account with a real email and a strong, unique password.
4. Once the real admin account works, **delete or disable the demo accounts** (`admin@labscan.edu`, `hod@labscan.edu`, `faculty@labscan.edu`, `student@labscan.edu`) via the admin Users screen, or directly in the database. Their passwords (`admin123`, `hod123`, `faculty123`, `student123`) are fixed and visible to anyone who can read this codebase.

> **Note:** Registering a non-STUDENT role (`FACULTY`, `HOD`, `ADMIN`) requires the request to already be authenticated as an ADMIN. Student self-registration does not require this.

---

## 2. Setting up the academic structure

This is done from the **HOD dashboard**. Order matters — each step depends on the previous one existing.

**Step 1 — Create Sections.** A Section represents a class/cohort (e.g. "EEE-A", semester 3, academic year "2025-26"). Go to HOD → Sections → Create Section.

**Step 2 — Create Subjects.** A Subject represents a lab course (e.g. "Basic Electronics Lab", code "EE2301") with a total number of experiment slots. Go to HOD → Subjects → Create Subject.

**Step 3 — Create Assignments.** An Assignment links a Section + Subject + Faculty member together (the HOD assigns a faculty member to teach a subject to a section). Go to HOD → Assignments → Create Assignment (or use the bulk-create option for multiple sections/subjects at once).

**Step 4 — Define Experiment Slots.** Within an Assignment, define the numbered experiment slots (e.g. Slot 1: "Half Wave Rectifier", max marks 10). This is what students will eventually get marks for. Managed from the Faculty side (Lab Assignments page) once the Assignment exists.

**Step 5 — Enroll students into Sections.** Students self-register (see below) but need to be enrolled into a Section by the HOD before they show up in that section's roster. Go to HOD → Students → Enroll Student, selecting the student and the target Section. (For large batches, the Admin bulk-import tool below can set a student's section directly at creation time instead.)

---

## 3. Onboarding faculty and students

**Faculty / HOD accounts.** These cannot self-register — they must be created by an existing ADMIN via the Users management screen, providing name, email, password, role (`FACULTY` or `HOD`), department, and a unique Employee ID.

**Student accounts.** Students can self-register via the public registration page, providing name, email, password, and a unique Roll Number. After registering, the HOD must enroll them into the correct Section (see Step 5 above) for their section-based features (assignments, marks) to work.

---

## 4. Bulk-importing students via CSV

ADMIN accounts can create many student accounts at once instead of using self-registration, from Admin Dashboard → Bulk Import.

1. Download the template: `GET /api/admin/bulk-import/template`, or use the "Download template" button on the Bulk Import page.
2. Fill in one row per student. **Required columns:** `name`, `email`, `rollNumber`, `department`, `password`. **Optional column:** `sectionId` — if set, the student is enrolled into that Section immediately (no separate HOD enrollment step needed).
3. Upload the CSV (`POST /api/admin/bulk-import/students`, ADMIN-only, 5 MB max, processed in batches of 100).
4. The response reports how many were created vs skipped, plus a per-row reason for anything skipped (typically a duplicate email or roll number).

> **Handle the CSV carefully.** Passwords are supplied as plain text in the file, and there is currently no "force password change on first login" feature — so whoever has this CSV effectively has live student passwords until each student changes their own. Treat the file as sensitive and delete it after the import completes.

---

## 5. Running an experiment session (faculty workflow, for reference)

1. Faculty creates/edits an **Experiment** (theory content, videos, steps) linked to an ArUco marker ID.
   - **Generate the physical marker at `/marker-generator.html`** (not a third-party site). This page uses the same dictionary and marker-rendering code the scanner detects against, so the printed marker is guaranteed to match. Using a different generator (even one that claims the same dictionary name, e.g. "ARUCO_MIP_36h12") can silently produce a marker that scans as the *wrong* ID, because different implementations can encode the same dictionary with a different bit-reading convention. This already caused a real incident — see `KNOWN_LIMITATIONS.md`.
2. Faculty creates a **Session**, linking that Experiment to a time window (start/end time, grace period, whether resubmission is allowed).
3. Faculty **activates** the session — this generates a join code.
4. Students log in, scan the ArUco marker (or enter the join code), and work through the Learn → Watch → Submit stages. A submission can list more than one roll number (comma-separated) for group work — one photo/observation then applies to all listed students.
5. Faculty reviews submissions and assigns marks via the submissions review page.

---

## 6. Periodic maintenance checklist

Whoever owns this system going forward should periodically:

- **Rotate secrets** — `JWT_SECRET`, `JWT_REFRESH_SECRET`, the database password, and the Cloudinary API secret, on a regular schedule (e.g. annually, or immediately if any of these may have been exposed). The current shipped values must be rotated as a one-time first action — see section 0 above.
- **Add and maintain a `.gitignore`** — none exists in this codebase currently. Add one excluding `.env`, `node_modules/`, and build output before pushing this code to any git remote.
- **Add rate limiting to the public submission endpoint** — `POST /api/submissions` currently has no rate limiter at all (only registration does, at 10 requests/15 minutes). See `KNOWN_LIMITATIONS.md` section 1.
- **Update dependencies** — run `npm audit` in both `server/` and `client/`, and apply security patches. Pin major versions carefully; Prisma migrations should be tested in a non-production environment first.
- **Check database backups** — confirm Supabase's backup retention policy covers your plan, and periodically verify a backup can actually be restored.
- **Review user accounts** — remove accounts for students/faculty who have left, check no demo/test accounts remain active, and confirm the seed script's hardcoded demo passwords were never reused for a real account.
- **Monitor disk/storage usage** — Cloudinary free/paid tiers have storage limits; observation photos accumulate over time.
- **Check session cron is running** — the backend process must stay running for sessions to auto-transition between ACTIVE → GRACE → CLOSED states on schedule. If the server restarts frequently, verify this still works correctly.
