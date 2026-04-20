// ================================================================
// ATTENDY PLATFORM — TypeScript Types
// For the fresh multi-product Supabase schema
// Place this at src/lib/supabase/types.ts in all projects
// ================================================================

// ── Industry ────────────────────────────────────────────────────
export type Industry =
  | 'education'
  | 'banking'
  | 'office'
  | 'business'
  | 'events'
  | 'other'

// ── Plan ────────────────────────────────────────────────────────
export type Plan = 'free' | 'basic' | 'standard' | 'pro'

// ── Role ────────────────────────────────────────────────────────
export type Role =
  | 'admin'
  | 'teacher'       // education
  | 'parent'        // education
  | 'gateman'       // education / events
  | 'scanner'       // banking / business
  | 'steward'       // events
  | 'receptionist'  // office

// ── Organisation ────────────────────────────────────────────────
export interface Organisation {
  id                : string
  name              : string
  slug              : string
  industry          : Industry
  plan              : Plan
  plan_expires_at   : string | null
  is_active         : boolean
  max_members       : number
  max_staff         : number
  max_parents       : number
  config            : Record<string, unknown>
  logo_url          : string | null
  address           : string | null
  phone             : string | null
  website           : string | null
  created_at        : string
  updated_at        : string
}

// Backwards-compatible alias used in attendy-edu code
export type School = Organisation & {
  max_students : number   // = max_members
  max_teachers : number   // = max_staff
}

// ── User Profile ─────────────────────────────────────────────────
export interface UserProfile {
  id                   : string
  user_id              : string
  organisation_id      : string
  school_id            : string  // backwards-compat = organisation_id
  full_name            : string
  phone                : string | null
  role                 : Role
  is_active            : boolean
  app_prompt_dismissed : boolean
  avatar_url           : string | null
  created_at           : string
  updated_at           : string
}

// ── Member ───────────────────────────────────────────────────────
export interface Member {
  id              : string
  organisation_id : string
  full_name       : string
  group_name      : string       // class (edu) / branch (bank) / zone (events)
  qr_code         : string
  contact_name    : string | null
  contact_phone   : string | null
  meta            : MemberMeta
  is_active       : boolean
  photo_url       : string | null
  created_at      : string
  updated_at      : string
}

// Education-specific member meta
export interface EduMemberMeta {
  admission_number ?: string
  date_of_birth    ?: string
}

// Banking-specific member meta
export interface BankMemberMeta {
  staff_id     ?: string
  department   ?: string
  grade        ?: string  // e.g. GL07
  branch_code  ?: string
}

// Office-specific member meta
export interface OfficeMemberMeta {
  employee_id  ?: string
  desk         ?: string
  floor        ?: string
  team         ?: string
}

// Business-specific member meta
export interface BizMemberMeta {
  employee_id  ?: string
  shift        ?: 'morning' | 'afternoon' | 'night' | 'flexible'
  contractor   ?: boolean
  daily_rate   ?: number
}

// Events-specific member meta
export interface EventsMemberMeta {
  ticket_type    ?: 'general' | 'vip' | 'press' | 'staff' | 'exhibitor'
  ticket_number  ?: string
  ticket_zone    ?: string
  meal_pref      ?: string
  table_number   ?: string
}

export type MemberMeta =
  | EduMemberMeta
  | BankMemberMeta
  | OfficeMemberMeta
  | BizMemberMeta
  | EventsMemberMeta
  | Record<string, unknown>

// Backwards-compatible alias used in attendy-edu code
export interface Student extends Member {
  school_id    : string   // = organisation_id
  class        : string   // = group_name
  parent_name  : string | null  // = contact_name
  parent_phone : string | null  // = contact_phone
  ticket_type  ?: string
  ticket_zone  ?: string
}

// ── Attendance Log ───────────────────────────────────────────────
export type ScanType = 'entry' | 'exit'

export interface AttendanceLog {
  id              : string
  organisation_id : string
  school_id       : string  // backwards-compat = organisation_id
  member_id       : string
  student_id      : string  // backwards-compat = member_id
  scan_type       : ScanType
  scanned_at      : string
  is_late         : boolean
  late_reason     : string | null
  scanned_by      : string | null
  scanned_by_role : string | null
  scanned_by_name : string | null
  meta            : Record<string, unknown>
  created_at      : string
  // Joined
  members         ?: { full_name: string; group_name: string }
  students        ?: { full_name: string; class: string }  // backwards-compat
}

// ── Org Settings ─────────────────────────────────────────────────
export interface OrgSettings {
  id                        : string
  organisation_id           : string
  school_id                 : string  // backwards-compat
  timezone                  : string
  sms_enabled               : boolean
  whatsapp_enabled          : boolean
  late_cutoff               : string
  shift_start               : string
  shift_end                 : string
  overtime_threshold_mins   : number
  max_occupancy             : number | null
  hot_desks_enabled         : boolean
  visitor_signin_enabled    : boolean
  event_start               : string | null
  event_end                 : string | null
  zones                     : string[]
  sms_sender_id             : string
  notify_on_entry           : boolean
  notify_on_late            : boolean
  notify_on_exit            : boolean
  created_at                : string
  updated_at                : string
}

// ── Visitor Log (Office) ─────────────────────────────────────────
export interface VisitorLog {
  id                 : string
  organisation_id    : string
  visitor_name       : string
  company            : string | null
  host_name          : string
  purpose            : string
  phone              : string | null
  badge_number       : string
  signed_in_at       : string
  signed_out_at      : string | null
  processed_by       : string | null
  processed_by_name  : string | null
  notes              : string | null
  created_at         : string
}

// ── Desk Booking (Office) ────────────────────────────────────────
export interface DeskBooking {
  id              : string
  organisation_id : string
  desk_number     : string
  floor           : string
  booked_by       : string | null
  booked_by_name  : string | null
  booking_date    : string
  status          : 'booked' | 'checked_in' | 'released' | 'no_show'
  notes           : string | null
  created_at      : string
}

// ── Payroll Export (Business) ────────────────────────────────────
export interface PayrollExport {
  id               : string
  organisation_id  : string
  exported_by      : string | null
  exported_by_name : string | null
  period_from      : string
  period_to        : string
  record_count     : number
  file_url         : string | null
  created_at       : string
}

// ── Subscription Log ─────────────────────────────────────────────
export type SubAction = 'activated' | 'suspended' | 'deactivated' | 'plan_changed' | 'created' | 'renewed'

export interface SubscriptionLog {
  id              : string
  organisation_id : string
  action          : SubAction
  old_plan        : string | null
  new_plan        : string | null
  note            : string | null
  performed_by    : string | null
  industry        : Industry | null
  created_at      : string
  // Joined
  organisations   ?: { name: string; slug: string }
  schools         ?: { name: string; slug: string }  // backwards-compat
}

// ── Custom Request ────────────────────────────────────────────────
export type RequestStatus = 'new' | 'contacted' | 'converted' | 'declined'

export interface CustomRequest {
  id          : string
  name        : string
  email       : string
  use_case    : string
  details     : string | null
  status      : RequestStatus
  notes       : string | null
  created_at  : string
  updated_at  : string
}

// ── Notification Log ─────────────────────────────────────────────
export interface NotificationLog {
  id                  : string
  organisation_id     : string
  member_id           : string | null
  attendance_id       : string | null
  channel             : 'sms' | 'whatsapp' | 'email' | 'push'
  phone               : string | null
  email               : string | null
  message             : string
  status              : 'sent' | 'failed' | 'pending' | 'skipped'
  error_message       : string | null
  provider            : string | null
  provider_message_id : string | null
  created_at          : string
}

// ── Daily Summary (returned by get_daily_summary() RPC) ──────────
export interface DailySummary {
  total_members   : number
  present_count   : number
  late_count      : number
  absent_count    : number
  exit_count      : number
  attendance_rate : number
}

// ── Head Admin ───────────────────────────────────────────────────
export interface HeadAdmin {
  id            : string
  email         : string
  full_name     : string
  is_active     : boolean
  last_login    : string | null
  created_at    : string
}
