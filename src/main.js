const { app, BrowserWindow, ipcMain, Menu  } = require('electron');

const path = require('path');
const fsSync = require("fs")
const os = require("os")
// Importar handlers
const AppHandler = require('./handlers/AppHandler');
const FileHandler = require('./handlers/FileHandler');
const SystemHandler = require('./handlers/SystemHandler');
const UpdateHandler = require('./handlers/UpdateHandler');
const WindowHandler = require('./handlers/WindowHandler');
const ConfigHandler = require('./handlers/ConfigHandler');
const AppStoreHandler = require('./handlers/AppStoreHandler');
const DiscordRichPresence = require('./handlers/DiscordRichPresence')

const { version } = require('../package.json')
const clientId = '1365864834574319676';

const presence = new DiscordRichPresence(clientId, version);
presence.connect();

let mainWindow;
let splashWindow;

function getAssetsPath() {
  const appDir = app.getAppPath();
  return process.env.NODE_ENV === 'development' 
    ? path.join(appDir, 'assets')
    : path.join(appDir, 'assets');
}

function getDirPath() {
  const baseDir = path.join(os.homedir(), 'WindowsSimulatorFiles', 'apps');
  if (!fsSync.existsSync(baseDir)) {
    fsSync.mkdirSync(baseDir, { recursive: true });
  }
  return baseDir;
}

function createWindow() {
  // Janela do Splash
  splashWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    icon: path.resolve(__dirname, 'assets', 'windows.ico'),
    minHeight: 600,
    transparent: false,
    frame: false,
    resizable: false,
    show: true,
  });

  splashWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    const errorData = {
      type: 'did-fail-load',
      code: errorCode,
      description: errorDescription,
      timestamp: new Date().toISOString()
    }
    
    broadcastToAllWindows(errorData)
  })

  splashWindow.loadFile(path.join(__dirname, 'boot', 'loading.html'));


  // Janela Principal
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    frame: false,
    backgroundColor: '#00000000',
    icon: path.resolve(__dirname, 'assets', 'windows.ico'),
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webviewTag: true
    },
  });
  
  //mainWindow.webContents.openDevTools();
  Menu.setApplicationMenu(null);
  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.webContents.send('check-for-updates');
  });

  mainWindow.once('ready-to-show', () => {
    setTimeout(() => {
      splashWindow.destroy();
      mainWindow.show();
    }, 1500);
  });

  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  return mainWindow;
}

const appHandler = new AppHandler(getDirPath, getAssetsPath);
const fileHandler = new FileHandler();
const systemHandler = new SystemHandler();
const updateHandler = new UpdateHandler();
const windowHandler = new WindowHandler();
const configHandler = new ConfigHandler();
const appStoreHandler = new AppStoreHandler(getDirPath);


ipcMain.handle('download-app', (event, appData) => {
  return appStoreHandler.downloadApp(event, appData);
});

ipcMain.handle('get-installed-apps', () => {
  return appStoreHandler.getInstalledApps();
});

ipcMain.on('update-desktop', () => {
  console.log('update-desktop recebido');

  BrowserWindow.getAllWindows().forEach((win) => {
    if (!win.isDestroyed()) {
      win.webContents.send('desktop-updated');
    }
  });
});

function broadcastToAllWindows(error) {
  // Primeiro cria a janela BSOD
  const bsodWindow = new BrowserWindow({
    width: 800,
    height: 600,
    fullscreen: true,
    frame: false,
    resizable: false,
    alwaysOnTop: true,
    backgroundColor: '#0078d7',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  // Carrega o HTML da BSOD
  bsodWindow.loadFile(path.join(__dirname, './boot/bsod.html'));

  // Envia os detalhes do erro para a tela BSOD
  bsodWindow.webContents.on('did-finish-load', () => {
    bsodWindow.webContents.send('bsod-data', {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toLocaleString(),
      version: version
    });
    
    // SÓ DEPOIS fecha as outras janelas
    const windows = BrowserWindow.getAllWindows();
    windows.forEach(win => {
      if (!win.isDestroyed() && win !== bsodWindow) {
        win.destroy();
      }
    });
  });

  // Tratamento para caso o carregamento da BSOD falhe
  bsodWindow.webContents.on('did-fail-load', () => {
    dialog.showErrorBox('Erro crítico', 'Falha ao carregar a tela de erro. Reinicie o aplicativo.\n\n' + error.message);
    app.exit(1);
  });
}

function registerIpcHandlers() {
  
  function setupErrorHandling() {
    // Erros não capturados
    process.on('uncaughtException', (error) => {
      const errorData = {
        type: 'uncaughtException',
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      }
      
      console.error('Erro não capturado:', errorData)
      broadcastToAllWindows(errorData)
    })
 
    // Rejeições de Promise não tratadas
    process.on('unhandledRejection', (reason, promise) => {
      const errorData = {
        type: 'unhandledRejection',
        message: reason instanceof Error ? reason.stack : String(reason),
        timestamp: new Date().toISOString()
      }
      
      console.error('Promise rejeitada:', errorData)
      broadcastToAllWindows(errorData)
    })
  }

  setupErrorHandling()
  // App Handlers
  ipcMain.handle('open-app', (event, appName) => appHandler.openApp(event, appName));
  ipcMain.handle('get-app-data', (event, appName) => appHandler.getAppData(event, appName));
  ipcMain.handle('get-apps', () => appHandler.getApps());
  ipcMain.handle('save-app-data', (event, appName, data) => appHandler.saveAppData(event, appName, data));




  ipcMain.handle('check-icon-exists', (event, baseDir, iconPath) => {
    
    const fullPath = path.join(baseDir, iconPath);
    return fsSync.existsSync(fullPath) ? fullPath : false;
  });
  // Config

  ipcMain.handle('get-global-config', () => {
    return configHandler.getGlobalConfig();  // Retorna todas as configurações
  });
  let allNotifications = [];

// Handlers de notificações
ipcMain.on('send-notification', (event, notification) => {

  console.log(notification)
  //allNotifications.unshift(notification);
  
  // Limitar a 100 notificações
  if (allNotifications.length > 100) {
    allNotifications = allNotifications.slice(0, 100);
  }
  
  // Enviar para todas as janelas
  BrowserWindow.getAllWindows().forEach(window => {
    if (!window.isDestroyed()) {
      allNotifications.push(notification)
      window.webContents.send('notification-added', notification);
    }
  });
});

ipcMain.handle('get-notifications', () => allNotifications);

ipcMain.handle('clear-notifications', () => {
  allNotifications = [];
  return true;
});

ipcMain.handle('mark-notification-as-read', (event, id) => {
  const notification = allNotifications.find(n => n.id === id);
  console.log("tsert", notification, id, allNotifications.slice(0, 5))
  if (notification) notification.unread = false;
  if(notification.options.app) { appHandler.openApp(event, notification.options.app) }
  
  
  return true;
});

ipcMain.handle('mark-all-notifications-as-read', () => {
  allNotifications.forEach(n => n.unread = false);
  return true;
});

  ipcMain.handle('get-config', (event, key) => {
    return configHandler.getConfig(key);  // Retorna uma configuração específica
  });
  
  ipcMain.handle('set-config', (event, { key, value }) => {
    configHandler.setConfig(key, value);
    console.log(key, value);
    
    if (key === 'wallpaper') {
      // Envia o evento para TODAS as janelas abertas
      BrowserWindow.getAllWindows().forEach((win) => {
        win.webContents.send('wallpaper-changed', value);
      });
    }
  
    return true;
  });
  
  ipcMain.handle('save-custom-config', (event, config) => {
    return configHandler.saveCustomConfig(event, config);  // Salva configurações personalizadas
  });

  // File Handlers
  ipcMain.handle('read-directory', (event, subPath) => fileHandler.readDirectory(event, subPath));
  ipcMain.handle('open-file', (event, filePath) => fileHandler.openFile(event, filePath));
  ipcMain.handle('get-directory-from-file', (event, filePath) => fileHandler.getDirectoryFromFile(event, filePath));
  ipcMain.handle('is-image-file', (event, filename) => fileHandler.isImageFile(event, filename));
  ipcMain.handle('is-video-file', (event, filename) => fileHandler.isVideoFile(event, filename));
  ipcMain.handle('get-file-info', (event, filePath) => fileHandler.getFileInfo(event, filePath));
  ipcMain.handle('read-file', (event, filePath) => fileHandler.readFile(event, filePath));
  ipcMain.handle('write-file', (event, filePath, content) => fileHandler.writeFile(event, filePath, content));
  ipcMain.handle('show-open-dialog', (event, options) => fileHandler.showOpenDialog(event, options));
  ipcMain.handle('show-save-dialog', (event, options) => fileHandler.showSaveDialog(event, options));

  // System Handlers
  ipcMain.handle('check-first-run', () => systemHandler.checkFirstRun());
  ipcMain.handle('get-desktop-items', () => systemHandler.getDesktopItems());
  ipcMain.handle('has-clipboard-items', () => systemHandler.hasClipboardItems());
  ipcMain.handle('paste-to-desktop', () => systemHandler.pasteToDesktop());
  ipcMain.handle('get-app-version', () => {
    return version;
  });
  ipcMain.on('close-app', () => {
    app.quit(); // Agora sim, fecha o app corretamente
  });

  ipcMain.handle('updater:check', updateHandler.checkForUpdates);
  ipcMain.handle('updater:download', updateHandler.downloadUpdate);
  ipcMain.handle('updater:install', updateHandler.quitAndInstall);
  ipcMain.handle('updater:showUpdateDialog', updateHandler.showUpdateAvailableDialog);
  ipcMain.handle('updater:showReadyDialog', updateHandler.showUpdateReadyDialog);
  ipcMain.handle('updater:setConfig', updateHandler.setUpdaterConfig);
  // Window Handlers
  ipcMain.on('toggle-fullscreen', () => {
    let win = BrowserWindow.getFocusedWindow();
    if (win) {
      win.setFullScreen(!win.isFullScreen()); // Alterna o estado de tela cheia
    }
  });


  ipcMain.on('restart-app', () => {
    app.relaunch(); // relança o app
    app.exit(); 
  });

  // Path Handlers
  ipcMain.handle('get-assets-path', () => getAssetsPath());
  ipcMain.handle('get-dir-path', () => getDirPath());
}

app.whenReady().then(async () => {
  mainWindow = createWindow();
  
  registerIpcHandlers();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      mainWindow = createWindow();
    }
  });

});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});