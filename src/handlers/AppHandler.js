const path = require('path');
const fs = require('fs').promises;
const fsSync = require('fs');
const { BrowserWindow, dialog, clipboard } = require('electron');

class AppHandler {
  constructor(getDirPath, getAssetsPath) {
    this.getDirPath = getDirPath;
    this.getAssetsPath = getAssetsPath;
    this.Dev = false
  }

  async openApp(event, appName) {
    // Primeiro, tenta pegar o diretório no caminho original
    let appDataPath = path.join(this.getDirPath(), appName, 'data.json');
    let appPath = path.join(this.getDirPath(), appName, 'index.html');
    let iconPath = path.join(this.getDirPath(), appName, 'icon.png'); // Caminho do ícone no diretório original
  
    //console.log(path.join(!this.Dev ? this.getAssetsPath().replace('assets', 'src/apps') : this.getAssetsPath().replace('assets', 'apps').replace('assets', 'apps'), appName, 'data.json'))

    try {
      // Verifica se o diretório existe no caminho original
      await fs.access(appDataPath);
    } catch (err) {
      // Se não encontrar o diretório, tenta o caminho alternativo
      console.log(`App não encontrado no diretório original, tentando em assets...`);
  
      appDataPath = path.join(!this.Dev ? this.getAssetsPath().replace('assets', 'src/apps') : this.getAssetsPath().replace('assets', 'apps'), appName, 'data.json');
      appPath = path.join(!this.Dev ? this.getAssetsPath().replace('assets', 'src/apps') : this.getAssetsPath().replace('assets', 'apps'), appName, 'index.html');
      iconPath = path.join(!this.Dev ? this.getAssetsPath().replace('assets', 'src/apps') : this.getAssetsPath().replace('assets', 'apps'), appName, 'icon.png'); // Caminho do ícone no diretório de assets
    }
  
    try {
      // Tenta ler o arquivo JSON de dados
      const rawData = await fs.readFile(appDataPath, 'utf-8');
      const appData = JSON.parse(rawData);
  
      // Verifica o caminho correto do ícone, dependendo do diretório usado
      const finalIconPath = fsSync.existsSync(iconPath) ? iconPath : path.join(!this.Dev ? this.getAssetsPath().replace('assets', 'src/apps') : this.getAssetsPath().replace('assets', 'apps'), appName, appData.icon);
  
      // Cria uma nova janela do aplicativo
      const appWindow = new BrowserWindow({
        width: 800,
        height: 600,
        minWidth: 400,
        minHeight: 400,
        frame: false,
        icon: finalIconPath, // Usa o caminho correto do ícone
        backgroundColor: '#00000000',
        webPreferences: {
          preload: path.join(__dirname, '..', 'preload.js'),
          nodeIntegration: false,
          contextIsolation: true,
          sandbox: true,
          webviewTag: true
        }
      });
  
      //appWindow.webContents.openDevTools();
      // Carrega o arquivo HTML do app
      appWindow.loadFile(appPath);
      return true;
    } catch (err) {
      console.error('Erro ao abrir o app:', err);
      return false;
    }
  }
  

  async getAppData(event, appName) {
    let appDataPath = path.join(this.getDirPath(), appName, 'config.json');
  
    try {
      // Tenta acessar o diretório principal
      await fs.access(appDataPath);
    } catch (err) {
      // Se não encontrar, tenta o diretório de assets
      appDataPath = path.join(!this.Dev ? this.getAssetsPath().replace('assets', 'src/apps') : this.getAssetsPath().replace('assets', 'apps'), appName, 'config.json');
    }
  
    try {
      const data = await fs.readFile(appDataPath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Erro ao ler dados do app:', error);
      return {};  // Retorna um objeto vazio em caso de erro
    }
  }
  

  getApps() {
    const apps = [];
    const dirsToCheck = [this.getDirPath(), !this.Dev ? this.getAssetsPath().replace('assets', 'src/apps') : this.getAssetsPath().replace('assets', 'apps')];  // Caminhos para buscar
    

    dirsToCheck.forEach(baseDir => {

      try {
        const appDirs = fsSync.readdirSync(baseDir);
        
        appDirs.forEach(dir => {
          const dataPath = path.join(baseDir, dir, 'data.json');
          
          if (fsSync.existsSync(dataPath)) {
            const data = JSON.parse(fsSync.readFileSync(dataPath, 'utf-8'));
  
            
            console.log(data)
            
            apps.push({
              name: dir,
              displayName: data.displayName || dir,
              icon: data.icon || 'default.png',
              description: data.description || '',
              fileExtensions: data.fileExtensions || [],
              dir: baseDir  // Para saber de onde o app foi carregado
            });
          }
        });
      } catch (err) {
        console.error('Erro ao ler aplicativos:', err);
      }
    });
  
    return apps;
  }
  

  async saveAppData(event, appName, data) {
    let appDataPath = path.join(this.getDirPath(), appName, 'config.json');
  
    try {
      // Tenta acessar o diretório principal
      await fs.access(appDataPath);
    } catch (err) {
      // Se não encontrar, tenta o diretório de assets
      appDataPath = path.join(!this.Dev ? this.getAssetsPath().replace('assets', 'src/apps') : this.getAssetsPath().replace('assets', 'apps'), appName, 'config.json');
    }
  
    try {
      await fs.writeFile(appDataPath, JSON.stringify(data, null, 2));
      return true;
    } catch (error) {
      console.error('Erro ao salvar dados do app:', error);
      return false;
    }
  }
  
}

module.exports = AppHandler;