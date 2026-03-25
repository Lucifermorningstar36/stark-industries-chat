import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { LogIn, UserPlus, Shield, AlertTriangle, Sun, Moon, Monitor, Download } from 'lucide-react';

interface LoginProps {
  onLogin: (token: string, user: any) => void;
  dark: boolean;
  onToggleTheme: () => void;
}

const BOOT_LINES = [
  'STARK INDUSTRIES SECURE COMM v4.2.1',
  'Initializing encryption layer...',
  'AES-256 handshake complete.',
  'Loading personnel database...',
  'Awaiting authentication credentials.',
];

export default function Login({ onLogin, dark, onToggleTheme }: LoginProps) {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [bootLines, setBootLines] = useState<string[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    BOOT_LINES.forEach((line, i) => {
      setTimeout(() => {
        setBootLines(prev => [...prev, line]);
        if (i === BOOT_LINES.length - 1) setTimeout(() => setReady(true), 400);
      }, i * 280);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const API_URL = window.location.hostname === 'localhost' ? 'http://localhost:5000' : '';
      const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
      const payload = isRegister ? { username, password, email } : { username, password };
      const { data } = await axios.post(`${API_URL}${endpoint}`, payload);
      onLogin(data.token, data.user);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Connection failed. Check network.');
    }
    setLoading(false);
  };

  const inputCls = "w-full py-2.5 px-4 text-sm rounded-lg focus:outline-none transition-colors backdrop-blur-sm";

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden si-grid-bg"
      style={{ background: 'var(--bg-base)' }}>
      <div className="scanline" />

      {/* Theme toggle — top right */}
      <button onClick={onToggleTheme} className="theme-toggle fixed top-4 right-4 z-50" title={dark ? 'Light mode' : 'Dark mode'}>
        {dark ? <Sun size={14} /> : <Moon size={14} />}
      </button>

      {/* Glow orb */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(0,180,200,0.06) 0%, transparent 70%)' }} />

      <div className="w-full max-w-md relative z-10">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-4 rounded" style={{ border: '1px solid var(--border-accent)', background: 'var(--accent-bg)' }}>
            <AlertTriangle size={10} style={{ color: 'var(--text-accent)' }} />
            <span className="text-[9px] tracking-[0.3em] uppercase" style={{ color: 'var(--text-accent)' }}>Restricted Access — Authorized Personnel Only</span>
          </div>
          <div className="text-3xl font-black tracking-widest uppercase" style={{ color: 'var(--text-accent)' }}>STARK NET</div>
          <div className="text-[10px] tracking-[0.4em] mt-1 uppercase" style={{ color: 'var(--text-muted)' }}>Stark Industries Internal Comm</div>
        </div>

        {/* Boot terminal */}
        <div className="si-panel p-4 mb-4 relative rounded-lg">
          <div className="absolute top-2 left-2 w-3 h-3 bracket-tl" />
          <div className="absolute top-2 right-2 w-3 h-3 bracket-tr" />
          <div className="text-[9px] tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>SYSTEM BOOT LOG</div>
          <div className="space-y-0.5 min-h-[80px]">
            {bootLines.map((line, i) => (
              <div key={i} className="text-[10px] boot-in font-mono"
                style={{ color: i === bootLines.length - 1 ? 'var(--text-accent)' : 'var(--text-muted)' }}>
                {'>'} {line}
                {i === bootLines.length - 1 && !ready && <span className="blink ml-1">_</span>}
              </div>
            ))}
          </div>
        </div>

        {/* Form */}
        {ready && (
          <div className="si-panel relative overflow-hidden boot-in rounded-lg">
            <div className="absolute top-2 left-2 w-3 h-3 bracket-tl" />
            <div className="absolute top-2 right-2 w-3 h-3 bracket-tr" />
            <div className="absolute bottom-2 left-2 w-3 h-3 bracket-bl" />
            <div className="absolute bottom-2 right-2 w-3 h-3 bracket-br" />

            <div className="px-6 pt-5 pb-4 flex items-center gap-2" style={{ borderBottom: '1px solid var(--border)' }}>
              <Shield size={14} style={{ color: 'var(--text-accent)' }} />
              <span className="text-xs tracking-widest uppercase" style={{ color: 'var(--text-secondary)' }}>
                {isRegister ? 'Request Clearance' : 'Identity Verification'}
              </span>
              <div className="ml-auto w-1.5 h-1.5 rounded-full pulse-teal" style={{ background: 'var(--accent)' }} />
            </div>

            <div className="p-6 space-y-4">
              {error && (
                <div className="flex items-center gap-2 p-3 text-xs text-red-400 bg-red-900/20 border border-red-500/20 rounded">
                  <AlertTriangle size={12} /> {error}
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-3">
                {isRegister && (
                  <div>
                    <label className="block text-[9px] tracking-widest uppercase mb-1.5" style={{ color: 'var(--text-muted)' }}>Email Address</label>
                    <input type="email" placeholder="agent@stark.net" required value={email} onChange={e => setEmail(e.target.value)}
                      className={inputCls} style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text-primary)' }} />
                  </div>
                )}
                <div>
                  <label className="block text-[9px] tracking-widest uppercase mb-1.5" style={{ color: 'var(--text-muted)' }}>Agent ID</label>
                  <input type="text" placeholder="username" required value={username} onChange={e => setUsername(e.target.value)}
                    className={inputCls} style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text-primary)' }} />
                </div>
                <div>
                  <label className="block text-[9px] tracking-widest uppercase mb-1.5" style={{ color: 'var(--text-muted)' }}>Access Code</label>
                  <input type="password" placeholder="••••••••" required value={password} onChange={e => setPassword(e.target.value)}
                    className={inputCls} style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text-primary)' }} />
                </div>
                <button type="submit" disabled={loading}
                  className="w-full py-3 text-xs tracking-widest uppercase transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-2 rounded-lg"
                  style={{ background: 'var(--accent-bg)', border: '1px solid var(--border-accent)', color: 'var(--text-accent)' }}>
                  {loading ? <><span className="blink">_</span> AUTHENTICATING...</>
                    : isRegister ? <><UserPlus size={14} /> REQUEST ACCESS</>
                    : <><LogIn size={14} /> AUTHENTICATE</>}
                </button>
              </form>
              <div className="text-center pt-1">
                <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{isRegister ? 'Already cleared?' : 'Need clearance?'}</span>
                <button onClick={() => { setIsRegister(!isRegister); setError(''); }}
                  className="ml-2 text-[10px] transition-colors underline underline-offset-2"
                  style={{ color: 'var(--text-accent)' }}>
                  {isRegister ? 'LOGIN' : 'REGISTER'}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="text-center mt-4 space-y-3">
          {/* Desktop download button */}
          <a
            href="/download"
            className="flex items-center justify-center gap-2.5 w-full py-3 rounded-lg transition-all text-xs font-bold tracking-widest uppercase"
            style={{ background: 'var(--bg-panel)', border: '1px solid var(--border-accent)', color: 'var(--text-accent)' }}
          >
            <Monitor size={14} />
            PC UYGULAMASINI İNDİR
            <Download size={13} />
          </a>
          <span className="block text-[9px] tracking-widest" style={{ color: 'var(--text-muted)' }}>
            STARK INDUSTRIES © 2026 — ALL TRANSMISSIONS MONITORED
          </span>
        </div>
      </div>
    </div>
  );
}
