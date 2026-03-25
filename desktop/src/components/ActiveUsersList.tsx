import React from 'react';
import { MessageCircle, Shield } from 'lucide-react';

interface ActiveUser { id: string; username: string; avatarUrl?: string; }
interface Props {
  activeUsers: ActiveUser[];
  allUsers: ActiveUser[];
  onUserClick: (userId: string) => void;
  onDMClick?: (targetUser: any) => void;
  dark?: boolean;
}

export default function ActiveUsersList({ activeUsers, allUsers, onUserClick, onDMClick }: Props) {
  const uniqueActive = Array.from(new Map(activeUsers.map(u => [u.id, u])).values());
  const offline = allUsers.filter(u => !uniqueActive.find(a => a.id === u.id));

  const Avatar = ({ u, online }: { u: ActiveUser; online: boolean }) => (
    <div className="relative shrink-0">
      {u.avatarUrl
        ? <img src={u.avatarUrl} alt="" className={`w-8 h-8 rounded object-cover ${!online ? 'grayscale opacity-50' : ''}`}
            style={{ border: `1px solid ${online ? 'var(--border-accent)' : 'var(--border)'}` }} />
        : <div className="w-8 h-8 rounded flex items-center justify-center text-xs font-bold"
            style={{ border: `1px solid ${online ? 'var(--border-accent)' : 'var(--border)'}`, background: online ? 'var(--accent-bg)' : 'var(--bg-panel)', color: online ? 'var(--text-accent)' : 'var(--text-muted)', opacity: online ? 1 : 0.5 }}>
            {u.username[0].toUpperCase()}
          </div>}
      <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 ${online ? 'bg-green-500' : 'bg-gray-500'}`}
        style={{ borderColor: 'var(--bg-base)' }} />
    </div>
  );

  return (
    <div className="w-56 flex flex-col sidebar-glass" style={{ borderLeft: '1px solid var(--border)' }}>
      <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="text-[9px] tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>Personnel — {uniqueActive.length} Online</div>
      </div>
      <div className="flex-1 overflow-y-auto py-2 custom-scrollbar space-y-3">
        {uniqueActive.length > 0 && (
          <div>
            <div className="px-4 py-1 text-[9px] tracking-widest uppercase flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
              <div className="w-1.5 h-1.5 rounded-full bg-green-500" /> ONLINE
            </div>
            {uniqueActive.map(u => (
              <div key={u.id} onClick={() => onUserClick(u.id)}
                className="px-3 py-2 mx-1 flex items-center gap-2.5 cursor-pointer group transition-colors rounded file-row">
                <Avatar u={u} online />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium truncate transition-colors" style={{ color: 'var(--text-primary)' }}>{u.username}</div>
                  <div className="text-[9px] tracking-wider" style={{ color: 'var(--text-accent)' }}>ACTIVE</div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {onDMClick && (
                    <button onClick={e => { e.stopPropagation(); onDMClick(u); }}
                      className="p-1 transition-all rounded" style={{ color: 'var(--text-muted)' }}>
                      <MessageCircle size={12} />
                    </button>
                  )}
                  {u.username.toLowerCase() === 'admin' && <Shield size={11} style={{ color: 'var(--text-accent)' }} />}
                </div>
              </div>
            ))}
          </div>
        )}
        {offline.length > 0 && (
          <div>
            <div className="px-4 py-1 text-[9px] tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>OFFLINE — {offline.length}</div>
            {offline.map(u => (
              <div key={u.id} onClick={() => onUserClick(u.id)}
                className="px-3 py-2 mx-1 flex items-center gap-2.5 cursor-pointer group transition-colors rounded opacity-40 hover:opacity-70 file-row">
                <Avatar u={u} online={false} />
                <div className="flex-1 min-w-0">
                  <div className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>{u.username}</div>
                  <div className="text-[9px] tracking-wider" style={{ color: 'var(--text-muted)' }}>OFFLINE</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
