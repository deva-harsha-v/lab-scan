# LabScan — Laboratory Experiment Management Platform

A full-stack web application for managing laboratory experiments in colleges. Faculty create sessions with ArUco-linked experiments; students scan markers, work through staged content, and submit observations with photos.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite, Tailwind CSS, React Router v6 |
| Backend | Node.js + Express |
| Database | PostgreSQL via Supabase (Prisma ORM) |
| File Storage | Cloudinary (photos + PDFs) |
| Auth | JWT (access + refresh tokens), bcrypt |
| ArUco Detection | js-aruco (browser-side, camera) |
| Real-time | Socket.io |

---

## Prerequisites

- **Node.js** v18 or higher
- **npm** v9 or higher
- A **Supabase** account (free) — for PostgreSQL
- A **Cloudinary** account (free) — for file storage

---

## 1. Get Your Supabase Connection String

1. Go to [https://supabase.com](https://supabase.com) and create a free account
2. Create a **New Project** (choose a region close to you)
3. Once created, go to **Project Settings → Database**
4. Scroll to **Connection string** → select **URI** tab
5. Copy the string — it looks like:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
   ```
6. Replace `[YOUR-PASSWORD]` with your actual database password

---

## 2. Get Your Cloudinary API Keys

1. Go to [https://cloudinary.com](https://cloudinary.com) and create a free account
2. After signing in, go to your **Dashboard**
3. You'll see your **Cloud Name**, **API Key**, and **API Secret**
4. Copy all three values

---

## 3. Setup

### Clone / extract the project

```bash
# If you have the zip:
unzip labscan.zip
cd labscan
```

### Configure environment

```bash
cd server
cp ../.env.example .env
```

Edit `server/.env` and fill in:

```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@db.YOUR_REF.supabase.co:5432/postgres"
JWT_SECRET="any-long-random-string"
JWT_REFRESH_SECRET="another-long-random-string"
CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_API_KEY="your_api_key"
CLOUDINARY_API_SECRET="your_api_secret"
CLIENT_URL="http://localhost:5173"
PORT=3001
```

> **Tip:** Generate JWT secrets with: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`

### Install dependencies

```bash
# Server
cd server
npm install

# Client (open a new terminal)
cd client
npm install
```

### Run database migrations

```bash
cd server
npx prisma migrate dev --name init
```

This creates all tables in your Supabase PostgreSQL database.

### Seed the database (optional but recommended)

```bash
cd server
npm run prisma:seed
```

This creates:
- Faculty account: `faculty@labscan.edu` / `faculty123`
- Student account: `student@labscan.edu` / `student123`
- Two sample experiments (ArUco IDs 1 and 2)

### Generate Prisma client

```bash
cd server
npx prisma generate
```

---

## 4. Run the Application

### Start the backend server

```bash
cd server
npm run dev
```

Server starts at: `http://localhost:3001`
Health check: `http://localhost:3001/api/health`

### Start the frontend (new terminal)

```bash
cd client
npm run dev
```

Client starts at: `http://localhost:5173`

---

## 5. Usage

### As Faculty
1. Navigate to `http://localhost:5173/login`
2. Sign in with `faculty@labscan.edu` / `faculty123`
3. Go to **Experiments** to create or manage experiments
4. Create a **New Session** linking an experiment to a time window
5. **Activate** the session — a 6-character code is generated
6. Display the code to students, or share the **Session Monitor** view

### As Student
1. Navigate to `http://localhost:5173/scan`
2. Either:
   - **Scan** the ArUco marker on the experiment card, OR
   - Click **Join with Code** and enter the 6-character session code
3. Work through the **three stages**:
   - 📖 **Learn** — Read experiment theory and procedure
   - ▶️ **Watch** — Watch demonstration videos *(unlocks after 60s on Stage 1)*
   - 📤 **Submit** — Upload your observation photo and results *(unlocks when session is ACTIVE)*

### ArUco Markers
- Generate markers at `/marker-generator.html` (e.g. `http://localhost:5173/marker-generator.html`, or the same path on your deployed domain).
- **Always use this generator, not a third-party site.** It calls the exact same `AR.Dictionary.generateSVG()` function bundled in `client/public/aruco.js` that the scanner uses to detect markers — so there's no risk of a dictionary or bit-orientation mismatch. Third-party generators (e.g. chev.me/arucogen) can render the "same named" dictionary with a different bit-reading convention, which will cause markers to scan as the wrong ID even though everything looks correct.
- Leave the dictionary on **ARUCO_MIP_36h12** (the scanner's default) and enter the marker ID matching the experiment's `arucoId`.
- Print and attach to physical experiment cards, keeping a solid white margin around the marker — the detector needs that quiet zone to lock onto the border.

---

## 6. Project Structure

```
labscan/
├── server/
│   ├── prisma/
│   │   ├── schema.prisma       # Database schema
│   │   └── seed.js             # Sample data
│   └── src/
│       ├── index.js            # Entry point + Socket.io
│       ├── middleware/         # auth.js, upload.js
│       ├── routes/             # Express routers
│       ├── controllers/        # Business logic
│       ├── services/           # Cloudinary, session transitions
│       └── utils/              # Code generator, session cron
└── client/
    └── src/
        ├── App.jsx             # Router setup
        ├── context/            # AuthContext
        ├── hooks/              # useAuth, useSocket, useArucoScanner
        ├── api/                # Axios API modules
        ├── components/         # Shared UI components
        ├── pages/
        │   ├── faculty/        # Dashboard, Sessions, Submissions
        │   └── student/        # Scan, Join, Experiment stages
        └── utils/              # stageUnlock.js
```

---

## 7. Key Features

- **ArUco Detection** — Browser-side camera scanning using js-aruco; requires 3 consecutive matching frames to confirm detection
- **Stage Gating** — Stage 2 (Watch) unlocks after 60s on Stage 1; Stage 3 (Submit) requires an active session
- **Live Updates** — Socket.io pushes new submission counts to faculty dashboard in real time
- **Session Lifecycle** — Cron job auto-transitions `ACTIVE → GRACE → CLOSED` based on time
- **Photo Upload** — Cloudinary with auto quality optimization and max 1200px width
- **Result Comparison** — Side-by-side table comparing student values to expected; ±10% tolerance for numerics
- **Inline Review** — Faculty mark submissions 0–100 inline with review notes

---

## 8. Environment Variables Reference

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Supabase PostgreSQL connection string |
| `JWT_SECRET` | Secret for signing access tokens (15min expiry) |
| `JWT_REFRESH_SECRET` | Secret for signing refresh tokens (7d expiry) |
| `CLOUDINARY_CLOUD_NAME` | Your Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Your Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Your Cloudinary API secret |
| `CLIENT_URL` | Frontend URL for CORS (e.g. `http://localhost:5173`) |
| `PORT` | Server port (default: 3001) |
