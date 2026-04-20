# ================================================================
# ATTENDY PLATFORM — COMPLETE BUILD AUDIT
# What has been built vs what is still missing
# ================================================================

## LEGEND
## ✅ BUILT   — code exists and was delivered
## ⚠️  PARTIAL — skeleton exists but needs completion
## ❌ MISSING  — not yet built, needs to be done


# ================================================================
# PROJECT 1: attendy-web (Hub Landing Page)
# ================================================================

Pages:
  ✅ / (page.tsx)              — Full landing page with all 5 product cards,
                                  problem section, how-it-works, custom request form,
                                  features strip, CTA, footer
  ✅ layout.tsx                — Root layout with metadata
  ✅ globals.css               — Base styles

API Routes:
  ❌ /api/custom-request       — Save form submission to Supabase custom_requests table
                                  (form currently does a fake setTimeout — needs wiring)

Missing:
  ❌ /status                   — School status checker page (already in attendy-edu, 
                                  needs a version for the hub too)


# ================================================================
# PROJECT 2: attendy-admin (Central Command)
# ================================================================

Auth:
  ✅ /login                    — Login page (indigo theme)
  ✅ /api/auth/login           — JWT login endpoint
  ✅ /api/auth/logout          — Logout endpoint
  ✅ src/middleware.ts         — Route protection middleware
  ✅ src/lib/auth.ts           — Session helpers (getSession, requireSession)

Dashboard Pages:
  ✅ /dashboard                — Platform overview (stats, recent orgs, activity log, 
                                  revenue summary, product breakdown, requests widget)
  ✅ /dashboard/orgs           — Organisations list with filters, create modal
  ✅ /dashboard/orgs/[org_id]  — ❌ MISSING: individual org detail/edit page
  ✅ /dashboard/subs           — Subscriptions + billing + activity log
  ✅ /dashboard/requests       — Custom requests CRM pipeline

Missing Dashboard Pages:
  ❌ /dashboard/users          — All users across all orgs (view, deactivate)
  ❌ /dashboard/sms            — SMS log viewer, test SMS sender, Termii config
  ❌ /dashboard/activity       — Full activity log (expanded from overview widget)
  ❌ /dashboard/settings       — Head admin settings (change password, JWT info)
  ❌ /dashboard/orgs/new       — Dedicated new org page (modal exists in orgs list,
                                  but the /dashboard/orgs/new route is linked from dashboard)

Missing API Routes:
  ❌ /api/orgs/[org_id]/update — Update org plan, expiry, limits
  ❌ /api/orgs/[org_id]/toggle — ✅ BUILT
  ❌ /api/orgs/create          — ✅ BUILT
  ❌ /api/requests/[id]        — ✅ BUILT (PATCH status)

Components:
  ✅ DashboardLayout.tsx       — Sidebar + topbar layout component
  ✅ OrgsClient.tsx            — Organisations client component
  ✅ RequestsClient.tsx        — Requests CRM client component


# ================================================================
# PROJECT 3: attendy-edu (Schools)
# ================================================================

Auth:
  ✅ /[school_slug]/login               — Login page (green theme)
  ✅ /[school_slug]/auth/callback       — OAuth/magic link callback
  ✅ /[school_slug]/auth/verify-otp     — Staff OTP verification + password setup
  ✅ /[school_slug]/auth/set-password   — Password reset
  ✅ middleware + proxy                  — Route protection

Admin Pages:
  ✅ /[school_slug]/admin/dashboard     — Full dashboard (stats, scan feed, summary)
  ✅ /[school_slug]/admin/students      — Student list with search/filter
  ✅ /[school_slug]/admin/students/register        — Register new student
  ✅ /[school_slug]/admin/students/absent          — Absent students today
  ✅ /[school_slug]/admin/students/bulk            — Bulk import + QR card designer
  ✅ /[school_slug]/admin/students/[id]/qr         — Individual QR card designer
  ✅ /[school_slug]/admin/staff                    — Staff management + invite
  ✅ /[school_slug]/admin/reports                  — 7-day attendance reports + charts
  ✅ /[school_slug]/admin/settings                 — Late cutoff, SMS, timezone settings

Missing Admin Pages:
  ❌ /[school_slug]/admin/staff/[id]    — Individual staff member detail
  ❌ /[school_slug]/admin/reports/export — Dedicated export page (CSV exists via API)

Teacher Pages:
  ✅ /[school_slug]/teacher/scan        — QR scanner with late reason modal
  ✅ /[school_slug]/teacher/attendance  — Today's attendance list for teacher
  ✅ layout.tsx                          — Teacher layout with bottom nav

Missing Teacher Pages:
  ❌ /[school_slug]/teacher/students    — Teacher's class student list

Gateman Pages:
  ✅ /[school_slug]/gateman/scan        — Gateman QR scanner

Missing Gateman Pages:
  ❌ /[school_slug]/gateman/log         — Today's scan log for gateman

Parent Pages:
  ✅ /[school_slug]/parent/login        — Phone-based login
  ✅ /[school_slug]/parent/my-child     — Attendance history

API Routes:
  ✅ /api/notify                        — SMS via Termii
  ✅ /api/export-attendance             — CSV export
  ✅ /api/invite-staff                  — Staff invite with OTP
  ✅ /api/resend-invite                 — Resend OTP
  ✅ /api/reset-password                — Password reset email
  ✅ /api/parent-login                  — Phone-based parent JWT
  ✅ /api/parent-attendance             — Parent attendance data
  ✅ /api/bulk-register                 — Bulk student import
  ✅ /api/school-status                 — Public school status check
  ✅ /api/head-admin/auth/login         — Head admin login
  ✅ /api/head-admin/auth/logout        — Head admin logout
  ✅ /api/head-admin/schools/create     — Create school
  ✅ /api/head-admin/schools/[id]/toggle — Toggle school active
  ✅ /api/head-admin/schools/[id]/update — Update school plan/limits

Missing API Routes:
  ❌ /api/visitor-signin                — Office visitor sign-in (needed for attendy-office)

Head Admin Pages (embedded in attendy-edu, being replaced by attendy-admin):
  ✅ /head-admin/login                  — Head admin login
  ✅ /head-admin/dashboard              — Overview
  ✅ /head-admin/schools                — Schools list
  ✅ /head-admin/schools/[id]           — School detail
  ✅ /head-admin/subscriptions          — Subscriptions

Special Pages:
  ✅ /setup                             — One-time head admin setup
  ✅ /status                            — Public school status checker
  ✅ /termii-test                       — SMS debug tool
  ✅ / (landing page)                   — attendy-edu landing / school login hub

Components:
  ✅ QRScanner.tsx                      — Core QR scanning component
  ✅ AppDownloadBanner.tsx              — App download prompt


# ================================================================
# PROJECT 4: attendy-bank (Banks)
# ================================================================

Auth:
  ❌ /[org_slug]/login                  — MISSING (need to copy/adapt from edu)
  ❌ /[org_slug]/auth/verify-otp        — MISSING
  ❌ middleware.ts                       — MISSING

Admin Pages:
  ✅ /[org_slug]/admin/dashboard        — Branch dashboard (5 stats, scan log, trend chart)
  ❌ /[org_slug]/admin/staff            — MISSING: staff list + invite
  ❌ /[org_slug]/admin/reports          — MISSING: 7-day + monthly reports
  ❌ /[org_slug]/admin/settings         — MISSING: shift times, late cutoff, SMS
  ❌ /[org_slug]/admin/compliance       — MISSING: audit log view
  ❌ layout.tsx                          — MISSING: admin layout/sidebar

Staff Scanner:
  ✅ /[org_slug]/staff/scan             — Clock in/out scanner (blue theme)

Missing Scanner:
  ❌ /[org_slug]/staff/log              — MISSING: scanner's personal scan history


# ================================================================
# PROJECT 5: attendy-office (Offices)
# ================================================================

Auth:
  ❌ /[org_slug]/login                  — MISSING
  ❌ /[org_slug]/auth/verify-otp        — MISSING
  ❌ middleware.ts                       — MISSING

Admin Pages:
  ✅ /[org_slug]/admin/dashboard        — Office dashboard (occupancy, hot desk map)
  ❌ /[org_slug]/admin/staff            — MISSING
  ❌ /[org_slug]/admin/visitors         — MISSING: visitor log management
  ❌ /[org_slug]/admin/desks            — MISSING: desk booking management
  ❌ /[org_slug]/admin/reports          — MISSING
  ❌ /[org_slug]/admin/settings         — MISSING
  ❌ layout.tsx                          — MISSING

Special Pages:
  ✅ /[org_slug]/visitor                — Visitor sign-in form (purple theme, no login needed)

Scanner:
  ❌ /[org_slug]/staff/scan             — MISSING: employee check-in scanner


# ================================================================
# PROJECT 6: attendy-biz (Businesses)
# ================================================================

Auth:
  ❌ /[org_slug]/login                  — MISSING
  ❌ /[org_slug]/auth/verify-otp        — MISSING
  ❌ middleware.ts                       — MISSING

Admin Pages:
  ✅ /[org_slug]/admin/dashboard        — Business dashboard (payroll export, workforce stats)
  ❌ /[org_slug]/admin/workforce        — MISSING: employee list + management
  ❌ /[org_slug]/admin/reports          — MISSING: monthly + payroll reports
  ❌ /[org_slug]/admin/payroll          — MISSING: payroll export history
  ❌ /[org_slug]/admin/settings         — MISSING
  ❌ layout.tsx                          — MISSING

Scanner:
  ❌ /[org_slug]/staff/scan             — MISSING: workforce clock-in scanner


# ================================================================
# PROJECT 7: attendy-events (Events)
# ================================================================

Auth:
  ❌ /[org_slug]/login                  — MISSING
  ❌ /[org_slug]/auth/verify-otp        — MISSING
  ❌ middleware.ts                       — MISSING

Admin Pages:
  ✅ /[org_slug]/admin/dashboard        — Event dashboard (live headcount, zones, timeline)
  ❌ /[org_slug]/admin/guests           — MISSING: guest list + bulk import
  ❌ /[org_slug]/admin/zones            — MISSING: zone management
  ❌ /[org_slug]/admin/reports          — MISSING: event attendance report
  ❌ /[org_slug]/admin/settings         — MISSING: event config, zones list
  ❌ layout.tsx                          — MISSING

Scanner:
  ✅ /[org_slug]/staff/scan             — Ticket scanner (rose theme, check-in/out toggle)


# ================================================================
# SHARED INFRASTRUCTURE (all projects need these)
# ================================================================

  ✅ src/lib/supabase/client.ts         — Browser client (in attendy-edu)
  ✅ src/lib/supabase/server.ts         — Server client (in attendy-edu)
  ✅ src/lib/supabase/types.ts          — TypeScript types (in attendy-edu)
  ✅ src/components/scanner/QRScanner.tsx — QR scanning (in attendy-edu)

  ❌ Updated types.ts                   — Types need updating for new schema
                                          (organisations, members instead of schools, students)


# ================================================================
# DATABASE
# ================================================================

  ✅ FRESH_SUPABASE_SCHEMA.sql          — Complete new database schema
                                          (organisations, members, attendance_logs,
                                           org_settings, visitor_logs, desk_bookings,
                                           payroll_exports, notifications_log,
                                           custom_requests, subscription_logs,
                                           parent_sessions, head_admins,
                                           all RLS policies, triggers, indexes)
  ✅ .env.template                       — Environment variables for all 7 projects

Old (being replaced):
  ⚠️  SUPABASE_MIGRATIONS.sql           — Patch for old school DB (superseded by fresh schema)


# ================================================================
# SUMMARY COUNTS
# ================================================================

Total pages needed:          ~70
Pages fully built:           ~35 (50%)
Pages partially built:        ~5 (7%)
Pages missing:               ~30 (43%)

Critical missing items (blocking launch of new verticals):
  1. Login page (shared pattern — build once, copy to bank/office/biz/events)
  2. Auth verify-otp page (same — copy from attendy-edu)
  3. Middleware (same — copy from attendy-edu, change colour)
  4. Admin layout/sidebar (same — copy from attendy-edu, change accent colour)
  5. Staff/Members list page (per vertical)
  6. Reports page (per vertical)
  7. Settings page (per vertical)
  8. /api/visitor-signin route (attendy-office)
  9. /api/custom-request route (attendy-web)
  10. Updated TypeScript types for new schema


# ================================================================
# RECOMMENDED NEXT BUILD ORDER
# ================================================================

Phase 1 — Shared components (build once, reuse in all verticals):
  □ Shared login page template
  □ Shared auth/verify-otp template
  □ Shared middleware template
  □ Shared admin layout template (with colour theming per vertical)
  □ Updated TypeScript types (organisations, members, attendance_logs)

Phase 2 — Complete attendy-bank:
  □ Login + auth pages
  □ Middleware
  □ Admin layout (blue theme)
  □ Staff list + invite
  □ Reports page (daily + monthly)
  □ Settings page (shift times, SMS)
  □ Staff scanner scan history
  □ Compliance log page

Phase 3 — Complete attendy-office:
  □ Login + auth pages
  □ Admin layout (purple theme)
  □ Middleware
  □ Visitor log management page
  □ Desk booking management
  □ Employee check-in scanner
  □ Reports
  □ Settings
  □ /api/visitor-signin route

Phase 4 — Complete attendy-biz:
  □ Login + auth pages
  □ Admin layout (amber theme)
  □ Middleware
  □ Workforce list + management
  □ Payroll export history page
  □ Employee clock-in scanner
  □ Monthly reports
  □ Settings

Phase 5 — Complete attendy-events:
  □ Login + auth pages
  □ Admin layout (rose theme)
  □ Middleware
  □ Guest list + bulk import
  □ Zone management
  □ Event reports
  □ Settings (event dates, zones)

Phase 6 — Finish attendy-admin:
  □ /dashboard/orgs/[org_id] detail page
  □ /dashboard/users page
  □ /dashboard/sms page (SMS log + test)
  □ /dashboard/activity full log
  □ /dashboard/settings page
  □ /api/orgs/[org_id]/update route

Phase 7 — Wire up attendy-web:
  □ /api/custom-request route (save to Supabase)

Phase 8 — Update all projects to use new schema:
  □ Replace "schools" references with "organisations"
  □ Replace "students" with "members"
  □ Replace "school_id" with "organisation_id"
  (The SQL views handle backwards compatibility but the
   Next.js code should be updated for correctness)
