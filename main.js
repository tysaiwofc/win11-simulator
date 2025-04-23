const { app, BrowserWindow, ipcMain, shell, Menu, dialog } = require('electron');
const path = require('path');
const fs = require('fs').promises;
const fsSync = require('fs');
const os = require('os');

let mainWindow;
let splashWindow;

// Função para obter o caminho correto dos assets
function getAssetsPath() {
  return path.join(__dirname, './assets');
}

function createWindow() {
  // Janela do Splash
  splashWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    icon: "./windows.ico",
    minHeight: 600,
    transparent: false,
    frame: false,
    resizable: false,
    alwaysOnTop: true,
    show: true,
  });

  splashWindow.loadFile(path.join(__dirname, 'src/loading.html'));

  // Janela Principal
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    backgroundColor: '#00000000',
    icon: "./windows.ico",
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webviewTag: true
    }
  });

  Menu.setApplicationMenu(null);

  mainWindow.loadFile('src/index.html');

  // Quando a mainWindow estiver pronta, troca o splash pela app
  mainWindow.once('ready-to-show', () => {
    setTimeout(() => {
      splashWindow.destroy();
      mainWindow.show();
    }, 1500); // Duração mínima do splash (em ms)
  });

  // DevTools se for desenvolvimento
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  return mainWindow;
}

app.whenReady().then(() => {
  mainWindow = createWindow();

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



// IPC Handlers
ipcMain.handle('open-app', async (event, appName) => {
  const appDataPath = path.join(getAssetsPath(), 'apps', appName, 'data.json');
  const appPath = path.join(getAssetsPath(), 'apps', appName, 'index.html');

  try {
    const rawData = await fs.readFile(appDataPath, 'utf-8');
    const appData = JSON.parse(rawData);

    const appWindow = new BrowserWindow({
      width: 800,
      height: 600,
      minWidth: 400,
      minHeight: 400,
      icon: path.join(getAssetsPath(), 'apps', appName, appData.icon),
      backgroundColor: '#00000000',
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: true,
        webviewTag: true
      }
    });

    appWindow.loadFile(appPath);
    return true;
  } catch (err) {
    console.error('Erro ao abrir app:', err);
    return false;
  }
});


ipcMain.handle('get-apps', () => {
  const appsPath = path.join(getAssetsPath(), 'apps');
  const apps = [];
  
  try {
    const appDirs = fsSync.readdirSync(appsPath);
    
    appDirs.forEach(dir => {
      const dataPath = path.join(appsPath, dir, 'data.json');
      if (fsSync.existsSync(dataPath)) {
        const data = JSON.parse(fsSync.readFileSync(dataPath, 'utf-8'));
        apps.push({
          name: dir,
          displayName: data.displayName || dir,
          icon: data.icon || 'default.png',
          description: data.description || '',
          fileExtensions: data.fileExtensions || []
        });
      }
    });
  } catch (err) {
    console.error('Error reading apps:', err);
  }
  
  return apps;
});

ipcMain.handle('read-directory', async (event, subPath = '') => {
  try {
    // Caminho base no diretório do usuário
    const baseDir = path.join(os.homedir(), 'WindowsSimulatorFiles');

    // Cria a pasta se não existir
    await fs.mkdir(baseDir, { recursive: true });

    // Caminho final (com subcaminho, se tiver)
    const dirPath = path.join(baseDir, subPath);

    // Garante que o caminho final existe (se for um subdiretório)
    await fs.mkdir(dirPath, { recursive: true });

    const files = await fs.readdir(dirPath);
    const fileDetails = await Promise.all(files.map(async file => {
      const filePath = path.join(dirPath, file);
      const stats = await fs.stat(filePath);
      return {
        name: file,
        path: filePath,
        isDirectory: stats.isDirectory(),
        size: stats.size,
        modified: stats.mtime
      };
    }));

    return fileDetails;
  } catch (error) {
    console.error('Error reading directory:', error);
    throw error;
  }
});

ipcMain.handle('open-file', async (event, filePath) => {
  try {
    const extension = path.extname(filePath).toLowerCase().slice(1);
    const appsPath = path.join(getAssetsPath(), 'apps');
    const apps = [];
    
    try {
      const appDirs = fsSync.readdirSync(appsPath);
      
      appDirs.forEach(dir => {
        const dataPath = path.join(appsPath, dir, 'data.json');
        if (fsSync.existsSync(dataPath)) {
          const data = JSON.parse(fsSync.readFileSync(dataPath, 'utf-8'));
          apps.push({
            name: dir,
            displayName: data.displayName || dir,
            icon: data.icon || 'default.png',
            description: data.description || '',
            fileExtensions: data.fileExtensions || []
          });
        }
      });
    } catch (err) {
      console.error('Error reading apps:', err);
    }
    
    // Encontrar app que suporta esta extensão
    const suitableApp = apps.find(app => 
      app.fileExtensions && app.fileExtensions.some(ext => 
        extension === ext.toLowerCase().replace('.', '')
      )
    );
    
    if (suitableApp) {
      const appWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
          preload: path.join(__dirname, 'preload.js'),
          nodeIntegration: false,
          contextIsolation: true,
          sandbox: true
        }
      });
      
      Menu.setApplicationMenu(null);
      
      await appWindow.loadFile(path.join(getAssetsPath(), 'apps', suitableApp.name, 'index.html'));
      
      // Enviar o arquivo para o app
      appWindow.webContents.send('file-to-open', filePath);
      
      return true;
    } else {
      // Se não encontrar app específico, tentar abrir com o programa padrão do sistema
      await shell.openPath(filePath);
      return true;
    }
  } catch (error) {
    console.error('Error opening file:', error);
    throw error;
  }
});

ipcMain.handle('get-directory-from-file', async (event, filePath) => {
  try {
    const directory = path.dirname(filePath);
    const files = await fs.readdir(directory);
    
    const fileDetails = await Promise.all(files.map(async (file) => {
      const fullPath = path.join(directory, file);
      const stats = await fs.stat(fullPath);
      
      return {
        name: file,
        path: fullPath,
        isDirectory: stats.isDirectory(),
        size: stats.size,
        modified: stats.mtime
      };
    }));
    
    return {
      directory,
      files: fileDetails
    };
  } catch (error) {
    console.error('Error getting directory from file:', error);
    throw error;
  }
});

ipcMain.handle('is-image-file', (event, filename) => {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
  return imageExtensions.some(ext => filename.toLowerCase().endsWith(ext));
});

ipcMain.handle('is-video-file', (event, filename) => {
  const videoExtensions = ['.mp4', '.mov', '.avi', '.mkv', '.webm'];
  return videoExtensions.some(ext => filename.toLowerCase().endsWith(ext));
});

ipcMain.handle('get-file-info', async (event, filePath) => {
  try {
    const stats = await fs.stat(filePath);
    return {
      name: path.basename(filePath),
      path: filePath,
      size: stats.size,
      modified: stats.mtime,
      created: stats.birthtime,
      isDirectory: stats.isDirectory()
    };
  } catch (error) {
    console.error('Error getting file info:', error);
    throw error;
  }
});

ipcMain.handle('get-desktop-items', async () => {
  const desktopPath = path.join(os.homedir(), 'WindowsSimulatorFiles', 'desktop');
  try {
    await fs.mkdir(desktopPath, { recursive: true });
    const files = await fs.readdir(desktopPath);
    return files.map(file => {
      const isDirectory = fsSync.statSync(path.join(desktopPath, file)).isDirectory();
      return {
        name: file,
        path: path.join(desktopPath, file),
        isDirectory,
        icon: isDirectory ? 'folder' : 'file'
      };
    });
  } catch (error) {
    console.error('Error reading desktop items:', error);
    return [];
  }
});

ipcMain.handle('has-clipboard-items', () => {
  return require('electron').clipboard.readText().length > 0;
});

ipcMain.handle('paste-to-desktop', async () => {
  try {
    const text = require('electron').clipboard.readText();
    if (text) {
      const desktopPath = path.join(os.homedir(), 'WindowsSimulatorFiles', 'desktop', `pasted-${Date.now()}.txt`);
      await fs.writeFile(desktopPath, text);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error pasting to desktop:', error);
    throw error;
  }
});

ipcMain.handle('show-open-dialog', async (event, options) => {
  const result = await dialog.showOpenDialog(options);
  return result;
});

ipcMain.handle('show-save-dialog', async (event, options) => {
  const result = await dialog.showSaveDialog(options);
  return result;
});

ipcMain.handle('read-file', async (event, filePath) => {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return content;
  } catch (error) {
    console.error('Error reading file:', error);
    throw error;
  }
});

ipcMain.handle('write-file', async (event, filePath, content) => {
  try {
    await fs.writeFile(filePath, content, 'utf-8');
    return true;
  } catch (error) {
    console.error('Error writing file:', error);
    throw error;
  }
});

// Manipulação de janelas
ipcMain.handle('minimize-window', (event) => {
  BrowserWindow.fromWebContents(event.sender).minimize();
});

ipcMain.handle('maximize-window', (event) => {
  const window = BrowserWindow.fromWebContents(event.sender);
  if (window.isMaximized()) {
    window.unmaximize();
  } else {
    window.maximize();
  }
});

ipcMain.handle('close-window', (event) => {
  BrowserWindow.fromWebContents(event.sender).close();
});

// Expor a função getAssetsPath para o renderer
ipcMain.handle('get-assets-path', () => {
  return getAssetsPath();
});