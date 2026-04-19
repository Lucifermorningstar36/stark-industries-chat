import { app, BrowserWindow, shell, ipcMain, nativeTheme, Tray, Menu, Notification } from 'electron'
import { join } from 'path'

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged

let mainWindow: BrowserWindow | null = null
let tray: Tray | null = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    frame: false,
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'hidden',
    trafficLightPosition: { x: 16, y: 16 },
    backgroundColor: '#0a0e17',
    icon: join(__dirname, '../public/icon.png'),
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true,
    },
    // macOS rounded corners
    ...(process.platform === 'darwin' ? { vibrancy: 'under-window', visualEffectState: 'active' } : {}),
  })

  // Load app
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  } else {
    mainWindow.loadURL('https://stark.net.tr')
  }

  // Open external links in browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  // macOS: hide when closed, don't quit
  mainWindow.on('close', (e) => {
    if (process.platform === 'darwin' && !app.isQuitting) {
      e.preventDefault()
      mainWindow?.hide()
    }
  })

  return mainWindow
}

function createTray() {
  const iconPath = join(__dirname, '../public/icon.png')
  try {
    tray = new Tray(iconPath)
    const contextMenu = Menu.buildFromTemplate([
      { label: 'Stark Industries Chat', enabled: false },
      { type: 'separator' },
      { label: 'Aç / Göster', click: () => { mainWindow?.show(); mainWindow?.focus(); } },
      { label: 'Gizle', click: () => mainWindow?.hide() },
      { type: 'separator' },
      { label: 'Çıkış', click: () => { (app as any).isQuitting = true; app.quit(); } },
    ])
    tray.setContextMenu(contextMenu)
    tray.setToolTip('Stark Industries Chat')
    tray.on('double-click', () => { mainWindow?.show(); mainWindow?.focus(); })
  } catch (e) {
    console.warn('Tray creation failed:', e)
  }
}

// ── IPC: Window Controls ──────────────────────────────────────────────────────
ipcMain.on('win:minimize', (e) => BrowserWindow.fromWebContents(e.sender)?.minimize())
ipcMain.on('win:maximize', (e) => {
  const w = BrowserWindow.fromWebContents(e.sender)
  if (!w) return
  w.isMaximized() ? w.unmaximize() : w.maximize()
})
ipcMain.on('win:close', (e) => {
  const w = BrowserWindow.fromWebContents(e.sender)
  if (process.platform === 'darwin') { w?.hide() } else { w?.close() }
})
ipcMain.handle('win:isMaximized', (e) => BrowserWindow.fromWebContents(e.sender)?.isMaximized() ?? false)
ipcMain.handle('win:platform', () => process.platform)

// ── IPC: Theme ────────────────────────────────────────────────────────────────
ipcMain.handle('theme:get', () => nativeTheme.shouldUseDarkColors ? 'dark' : 'light')

// ── IPC: Notifications ────────────────────────────────────────────────────────
ipcMain.on('notify', (_e, { title, body }: { title: string; body: string }) => {
  if (Notification.isSupported()) {
    new Notification({ title, body, silent: false }).show()
  }
})

// ── App Lifecycle ─────────────────────────────────────────────────────────────
app.whenReady().then(() => {
  createWindow()
  createTray()

  app.on('activate', () => {
    // macOS: re-show window when clicking dock icon
    if (mainWindow) { mainWindow.show(); mainWindow.focus(); }
    else if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

// macOS: prevent app quit when closing windows (use tray instead)
app.on('before-quit', () => {
  (app as any).isQuitting = true
})
