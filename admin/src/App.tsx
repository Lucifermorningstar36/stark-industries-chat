import { useState } from 'react'
import Login from './pages/Login'
import Scene3D from './pages/Scene3D'

export default function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('stark_admin_token'))
  const [admin, setAdmin] = useState<any>(JSON.parse(localStorage.getItem('stark_admin_user') || 'null'))

  const handleLogin = (t: string, u: any) => {
    localStorage.setItem('stark_admin_token', t)
    localStorage.setItem('stark_admin_user', JSON.stringify(u))
    setToken(t)
    setAdmin(u)
  }

  const handleLogout = () => {
    localStorage.removeItem('stark_admin_token')
    localStorage.removeItem('stark_admin_user')
    setToken(null)
    setAdmin(null)
  }

  if (!token || !admin || admin.role !== 'ADMIN') {
    return <Login onLogin={handleLogin} />
  }

  return <Scene3D token={token} admin={admin} onLogout={handleLogout} />
}
