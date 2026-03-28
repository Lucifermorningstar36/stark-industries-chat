import { useState } from 'react'
import { AlertTriangle, Shield, Zap, Globe } from 'lucide-react'

const THREATS = [
  { id: 1, title: 'Military buildup detected near disputed border', region: 'Eastern Europe', level: 'CRITICAL', icon: '⚔️', time: '3m ago', details: 'Satellite imagery confirms increased armored vehicle movement along the northern corridor.' },
  { id: 2, title: 'Cyberattack targeting financial infrastructure', region: 'Global', level: 'HIGH', icon: '💻', time: '7m ago', details: 'Multiple banking systems report DDoS attacks originating from coordinated botnet.' },
  { id: 3, title: 'Naval vessels entering contested waters', region: 'South China Sea', level: 'HIGH', icon: '🚢', time: '12m ago', details: 'Three destroyers and support vessels detected crossing the median line.' },
  { id: 4, title: 'Diplomatic expulsion of ambassadors', region: 'Middle East', level: 'MEDIUM', icon: '🏛️', time: '18m ago', details: 'Two nations recall ambassadors following disputed territorial claims.' },
  { id: 5, title: 'Energy infrastructure under surveillance', region: 'North Sea', level: 'MEDIUM', icon: '⚡', time: '25m ago', details: 'Unidentified vessels observed near undersea pipeline routes.' },
  { id: 6, title: 'Protest movements escalating in capital', region: 'South America', level: 'LOW', icon: '📢', time: '32m ago', details: 'Large-scale demonstrations reported, security forces on standby.' },
]

const LEVEL_COLORS: Record<string, string> = {
  CRITICAL: '#f87171',
  HIGH: '#f59e0b',
  MEDIUM: '#60a5fa',
  LOW: '#34d399',
}

export default function ThreatPanel() {
  const [selected, setSelected] = useState<number | null>(null)

  return (
    <div className="h-full flex flex-col p-4 overflow-hidden">
      <div className="flex items-center gap-2 mb-4 shrink-0">
        <Shield size={14} className="text-red-400" />
        <span className="text-[10px] font-mono tracking-widest text-red-300">THREAT ASSESSMENT</span>
        <div className="ml-auto flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
          <span className="text-[8px] text-red-400/60 font-mono">{THREATS.length} ACTIVE</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2">
        {THREATS.map(t => (
          <div key={t.id} onClick={() => setSelected(selected === t.id ? null : t.id)}
            className="p-3 rounded-lg cursor-pointer transition-all"
            style={{
              background: selected === t.id ? `${LEVEL_COLORS[t.level]}10` : 'rgba(59,130,246,0.04)',
              border: `1px solid ${selected === t.id ? `${LEVEL_COLORS[t.level]}40` : 'rgba(59,130,246,0.1)'}`,
            }}>
            <div className="flex items-start gap-3">
              <span className="text-lg shrink-0">{t.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[8px] font-bold px-1.5 py-0.5 rounded"
                    style={{ background: `${LEVEL_COLORS[t.level]}20`, color: LEVEL_COLORS[t.level], border: `1px solid ${LEVEL_COLORS[t.level]}40` }}>
                    {t.level}
                  </span>
                  <span className="text-[8px] text-blue-400/30">{t.region}</span>
                  <span className="text-[8px] text-blue-400/20 ml-auto">{t.time}</span>
                </div>
                <div className="text-[10px] text-blue-100/80">{t.title}</div>
                {selected === t.id && (
                  <div className="mt-2 text-[9px] text-blue-400/50 leading-relaxed border-t border-blue-500/10 pt-2">
                    {t.details}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
