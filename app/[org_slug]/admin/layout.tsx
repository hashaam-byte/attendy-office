'use client'
import { useParams, usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useState, useEffect } from 'react'

const NAV = [
  { label: 'Dashboard',  path: 'admin/dashboard' },
  { label: 'Employees',  path: 'admin/staff'     },
  { label: 'Visitors',   path: 'admin/visitors'  },
  { label: 'Desks',      path: 'admin/desks'     },
  { label: 'Reports',    path: 'admin/reports'   },
  { label: 'Settings',   path: 'admin/settings'  },
]

export default function OfficeAdminLayout({ children }: { children: React.ReactNode }) {
  const { org_slug } = useParams<{ org_slug: string }>()
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [orgName, setOrgName] = useState('')
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => { setOrgName(org_slug?.replace(/-/g, ' ') ?? '') }, [org_slug])
  async function logout() { await supabase.auth.signOut(); router.push(`/${org_slug}/login`) }
  const isActive = (p: string) => pathname.includes(p)

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#08070f', fontFamily: "'IBM Plex Sans',sans-serif", color: '#eaeaf6' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@300;400;500;600&display=swap');
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}
        :root{--a:#8b5cf6;--sw:220px;--sc:60px;--tr:.2s cubic-bezier(.4,0,.2,1)}
        .sb{position:fixed;top:0;left:0;bottom:0;width:var(--sw);background:#0e0d18;border-right:1px solid #1e1c30;display:flex;flex-direction:column;transition:width var(--tr);z-index:200;overflow:hidden}
        .sb.c{width:var(--sc)}
        .sb-top{height:56px;display:flex;align-items:center;padding:0 14px;border-bottom:1px solid #1e1c30;gap:10px;flex-shrink:0}
        .sb-icon{width:30px;height:30px;min-width:30px;background:linear-gradient(135deg,#6d28d9,#8b5cf6);border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
        .sb-txt{overflow:hidden;transition:opacity var(--tr)}.c .sb-txt{opacity:0;width:0}
        .sb-name{font-size:13px;font-weight:600;color:#eaeaf6;white-space:nowrap;text-transform:capitalize}
        .sb-role{font-size:10px;color:#8b5cf6;font-family:'IBM Plex Mono',monospace}
        .sb-nav{flex:1;padding:10px 8px;display:flex;flex-direction:column;gap:2px;overflow-y:auto;overflow-x:hidden}
        .ni{display:flex;align-items:center;gap:10px;padding:9px 10px;border-radius:7px;text-decoration:none;color:#6b6e8a;font-size:13px;font-weight:500;white-space:nowrap;transition:all var(--tr);position:relative}
        .ni:hover{background:rgba(139,92,246,.06);color:#eaeaf6}
        .ni.act{background:rgba(139,92,246,.1);color:#c4b5fd;border:1px solid rgba(139,92,246,.18)}
        .ni.act::before{content:'';position:absolute;left:0;top:50%;transform:translateY(-50%);width:2px;height:16px;background:#8b5cf6;border-radius:0 2px 2px 0}
        .nl{overflow:hidden;transition:opacity var(--tr)}.c .nl{opacity:0;width:0;overflow:hidden}
        .nt{display:none;position:absolute;left:calc(100% + 10px);top:50%;transform:translateY(-50%);background:#0e0d18;border:1px solid #2c2a42;color:#eaeaf6;font-size:12px;padding:5px 10px;border-radius:5px;white-space:nowrap;pointer-events:none;z-index:300}
        .c .ni:hover .nt{display:block}
        .sb-bot{padding:8px;border-top:1px solid #1e1c30;display:flex;flex-direction:column;gap:2px;flex-shrink:0}
        .tb{display:flex;align-items:center;gap:10px;padding:9px 10px;border-radius:7px;border:none;background:transparent;color:#3e3d58;font-size:12px;font-family:'IBM Plex Sans',sans-serif;cursor:pointer;white-space:nowrap;width:100%;transition:all var(--tr)}
        .tb:hover{background:rgba(255,255,255,.03);color:#6b6e8a}
        .tl{overflow:hidden;transition:opacity var(--tr)}.c .tl{opacity:0;width:0;overflow:hidden}
        .lb{display:flex;align-items:center;gap:10px;padding:9px 10px;border-radius:7px;border:none;background:transparent;color:#3e3d58;font-size:13px;font-family:'IBM Plex Sans',sans-serif;cursor:pointer;width:100%;white-space:nowrap;transition:all var(--tr);position:relative}
        .lb:hover{background:rgba(239,68,68,.06);color:#fca5a5}
        .main{flex:1;margin-left:var(--sw);min-height:100vh;display:flex;flex-direction:column;transition:margin-left var(--tr)}
        .main.c{margin-left:var(--sc)}
        .tb2{height:56px;background:#0e0d18;border-bottom:1px solid #1e1c30;display:flex;align-items:center;padding:0 24px;gap:12px;position:sticky;top:0;z-index:100}
        .bc{flex:1;display:flex;align-items:center;gap:6px;font-size:12px;font-family:'IBM Plex Mono',monospace;color:#3e3d58}
        .bc-c{color:#eaeaf6;font-weight:500}
        .lv{display:flex;align-items:center;gap:5px;background:rgba(139,92,246,.08);border:1px solid rgba(139,92,246,.18);padding:4px 10px;border-radius:5px;font-size:10px;font-family:'IBM Plex Mono',monospace;color:#c4b5fd}
        .lvd{width:5px;height:5px;border-radius:50%;background:#8b5cf6;box-shadow:0 0 4px #8b5cf6;animation:pulse 2s infinite}
        .ct{flex:1;padding:28px;max-width:1280px;width:100%;margin:0 auto}
        @media(max-width:768px){.sb{transform:translateX(-100%);width:var(--sw) !important}.main{margin-left:0 !important}.ct{padding:16px}.tb2{padding:0 16px}}
      `}</style>

      <aside className={`sb ${collapsed ? 'c' : ''}`}>
        <div className="sb-top">
          <div className="sb-icon">
            <svg width="16" height="16" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/></svg>
          </div>
          <div className="sb-txt">
            <div className="sb-name">{orgName}</div>
            <div className="sb-role">Office Admin</div>
          </div>
        </div>
        <nav className="sb-nav">
          {NAV.map(n => {
            const h = `/${org_slug}/${n.path}`
            return <Link key={h} href={h} className={`ni ${isActive(n.path) ? 'act' : ''}`}><span className="nl">{n.label}</span><span className="nt">{n.label}</span></Link>
          })}
        </nav>
        <div className="sb-bot">
          <button className="tb" onClick={() => setCollapsed(c => !c)}>
            {collapsed ? '›' : <><span>‹</span><span className="tl"> Collapse</span></>}
          </button>
          <button className="lb" onClick={logout}><span className="nl">Log Out</span><span className="nt">Log Out</span></button>
        </div>
      </aside>

      <div className={`main ${collapsed ? 'c' : ''}`}>
        <div className="tb2">
          <div className="bc">
            <span style={{ textTransform: 'capitalize' }}>{orgName}</span>
            <span style={{ color: '#2c2a42' }}>/</span>
            <span className="bc-c">{NAV.find(n => isActive(n.path))?.label ?? 'Admin'}</span>
          </div>
          <div className="lv"><span className="lvd" />Live</div>
        </div>
        <div className="ct">{children}</div>
      </div>
    </div>
  )
}
