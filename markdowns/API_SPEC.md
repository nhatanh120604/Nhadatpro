# API and Action Notes

This codebase is not a traditional REST API-first project.

## Current interaction model

Most data mutations happen through **Next.js Server Actions** inside `src/features/*/*.actions.ts`.

Examples:

- `src/features/auth/auth.actions.ts`
- `src/features/properties/properties.actions.ts`
- `src/features/units/units.actions.ts`
- `src/features/leases/leases.actions.ts`
- `src/features/managerAssignments/managerAssignments.actions.ts`

## Route handlers currently used

The main Route Handlers are:

- `POST /api/auth/logout`
- `GET /auth/google/start`
- `GET /auth/google/callback`

## Response shape in server actions

Most server actions follow a structure like:

```ts
{
  success: boolean,
  message?: string,
  data?: unknown,
  errors?: Record<string, string[]>
}
```

## Recommendation for future contributors

- Prefer following the current Server Action pattern instead of introducing a separate REST layer.
- Add Route Handlers only when browser redirects, webhooks, or external integrations require them.
- Keep validation close to each feature using Zod.
