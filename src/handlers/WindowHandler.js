const { BrowserWindow, shell, ipcMain } = require('electron');

class WindowHandler {
  minimizeWindow(event) {
    BrowserWindow.fromWebContents(event.sender).minimize();
  }

  maximizeWindow(event) {
    const window = BrowserWindow.fromWebContents(event.sender);
    if (window.isMaximized()) {
      window.unmaximize();
    } else {
      window.maximize();
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

  restartApp() {
    app.relaunch();
    app.exit(0);
  }
}

module.exports = WindowHandler;