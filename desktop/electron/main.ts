import { app, BrowserWindow, shell, ipcMain, nativeTheme } from 'electron'
import { join } from 'path'

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    frame: false,          // custom titlebar
    titleBarStyle: 'hidden',
    backgroundColor: '#c8d0d8',
    icon: join(__dirname, '../public/icon.png'),
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true,
    },
  })

  // Load app
  if (isDev) {
    win.loadURL('http://localhost:5173')
    win.webContents.openDevTools({ mode: 'detach' })
  } else {
    win.loadFile(join(__dirname, '../dist/index.html'))
  }

  // Open external links in browser, not Electron
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  return win
}

// ── IPC: Window controls ──────────────────────────────────────────────────────
ipcMain.on('win:minimize', (e) => BrowserWindow.fromWebContents(e.sender)?.minimize())
ipcMain.on('win:maximize', (e) => {
  const w = BrowserWindow.fromWebContents(e.sender)
  if (!w) return
  w.isMaximized() ? w.unmaximize() : w.maximize()
})
ipcMain.on('win:close', (e) => BrowserWindow.fromWebContents(e.sender)?.close())
ipcMain.handle('win:isMaximized', (e) => BrowserWindow.fromWebContents(e.sender)?.isMaximized() ?? false)

// ── IPC: Theme ────────────────────────────────────────────────────────────────
ipcMain.handle('theme:get', () => nativeTheme.shouldUseDarkColors ? 'dark' : 'light')

app.whenReady().then(() => {
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
