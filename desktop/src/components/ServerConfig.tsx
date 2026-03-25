import { useState } from 'react'
import { X, Server, Check } from 'lucide-react'

interface Props {
  current: string
  onSave: (url: string) => void
  onClose: () => void
}

const PRESETS = [
  { label: 'Stark Net (Production)', url: 'https://stark.net.tr' },
  { label: 'Local Dev', url: 'http://localhost:5000' },
]

export default function ServerConfig({ current, onSave, onClose }: Props) {
  const [url, setUrl] = useState(current)

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}>
      <div className="w-full max-w-sm overflow-hidden rounded-xl shadow-2xl"
        style={{ background: 'var(--modal-bg)', border: '1px solid var(--modal-border)' }}>

        <div className="px-5 py-3.5 flex items-center justify-between"
          style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-panel)' }}>
          <div className="flex items-center gap-2">
            <Server size={14} style={{ color: 'var(--text-accent)' }} />
            <span className="text-sm font-bold tracking-wider" style={{ color: 'var(--text-accent)' }}>SERVER CONFIG</span>
          </div>
          <button onClick={onClose} className="p-1.5 rounded transition-colors" style={{ color: 'var(--text-muted)' }}><X size={16} /></button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="block text-[9px] tracking-widest uppercase mb-2" style={{ color: 'var(--text-muted)' }}>
              Backend URL
            </label>
            <input
              type="text"
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="https://stark.net.tr"
              className="w-full py-2.5 px-4 text-sm rounded-lg focus:outline-none transition-colors"
              style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
            />
          </div>

          <div>
            <div className="text-[9px] tracking-widest uppercase mb-2" style={{ color: 'var(--text-muted)' }}>Presets</div>
            <div className="space-y-1.5">
              {PRESETS.map(p => (
                <button key={p.url} onClick={() => setUrl(p.url)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-all"
                  style={{
                    background: url === p.url ? 'var(--accent-bg)' : 'var(--bg-panel)',
                    border: `1px solid ${url === p.url ? 'var(--border-accent)' : 'var(--border)'}`,
                    color: url === p.url ? 'var(--text-accent)' : 'var(--text-secondary)',
                  }}>
                  <span>{p.label}</span>
                  {url === p.url && <Check size={12} />}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <button onClick={onClose} className="flex-1 py-2.5 text-xs tracking-widest rounded-lg transition-colors"
              style={{ color: 'var(--text-muted)' }}>CANCEL</button>
            <button onClick={() => onSave(url.replace(/\/$/, ''))}
              className="flex-1 py-2.5 text-xs tracking-widest uppercase rounded-lg transition-all"
              style={{ background: 'var(--accent-bg)', border: '1px solid var(--border-accent)', color: 'var(--text-accent)' }}>
              SAVE & RECONNECT
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
