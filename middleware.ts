import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return response

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(s: { name: string; value: string; options?: any }[]) { s.forEach(({ name, value, options }) => response.cookies.set(name, value, options)) },
      },
    }
  )

  const { pathname } = request.nextUrl
  if (pathname.startsWith('/_next') || pathname.startsWith('/api') || pathname.startsWith('/favicon') || pathname.includes('.')) return response

  const slugMatch = pathname.match(/^\/([^/]+)(?:\/|$)/)
  const slug = slugMatch?.[1]
  if (!slug) return response

  const publicPaths = ['/login', '/auth/callback', '/auth/verify-otp', '/auth/set-password', '/visitor']
  if (publicPaths.some(p => pathname === `/${slug}${p}` || pathname.startsWith(`/${slug}${p}`))) return response

  let user = null
  try { const { data } = await supabase.auth.getUser(); user = data.user } catch { return NextResponse.redirect(new URL(`/${slug}/login`, request.url)) }

  const isLoginPage = pathname === `/${slug}/login`
  if (!user && !isLoginPage) return NextResponse.redirect(new URL(`/${slug}/login`, request.url))

  if (user && isLoginPage) {
    const { data: profile } = await supabase.from('user_profiles').select('role').eq('user_id', user.id).single()
    return NextResponse.redirect(new URL(profile?.role === 'admin' ? `/${slug}/admin/dashboard` : `/${slug}/staff/scan`, request.url))
  }

  return response
}

export const config = { matcher: ['/((?!_next/static|_next/image|favicon\\.ico|favicon\\.svg).*)'] }
