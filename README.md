# Illoura Staff Admin Portal

Standalone Next.js 14 admin portal for **Illoura Staff** ordering, split out of the
main Caterly/Pulse admin app so it can run as its own Railway service.

## Sections
Orders · Products · Categories · Options · Dietary Codes · Coupons · Customers · Reports

## Local development
```bash
npm install
npm run dev     # http://localhost:3002
```

## Environment
| Variable | Description |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | Base URL of the shared Caterly API (e.g. `https://api.caterly.com.au`) |

## Backend
This portal talks to the same shared API as the main admin. All Illoura endpoints
live under `/admin/ellora/*` and are guarded by `ElloraAdminGuard`, which allows:
- full admins (`auth_level <= 2`), and
- the Illoura-only role (`auth_level = 5`).

Create an Illoura-only login by adding an admin user with `auth_level = 5`; that user
can access this portal but no other admin controllers.

## Deploy (Railway)
Deploys from the `Dockerfile` (Next.js standalone output, listens on `PORT`, default 8080).
Set `NEXT_PUBLIC_API_URL` and point the service root at this `illoura-admin/` directory.
