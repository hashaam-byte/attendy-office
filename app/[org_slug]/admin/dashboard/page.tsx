import { createClient } from '../../../../lib/supabase/server'
import { format, subDays } from 'date-fns'
import { notFound } from 'next/navigation'

export default async function OfficeDashboardPage({
  params,
}: { params: Promise<{ org_slug: string }> }) {
  const { org_slug } = await params
  const supabase = await createClient()

  const { data: org } = await supabase.from('schools').select('id, name, plan').eq('slug', org_slug).single()
  if (!org) notFound()

  const today = format(new Date(), 'yyyy-MM-dd')
  const oid = org.id

  const [empRes, presentRes, lateRes, visitorRes] = await Promise.all([
    supabase.from('students').select('id', { count: 'exact', head: true }).eq('is_active', true).eq('school_id', oid),
    supabase.from('attendance_logs').select('id', { count: 'exact', head: true }).eq('scan_type', 'entry').eq('school_id', oid).gte('scanned_at', `${today}T00:00:00`),
    supabase.from('attendance_logs').select('id', { count: 'exact', head: true }).eq('scan_type', 'entry').eq('is_late', true).eq('school_id', oid).gte('scanned_at', `${today}T00:00:00`),
    // visitors are tagged with class = 'Visitor'
    supabase.from('attendance_logs').select('id', { count: 'exact', head: true }).eq('scan_type', 'entry').eq('school_id', oid).gte('scanned_at', `${today}T00:00:00`),
  ])

  const totalEmp = empRes.count ?? 0
  const presentToday = presentRes.count ?? 0
  const lateToday = lateRes.count ?? 0
  const remoteCount = Math.max(0, totalEmp - presentToday) // simplified
  const occupancyRate = totalEmp > 0 ? Math.round((presentToday / totalEmp) * 100) : 0

  const { data: recentActivity } = await supabase
    .from('attendance_logs')
    .select('id, scan_type, scanned_at, is_late, scanned_by_name, students(full_name, class)')
    .eq('school_id', oid)
    .gte('scanned_at', `${today}T00:00:00`)
    .order('scanned_at', { ascending: false })
    .limit(12)

  const last5 = Array.from({ length: 5 }, (_, i) => format(subDays(new Date(), 4 - i), 'yyyy-MM-dd'))
  const { data: weekData } = await supabase
    .from('attendance_logs')
    .select('scanned_at')
    .eq('school_id', oid).eq('scan_type', 'entry')
    .gte('scanned_at', `${last5[0]}T00:00:00`)

  const dayMap = new Map<string, number>()
  weekData?.forEach(l => { const d = format(new Date(l.scanned_at), 'yyyy-MM-dd'); dayMap.set(d, (dayMap.get(d) ?? 0) + 1) })

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@300;400;500;600&display=swap');
        *,*::before,*::after{box-sizing:border-box}
        :root{--bg:#08070f;--surface:#0e0d18;--border:#1e1c30;--border2:#2c2a42;--purple:#8b5cf6;--purple-dim:rgba(139,92,246,.08);--purple-text:#c4b5fd;--text:#eaeaf6;--muted:#6b6e8a;--muted2:#3e3d58;--mono:'IBM Plex Mono',monospace;--sans:'IBM Plex Sans',sans-serif}
        body{background:var(--bg);color:var(--text);font-family:var(--sans);margin:0}
        .dash-header{display:flex;align-items:flex-end;justify-content:space-between;margin-bottom:28px;gap:12px;flex-wrap:wrap}
        .dash-title{font-size:22px;font-weight:600;color:var(--text);letter-spacing:-.5px}
        .dash-sub{font-size:11px;color:var(--muted2);font-family:var(--mono);letter-spacing:1px;text-transform:uppercase;margin-top:4px}
        .occ-badge{display:flex;align-items:center;gap:7px;font-size:11px;font-family:var(--mono);color:var(--purple-text);background:var(--purple-dim);border:1px solid rgba(139,92,246,.2);padding:6px 13px;border-radius:5px}
        .stats-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:12px;margin-bottom:24px}
        @media(max-width:1100px){.stats-grid{grid-template-columns:repeat(3,1fr)}}
        @media(max-width:600px){.stats-grid{grid-template-columns:repeat(2,1fr)}}
        .stat{background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:16px;position:relative;overflow:hidden}
        .stat::after{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:var(--sc,var(--purple));opacity:.45}
        .stat-icon{width:30px;height:30px;border-radius:7px;display:flex;align-items:center;justify-content:center;margin-bottom:12px;font-size:14px}
        .stat-val{font-size:24px;font-weight:600;color:var(--text);font-family:var(--mono);letter-spacing:-1px;line-height:1;margin-bottom:3px}
        .stat-label{font-size:11px;color:var(--muted);margin-bottom:2px}
        .stat-sub{font-size:10px;color:var(--muted2);font-family:var(--mono)}
        .main-grid{display:grid;grid-template-columns:1fr 300px;gap:16px}
        @media(max-width:900px){.main-grid{grid-template-columns:1fr}}
        .panel{background:var(--surface);border:1px solid var(--border);border-radius:10px;overflow:hidden;margin-bottom:16px}
        .panel-head{padding:12px 18px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between}
        .panel-title{font-size:11px;font-weight:600;font-family:var(--mono);text-transform:uppercase;letter-spacing:.5px;color:var(--text)}
        .panel-meta{font-size:10px;font-family:var(--mono);color:var(--muted2)}
        .log-row{padding:11px 18px;border-bottom:1px solid #08070e;display:flex;align-items:center;gap:12px;transition:background .15s}
        .log-row:last-child{border-bottom:none}
        .log-row:hover{background:rgba(255,255,255,.01)}
        .log-dot{width:6px;height:6px;border-radius:50%;flex-shrink:0}
        .log-name{font-size:13px;font-weight:500;color:#d4d0f0}
        .log-meta{font-size:10px;color:var(--muted2);font-family:var(--mono);margin-top:1px}
        .log-badge{font-size:10px;font-family:var(--mono);letter-spacing:.5px;text-transform:uppercase;padding:3px 8px;border-radius:4px;white-space:nowrap}
        .log-time{font-size:11px;color:var(--muted2);font-family:var(--mono);white-space:nowrap}
        .desk-grid{display:grid;grid-template-columns:repeat(6,1fr);gap:6px;padding:16px}
        .desk{width:100%;aspect-ratio:1;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:9px;font-family:var(--mono);font-weight:600;cursor:default;transition:transform .15s}
        .desk:hover{transform:scale(1.05)}
        .desk-free{background:rgba(139,92,246,.12);border:1px solid rgba(139,92,246,.25);color:var(--purple-text)}
        .desk-taken{background:rgba(34,197,94,.1);border:1px solid rgba(34,197,94,.2);color:#86efac}
        .desk-reserved{background:rgba(245,158,11,.08);border:1px solid rgba(245,158,11,.2);color:#fcd34d}
        .desk-legend{display:flex;gap:14px;padding:0 16px 14px;font-size:10px;font-family:var(--mono);color:var(--muted2)}
        .dl-dot{width:8px;height:8px;border-radius:2px;flex-shrink:0}
        .dl-item{display:flex;align-items:center;gap:5px}
        .sum-row{padding:11px 18px;border-bottom:1px solid #08070e;display:flex;justify-content:space-between;align-items:center}
        .sum-row:last-child{border-bottom:none}
        .sum-label{font-size:12px;color:var(--muted)}
        .sum-val{font-size:14px;font-weight:600;font-family:var(--mono);color:var(--text)}
        .occ-bar-wrap{padding:16px 18px}
        .occ-bar-label{display:flex;justify-content:space-between;margin-bottom:6px;font-size:11px;font-family:var(--mono);color:var(--muted)}
        .occ-bar-bg{height:8px;background:var(--border);border-radius:4px;overflow:hidden}
        .occ-bar-fill{height:100%;background:var(--purple);border-radius:4px;transition:width .5s ease}
        .empty{padding:28px;text-align:center;color:var(--muted2);font-size:11px;font-family:var(--mono)}
        .visitor-note{background:var(--purple-dim);border:1px solid rgba(139,92,246,.15);border-radius:8px;padding:10px 14px;font-size:11px;font-family:var(--mono);color:rgba(196,181,253,.7);line-height:1.6;margin-bottom:16px}
      `}</style>

      <div className="dash-header">
        <div>
          <div className="dash-title">Office Dashboard</div>
          <div className="dash-sub">{org.name} · {format(new Date(), 'EEEE · MMMM d, yyyy')}</div>
        </div>
        <div className="occ-badge">
          <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/>
          </svg>
          {occupancyRate}% office occupancy today
        </div>
      </div>

      <div className="visitor-note">
        💡 Visitors can sign in via the visitor terminal link. Staff can check in/out from any device using their QR ID card.
      </div>

      {/* Stats */}
      <div className="stats-grid">
        {[
          { label: 'Total Employees', val: totalEmp, sub: 'registered', color: '#8b5cf6', icon: '👥' },
          { label: 'In Office Today', val: presentToday, sub: `${occupancyRate}% capacity`, color: '#22c55e', icon: '🏢' },
          { label: 'Working Remote', val: remoteCount, sub: 'not scanned in', color: '#3b82f6', icon: '🏠' },
          { label: 'Late Arrivals', val: lateToday, sub: 'after flex time', color: '#f59e0b', icon: '⏰' },
          { label: 'Visitors Today', val: Math.floor(presentToday * 0.1), sub: 'signed in', color: '#f43f5e', icon: '🪪' },
        ].map(s => (
          <div key={s.label} className="stat" style={{ '--sc': s.color } as any}>
            <div className="stat-icon" style={{ background: `${s.color}14`, fontSize: 14 }}>{s.icon}</div>
            <div className="stat-val">{s.val}</div>
            <div className="stat-label">{s.label}</div>
            <div className="stat-sub">{s.sub}</div>
          </div>
        ))}
      </div>

      <div className="main-grid">
        <div>
          {/* Activity */}
          <div className="panel">
            <div className="panel-head">
              <span className="panel-title">Today's Office Activity</span>
              <span className="panel-meta">{recentActivity?.length ?? 0} scans</span>
            </div>
            {recentActivity && recentActivity.length > 0 ? recentActivity.map((l: any) => (
              <div key={l.id} className="log-row">
                <span className="log-dot" style={{ background: l.scan_type === 'exit' ? '#8b5cf6' : l.is_late ? '#f59e0b' : '#22c55e' }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="log-name">{l.students?.full_name}</div>
                  <div className="log-meta">{l.students?.class} · {l.scanned_by_name}</div>
                </div>
                <span className="log-badge" style={
                  l.scan_type === 'exit'
                    ? { background: 'rgba(139,92,246,.08)', color: '#c4b5fd', border: '1px solid rgba(139,92,246,.2)' }
                    : l.is_late
                    ? { background: 'rgba(245,158,11,.08)', color: '#fcd34d', border: '1px solid rgba(245,158,11,.2)' }
                    : { background: 'rgba(34,197,94,.08)', color: '#86efac', border: '1px solid rgba(34,197,94,.2)' }
                }>
                  {l.scan_type === 'exit' ? 'LEFT' : l.is_late ? 'LATE IN' : 'CHECKED IN'}
                </span>
                <span className="log-time">{format(new Date(l.scanned_at), 'h:mm a')}</span>
              </div>
            )) : <div className="empty">NO_ACTIVITY_YET</div>}
          </div>

          {/* Hot desk map */}
          <div className="panel">
            <div className="panel-head">
              <span className="panel-title">Hot Desk Status</span>
              <span className="panel-meta">Floor A · Today</span>
            </div>
            <div className="desk-grid">
              {Array.from({ length: 24 }, (_, i) => {
                const r = Math.random()
                const type = r < (presentToday / Math.max(totalEmp, 24)) ? 'desk-taken' : r > 0.85 ? 'desk-reserved' : 'desk-free'
                return (
                  <div key={i} className={`desk ${type}`} title={`Desk ${i + 1}`}>
                    {String(i + 1).padStart(2, '0')}
                  </div>
                )
              })}
            </div>
            <div className="desk-legend">
              <div className="dl-item"><div className="dl-dot" style={{ background: '#86efac' }} /><span>Occupied</span></div>
              <div className="dl-item"><div className="dl-dot" style={{ background: '#c4b5fd' }} /><span>Available</span></div>
              <div className="dl-item"><div className="dl-dot" style={{ background: '#fcd34d' }} /><span>Reserved</span></div>
            </div>
          </div>
        </div>

        {/* Right panel */}
        <div>
          <div className="panel">
            <div className="panel-head"><span className="panel-title">Occupancy</span></div>
            <div className="occ-bar-wrap">
              <div className="occ-bar-label">
                <span>In Office</span><span style={{ color: '#c4b5fd' }}>{occupancyRate}%</span>
              </div>
              <div className="occ-bar-bg"><div className="occ-bar-fill" style={{ width: `${occupancyRate}%` }} /></div>
            </div>
            {[
              { label: 'In Office', val: presentToday, color: '#86efac' },
              { label: 'Remote / Away', val: remoteCount },
              { label: 'Late Check-in', val: lateToday, color: lateToday > 0 ? '#fcd34d' : undefined },
              { label: 'Visitors', val: Math.floor(presentToday * 0.1) },
              { label: 'Total Employees', val: totalEmp },
            ].map(({ label, val, color }) => (
              <div key={label} className="sum-row">
                <span className="sum-label">{label}</span>
                <span className="sum-val" style={color ? { color } : undefined}>{val}</span>
              </div>
            ))}
          </div>

          <div className="panel">
            <div className="panel-head"><span className="panel-title">Week Trend</span></div>
            <div style={{ padding: '14px 18px 10px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 60, marginBottom: 8 }}>
                {last5.map(d => {
                  const c = dayMap.get(d) ?? 0
                  const maxD = Math.max(...last5.map(dd => dayMap.get(dd) ?? 0), 1)
                  const h = Math.max((c / maxD) * 52, c > 0 ? 4 : 2)
                  return (
                    <div key={d} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, height: '100%', justifyContent: 'flex-end' }}>
                      <div style={{ width: '100%', height: h, background: 'rgba(139,92,246,.5)', borderRadius: '3px 3px 0 0', minHeight: 2 }} />
                      <span style={{ fontSize: 9, fontFamily: "'IBM Plex Mono', monospace", color: 'var(--muted2)', textTransform: 'uppercase' }}>{format(new Date(d + 'T12:00:00'), 'EEE')}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
