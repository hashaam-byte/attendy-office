'use client'
import { useState } from 'react'
import { useParams } from 'next/navigation'

export default function VisitorSignInPage() {
  const { org_slug } = useParams<{ org_slug: string }>()
  const [form, setForm] = useState({ name: '', company: '', host: '', phone: '', purpose: '' })
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState<{ name: string; badge: string } | null>(null)
  const [error, setError] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name || !form.host || !form.purpose) { setError('Name, host, and purpose are required.'); return }
    setError(''); setSubmitting(true)

    const res = await fetch('/api/visitor-signin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, org_slug }),
    })
    const data = await res.json()
    if (res.ok) { setDone({ name: form.name, badge: data.badge_number }) }
    else { setError(data.message ?? 'Sign-in failed. Please try again.') }
    setSubmitting(false)
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@300;400;500;600&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        :root{--bg:#08070f;--surface:#0e0d18;--border:#1e1c30;--purple:#8b5cf6;--purple-dim:rgba(139,92,246,.08);--text:#eaeaf6;--muted:#6b6e8a;--muted2:#3e3d58;--mono:'IBM Plex Mono',monospace;--sans:'IBM Plex Sans',sans-serif}
        html,body{background:var(--bg);min-height:100vh;font-family:var(--sans);color:var(--text)}
        .root{min-height:100vh;display:flex;align-items:center;justify-content:center;padding:1.5rem;background:var(--bg);position:relative;overflow:hidden}
        .glow{position:fixed;top:-150px;left:50%;transform:translateX(-50%);width:500px;height:400px;background:radial-gradient(ellipse,rgba(139,92,246,.12) 0%,transparent 70%);pointer-events:none}
        .card{width:100%;max-width:420px;position:relative;z-index:1;animation:rise .4s cubic-bezier(.22,.68,0,1.2)}
        @keyframes rise{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        .brand{text-align:center;margin-bottom:28px}
        .brand-icon{width:50px;height:50px;background:linear-gradient(135deg,#6d28d9,#8b5cf6);border-radius:13px;display:flex;align-items:center;justify-content:center;margin:0 auto 12px;box-shadow:0 0 28px rgba(139,92,246,.3)}
        .brand-name{font-size:20px;font-weight:700;color:var(--text);letter-spacing:-.4px}
        .brand-sub{font-size:11px;color:#a78bfa;font-family:var(--mono);letter-spacing:1px;text-transform:uppercase;margin-top:3px;text-transform:capitalize}
        .panel{background:var(--surface);border:1px solid var(--border);border-radius:16px;overflow:hidden}
        .panel-head{padding:18px 22px 0}
        .panel-title{font-size:16px;font-weight:600;color:var(--text);margin-bottom:3px}
        .panel-sub{font-size:12px;color:var(--muted);margin-bottom:20px;line-height:1.5}
        .divider{height:1px;background:var(--border);margin:0 22px}
        .panel-body{padding:20px 22px 22px;display:flex;flex-direction:column;gap:13px}
        .field-label{display:block;font-size:10px;font-family:var(--mono);letter-spacing:1.5px;text-transform:uppercase;color:var(--muted2);margin-bottom:6px}
        .input{width:100%;background:#080610;border:1px solid var(--border);border-radius:8px;padding:11px 13px;font-size:14px;font-family:var(--sans);color:var(--text);outline:none;transition:border-color .2s}
        .input:focus{border-color:rgba(139,92,246,.45);box-shadow:0 0 0 3px rgba(139,92,246,.07)}
        .input::placeholder{color:#2a2840}
        .grid2{display:grid;grid-template-columns:1fr 1fr;gap:13px}
        .error-box{background:rgba(239,68,68,.06);border:1px solid rgba(239,68,68,.15);border-radius:7px;padding:10px 13px;font-size:12px;color:#fca5a5;line-height:1.5}
        .submit-btn{width:100%;background:linear-gradient(135deg,#6d28d9,#8b5cf6);color:white;border:none;border-radius:9px;padding:13px;font-size:14px;font-family:var(--sans);font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;transition:opacity .15s;margin-top:4px}
        .submit-btn:hover{opacity:.9}
        .submit-btn:disabled{opacity:.4;cursor:not-allowed}
        @keyframes spin{to{transform:rotate(360deg)}}
        .spinner{width:15px;height:15px;border:2px solid rgba(255,255,255,.3);border-top-color:white;border-radius:50%;animation:spin .7s linear infinite}
        .success-wrap{text-align:center;padding:8px 0 6px}
        .success-icon{width:60px;height:60px;background:rgba(139,92,246,.1);border:1px solid rgba(139,92,246,.25);border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 18px;animation:pop .4s cubic-bezier(.22,.68,0,1.5)}
        @keyframes pop{from{transform:scale(.5);opacity:0}to{transform:scale(1);opacity:1}}
        .success-title{font-size:18px;font-weight:600;color:var(--text);margin-bottom:6px}
        .badge-num{font-size:32px;font-family:var(--mono);font-weight:700;color:#a78bfa;letter-spacing:2px;margin:10px 0}
        .success-sub{font-size:12px;color:var(--muted);line-height:1.6}
        .new-visitor-btn{margin-top:18px;background:transparent;border:1px solid var(--border);color:var(--muted);padding:10px 20px;border-radius:8px;font-size:13px;font-family:var(--sans);cursor:pointer;width:100%;transition:all .15s}
        .new-visitor-btn:hover{border-color:#6d28d9;color:#a78bfa}
      `}</style>

      <div className="root">
        <div className="glow" />
        <div className="card">
          <div className="brand">
            <div className="brand-icon">
              <svg width="24" height="24" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
            <div className="brand-name">Visitor Sign In</div>
            <div className="brand-sub">{org_slug?.replace(/-/g, ' ')}</div>
          </div>

          <div className="panel">
            {done ? (
              <div style={{ padding: '28px 24px' }}>
                <div className="success-wrap">
                  <div className="success-icon">
                    <svg width="26" height="26" fill="none" stroke="#a78bfa" strokeWidth="2.2" viewBox="0 0 24 24">
                      <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
                    </svg>
                  </div>
                  <div className="success-title">Welcome, {done.name.split(' ')[0]}!</div>
                  <div style={{ fontSize: 12, color: '#6b6e8a', marginBottom: 8 }}>Your visitor badge number</div>
                  <div className="badge-num">{done.badge}</div>
                  <div className="success-sub">Please collect a visitor badge from reception. Your host has been notified of your arrival.</div>
                  <button className="new-visitor-btn" onClick={() => { setDone(null); setForm({ name: '', company: '', host: '', phone: '', purpose: '' }) }}>
                    New visitor sign-in
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="panel-head">
                  <div className="panel-title">Sign In</div>
                  <div className="panel-sub">Please fill in your details. Your host will be notified automatically.</div>
                </div>
                <div className="divider" />
                <form className="panel-body" onSubmit={submit}>
                  <div className="grid2">
                    <div>
                      <label className="field-label">Full Name *</label>
                      <input className="input" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Your full name" />
                    </div>
                    <div>
                      <label className="field-label">Company</label>
                      <input className="input" value={form.company} onChange={e => setForm(p => ({ ...p, company: e.target.value }))} placeholder="Your company" />
                    </div>
                  </div>
                  <div>
                    <label className="field-label">Who are you visiting? *</label>
                    <input className="input" value={form.host} onChange={e => setForm(p => ({ ...p, host: e.target.value }))} placeholder="Name of your host" />
                  </div>
                  <div>
                    <label className="field-label">Purpose of visit *</label>
                    <input className="input" value={form.purpose} onChange={e => setForm(p => ({ ...p, purpose: e.target.value }))} placeholder="e.g. Meeting, Interview, Delivery..." />
                  </div>
                  <div>
                    <label className="field-label">Phone Number</label>
                    <input className="input" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="08012345678" />
                  </div>
                  {error && <div className="error-box">{error}</div>}
                  <button type="submit" className="submit-btn" disabled={submitting}>
                    {submitting ? <span className="spinner" /> : (
                      <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
                      </svg>
                    )}
                    {submitting ? 'Signing in...' : 'Sign In to Office'}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
