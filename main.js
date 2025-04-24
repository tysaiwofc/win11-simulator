const { app, BrowserWindow, ipcMain, shell, Menu, dialog } = require('electron');
const path = require('path');
const fs = require('fs').promises;
const fsSync = require('fs');
const os = require('os');

const https = require('https');
const { exec } = require('child_process');
let mainWindow;
let splashWindow;


// Função para obter o caminho correto dos assets
function getAssetsPath() {
  // Caminho onde o executável está localizado
  const appDir = app.getAppPath();

  // Se for no modo de desenvolvimento, o caminho pode ser diferente (dependendo do ambiente)
  if (process.env.NODE_ENV === 'development') {
    return path.join(appDir, 'assets');
  }

  // Para produção (depois de empacotar o app), use a pasta assets dentro do diretório do app
  return path.join(appDir, 'assets');
}

function getDirPath() {
  const baseDir = path.join(os.homedir(), 'WindowsSimulatorFiles', 'apps');

  // Verifica se a pasta existe, senão cria
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
    icon: "./assets/windows.ico",
    minHeight: 600,
    transparent: false,
    frame: false,
    resizable: false,
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
    },
  });

  mainWindow.webContents.openDevTools();
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


ipcMain.handle('open-external', async (event, url) => {
  try {
    await shell.openExternal(url);
    return true;
  } catch (error) {
    console.error('Error opening external URL:', error);
    return false;
  }
});

ipcMain.handle('file-exists', async (event, filePath) => {
  try {
    await fs.access(filePath, fs.constants.F_OK);
    return true;
  } catch {
    return false;
  }
});

ipcMain.handle('get-file-url', async (event, filePath) => {
  // Converte o caminho do arquivo para URL file:// válida
  return `file://${filePath.replace(/\\/g, '/')}`;
});

// IPC Handlers
ipcMain.handle('open-app', async (event, appName) => {
  const appDataPath = path.join(getDirPath(),  appName, 'data.json');
  const appPath = path.join(getDirPath(),  appName, 'index.html');

  try {
    const rawData = await fs.readFile(appDataPath, 'utf-8');
    const appData = JSON.parse(rawData);

    const appWindow = new BrowserWindow({
      width: 800,
      height: 600,
      minWidth: 400,
      minHeight: 400,
      icon: path.join(getDirPath(), appName, appData.icon),
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

ipcMain.handle('get-app-data', async (event, appName) => {
  const appDataPath = path.join(getDirPath(), appName, 'data.json');
  try {
    const data = await fs.readFile(appDataPath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return {};
  }
});

ipcMain.handle('get-apps', () => {
  const appsPath = getDirPath();
  console.log(appsPath)
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
          fileExtensions: data.fileExtensions || [],
          dir: data.dir
        });
      }
    });
  } catch (err) {
    console.error('Error reading apps:', err);
  }
  
  console.log(apps)
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
    const appsPath = getDirPath();
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
      
      await appWindow.loadFile(path.join(getDirPath(), suitableApp.name, 'index.html'));
      
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

ipcMain.on('restart-app', () => {
  app.relaunch();
  app.exit(0);
});



ipcMain.handle('check-for-updates', async () => {
  try {
    const apiUrl = 'https://hwid-spoofer-server.vercel.app/api/update'; // Substitua com o endpoint correto

    const response = await fetch(apiUrl);
    const updateData = await response.json();

    const latestVersion = updateData.version;
    const currentVersion = app.getVersion(); // versão atual do seu app

    return {
      available: latestVersion !== currentVersion,
      version: latestVersion,
      downloadUrl: updateData.url,
      changelog: updateData.changelog || '' // opcional, se quiser adicionar depois
    };
  } catch (error) {
    console.error("Erro ao verificar atualizações:", error);
    return { error: true };
  }
});


ipcMain.handle('download-update', async (event, url) => {
  return new Promise((resolve, reject) => {
      const file = fsSync.createWriteStream(path.join(app.getPath('temp'), 'update.zip'));
      
      https.get(url, (response) => {
          response.pipe(file);
          file.on('finish', () => {
              file.close();
              resolve();
          });
      }).on('error', (err) => {
          fs.unlink(file.path, () => reject(err));
      });
  });
});

const firstRunFile = path.join(os.homedir(), 'WindowsSimulatorFiles', 'first_run.flag');

// Verifica primeira execução
async function checkFirstRun() {
  try {
    await fs.access(firstRunFile);
    return false; // Não é primeira execução
  } catch {
    await fs.writeFile(firstRunFile, ''); // Cria o flag file
    return true; // É primeira execução
  }
}

// Handler para o IPC
ipcMain.handle('check-first-run', checkFirstRun);

ipcMain.handle('download-and-extract', async () => {
  const zipUrl = 'https://hwid-spoofer-server.vercel.app/commom-apps.zip';
  const destination = path.join(os.homedir(), 'WindowsSimulatorFiles');
  const tempFile = path.join(os.tmpdir(), 'apps.zip');

  try {
    // Download silencioso
    await new Promise((resolve, reject) => {
      const file = fs.createWriteStream(tempFile);
      https.get(zipUrl, response => {
        response.pipe(file);
        file.on('finish', resolve);
      }).on('error', reject);
    });

    // Extração com PowerShell
    const extractCommand = `powershell -Command "Expand-Archive -Path '${tempFile}' -DestinationPath '${destination}' -Force"`;
    await execAsync(extractCommand);

    // Limpeza
    await fs.unlink(tempFile);
    
    return true;
  } catch (error) {
    console.error('Erro no processo:', error);
    try {
      await fs.unlink(tempFile).catch(() => {});
    } catch {}
    return false;
  }
});

ipcMain.handle('install-update', async () => {
  const zipPath = path.join(app.getPath('temp'), 'update.zip');
  const extractTo = path.join(app.getPath('temp'), 'update-temp');
  const downloadsPath = app.getPath('downloads');

  if (!fsSync.existsSync(zipPath)) {
    return { error: 'Arquivo ZIP não encontrado.' };
  }

  try {
    if (fsSync.existsSync(extractTo)) {
      await fsSync.promises.rm(extractTo, { recursive: true, force: true });
    }
    await fsSync.promises.mkdir(extractTo, { recursive: true });

    const extractCommand = `powershell -Command "Expand-Archive -Path '${zipPath}' -DestinationPath '${extractTo}' -Force"`;
    await execAsync(extractCommand);

    const findExe = (dir) => {
      const files = fsSync.readdirSync(dir);
      for (const file of files) {
        const fullPath = path.join(dir, file);
        if (file.toLowerCase().endsWith('.exe')) return fullPath;
        if (fsSync.statSync(fullPath).isDirectory()) {
          const result = findExe(fullPath);
          if (result) return result;
        }
      }
      return null;
    };

    const exePath = findExe(extractTo);
    if (!exePath) throw new Error('Nenhum .exe encontrado no ZIP.');

    const exeName = path.basename(exePath);
    const finalPath = path.join(downloadsPath, exeName);

    await fsSync.promises.copyFile(exePath, finalPath);

    // Abre a pasta de downloads
    shell.openPath(downloadsPath);

    // Remove temporários
    await fsSync.promises.unlink(zipPath);
    await fsSync.promises.rm(extractTo, { recursive: true, force: true });

    // Espera um pouco e fecha o app
    setTimeout(() => {
      app.exit(0);
    }, 2000);

    return { success: true };

  } catch (err) {
    return { error: err.message, details: err.stack };
  }
});
// Helper para exec com promises
function execAsync(command) {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) return reject(error);
      resolve(stdout);
    });
  });
}

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
      path: filePath,
      size: stats.size,
      modified: stats.mtime,
      isDirectory: stats.isDirectory(),
      extension: path.extname(filePath).toLowerCase()
    };
  } catch (error) {
    console.error('Erro ao obter informações do arquivo:', error);
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

ipcMain.handle('save-app-data', async (event, appName, data) => {
  const appDataPath = path.join(getDirPath(), appName, 'data.json');
  try {
    await fs.writeFile(appDataPath, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('Error saving app data:', error);
    return false;
  }
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

ipcMain.handle('get-dir-path', () => {
  return getDirPath();
});