const { app, BrowserWindow, shell, nativeImage } = require('electron');
const path = require('path');
const os = require('os');

const isLinux = os.platform() === 'linux';
const isWindows = os.platform() === 'win32';
const isMac = os.platform() === 'darwin';

// Cross-platform icon: Linux & Mac use PNG, Windows uses ICO
function getIconPath() {
  if (isWindows) {
    const icoPath = path.join(__dirname, '../public/icon.ico');
    const pngPath = path.join(__dirname, '../public/icon-512.png');
    const fs = require('fs');
    return fs.existsSync(icoPath) ? icoPath : pngPath;
  }
  // Linux & Mac
  return path.join(__dirname, '../public/icon-512.png');
}

function createWindow() {
  const iconPath = getIconPath();
  const windowOptions = {
    width: 1280,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    title: 'Stark Industries Chat',
    backgroundColor: '#050a0e',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  };

  // Apply icon if file exists
  const fs = require('fs');
  if (fs.existsSync(iconPath)) {
    windowOptions.icon = iconPath;
  }

  const mainWindow = new BrowserWindow(windowOptions);

  // Remove the default menu bar for that clean Stark look
  mainWindow.setMenuBarVisibility(false);

  // Load the built Vite app
  mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));

  // Open external links in default browser
  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: 'deny' };
  });

  // Linux: handle window close button properly
  mainWindow.on('close', () => {
    app.quit();
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  // On macOS, keep the app running even when all windows are closed (standard behavior)
  // On Linux and Windows, quit when all windows are closed
  if (!isMac) app.quit();
});
