import { useState, useEffect } from 'react';
import axios from 'axios';
import { Lock, Eye, EyeOff, CheckCircle, AlertTriangle, ShieldAlert } from 'lucide-react';

const API_URL = window.location.hostname === 'localhost' ? 'http://localhost:5000' : '';

export default function ResetPasswordPage() {
  const token = new URLSearchParams(window.location.search).get('token') || '';
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) { setTokenValid(false); return; }
    axios.get(`${API_URL}/api/auth/verify-reset-token/${token}`)
      .then(r => setTokenValid(r.data.valid))
      .catch(() => setTokenValid(false));
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (newPassword.length < 6) { setError('Şifre en az 6 karakter olmalıdır.'); return; }
    if (newPassword !== confirmPassword) { setError('Şifreler eşleşmiyor.'); return; }
    setLoading(true);
    try {
      await axios.post(`${API_URL}/api/auth/reset-password`, { token, newPassword });
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Bir hata oluştu.');
    }
    setLoading(false);
  };

  const goToLogin = () => {
    window.history.replaceState({}, '', '/');
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex items-center justify-center si-grid-bg"
      style={{ background: 'var(--bg-base)' }}>
      <div className="w-full max-w-sm mx-4">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-[9px] tracking-[0.4em] mb-1" style={{ color: 'var(--text-muted)' }}>STARK INDUSTRIES</div>
          <div className="text-xl font-bold tracking-widest" style={{ color: 'var(--text-primary)' }}>ŞİFRE SIFIRLAMA</div>
          <div className="w-12 h-px mx-auto mt-3" style={{ background: 'var(--border-accent)' }} />
        </div>

        <div className="si-panel rounded-xl p-8">
          {/* Loading state */}
          {tokenValid === null && (
            <div className="text-center py-6">
              <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mx-auto mb-3"
                style={{ borderColor: 'var(--border-accent)', borderTopColor: 'transparent' }} />
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Link doğrulanıyor...</p>
            </div>
          )}

          {/* Invalid token */}
          {tokenValid === false && (
            <div className="text-center py-4">
              <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}>
                <ShieldAlert size={24} style={{ color: '#f87171' }} />
              </div>
              <p className="font-semibold text-sm mb-2" style={{ color: 'var(--text-primary)' }}>
                Geçersiz veya Süresi Dolmuş Link
              </p>
              <p className="text-xs leading-relaxed mb-6" style={{ color: 'var(--text-muted)' }}>
                Bu şifre sıfırlama linki geçersiz ya da 1 saatlik geçerlilik süresi dolmuş.
                Yeni bir link talep edin.
              </p>
              <button onClick={goToLogin}
                className="w-full py-2.5 text-xs tracking-widest uppercase rounded-lg transition-all"
                style={{ background: 'var(--accent-bg)', border: '1px solid var(--border-accent)', color: 'var(--text-accent)' }}>
                Giriş Ekranına Dön
              </button>
            </div>
          )}

          {/* Success */}
          {success && (
            <div className="text-center py-4">
              <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ background: 'rgba(0,180,200,0.1)', border: '1px solid rgba(0,180,200,0.3)' }}>
                <CheckCircle size={24} style={{ color: 'var(--text-accent)' }} />
              </div>
              <p className="font-semibold text-sm mb-2" style={{ color: 'var(--text-primary)' }}>
                Şifre Başarıyla Güncellendi
              </p>
              <p className="text-xs leading-relaxed mb-6" style={{ color: 'var(--text-muted)' }}>
                Yeni şifrenizle giriş yapabilirsiniz.
              </p>
              <button onClick={goToLogin}
                className="w-full py-2.5 text-xs tracking-widest uppercase rounded-lg transition-all"
                style={{ background: 'var(--accent-bg)', border: '1px solid var(--border-accent)', color: 'var(--text-accent)' }}>
                Giriş Yap
              </button>
            </div>
          )}

          {/* Reset form */}
          {tokenValid === true && !success && (
            <div>
              <div className="mb-6">
                <div className="text-[9px] tracking-[0.3em] mb-1" style={{ color: 'var(--text-muted)' }}>
                  STARK INDUSTRIES // KİMLİK DOĞRULAMA
                </div>
                <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Yeni Şifre Belirle</h2>
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>En az 6 karakter olmalıdır.</p>
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
                    Yeni Şifre
                  </label>
                  <div className="relative">
                    <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                    <input
                      type={showPass ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      autoComplete="new-password"
                      className="w-full pl-9 pr-10 py-2.5 text-sm rounded-lg outline-none transition-all"
                      style={{ background: 'var(--input-bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                    />
                    <button type="button" onClick={() => setShowPass(p => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 transition-opacity hover:opacity-70"
                      style={{ color: 'var(--text-muted)' }}>
                      {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] tracking-widest uppercase mb-2" style={{ color: 'var(--text-muted)' }}>
                    Şifre Tekrar
                  </label>
                  <div className="relative">
                    <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                    <input
                      type={showPass ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      autoComplete="new-password"
                      className="w-full pl-9 pr-4 py-2.5 text-sm rounded-lg outline-none transition-all"
                      style={{ background: 'var(--input-bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                    />
                  </div>
                </div>

                {/* Password strength indicator */}
                {newPassword && (
                  <div className="flex gap-1">
                    {[1,2,3,4].map(i => (
                      <div key={i} className="flex-1 h-0.5 rounded-full transition-all"
                        style={{
                          background: newPassword.length >= i * 3
                            ? (newPassword.length >= 10 ? '#10b981' : newPassword.length >= 6 ? '#f59e0b' : '#ef4444')
                            : 'var(--border)'
                        }} />
                    ))}
                  </div>
                )}

                <button type="submit" disabled={loading}
                  className="w-full py-2.5 text-xs tracking-widest uppercase font-medium rounded-lg transition-all disabled:opacity-50"
                  style={{ background: 'var(--accent-bg)', border: '1px solid var(--border-accent)', color: 'var(--text-accent)' }}>
                  {loading ? <span className="animate-pulse">GÜNCELLENİYOR...</span> : 'ŞİFREYİ GÜNCELLE'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
