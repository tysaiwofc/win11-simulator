const path = require('path');
const fs = require('fs').promises;
const fsSync = require('fs');
const { BrowserWindow, dialog, clipboard, ipcMain } = require('electron');

class AppHandler {
  constructor(getDirPath, getAssetsPath) {
    this.getDirPath = getDirPath;
    this.getAssetsPath = getAssetsPath;
    this.Dev = false;
    this.appWindows = new Map();
  }

  #getAppsPath() {
    return !this.Dev 
      ? this.getAssetsPath().replace('assets', 'src/apps') 
      : this.getAssetsPath().replace('assets', 'apps');
  }

  async #getAppPaths(appName) {
    const paths = {
      original: {
        data: path.join(this.getDirPath(), appName, 'data.json'),
        app: path.join(this.getDirPath(), appName, 'index.html'),
        icon: path.join(this.getDirPath(), appName, 'icon.png')
      },
      assets: {
        data: path.join(this.#getAppsPath(), appName, 'data.json'),
        app: path.join(this.#getAppsPath(), appName, 'index.html'),
        icon: path.join(this.#getAppsPath(), appName, 'icon.png')
      }
    };

    try {
      await fs.access(paths.original.data);
      return paths.original;
    } catch {
      console.log(`App não encontrado no diretório original, tentando em assets...`);
      return paths.assets;
    }
  }

  async openApp(event, appName) {
    // Se já existe, traz para frente
    if (this.appWindows.has(appName)) {
      const win = this.appWindows.get(appName);
      if (win.isMinimized()) win.restore();
      win.focus();
      return true;
    }

    try {
      const { data: appDataPath, app: appPath, icon: iconPath } = await this.#getAppPaths(appName);
      const rawData = await fs.readFile(appDataPath, 'utf-8');
      const appData = JSON.parse(rawData);

      const finalIconPath = fsSync.existsSync(iconPath) 
        ? iconPath 
        : path.join(this.#getAppsPath(), appName, appData.icon);

      const mainWindow = BrowserWindow.getAllWindows()[0];
      const appWindow = new BrowserWindow({
        parent: mainWindow,
        width: 800,
        height: 600,
        minWidth: 400,
        minHeight: 400,
        modal: true, // Não é mais modal
        transparent: true,
        frame: false,
        resizable: true,
        vibrancy: 'ultra-thin',
        backgroundMaterial: 'acrylic',
        visualEffectState: 'active',
        icon: finalIconPath,
        // skipTaskbar: true, // Não aparece na taskbar
        fullscreenable: false,
        maximizable: false,
        backgroundColor: '#00000000',
        webPreferences: {
          preload: path.join(__dirname, '..', 'preload.js'),
          nodeIntegration: false,
          contextIsolation: true,
          sandbox: true,
          webviewTag: true
        }
      });

      // Configurações para parecer parte da mesma janela
      appWindow.setMenu(null);
      //appWindow.setAlwaysOnTop(true, 'floating');
      appWindow.setVisibleOnAllWorkspaces(true);
      appWindow.setFullScreenable(false);

      // Centraliza a janela
      appWindow.once('ready-to-show', () => {
        const bounds = mainWindow.getBounds();
        const x = bounds.x + (bounds.width - 800) / 2;
        const y = bounds.y + (bounds.height - 600) / 2;
        appWindow.setPosition(x, y);
        appWindow.show();
        ipcMain.emit('app-opened', {
  id: appWindow.id,
  name: appName,
  title: appWindow.getTitle(),
  icon: finalIconPath
});

      });

      // Remove da lista quando fechada
      appWindow.on('closed', () => {
        this.appWindows.delete(appName);
        ipcMain.emit('app-closed', { id: appWindow.id, name: appName });

      });

      if (this.Dev) {
        appWindow.webContents.openDevTools({ mode: 'detach' });
      }

      appWindow.loadFile(appPath);
      this.appWindows.set(appName, appWindow);

      return true;
    } catch (err) {
      console.error('Erro ao abrir o app:', err);
      return false;
    }
  }

  async #getConfigPath(appName) {
    const paths = [
      path.join(this.getDirPath(), appName, 'config.json'),
      path.join(this.#getAppsPath(), appName, 'config.json')
    ];

    for (const configPath of paths) {
      try {
        await fs.access(configPath);
        return configPath;
      } catch {}
    }
    return paths[1]; // Retorna o caminho de assets como fallback
  }

  async getAppData(event, appName) {
    try {
      const configPath = await this.#getConfigPath(appName);
      const data = await fs.readFile(configPath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Erro ao ler dados do app:', error);
      return {};
    }
  }

  getApps() {
    const apps = [];
    const dirsToCheck = [this.getDirPath(), this.#getAppsPath()];

    for (const baseDir of dirsToCheck) {
      try {
        const appDirs = fsSync.readdirSync(baseDir);
        
        for (const dir of appDirs) {
          const dataPath = path.join(baseDir, dir, 'data.json');
          
          if (fsSync.existsSync(dataPath)) {
            const data = JSON.parse(fsSync.readFileSync(dataPath, 'utf-8'));
            apps.push({
              name: dir,
              displayName: data.displayName || dir,
              icon: data.icon || 'default.png',
              description: data.description || '',
              fileExtensions: data.fileExtensions || [],
              dir: baseDir
            });
          }
        }
      } catch (err) {
        console.error('Erro ao ler aplicativos:', err);
      }
    }

    return apps;
  }

  async saveAppData(event, appName, data) {
    try {
      const configPath = await this.#getConfigPath(appName);
      await fs.writeFile(configPath, JSON.stringify(data, null, 2));
      return true;
    } catch (error) {
      console.error('Erro ao salvar dados do app:', error);
      return false;
    }
  }
}

module.exports = AppHandler;