const { app, BrowserWindow, ipcMain, Menu } = require('electron');
const path = require('path');
const fsSync = require('fs');
const os = require('os');

// Importar handlers
const handlers = {
  AppHandler: require('./handlers/AppHandler'),
  FileHandler: require('./handlers/FileHandler'),
  SystemHandler: require('./handlers/SystemHandler'),
  UpdateHandler: require('./handlers/UpdateHandler'),
  WindowHandler: require('./handlers/WindowHandler'),
  ConfigHandler: require('./handlers/ConfigHandler'),
  AppStoreHandler: require('./handlers/AppStoreHandler'),
  DiscordRichPresence: require('./handlers/DiscordRichPresence')
};

const { version } = require('../package.json');
const clientId = '1365864834574319676';

// Inicialização
const presence = new handlers.DiscordRichPresence(clientId, version);
presence.connect();

let mainWindow, splashWindow;
const allNotifications = [];

// Helpers
const getAssetsPath = () => path.join(app.getAppPath(), 'assets');
const getDirPath = () => {
  const baseDir = path.join(os.homedir(), 'WindowsSimulatorFiles', 'apps');
  !fsSync.existsSync(baseDir) && fsSync.mkdirSync(baseDir, { recursive: true });
  return baseDir;
};

// Window Management
const createSplashWindow = () => {
  splashWindow = new BrowserWindow({
    width: 1200, height: 800,
    minWidth: 800, minHeight: 600,
    icon: path.resolve(__dirname, 'assets', 'windows.ico'),
    transparent: false, frame: false,
    resizable: false, show: true
  });

  splashWindow.webContents.on('did-fail-load', (_, errorCode, errorDescription) => {
    broadcastToAllWindows({
      type: 'did-fail-load',
      code: errorCode,
      description: errorDescription,
      timestamp: new Date().toISOString()
    });
  });

  splashWindow.loadFile(path.join(__dirname, 'boot', 'loading.html'));
  return splashWindow;
};

const createMainWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1200, height: 800,
    minWidth: 800, minHeight: 600,
    frame: false, show: false,
    backgroundColor: '#00000000',
    icon: path.resolve(__dirname, 'assets', 'windows.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webviewTag: true
    }
  });

  Menu.setApplicationMenu(null);
  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  mainWindow.once('ready-to-show', () => {
    setTimeout(() => {
      splashWindow?.destroy();
      mainWindow.show();
    }, 1000);
  });

  process.env.NODE_ENV === 'development' && 
    mainWindow.webContents.openDevTools({ mode: 'detach' });

  mainWindow.on('closed', () => (mainWindow = null));
  return mainWindow;
};

// Error Handling
const broadcastToAllWindows = (error) => {
  if (error.message?.includes('Update')) return;

  const bsodWindow = new BrowserWindow({
    width: 800, height: 600,
    fullscreen: true, frame: false,
    resizable: false, alwaysOnTop: true,
    backgroundColor: '#0078d7',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  bsodWindow.loadFile(path.join(__dirname, './boot/bsod.html'));

  bsodWindow.webContents.on('did-finish-load', () => {
    bsodWindow.webContents.send('bsod-data', {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toLocaleString(),
      version
    });

    BrowserWindow.getAllWindows().forEach(win => {
      !win.isDestroyed() && win !== bsodWindow && win.destroy();
    });
  });

  bsodWindow.webContents.on('did-fail-load', () => {
    require('electron').dialog.showErrorBox(
      'Erro crítico', 
      `Falha ao carregar a tela de erro. Reinicie o aplicativo.\n\n${error.message}`
    );
    app.exit(1);
  });
};

// IPC Handlers
const setupErrorHandling = () => {
  process.on('uncaughtException', (error) => {
    const errorData = {
      type: 'uncaughtException',
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    };
    console.error('Erro não capturado:', errorData);
    broadcastToAllWindows(errorData);
  });

  process.on('unhandledRejection', (reason) => {
    const errorData = {
      type: 'unhandledRejection',
      message: reason instanceof Error ? reason.stack : String(reason),
      timestamp: new Date().toISOString()
    };
    console.error('Promise rejeitada:', errorData);
    broadcastToAllWindows(errorData);
  });
};

const registerIpcHandlers = () => {
  setupErrorHandling();

  // Initialize handlers
  const handlersInstances = {
    app: new handlers.AppHandler(getDirPath, getAssetsPath),
    file: new handlers.FileHandler(),
    system: new handlers.SystemHandler(),
    update: new handlers.UpdateHandler(),
    window: new handlers.WindowHandler(),
    config: new handlers.ConfigHandler(),
    appStore: new handlers.AppStoreHandler(getDirPath)
  };

  // App Handlers
  ipcMain.handle('open-app', (e, appName) => handlersInstances.app.openApp(e, appName));
  ipcMain.handle('get-app-data', (e, appName) => handlersInstances.app.getAppData(e, appName));
  ipcMain.handle('get-apps', () => handlersInstances.app.getApps());
  ipcMain.handle('save-app-data', (e, appName, data) => handlersInstances.app.saveAppData(e, appName, data));
  ipcMain.handle('check-icon-exists', (_, baseDir, iconPath) => 
    fsSync.existsSync(path.join(baseDir, iconPath)) && path.join(baseDir, iconPath));

  // Config Handlers
  ipcMain.handle('get-global-config', () => handlersInstances.config.getGlobalConfig());
  ipcMain.handle('get-config', (_, key) => handlersInstances.config.getConfig(key));
  ipcMain.handle('set-config', (e, { key, value }) => {
    handlersInstances.config.setConfig(key, value);
    if (key === 'wallpaper') {
      BrowserWindow.getAllWindows().forEach(win => 
        !win.isDestroyed() && win.webContents.send('wallpaper-changed', value)
      );
    }
    return true;
  });
  ipcMain.handle('save-custom-config', (e, config) => handlersInstances.config.saveCustomConfig(e, config));

  // Notification Handlers
  ipcMain.on('send-notification', (_, notification) => {
    allNotifications.unshift(notification);
    allNotifications.length > 100 && (allNotifications.length = 100);
    BrowserWindow.getAllWindows().forEach(win => 
      !win.isDestroyed() && win.webContents.send('notification-added', notification)
    );
  });
  ipcMain.handle('get-notifications', () => allNotifications);
  ipcMain.handle('clear-notifications', () => (allNotifications.length = 0, true));
  ipcMain.handle('mark-notification-as-read', (e, id) => {
    const notification = allNotifications.find(n => n.id === id);
    notification && (notification.unread = false);
    notification?.options?.app && handlersInstances.app.openApp(e, notification.options.app);
    return true;
  });
  ipcMain.handle('mark-all-notifications-as-read', () => 
    (allNotifications.forEach(n => n.unread = false), true));

  // File Handlers
  ipcMain.handle('read-directory', (e, subPath) => handlersInstances.file.readDirectory(e, subPath));
  ipcMain.handle('open-file', (e, filePath) => handlersInstances.file.openFile(e, filePath));
  ipcMain.handle('get-directory-from-file', (e, filePath) => handlersInstances.file.getDirectoryFromFile(e, filePath));
  ipcMain.handle('is-image-file', (e, filename) => handlersInstances.file.isImageFile(e, filename));
  ipcMain.handle('is-video-file', (e, filename) => handlersInstances.file.isVideoFile(e, filename));
  ipcMain.handle('get-file-info', (e, filePath) => handlersInstances.file.getFileInfo(e, filePath));
  ipcMain.handle('read-file', (e, filePath) => handlersInstances.file.readFile(e, filePath));
  ipcMain.handle('write-file', (e, filePath, content) => handlersInstances.file.writeFile(e, filePath, content));
  ipcMain.handle('show-open-dialog', (e, options) => handlersInstances.file.showOpenDialog(e, options));
  ipcMain.handle('show-save-dialog', (e, options) => handlersInstances.file.showSaveDialog(e, options));

  // System Handlers
  ipcMain.handle('check-first-run', () => handlersInstances.system.checkFirstRun());
  ipcMain.handle('get-desktop-items', () => handlersInstances.system.getDesktopItems());
  ipcMain.handle('has-clipboard-items', () => handlersInstances.system.hasClipboardItems());
  ipcMain.handle('paste-to-desktop', () => handlersInstances.system.pasteToDesktop());
  ipcMain.handle('get-app-version', () => version);
  ipcMain.on('close-app', () => app.quit());

  // Update Handlers
  ipcMain.handle('updater:check', handlersInstances.update.checkForUpdates);
  ipcMain.handle('updater:download', handlersInstances.update.downloadUpdate);
  ipcMain.handle('updater:install', handlersInstances.update.quitAndInstall);
  ipcMain.handle('updater:showUpdateDialog', handlersInstances.update.showUpdateAvailableDialog);
  ipcMain.handle('updater:showReadyDialog', handlersInstances.update.showUpdateReadyDialog);
  ipcMain.handle('updater:setConfig', handlersInstances.update.setUpdaterConfig);

  // Window Handlers
  ipcMain.on('toggle-fullscreen', () => {
    const win = BrowserWindow.getFocusedWindow();
    win && win.setFullScreen(!win.isFullScreen());
  });
  ipcMain.on('restart-app', () => (app.relaunch(), app.exit()));
  ipcMain.on('update-desktop', () => 
    BrowserWindow.getAllWindows().forEach(win => 
      !win.isDestroyed() && win.webContents.send('desktop-updated')
    ));

  // Path Handlers
  ipcMain.handle('get-assets-path', getAssetsPath);
  ipcMain.handle('get-dir-path', getDirPath);
};

// App Lifecycle
app.whenReady().then(() => {
  createSplashWindow();
  createMainWindow();
  registerIpcHandlers();
  
  app.on('activate', () => 
    BrowserWindow.getAllWindows().length === 0 && createMainWindow()
  );
});

app.on('window-all-closed', () => 
  process.platform !== 'darwin' && app.quit()
);