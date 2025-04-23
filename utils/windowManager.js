class WindowManager {
    constructor() {
      this.windows = [];
      this.activeWindow = null;
    }
    
    createWindow(options) {
      const window = new BrowserWindow(options);
      this.windows.push(window);
      this.setActiveWindow(window);
      
      window.on('closed', () => {
        this.windows = this.windows.filter(w => w !== window);
        if (this.activeWindow === window) {
          this.activeWindow = this.windows[this.windows.length - 1] || null;
        }
      });
      
      window.on('focus', () => {
        this.setActiveWindow(window);
      });
      
      return window;
    }
    
    setActiveWindow(window) {
      this.activeWindow = window;
      this.windows.forEach(w => {
        if (w !== window) {
          w.webContents.send('window-blur');
        } else {
          w.webContents.send('window-focus');
        }
      });
    }
    
    getActiveWindow() {
      return this.activeWindow;
    }
  }
  
  module.exports = WindowManager;