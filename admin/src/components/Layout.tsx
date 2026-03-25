import { NavLink, useLocation } from 'react-router-dom'
import { LayoutDashboard, Users, Hash, MessageSquare, Box, LogOut, Shield, Folder } from 'lucide-react'

const nav = [
  { to: '/',         icon: LayoutDashboard, label: 'OVERVIEW',     sub: 'sys.dashboard',  tag: 'SYS' },
  { to: '/users',    icon: Users,           label: 'PERSONNEL',    sub: 'sys.users',       tag: 'USR' },
  { to: '/channels', icon: Hash,            label: 'CHANNELS',     sub: 'sys.comms',       tag: 'COM' },
  { to: '/messages', icon: MessageSquare,   label: 'MESSAGE LOG',  sub: 'sys.archive',     tag: 'LOG' },
  { to: '/3d',       icon: Box,             label: 'HOLOGRAPHICS', sub: 'sys.3d',          tag: '3D'  },
]

export default function Layout({ admin, onLogout, children }: { admin: any; onLogout: () => void; children: React.ReactNode }) {
  const location = useLocation()
  const is3D = location.pathname === '/3d'
  return (
    <div className="flex h-screen overflow-hidden si-grid-bg" style={{ background: is3D ? '#020409' : 'linear-gradient(135deg, #b8c4ce 0%, #c8d4dc 40%, #d0d8e0 100%)' }}>
      <div className="scanline" />

      {/* ── SIDEBAR ── */}
      <aside className={`w-64 shrink-0 flex flex-col relative overflow-hidden transition-all ${is3D ? 'bg-[#020409]/80 border-r border-blue-900/30 backdrop-blur-sm' : 'sidebar-glass'}`}>

        {/* Logo area */}
        <div className={`px-5 py-5 border-b ${is3D ? 'border-blue-900/30' : 'border-white/30'}`}>
          <div className="flex items-center gap-2 mb-1">
            <div className={`w-2 h-2 rounded-full ${is3D ? 'bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.8)]' : 'bg-teal-500 pulse-teal'}`} />
            <span className={`text-[9px] tracking-[0.3em] uppercase font-medium ${is3D ? 'text-blue-400/50' : 'text-slate-500'}`}>Stark Industries</span>
          </div>
          <div className={`font-bold text-base tracking-widest uppercase ${is3D ? 'text-blue-300' : 'text-slate-700'}`}>S.I. MAINFRAME</div>
          <div className={`text-[9px] tracking-widest mt-0.5 ${is3D ? 'text-blue-500/40' : 'text-slate-400'}`}>RESTRICTED — LEVEL 7</div>
        </div>

        {/* System status mini */}
        <div className={`px-5 py-3 border-b ${is3D ? 'border-blue-900/30' : 'border-white/20'}`}>
          <div className={`text-[9px] tracking-widest mb-2 uppercase ${is3D ? 'text-blue-400/40' : 'text-slate-400'}`}>System Status</div>
          {[
            { label: 'MAINFRAME',  ok: true },
            { label: 'ENCRYPTION', ok: true },
            { label: 'FIREWALL',   ok: true },
          ].map(s => (
            <div key={s.label} className="flex items-center justify-between py-0.5">
              <span className={`text-[9px] tracking-wider ${is3D ? 'text-blue-400/30' : 'text-slate-500'}`}>{s.label}</span>
              <span className={`text-[9px] font-bold tracking-wider ${is3D ? 'text-blue-400' : 'text-teal-600'}`}>ONLINE</span>
            </div>
          ))}
        </div>

        {/* File-list nav — mimics the movie file list */}
        <nav className="flex-1 overflow-y-auto">
          <div className={`text-[9px] tracking-[0.3em] px-5 py-3 uppercase border-b ${is3D ? 'text-blue-400/40 border-blue-900/30' : 'text-slate-400 border-white/10'}`}>Directory</div>
          {nav.map(({ to, icon: Icon, label, sub, tag }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 transition-all duration-150 border-l-2 cursor-pointer ${
                  isActive
                    ? is3D
                      ? 'border-blue-400 bg-blue-500/10 text-blue-300'
                      : 'nav-active'
                    : is3D
                      ? 'border-transparent text-blue-400/40 hover:bg-blue-500/5 hover:text-blue-300'
                      : 'border-transparent text-slate-500 hover:bg-white/20 hover:text-slate-700 file-row'
                }`
              }
            >
              <div className="w-7 h-7 flex items-center justify-center shrink-0">
                <Folder size={18} className={is3D ? 'text-blue-400/40' : 'text-slate-400'} strokeWidth={1.5} />
              </div>
              <div className="flex-1 min-w-0">
                <div className={`text-xs font-semibold tracking-wide truncate ${is3D ? 'text-blue-300/70' : 'text-slate-600'}`}>{label}</div>
                <div className={`text-[9px] tracking-wider truncate ${is3D ? 'text-blue-400/30' : 'text-slate-400'}`}>{sub}</div>
              </div>
              <span className={`text-[8px] font-bold tracking-widest px-1.5 py-0.5 shrink-0 ${is3D ? 'bg-blue-500/10 text-blue-400/60 border border-blue-500/20' : 'tag-teal'}`}>{tag}</span>
            </NavLink>
          ))}
        </nav>

        {/* User card */}
        <div className={`p-4 border-t ${is3D ? 'border-blue-900/30' : 'border-white/30'}`}>
          <div className={`rounded-lg p-3 mb-3 ${is3D ? 'bg-blue-500/5 border border-blue-500/15' : 'si-panel'}`}>
            <div className={`text-[9px] tracking-widest mb-1.5 uppercase ${is3D ? 'text-blue-400/40' : 'text-slate-400'}`}>Authenticated</div>
            <div className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${is3D ? 'bg-blue-500/20 border border-blue-500/40 text-blue-300' : 'bg-teal-500/20 border border-teal-500/40 text-teal-700'}`}>
                {admin?.username?.[0]?.toUpperCase()}
              </div>
              <div>
                <div className={`text-xs font-bold tracking-wide ${is3D ? 'text-blue-300' : 'text-slate-700'}`}>{admin?.username?.toUpperCase()}</div>
                <div className={`flex items-center gap-1 text-[9px] ${is3D ? 'text-blue-400/40' : 'text-slate-400'}`}>
                  <Shield size={8} className={is3D ? 'text-blue-400' : 'text-teal-500'} /> CLEARANCE LVL 7
                </div>
              </div>
            </div>
          </div>
          <button
            onClick={onLogout}
            className={`w-full flex items-center justify-center gap-2 py-2 text-[10px] rounded transition-all tracking-widest ${is3D ? 'text-blue-400/30 hover:text-red-400 border border-blue-900/30 hover:border-red-500/20 hover:bg-red-500/5' : 'text-slate-500 hover:text-red-500 hover:bg-red-50/30 border border-white/30 hover:border-red-300/40'}`}
          >
            <LogOut size={12} /> TERMINATE SESSION
          </button>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <main className="flex-1 overflow-y-auto relative">
        {/* Top bar */}
        <div className={`sticky top-0 z-10 flex items-center justify-between px-8 py-2.5 border-b ${is3D ? 'border-blue-900/30 bg-[#020409]/80 backdrop-blur-sm' : 'border-white/30 si-panel'}`}>
          <div className="flex items-center gap-3">
            <div className={`w-1.5 h-1.5 rounded-full ${is3D ? 'bg-blue-400 shadow-[0_0_6px_rgba(96,165,250,0.8)]' : 'bg-teal-500 pulse-teal'}`} />
            <span className={`text-[9px] tracking-[0.2em] uppercase ${is3D ? 'text-blue-400/40' : 'text-slate-400'}`}>
              Stark Industries Proprietary System — Unauthorized Access Prohibited
            </span>
          </div>
          <div className={`text-[9px] tracking-wider ${is3D ? 'text-blue-400/30' : 'text-slate-400'}`}>
            {new Date().toISOString().replace('T', ' ').slice(0, 19)} UTC
          </div>
        </div>
        {children}
      </main>
    </div>
  )
}
