const { app, BrowserWindow, ipcMain, Menu, shell } = require('electron');
const path = require('path');
const fsSync = require('fs');
const fs = require('fs')
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

const BASE_PATH = path.join(os.homedir(), 'WindowsSimulatorFiles');

// --- Garante que o diretório base exista ---
if (!fs.existsSync(BASE_PATH)) {
    fs.mkdirSync(BASE_PATH, { recursive: true });
}

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
      //mainWindow.webContents.openDevTools({ mode: 'detach' });

    }, 1000);
  });


    
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
ipcMain.on('set-main-window', (event) => {
  const mainWebContents = event.sender;

  ipcMain.on('app-opened', (appInfo) => {
    mainWebContents.send('app-opened', appInfo);
  });

  ipcMain.on('app-closed', (appInfo) => {
    mainWebContents.send('app-closed', appInfo);
  });
});
  ipcMain.handle('get-all-windows', () => {
  return BrowserWindow.getAllWindows().map(win => ({
    id: win.id,
    title: win.getTitle(),
    icon: win.webContents.session.icon || null // ou defina manualmente o ícone
  }));
});
ipcMain.handle('focus-window', (event, id) => {
  const win = BrowserWindow.fromId(id);
  if (win) {
    win.show();
    win.focus();
  }
});
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


  // New File Handlers

  // Função para resolver o caminho completo e seguro
const resolvePath = (relativePath) => {
    const absolutePath = path.resolve(BASE_PATH, relativePath);
    // Verificação de segurança: impede o acesso a diretórios pais (Path Traversal)
    if (!absolutePath.startsWith(BASE_PATH)) {
        throw new Error("Acesso negado. Tentativa de acessar um caminho fora do diretório permitido.");
    }
    return absolutePath;
};

// Obter arquivos e pastas de um diretório
ipcMain.handle('fs:get-files', async (event, relativePath) => {
    try {
        const dirPath = resolvePath(relativePath);
        const items = fs.readdirSync(dirPath);
        const detailedItems = items.map(item => {
            const itemPath = path.join(dirPath, item);
            const stats = fs.statSync(itemPath);
            return {
                name: item,
                isDirectory: stats.isDirectory(),
                size: stats.size,
                mtime: stats.mtime.getTime(), // Data de modificação em milissegundos
            };
        });
        return { success: true, data: detailedItems };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

// Criar uma nova pasta
ipcMain.handle('fs:create-folder', async (event, folderPath) => {
    try {
        const fullPath = resolvePath(folderPath);
        if (!fs.existsSync(fullPath)) {
            fs.mkdirSync(fullPath);
        }
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

// Criar um novo arquivo (vazio)
ipcMain.handle('fs:create-file', async (event, filePath) => {
    try {
        const fullPath = resolvePath(filePath);
        fs.writeFileSync(fullPath, '', 'utf-8');
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

// Renomear um arquivo ou pasta
ipcMain.handle('fs:rename-item', async (event, oldPath, newPath) => {
    try {
        const fullOldPath = resolvePath(oldPath);
        const fullNewPath = resolvePath(newPath);
        fs.renameSync(fullOldPath, fullNewPath);
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

// Deletar um arquivo ou pasta
ipcMain.handle('fs:delete-item', async (event, itemPath) => {
    try {
        const fullPath = resolvePath(itemPath);
        const stats = fs.statSync(fullPath);
        if (stats.isDirectory()) {
            fs.rmSync(fullPath, { recursive: true, force: true });
        } else {
            fs.unlinkSync(fullPath);
        }
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

// Abrir um arquivo com o programa padrão do sistema operacional
ipcMain.handle('fs:open-file', async (event, filePath) => {
    try {
        const fullPath = resolvePath(filePath);
        shell.openPath(fullPath);
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

// Ler o conteúdo de um arquivo de texto
ipcMain.handle('fs:read-file', async(event, filePath) => {
    try {
        const fullPath = resolvePath(filePath);
        const content = fs.readFileSync(fullPath, 'utf-8');
        return { success: true, data: content };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

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