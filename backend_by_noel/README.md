# Salon Website Backend

Express + PostgreSQL backend for the Team Dunamis salon platform.

## Features

- Customer registration and login with JWT authentication
- Admin-protected service, category, booking, product, and order management
- Booking availability with category-based daily capacity limits
- Product stock deduction during order creation
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

## Create an Admin

Add these to `.env`, then run `npm run admin:create`:

```text
ADMIN_NAME=Salon Owner
ADMIN_PHONE=0240000000
ADMIN_PASSWORD=change-this-password
```
