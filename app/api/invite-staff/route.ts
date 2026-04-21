import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

const supabaseAdmin = createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(req: NextRequest) {
  const { createClient } = await import('../../../lib/supabase/server')
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  const { email, full_name, phone, role, school_id } = await req.json()
  if (!email || !full_name || !role || !school_id) {
    return NextResponse.json({ message: 'email, full_name, role and school_id required' }, { status: 400 })
  }

  const { data: callerProfile } = await supabase.from('user_profiles').select('organisation_id, role').eq('user_id', user.id).single()
  if (!callerProfile || callerProfile.role !== 'admin' || callerProfile.organisation_id !== school_id) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
  }

  const { data: org } = await supabaseAdmin.from('organisations').select('slug, name').eq('id', school_id).single()
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
  const verifyUrl = `${baseUrl}/${org?.slug}/auth/verify-otp?email=${encodeURIComponent(email.toLowerCase())}`

  const { data: listData } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 })
  const existingUser = listData?.users?.find((u: any) => u.email?.toLowerCase() === email.toLowerCase())

  if (existingUser) {
    await supabaseAdmin.from('user_profiles').insert({ user_id: existingUser.id, organisation_id: school_id, full_name, phone: phone || null, role, is_active: true })
    await supabaseAdmin.auth.signInWithOtp({ email: email.toLowerCase(), options: { shouldCreateUser: false, emailRedirectTo: verifyUrl } })
    return NextResponse.json({ success: true, verify_url: verifyUrl })
  }

  const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email.toLowerCase(), { redirectTo: verifyUrl, data: { pending_school_id: school_id, pending_role: role, pending_full_name: full_name } })
  if (inviteError || !inviteData?.user) return NextResponse.json({ message: inviteError?.message ?? 'Failed to send invite' }, { status: 400 })

  await supabaseAdmin.from('user_profiles').insert({ user_id: inviteData.user.id, organisation_id: school_id, full_name, phone: phone || null, role, is_active: true })
  return NextResponse.json({ success: true, verify_url: verifyUrl })
}
