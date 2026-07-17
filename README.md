# Salon Booking, Inventory & Payments Platform

**Team Dunamis** · COE 454 — Software Engineering II, KNUST

A web platform for a salon business to manage online appointment booking (with category-based daily capacity limits), product inventory, and Mobile Money payments, alongside a single admin dashboard for the salon owner.

## Tech stack

| Layer | Choice | ADR |
|---|---|---|
| Frontend | Next.js (React) | ADR-001 |
| Backend | Node.js + Express | ADR-002 |
| Database | PostgreSQL (Supabase) | ADR-003 |
| Auth | JWT + bcrypt | ADR-004 |
| Deployment | Vercel (frontend) · Railway (backend + DB) | ADR-005 |

Full architecture decisions, ERD, and API schema: see `docs/Week3_Architecture_Team_Dunamis.docx`.

## Local setup

### Prerequisites
- Node.js 18+
- npm
- A PostgreSQL instance (local, or a free Supabase/Railway project)

### 1. Clone and install

```bash
git clone <repo-url>
cd salon-platform
cd backend && npm install
cd ../frontend && npm install
```

### 2. Environment variables

Copy the example env files and fill in your own values — never commit `.env`.

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

`backend/.env.example`:
```
DATABASE_URL=postgresql://user:password@localhost:5432/salon_db
JWT_SECRET=replace-with-a-long-random-string
PORT=4000
MOMO_API_KEY=your-momo-sandbox-key
MOMO_API_SECRET=your-momo-sandbox-secret
```

`frontend/.env.example`:
```
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

### 3. Run database migrations

```bash
cd backend
npm run migrate
```

### 4. Start both apps

```bash
# Terminal 1
cd backend && npm run dev

# Terminal 2
cd frontend && npm run dev
```

Frontend: `http://localhost:3000`
Backend API: `http://localhost:4000/api`

## Branching & PR rules

- No direct pushes to `main`. All code goes through a pull request.
- Every PR needs at least one peer review before merge, per the Team Charter.
- Branch naming: `feature/<short-description>`, `fix/<short-description>`.

## Project board

Columns: `Backlog` → `In Progress` → `In Review` → `Done`.
All user stories from the Week 2 Requirements Document are loaded as issues (see below) and assigned to the relevant milestone (Sprint 1 / Sprint 2).

## Repository structure

```
salon-platform/
├── backend/         # Express API, migrations, tests
├── frontend/         # Next.js app (customer site + admin dashboard)
├── docs/             # Requirements Doc, Week 3 Architecture Doc, ADRs
└── README.md
```

## Team

| Role | Name |
|---|---|
| Project Manager | Prince Djangmah |
| Business Analyst / Client Liaison / Frontend | Naomi Opuni |
| UX / Design Lead | Esther Tweneboah Koduah |
| Backend Engineer (Lead) | Nkansah Noel Gerhard Yaw |
| Backend Engineer | Klogo Enyo Kweku |
| Frontend Engineer | Allen Sampah |
| QA / Documentation Lead | Asiedu Enoch Ofori |

---

## Sprint backlog (GitHub issues to create)

Copy each row below into a GitHub issue with the given title, labels, and milestone. IDs match the Requirements Document user stories.

| # | Title | Labels | Milestone |
|---|---|---|---|
| 1 | US-01: Customer signup / profile creation | `backend`, `frontend`, `auth` | Sprint 1 |
| 2 | US-02: Customer login | `backend`, `frontend`, `auth` | Sprint 1 |
| 3 | US-03: Browse services list (photos, description, price range, category) | `backend`, `frontend` | Sprint 1 |
| 4 | US-04: Book a service (date + time slot selection) | `backend`, `frontend` | Sprint 1 |
| 5 | US-05: Enforce daily booking cap per category | `backend` | Sprint 1 |
| 6 | US-06: Admin — manage categories and daily caps | `backend`, `frontend`, `admin` | Sprint 1 |
| 7 | US-07: Browse and purchase products | `backend`, `frontend` | Sprint 2 |
| 8 | US-08: Automatic stock deduction + out-of-stock display | `backend` | Sprint 2 |
| 9 | US-09: Online payment at checkout (MoMo) | `backend`, `payments` | Sprint 2 |
| 10 | US-10: Route payments to owner's MoMo number | `backend`, `payments` | Sprint 2 |
| 11 | US-11: Admin dashboard — services, products, appointments, orders | `frontend`, `admin` | Sprint 1–2 |
| 12 | US-12: Admin — view customer profiles and history | `backend`, `frontend`, `admin` | Sprint 2 |
| 13 | US-13: SEO basics + mobile/3G performance pass | `frontend`, `performance` | Sprint 2 |
| 14 | Set up CI: lint + test on PR | `infra` | Sprint 1 |
| 15 | Write minimum 5 automated API tests (Sprint 1 requirement) | `backend`, `testing` | Sprint 1 |
| 16 | Deploy frontend to Vercel | `infra` | Sprint 2 |
| 17 | Deploy backend + DB to Railway | `infra` | Sprint 2 |
