import { useEffect, useRef } from 'react';
import { Reply, Forward, Copy, Pin, Flag, Trash2, X } from 'lucide-react';

interface Props {
  x: number;
  y: number;
  message: any;
  isMe: boolean;
  onClose: () => void;
  onReply: (msg: any) => void;
  onCopy: (text: string) => void;
  onDelete?: (id: string) => void;
}

export default function MessageContextMenu({ x, y, message, isMe, onClose, onReply, onCopy, onDelete }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const keyHandler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    setTimeout(() => window.addEventListener('mousedown', handler), 0);
    window.addEventListener('keydown', keyHandler);
    return () => { window.removeEventListener('mousedown', handler); window.removeEventListener('keydown', keyHandler); };
  }, [onClose]);

  // Ekran sınırlarına göre pozisyon ayarla
  const adjustedX = Math.min(x, window.innerWidth - 220);
  const adjustedY = Math.min(y, window.innerHeight - 300);

  const reactions = ['👍', '❤️', '😂', '😮', '😢', '🔥'];

  const items = [
    { icon: Reply, label: 'Yanıtla', action: () => { onReply(message); onClose(); } },
    { icon: Copy, label: 'Metni Kopyala', action: () => { onCopy(message.content || ''); onClose(); }, disabled: !message.content },
    { icon: Pin, label: 'Mesajı Sabitle', action: () => onClose() },
    { icon: Flag, label: 'Mesaj Bildir', action: () => onClose(), danger: false, muted: true },
    ...(isMe && onDelete ? [{ icon: Trash2, label: 'Mesajı Sil', action: () => { onDelete(message.id); onClose(); }, danger: true }] : []),
  ];

  return (
    <div
      ref={ref}
      className="fixed z-[250] w-52 rounded-xl shadow-2xl overflow-hidden"
      style={{
        left: adjustedX,
        top: adjustedY,
        background: 'var(--modal-bg)',
        border: '1px solid var(--modal-border)',
      }}
    >
      {/* Reactions */}
      <div className="flex items-center justify-around px-3 py-2.5" style={{ borderBottom: '1px solid var(--border)' }}>
        {reactions.map(r => (
          <button
            key={r}
            onClick={onClose}
            className="text-lg hover:scale-125 transition-transform"
            title={r}
          >
            {r}
          </button>
        ))}
      </div>

      {/* Actions */}
      <div className="py-1">
        {items.map(({ icon: Icon, label, action, danger, muted, disabled }: any) => (
          <button
            key={label}
            onClick={action}
            disabled={disabled}
            className="w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors disabled:opacity-40"
            style={{
              color: danger ? '#f87171' : muted ? 'var(--text-muted)' : 'var(--text-primary)',
              background: 'transparent',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-panel)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <span>{label}</span>
            <Icon size={14} className="opacity-60" />
          </button>
        ))}
      </div>
    </div>
  );
}
