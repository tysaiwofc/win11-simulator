const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  sendNotification: (title, message, options = {}) => {
    const notification = {
      title,
      message,
      options,
      timestamp: Date.now(),
      id: Math.random().toString(36).substring(2, 15),
      unread: true
    };
    ipcRenderer.send('send-notification', notification);
  },
  getNotifications: () => ipcRenderer.invoke('get-notifications'),
  clearNotifications: () => ipcRenderer.invoke('clear-notifications'),
  markNotificationAsRead: (id) => ipcRenderer.invoke('mark-notification-as-read', id),
  markAllNotificationsAsRead: () => ipcRenderer.invoke('mark-all-notifications-as-read'),
  onOpenAppInDesktop: (callback) => ipcRenderer.on('open-app-in-desktop', (event, data) => callback(data)),
  onNotificationReceived: (callback) => {
    ipcRenderer.on('notification-added', (event, notification) => callback(notification));
  },
  fileExists: (path) => ipcRenderer.invoke('file-exists', path),
  getFileUrl: (path) => `file://${path}`,
  readFile: (filePath) => ipcRenderer.invoke('read-file', filePath),
  writeFile: (filePath, content) => ipcRenderer.invoke('write-file', filePath, content),
  readDirectory: (subPath = '') => ipcRenderer.invoke('read-directory', subPath),
  openFile: (filePath) => ipcRenderer.invoke('open-file', filePath),
  getFileInfo: (filePath) => ipcRenderer.invoke('get-file-info', filePath),
  getDirectoryFromFile: (filePath) => ipcRenderer.invoke('get-directory-from-file', filePath),
  isImageFile: (filename) => ipcRenderer.invoke('is-image-file', filename),
  isVideoFile: (filename) => ipcRenderer.invoke('is-video-file', filename),
  showOpenDialog: (options) => ipcRenderer.invoke('show-open-dialog', options),
  showSaveDialog: (options) => ipcRenderer.invoke('show-save-dialog', options),
  openFileDialog: () => ipcRenderer.invoke('open-file-dialog'),
  saveFileDialog: () => ipcRenderer.invoke('save-file-dialog'),
  getAssetsPath: () => ipcRenderer.invoke('get-assets-path'),
  getDirPath: () => ipcRenderer.invoke('get-dir-path'),
  getAppData: (appName) => ipcRenderer.invoke('get-app-data', appName),
  saveAppData: (appName, data) => ipcRenderer.invoke('save-app-data', appName, data),
  checkFirstRun: () => ipcRenderer.invoke('check-first-run'),
  openApp: (appName) => ipcRenderer.invoke('open-app', appName),
  getApps: () => ipcRenderer.invoke('get-apps'),
  getDesktopItems: () => ipcRenderer.invoke('get-desktop-items'),
  pasteToDesktop: () => ipcRenderer.invoke('paste-to-desktop'),
  hasClipboardItems: () => ipcRenderer.invoke('has-clipboard-items'),
  toggleFullScreen: () => ipcRenderer.send('toggle-fullscreen'),
  minimizeWindow: () => ipcRenderer.invoke('window-control', 'minimize'),
  maximizeWindow: () => ipcRenderer.invoke('window-control', 'maximize'),
  closeWindow: () => ipcRenderer.invoke('window-control', 'close'),
  updateDesktop: () => ipcRenderer.send('update-desktop'),
  onUpdateDesktop: (callback) => {
    ipcRenderer.on('desktop-updated', (event, ...args) => callback(...args));
  },
  openExternal: (url) => ipcRenderer.send('open-external', url),
  downloadApp: (data) => ipcRenderer.invoke('download-app', data),
  onDownloadProgress: (callback) => ipcRenderer.on('download-progress', (event, progress) => callback(progress)),
  checkForUpdates: () => ipcRenderer.invoke('updater:check'),
  getUpdateInfo: async () => {
    try {
      const updateCheckResult = await ipcRenderer.invoke('updater:check');
      if (updateCheckResult?.updateInfo) {
        return {
          version: updateCheckResult.updateInfo.version,
          releaseDate: updateCheckResult.updateInfo.releaseDate,
          title: `Atualização ${updateCheckResult.updateInfo.version}`,
          description: updateCheckResult.updateInfo.releaseNotes || 'Melhorias de desempenho e correções de bugs',
          size: updateCheckResult.updateInfo.files?.reduce((total, file) => total + (file.size || 0), 0) || 0
        };
      }
      return null;
    } catch (error) {
      console.error('Erro ao obter informações de atualização:', error);
      throw error;
    }
  },
  downloadUpdate: () => ipcRenderer.invoke('updater:download'),
  installUpdate: () => ipcRenderer.invoke('updater:install'),
  showUpdateDialog: (info) => ipcRenderer.invoke('updater:showUpdateDialog', info),
  showReadyDialog: (info) => ipcRenderer.invoke('updater:showReadyDialog', info),
  setUpdaterConfig: (config) => ipcRenderer.invoke('updater:setConfig', config),
  getGlobalConfig: () => ipcRenderer.invoke('get-global-config'),
  getConfig: (key) => ipcRenderer.invoke('get-config', key),
  setConfig: (key, value) => ipcRenderer.invoke('set-config', { key, value }),
  saveCustomConfig: (config) => ipcRenderer.invoke('save-custom-config', config),
  onWallpaperChanged: (callback) => ipcRenderer.on('wallpaper-changed', (event, value) => callback(value)),
  onUpdateStatus: (callback) => ipcRenderer.on('update-status', callback),
  onDownloadProgress: (callback) => ipcRenderer.on('download-progress', callback),
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  checkIconExists: (baseDir, iconPath) => ipcRenderer.invoke('check-icon-exists', baseDir, iconPath),
  restartApp: () => ipcRenderer.send('restart-app'),
  closeApp: () => ipcRenderer.send('close-app'),
  getWindowsInfo: () => ipcRenderer.invoke('get-windows-info'),
  getAllWindows: () => ipcRenderer.invoke('get-all-windows'),
  closeWindowById: (windowId) => ipcRenderer.invoke('close-window-by-id', windowId),
  receiveFileToOpen: (callback) => {
    ipcRenderer.on('file-to-open', (event, filePath) => callback(filePath));
  }
});

contextBridge.exposeInMainWorld('versionsAPI', {
  node: () => process.versions.node,
  chrome: () => process.versions.chrome,
  electron: () => process.versions.electron,
});

contextBridge.exposeInMainWorld('appAPI', {
  getConfig: () => ipcRenderer.invoke('get-app-data', window.appName),
  saveConfig: (data) => ipcRenderer.invoke('save-app-data', window.appName, data),
  openFile: (filePath) => ipcRenderer.invoke('open-file', filePath)
});
