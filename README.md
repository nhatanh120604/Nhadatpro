# Nha Dat Pro

A Next.js property management app for owners, managers, and tenants.

## Current Status

This repo is active development code, not just a prototype. The core flows for authentication, property/unit management, tenant-manager invite codes, leases, and role-based dashboards are implemented.

Before collaborators start working, they should follow the setup steps below exactly.

## Tech Stack

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS 4
- Prisma 7
- PostgreSQL
- Custom JWT cookie session auth
- Optional Google OAuth for login/signup

## Requirements

Install these first:

- Node.js 20
- npm 10+
- PostgreSQL database access
- Git

## 1. Clone and install

```bash
git clone <your-repo-url>
cd main
npm install
```

## 2. Create environment file

Copy `.env.example` to `.env`.

```bash
cp .env.example .env
```

If you are on Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Then fill in these values:

- `DATABASE_URL`
- `DIRECT_URL`
- `JWT_SECRET`

Optional, only if you want Google login/signup locally:

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REDIRECT_URI`

Notes:

- `DATABASE_URL` can use the pooled connection.
- `DIRECT_URL` should use the direct database connection for Prisma CLI commands.
- `JWT_SECRET` is required. The app will fail without it.
- `.env` must never be committed.

## 3. Prepare the database

Run these commands after the `.env` file is ready:

```bash
npm run db:generate
npm run db:push
npm run db:seed
```

What they do:

- `db:generate`: regenerate Prisma Client from the schema
- `db:push`: sync the schema to the current database
- `db:seed`: insert demo roles and demo users

Default seeded password:

```text
Password123!
```

Demo accounts:

- `owner@pmh.com`
- `manager@pmh.com`
- `tenant1@pmh.com`
- `tenant2@pmh.com`
- `tenant3@pmh.com`
- `tenant4@pmh.com`
- `admin@pmh.com`

## 4. Start the app

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

The root page redirects to `/login`.

## 5. Verify your setup before coding

Every collaborator should run:

```bash
npm run check
```

This runs:

- ESLint
- TypeScript typecheck

Optional:

```bash
npm run build
```

If `npm run build` fails with an `EPERM` error inside `.next`, close any running dev server or editor process that is locking `.next`, then run the build again.

## 6. Google login setup

Google auth is optional in local development.

If your team wants to use it:

1. Create or use a shared Google Cloud project.
2. Create a Web OAuth client.
3. Add this redirect URI:
   - `http://localhost:3000/auth/google/callback`
4. Put the client ID and secret in `.env`.
5. Restart the dev server.

If these values are missing, the app will hide or disable the Google path and manual auth will still work.

## 7. Collaboration workflow

Recommended workflow for students:

1. Pull the latest `main` branch.
2. Create a new feature branch.
3. Make one focused change at a time.
4. Run `npm run check` before pushing.
5. If you changed the Prisma schema, also run:
   - `npm run db:generate`
   - `npm run db:push`
6. Update the relevant markdown docs if your feature changes behavior.

## 8. Important project notes

- The UI is in Vietnamese.
- Internal code and comments are mostly in English.
- Authentication is custom, not NextAuth/Auth.js.
- Most mutations are implemented with Server Actions.
- Prisma uses PostgreSQL through `pg` and `@prisma/adapter-pg`.

## 9. Useful commands

```bash
npm run dev
npm run lint
npm run typecheck
npm run check
npm run db:generate
npm run db:push
npm run db:seed
npm run db:studio
```

## 10. Key docs

- `markdowns/PROJECT_OVERVIEW.md`
- `markdowns/PROJECT_STRUCTURE.md`
- `markdowns/HANDOVER.md`
- `markdowns/PHASE_0_DONE.md`
- `markdowns/PHASE_1_DONE.md`
- `markdowns/PHASE_2_DONE.md`
- `markdowns/PHASE_3_DONE.md`
- `markdowns/MANUAL_TESTING_CHECKLIST.md`
- `CONTRIBUTING.md`
