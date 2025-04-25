const path = require('path');
const fs = require('fs').promises;
const fsSync = require('fs');
const os = require('os');
const { shell, clipboard } = require('electron');

class SystemHandler {
  constructor() {
    this.baseDir = path.join(os.homedir(), 'WindowsSimulatorFiles');
    this.firstRunFile = path.join(this.baseDir, 'first_run.flag');
  }

  async checkFirstRun() {
    try {
      await fs.access(this.firstRunFile);
      return false;
    } catch (err) {
      try {
        await fs.mkdir(this.baseDir, { recursive: true });
        await fs.writeFile(this.firstRunFile, '');
        return true;
      } catch (writeErr) {
        console.error("Erro ao criar first_run.flag:", writeErr);
        throw writeErr;
      }
    }
  }
  

  async getDesktopItems() {
    const desktopPath = path.join(this.baseDir, 'desktop');
    try {
      await fs.mkdir(desktopPath, { recursive: true });
      const files = await fs.readdir(desktopPath);
      const desktopItems = [];
  
      for (const file of files) {
        const itemPath = path.join(desktopPath, file);
        const isDirectory = fsSync.statSync(itemPath).isDirectory();
        let item = {
          name: file,
          path: itemPath,
          isDirectory,
          icon: isDirectory ? 'folder' : 'file'
        };
  
        // Verificar se é uma pasta e contém o arquivo 'data.json'
        if (isDirectory) {
          const dataJsonPath = path.join(itemPath, 'data.json');
          if (fsSync.existsSync(dataJsonPath)) {
            const data = JSON.parse(await fs.readFile(dataJsonPath, 'utf-8'));
            item = {
              ...item,
              displayName: data.displayName || file,
              icon: data.icon || 'folder',  // Use 'folder' como padrão
              dir: itemPath,
              type: data.displayName ? 'app' : '',
              name: data.dir || file
            };
          }
        } else if (file.endsWith('.atalho')) {
          // Verificar se é um arquivo .atalho e contém o JSON
          const shortcutJsonPath = path.join(itemPath);
          if (fsSync.existsSync(shortcutJsonPath)) {
            const data = JSON.parse(await fs.readFile(shortcutJsonPath, 'utf-8'));
            console.log(data)
            item = {
              ...item,
              displayName: data.displayName || file.replace('.atalho', ''),
              icon: data.icon || 'file',  // Use o ícone do atalho, se fornecido
              dir: data.dir || itemPath,  // Caminho para o diretório do atalho
              type: 'app',  // Tipo de atalho tratado como 'app'
              description: data.description || '',
              version: data.version || '0.0.0',
              name: data.dir
            };
          }
        }
  
        desktopItems.push(item);
      }
  
      return desktopItems;
    } catch (error) {
      console.error('Error reading desktop items:', error);
      return [];
    }
  }
  
  

  hasClipboardItems() {
    return clipboard.readText().length > 0;
  }

  async pasteToDesktop() {
    try {
      const text = clipboard.readText();
      if (text) {
        const desktopPath = path.join(this.baseDir, 'desktop', `pasted-${Date.now()}.txt`);
        await fs.writeFile(desktopPath, text);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error pasting to desktop:', error);
      throw error;
    }
  }
}

module.exports = SystemHandler;