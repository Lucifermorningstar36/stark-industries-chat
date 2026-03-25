import React, { useState } from 'react';
import axios from 'axios';
import { X, User, Lock, Save, AlertTriangle } from 'lucide-react';

interface Props { token: string; user: any; onClose: () => void; onUpdateUser: (user: any) => void; dark?: boolean; }

export default function SettingsModal({ token, user, onClose, onUpdateUser }: Props) {
  const [tab, setTab] = useState<'profile' | 'password'>('profile');
  const [username, setUsername] = useState(user.username);
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const API_URL = window.location.hostname === 'localhost' ? 'http://localhost:5000' : '';

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setSuccess(''); setLoading(true);
    try {
      const res = await axios.put(`${API_URL}/api/auth/profile`, { username, avatarUrl }, { headers: { Authorization: `Bearer ${token}` } });
      onUpdateUser({ ...user, username: res.data.username, avatarUrl: res.data.avatarUrl });
      setSuccess('Profile updated.');
    } catch (err: any) { setError(err.response?.data?.error || 'Update failed.'); }
    setLoading(false);
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setSuccess(''); setLoading(true);
    try {
      await axios.put(`${API_URL}/api/auth/password`, { currentPassword, newPassword }, { headers: { Authorization: `Bearer ${token}` } });
      setSuccess('Password updated.'); setCurrentPassword(''); setNewPassword('');
    } catch (err: any) { setError(err.response?.data?.error || 'Update failed.'); }
    setLoading(false);
  };

  const inputCls = "w-full py-2.5 px-4 text-sm rounded-lg focus:outline-none transition-colors";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}>
      <div className="w-full max-w-md overflow-hidden rounded-xl shadow-2xl"
        style={{ background: 'var(--modal-bg)', border: '1px solid var(--modal-border)' }}>

        <div className="px-5 py-3.5 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-panel)' }}>
          <div>
            <div className="text-[9px] tracking-widest mb-0.5" style={{ color: 'var(--text-muted)' }}>STARK INDUSTRIES</div>
            <div className="text-sm font-bold tracking-wider" style={{ color: 'var(--text-accent)' }}>AGENT SETTINGS</div>
          </div>
          <button onClick={onClose} className="p-1.5 transition-colors rounded" style={{ color: 'var(--text-muted)' }}><X size={16} /></button>
        </div>

        <div className="flex" style={{ borderBottom: '1px solid var(--border)' }}>
          {(['profile', 'password'] as const).map(t => (
            <button key={t} onClick={() => { setTab(t); setError(''); setSuccess(''); }}
              className="flex-1 py-2.5 text-xs flex items-center justify-center gap-2 transition-colors"
              style={{ color: tab === t ? 'var(--text-accent)' : 'var(--text-muted)', borderBottom: tab === t ? `2px solid var(--accent)` : '2px solid transparent', background: tab === t ? 'var(--accent-bg)' : 'transparent' }}>
              {t === 'profile' ? <User size={13} /> : <Lock size={13} />} {t.toUpperCase()}
            </button>
          ))}
        </div>

        <div className="p-5 space-y-4">
          {error && <div className="flex items-center gap-2 p-3 text-xs text-red-400 bg-red-900/20 border border-red-500/20 rounded"><AlertTriangle size={12} />{error}</div>}
          {success && <div className="p-3 text-xs text-green-400 bg-green-900/20 border border-green-500/20 rounded">{success}</div>}

          {tab === 'profile' ? (
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="block text-[9px] tracking-widest uppercase mb-1.5" style={{ color: 'var(--text-muted)' }}>Agent ID</label>
                <input type="text" value={username} onChange={e => setUsername(e.target.value)} className={inputCls} required
                  style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text-primary)' }} />
              </div>
              <div>
                <label className="block text-[9px] tracking-widest uppercase mb-1.5" style={{ color: 'var(--text-muted)' }}>Profile Image</label>
                <div className="flex items-center gap-4">
                  {avatarUrl
                    ? <img src={avatarUrl} alt="" className="w-14 h-14 rounded object-cover" style={{ border: '1px solid var(--border-accent)' }} />
                    : <div className="w-14 h-14 rounded flex items-center justify-center" style={{ border: '1px solid var(--border)', background: 'var(--bg-panel)', color: 'var(--text-muted)' }}><User size={20} /></div>}
                  <input type="file" accept="image/*" onChange={e => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    if (file.size > 2 * 1024 * 1024) { setError('Max 2MB'); return; }
                    const reader = new FileReader();
                    reader.onloadend = () => setAvatarUrl(reader.result as string);
                    reader.readAsDataURL(file);
                  }} className="flex-1 text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:transition-colors"
                    style={{ color: 'var(--text-muted)' }} />
                </div>
              </div>
              <button disabled={loading} className="w-full py-2.5 text-xs tracking-widest uppercase transition-all flex items-center justify-center gap-2 disabled:opacity-50 rounded-lg"
                style={{ background: 'var(--accent-bg)', border: '1px solid var(--border-accent)', color: 'var(--text-accent)' }}>
                <Save size={13} /> SAVE PROFILE
              </button>
            </form>
          ) : (
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div>
                <label className="block text-[9px] tracking-widest uppercase mb-1.5" style={{ color: 'var(--text-muted)' }}>Current Code</label>
                <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className={inputCls} required
                  style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text-primary)' }} />
              </div>
              <div>
                <label className="block text-[9px] tracking-widest uppercase mb-1.5" style={{ color: 'var(--text-muted)' }}>New Code</label>
                <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className={inputCls} required
                  style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text-primary)' }} />
              </div>
              <button disabled={loading} className="w-full py-2.5 text-xs tracking-widest uppercase transition-all flex items-center justify-center gap-2 disabled:opacity-50 rounded-lg"
                style={{ background: 'var(--accent-bg)', border: '1px solid var(--border-accent)', color: 'var(--text-accent)' }}>
                <Save size={13} /> UPDATE CODE
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
