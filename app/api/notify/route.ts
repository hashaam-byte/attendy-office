import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(req: NextRequest) {
  const { studentId, isLate, reason, time } = await req.json()
  if (!studentId) return NextResponse.json({ error: 'studentId required' }, { status: 400 })

  const { data: member } = await db.from('members').select('full_name, contact_phone, group_name, organisation_id').eq('id', studentId).single()
  if (!member) return NextResponse.json({ error: 'Member not found' }, { status: 404 })

  const { data: settings } = await db.from('org_settings').select('sms_enabled').eq('organisation_id', member.organisation_id).single()
  if (!settings?.sms_enabled) return NextResponse.json({ skipped: true })

  const message = isLate
    ? `Attendy: ${member.full_name} arrived LATE at ${time}.${reason ? ` Reason: ${reason}.` : ''}`
    : `Attendy: ${member.full_name} (${member.group_name}) arrived safely at ${time}.`

  let phone = (member.contact_phone ?? '').replace(/\s/g, '')
  if (phone.startsWith('0')) phone = '234' + phone.slice(1)
  else if (phone.startsWith('+')) phone = phone.slice(1)

  if (!phone || !process.env.TERMII_API_KEY) {
    console.log('[DEV SMS]', message)
    return NextResponse.json({ success: true, dev: true })
  }

  try {
    const res = await fetch('https://api.ng.termii.com/api/sms/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to: phone, from: process.env.TERMII_SENDER_ID ?? 'Attendy', sms: message, type: 'plain', channel: 'dnd', api_key: process.env.TERMII_API_KEY }),
    })
    const data = await res.json()
    const status = data.code === 'ok' ? 'sent' : 'failed'
    await db.from('notifications_log').insert({ organisation_id: member.organisation_id, member_id: studentId, channel: 'sms', phone: member.contact_phone, message, status })
    return NextResponse.json({ success: status === 'sent' })
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) })
  }
}
