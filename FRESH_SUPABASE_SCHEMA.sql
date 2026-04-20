-- ================================================================
-- ATTENDY PLATFORM — FRESH SUPABASE DATABASE
-- Create a brand new Supabase project and run this entire file
-- in the SQL Editor (Dashboard → SQL Editor → New Query)
-- ================================================================
-- This replaces the school-specific database entirely.
-- Every Attendy product (edu, bank, office, biz, events) uses this.
-- ================================================================


-- ════════════════════════════════════════════════════════════════
-- SECTION 0 — EXTENSIONS
-- ════════════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- ════════════════════════════════════════════════════════════════
-- SECTION 1 — HEAD ADMINS
-- Platform-level super admins (Attendy staff only)
-- Managed via attendy-admin.vercel.app
-- ════════════════════════════════════════════════════════════════

CREATE TABLE head_admins (
  id            UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  email         TEXT        NOT NULL UNIQUE,
  full_name     TEXT        NOT NULL,
  password_hash TEXT        NOT NULL,
  is_active     BOOLEAN     DEFAULT true,
  last_login    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- RLS: head_admins table is ONLY accessible via service role key
-- (from attendy-admin API routes, never from the browser)
ALTER TABLE head_admins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_head_admins"
  ON head_admins FOR ALL TO service_role USING (true) WITH CHECK (true);


-- ════════════════════════════════════════════════════════════════
-- SECTION 2 — ORGANISATIONS
-- One row per customer (school, bank branch, office, business, event)
-- "schools" renamed to "organisations" — backwards-compatible view added
-- ════════════════════════════════════════════════════════════════

CREATE TABLE organisations (
  id                UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  name              TEXT        NOT NULL,
  slug              TEXT        NOT NULL UNIQUE,

  -- Industry determines which Attendy product this org belongs to
  industry          TEXT        NOT NULL DEFAULT 'education'
    CHECK (industry IN (
      'education',   -- attendy-edu.vercel.app
      'banking',     -- attendy-bank.vercel.app
      'office',      -- attendy-office.vercel.app
      'business',    -- attendy-biz.vercel.app
      'events',      -- attendy-events.vercel.app
      'other'        -- custom / future
    )),

  -- Subscription / billing
  plan              TEXT        NOT NULL DEFAULT 'free'
    CHECK (plan IN ('free', 'basic', 'standard', 'pro')),
  plan_expires_at   TIMESTAMPTZ,
  is_active         BOOLEAN     DEFAULT true,

  -- Capacity limits (set by head admin based on plan)
  max_members       INTEGER     DEFAULT 50,   -- students / staff / guests
  max_staff         INTEGER     DEFAULT 3,    -- teachers / gatemen / scanners
  max_parents       INTEGER     DEFAULT 50,   -- parents / contacts

  -- Industry-specific JSON config
  -- e.g. { "late_cutoff": "08:00", "shift_start": "09:00", "zones": ["VIP","General"] }
  config            JSONB       DEFAULT '{}',

  -- Metadata
  logo_url          TEXT,
  address           TEXT,
  phone             TEXT,
  website           TEXT,
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now()
);

-- Backwards-compatible alias so existing attendy-edu code that references "schools" still works
CREATE VIEW schools AS SELECT
  id, name, slug, is_active, plan, plan_expires_at,
  max_members AS max_students, max_staff AS max_teachers, max_parents,
  config, logo_url, created_at, updated_at, industry,
  config AS industry_config
FROM organisations;

ALTER TABLE organisations ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read their own org
CREATE POLICY "members_read_own_org"
  ON organisations FOR SELECT TO authenticated
  USING (
    id IN (
      SELECT organisation_id FROM user_profiles WHERE user_id = auth.uid()
    )
  );

-- Only service role can insert/update/delete (done via admin API routes)
CREATE POLICY "service_role_manage_orgs"
  ON organisations FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE INDEX idx_orgs_slug     ON organisations (slug);
CREATE INDEX idx_orgs_industry ON organisations (industry);
CREATE INDEX idx_orgs_active   ON organisations (is_active);


-- ════════════════════════════════════════════════════════════════
-- SECTION 3 — USER PROFILES
-- Every authenticated Supabase Auth user has one profile per org
-- Roles differ by industry: teacher/gateman (edu), scanner (bank/events), etc.
-- ════════════════════════════════════════════════════════════════

CREATE TABLE user_profiles (
  id                  UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id             UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organisation_id     UUID        NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,

  full_name           TEXT        NOT NULL,
  phone               TEXT,
  role                TEXT        NOT NULL DEFAULT 'staff'
    CHECK (role IN (
      -- Universal
      'admin',
      -- Education
      'teacher', 'parent',
      -- All scan-capable roles
      'gateman', 'scanner',
      -- Office
      'receptionist',
      -- Events
      'steward'
    )),
  is_active           BOOLEAN     DEFAULT true,
  app_prompt_dismissed BOOLEAN    DEFAULT false,
  avatar_url          TEXT,
  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now(),

  UNIQUE (user_id, organisation_id)
);

-- Backwards-compatible: keep school_id alias column
ALTER TABLE user_profiles ADD COLUMN school_id UUID
  GENERATED ALWAYS AS (organisation_id) STORED;

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_read_own_profile"
  ON user_profiles FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "users_read_same_org"
  ON user_profiles FOR SELECT TO authenticated
  USING (
    organisation_id IN (
      SELECT organisation_id FROM user_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "users_update_own_profile"
  ON user_profiles FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "service_role_manage_profiles"
  ON user_profiles FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE INDEX idx_profiles_user_id    ON user_profiles (user_id);
CREATE INDEX idx_profiles_org_id     ON user_profiles (organisation_id);
CREATE INDEX idx_profiles_role       ON user_profiles (role);


-- ════════════════════════════════════════════════════════════════
-- SECTION 4 — MEMBERS
-- The people being tracked:
--   Education  → students
--   Banking    → staff / employees
--   Office     → employees
--   Business   → workforce
--   Events     → guests / ticket holders
-- "students" view added for backwards compatibility
-- ════════════════════════════════════════════════════════════════

CREATE TABLE members (
  id                UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  organisation_id   UUID        NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,

  full_name         TEXT        NOT NULL,

  -- Group / department / class / zone
  -- Education: class name (JSS 1, Primary 3)
  -- Banking: branch or department
  -- Office: team or floor
  -- Events: ticket zone (General, VIP, Press)
  group_name        TEXT        NOT NULL DEFAULT 'General',

  -- QR identity code — used for all scanning across all products
  qr_code           TEXT        NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),

  -- Contact (education: parent phone; banking/office/biz: employee phone)
  contact_name      TEXT,       -- parent name (edu) or emergency contact
  contact_phone     TEXT,       -- phone for SMS notifications

  -- Industry-specific extras stored as JSON
  -- Education: { "admission_number": "...", "date_of_birth": "..." }
  -- Banking:   { "staff_id": "B001", "department": "Operations", "grade": "GL07" }
  -- Office:    { "employee_id": "E042", "desk": "A12", "floor": "2nd" }
  -- Business:  { "employee_id": "W099", "shift": "morning", "contractor": false }
  -- Events:    { "ticket_type": "vip", "ticket_number": "T0042", "meal_pref": "veg" }
  meta              JSONB       DEFAULT '{}',

  is_active         BOOLEAN     DEFAULT true,
  photo_url         TEXT,
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now()
);

-- Backwards-compatible alias
CREATE VIEW students AS SELECT
  id,
  organisation_id AS school_id,
  full_name,
  group_name AS class,
  qr_code,
  contact_name AS parent_name,
  contact_phone AS parent_phone,
  meta,
  is_active,
  photo_url,
  created_at,
  updated_at,
  -- Events-specific
  (meta->>'ticket_type')::TEXT AS ticket_type,
  (meta->>'ticket_zone')::TEXT AS ticket_zone
FROM members;

ALTER TABLE members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_members_read"
  ON members FOR SELECT TO authenticated
  USING (
    organisation_id IN (
      SELECT organisation_id FROM user_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "org_admin_manage_members"
  ON members FOR ALL TO authenticated
  USING (
    organisation_id IN (
      SELECT organisation_id FROM user_profiles
      WHERE user_id = auth.uid() AND role IN ('admin', 'teacher')
    )
  );

CREATE POLICY "service_role_members"
  ON members FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE INDEX idx_members_org_id      ON members (organisation_id);
CREATE INDEX idx_members_qr_code     ON members (qr_code);
CREATE INDEX idx_members_group_name  ON members (group_name);
CREATE INDEX idx_members_active      ON members (is_active);


-- ════════════════════════════════════════════════════════════════
-- SECTION 5 — ATTENDANCE LOGS
-- The core table. Every scan from every product goes here.
-- scan_type:
--   'entry' = arrival / clock-in / check-in
--   'exit'  = departure / clock-out / check-out
-- ════════════════════════════════════════════════════════════════

CREATE TABLE attendance_logs (
  id                UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  organisation_id   UUID        NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  member_id         UUID        NOT NULL REFERENCES members(id) ON DELETE CASCADE,

  scan_type         TEXT        NOT NULL DEFAULT 'entry'
    CHECK (scan_type IN ('entry', 'exit')),
  scanned_at        TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Late / compliance
  is_late           BOOLEAN     DEFAULT false,
  late_reason       TEXT,

  -- Who scanned
  scanned_by        UUID        REFERENCES auth.users(id),
  scanned_by_role   TEXT,
  scanned_by_name   TEXT,

  -- Optional metadata per industry
  -- Banking: { "shift": "morning", "overtime": false }
  -- Events:  { "zone": "VIP", "gate": "North" }
  meta              JSONB       DEFAULT '{}',

  created_at        TIMESTAMPTZ DEFAULT now()
);

-- Backwards-compatible alias
CREATE VIEW attendance_logs_compat AS SELECT
  id,
  organisation_id AS school_id,
  member_id AS student_id,
  scan_type,
  scanned_at,
  is_late,
  late_reason,
  scanned_by,
  scanned_by_role,
  scanned_by_name,
  meta,
  created_at
FROM attendance_logs;

ALTER TABLE attendance_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_staff_read_logs"
  ON attendance_logs FOR SELECT TO authenticated
  USING (
    organisation_id IN (
      SELECT organisation_id FROM user_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "scanners_insert_logs"
  ON attendance_logs FOR INSERT TO authenticated
  WITH CHECK (
    organisation_id IN (
      SELECT organisation_id FROM user_profiles
      WHERE user_id = auth.uid() AND role IN ('admin','teacher','gateman','scanner','steward','receptionist')
    )
  );

CREATE POLICY "service_role_logs"
  ON attendance_logs FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Performance indexes (critical for dashboard queries)
CREATE INDEX idx_logs_org_date      ON attendance_logs (organisation_id, scanned_at DESC);
CREATE INDEX idx_logs_member_date   ON attendance_logs (member_id, scanned_at DESC);
CREATE INDEX idx_logs_scan_type     ON attendance_logs (scan_type);
CREATE INDEX idx_logs_is_late       ON attendance_logs (is_late) WHERE is_late = true;
CREATE INDEX idx_logs_date_only     ON attendance_logs (DATE(scanned_at));


-- ════════════════════════════════════════════════════════════════
-- SECTION 6 — ORG SETTINGS
-- Per-organisation configuration for each industry
-- ════════════════════════════════════════════════════════════════

CREATE TABLE org_settings (
  id                UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  organisation_id   UUID        NOT NULL UNIQUE REFERENCES organisations(id) ON DELETE CASCADE,

  -- Universal
  timezone          TEXT        DEFAULT 'Africa/Lagos',
  sms_enabled       BOOLEAN     DEFAULT true,
  whatsapp_enabled  BOOLEAN     DEFAULT false,

  -- Education + Business + Banking: cutoff time
  late_cutoff       TEXT        DEFAULT '08:00',

  -- Banking / Business: shift times
  shift_start       TEXT        DEFAULT '08:00',
  shift_end         TEXT        DEFAULT '17:00',
  overtime_threshold_mins INTEGER DEFAULT 30,

  -- Office: occupancy cap
  max_occupancy     INTEGER,
  hot_desks_enabled BOOLEAN     DEFAULT false,
  visitor_signin_enabled BOOLEAN DEFAULT false,

  -- Events: check-in window
  event_start       TIMESTAMPTZ,
  event_end         TIMESTAMPTZ,
  zones             TEXT[]      DEFAULT ARRAY['General']::TEXT[],

  -- Notifications
  sms_sender_id     TEXT        DEFAULT 'Attendy',
  notify_on_entry   BOOLEAN     DEFAULT true,
  notify_on_late    BOOLEAN     DEFAULT true,
  notify_on_exit    BOOLEAN     DEFAULT false,

  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now()
);

-- Backwards-compatible view
CREATE VIEW school_settings AS SELECT
  id,
  organisation_id AS school_id,
  timezone,
  sms_enabled,
  whatsapp_enabled,
  late_cutoff,
  sms_sender_id,
  created_at,
  updated_at
FROM org_settings;

ALTER TABLE org_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_read_settings"
  ON org_settings FOR SELECT TO authenticated
  USING (
    organisation_id IN (
      SELECT organisation_id FROM user_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "admin_manage_settings"
  ON org_settings FOR ALL TO authenticated
  USING (
    organisation_id IN (
      SELECT organisation_id FROM user_profiles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "service_role_settings"
  ON org_settings FOR ALL TO service_role USING (true) WITH CHECK (true);


-- ════════════════════════════════════════════════════════════════
-- SECTION 7 — LATE CUTOFF OVERRIDES
-- One-off date overrides (e.g. school events, bank holidays)
-- ════════════════════════════════════════════════════════════════

CREATE TABLE late_cutoff_overrides (
  id                UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  organisation_id   UUID    NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  override_date     DATE    NOT NULL,
  cutoff_time       TEXT    NOT NULL,
  reason            TEXT,
  created_by        UUID    REFERENCES auth.users(id),
  created_at        TIMESTAMPTZ DEFAULT now(),

  UNIQUE (organisation_id, override_date)
);

ALTER TABLE late_cutoff_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_read_overrides"
  ON late_cutoff_overrides FOR SELECT TO authenticated
  USING (organisation_id IN (SELECT organisation_id FROM user_profiles WHERE user_id = auth.uid()));

CREATE POLICY "admin_manage_overrides"
  ON late_cutoff_overrides FOR ALL TO authenticated
  USING (organisation_id IN (SELECT organisation_id FROM user_profiles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE INDEX idx_overrides_org_date ON late_cutoff_overrides (organisation_id, override_date);


-- ════════════════════════════════════════════════════════════════
-- SECTION 8 — NOTIFICATIONS LOG
-- Record of every SMS / WhatsApp sent
-- ════════════════════════════════════════════════════════════════

CREATE TABLE notifications_log (
  id                UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  organisation_id   UUID        NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  member_id         UUID        REFERENCES members(id) ON DELETE SET NULL,
  attendance_id     UUID        REFERENCES attendance_logs(id) ON DELETE SET NULL,

  channel           TEXT        NOT NULL DEFAULT 'sms'
    CHECK (channel IN ('sms', 'whatsapp', 'email', 'push')),
  phone             TEXT,
  email             TEXT,
  message           TEXT        NOT NULL,
  status            TEXT        NOT NULL DEFAULT 'sent'
    CHECK (status IN ('sent', 'failed', 'pending', 'skipped')),
  error_message     TEXT,

  provider          TEXT        DEFAULT 'termii',
  provider_message_id TEXT,

  created_at        TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE notifications_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_read_notifications"
  ON notifications_log FOR SELECT TO authenticated
  USING (organisation_id IN (SELECT organisation_id FROM user_profiles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "service_role_notifications"
  ON notifications_log FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE INDEX idx_notifications_org  ON notifications_log (organisation_id);
CREATE INDEX idx_notifications_date ON notifications_log (created_at DESC);


-- ════════════════════════════════════════════════════════════════
-- SECTION 9 — VISITOR LOGS (Office product)
-- Walk-in visitors who don't have QR cards
-- ════════════════════════════════════════════════════════════════

CREATE TABLE visitor_logs (
  id                UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  organisation_id   UUID        NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,

  visitor_name      TEXT        NOT NULL,
  company           TEXT,
  host_name         TEXT        NOT NULL,
  purpose           TEXT        NOT NULL,
  phone             TEXT,

  badge_number      TEXT        NOT NULL,
  signed_in_at      TIMESTAMPTZ DEFAULT now(),
  signed_out_at     TIMESTAMPTZ,

  -- Which user processed them (receptionist / admin)
  processed_by      UUID        REFERENCES auth.users(id),
  processed_by_name TEXT,

  notes             TEXT,
  created_at        TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE visitor_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_read_visitors"
  ON visitor_logs FOR SELECT TO authenticated
  USING (organisation_id IN (SELECT organisation_id FROM user_profiles WHERE user_id = auth.uid()));

CREATE POLICY "staff_manage_visitors"
  ON visitor_logs FOR INSERT TO authenticated
  WITH CHECK (organisation_id IN (SELECT organisation_id FROM user_profiles WHERE user_id = auth.uid()));

CREATE POLICY "service_role_visitors"
  ON visitor_logs FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE INDEX idx_visitors_org_date ON visitor_logs (organisation_id, signed_in_at DESC);


-- ════════════════════════════════════════════════════════════════
-- SECTION 10 — DESK BOOKINGS (Office product)
-- ════════════════════════════════════════════════════════════════

CREATE TABLE desk_bookings (
  id                UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  organisation_id   UUID    NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  desk_number       TEXT    NOT NULL,
  floor             TEXT    DEFAULT 'A',
  booked_by         UUID    REFERENCES members(id),
  booked_by_name    TEXT,
  booking_date      DATE    NOT NULL DEFAULT CURRENT_DATE,
  status            TEXT    DEFAULT 'booked'
    CHECK (status IN ('booked', 'checked_in', 'released', 'no_show')),
  notes             TEXT,
  created_at        TIMESTAMPTZ DEFAULT now(),

  UNIQUE (organisation_id, desk_number, booking_date)
);

ALTER TABLE desk_bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_desk_bookings"
  ON desk_bookings FOR ALL TO authenticated
  USING (organisation_id IN (SELECT organisation_id FROM user_profiles WHERE user_id = auth.uid()));

CREATE POLICY "service_role_desks"
  ON desk_bookings FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE INDEX idx_desks_org_date ON desk_bookings (organisation_id, booking_date);


-- ════════════════════════════════════════════════════════════════
-- SECTION 11 — PAYROLL EXPORTS (Business product)
-- Audit trail of every CSV export
-- ════════════════════════════════════════════════════════════════

CREATE TABLE payroll_exports (
  id                UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  organisation_id   UUID    NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  exported_by       UUID    REFERENCES auth.users(id),
  exported_by_name  TEXT,
  period_from       DATE    NOT NULL,
  period_to         DATE    NOT NULL,
  record_count      INTEGER DEFAULT 0,
  file_url          TEXT,   -- optional: if stored in Supabase Storage
  created_at        TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE payroll_exports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_payroll_exports"
  ON payroll_exports FOR ALL TO authenticated
  USING (organisation_id IN (SELECT organisation_id FROM user_profiles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "service_role_payroll"
  ON payroll_exports FOR ALL TO service_role USING (true) WITH CHECK (true);


-- ════════════════════════════════════════════════════════════════
-- SECTION 12 — SUBSCRIPTION LOGS
-- Audit trail for all subscription changes (used by attendy-admin)
-- ════════════════════════════════════════════════════════════════

CREATE TABLE subscription_logs (
  id                UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  organisation_id   UUID    NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,

  action            TEXT    NOT NULL
    CHECK (action IN ('activated', 'suspended', 'deactivated', 'plan_changed', 'created', 'renewed')),

  old_plan          TEXT,
  new_plan          TEXT,
  note              TEXT,
  performed_by      TEXT,   -- email of head admin who made the change
  industry          TEXT    DEFAULT 'education',

  created_at        TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE subscription_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_sub_logs"
  ON subscription_logs FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE INDEX idx_sub_logs_org  ON subscription_logs (organisation_id);
CREATE INDEX idx_sub_logs_date ON subscription_logs (created_at DESC);


-- ════════════════════════════════════════════════════════════════
-- SECTION 13 — CUSTOM REQUESTS
-- Submitted from attendy-web.vercel.app by prospective customers
-- ════════════════════════════════════════════════════════════════

CREATE TABLE custom_requests (
  id          UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  name        TEXT    NOT NULL,
  email       TEXT    NOT NULL,
  use_case    TEXT    NOT NULL,
  details     TEXT,
  status      TEXT    DEFAULT 'new'
    CHECK (status IN ('new', 'contacted', 'converted', 'declined')),
  notes       TEXT,   -- internal notes from head admin
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE custom_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_requests"
  ON custom_requests FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE INDEX idx_requests_status ON custom_requests (status);


-- ════════════════════════════════════════════════════════════════
-- SECTION 14 — PARENT SESSIONS (Education product)
-- JWT-based parent logins (no Supabase Auth, phone-based)
-- ════════════════════════════════════════════════════════════════

CREATE TABLE parent_sessions (
  id                UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  organisation_id   UUID    NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  phone             TEXT    NOT NULL,
  member_ids        UUID[]  NOT NULL,   -- which children this parent sees
  last_seen         TIMESTAMPTZ DEFAULT now(),
  created_at        TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE parent_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_parent_sessions"
  ON parent_sessions FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE INDEX idx_parent_sessions_phone ON parent_sessions (organisation_id, phone);


-- ════════════════════════════════════════════════════════════════
-- SECTION 15 — TRIGGERS & FUNCTIONS
-- ════════════════════════════════════════════════════════════════

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER organisations_updated_at
  BEFORE UPDATE ON organisations
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER members_updated_at
  BEFORE UPDATE ON members
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER org_settings_updated_at
  BEFORE UPDATE ON org_settings
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER custom_requests_updated_at
  BEFORE UPDATE ON custom_requests
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();


-- Auto-create org_settings row when an organisation is created
CREATE OR REPLACE FUNCTION create_default_org_settings()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO org_settings (organisation_id, timezone, late_cutoff, sms_enabled)
  VALUES (NEW.id, 'Africa/Lagos', '08:00', true)
  ON CONFLICT (organisation_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER auto_create_org_settings
  AFTER INSERT ON organisations
  FOR EACH ROW EXECUTE FUNCTION create_default_org_settings();


-- Auto-generate QR code for member if not provided
CREATE OR REPLACE FUNCTION ensure_qr_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.qr_code IS NULL OR NEW.qr_code = '' THEN
    NEW.qr_code := encode(gen_random_bytes(16), 'hex');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER members_ensure_qr
  BEFORE INSERT ON members
  FOR EACH ROW EXECUTE FUNCTION ensure_qr_code();


-- Generate visitor badge number
CREATE OR REPLACE FUNCTION generate_badge_number(p_org_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_count INTEGER;
  v_date  TEXT;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM visitor_logs
  WHERE organisation_id = p_org_id
    AND DATE(signed_in_at) = CURRENT_DATE;
  v_date := TO_CHAR(NOW(), 'YYMMDD');
  RETURN 'VIS-' || v_date || '-' || LPAD((v_count + 1)::TEXT, 3, '0');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Useful helper: get today's attendance summary for an org
CREATE OR REPLACE FUNCTION get_daily_summary(
  p_org_id UUID,
  p_date   DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  total_members   BIGINT,
  present_count   BIGINT,
  late_count      BIGINT,
  absent_count    BIGINT,
  exit_count      BIGINT,
  attendance_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH totals AS (
    SELECT COUNT(*) AS total FROM members
    WHERE organisation_id = p_org_id AND is_active = true
  ),
  entries AS (
    SELECT
      COUNT(*) FILTER (WHERE scan_type = 'entry')           AS present,
      COUNT(*) FILTER (WHERE scan_type = 'entry' AND is_late) AS late,
      COUNT(*) FILTER (WHERE scan_type = 'exit')            AS exited
    FROM attendance_logs
    WHERE organisation_id = p_org_id
      AND DATE(scanned_at) = p_date
  )
  SELECT
    t.total,
    e.present,
    e.late,
    GREATEST(0, t.total - e.present),
    e.exited,
    CASE WHEN t.total > 0
      THEN ROUND((e.present::NUMERIC / t.total) * 100, 1)
      ELSE 0
    END
  FROM totals t, entries e;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ════════════════════════════════════════════════════════════════
-- SECTION 16 — STORAGE BUCKETS
-- ════════════════════════════════════════════════════════════════
-- Run these manually in Supabase Dashboard → Storage, OR via API:
--
-- Bucket: "org-logos"     — public  — org logo images
-- Bucket: "member-photos" — private — member/student photos
-- Bucket: "qr-cards"      — private — generated QR card PDFs/PNGs
-- Bucket: "exports"        — private — CSV / payroll exports
--
-- Storage RLS (set in dashboard):
-- org-logos:     SELECT = public; INSERT/UPDATE = authenticated + admin role
-- member-photos: SELECT/UPDATE = authenticated + same org
-- qr-cards:      SELECT/UPDATE = authenticated + same org
-- exports:       SELECT/UPDATE = authenticated + admin role
-- ════════════════════════════════════════════════════════════════


-- ════════════════════════════════════════════════════════════════
-- SECTION 17 — SEED DATA (optional dev/test data)
-- Comment out before running in production
-- ════════════════════════════════════════════════════════════════

/*
-- Create a test head admin (password: "testpassword123!")
-- Generate hash via: node -e "const b=require('bcryptjs');b.hash('testpassword123!',12).then(h=>console.log(h))"
INSERT INTO head_admins (email, full_name, password_hash) VALUES
  ('admin@attendy.ng', 'Attendy Admin', '$2a$12$PLACEHOLDER_HASH_HERE');

-- Create a sample school
INSERT INTO organisations (name, slug, industry, plan, max_members, max_staff, max_parents) VALUES
  ('Demo Secondary School', 'demo-school', 'education', 'basic', 200, 10, 200);

-- Create a sample bank branch
INSERT INTO organisations (name, slug, industry, plan, max_members, max_staff) VALUES
  ('First Bank — Ikeja Branch', 'first-bank-ikeja', 'banking', 'standard', 100, 20);
*/


-- ════════════════════════════════════════════════════════════════
-- SECTION 18 — VERIFICATION QUERIES
-- Run these after setup to confirm everything is correct
-- ════════════════════════════════════════════════════════════════

-- Check all tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Check all views exist
SELECT table_name
FROM information_schema.views
WHERE table_schema = 'public'
ORDER BY table_name;

-- Check all indexes
SELECT indexname, tablename
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- Check RLS is enabled on all tables
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- ════════════════════════════════════════════════════════════════
-- DONE. Your fresh Attendy multi-product Supabase is ready.
-- ════════════════════════════════════════════════════════════════
