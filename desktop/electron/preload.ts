import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  // Window controls
  minimize: () => ipcRenderer.send('win:minimize'),
  maximize: () => ipcRenderer.send('win:maximize'),
  close: () => ipcRenderer.send('win:close'),
  isMaximized: () => ipcRenderer.invoke('win:isMaximized'),
  platform: () => ipcRenderer.invoke('win:platform'),

  // Theme
  getTheme: () => ipcRenderer.invoke('theme:get'),

  // Notifications
  notify: (title: string, body: string) => ipcRenderer.send('notify', { title, body }),
})
