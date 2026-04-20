# ================================================================
# ATTENDY PLATFORM — MASTER REFERENCE DOCUMENT
# Everything created, where every file goes, what remains, third-party apps
# ================================================================


# ════════════════════════════════════════════════════════════════
# SECTION A — PLATFORM OVERVIEW
# ════════════════════════════════════════════════════════════════

7 Next.js projects, 1 Supabase database, 1 Vercel team.

  attendy-web.vercel.app       → Hub landing page (all 5 products)
  attendy-admin.vercel.app     → Central command portal (head admins only)
  attendy-edu.vercel.app       → Schools product (LIVE / most complete)
  attendy-bank.vercel.app      → Banking & financial institutions
  attendy-office.vercel.app    → Offices & coworking spaces
  attendy-biz.vercel.app       → Businesses & SMEs
  attendy-events.vercel.app    → Events & conferences


# ════════════════════════════════════════════════════════════════
# SECTION B — THIRD-PARTY SERVICES REQUIRED
# ════════════════════════════════════════════════════════════════

## 1. SUPABASE (Database + Auth + Storage)
   Website  : https://supabase.com
   What for : PostgreSQL database, user authentication, file storage
   Plan     : Free tier works up to ~500MB DB / 50,000 auth users
               Upgrade to Pro ($25/month) for production
   Setup    : Create NEW project → run FRESH_SUPABASE_SCHEMA.sql
   Keys needed:
     NEXT_PUBLIC_SUPABASE_URL
     NEXT_PUBLIC_SUPABASE_ANON_KEY
     SUPABASE_SERVICE_ROLE_KEY
   Dashboard: https://supabase.com/dashboard

## 2. TERMII (SMS + WhatsApp Notifications)
   Website  : https://termii.com
   What for : "Amara arrived safely at 7:52 AM" SMS to parents/contacts
               Also used for OTP verification codes for staff invites
   Plan     : Pay-as-you-go. ₦2/SMS in Nigeria ($0.0107)
               Token/OTP: $0.0001 per verification
   Setup    : Sign up → Get API Key → Register Sender ID (takes 1-3 days)
   Keys needed:
     TERMII_API_KEY
     TERMII_SENDER_ID        (e.g. "Attendy" — must be approved)
   Note     : DND channel recommended for Nigerian numbers
              Sender ID approval required before sending

## 3. VERCEL (Deployment + Hosting)
   Website  : https://vercel.com
   What for : Deploy all 7 Next.js projects
   Plan     : Hobby (free) for personal; Pro ($20/month) for team features
               Each project deploys for free on Hobby
   Setup    : Connect GitHub repos → add env vars → deploy
   Notes    :
     - Create one Vercel account / team
     - Deploy each of the 7 projects as separate Vercel projects
     - Add custom domain per project (optional)

## 4. BCRYPTJS (Password Hashing) — npm package
   Package  : npm install bcryptjs @types/bcryptjs
   What for : Hashing head admin passwords
              Already used in attendy-edu and attendy-admin
   No signup needed — just install the package

## 5. JOSE (JWT) — npm package
   Package  : npm install jose
   What for : Signing and verifying JWT tokens for:
               - Head admin sessions (attendy-admin)
               - Parent sessions (phone-based, no Supabase Auth)
   No signup needed — just install the package

## 6. DATE-FNS (Date formatting) — npm package
   Package  : npm install date-fns
   What for : Format dates on dashboards, reports, attendance logs
   No signup needed — just install the package

## 7. SONNER (Toast notifications) — npm package
   Package  : npm install sonner
   What for : Success/error toast messages across all products
   No signup needed — just install the package

## 8. HTML5-QRCODE (QR Scanner) — npm package
   Package  : npm install html5-qrcode
   What for : Camera-based QR code scanning on all scanner pages
   No signup needed — just install the package

## 9. QRCODE.REACT (QR Code Generator) — npm package
   Package  : npm install qrcode.react
   What for : Generate QR code images for ID cards
   No signup needed — just install the package

## OPTIONAL (implement later):
   Resend (email)       : https://resend.com  — for transactional emails
                          Free: 100 emails/day, $20/month for more
                          Use for: invite emails, password resets, reports
   Paystack (payments)  : https://paystack.com — for subscription billing
                          Nigeria-focused payment gateway
                          Use for: schools/orgs paying for their plan
   Google Analytics     : https://analytics.google.com — free usage tracking
   Cloudflare (CDN)     : https://cloudflare.com — free CDN / DDoS protection


# ════════════════════════════════════════════════════════════════
# SECTION C — EVERY FILE CREATED (with exact file path)
# ════════════════════════════════════════════════════════════════

## DATABASE
  FRESH_SUPABASE_SCHEMA.sql
    → Run in Supabase Dashboard → SQL Editor
    → Creates all 14 tables, views, triggers, RLS policies, indexes

  SUPABASE_MIGRATIONS.sql (OLD — superseded by FRESH schema)
    → Only needed if patching old school database

## ENVIRONMENT VARIABLES
  .env.template
    → Copy to .env.local in each of the 7 projects
    → Fill in Supabase keys, Termii keys, JWT secrets

## SHARED TEMPLATES (copy to each new vertical)
  shared-templates/login-template.tsx
    → Template login page with colour constants at top
    → Change ACCENT, GRAD_FROM, GRAD_TO, INDUSTRY_LABEL per vertical

  shared-templates/admin-layout-template.tsx
    → Template sidebar layout with colour theming
    → Change accent colour + nav items per vertical

  shared-templates/middleware-template.ts
    → Identical for all verticals — copy as-is

  shared-templates/types.ts
    → Complete TypeScript types for new schema
    → Place at: src/lib/supabase/types.ts in each project

## PROJECT: attendy-web
  src/app/page.tsx              → Hub landing page (all 5 product cards)
  src/app/layout.tsx            → Root layout
  src/app/globals.css           → Base styles
  src/app/api/custom-request/route.ts  → Saves custom request form to Supabase

## PROJECT: attendy-admin
  src/app/page.tsx              → Root redirect (→ /dashboard or /login)
  src/app/layout.tsx            → Root layout
  src/app/globals.css           → Base styles
  src/app/login/page.tsx        → Login page (indigo/purple theme)
  src/app/api/auth/login/route.ts   → JWT login endpoint
  src/app/api/auth/logout/route.ts  → Logout endpoint
  src/app/api/orgs/create/route.ts  → Create org for any industry
  src/app/api/orgs/[org_id]/toggle/route.ts  → Toggle org active status
  src/app/api/requests/[request_id]/route.ts → Update request status
  src/app/dashboard/page.tsx    → Overview (stats, activity, revenue)
  src/app/dashboard/orgs/page.tsx          → Org list with filters
  src/app/dashboard/orgs/OrgsClient.tsx    → Client component for org list
  src/app/dashboard/subs/page.tsx          → Subscriptions + billing
  src/app/dashboard/requests/page.tsx      → Custom requests (server)
  src/app/dashboard/requests/RequestsClient.tsx → Requests CRM client
  src/components/DashboardLayout.tsx       → Sidebar + topbar layout
  src/lib/auth.ts                          → getSession + requireSession
  src/middleware.ts                        → Route protection

## PROJECT: attendy-edu (original — mostly complete)
  src/app/page.tsx              → Landing/school login hub
  src/app/setup/page.tsx        → One-time head admin setup
  src/app/status/page.tsx       → Public school status checker
  src/app/termii-test/page.tsx  → SMS debug tool
  src/app/layout.tsx            → Root layout
  src/app/globals.css           → Base styles

  src/app/[school_slug]/login/page.tsx         → School login
  src/app/[school_slug]/login/LoginClient.tsx  → Login client component
  src/app/[school_slug]/login/SchoolNotFoundPage.tsx → 404 page

  src/app/[school_slug]/auth/callback/route.ts     → OAuth callback
  src/app/[school_slug]/auth/verify-otp/page.tsx   → OTP verification
  src/app/[school_slug]/auth/set-password/...      → Password setup

  src/app/[school_slug]/admin/layout.tsx           → Admin sidebar layout
  src/app/[school_slug]/admin/dashboard/page.tsx   → Admin dashboard
  src/app/[school_slug]/admin/students/page.tsx    → Student list
  src/app/[school_slug]/admin/students/StudentList.tsx
  src/app/[school_slug]/admin/students/register/page.tsx
  src/app/[school_slug]/admin/students/absent/page.tsx
  src/app/[school_slug]/admin/students/bulk/page.tsx
  src/app/[school_slug]/admin/students/[id]/qr/page.tsx
  src/app/[school_slug]/admin/students/[id]/qr/QRCardClient.tsx
  src/app/[school_slug]/admin/staff/page.tsx       → Staff management
  src/app/[school_slug]/admin/reports/page.tsx     → Reports + charts
  src/app/[school_slug]/admin/settings/page.tsx    → Settings

  src/app/[school_slug]/teacher/layout.tsx         → Teacher layout
  src/app/[school_slug]/teacher/scan/page.tsx      → Teacher QR scanner
  src/app/[school_slug]/teacher/attendance/page.tsx → Attendance view

  src/app/[school_slug]/gateman/scan/page.tsx      → Gateman scanner

  src/app/[school_slug]/parent/login/page.tsx      → Parent phone login
  src/app/[school_slug]/parent/my-child/page.tsx   → Parent portal

  src/app/head-admin/login/page.tsx                → Head admin login (old)
  src/app/head-admin/dashboard/page.tsx            → Head admin overview
  src/app/head-admin/schools/page.tsx              → Schools list
  src/app/head-admin/schools/[id]/page.tsx         → School detail
  src/app/head-admin/subscriptions/page.tsx        → Subscriptions
  src/app/head-admin/HeadAdminNav.tsx              → Head admin nav

  src/app/api/notify/route.ts                      → Termii SMS
  src/app/api/export-attendance/route.ts           → CSV export
  src/app/api/invite-staff/route.ts                → Staff invite + OTP
  src/app/api/resend-invite/route.ts               → Resend invite code
  src/app/api/reset-password/route.ts              → Password reset
  src/app/api/parent-login/route.ts                → Parent JWT
  src/app/api/parent-attendance/route.ts           → Parent data
  src/app/api/bulk-register/route.ts               → Bulk student import
  src/app/api/school-status/route.ts               → Status check
  src/app/api/head-admin/auth/login/route.ts       → Head admin login
  src/app/api/head-admin/auth/logout/route.ts      → Head admin logout
  src/app/api/head-admin/schools/create/route.ts   → Create school
  src/app/api/head-admin/schools/[id]/toggle/route.ts
  src/app/api/head-admin/schools/[id]/update/route.ts
  src/app/api/setup/create/route.ts                → Setup head admin
  src/app/api/setup/status/route.ts                → Check setup done
  src/app/api/termii-test/route.ts                 → SMS test

  src/components/scanner/QRScanner.tsx             → QR scanner component
  src/components/ui/AppDownloadBanner.tsx          → App download prompt
  src/lib/supabase/client.ts                       → Browser Supabase client
  src/lib/supabase/server.ts                       → Server Supabase client
  src/lib/supabase/types.ts                        → TypeScript types
  src/lib/head-admin/auth.ts                       → Head admin JWT helpers
  src/middleware.ts                                → Auth middleware
  src/proxy.ts                                     → Supabase session proxy

## PROJECT: attendy-bank
  src/app/[org_slug]/login/page.tsx               → Login (blue theme)
  src/app/[org_slug]/admin/layout.tsx             → Admin sidebar (blue)
  src/app/[org_slug]/admin/dashboard/page.tsx     → Dashboard (5 stats)
  src/app/[org_slug]/admin/staff/page.tsx         → Staff management
  src/app/[org_slug]/admin/reports/page.tsx       → Reports + trends
  src/app/[org_slug]/admin/settings/page.tsx      → Settings (shifts)
  src/app/[org_slug]/staff/scan/page.tsx          → Clock in/out scanner
  src/middleware.ts                               → Auth protection

## PROJECT: attendy-office
  src/app/[org_slug]/admin/layout.tsx             → Admin sidebar (purple)
  src/app/[org_slug]/admin/dashboard/page.tsx     → Dashboard + hot desk
  src/app/[org_slug]/admin/visitors/page.tsx      → Visitor log management
  src/app/[org_slug]/visitor/page.tsx             → Public visitor sign-in
  src/app/api/visitor-signin/route.ts             → Visitor sign-in API

  MISSING (still to build):
    src/app/[org_slug]/login/page.tsx
    src/app/[org_slug]/admin/staff/page.tsx
    src/app/[org_slug]/admin/reports/page.tsx
    src/app/[org_slug]/admin/settings/page.tsx
    src/app/[org_slug]/staff/scan/page.tsx
    src/middleware.ts

## PROJECT: attendy-biz
  src/app/[org_slug]/admin/layout.tsx             → Admin sidebar (amber)
  src/app/[org_slug]/admin/dashboard/page.tsx     → Dashboard + payroll

  MISSING (still to build):
    src/app/[org_slug]/login/page.tsx
    src/app/[org_slug]/admin/staff/page.tsx
    src/app/[org_slug]/admin/reports/page.tsx
    src/app/[org_slug]/admin/payroll/page.tsx
    src/app/[org_slug]/admin/settings/page.tsx
    src/app/[org_slug]/staff/scan/page.tsx
    src/middleware.ts

## PROJECT: attendy-events
  src/app/[org_slug]/admin/layout.tsx             → Admin sidebar (rose)
  src/app/[org_slug]/admin/dashboard/page.tsx     → Live headcount
  src/app/[org_slug]/admin/guests/page.tsx        → Guest list by zone
  src/app/[org_slug]/staff/scan/page.tsx          → Ticket scanner

  MISSING (still to build):
    src/app/[org_slug]/login/page.tsx
    src/app/[org_slug]/admin/zones/page.tsx
    src/app/[org_slug]/admin/reports/page.tsx
    src/app/[org_slug]/admin/settings/page.tsx
    src/middleware.ts


# ════════════════════════════════════════════════════════════════
# SECTION D — WHAT REMAINS TO BUILD
# ════════════════════════════════════════════════════════════════

PRIORITY 1 — Required before any vertical can go live:
  □ attendy-office: login page (copy from bank, change #3b82f6 → #8b5cf6)
  □ attendy-office: middleware (copy middleware-template.ts, zero changes)
  □ attendy-biz:    login page (copy from bank, change colour to #f59e0b)
  □ attendy-biz:    middleware (copy as-is)
  □ attendy-events: login page (copy from bank, change colour to #f43f5e)
  □ attendy-events: middleware (copy as-is)

PRIORITY 2 — Core admin pages for each vertical:
  □ attendy-office: staff/employees management page
  □ attendy-office: employee scan page (check in/out, same as bank)
  □ attendy-office: reports page (attendance, occupancy trends)
  □ attendy-office: settings page (flex time, visitor toggle)
  □ attendy-biz:    workforce management page
  □ attendy-biz:    employee scan page
  □ attendy-biz:    reports page (monthly + weekly)
  □ attendy-biz:    payroll history page (list previous CSV exports)
  □ attendy-biz:    settings page (shift times, payroll period)
  □ attendy-events: zones management page (add/edit/delete zones)
  □ attendy-events: reports page (arrival timeline, check-in %)
  □ attendy-events: settings page (event dates, zones, ticket types)

PRIORITY 3 — attendy-admin missing pages:
  □ /dashboard/orgs/[org_id]    Individual org detail + edit plan/limits
  □ /dashboard/users            All users across all orgs (view, deactivate)
  □ /dashboard/sms              SMS log viewer + test SMS sender
  □ /dashboard/activity         Full activity log (paginated)
  □ /dashboard/settings         Change head admin password

PRIORITY 4 — attendy-edu missing pages:
  □ /[slug]/teacher/students    Teacher's own class student list
  □ /[slug]/gateman/log         Today's scan log for the gateman view
  □ /[slug]/admin/staff/[id]    Individual staff member detail + edit

PRIORITY 5 — Wire up API connections:
  □ attendy-web form → /api/custom-request  (BUILT, needs wiring in page.tsx)
  □ All verticals: copy /api/notify, /api/export-attendance, /api/invite-staff
    from attendy-edu (identical code, just update column names for new schema)

PRIORITY 6 — Update column references for new schema:
  □ All API routes: change "schools" → "organisations"
  □ All API routes: change "students" → "members"
  □ All API routes: change "school_id" → "organisation_id"
  (SQL views provide backward compat but clean code is better)


# ════════════════════════════════════════════════════════════════
# SECTION E — DEPLOYMENT CHECKLIST
# ════════════════════════════════════════════════════════════════

Step 1 — Create new Supabase project
  → Go to https://supabase.com/dashboard → New Project
  → Name: "attendy-platform"
  → Copy the URL, anon key, and service role key

Step 2 — Run the schema
  → Supabase Dashboard → SQL Editor → New Query
  → Paste entire FRESH_SUPABASE_SCHEMA.sql
  → Click Run

Step 3 — Create head admin
  → Go to attendy-edu.vercel.app/setup (or deploy attendy-admin first)
  → Fill in email, password, full name
  → This seals the setup page permanently

Step 4 — Create your .env.local files
  → Use .env.template
  → Fill in your new Supabase URL + keys
  → Use the SAME HEAD_ADMIN_JWT_SECRET in all 7 projects

Step 5 — Deploy each project to Vercel
  attendy-web    → NEXT_PUBLIC_SITE_URL=https://attendy-web.vercel.app
  attendy-admin  → NEXT_PUBLIC_SITE_URL=https://attendy-admin.vercel.app
  attendy-edu    → NEXT_PUBLIC_SITE_URL=https://attendy-edu.vercel.app
  attendy-bank   → NEXT_PUBLIC_SITE_URL=https://attendy-bank.vercel.app
  attendy-office → NEXT_PUBLIC_SITE_URL=https://attendy-office.vercel.app
  attendy-biz    → NEXT_PUBLIC_SITE_URL=https://attendy-biz.vercel.app
  attendy-events → NEXT_PUBLIC_SITE_URL=https://attendy-events.vercel.app

Step 6 — Register Termii sender ID
  → Login to termii.com
  → Sender IDs → Request new → "Attendy"
  → Wait 1-3 business days for approval
  → Copy your API key to all 7 projects

Step 7 — Create first organisation
  → Go to attendy-admin.vercel.app
  → Login with head admin credentials
  → Organisations → New Organisation
  → Fill in org details + admin credentials
  → The org will appear in the right product


# ════════════════════════════════════════════════════════════════
# SECTION F — PACKAGE.JSON DEPENDENCIES (install in each project)
# ════════════════════════════════════════════════════════════════

npm install \
  @supabase/supabase-js \
  @supabase/ssr \
  bcryptjs \
  @types/bcryptjs \
  jose \
  date-fns \
  sonner \
  html5-qrcode \
  qrcode.react \
  lucide-react \
  next \
  react \
  react-dom \
  typescript

# attendy-edu also needs:
npm install qrcode.react @types/qrcode.react


# ════════════════════════════════════════════════════════════════
# SECTION G — COLOUR REFERENCE
# ════════════════════════════════════════════════════════════════

  attendy-web    : Blue → Purple gradient  (#3b82f6 → #8b5cf6)
  attendy-admin  : Indigo                  (#6366f1)
  attendy-edu    : Green                   (#22c55e / #16a34a)
  attendy-bank   : Blue                    (#3b82f6 / #1d4ed8)
  attendy-office : Purple                  (#8b5cf6 / #6d28d9)
  attendy-biz    : Amber                   (#f59e0b / #b45309)
  attendy-events : Rose                    (#f43f5e / #be185d)


# ════════════════════════════════════════════════════════════════
# SECTION H — BUILD PROGRESS SUMMARY
# ════════════════════════════════════════════════════════════════

  attendy-web    : ████████████████████ 95%  (missing: wire form to API)
  attendy-admin  : ████████████████░░░░ 80%  (missing: 5 pages)
  attendy-edu    : ████████████████████ 95%  (most complete, production-ready)
  attendy-bank   : ████████████████░░░░ 80%  (missing: login, middleware done)
  attendy-office : ████████████░░░░░░░░ 60%  (missing: login, 4 pages)
  attendy-biz    : ████████░░░░░░░░░░░░ 40%  (missing: login, 5 pages)
  attendy-events : ████████████░░░░░░░░ 60%  (missing: login, 3 pages)

  Total platform : ████████████████░░░░ ~75% complete
