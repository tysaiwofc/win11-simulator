const { autoUpdater } = require('electron-updater');
const { dialog, ipcMain } = require('electron');
const log = require('electron-log');

class UpdaterHandler {
  constructor() {
    // Configura o logger
    autoUpdater.logger = log;
    autoUpdater.logger.transports.file.level = 'info';
    
    // Configurações padrão
    autoUpdater.autoDownload = false;
    autoUpdater.allowPrerelease = false;
    autoUpdater.autoInstallOnAppQuit = true;
    
    // Configura os listeners de eventos
    this.setupAutoUpdaterListeners();
  }

  setupAutoUpdaterListeners() {
    autoUpdater.on('checking-for-update', () => {
      this.sendStatusToRenderer('Verificando atualizações...');
    });

    autoUpdater.on('update-available', (info) => {
      this.sendStatusToRenderer(`Atualização disponível: v${info.version}`);
    });

    autoUpdater.on('update-not-available', (info) => {
      this.sendStatusToRenderer(`Você está na versão mais recente: v${info.version}`);
    });

    autoUpdater.on('error', (err) => {
      this.sendStatusToRenderer(`Erro no updater: ${err.message}`);
      log.error('Updater error:', err);
    });

    autoUpdater.on('download-progress', (progressObj) => {
      const message = `Download: ${Math.floor(progressObj.percent)}%`;
      this.sendStatusToRenderer(message);
      this.sendProgressToRenderer(progressObj);
    });

    autoUpdater.on('update-downloaded', (info) => {
      this.sendStatusToRenderer(`Atualização v${info.version} baixada`);
    });
  }

  sendStatusToRenderer(message) {
    log.info(message);
    // Envia para todas as janelas
    BrowserWindow.getAllWindows().forEach(window => {
      window.webContents.send('update-status', message);
    });
  }

  sendProgressToRenderer(progressObj) {
    BrowserWindow.getAllWindows().forEach(window => {
      window.webContents.send('download-progress', progressObj);
    });
  }

  // Handler para verificar atualizações
  checkForUpdates(event) {
    autoUpdater.checkForUpdates().catch(err => {
      log.error('Erro ao verificar atualizações:', err);
      this.sendStatusToRenderer('Erro ao verificar atualizações');
    });
    return true; // Indica que a operação foi iniciada
  }

  // Handler para baixar atualização
  downloadUpdate(event) {
    autoUpdater.downloadUpdate();
    return true;
  }

  // Handler para instalar atualização
  quitAndInstall(event) {
    autoUpdater.quitAndInstall();
    return true;
  }

  // Handler para mostrar diálogo de atualização disponível
  showUpdateAvailableDialog(event, info) {
    return dialog.showMessageBox({
      type: 'info',
      title: 'Atualização Disponível',
      message: `Uma nova versão (v${info.version}) está disponível. Deseja baixar agora?`,
      buttons: ['Baixar', 'Depois']
    }).then((result) => {
      return result.response === 0; // Retorna true se o usuário escolheu "Baixar"
    });
  }

  // Handler para mostrar diálogo de instalação pronta
  showUpdateReadyDialog(event, info) {
    return dialog.showMessageBox({
      type: 'info',
      title: 'Atualização Pronta',
      message: 'A atualização foi baixada. Reiniciar o aplicativo para instalar?',
      buttons: ['Reiniciar Agora', 'Depois']
    }).then((result) => {
      return result.response === 0; // Retorna true se o usuário escolheu "Reiniciar"
    });
  }

  // Handler para alterar configurações do updater
  setUpdaterConfig(event, config) {
    if (config.autoDownload !== undefined) {
      autoUpdater.autoDownload = config.autoDownload;
    }
    if (config.allowPrerelease !== undefined) {
      autoUpdater.allowPrerelease = config.allowPrerelease;
    }
    if (config.channel !== undefined) {
      autoUpdater.channel = config.channel;
    }
    return true;
  }
}

module.exports = UpdaterHandler;