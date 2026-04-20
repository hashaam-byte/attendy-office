import { createClient } from '@/lib/supabase/server'
import { format } from 'date-fns'
import { notFound } from 'next/navigation'

export default async function OfficeVisitorsPage({ params }: { params: Promise<{ org_slug: string }> }) {
  const { org_slug } = await params
  const supabase = await createClient()
  const { data: org } = await supabase.from('organisations').select('id, name').eq('slug', org_slug).single()
  if (!org) notFound()

  const today = format(new Date(), 'yyyy-MM-dd')
  const { data: visitors } = await supabase.from('visitor_logs').select('*').eq('organisation_id', org.id).gte('signed_in_at', `${today}T00:00:00`).order('signed_in_at', { ascending: false })
  const { data: allVisitors } = await supabase.from('visitor_logs').select('*').eq('organisation_id', org.id).order('signed_in_at', { ascending: false }).limit(30)

  const todayIn = visitors?.length ?? 0
  const todayOut = visitors?.filter(v => v.signed_out_at).length ?? 0
  const insideNow = todayIn - todayOut

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@300;400;500;600&display=swap');
        .pt{font-size:22px;font-weight:600;color:#eaeaf6;letter-spacing:-.5px;margin-bottom:4px}
        .ps{font-size:11px;color:#3e3d58;font-family:'IBM Plex Mono',monospace;margin-bottom:24px}
        .stats{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:24px}
        .stat{background:#0e0d18;border:1px solid #1e1c30;border-radius:10px;padding:16px;position:relative;overflow:hidden}
        .stat::after{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:var(--sc,#8b5cf6);opacity:.4}
        .sv{font-size:28px;font-weight:600;color:#eaeaf6;font-family:'IBM Plex Mono',monospace;letter-spacing:-1.5px;line-height:1;margin-bottom:3px}
        .sl{font-size:11px;color:#6b6e8a}
        .vis-link{display:inline-flex;align-items:center;gap:7px;background:rgba(139,92,246,.08);border:1px solid rgba(139,92,246,.2);color:#c4b5fd;font-size:12px;font-family:'IBM Plex Mono',monospace;padding:7px 14px;border-radius:7px;text-decoration:none;margin-bottom:20px}
        .panel{background:#0e0d18;border:1px solid #1e1c30;border-radius:10px;overflow:hidden;margin-bottom:16px}
        .ph{padding:12px 18px;border-bottom:1px solid #1e1c30;display:flex;align-items:center;justify-content:space-between}
        .phtt{font-size:11px;font-weight:600;font-family:'IBM Plex Mono',monospace;text-transform:uppercase;letter-spacing:.5px;color:#eaeaf6}
        .phm{font-size:10px;font-family:'IBM Plex Mono',monospace;color:#3e3d58}
        .vrow{padding:13px 18px;border-bottom:1px solid #08070e;display:grid;grid-template-columns:1fr 1fr 1fr auto;align-items:center;gap:12px;transition:background .15s;font-size:12px}
        .vrow:last-child{border-bottom:none}
        .vrow:hover{background:rgba(255,255,255,.01)}
        .vname{font-size:13px;font-weight:500;color:#d4d0f0}
        .vmeta{font-size:10px;color:#3e3d58;font-family:'IBM Plex Mono',monospace;margin-top:1px}
        .badge{font-size:10px;font-family:'IBM Plex Mono',monospace;text-transform:uppercase;letter-spacing:.5px;padding:3px 8px;border-radius:4px;white-space:nowrap}
        .time-val{font-size:11px;font-family:'IBM Plex Mono',monospace;color:#3e3d58}
        .empty{padding:32px;text-align:center;color:#3e3d58;font-size:11px;font-family:'IBM Plex Mono',monospace}
      `}</style>

      <div className="pt">Visitor Management</div>
      <div className="ps">{org.name} · {format(new Date(), 'MMMM d, yyyy')}</div>

      <div className="stats">
        {[
          { label: 'Signed In Today', val: todayIn, color: '#8b5cf6' },
          { label: 'Currently Inside', val: insideNow, color: '#22c55e' },
          { label: 'Signed Out', val: todayOut, color: '#6b6e8a' },
        ].map(s => (
          <div key={s.label} className="stat" style={{ '--sc': s.color } as any}>
            <div className="sv">{s.val}</div>
            <div className="sl">{s.label}</div>
          </div>
        ))}
      </div>

      <a className="vis-link" href={`/${org_slug}/visitor`} target="_blank" rel="noopener noreferrer">
        🖥️ Open visitor sign-in terminal →
      </a>

      <div className="panel">
        <div className="ph">
          <span className="phtt">Today's Visitors</span>
          <span className="phm">{todayIn} signed in</span>
        </div>
        {visitors && visitors.length > 0 ? (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', padding: '8px 18px', borderBottom: '1px solid #1e1c30', fontSize: 10, fontFamily: "'IBM Plex Mono',monospace", color: '#3e3d58', gap: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
              <span>Visitor</span><span>Host</span><span>Purpose</span><span>Status</span>
            </div>
            {visitors.map((v: any) => (
              <div key={v.id} className="vrow">
                <div>
                  <div className="vname">{v.visitor_name}</div>
                  <div className="vmeta">{v.company ?? '—'} · 🪪 {v.badge_number}</div>
                </div>
                <div className="time-val">{v.host_name}</div>
                <div className="time-val">{v.purpose}</div>
                <span className="badge" style={v.signed_out_at ? { background: 'rgba(107,114,128,.08)', color: '#9ca3af' } : { background: 'rgba(139,92,246,.08)', color: '#c4b5fd', border: '1px solid rgba(139,92,246,.2)' }}>
                  {v.signed_out_at ? 'LEFT' : 'INSIDE'}
                </span>
              </div>
            ))}
          </>
        ) : <div className="empty">No visitors today</div>}
      </div>

      <div className="panel">
        <div className="ph">
          <span className="phtt">Recent Visitor History</span>
          <span className="phm">last 30</span>
        </div>
        {allVisitors && allVisitors.length > 0 ? allVisitors.map((v: any) => (
          <div key={v.id} className="vrow">
            <div>
              <div className="vname">{v.visitor_name}</div>
              <div className="vmeta">{v.company ?? '—'}</div>
            </div>
            <div className="time-val">{v.host_name}</div>
            <div className="time-val">{v.purpose}</div>
            <div className="time-val">{format(new Date(v.signed_in_at), 'MMM d, h:mm a')}</div>
          </div>
        )) : <div className="empty">No visitor history</div>}
      </div>
    </>
  )
}
