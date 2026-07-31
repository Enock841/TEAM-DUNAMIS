# Salon Website Backend

Express + PostgreSQL backend for the Team Dunamis salon platform.

## Features

- Customer registration and login with JWT authentication
- Authenticated profile retrieval, profile updates and password changes
- Admin-protected service, category, booking, product, and order management
- Customer history, payment reporting, analytics, business settings and staff management
- Booking availability with category-based daily capacity limits
- Braiding, makeup, nails and lashes with duration and price ranges
- Categorised products with live stock and automatic stock deduction
- Mock Mobile Money payment initiation and webhook endpoints

## Setup

```bash
npm install
cp .env.example .env
npm run migrate
npm run dev
```

API base URL:

```text
http://localhost:4000/api
```

## Useful Scripts

```bash
npm run dev      # start with Node watch mode
npm start        # start normally
npm run migrate  # run SQL migrations in migrations/
npm run admin:create # create/update the first admin from env vars
npm run lint     # syntax-check main files
```

Migrations are tracked in `schema_migrations`, so completed migration files are
not applied again. The current catalogue migration aligns the salon menu with
the frontend's braiding, makeup, nails and lashes sections.

## Catalogue fields

Service responses include:

- `durationMinutes`
- `priceMin` and `priceMax`
- `images`
- a category object with `dailyCap` and `imageUrl`

Product responses include:

- `category`
- `price`
- `stockQty` and `inStock`
- `images`

All database, JWT and payment credentials must be configured in `.env`. The
server does not provide a fallback JWT secret.

## Resend email configuration

The newsletter welcome email uses these backend-only environment variables:

```text
RESEND_API_KEY=re_your_api_key
RESEND_FROM_EMAIL=Beryl's Beauty Mark <updates@your-verified-domain.com>
RESEND_REPLY_TO_EMAIL=hello@your-verified-domain.com
FRONTEND_URL=http://localhost:3000
```

`RESEND_FROM_EMAIL` must be either a plain email address or a display name
followed by an address in angle brackets. For live subscribers, its domain must
be verified in the Resend dashboard. For account-owner testing only, Resend
provides `Beryl's Beauty Mark <onboarding@resend.dev>`.

## Backend structure

```text
src/
├── config/       Environment and PostgreSQL pool configuration
├── controllers/  Validation, request handling and HTTP responses
├── middleware/   Authentication, authorization and error handling
├── models/       SQL queries, transactions and database records
├── routes/       Endpoint definitions and middleware composition
├── utils/        Shared error and async helpers
├── app.js        Express middleware and route mounting
└── server.js     Server startup
```

The request flow is:

```text
server → app → routes → controllers → models → database
                     ↘ middleware
```

Routes do not query the database directly. Controllers validate input and call
models, while models contain all database access. The PostgreSQL pool is
configured in `src/config/db.js`.

## Authentication endpoints

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `PUT /api/auth/me`
- `PUT /api/auth/password`

Admin management endpoints are grouped under `/api/admin` for customers,
payments, analytics, settings and staff. Resource-specific admin operations
remain under `/api/bookings`, `/api/services`, `/api/products` and `/api/orders`.

Profile, password, booking, order and administration endpoints require a valid
bearer token. Administrator routes additionally verify the token's `admin`
role in middleware. Protected requests reload the account from PostgreSQL, so
role changes and account removal take effect without waiting for an older token
to expire.

## Create an Admin

Add these to `.env`, then run `npm run admin:create`:

```text
ADMIN_NAME=Salon Owner
ADMIN_PHONE=0240000000
ADMIN_PASSWORD=change-this-password
```
