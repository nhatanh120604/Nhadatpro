# Contributing Guide

This project is being developed by a student team, so please keep the workflow simple and predictable.

## Before you start

1. Read `README.md` and finish the setup steps.
2. Make sure `npm run check` passes.
3. Make sure you can log in with a seeded account.

## Branching

Do not work directly on `main`.

Use a feature branch:

```bash
git checkout -b feature/short-description
```

Examples:

- `feature/google-auth-ui`
- `feature/tenant-dashboard`
- `fix/property-delete-flow`

## While coding

- Keep changes focused.
- Do not mix database, frontend, and unrelated cleanup in one branch unless they belong to the same feature.
- If you change behavior, update the relevant markdown file.
- If you change Prisma schema, tell teammates clearly.

## Before you push

Run:

```bash
npm run check
```

If you changed the Prisma schema, also run:

```bash
npm run db:generate
npm run db:push
```

## Pull request expectations

A good PR should explain:

- what changed
- why it changed
- how to test it manually
- whether database setup changed
- whether docs were updated

## Do not commit

Never commit:

- `.env`
- database passwords
- Google OAuth secrets
- local-only files
- `.next`

## If something breaks locally

Check these first:

1. Is `.env` filled correctly?
2. Did you run `npm install`?
3. Did you run `npm run db:generate` after schema changes?
4. Did you run `npm run db:push`?
5. Is another process locking `.next`?

## Manual testing

Use `markdowns/MANUAL_TESTING_CHECKLIST.md` as the baseline test list before handing work to someone else.
