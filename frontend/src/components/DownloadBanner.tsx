import { useState, useEffect } from 'react';
import { Download, Monitor, X, Loader } from 'lucide-react';

interface ReleaseInfo {
  filename: string;
  url: string;
  size: number;
  platform: string;
}

export default function DownloadBanner() {
  const [info, setInfo] = useState<ReleaseInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(
    () => sessionStorage.getItem('dl_dismissed') === '1'
  );

  useEffect(() => {
    if (dismissed) return;
    const API_URL = window.location.hostname === 'localhost' ? 'http://localhost:5000' : '';
    fetch(`${API_URL}/api/download/latest?platform=win`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.url) setInfo(d); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [dismissed]);

  const dismiss = () => {
    sessionStorage.setItem('dl_dismissed', '1');
    setDismissed(true);
  };

  // Masaüstü uygulamasındaysa veya kapatıldıysa gösterme
  if (dismissed || loading || !info) return null;

  const sizeMB = (info.size / 1024 / 1024).toFixed(1);

  return (
    <div className="fixed bottom-4 right-4 z-[200] max-w-sm w-full animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="rounded-xl shadow-2xl overflow-hidden"
        style={{ background: 'var(--modal-bg)', border: '1px solid var(--modal-border)' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3"
          style={{ background: 'var(--bg-panel)', borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-center gap-2">
            <Monitor size={14} style={{ color: 'var(--text-accent)' }} />
            <span className="text-xs font-bold tracking-wider" style={{ color: 'var(--text-accent)' }}>
              DESKTOP UYGULAMASI
            </span>
          </div>
          <button onClick={dismiss} className="p-1 rounded transition-colors" style={{ color: 'var(--text-muted)' }}>
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        <div className="px-4 py-3 space-y-3">
          <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            Stark Industries Chat'i masaüstü uygulaması olarak indir. Daha hızlı, bildirimler ve native deneyim.
          </p>

          <div className="flex items-center gap-2">
            <div className="flex-1 text-[10px]" style={{ color: 'var(--text-muted)' }}>
              <div className="font-mono">{info.filename}</div>
              <div>{sizeMB} MB · Windows x64</div>
            </div>
            <a
              href={info.url}
              download
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold tracking-wider transition-all"
              style={{ background: 'var(--accent-bg)', border: '1px solid var(--border-accent)', color: 'var(--text-accent)' }}
            >
              <Download size={13} />
              İNDİR
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
