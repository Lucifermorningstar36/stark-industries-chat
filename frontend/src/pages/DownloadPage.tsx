import { useState, useEffect } from 'react';
import { Download, Monitor, Shield, Zap, Wifi, Sun, Moon, CheckCircle, Loader } from 'lucide-react';

interface ReleaseInfo {
  filename: string;
  url: string;
  size: number;
  platform: string;
}

interface Props {
  dark: boolean;
  onToggleTheme: () => void;
}

export default function DownloadPage({ dark, onToggleTheme }: Props) {
  const [winInfo, setWinInfo] = useState<ReleaseInfo | null>(null);
  const [linuxInfo, setLinuxInfo] = useState<ReleaseInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);

  const API_URL = window.location.hostname === 'localhost' ? 'http://localhost:5000' : '';

  useEffect(() => {
    Promise.all([
      fetch(`${API_URL}/api/download/latest?platform=win`).then(r => r.ok ? r.json() : null).catch(() => null),
      fetch(`${API_URL}/api/download/latest?platform=linux`).then(r => r.ok ? r.json() : null).catch(() => null),
    ]).then(([win, linux]) => {
      setWinInfo(win);
      setLinuxInfo(linux);
      setLoading(false);
    });
  }, []);

  const features = [
    { icon: Zap,    text: 'Anlık bildirimler' },
    { icon: Shield, text: 'Şifreli bağlantı' },
    { icon: Wifi,   text: 'Ses & görüntü kanalları' },
    { icon: Monitor,text: 'Native masaüstü deneyimi' },
  ];

  const handleDownload = (url: string, platform: string) => {
    setDownloading(platform);
    setTimeout(() => setDownloading(null), 3000);
    window.location.href = url;
  };

  return (
    <div className="min-h-screen si-grid-bg flex flex-col" style={{ background: 'var(--bg-base)' }}>
      <div className="scanline" />

      {/* Navbar */}
      <nav className="flex items-center justify-between px-8 py-4 backdrop-blur-sm"
        style={{ borderBottom: '1px solid var(--border)', background: 'var(--header-bg)' }}>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full pulse-teal" style={{ background: 'var(--accent)' }} />
          <span className="font-black tracking-widest text-sm uppercase" style={{ color: 'var(--text-accent)' }}>STARK NET</span>
        </div>
        <div className="flex items-center gap-4">
          <a href="/" className="text-xs tracking-wider transition-colors" style={{ color: 'var(--text-muted)' }}>
            ← Giriş Yap
          </a>
          <button onClick={onToggleTheme} className="theme-toggle">
            {dark ? <Sun size={14} /> : <Moon size={14} />}
          </button>
        </div>
      </nav>

      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-16 text-center">

        {/* Glow */}
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(0,180,200,0.06) 0%, transparent 70%)', zIndex: 0 }} />

        <div className="relative z-10 max-w-2xl w-full space-y-8">

          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded"
            style={{ border: '1px solid var(--border-accent)', background: 'var(--accent-bg)' }}>
            <Monitor size={11} style={{ color: 'var(--text-accent)' }} />
            <span className="text-[9px] tracking-[0.3em] uppercase" style={{ color: 'var(--text-accent)' }}>
              Desktop Application
            </span>
          </div>

          {/* Title */}
          <div>
            <h1 className="text-4xl font-black tracking-widest uppercase mb-3" style={{ color: 'var(--text-accent)' }}>
              STARK INDUSTRIES CHAT
            </h1>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              Güvenli, şifreli iletişim platformu. Ses kanalları, dosya paylaşımı ve gerçek zamanlı mesajlaşma.
            </p>
          </div>

          {/* Features */}
          <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
            {features.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-2.5 px-4 py-3 rounded-lg si-panel">
                <Icon size={14} style={{ color: 'var(--text-accent)' }} />
                <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{text}</span>
              </div>
            ))}
          </div>

          {/* Download cards */}
          <div className="space-y-3">
            {loading ? (
              <div className="flex items-center justify-center gap-2 py-8" style={{ color: 'var(--text-muted)' }}>
                <Loader size={16} className="animate-spin" />
                <span className="text-xs tracking-widest">Sürüm bilgisi alınıyor...</span>
              </div>
            ) : (
              <>
                {/* Windows */}
                <DownloadCard
                  platform="Windows"
                  icon="🪟"
                  info={winInfo}
                  downloading={downloading === 'win'}
                  onDownload={() => winInfo && handleDownload(winInfo.url, 'win')}
                  badge="x64 · NSIS Installer"
                />
                {/* Linux */}
                <DownloadCard
                  platform="Linux"
                  icon="🐧"
                  info={linuxInfo}
                  downloading={downloading === 'linux'}
                  onDownload={() => linuxInfo && handleDownload(linuxInfo.url, 'linux')}
                  badge="x64 · AppImage"
                />
              </>
            )}
          </div>

          {/* Note */}
          <p className="text-[10px] tracking-wider" style={{ color: 'var(--text-muted)' }}>
            Tarayıcıdan da kullanabilirsin —{' '}
            <a href="/" className="underline underline-offset-2 transition-colors" style={{ color: 'var(--text-accent)' }}>
              stark.net.tr
            </a>
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center py-4" style={{ borderTop: '1px solid var(--border)' }}>
        <span className="text-[9px] tracking-widest" style={{ color: 'var(--text-muted)' }}>
          STARK INDUSTRIES © 2026 — ALL TRANSMISSIONS MONITORED
        </span>
      </div>
    </div>
  );
}

function DownloadCard({ platform, icon, info, downloading, onDownload, badge }: {
  platform: string; icon: string; info: ReleaseInfo | null;
  downloading: boolean; onDownload: () => void; badge: string;
}) {
  const sizeMB = info ? (info.size / 1024 / 1024).toFixed(1) : null;

  return (
    <div className="flex items-center justify-between px-5 py-4 rounded-xl si-panel">
      <div className="flex items-center gap-4">
        <span className="text-2xl">{icon}</span>
        <div className="text-left">
          <div className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{platform}</div>
          <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
            {badge}{sizeMB ? ` · ${sizeMB} MB` : ''}
          </div>
          {info && (
            <div className="text-[9px] font-mono mt-0.5" style={{ color: 'var(--text-muted)' }}>
              {info.filename}
            </div>
          )}
        </div>
      </div>

      {info ? (
        <button
          onClick={onDownload}
          disabled={downloading}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold tracking-wider transition-all disabled:opacity-70"
          style={{ background: 'var(--accent-bg)', border: '1px solid var(--border-accent)', color: 'var(--text-accent)' }}
        >
          {downloading ? (
            <><CheckCircle size={13} /> İndiriliyor...</>
          ) : (
            <><Download size={13} /> İndir</>
          )}
        </button>
      ) : (
        <div className="text-right">
          <span className="block text-[10px] px-4 py-2 rounded-lg" style={{ background: 'var(--bg-panel)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
            Henüz build yok
          </span>
          <span className="block text-[9px] mt-1" style={{ color: 'var(--text-muted)' }}>
            Sunucuda build edilmeli
          </span>
        </div>
      )}
    </div>
  );
}
