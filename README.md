# Nha Dat Pro

A property management web application for residential rentals in Vietnam. It supports three primary roles — **Owner**, **Manager**, and **Tenant** — with role-based dashboards covering properties, units, leases, invoices, payments (including VietQR + payment proofs), expenses, and alerts.

The UI is in Vietnamese; the code and docs are in English.

---

## Table of contents

1. [Status](#status)
2. [Tech stack](#tech-stack)
3. [Architecture](#architecture)
4. [Domain model](#domain-model)
5. [Project structure](#project-structure)
6. [Requirements](#requirements)
7. [Setup](#setup)
8. [Environment variables](#environment-variables)
9. [Database](#database)
10. [Running the app](#running-the-app)
11. [Authentication](#authentication)
12. [Google OAuth (optional)](#google-oauth-optional)
13. [Payment proofs (Supabase Storage)](#payment-proofs-supabase-storage)
14. [Collaboration workflow](#collaboration-workflow)
15. [Useful commands](#useful-commands)
16. [Further docs](#further-docs)

---

## Status

This repository is active development code, not a prototype. The following flows are implemented end-to-end:

- Email/password and Google OAuth auth with JWT cookie sessions
- Role-based dashboards for Owner, Manager, Tenant, Admin
- Property + unit CRUD, manager assignment via invite codes
- Tenant-unit connection via invite codes
- Lease lifecycle (active / expired / terminated)
- Invoices, payments with VietQR receiving accounts, and proof uploads
- Expense tracking and revenue/finance reporting
- In-app alerts and notifications

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router) |
| UI | React 19, Tailwind CSS 4, Framer Motion, lucide-react |
| Forms | react-hook-form + zod (`@hookform/resolvers`) |
| Language | TypeScript 5 |
| ORM | Prisma 7 with `@prisma/adapter-pg` |
| Database | PostgreSQL |
| Auth | Custom JWT cookie sessions (`jose`), bcryptjs, optional Google OAuth |
| Storage | Supabase Storage (private bucket for payment proofs) |
| Lint / types | ESLint 9 (`eslint-config-next`), `tsc --noEmit` |

> **Note:** This Next.js version has breaking changes from older docs. Read `node_modules/next/dist/docs/` when in doubt — older training-data patterns may not apply.

## Architecture

### High-level

```
                ┌────────────────────────────────────────────┐
                │              Browser (React 19)            │
                │  Vietnamese UI · Tailwind · Framer Motion  │
                └───────────────────┬────────────────────────┘
                                    │ HTTPS
                                    ▼
                ┌────────────────────────────────────────────┐
                │           Next.js 16 App Router            │
                │                                            │
                │  ┌──────────────┐   ┌───────────────────┐  │
                │  │  RSC pages   │   │  Server Actions   │  │
                │  │  (read)      │   │  (mutations)      │  │
                │  └──────┬───────┘   └────────┬──────────┘  │
                │         │                    │             │
                │  ┌──────┴────────────────────┴──────────┐  │
                │  │  middleware.ts (session + RBAC gate) │  │
                │  └──────────────────────────────────────┘  │
                │                                            │
                │  ┌──────────────┐   ┌───────────────────┐  │
                │  │ /api/auth/*  │   │ /api/payments/*   │  │
                │  │ logout, etc. │   │ proof signed URLs │  │
                │  └──────────────┘   └───────────────────┘  │
                └──────┬───────────────────────┬─────────────┘
                       │                       │
              ┌────────▼────────┐    ┌─────────▼────────────┐
              │   PostgreSQL    │    │  Supabase Storage    │
              │   (Prisma 7)    │    │  payment-proofs/     │
              └─────────────────┘    └──────────────────────┘
                       ▲
                       │ pooled via @prisma/adapter-pg
                       │
              ┌────────┴─────────┐
              │  Google OAuth    │  (optional, for login/signup)
              └──────────────────┘
```

### Request flow

1. The browser hits a route under `/owner`, `/manager`, `/tenant`, or the public `(auth)` group.
2. `src/middleware.ts` reads the JWT session cookie, validates it with `jose`, and gates routes by role. Unauthenticated users are redirected to `/login`.
3. **Reads** are done in React Server Components that call Prisma directly through `src/lib/prisma.ts`.
4. **Writes** are done with Server Actions co-located with feature folders in `src/features/*`. Each action validates input with zod, performs the authorization check in `src/lib/authz.ts`, then mutates via Prisma.
5. File uploads (payment proofs) go through `/api/payments/proofs`, which uses the Supabase service-role key server-side to put objects in a private bucket and issues short-lived signed URLs for download.

### Key conventions

- **Server Actions over API routes.** API routes exist only where they must (logout, file proxying).
- **Feature folders** under `src/features/<domain>/` hold the server actions, zod schemas, and pure functions for one domain. UI components live in `src/components/<domain>/`.
- **Authorization** is centralized in `src/lib/authz.ts`. Never trust the client-rendered role; re-check on every mutation.
- **Sessions** are JWTs signed with `JWT_SECRET`, stored as `httpOnly` cookies. See `src/lib/session.ts`.
- **Prisma adapter-pg** is used so the same `DATABASE_URL` works with pooled connections (e.g. Supabase pooler) at runtime, while `DIRECT_URL` is used by the Prisma CLI for migrations.

## Domain model

Prisma models (see `prisma/schema.prisma`):

- `Role`, `User`, `AuthAccount` — identity and federated logins
- `Property`, `Unit` — physical assets
- `PropertyManagerAssignment`, `PropertyManagerInviteCode`, `ManagerAssignmentRequest` — owner ↔ manager link
- `UnitInviteCode`, `UnitConnectionRequest` — tenant ↔ unit link
- `Lease` — tenant occupancy of a unit
- `Invoice`, `Payment`, `PaymentReceivingAccount` — billing + VietQR
- `Expense` — operating costs on a property/unit
- `Alert`, `AlertRecipient` — fan-out notifications

Relationships in one sentence: an **Owner** owns **Properties**, each with many **Units**; **Managers** are granted access to specific properties via invite codes; **Tenants** connect to a **Unit** via an invite code, which produces a **Lease**; leases generate **Invoices**, which are settled by **Payments** sent to a **PaymentReceivingAccount** (VietQR) with an uploaded proof.

## Project structure

```
src/
├── app/                       # Next.js App Router
│   ├── (auth)/                # public login/register group
│   ├── api/
│   │   ├── auth/logout/       # session teardown
│   │   └── payments/proofs/   # signed-URL proxy to Supabase
│   ├── auth/                  # OAuth callback handlers
│   ├── manager/               # /manager/* role dashboard
│   ├── owner/                 # /owner/* role dashboard
│   ├── tenant/                # /tenant/* role dashboard
│   ├── onboarding/            # post-signup role/profile flow
│   ├── profile/               # account settings
│   ├── register/              # signup
│   ├── layout.tsx
│   └── page.tsx               # redirects to /login
├── components/                # UI components grouped by domain
│   ├── alerts/  auth/  expenses/  finance/  invoices/
│   ├── layout/  leases/  ui/  units/
├── features/                  # server actions + zod schemas per domain
│   ├── alerts/  auth/  dashboard/  expenses/  invoices/
│   ├── leases/  managerAssignments/  profile/  properties/  units/
├── lib/
│   ├── authz.ts               # role/permission checks
│   ├── google-auth.ts         # OAuth helpers
│   ├── invite-codes.ts        # generation + redemption
│   ├── lease-expiration.ts    # lease lifecycle logic
│   ├── payment-proof-storage.ts  # Supabase Storage adapter
│   ├── prisma.ts              # Prisma client singleton
│   ├── session.ts             # JWT cookie sessions
│   └── utils.ts
└── middleware.ts              # session + role-based route gate

prisma/
├── schema.prisma              # canonical schema
├── migrations/
├── seed.ts                    # baseline roles + demo users
└── seed.demo.ts               # full demo dataset (guarded)

markdowns/                     # design docs and phase records
scripts/                       # one-off ops scripts
public/                        # static assets
schema.sql, seed.sql           # raw SQL references
dashboard_queries.sql          # analytics queries
```

## Requirements

- Node.js 20
- npm 10+
- PostgreSQL database (local or Supabase)
- Git

## Setup

```bash
git clone <your-repo-url>
cd Nhadatpro
npm install
cp .env.example .env   # PowerShell: Copy-Item .env.example .env
```

Fill `.env` as described below, then:

```bash
npm run db:generate
npm run db:push
npm run db:seed
npm run dev
```

Open `http://localhost:3000`. The root page redirects to `/login`.

## Environment variables

Required:

| Var | Purpose |
|---|---|
| `DATABASE_URL` | Runtime DB connection (pooled is fine) |
| `DIRECT_URL` | Direct DB connection for Prisma CLI |
| `JWT_SECRET` | Signs session cookies — app fails without it |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only key for payment-proof uploads |
| `SUPABASE_PAYMENT_PROOFS_BUCKET` | Bucket name (must be private) |
| `PAYMENT_PROOF_MAX_MB` | Max upload size for payment proofs |

Optional (Google login):

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REDIRECT_URI`

Rules:

- `SUPABASE_SERVICE_ROLE_KEY` must never reach the client. It is only read in server-side code.
- `.env` must never be committed.
- If Google vars are missing, the app hides the Google path automatically.

## Database

```bash
npm run db:generate   # regenerate Prisma Client
npm run db:push       # sync schema to DB (dev)
npm run db:seed       # baseline roles + demo users
npm run db:studio     # Prisma Studio UI
```

Default seeded password for all demo accounts: `Password123!`

Demo accounts:

- `owner@pmh.com`, `owner2@pmh.com` *(full seed)*
- `manager@pmh.com`, `manager2@pmh.com` *(full seed)*
- `tenant1@pmh.com` … `tenant6@pmh.com` *(5/6 require full seed)*
- `admin@pmh.com`

### Full demo seed (destructive)

For end-to-end testing only. This deletes app data and recreates a rich dataset — never run against production.

```bash
ALLOW_DEMO_DB_RESET=true npm run db:seed:demo
```

It produces: multiple owners/managers/tenants, properties, units, active/expired/terminated leases, invoices, verified/pending/rejected payments, VietQR receiving accounts, expenses, and alerts.

## Running the app

```bash
npm run dev          # turbopack dev server
npm run dev:webpack  # fallback if turbopack misbehaves
npm run build
npm run start
```

If `npm run build` fails with `EPERM` inside `.next`, close any dev server or editor process locking the folder and re-run.

Before pushing, always run:

```bash
npm run check        # eslint + tsc --noEmit
```

## Authentication

- Custom JWT sessions, **not** NextAuth/Auth.js.
- `bcryptjs` hashes passwords. `jose` signs and verifies JWTs.
- Sessions live in an `httpOnly` cookie. The middleware decodes the cookie on every request, attaches the user, and enforces role gates on `/owner`, `/manager`, `/tenant`.
- Every mutation re-checks authorization through `src/lib/authz.ts`. The client-side role is never trusted.

## Google OAuth (optional)

1. Create a Google Cloud project and Web OAuth client.
2. Add redirect URI: `http://localhost:3000/auth/google/callback`.
3. Set `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI` in `.env`.
4. Restart the dev server.

If the env vars are absent, manual email/password auth still works.

## Payment proofs (Supabase Storage)

- Tenants upload proof images when reporting a payment.
- The bucket is **private**. Uploads and reads go through `/api/payments/proofs` using the service-role key on the server.
- The route returns short-lived signed URLs; the bucket is never publicly listed.
- Max upload size is bounded by `PAYMENT_PROOF_MAX_MB`.

## Collaboration workflow

1. Pull the latest `main`.
2. Create a feature branch.
3. Make one focused change at a time.
4. Run `npm run check` before pushing.
5. If you changed `prisma/schema.prisma`, also run `npm run db:generate` and `npm run db:push`.
6. Update relevant docs in `markdowns/` if behavior changed.

See [CONTRIBUTING.md](CONTRIBUTING.md) for more.

## Useful commands

```bash
npm run dev
npm run dev:webpack
npm run build
npm run start
npm run lint
npm run typecheck
npm run check
npm run db:generate
npm run db:push
npm run db:seed
npm run db:seed:demo
npm run db:studio
```

## Further docs

Detailed design and phase records live in `markdowns/`:

- [PROJECT_OVERVIEW.md](markdowns/PROJECT_OVERVIEW.md)
- [PROJECT_STRUCTURE.md](markdowns/PROJECT_STRUCTURE.md)
- [TECH_STACK.md](markdowns/TECH_STACK.md)
- [DATABASE.md](markdowns/DATABASE.md)
- [API_SPEC.md](markdowns/API_SPEC.md)
- [IMPLEMENTATION_PLAN.md](markdowns/IMPLEMENTATION_PLAN.md)
- [USER_MENUS.md](markdowns/USER_MENUS.md)
- [HANDOVER.md](markdowns/HANDOVER.md)
- [MANUAL_TESTING_CHECKLIST.md](markdowns/MANUAL_TESTING_CHECKLIST.md)
- Phase records: `PHASE_0_DONE.md` … `PHASE_5_DONE.md`
