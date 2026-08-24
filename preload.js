const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  loadExtensions: () => ipcRenderer.invoke('load-extensions'),
  saveProjectState: (snapshot) => ipcRenderer.invoke('save-project-state', snapshot),
  loadProjectState: () => ipcRenderer.invoke('load-project-state')
});
