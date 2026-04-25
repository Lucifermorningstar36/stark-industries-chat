import { useState } from 'react';
import axios from 'axios';
import { Mail, ArrowLeft, Send, CheckCircle, AlertTriangle } from 'lucide-react';

interface Props {
  onBack: () => void;
}

const isElectron = navigator.userAgent.toLowerCase().includes('electron');
const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const API_URL = isElectron ? 'https://stark.net.tr' : (isLocalhost ? 'http://localhost:5000' : '');

export default function ForgotPassword({ onBack }: Props) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) { setError('E-posta adresi girin.'); return; }
    setError(''); setLoading(true);
    try {
      await axios.post(`${API_URL}/api/auth/forgot-password`, { email: email.trim() });
      setSent(true);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Bir hata oluştu. Tekrar deneyin.');
    }
    setLoading(false);
  };

  if (sent) {
    return (
      <div className="text-center py-4">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{ background: 'rgba(0,180,200,0.1)', border: '1px solid rgba(0,180,200,0.3)' }}>
          <CheckCircle size={28} style={{ color: 'var(--text-accent)' }} />
        </div>
        <p className="text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
          E-posta Gönderildi
        </p>
        <p className="text-xs leading-relaxed mb-6" style={{ color: 'var(--text-muted)' }}>
          Eğer <strong style={{ color: 'var(--text-accent)' }}>{email}</strong> adresi sistemde kayıtlıysa şifre sıfırlama linki gönderildi. Spam klasörünüzü de kontrol edin.
        </p>
        <button onClick={onBack}
          className="flex items-center gap-2 mx-auto text-xs uppercase tracking-widest transition-opacity hover:opacity-70"
          style={{ color: 'var(--text-muted)' }}>
          <ArrowLeft size={13} /> Giriş Ekranına Dön
        </button>
      </div>
    );
  }

  return (
    <div>
      <button onClick={onBack}
        className="flex items-center gap-2 mb-6 text-xs uppercase tracking-widest transition-opacity hover:opacity-70"
        style={{ color: 'var(--text-muted)' }}>
        <ArrowLeft size={13} /> Geri Dön
      </button>

      <div className="mb-6">
        <div className="text-xs tracking-[0.3em] mb-1" style={{ color: 'var(--text-muted)' }}>
          STARK INDUSTRIES // ŞİFRE KURTARMA
        </div>
        <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
          Şifreni Sıfırla
        </h2>
        <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          Kayıtlı e-posta adresini gir, sıfırlama linkini gönderelim.
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 mb-4 rounded-lg text-xs"
          style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171' }}>
          <AlertTriangle size={13} className="shrink-0" /> {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-[10px] tracking-widest uppercase mb-2" style={{ color: 'var(--text-muted)' }}>
            E-Posta Adresi
          </label>
          <div className="relative">
            <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
            <input
              type="email"
              placeholder="ornek@eposta.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="email"
              className="w-full pl-9 pr-4 py-2.5 text-sm rounded-lg outline-none transition-all"
              style={{
                background: 'var(--input-bg)',
                border: '1px solid var(--border)',
                color: 'var(--text-primary)',
              }}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 text-xs tracking-widest uppercase font-medium flex items-center justify-center gap-2 rounded-lg transition-all disabled:opacity-50"
          style={{ background: 'var(--accent-bg)', border: '1px solid var(--border-accent)', color: 'var(--text-accent)' }}>
          {loading ? (
            <span className="animate-pulse">GÖNDERİLİYOR...</span>
          ) : (
            <><Send size={13} /> LİNK GÖNDER</>
          )}
        </button>
      </form>
    </div>
  );
}
