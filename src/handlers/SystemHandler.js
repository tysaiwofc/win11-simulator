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
    } catch {
      await fs.writeFile(this.firstRunFile, '');
      return true;
    }
  }

  async getDesktopItems() {
    const desktopPath = path.join(this.baseDir, 'desktop');
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