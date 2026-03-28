import { Globe, TrendingUp, Shield, Cpu, RefreshCw } from 'lucide-react'
import type { Tab } from '../App'

interface Props {
  time: Date
  activeTab: Tab
  onTabChange: (t: Tab) => void
}

const TABS: { id: Tab; icon: any; label: string }[] = [
  { id: 'world',   icon: Globe,       label: 'WORLD MAP' },
  { id: 'markets', icon: TrendingUp,  label: 'MARKETS' },
  { id: 'threats', icon: Shield,      label: 'THREATS' },
  { id: 'intel',   icon: Cpu,         label: 'INTEL' },
]

export default function Header({ time, activeTab, onTabChange }: Props) {
  return (
    <div className="shrink-0 flex items-center justify-between px-4 py-2.5 z-10"
      style={{ borderBottom: '1px solid rgba(59,130,246,0.2)', background: 'rgba(2,4,9,0.95)', backdropFilter: 'blur(10px)' }}>

      {/* Logo */}
      <div className="flex items-center gap-3">
        <svg width="28" height="28" viewBox="0 0 40 40" fill="none">
          <circle cx="20" cy="20" r="18.5" stroke="#06b6d4" strokeWidth="1.5" opacity="0.7"/>
          <circle cx="20" cy="20" r="12" stroke="#06b6d4" strokeWidth="1" opacity="0.5"/>
          <circle cx="20" cy="20" r="3.5" fill="#06b6d4" opacity="0.9"/>
          <line x1="20" y1="1" x2="20" y2="7" stroke="#06b6d4" strokeWidth="2" strokeLinecap="round"/>
          <line x1="20" y1="33" x2="20" y2="39" stroke="#06b6d4" strokeWidth="2" strokeLinecap="round"/>
          <line x1="1" y1="20" x2="7" y2="20" stroke="#06b6d4" strokeWidth="2" strokeLinecap="round"/>
          <line x1="33" y1="20" x2="39" y2="20" stroke="#06b6d4" strokeWidth="2" strokeLinecap="round"/>
        </svg>
        <div>
          <div className="text-sm font-black tracking-widest uppercase text-cyan-300">STARK INTEL</div>
          <div className="text-[8px] tracking-widest text-blue-400/40">GLOBAL INTELLIGENCE DASHBOARD</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1">
        {TABS.map(({ id, icon: Icon, label }) => (
          <button key={id} onClick={() => onTabChange(id)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-mono tracking-wider transition-all"
            style={{
              background: activeTab === id ? 'rgba(6,182,212,0.15)' : 'transparent',
              border: `1px solid ${activeTab === id ? 'rgba(6,182,212,0.4)' : 'rgba(59,130,246,0.15)'}`,
              color: activeTab === id ? '#06b6d4' : 'rgba(96,165,250,0.5)',
            }}>
            <Icon size={11} />
            {label}
          </button>
        ))}
      </div>

      {/* Time + Status */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          <span className="text-[9px] text-green-400/70 font-mono tracking-widest">LIVE</span>
        </div>
        <div className="text-[10px] font-mono text-blue-400/50">
          {time.toUTCString().slice(0, -4)} UTC
        </div>
        <button className="p-1.5 transition-colors" style={{ color: 'rgba(96,165,250,0.4)', border: '1px solid rgba(59,130,246,0.15)' }}
          onClick={() => window.location.reload()}>
          <RefreshCw size={11} />
        </button>
      </div>
    </div>
  )
}
