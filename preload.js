const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  openApp: (appName) => ipcRenderer.invoke('open-app', appName),
  getApps: () => ipcRenderer.invoke('get-apps'),
  minimizeWindow: () => ipcRenderer.send('minimize-window'),
  maximizeWindow: () => ipcRenderer.send('maximize-window'),
  closeWindow: () => ipcRenderer.send('close-window'),
  openExternal: (url) => ipcRenderer.send('open-external', url),
  openFileDialog: () => ipcRenderer.invoke('open-file-dialog'),
  saveFileDialog: () => ipcRenderer.invoke('save-file-dialog'),
  readFile: (path) => ipcRenderer.invoke('read-file', path),
  writeFile: (path, content) => ipcRenderer.invoke('write-file', path, content),
  readDirectory: (subPath = '') => ipcRenderer.invoke('read-directory', subPath),
  getAssetsPath: () => ipcRenderer.invoke('get-assets-path'),
  openFile: (filePath) => ipcRenderer.invoke('open-file', filePath),
    // API para o File Explorer
    readDirectory: (path) => ipcRenderer.invoke('read-directory', path),
    openFile: (filePath) => ipcRenderer.invoke('open-file', filePath),
    getDesktopItems: () => ipcRenderer.invoke('get-desktop-items'),
    pasteToDesktop: () => ipcRenderer.invoke('paste-to-desktop'),
    hasClipboardItems: () => ipcRenderer.invoke('has-clipboard-items'),
    
    // API para apps em geral
    openApp: (appName) => ipcRenderer.invoke('open-app', appName),
    getApps: () => ipcRenderer.invoke('get-apps'),
    
    // API para visualizadores de arquivos
    receiveFileToOpen: (callback) => {
      ipcRenderer.on('file-to-open', (event, filePath) => callback(filePath));
    },
    
    // API para operações de arquivo
    showOpenDialog: (options) => ipcRenderer.invoke('show-open-dialog', options),
    showSaveDialog: (options) => ipcRenderer.invoke('show-save-dialog', options),
    readFile: (filePath) => ipcRenderer.invoke('read-file', filePath),
    writeFile: (filePath, content) => ipcRenderer.invoke('write-file', filePath, content),
    
    // API para controle de janelas
    minimizeWindow: () => ipcRenderer.send('minimize-window'),
    maximizeWindow: () => ipcRenderer.send('maximize-window'),
    closeWindow: () => ipcRenderer.send('close-window'),
    
    // API para o Notepad
    getFileInfo: (filePath) => ipcRenderer.invoke('get-file-info', filePath),
    
    // API para o Image Viewer
    getDirectoryFromFile: (filePath) => ipcRenderer.invoke('get-directory-from-file', filePath),
    isImageFile: (filename) => ipcRenderer.invoke('is-image-file', filename),
    
    // API para o Video Player
    isVideoFile: (filename) => ipcRenderer.invoke('is-video-file', filename)
});