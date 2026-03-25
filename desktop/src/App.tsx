import { useState, useEffect } from 'react'
import Login from './components/Login'
import Chat from './components/Chat'
import TitleBar from './components/TitleBar'
import ServerConfig from './components/ServerConfig'

// Electron API tipini tanımla
declare global {
  interface Window {
    electronAPI?: {
      minimize: () => void
      maximize: () => void
      close: () => void
      isMaximized: () => Promise<boolean>
      getSystemTheme: () => Promise<'dark' | 'light'>
      platform: string
    }
  }
}

export default function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('stark_token'))
  const [user, setUser] = useState<any>(JSON.parse(localStorage.getItem('stark_user') || 'null'))
  const [dark, setDark] = useState<boolean>(() => localStorage.getItem('stark_theme') === 'dark')
  const [serverUrl, setServerUrl] = useState<string>(
    localStorage.getItem('stark_server') || 'https://stark.net.tr'
  )
  const [showServerConfig, setShowServerConfig] = useState(false)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('stark_theme', dark ? 'dark' : 'light')
  }, [dark])

  // Sistem temasını al (Electron'dan)
  useEffect(() => {
    if (window.electronAPI && !localStorage.getItem('stark_theme')) {
      window.electronAPI.getSystemTheme().then(t => setDark(t === 'dark'))
    }
  }, [])

  const handleLogin = (newToken: string, newUser: any) => {
    localStorage.setItem('stark_token', newToken)
    localStorage.setItem('stark_user', JSON.stringify(newUser))
    setToken(newToken)
    setUser(newUser)
  }

  const handleLogout = () => {
    localStorage.removeItem('stark_token')
    localStorage.removeItem('stark_user')
    setToken(null)
    setUser(null)
  }

  const handleSaveServer = (url: string) => {
    localStorage.setItem('stark_server', url)
    setServerUrl(url)
    setShowServerConfig(false)
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Custom title bar — sadece Electron'da göster */}
      {window.electronAPI && (
        <TitleBar
          dark={dark}
          onToggleTheme={() => setDark(d => !d)}
          onOpenServerConfig={() => setShowServerConfig(true)}
        />
      )}

      <div className="flex-1 overflow-hidden">
        {!token || !user ? (
          <Login
            onLogin={handleLogin}
            dark={dark}
            onToggleTheme={() => setDark(d => !d)}
            serverUrl={serverUrl}
            onOpenServerConfig={() => setShowServerConfig(true)}
          />
        ) : (
          <Chat
            token={token}
            user={user}
            onLogout={handleLogout}
            dark={dark}
            onToggleTheme={() => setDark(d => !d)}
            serverUrl={serverUrl}
          />
        )}
      </div>

      {showServerConfig && (
        <ServerConfig
          current={serverUrl}
          onSave={handleSaveServer}
          onClose={() => setShowServerConfig(false)}
        />
      )}
    </div>
  )
}
