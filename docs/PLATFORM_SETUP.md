# Attendy Multi-Product Platform — Complete Setup Guide

## What's Been Built

```
attendy-web/          → Hub landing page (attendy-web.vercel.app)
attendy-admin/        → Central admin portal (attendy-admin.vercel.app)
attendy-bank/         → Banks & financial institutions
attendy-office/       → Offices & coworking spaces
attendy-biz/          → Businesses & SMEs
attendy-events/       → Events & conferences
```

All products share the same Supabase project (no duplicate databases).

---

## Step 1 — Supabase Setup

Run `SUPABASE_MIGRATIONS.sql` in your Supabase SQL editor (Dashboard → SQL Editor).

This adds:
- `industry` column to `schools` table
- `custom_requests` table
- `visitor_logs` table (offices)
- `desk_bookings` table (offices)
- `payroll_exports` table (businesses)
- `ticket_type` + `ticket_zone` columns on `students` (events)
- Performance indexes

---

## Step 2 — Environment Variables

Every project needs these in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
HEAD_ADMIN_JWT_SECRET=your-random-32-char-secret-here
NEXT_PUBLIC_SITE_URL=https://attendy-edu.vercel.app   # change per product
TERMII_API_KEY=your-termii-key
TERMII_SENDER_ID=Attendy
PARENT_JWT_SECRET=your-parent-jwt-secret
```

⚠️ `HEAD_ADMIN_JWT_SECRET` must be the SAME value in all projects (admin, edu, bank, office, biz, events).

---

## Step 3 — Deploy Order

### 1. attendy-web (hub landing page)
```bash
cd attendy-web
npm install
npm run dev
# Deploy to Vercel as attendy-web
```

### 2. attendy-admin (central portal)
```bash
cd attendy-admin
npm install
npm run dev
# Deploy to Vercel as attendy-admin
```
After deploying, go to `attendy-edu.vercel.app/setup` to create your first head admin account (if not already done).

### 3–6. Verticals (bank, office, biz, events)
```bash
# Same pattern for each
cd attendy-bank
npm install
npm run dev
```

---

## Step 4 — Creating New Organisations Per Vertical

### Via attendy-admin (recommended)
1. Go to `attendy-admin.vercel.app`
2. Log in with your head admin credentials
3. Click **Organisations → New Organisation**
4. Select the **Product/Industry** (Schools, Banks, Offices, etc.)
5. Fill in org name, slug, plan, admin credentials
6. Click **Create Organisation**

The organisation will appear in the right product's app automatically (same Supabase DB, filtered by `industry`).

### Via attendy-edu/setup API (legacy, schools only)
Use the existing `/api/head-admin/schools/create` endpoint.

---

## Product URLs & Features

| Product | URL | Key Features |
|---------|-----|--------------|
| Hub | attendy-web.vercel.app | Landing, product links, custom request form |
| Admin | attendy-admin.vercel.app | All orgs, subscriptions, requests, activity |
| Schools | attendy-edu.vercel.app | Student QR, parent SMS, teacher/gateman scan |
| Banks | attendy-bank.vercel.app | Clock in/out, compliance logs, branch reports |
| Offices | attendy-office.vercel.app | Check-in, visitor sign-in, hot desk map |
| Businesses | attendy-biz.vercel.app | Payroll-ready export, workforce analytics |
| Events | attendy-events.vercel.app | Ticket scanning, zone access, live headcount |

---

## Per-Product Roles

| Role | Schools | Banks | Offices | Businesses | Events |
|------|---------|-------|---------|------------|--------|
| admin | ✅ | ✅ | ✅ | ✅ | ✅ |
| teacher | ✅ | ❌ | ❌ | ❌ | ❌ |
| gateman | ✅ | ✅ | ✅ | ✅ | ✅ |
| parent | ✅ | ❌ | ❌ | ❌ | ❌ |

All roles are created via the invite flow at `/{org_slug}/auth/verify-otp` (same across all products).

---

## Shared Components (copy from attendy-edu)

These files work identically across all products — copy them as-is:

```
src/components/scanner/QRScanner.tsx    # Core QR scanning
src/lib/supabase/client.ts              # Browser Supabase client
src/lib/supabase/server.ts              # Server Supabase client
src/lib/supabase/types.ts               # TypeScript types
src/app/api/notify/route.ts             # SMS notifications
src/app/api/export-attendance/route.ts  # CSV export
src/app/api/invite-staff/route.ts       # Staff invites
src/app/api/resend-invite/route.ts      # Resend invite codes
src/middleware.ts                        # Auth middleware
src/proxy.ts                            # Supabase session proxy
```

---

## attendy-admin Features

### Dashboard Overview
- Total orgs across ALL products
- Active subscriptions, members, daily scans
- Revenue estimate (ARR)
- New custom requests counter
- Recent activity log

### Organisations Page
- Create org for any industry (school, bank, office, biz, event)
- Filter by industry and plan
- Suspend/activate toggle
- Link to manage each org

### Subscriptions Page
- All subscriptions with expiry dates
- ⚠️ Alerts for expired and expiring-soon orgs
- Revenue estimates (ARR, MRR)
- Plan distribution chart
- Full subscription activity log

### Custom Requests Page
- See all submissions from attendy-web hub
- Status pipeline: new → contacted → converted → declined
- Side panel detail view
- One-click reply via email (opens mailto)
- Status update buttons

### Settings Page
- Update head admin password
- JWT secret rotation instructions

---

## Colour System

| Product | Primary | Hex |
|---------|---------|-----|
| Hub (attendy-web) | Blue→Purple gradient | `#3b82f6 → #8b5cf6` |
| Admin (attendy-admin) | Indigo | `#6366f1` |
| Schools | Green | `#22c55e` |
| Banks | Blue | `#3b82f6` |
| Offices | Purple | `#8b5cf6` |
| Businesses | Amber | `#f59e0b` |
| Events | Rose | `#f43f5e` |

---

## Adding More Verticals Later

1. Add new industry value to the `CHECK` constraint in Supabase:
   ```sql
   ALTER TABLE schools DROP CONSTRAINT schools_industry_check;
   ALTER TABLE schools ADD CONSTRAINT schools_industry_check
     CHECK (industry IN ('education','banking','office','business','events','other','clinic','warehouse'));
   ```

2. Add the new vertical to `PRODUCT_META` in `attendy-admin/src/app/dashboard/page.tsx`

3. Create a new Next.js project following the same pattern

4. Deploy to Vercel

---

## Support

- Email: attendyofficial@gmail.com
- Developer: hashcody63@gmail.com
