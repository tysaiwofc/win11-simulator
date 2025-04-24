const path = require('path');
const fs = require('fs').promises;
const fsSync = require('fs');
const { BrowserWindow } = require('electron');

class AppHandler {
  constructor(getDirPath) {
    this.getDirPath = getDirPath;
  }

  async openApp(event, appName) {
    const appDataPath = path.join(this.getDirPath(), appName, 'data.json');
    const appPath = path.join(this.getDirPath(), appName, 'index.html');

    try {
      const rawData = await fs.readFile(appDataPath, 'utf-8');
      const appData = JSON.parse(rawData);

      const appWindow = new BrowserWindow({
        width: 800,
        height: 600,
        minWidth: 400,
        minHeight: 400,
        icon: path.join(this.getDirPath(), appName, appData.icon),
        backgroundColor: '#00000000',
        webPreferences: {
          preload: path.join(__dirname, '..', 'preload.js'),
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
  }

  async getAppData(event, appName) {
    const appDataPath = path.join(this.getDirPath(), appName, 'data.json');
    try {
      const data = await fs.readFile(appDataPath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      return {};
    }
  }

  getApps() {
    const appsPath = this.getDirPath();
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
    
    return apps;
  }

  async saveAppData(event, appName, data) {
    const appDataPath = path.join(this.getDirPath(), appName, 'data.json');
    try {
      await fs.writeFile(appDataPath, JSON.stringify(data, null, 2));
      return true;
    } catch (error) {
      console.error('Error saving app data:', error);
      return false;
    }
  }
}

module.exports = AppHandler;