import { useState, useEffect } from 'react'
import Header from './components/Header'
import WorldMap from './components/WorldMap'
import NewsPanel from './components/NewsPanel'
import MarketsPanel from './components/MarketsPanel'
import StatusBar from './components/StatusBar'
import ThreatPanel from './components/ThreatPanel'

export type Tab = 'world' | 'markets' | 'threats' | 'intel'

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('world')
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: '#020409' }}>
      <div className="scanline" />
      <Header time={time} activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="flex flex-1 overflow-hidden">
        {/* Left panel — News */}
        <div className="w-80 shrink-0 flex flex-col overflow-hidden" style={{ borderRight: '1px solid rgba(59,130,246,0.15)' }}>
          <NewsPanel />
        </div>

        {/* Center — Map */}
        <div className="flex-1 relative overflow-hidden">
          {activeTab === 'world' && <WorldMap />}
          {activeTab === 'markets' && <MarketsPanel />}
          {activeTab === 'threats' && <ThreatPanel />}
          {activeTab === 'intel' && <IntelPanel />}
        </div>

        {/* Right panel — Stats */}
        <div className="w-72 shrink-0 flex flex-col overflow-hidden" style={{ borderLeft: '1px solid rgba(59,130,246,0.15)' }}>
          <RightPanel />
        </div>
      </div>

      <StatusBar time={time} />
    </div>
  )
}

function IntelPanel() {
  return (
    <div className="h-full flex items-center justify-center">
      <div className="text-center space-y-3">
        <div className="text-4xl">🛰️</div>
        <div className="text-blue-400/60 font-mono text-sm tracking-widest">INTELLIGENCE MODULE</div>
        <div className="text-blue-400/30 font-mono text-xs">COMING SOON</div>
      </div>
    </div>
  )
}

function RightPanel() {
  const [defcon] = useState(4)
  const [alerts] = useState([
    { level: 'HIGH', text: 'Geopolitical tension elevated', region: 'Middle East', color: '#f87171' },
    { level: 'MED', text: 'Market volatility detected', region: 'Global', color: '#f59e0b' },
    { level: 'LOW', text: 'Cyber activity monitoring', region: 'Eastern Europe', color: '#34d399' },
    { level: 'INFO', text: 'Diplomatic talks ongoing', region: 'Asia Pacific', color: '#60a5fa' },
  ])

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* DEFCON */}
      <div className="p-4 shrink-0" style={{ borderBottom: '1px solid rgba(59,130,246,0.15)' }}>
        <div className="text-[9px] tracking-widest text-blue-400/40 uppercase mb-3">Threat Level</div>
        <div className="flex items-center gap-3">
          <div className="text-3xl font-black" style={{ color: defcon <= 2 ? '#f87171' : defcon === 3 ? '#f59e0b' : '#34d399' }}>
            DEFCON {defcon}
          </div>
          <div className="flex gap-1">
            {[1,2,3,4,5].map(n => (
              <div key={n} className="w-3 h-6 rounded-sm transition-all"
                style={{ background: n <= defcon ? (defcon <= 2 ? '#f87171' : defcon === 3 ? '#f59e0b' : '#34d399') : 'rgba(59,130,246,0.1)', opacity: n <= defcon ? 1 : 0.3 }} />
            ))}
          </div>
        </div>
        <div className="text-[9px] text-blue-400/30 mt-1 font-mono">
          {defcon === 5 ? 'PEACETIME' : defcon === 4 ? 'NORMAL READINESS' : defcon === 3 ? 'INCREASED READINESS' : defcon === 2 ? 'ARMED FORCES READY' : 'MAXIMUM READINESS'}
        </div>
      </div>

      {/* Active Alerts */}
      <div className="p-4 flex-1 overflow-y-auto">
        <div className="text-[9px] tracking-widest text-blue-400/40 uppercase mb-3">Active Alerts</div>
        <div className="space-y-2">
          {alerts.map((a, i) => (
            <div key={i} className="p-3 rounded-lg" style={{ background: 'rgba(59,130,246,0.04)', border: '1px solid rgba(59,130,246,0.1)' }}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[8px] font-bold px-1.5 py-0.5 rounded" style={{ background: `${a.color}20`, color: a.color, border: `1px solid ${a.color}40` }}>{a.level}</span>
                <span className="text-[9px] text-blue-400/40">{a.region}</span>
              </div>
              <div className="text-[10px] text-blue-200/70">{a.text}</div>
            </div>
          ))}
        </div>
      </div>

      {/* System Status */}
      <div className="p-4 shrink-0" style={{ borderTop: '1px solid rgba(59,130,246,0.15)' }}>
        <div className="text-[9px] tracking-widest text-blue-400/40 uppercase mb-2">System Status</div>
        {[
          { label: 'MAINFRAME', ok: true },
          { label: 'ENCRYPTION', ok: true },
          { label: 'SATELLITE LINK', ok: true },
          { label: 'INTEL FEED', ok: true },
        ].map(s => (
          <div key={s.label} className="flex items-center justify-between py-0.5">
            <span className="text-[9px] text-blue-400/30">{s.label}</span>
            <span className="text-[9px] font-bold" style={{ color: s.ok ? '#34d399' : '#f87171' }}>{s.ok ? 'ONLINE' : 'OFFLINE'}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
