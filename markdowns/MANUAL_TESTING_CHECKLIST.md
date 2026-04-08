# Manual Testing Checklist

Use this checklist before merging or handing your branch to another teammate.

## 1. Environment and startup

- `npm install` works without errors.
- `.env` is present and not committed.
- `npm run db:generate` works.
- `npm run db:push` works.
- `npm run db:seed` works.
- `npm run dev` starts successfully.
- `/login` loads without console or server errors.

## 2. Authentication

- Manual login works for seeded owner.
- Manual login works for seeded manager.
- Manual login works for seeded tenant.
- Manual registration works for owner.
- Manual registration works for manager.
- Manual registration works for tenant.
- Logout works and returns the user to `/login`.

## 3. Google auth

Only test this if Google credentials are configured.

- Google sign-in button appears.
- First-time Google user is asked to choose a role.
- First-time Google user must enter phone number.
- Confirmation step appears before account creation.
- Existing manual account with same email requires confirmation before linking.

## 4. Owner flows

- Owner dashboard loads.
- Owner can create a property.
- Owner can edit a property.
- Owner can add a unit.
- Owner can edit a unit.
- Owner can remove or archive a unit according to business rules.
- Owner can remove or archive a property according to business rules.
- Owner can generate a tenant invite code for a vacant unit.
- Owner can generate a manager invite code when no active manager is assigned.
- Owner can review tenant connection requests.
- Owner can review manager assignment requests.
- Owner can terminate an active lease.
- Owner can end an active manager assignment.

## 5. Manager flows

- Manager dashboard loads.
- Manager can request assignment using a valid property code.
- Manager can see assigned properties.
- Manager can review tenant connection requests for assigned properties.
- Manager can create a lease from an approved tenant request.
- Manager can leave a property assignment.

## 6. Tenant flows

- Tenant dashboard loads.
- Tenant can submit a valid unit connection code.
- Tenant sees pending state after submitting a request.
- Tenant can view contract details after approval.
- Tenant can request early lease termination.

## 7. Quality checks

- `npm run lint` passes.
- `npm run typecheck` passes.
- Optional: `npm run build` passes if `.next` is not locked by another process.
