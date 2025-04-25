const { BrowserWindow, shell, ipcMain } = require('electron');

class WindowHandler {
  minimizeWindow(event) {
    BrowserWindow.fromWebContents(event.sender).minimize();
  }

  maximizeWindow(event) {
    let win = BrowserWindow.getFocusedWindow();
    if (win) {
      // Verifica se a janela está maximizada
      if (win.isMaximized()) {
        win.restore();  // Desmaximiza a janela
      } else {
        win.maximize();  // Maximiza a janela
      }
    }
  }

  closeWindow(event) {
    BrowserWindow.fromWebContents(event.sender).close();
  }

  openExternal(event, url) {
    try {
      shell.openExternal(url);
      return true;
    } catch (error) {
      console.error('Error opening external URL:', error);
      return false;
    }
  }

}

module.exports = WindowHandler;