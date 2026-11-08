const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getPlayback: () => ipcRenderer.invoke('get-native-playback'),
  sendCommand: (command) => ipcRenderer.invoke('send-native-command', command),
  closeWindow: () => ipcRenderer.send('window-close'),
  minimizeWindow: () => ipcRenderer.send('window-minimize'),
  togglePin: (isPinned) => ipcRenderer.send('window-toggle-pin', isPinned)
});
