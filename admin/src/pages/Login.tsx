import { useState, useEffect } from 'react'
import axios from 'axios'
import { Lock, AlertTriangle, Eye, EyeOff, Folder } from 'lucide-react'

const API_URL = window.location.hostname === 'localhost' ? 'http://localhost:5000' : ''

const BOOT_LINES = [
  'STARK INDUSTRIES MAINFRAME v7.3.1',
  'Initializing secure connection...',
  'Loading encryption protocols...',
  'Authentication module: READY',
  '> Awaiting credentials...',
]

export default function Login({ onLogin }: { onLogin: (token: string, user: any) => void }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [bootLines, setBootLines] = useState<string[]>([])
  const [booting, setBooting] = useState(true)

  useEffect(() => {
    let i = 0
    const interval = setInterval(() => {
      if (i < BOOT_LINES.length) { setBootLines(prev => [...prev, BOOT_LINES[i]]); i++ }
      else { clearInterval(interval); setTimeout(() => setBooting(false), 400) }
    }, 260)
    return () => clearInterval(interval)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      const res = await axios.post(`${API_URL}/api/auth/login`, { username, password })
      if (res.data.user.role !== 'ADMIN') {
        setError('ACCESS DENIED — INSUFFICIENT CLEARANCE LEVEL')
        setLoading(false); return
      }
      onLogin(res.data.token, res.data.user)
    } catch { setError('AUTHENTICATION FAILED — INVALID CREDENTIALS') }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden si-grid-bg"
      style={{ background: 'linear-gradient(135deg, #b8c4ce 0%, #c8d4dc 40%, #d0d8e0 100%)' }}>

      {/* Ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(0,180,200,0.06) 0%, transparent 70%)' }} />

      <div className="w-full max-w-md relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Folder size={20} className="text-teal-600/60" strokeWidth={1.5} />
            <span className="text-[10px] text-slate-400 tracking-[0.4em] uppercase">Stark Industries</span>
          </div>
          <div className="text-slate-700 text-2xl font-bold tracking-widest uppercase">MAINFRAME ACCESS</div>
          <div className="text-[9px] text-slate-400 tracking-[0.3em] mt-1">AUTHORIZED PERSONNEL ONLY</div>
        </div>

        {/* Boot terminal */}
        {booting && (
          <div className="si-panel rounded-lg mb-6 p-4">
            <div className="text-[9px] text-slate-400 tracking-widest mb-2 uppercase">System Boot Log</div>
            {bootLines.map((line, i) => (
              <div key={i} className="text-[10px] py-0.5 tracking-wider font-mono">
                {i === bootLines.length - 1
                  ? <span className="text-teal-700">{line}<span className="blink">_</span></span>
                  : <span className="text-slate-400">{line}</span>}
              </div>
            ))}
          </div>
        )}

        {/* Login form */}
        {!booting && (
          <div className="si-panel rounded-lg relative p-6 fade-in">
            <div className="absolute top-0 left-0 w-4 h-4 bracket-tl" />
            <div className="absolute top-0 right-0 w-4 h-4 bracket-tr" />
            <div className="absolute bottom-0 left-0 w-4 h-4 bracket-bl" />
            <div className="absolute bottom-0 right-0 w-4 h-4 bracket-br" />

            <div className="flex items-center gap-2 mb-5">
              <Lock size={12} className="text-teal-600/60" />
              <span className="text-[10px] text-slate-400 tracking-[0.3em] uppercase">Secure Authentication</span>
              <div className="ml-auto w-1.5 h-1.5 rounded-full bg-teal-500 pulse-teal" />
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 mb-4 restricted rounded text-[10px] tracking-wider">
                <AlertTriangle size={12} className="shrink-0" /> {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[9px] text-slate-400 tracking-[0.3em] uppercase mb-2">User Identifier</label>
                <input
                  type="text" value={username} onChange={e => setUsername(e.target.value)}
                  placeholder="Enter username" required autoComplete="off"
                  className="w-full bg-white/40 border border-white/50 rounded-lg py-2.5 px-4 text-slate-700 placeholder-slate-400 focus:outline-none focus:border-teal-400/60 text-sm backdrop-blur-sm transition-colors"
                />
              </div>
              <div>
                <label className="block text-[9px] text-slate-400 tracking-[0.3em] uppercase mb-2">Access Code</label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••" required
                    className="w-full bg-white/40 border border-white/50 rounded-lg py-2.5 pl-4 pr-10 text-slate-700 placeholder-slate-400 focus:outline-none focus:border-teal-400/60 text-sm backdrop-blur-sm transition-colors"
                  />
                  <button type="button" onClick={() => setShowPass(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                    {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading}
                className="w-full py-3 mt-2 bg-teal-500/15 hover:bg-teal-500/25 border border-teal-500/30 hover:border-teal-500/50 text-teal-700 text-sm font-semibold tracking-widest uppercase rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                {loading
                  ? <><span className="w-3.5 h-3.5 border border-teal-500/50 border-t-teal-600 rounded-full animate-spin" /> Authenticating...</>
                  : <><Lock size={13} /> Initiate Access</>}
              </button>
            </form>

            <div className="mt-4 pt-4 border-t border-white/20 text-center">
              <div className="text-[8px] text-slate-400 tracking-widest">ALL ACCESS ATTEMPTS ARE LOGGED AND MONITORED</div>
            </div>
          </div>
        )}

        <div className="text-center mt-5 text-[8px] text-slate-400 tracking-widest">
          STARK INDUSTRIES © 2026 — CONFIDENTIAL
        </div>
      </div>
    </div>
  )
}
