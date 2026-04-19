import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './App.css'
import './index.css'

// Apply dark/light class BEFORE React mounts (prevents flash of wrong theme)
const saved = localStorage.getItem('stark_theme');
const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? true;
const isDark = saved ? saved === 'dark' : prefersDark;
document.documentElement.classList.toggle('dark', isDark);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
