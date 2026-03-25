import React, { useState } from 'react';
import axios from 'axios';
import { X, Shield, Calendar, User, MessageCircle, AlertTriangle } from 'lucide-react';

interface Props { token: string; currentUser: any; targetUser: any; onClose: () => void; onRoleUpdated: () => void; onDMClick?: (targetUser: any) => void; dark?: boolean; }

export default function UserProfileModal({ token, currentUser, targetUser, onClose, onRoleUpdated, onDMClick }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const API_URL = window.location.hostname === 'localhost' ? 'http://localhost:5000' : '';

  const handleRoleChange = async (newRole: 'ADMIN' | 'USER') => {
    setError(''); setLoading(true);
    try {
      await axios.put(`${API_URL}/api/auth/users/${targetUser.id}/role`, { role: newRole }, { headers: { Authorization: `Bearer ${token}` } });
      onRoleUpdated();
    } catch (err: any) { setError(err.response?.data?.error || 'Failed to update role'); }
    setLoading(false);
  };

  const joinDate = targetUser.createdAt ? new Date(targetUser.createdAt).toLocaleDateString() : 'Unknown';

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }} onClick={onClose}>
      <div className="w-full max-w-sm overflow-hidden rounded-xl shadow-2xl"
        style={{ background: 'var(--modal-bg)', border: '1px solid var(--modal-border)' }} onClick={e => e.stopPropagation()}>

        {/* Header strip */}
        <div className="h-20 relative flex items-end px-5 pb-3"
          style={{ background: 'var(--bg-panel)', borderBottom: '1px solid var(--border)' }}>
          <div className="text-[9px] tracking-[0.3em] absolute top-3 left-5" style={{ color: 'var(--text-muted)' }}>STARK INDUSTRIES // PERSONNEL FILE</div>
          <button onClick={onClose} className="absolute top-2 right-2 p-1.5 transition-colors rounded" style={{ color: 'var(--text-muted)' }}><X size={15} /></button>
        </div>

        {/* Avatar + name */}
        <div className="px-5 pb-4 relative" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="absolute -top-10 left-5 w-20 h-20 overflow-hidden rounded-lg"
            style={{ border: '2px solid var(--border-accent)', background: 'var(--bg-base)' }}>
            {targetUser.avatarUrl
              ? <img src={targetUser.avatarUrl} alt="" className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center text-2xl font-bold" style={{ color: 'var(--text-accent)' }}>{targetUser.username[0].toUpperCase()}</div>}
          </div>
          <div className="pt-12 flex items-center justify-between">
            <div>
              <div className="font-bold text-base flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                {targetUser.username}
                {targetUser.role === 'ADMIN' && <Shield size={13} style={{ color: 'var(--text-accent)' }} />}
              </div>
              <div className="text-[9px] tracking-widest mt-0.5" style={{ color: 'var(--text-muted)' }}>{targetUser.role === 'ADMIN' ? 'DIRECTOR' : 'AGENT'}</div>
            </div>
            {targetUser.role === 'ADMIN' && (
              <span className="px-2 py-0.5 text-[9px] font-bold tracking-widest rounded"
                style={{ background: 'var(--accent-bg)', color: 'var(--text-accent)', border: '1px solid var(--border-accent)' }}>CLEARANCE LVL 7</span>
            )}
          </div>
        </div>

        <div className="p-5 space-y-3">
          {error && <div className="flex items-center gap-2 p-3 text-xs text-red-400 bg-red-900/20 border border-red-500/20 rounded"><AlertTriangle size={12} />{error}</div>}

          <div className="si-panel p-3 space-y-2 rounded-lg">
            <div className="text-[9px] tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>AGENT DATA</div>
            <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
              <Calendar size={12} style={{ color: 'var(--text-muted)' }} />
              Enrolled: <span style={{ color: 'var(--text-accent)' }}>{joinDate}</span>
            </div>
          </div>

          {currentUser.id !== targetUser.id && onDMClick && (
            <button onClick={() => { onDMClick(targetUser); onClose(); }}
              className="w-full py-2.5 text-xs tracking-widest uppercase transition-all flex items-center justify-center gap-2 rounded-lg"
              style={{ background: 'var(--accent-bg)', border: '1px solid var(--border-accent)', color: 'var(--text-accent)' }}>
              <MessageCircle size={13} /> SEND TRANSMISSION
            </button>
          )}

          {currentUser.role === 'ADMIN' && currentUser.id !== targetUser.id && (
            <div className="pt-1">
              <div className="text-[9px] tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>DIRECTOR CONTROLS</div>
              {targetUser.role === 'USER' ? (
                <button disabled={loading} onClick={() => handleRoleChange('ADMIN')}
                  className="w-full py-2.5 text-xs tracking-widest uppercase transition-all flex items-center justify-center gap-2 disabled:opacity-50 rounded-lg"
                  style={{ background: 'var(--accent-bg)', border: '1px solid var(--border-accent)', color: 'var(--text-accent)' }}>
                  <Shield size={13} /> PROMOTE TO DIRECTOR
                </button>
              ) : (
                <button disabled={loading} onClick={() => handleRoleChange('USER')}
                  className="w-full py-2.5 text-xs tracking-widest uppercase transition-all flex items-center justify-center gap-2 disabled:opacity-50 rounded-lg"
                  style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171' }}>
                  <User size={13} /> REVOKE CLEARANCE
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
