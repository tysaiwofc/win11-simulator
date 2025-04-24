const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Arquivos
  fileExists: (path) => ipcRenderer.invoke('file-exists', path),
  getFileUrl: (path) => ipcRenderer.invoke('get-file-url', path),
  readFile: (filePath) => ipcRenderer.invoke('read-file', filePath),
  writeFile: (filePath, content) => ipcRenderer.invoke('write-file', filePath, content),
  readDirectory: (subPath = '') => ipcRenderer.invoke('read-directory', subPath),
  openFile: (filePath) => ipcRenderer.invoke('open-file', filePath),
  getFileInfo: (filePath) => ipcRenderer.invoke('get-file-info', filePath),
  getDirectoryFromFile: (filePath) => ipcRenderer.invoke('get-directory-from-file', filePath),
  isImageFile: (filename) => ipcRenderer.invoke('is-image-file', filename),
  isVideoFile: (filename) => ipcRenderer.invoke('is-video-file', filename),

  // Diálogos
  showOpenDialog: (options) => ipcRenderer.invoke('show-open-dialog', options),
  showSaveDialog: (options) => ipcRenderer.invoke('show-save-dialog', options),
  openFileDialog: () => ipcRenderer.invoke('open-file-dialog'),
  saveFileDialog: () => ipcRenderer.invoke('save-file-dialog'),

  // Diretórios e caminhos
  getAssetsPath: () => ipcRenderer.invoke('get-assets-path'),
  getDirPath: () => ipcRenderer.invoke('get-dir-path'),

  // Dados do app
  getAppData: (appName) => ipcRenderer.invoke('get-app-data', appName),
  saveAppData: (appName, data) => ipcRenderer.invoke('save-app-data', appName, data),
  checkFirstRun: () => ipcRenderer.invoke('check-first-run'),

  // Aplicativos
  openApp: (appName) => ipcRenderer.invoke('open-app', appName),
  getApps: () => ipcRenderer.invoke('get-apps'),

  // Desktop
  getDesktopItems: () => ipcRenderer.invoke('get-desktop-items'),
  pasteToDesktop: () => ipcRenderer.invoke('paste-to-desktop'),
  hasClipboardItems: () => ipcRenderer.invoke('has-clipboard-items'),

  // Janela
  minimizeWindow: () => ipcRenderer.send('minimize-window'),
  maximizeWindow: () => ipcRenderer.send('maximize-window'),
  closeWindow: () => ipcRenderer.send('close-window'),

  // Links externos
  openExternal: (url) => ipcRenderer.send('open-external', url),

  // Atualizações
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  downloadUpdate: (url) => ipcRenderer.invoke('download-update', url),
  installUpdate: () => ipcRenderer.invoke('install-update'),
  restartApp: () => ipcRenderer.send('restart-app'),
  onExtractProgress: (callback) => ipcRenderer.on('extract-progress', callback),
  downloadAndExtract: () => ipcRenderer.invoke('download-and-extract'),
  onDownloadProgress: (callback) => ipcRenderer.on('download-progress', (_, progress) => callback(progress)),
  onInstallProgress: (callback) => ipcRenderer.on('install-progress', (_, progress) => callback(progress)),

  // Comunicação com o renderer
  receiveFileToOpen: (callback) => {
    ipcRenderer.on('file-to-open', (event, filePath) => callback(filePath));
  }
});

contextBridge.exposeInMainWorld('versions', {
  node: () => process.versions.node,
  chrome: () => process.versions.chrome,
  electron: () => process.versions.electron
});

contextBridge.exposeInMainWorld('appAPI', {
  getConfig: () => ipcRenderer.invoke('get-app-data', window.appName),
  saveConfig: (data) => ipcRenderer.invoke('save-app-data', window.appName, data),
  openFile: (filePath) => ipcRenderer.invoke('open-file', filePath)
});
