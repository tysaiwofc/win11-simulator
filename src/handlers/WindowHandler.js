const { BrowserWindow, shell, ipcMain } = require('electron');

class WindowHandler {
  constructor() {
    this.setupIPC();
  }

  setupIPC() {
    ipcMain.handle('window-control', (event, action) => {
      const win = BrowserWindow.fromWebContents(event.sender);
      if (!win) return;

      switch (action) {
        case 'minimize':
          win.minimize();
          break;
        case 'maximize':
          if (win.isMaximized()) win.restore();
          else win.maximize();
          break;
        case 'close':
          win.close();
          break;
      }
    });

    ipcMain.handle('open-external', (_, url) => {
      try {
        shell.openExternal(url);
        return true;
      } catch (error) {
        console.error('Error opening external URL:', error);
        return false;
      }
    });
  }
}

module.exports = WindowHandler;