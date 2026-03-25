import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  // Window controls
  minimize:    () => ipcRenderer.send('win:minimize'),
  maximize:    () => ipcRenderer.send('win:maximize'),
  close:       () => ipcRenderer.send('win:close'),
  isMaximized: () => ipcRenderer.invoke('win:isMaximized'),

  // Theme
  getSystemTheme: () => ipcRenderer.invoke('theme:get'),

  // Platform
  platform: process.platform,
})
