const { app } = require('electron');
const os = require('os');
const path = require('path');

class ConfigHandler {
  constructor() {
    // Usando importação dinâmica para importar o electron-store
    (async () => {
      const { default: Store } = await import('electron-store');
      this.configStore = new Store({
        name: 'globalConfig',
        cwd: path.join(os.homedir(), 'WindowsSimulatorFiles'),
      });

      this.setDefaultConfig();
    })();
  }

  setDefaultConfig() {
    if (!this.configStore.has('wallpaper')) {
      this.configStore.set('wallpaper', 'https://i.imgur.com/ne4kFZd.jpeg');
    }
  }

  getGlobalConfig() {
    return this.configStore.store;
  }

  getConfig(key) {
    return this.configStore.get(key);
  }

  setConfig(key, value) {
    this.configStore.set(key, value);
  }

  removeConfig(key) {
    this.configStore.delete(key);
  }

  clearConfig() {
    this.configStore.clear();
  }

  async saveCustomConfig(event, config) {
    for (const [key, value] of Object.entries(config)) {
      this.configStore.set(key, value);
    }
    return true;
  }
}

module.exports = ConfigHandler;
