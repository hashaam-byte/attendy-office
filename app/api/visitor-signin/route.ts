import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const { name, company, host, phone, purpose, org_slug } = await req.json()

  if (!name || !host || !purpose || !org_slug) {
    return NextResponse.json({ message: 'name, host, purpose and org_slug are required' }, { status: 400 })
  }

  // Resolve org
  const { data: org } = await db
    .from('organisations')
    .select('id, is_active')
    .eq('slug', org_slug)
    .single()

  if (!org || !org.is_active) {
    return NextResponse.json({ message: 'Organisation not found or inactive' }, { status: 404 })
  }

  // Generate badge number
  const { data: badgeData } = await db.rpc('generate_badge_number', { p_org_id: org.id })
  const badge_number = badgeData ?? `VIS-${Date.now()}`

  // Insert visitor log
  const { error } = await db.from('visitor_logs').insert({
    organisation_id  : org.id,
    visitor_name     : name.trim(),
    company          : company?.trim() || null,
    host_name        : host.trim(),
    purpose          : purpose.trim(),
    phone            : phone?.trim() || null,
    badge_number,
  })

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, badge_number })
}
