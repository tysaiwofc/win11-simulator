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

  splashWindow.loadFile(path.join(__dirname, 'boot', 'loading.html'));

  // Janela Principal
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
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

const appHandler = new AppHandler(getDirPath);
const fileHandler = new FileHandler();
const systemHandler = new SystemHandler();
const updateHandler = new UpdateHandler();
const windowHandler = new WindowHandler();

// Registrar handlers IPC
function registerIpcHandlers() {
  
  // App Handlers
  ipcMain.handle('open-app', (event, appName) => appHandler.openApp(event, appName));
  ipcMain.handle('get-app-data', (event, appName) => appHandler.getAppData(event, appName));
  ipcMain.handle('get-apps', () => appHandler.getApps());
  ipcMain.handle('save-app-data', (event, appName, data) => appHandler.saveAppData(event, appName, data));

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

  ipcMain.handle('updater:check', updateHandler.checkForUpdates);
  ipcMain.handle('updater:download', updateHandler.downloadUpdate);
  ipcMain.handle('updater:install', updateHandler.quitAndInstall);
  ipcMain.handle('updater:showUpdateDialog', updateHandler.showUpdateAvailableDialog);
  ipcMain.handle('updater:showReadyDialog', updateHandler.showUpdateReadyDialog);
  ipcMain.handle('updater:setConfig', updateHandler.setUpdaterConfig);
  // Window Handlers
  ipcMain.handle('minimize-window', (event) => windowHandler.minimizeWindow(event));
  ipcMain.handle('maximize-window', (event) => windowHandler.maximizeWindow(event));
  ipcMain.handle('close-window', (event) => windowHandler.closeWindow(event));
  ipcMain.handle('open-external', (event, url) => windowHandler.openExternal(event, url));
  ipcMain.on('restart-app', () => windowHandler.restartApp());

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