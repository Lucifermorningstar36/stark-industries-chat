import { useState, useEffect } from 'react';
import Login from './components/Login';
import Chat from './components/Chat';
import Intro from './components/Intro';
import DownloadBanner from './components/DownloadBanner';
import DownloadPage from './pages/DownloadPage';
import ResetPasswordPage from './pages/ResetPasswordPage';

export default function App() {
  const [showIntro, setShowIntro] = useState(true);
  const [token, setToken] = useState<string | null>(localStorage.getItem('stark_token'));
  const [user, setUser] = useState<any>(JSON.parse(localStorage.getItem('stark_user') || 'null'));
  const [dark, setDark] = useState<boolean>(() => {
    const saved = localStorage.getItem('stark_theme');
    if (saved) return saved === 'dark';
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? true;
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('stark_theme', dark ? 'dark' : 'light');
  }, [dark]);

  const handleLogin = (newToken: string, newUser: any) => {
    localStorage.setItem('stark_token', newToken);
    localStorage.setItem('stark_user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const handleLogout = () => {
    localStorage.removeItem('stark_token');
    localStorage.removeItem('stark_user');
    setToken(null);
    setUser(null);
  };

  // /download sayfası
  if (window.location.pathname === '/download') {
    return <DownloadPage dark={dark} onToggleTheme={() => setDark(d => !d)} />;
  }

  // /reset-password?token=... sayfası
  if (window.location.pathname === '/reset-password') {
    return <ResetPasswordPage />;
  }

  return (
    <>
      {showIntro ? (
        <Intro onFinish={() => setShowIntro(false)} />
      ) : !token || !user ? (
        <Login onLogin={handleLogin} dark={dark} onToggleTheme={() => setDark(d => !d)} />
      ) : (
        <>
          <Chat token={token} user={user} onLogout={handleLogout} dark={dark} onToggleTheme={() => setDark(d => !d)} />
          <DownloadBanner />
        </>
      )}
    </>
  );
}
