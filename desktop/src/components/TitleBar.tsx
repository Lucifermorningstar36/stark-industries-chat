import { useState, useEffect } from 'react'
import { Minus, Square, X, Sun, Moon, Server, Maximize2 } from 'lucide-react'

interface Props {
  dark: boolean
  onToggleTheme: () => void
  onOpenServerConfig: () => void
}

export default function TitleBar({ dark, onToggleTheme, onOpenServerConfig }: Props) {
  const [maximized, setMaximized] = useState(false)
  const api = window.electronAPI!

  useEffect(() => {
    api.isMaximized().then(setMaximized)
  }, [])

  const handleMaximize = async () => {
    api.maximize()
    setTimeout(async () => setMaximized(await api.isMaximized()), 100)
  }

  return (
    <div
      className="h-9 flex items-center justify-between select-none shrink-0 px-3"
      style={{
        background: 'var(--header-bg)',
        borderBottom: '1px solid var(--border)',
        WebkitAppRegion: 'drag',
      } as React.CSSProperties}
    >
      {/* Left — logo */}
      <div className="flex items-center gap-2" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
        <div className="w-2 h-2 rounded-full pulse-teal" style={{ background: 'var(--accent)' }} />
        <span className="text-[10px] font-bold tracking-widest uppercase" style={{ color: 'var(--text-accent)' }}>
          STARK NET
        </span>
      </div>

      {/* Center — draggable area (title) */}
      <span className="text-[9px] tracking-widest" style={{ color: 'var(--text-muted)' }}>
        STARK INDUSTRIES SECURE COMM
      </span>

      {/* Right — controls */}
      <div className="flex items-center gap-1" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
        <button onClick={onOpenServerConfig} className="titlebar-btn" title="Server Config">
          <Server size={12} />
        </button>
        <button onClick={onToggleTheme} className="titlebar-btn" title="Toggle theme">
          {dark ? <Sun size={12} /> : <Moon size={12} />}
        </button>
        <div className="w-px h-4 mx-1" style={{ background: 'var(--border)' }} />
        <button onClick={() => api.minimize()} className="titlebar-btn" title="Minimize">
          <Minus size={12} />
        </button>
        <button onClick={handleMaximize} className="titlebar-btn" title="Maximize">
          {maximized ? <Maximize2 size={11} /> : <Square size={11} />}
        </button>
        <button onClick={() => api.close()} className="titlebar-btn titlebar-close" title="Close">
          <X size={12} />
        </button>
      </div>
    </div>
  )
}
