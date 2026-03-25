import React, { useState } from 'react';
import axios from 'axios';
import { X, Hash, Volume2, AlertTriangle } from 'lucide-react';

interface Props { token: string; onClose: () => void; onSaved: () => void; editChannel?: { id: string; name: string; type: string }; dark?: boolean; }

export default function ChannelModal({ token, onClose, onSaved, editChannel }: Props) {
  const [name, setName] = useState(editChannel?.name ?? '');
  const [type, setType] = useState(editChannel?.type ?? 'TEXT');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const API_URL = window.location.hostname === 'localhost' ? 'http://localhost:5000' : '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || name.includes(' ')) { setError('No spaces allowed in channel name.'); return; }
    setLoading(true); setError('');
    try {
      if (editChannel) {
        await axios.put(`${API_URL}/api/chat/channels/${editChannel.id}`, { name }, { headers: { Authorization: `Bearer ${token}` } });
      } else {
        await axios.post(`${API_URL}/api/chat/channels`, { name, type }, { headers: { Authorization: `Bearer ${token}` } });
      }
      onSaved();
    } catch (err: any) { setError(err.response?.data?.error || 'Operation failed.'); }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}>
      <div className="w-full max-w-sm overflow-hidden rounded-xl shadow-2xl"
        style={{ background: 'var(--modal-bg)', border: '1px solid var(--modal-border)' }}>

        <div className="px-5 py-3.5 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-panel)' }}>
          <div>
            <div className="text-[9px] tracking-widest mb-0.5" style={{ color: 'var(--text-muted)' }}>COMM NETWORK</div>
            <div className="text-sm font-bold tracking-wider" style={{ color: 'var(--text-accent)' }}>{editChannel ? 'EDIT CHANNEL' : 'NEW CHANNEL'}</div>
          </div>
          <button onClick={onClose} className="p-1.5 transition-colors rounded" style={{ color: 'var(--text-muted)' }}><X size={16} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && <div className="flex items-center gap-2 p-3 text-xs text-red-400 bg-red-900/20 border border-red-500/20 rounded"><AlertTriangle size={12} />{error}</div>}

          {!editChannel && (
            <div>
              <label className="block text-[9px] tracking-widest uppercase mb-2" style={{ color: 'var(--text-muted)' }}>Channel Type</label>
              <div className="flex gap-2">
                {(['TEXT', 'VOICE'] as const).map(t => (
                  <button key={t} type="button" onClick={() => setType(t)}
                    className="flex-1 py-2.5 flex items-center justify-center gap-2 text-xs transition-all rounded-lg"
                    style={{ background: type === t ? 'var(--accent-bg)' : 'var(--bg-panel)', border: `1px solid ${type === t ? 'var(--border-accent)' : 'var(--border)'}`, color: type === t ? 'var(--text-accent)' : 'var(--text-muted)' }}>
                    {t === 'TEXT' ? <Hash size={13} /> : <Volume2 size={13} />} {t}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-[9px] tracking-widest uppercase mb-2" style={{ color: 'var(--text-muted)' }}>Channel Name</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }}>
                {type === 'TEXT' ? <Hash size={13} /> : <Volume2 size={13} />}
              </span>
              <input type="text" value={name} onChange={e => setName(e.target.value.toLowerCase().replace(/\s/g, '-'))}
                placeholder="channel-name" required
                className="w-full py-2.5 pl-9 pr-4 text-sm rounded-lg focus:outline-none transition-colors"
                style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text-primary)' }} />
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 text-xs tracking-widest transition-colors rounded-lg"
              style={{ color: 'var(--text-muted)' }}>CANCEL</button>
            <button disabled={loading} className="flex-1 py-2.5 text-xs tracking-widest uppercase transition-all disabled:opacity-50 rounded-lg"
              style={{ background: 'var(--accent-bg)', border: '1px solid var(--border-accent)', color: 'var(--text-accent)' }}>
              {editChannel ? 'SAVE' : 'CREATE'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
