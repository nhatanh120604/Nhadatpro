# Database Design

## Strategy overview

The schema uses PostgreSQL through Prisma and is designed around strong relational integrity for property, lease, billing, and assignment workflows.

## Main entity groups

- `roles`, `users`
- `properties`, `units`
- `property_manager_assignments`
- `property_manager_invite_codes`, `manager_assignment_requests`
- `leases`
- `unit_invite_codes`, `unit_connection_requests`
- `invoices`, `payments`
- `expenses`
- `alerts`, `alert_recipients`
- `auth_accounts`

## Important business rules reflected in code

1. Role-based ownership and visibility are enforced server-side.
2. A lease is the real tenant-to-unit contract record.
3. Pending tenant and manager onboarding flows are stored as request records, not as draft assignments in the final tables.
4. Historical operational data should be preserved for reporting, even when a property or unit is archived from active use.
5. Financial values use Prisma `Decimal` mappings for accuracy.

## Environment note

For local development and CLI work:

- `DATABASE_URL` can point to the pooled connection.
- `DIRECT_URL` should point to the direct PostgreSQL connection.

This matters for Prisma commands such as `db push`, `migrate`, `studio`, and `seed`.
