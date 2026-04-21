'use client'
import { useState } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { createClient } from '../../../../lib/supabase/client'

type Stage = 'otp' | 'password' | 'done'

export default function VerifyOtpPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const org_slug = params?.org_slug as string
  const router = useRouter()
  const supabase = createClient()
  const [stage, setStage] = useState<Stage>('otp')
  const [otp, setOtp] = useState('')
  const [email, setEmail] = useState(searchParams?.get('email') ?? '')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleOtp() {
    if (!email.trim() || otp.trim().length !== 6) { setError('Enter your email and 6-digit code'); return }
    setError(''); setLoading(true)
    for (const type of ['signup', 'invite', 'magiclink', 'email'] as const) {
      const { data, error: e } = await supabase.auth.verifyOtp({ email: email.trim().toLowerCase(), token: otp.trim(), type })
      if (!e && data?.user) { setLoading(false); setStage('password'); return }
    }
    setError('Invalid or expired code.'); setLoading(false)
  }

  async function handlePassword() {
    if (password.length < 8) { setError('Min 8 characters'); return }
    if (password !== confirmPassword) { setError('Passwords do not match'); return }
    setError(''); setLoading(true)
    const { error: e } = await supabase.auth.updateUser({ password })
    if (e) { setError(e.message); setLoading(false); return }
    setLoading(false); setStage('done')
    setTimeout(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push(`/${org_slug}/login`); return }
      const { data: p } = await supabase.from('user_profiles').select('role').eq('user_id', user.id).single()
      router.push(p?.role === 'admin' ? `/${org_slug}/admin/dashboard` : `/${org_slug}/staff/scan`)
    }, 1500)
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600&family=IBM+Plex+Sans:wght@400;500;600&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        html,body{min-height:100vh;background:#07090c;font-family:'IBM Plex Sans',sans-serif;color:#e8eaf2}
        @keyframes rise{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        .root{min-height:100vh;display:flex;align-items:center;justify-content:center;padding:1.5rem}
        .card{width:100%;max-width:400px;animation:rise .4s ease}
        .brand{text-align:center;margin-bottom:24px}
        .logo{width:48px;height:48px;background:linear-gradient(135deg,#6d28d9,#8b5cf6);border-radius:12px;display:flex;align-items:center;justify-content:center;margin:0 auto 10px}
        .bname{font-size:20px;font-weight:700;color:#e8eaf2}
        .bsub{font-size:11px;color:#8b5cf6;font-family:'IBM Plex Mono',monospace;text-transform:capitalize;margin-top:3px;opacity:.8}
        .panel{background:#0c0f14;border:1px solid #1c2230;border-radius:16px;padding:26px}
        .ttl{font-size:16px;font-weight:600;color:#e8eaf2;margin-bottom:6px}
        .sub{font-size:12px;color:#6b7280;margin-bottom:20px;line-height:1.6}
        .fl{display:block;font-size:10px;font-family:'IBM Plex Mono',monospace;letter-spacing:1.5px;text-transform:uppercase;color:#3e4558;margin-bottom:6px}
        .fi{width:100%;background:#080b10;border:1px solid #1c2230;border-radius:8px;padding:11px 13px;font-size:14px;font-family:'IBM Plex Sans',sans-serif;color:#e8eaf2;outline:none;transition:border-color .2s;margin-bottom:14px}
        .otp{font-size:32px;font-family:'IBM Plex Mono',monospace;font-weight:700;letter-spacing:16px;text-align:center;color:#8b5cf6}
        .err{background:rgba(239,68,68,.06);border:1px solid rgba(239,68,68,.15);border-radius:7px;padding:10px 12px;font-size:12px;color:#fca5a5;margin-bottom:12px}
        .btn{width:100%;background:linear-gradient(135deg,#6d28d9,#8b5cf6);color:white;border:none;border-radius:9px;padding:13px;font-size:14px;font-family:'IBM Plex Sans',sans-serif;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;transition:opacity .15s}
        .btn:hover{opacity:.9}.btn:disabled{opacity:.4;cursor:not-allowed}
        .spinner{width:15px;height:15px;border:2px solid rgba(255,255,255,.3);border-top-color:white;border-radius:50%;animation:spin .7s linear infinite}
        .done{text-align:center;padding:16px 0}
        .done-icon{font-size:40px;margin-bottom:12px}
        .footer{text-align:center;margin-top:14px;font-size:12px;color:#252e40}
        .footer a{color:#3e4558;text-decoration:none}
      `}</style>
      <div className="root">
        <div className="card">
          <div className="brand">
            <div className="logo"><svg width="22" height="22" fill="none" stroke="white" strokeWidth="2.2" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg></div>
            <div className="bname">Attendy</div>
            <div className="bsub">{org_slug?.replace(/-/g,' ')}</div>
          </div>
          <div className="panel">
            {stage === 'otp' && <>
              <div className="ttl">Verify invite code</div>
              <div className="sub">Enter the 6-digit code from your invite email.</div>
              <label className="fl">Email address</label>
              <input className="fi" type="email" value={email} onChange={e => { setEmail(e.target.value); setError('') }} placeholder="your@email.com" />
              <label className="fl">6-digit code</label>
              <input className="fi otp" type="text" inputMode="numeric" maxLength={6} value={otp} onChange={e => { setOtp(e.target.value.replace(/\D/g,'').slice(0,6)); setError('') }} placeholder="••••••" />
              {error && <div className="err">{error}</div>}
              <button className="btn" disabled={loading || otp.length !== 6 || !email.trim()} onClick={handleOtp}>
                {loading ? <span className="spinner" /> : 'Verify Code'}
              </button>
            </>}
            {stage === 'password' && <>
              <div className="ttl">Set your password</div>
              <div className="sub">Create a password to complete your account setup.</div>
              <label className="fl">New password (min 8 chars)</label>
              <input className="fi" type="password" value={password} onChange={e => { setPassword(e.target.value); setError('') }} placeholder="••••••••" />
              <label className="fl">Confirm password</label>
              <input className="fi" type="password" value={confirmPassword} onChange={e => { setConfirmPassword(e.target.value); setError('') }} placeholder="••••••••" />
              {error && <div className="err">{error}</div>}
              <button className="btn" disabled={loading || !password || !confirmPassword} onClick={handlePassword}>
                {loading ? <span className="spinner" /> : 'Set Password & Continue'}
              </button>
            </>}
            {stage === 'done' && <div className="done">
              <div className="done-icon">✅</div>
              <div style={{ fontSize: 18, fontWeight: 600, color: '#e8eaf2', marginBottom: 6 }}>All set!</div>
              <div style={{ fontSize: 13, color: '#6b7280' }}>Redirecting to your dashboard...</div>
            </div>}
          </div>
          <div className="footer">Already have a password? <a href={`/${org_slug}/login`}>Sign in →</a></div>
        </div>
      </div>
    </>
  )
}
