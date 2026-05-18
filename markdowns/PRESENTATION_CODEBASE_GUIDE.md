# Nha Dat Pro / Dia Oc Hub Codebase Presentation Guide

This guide is for explaining the project to a teacher or evaluator. It focuses on architecture, major modules, data flow, important components, and likely questions.

## 1. One-Minute Project Explanation

**Dia Oc Hub / Nha Dat Pro** is a role-based rental property management web app for owners, managers, and tenants.

The app helps users manage the full rental workflow:

1. owners create properties and rental units
2. owners invite managers or tenants using invite codes
3. tenants request to connect to a unit
4. owners or managers approve the tenant and create a lease
5. owners or managers generate monthly invoices
6. tenants pay by bank transfer/VietQR and upload payment proof
7. owners or managers review the proof
8. the system tracks revenue, expenses, net income, and alerts

The main idea is to replace scattered spreadsheets, messages, and bank transfer screenshots with one structured system.

## 2. Technology Stack

- **Framework:** Next.js 16 App Router
- **Frontend:** React 19, TypeScript, Tailwind CSS 4
- **Validation:** Zod
- **Forms:** React Hook Form
- **Icons:** Lucide React
- **Animation/UI support:** Framer Motion / Motion
- **Backend model:** Next.js Server Actions for most mutations
- **Database:** PostgreSQL
- **ORM:** Prisma 7 using `pg` and `@prisma/adapter-pg`
- **Authentication:** custom JWT cookie session with `jose`
- **Password hashing:** bcryptjs
- **Optional auth integration:** Google OAuth
- **File storage:** Supabase Storage for private payment proof uploads

## 3. High-Level Architecture

The app is a full-stack Next.js application. It does not have a separate Express/Nest backend.

Architecture flow:

```text
Browser UI
  -> Next.js App Router pages and layouts
  -> Client components
  -> Server Actions or Route Handlers
  -> Zod validation
  -> Auth/session authorization helpers
  -> Prisma Client
  -> PostgreSQL

Payment proof files:
Browser
  -> /api/payments/proofs route handler
  -> Supabase private storage
  -> payment metadata saved in PostgreSQL
```

Key design choice:

Most business operations are implemented as **Server Actions** in `src/features/*/*.actions.ts`. Route handlers are used only where they fit better, such as file upload and Google OAuth redirects.

## 4. Folder Structure

```text
src/app
```

Contains Next.js routes, pages, layouts, and route handlers.

Examples:

- `src/app/owner/dashboard/page.tsx`
- `src/app/manager/dashboard/page.tsx`
- `src/app/tenant/dashboard/page.tsx`
- `src/app/api/payments/proofs/route.ts`
- `src/app/auth/google/start/route.ts`
- `src/app/auth/google/callback/route.ts`

```text
src/components
```

Contains reusable UI components and larger page-level components.

Important examples:

- `src/components/layout/AppLayout.tsx`
- `src/components/layout/SharedSidebar.tsx`
- `src/components/layout/NotificationBell.tsx`
- `src/components/invoices/InvoiceManagementPage.tsx`
- `src/components/invoices/TenantPaymentsPage.tsx`
- `src/components/finance/FinancePage.tsx`
- `src/components/expenses/RevenueManagementPage.tsx`
- `src/components/leases/LeaseApprovalForm.tsx`
- `src/components/ui/Drawer.tsx`

```text
src/features
```

Contains domain logic, server actions, validation schemas, and feature types.

Important feature folders:

- `auth`
- `properties`
- `units`
- `leases`
- `managerAssignments`
- `invoices`
- `expenses`
- `alerts`
- `dashboard`
- `profile`

```text
src/lib
```

Contains shared infrastructure helpers.

Important files:

- `src/lib/prisma.ts`: Prisma client singleton and database adapter setup
- `src/lib/session.ts`: JWT session encrypt/decrypt/set/clear
- `src/lib/authz.ts`: role checks and authorization helpers
- `src/lib/invite-codes.ts`: invite code generation and hashing
- `src/lib/payment-proof-storage.ts`: Supabase private file storage helper
- `src/lib/lease-expiration.ts`: lease expiration maintenance logic

```text
prisma
```

Contains the database schema, migrations, and seed scripts.

Important files:

- `prisma/schema.prisma`
- `prisma/seed.ts`
- `prisma/seed.demo.ts`

```text
markdowns
```

Contains project documentation and presentation materials.

## 5. Routing and User Roles

The application has three main route groups:

- `/owner/*`
- `/manager/*`
- `/tenant/*`

The root route redirects to `/login`.

Important pages:

### Owner

- `/owner/dashboard`: owner overview
- `/owner/properties`: property list
- `/owner/properties/[id]`: property detail and operations
- `/owner/finance`: invoices, payment review, revenue, expenses
- `/owner/requests`: tenant/manager requests
- `/owner/notifications`: notifications

### Manager

- `/manager/dashboard`: assigned-property overview
- `/manager/properties`: assigned property list
- `/manager/finance`: invoice and finance tools for assigned properties
- `/manager/requests`: tenant requests and lease work
- `/manager/notifications`: notifications

### Tenant

- `/tenant/dashboard`: active leases and due invoices
- `/tenant/contracts`: contract view
- `/tenant/payments`: invoice payment and proof upload
- `/tenant/notifications`: notifications

## 6. Authentication and Authorization

### Session model

The app uses custom JWT cookie authentication instead of NextAuth/Auth.js.

Core file:

```text
src/lib/session.ts
```

What it does:

- uses `jose`
- signs JWT with `JWT_SECRET`
- stores JWT in an HTTP-only cookie named `session`
- session expires after 1 day
- session includes user id, email, role, and name

### Login and registration

Core file:

```text
src/features/auth/auth.actions.ts
```

What it does:

- validates input using Zod
- finds user by email
- checks password with bcrypt
- creates session
- redirects to the role dashboard
- supports owner, tenant, and manager registration
- includes optional Google OAuth flow

### Route protection

Core file:

```text
src/middleware.ts
```

What it does:

- checks the `session` cookie
- redirects unauthenticated users away from protected routes
- redirects authenticated users away from login/register pages
- attempts role-based route control by matching role prefix

### Server-side authorization

Core file:

```text
src/lib/authz.ts
```

Important helpers:

- `requireSession()`
- `requireRole()`
- `assertPropertyAccess()`
- `assertPropertyOwner()`
- `propertyScopeWhere()`
- `normalizeActionError()`

This is important because UI protection alone is not enough. The app also checks permissions inside server actions before reading or changing data.

## 7. Database Model

The database is relational and centered around users, properties, units, leases, invoices, payments, expenses, and alerts.

Core schema file:

```text
prisma/schema.prisma
```

Main entities:

- `Role`
- `User`
- `AuthAccount`
- `Property`
- `Unit`
- `PropertyManagerAssignment`
- `PropertyManagerInviteCode`
- `ManagerAssignmentRequest`
- `UnitInviteCode`
- `UnitConnectionRequest`
- `Lease`
- `Invoice`
- `Payment`
- `PaymentReceivingAccount`
- `Expense`
- `Alert`
- `AlertRecipient`

Important relationships:

- One owner owns many properties.
- One property has many units.
- One unit can have many leases over time, but only one active lease should be treated as current.
- One tenant can have multiple leases.
- One lease has many invoices.
- One invoice has many payments.
- One property can have one or more manager assignments over time.
- Alerts can be attached to properties, units, leases, invoices, or assignments.

## 8. Main Business Workflows

### Workflow A: Owner creates property and units

Files involved:

- `src/app/owner/properties/page.tsx`
- `src/app/owner/properties/new/page.tsx`
- `src/app/owner/properties/[id]/page.tsx`
- `src/features/properties/properties.actions.ts`
- `src/features/units/units.actions.ts`

Flow:

1. owner opens property page
2. UI calls `getProperties()`
3. action checks session and role scope
4. action queries Prisma
5. page displays properties and unit counts
6. owner can add/edit/archive properties and units

Important rule:

Archived or historical records are preserved when needed instead of always hard-deleting data.

### Workflow B: Tenant connects to a unit

Files involved:

- `src/features/leases/leases.actions.ts`
- `src/app/tenant/dashboard/page.tsx`
- `src/app/owner/requests/page.tsx`
- `src/app/manager/requests/page.tsx`
- `src/components/leases/LeaseApprovalForm.tsx`

Flow:

1. owner generates a unit invite code
2. tenant enters the code
3. system hashes and checks the invite code
4. system creates a `UnitConnectionRequest`
5. owner or manager reviews the request
6. if approved, the system creates a real `Lease`
7. unit occupancy changes to occupied

Important rule:

The app does not create fake draft leases for pending requests. Pending states live in request tables.

### Workflow C: Manager gets assigned to a property

Files involved:

- `src/features/managerAssignments/managerAssignments.actions.ts`
- `src/app/manager/dashboard/page.tsx`
- `src/components/layout/NotificationBell.tsx`

Flow:

1. owner creates manager invite code
2. manager enters code
3. system creates a `ManagerAssignmentRequest`
4. owner approves or rejects the request
5. approved manager can access only assigned property data

Important rule:

Managers are scoped through active `PropertyManagerAssignment` records.

### Workflow D: Monthly invoice generation

Files involved:

- `src/components/invoices/InvoiceManagementPage.tsx`
- `src/features/invoices/invoices.actions.ts`
- `src/components/finance/FinancePage.tsx`

Flow:

1. owner/manager opens finance page
2. selects year, month, property, and status
3. previews active leases for that billing month
4. creates invoices in bulk or individually
5. invoice stores rent, utility fee, management fee, penalty, other fee, total, due date, and status

Important rule:

Invoice uniqueness is protected by lease + billing year + billing month.

### Workflow E: Tenant payment and proof review

Files involved:

- `src/components/invoices/TenantPaymentsPage.tsx`
- `src/app/api/payments/proofs/route.ts`
- `src/lib/payment-proof-storage.ts`
- `src/features/invoices/invoices.actions.ts`

Flow:

1. tenant views invoice
2. tenant sees bank/VietQR payment instruction
3. tenant uploads proof file
4. `/api/payments/proofs` validates file type and size
5. file is uploaded to private Supabase Storage
6. payment row is created with `PENDING` status
7. invoice status becomes `PENDING_REVIEW`
8. owner/manager opens proof using a signed URL
9. owner/manager verifies or rejects the payment
10. verified payments count toward invoice paid total

Important rule:

Only verified payments count as actual collected revenue.

### Workflow F: Revenue and expenses

Files involved:

- `src/components/expenses/RevenueManagementPage.tsx`
- `src/features/expenses/expenses.actions.ts`
- `src/components/finance/FinancePage.tsx`

Flow:

1. owner/manager selects month and property
2. system calculates invoiced amount, verified paid amount, expenses, and net operating income
3. user can add/edit/void expenses
4. analytics show performance by property and category

Important rule:

Expenses are voided instead of deleted to preserve audit history.

### Workflow G: Alerts and notifications

Files involved:

- `src/features/alerts/alerts.generator.ts`
- `src/features/alerts/alerts.actions.ts`
- `src/components/layout/NotificationBell.tsx`
- `src/components/alerts/NotificationsPage.tsx`

Flow:

1. dashboard calls `getDashboardMetrics()`
2. dashboard refreshes operational alerts
3. generator creates or updates alerts for:
   - overdue invoices
   - leases expiring within 30 days
   - vacant units older than 7 days
   - pending payment proofs
4. alert records use `dedupeKey` to prevent duplicates
5. users see unread counts and can mark alerts as read

## 9. Component Architecture

### Layout components

`AppLayout.tsx`

- reads session on server
- enforces allowed roles
- renders sidebar, top search, notification bell, profile dropdown

`SharedSidebar.tsx`

- client component
- shows role-based navigation
- owner: dashboard, properties, finance
- manager: dashboard, assigned properties, finance
- tenant: dashboard, payments, contracts

`NotificationBell.tsx`

- client component
- polls alerts every 60 seconds
- shows alert count
- also shows pending manager requests, unit requests, and lease termination requests
- lets owner/manager approve/reject some requests directly

### Feature page components

`FinancePage.tsx`

- wrapper with tabs for invoices and revenue
- used by both owner and manager routes

`InvoiceManagementPage.tsx`

- invoice filters
- monthly invoice preview
- invoice creation
- receiving bank account setup
- payment proof review

`TenantPaymentsPage.tsx`

- tenant invoice display
- VietQR/payment instruction
- proof upload form
- payment history

`RevenueManagementPage.tsx`

- expense form drawer
- revenue analytics
- expense category breakdown
- expense history

`LeaseApprovalForm.tsx`

- creates lease from approved tenant connection request

## 10. Server Actions Pattern

Most feature actions follow this pattern:

```text
1. parse input with Zod
2. require session or role
3. check property/user access
4. run Prisma query or transaction
5. return { success, message, data, errors }
```

Example action files:

- `src/features/auth/auth.actions.ts`
- `src/features/properties/properties.actions.ts`
- `src/features/units/units.actions.ts`
- `src/features/leases/leases.actions.ts`
- `src/features/invoices/invoices.actions.ts`
- `src/features/expenses/expenses.actions.ts`
- `src/features/alerts/alerts.actions.ts`

Why this matters:

Server Actions keep business logic on the server while allowing components to call typed functions directly.

## 11. Validation Pattern

Validation schemas live beside each feature.

Examples:

- `src/features/auth/auth.validation.ts`
- `src/features/properties/properties.validation.ts`
- `src/features/leases/leases.validation.ts`
- `src/features/invoices/invoices.validation.ts`
- `src/features/expenses/expenses.validation.ts`

The benefit is that each feature owns its own input rules.

## 12. Styling and Design System

Global styles:

```text
src/app/globals.css
```

The app uses Tailwind CSS 4 with theme tokens:

- `brand-primary`: `#D98725`
- `brand-primary-deep`: `#C2771F`
- `brand-accent`: `#19BDFF`
- `brand-ink`: `#1A1A1A`
- `brand-muted`: `#757575`
- `brand-border`: `#E8E1D6`
- `brand-soft`: `#F8F5EE`

Reusable UI utilities:

- `shell-card`
- `shell-panel`
- `shell-muted`
- `btn-primary`
- `btn-secondary`
- `btn-ghost`
- `input-shell`
- `stat-tile`
- `warm-badge`

Fonts:

- headings: Plus Jakarta Sans
- body: Inter

## 13. What to Say If Asked “Did You Build This Yourself?”

A strong, honest answer:

> I used AI assistance to help generate and iterate parts of the project, but I am responsible for understanding the architecture, explaining the code, testing the flows, and presenting how the system works. I reviewed the codebase and can explain the main modules, data model, route structure, server actions, and business workflows.

Then immediately show that you understand it:

- explain the role-based flow
- explain Server Actions
- explain Prisma schema relationships
- explain payment proof upload
- explain authorization checks

Teachers usually care less about whether AI helped and more about whether you can defend the design and understand the code.

## 14. Strengths of the Project

- Full-stack implementation, not only frontend mockups
- Role-based access for owner, manager, tenant, and admin
- Real relational database model
- Practical rental workflows
- Server-side validation and authorization
- Private payment proof storage
- Finance analytics and expense tracking
- Notification system with deduplication
- Demo seed data for testing
- Vietnamese UI tailored to local rental/payment behavior

## 15. Known Weaknesses and Improvement Points

These are useful to mention if asked what you would improve.

### 1. No automated test suite yet

The README says there are no automated tests yet. Current validation is mostly manual plus TypeScript and ESLint.

Future improvement:

- add unit tests for server actions
- add integration tests for invoice/payment workflows
- add Playwright tests for role-based flows

### 2. Middleware admin-route issue

`src/middleware.ts` computes role prefix from `session.role.toLowerCase()`. For an admin, that becomes `/admin`, but there is no `/admin` route group. Some layouts allow `ADMIN`, but middleware may redirect admin users incorrectly.

Future improvement:

- decide whether admin should use `/owner`, `/manager`, or a real `/admin` route
- update middleware role routing logic accordingly

### 3. Some authorization logic is duplicated

`properties.actions.ts` has local access helper logic, while `src/lib/authz.ts` also provides shared helpers.

Future improvement:

- consolidate authorization checks through `src/lib/authz.ts`

### 4. Top search appears UI-only

`AppLayout.tsx` has a search input, but it does not currently perform global search.

Future improvement:

- add global search across properties, units, invoices, and tenants

### 5. Notification dropdown may be too wide

`NotificationBell.tsx` uses a very wide dropdown (`w-[1400px]`). This may be awkward on smaller screens.

Future improvement:

- make notification center responsive
- use a drawer or page for complex approval workflows

### 6. Branding name is inconsistent

Repository name is `Nha Dat Pro`, while UI brand is `Địa Ốc Hub`.

Future improvement:

- choose one official name before final presentation or deployment

## 16. Teacher Q&A Prep

### What architecture pattern does this project use?

It uses a full-stack Next.js App Router architecture. Pages and layouts live in `src/app`, reusable UI lives in `src/components`, domain-specific server logic lives in `src/features`, and infrastructure helpers live in `src/lib`.

### Why use Server Actions?

Server Actions keep database mutations on the server while allowing the frontend to call feature-specific functions directly. This fits Next.js App Router and avoids creating a large REST API for every internal action.

### How is authentication handled?

The app uses custom JWT sessions. Login validates credentials, signs a JWT with `JWT_SECRET`, and stores it in an HTTP-only `session` cookie. Server code reads the cookie to authorize requests.

### How are roles enforced?

There are two layers:

1. middleware redirects users based on route prefix
2. server actions check the current session and property scope before accessing data

The server-side checks are the more important security layer.

### How does a tenant join a unit?

The owner creates a unit invite code. The tenant enters the code. The app creates a pending `UnitConnectionRequest`. An owner or assigned manager approves it and creates a `Lease`.

### How does payment verification work?

Tenant uploads a proof file through `/api/payments/proofs`. The file goes to private Supabase Storage. The database stores a payment row with `PENDING` status. Owner or manager reviews the proof through a signed URL and verifies or rejects it.

### Why use Prisma?

Prisma gives a typed ORM for PostgreSQL. It helps map the relational schema to TypeScript code and makes queries easier to maintain.

### How is financial accuracy handled?

The schema uses Prisma `Decimal` fields for money values instead of floating-point numbers. This avoids common rounding problems.

### How are alerts generated?

The dashboard refreshes operational alerts. The alert generator checks overdue invoices, expiring leases, vacant units, and pending payment proofs. It uses dedupe keys so repeated refreshes do not create duplicate alerts.

### What is the most complex part of the project?

The most complex part is the lease-invoice-payment workflow because it connects many entities:

```text
User -> UnitConnectionRequest -> Lease -> Invoice -> Payment -> Payment proof review -> Revenue analytics
```

### What would you improve next?

I would add automated tests, improve global search, clean up admin routing, consolidate authorization helpers, and make the notification center more responsive.

## 17. Suggested Presentation Structure

1. Problem: rental operations are scattered across chat, spreadsheets, and bank screenshots
2. Solution: one role-based platform for owners, managers, and tenants
3. Demo roles: owner, manager, tenant
4. Architecture: Next.js App Router + Server Actions + Prisma/Postgres
5. Data model: users, properties, units, leases, invoices, payments, expenses, alerts
6. Main workflow demo: tenant invite -> lease -> invoice -> payment proof -> verification
7. Finance demo: revenue, expenses, net income
8. Security: JWT cookie sessions, role checks, private file storage
9. Limitations and future improvements

## 18. Files You Should Know Before Presenting

Read these files first:

- `README.md`
- `markdowns/PROJECT_OVERVIEW.md`
- `markdowns/POSTER_BRIEF_REPORT.md`
- `prisma/schema.prisma`
- `src/app/layout.tsx`
- `src/middleware.ts`
- `src/lib/session.ts`
- `src/lib/authz.ts`
- `src/lib/prisma.ts`
- `src/components/layout/AppLayout.tsx`
- `src/features/auth/auth.actions.ts`
- `src/features/properties/properties.actions.ts`
- `src/features/leases/leases.actions.ts`
- `src/features/invoices/invoices.actions.ts`
- `src/app/api/payments/proofs/route.ts`
- `src/features/dashboard/dashboard.actions.ts`
- `src/features/alerts/alerts.generator.ts`

## 19. Best Short Defense of the Codebase

This project is organized around domain features rather than random pages. The frontend pages mainly display forms and dashboards, while the important business rules live in server actions. Prisma provides the database layer, Zod validates input, custom JWT sessions manage authentication, and shared authorization helpers enforce role-based access. The app is not only a UI; it has real workflows for properties, leases, invoices, payments, expenses, and alerts.

