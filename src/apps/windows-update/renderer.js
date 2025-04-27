document.querySelector('.window-control.minimize')?.addEventListener('click', () => {
  window.electronAPI?.minimizeWindow();
});

document.querySelector('.window-control.close')?.addEventListener('click', () => {
  window.electronAPI?.closeWindow();
});

class WindowsUpdate {
  constructor() {
    // Verificação inicial do electronAPI
    if (!window.electronAPI) {
      console.error('electronAPI não está disponível');
      this.showCriticalError('Comunicação com o aplicativo não configurada');
      return;
    }

    this.elements = {
      statusMessage: document.getElementById('status-message'),
      lastChecked: document.getElementById('last-checked'),
      updateDetails: document.getElementById('update-details'),
      updateTitle: document.getElementById('update-title'),
      updateDescription: document.getElementById('update-description'),
      updateVersion: document.getElementById('update-version'),
      updateSize: document.getElementById('update-size'),
      updateDate: document.getElementById('update-date'),
      progressContainer: document.getElementById('progress-container'),
      progressFill: document.getElementById('progress-fill'),
      downloadPercent: document.getElementById('download-percent'),
      downloadSpeed: document.getElementById('download-speed'),
      timeRemaining: document.getElementById('time-remaining'),
      downloadedSize: document.getElementById('downloaded-size'),
      checkUpdatesBtn: document.getElementById('check-updates'),
      downloadUpdatesBtn: document.getElementById('download-updates'),
      installUpdatesBtn: document.getElementById('install-updates'),
      helpLink: document.getElementById('help-link'),
      autoDownload: document.getElementById('auto-download'),
      autoInstall: document.getElementById('auto-install')
    };

    // Validação de elementos DOM
    try {
      for (const [key, element] of Object.entries(this.elements)) {
        if (!element) {
          throw new Error(`Elemento com ID '${key}' não encontrado no DOM`);
        }
      }
    } catch (error) {
      console.error(error.message);
      this.showCriticalError('Configuração da interface incompleta');
      return;
    }

    this.state = {
      isChecking: false,
      isDownloading: false,
      updateAvailable: false,
      updateDownloaded: false,
      updateInfo: null,
      downloadStartTime: null,
      lastBytesReceived: 0
    };

    console.log("WindowsUpdate inicializado. Estado inicial:", this.state);

    this.setupListeners();
    this.setupElectronListeners();
    this.initialize();
  }

  showCriticalError(message) {
    if (this.elements.statusMessage) {
      this.elements.statusMessage.textContent = `ERRO: ${message}`;
      this.elements.statusMessage.style.color = 'red';
    }
    console.error(message);
  }

  initialize() {
    this.loadSettings();
    this.updateStatus("Pronto para verificar atualizações");
    this.updateLastChecked();
    this.resetUIState();
  }

  async loadSettings() {
    try {
      const data = await window.electronAPI.getAppData('windows-update');
      this.elements.autoDownload.checked = data?.autoDownload ?? true;
      this.elements.autoInstall.checked = data?.autoInstall ?? false;
    } catch (err) {
      console.error('Erro ao carregar configurações:', err);
      // Usar valores padrão
      this.elements.autoDownload.checked = true;
      this.elements.autoInstall.checked = false;
    }
  }

  async saveSettings() {
    const settings = {
      autoDownload: this.elements.autoDownload.checked,
      autoInstall: this.elements.autoInstall.checked
    };
    
    try {
      await window.electronAPI.saveAppData('windows-update', settings);
    } catch (err) {
      console.error('Erro ao salvar configurações:', err);
    }
  }

  setupListeners() {
    // Debounce para prevenir múltiplos cliques
    const debounce = (func, delay) => {
      let timeout;
      return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), delay);
      };
    };

    this.elements.checkUpdatesBtn.addEventListener('click', 
      debounce(() => this.checkForUpdates(), 300));
    
    this.elements.downloadUpdatesBtn.addEventListener('click', 
      debounce(() => this.downloadUpdates(), 300));
    
    this.elements.installUpdatesBtn.addEventListener('click', 
      debounce(() => this.installUpdates(), 300));
    
    this.elements.helpLink.addEventListener('click', (e) => {
      e.preventDefault();
      this.showHelp();
    });
    
    this.elements.autoDownload.addEventListener('change', () => this.saveSettings());
    this.elements.autoInstall.addEventListener('change', () => this.saveSettings());
  }

  setupElectronListeners() {
    try {
      window.electronAPI.onUpdateStatus((_, message) => {
        this.updateStatus(message);
      });
      
      window.electronAPI.onDownloadProgress((_, progress) => {
        this.updateDownloadProgress(progress);
      });
    } catch (error) {
      console.error('Erro ao configurar listeners do Electron:', error);
      this.updateStatus('Erro na comunicação com o aplicativo');
    }
  }

  async checkForUpdates() {
    if (this.state.isChecking) {
      console.log("Verificação já em andamento. Ignorando nova solicitação.");
      return;
    }
    
    console.log("Iniciando verificação de atualizações...");
    
    this.setState({
      isChecking: true,
      updateAvailable: false,
      updateDownloaded: false,
      updateInfo: null
    });
  
    this.updateStatus("Verificando atualizações...");
    this.resetUIState();
    this.elements.checkUpdatesBtn.disabled = true;
  
    try {
      const updateAvailable = await window.electronAPI.checkForUpdates();
      
      if (!updateAvailable) {
        this.updateStatus("Você está atualizado");
        this.showNoUpdatesAvailable();
      } else {
        // Removido o mock de dados - agora usa a resposta real da API
        const updateInfo = await window.electronAPI.getUpdateInfo();
        console.log(updateInfo)
        this.showUpdateAvailable(updateInfo);
      }
    } catch (error) {
      console.error("Erro na verificação de atualizações:", error);
      this.updateStatus(`Erro ao verificar atualizações: ${error.message || "Ocorreu um problema"}`);
    } finally {
      this.updateLastChecked();
      this.setState({ isChecking: false });
      this.elements.checkUpdatesBtn.disabled = false;
      this.validateState();
    }
  }
  
  resetUIState() {
    this.elements.updateDetails.classList.add('hidden');
    this.elements.downloadUpdatesBtn.classList.add('hidden');
    this.elements.installUpdatesBtn.classList.add('hidden');
    this.elements.progressContainer.classList.add('hidden');
  }

  async downloadUpdates() {
    if (this.state.isDownloading) {
      console.log("Download já em andamento. Ignorando nova solicitação.");
      return;
    }
    
    if (!this.state.updateAvailable) {
      this.updateStatus("Verifique as atualizações primeiro");
      console.warn("Tentativa de download sem atualização disponível");
      return;
    }
    
    console.log("Iniciando download de atualizações...");
    
    this.setState({ 
      isDownloading: true,
      downloadStartTime: Date.now(),
      lastBytesReceived: 0
    });

    this.updateStatus("Baixando atualizações...");
    this.elements.downloadUpdatesBtn.classList.add('hidden');
    this.elements.progressContainer.classList.remove('hidden');
    this.elements.progressFill.style.width = "0%";
    this.elements.downloadPercent.textContent = "0%";

    try {
      await window.electronAPI.downloadUpdate();
      const updateInfo = await window.electronAPI.getUpdateInfo();
      this.showUpdateDownloaded(updateInfo);
    } catch (error) {
      console.error("Erro no download:", error);
      this.updateStatus(`Erro ao baixar atualizações: ${error.message || "Ocorreu um problema"}`);
      this.elements.downloadUpdatesBtn.classList.remove('hidden');
      this.setState({ isDownloading: false });
      this.validateState();
    }
  }

  async installUpdates() {
    if (!this.state.updateDownloaded) {
      this.updateStatus("Nenhuma atualização baixada para instalar");
      console.warn("Tentativa de instalação sem atualização baixada");
      return;
    }
    
    try {
      const shouldInstall = await window.electronAPI.showReadyDialog({
        version: this.state.updateInfo?.version || "Desconhecida"
      });

      if (shouldInstall) {
        this.updateStatus("Preparando para instalar...");
        await window.electronAPI.installUpdate();
      }
    } catch (error) {
      console.error("Erro na instalação:", error);
      this.updateStatus(`Erro ao instalar atualizações: ${error.message || "Ocorreu um problema"}`);
    }
  }

  showHelp() {
    try {
      window.electronAPI.openExternal("https://support.microsoft.com/windows");
    } catch (error) {
      console.error("Erro ao abrir ajuda:", error);
      this.updateStatus("Não foi possível abrir o link de ajuda");
    }
  }

  showUpdateAvailable(info) {

    this.setState({ 
      updateAvailable: true,
      updateInfo: info
    });
  
    this.updateStatus("Atualizações disponíveis");
    this.updateLastChecked();
    
    // this.elements.updateTitle.textContent = info.title || "Atualização do Windows 11 Simulator";
    // this.elements.updateDescription.textContent = info.description || "Esta atualização inclui melhorias de desempenho e correções de segurança.";
    // this.elements.updateVersion.textContent = `Versão: ${info.version || "Desconhecida"}`;
    // this.elements.updateSize.textContent = `Tamanho: ${this.formatUpdateSize(info.size)}`;
    // this.elements.updateDate.textContent = `Disponível desde: ${new Date(info.releaseDate || Date.now()).toLocaleDateString('pt-BR')}`;
    
    this.elements.updateDetails.classList.remove('hidden');
    this.elements.downloadUpdatesBtn.classList.remove('hidden');
    
    if (this.elements.autoDownload.checked) {
      this.downloadUpdates();
    }
    
    this.validateState();
  }

  showUpdateDownloaded(info) {
    // if (!info) {
    //   console.error("Nenhuma informação de atualização fornecida");
    //   return;
    // }
    
    console.log("Mostrando atualização pronta para instalar:", info);
    
    this.setState({ 
      updateDownloaded: true,
      isDownloading: false,
      updateInfo: info
    });

    this.updateStatus("Atualizações prontas para instalar");
    this.elements.progressFill.style.width = "100%";
    this.elements.downloadPercent.textContent = "100%";
    this.elements.downloadUpdatesBtn.classList.add('hidden');
    this.elements.installUpdatesBtn.classList.remove('hidden');
    
    if (this.elements.autoInstall.checked) {
      this.installUpdates();
    }
    
    this.validateState();
  }

  showNoUpdatesAvailable() {
    console.log("Nenhuma atualização disponível");
    this.updateStatus("Você está atualizado");
    this.resetUIState();
    this.validateState();
  }

  updateStatus(message) {
    console.log(`Atualizando status: ${message}`);
    this.elements.statusMessage.textContent = message;
  }

  updateLastChecked() {
    const now = new Date();
    const formatted = now.toLocaleDateString('pt-BR', {
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit', 
      minute: '2-digit'
    });
    this.elements.lastChecked.textContent = `Última verificação: ${formatted}`;
  }

  updateDownloadProgress(progress) {
    if (!this.state.isDownloading) return;

    const percent = Math.floor(progress.percent);
    this.elements.progressFill.style.width = `${percent}%`;
    this.elements.downloadPercent.textContent = `${percent}%`;
    
    const bytesPerSecond = progress.bytesPerSecond || 0;
    let speedText = "Velocidade: ";
    
    if (bytesPerSecond < 1024) {
      speedText += `${bytesPerSecond} B/s`;
    } else if (bytesPerSecond < 1024 * 1024) {
      speedText += `${(bytesPerSecond / 1024).toFixed(1)} KB/s`;
    } else {
      speedText += `${(bytesPerSecond / (1024 * 1024)).toFixed(1)} MB/s`;
    }
    
    this.elements.downloadSpeed.textContent = speedText;
    
    if (bytesPerSecond > 0) {
      const remainingBytes = (progress.total || 0) - (progress.transferred || 0);
      const secondsRemaining = remainingBytes / bytesPerSecond;
      this.elements.timeRemaining.textContent = this.formatTimeRemaining(secondsRemaining);
    }
    
    const downloadedMB = ((progress.transferred || 0) / (1024 * 1024)).toFixed(1);
    const totalMB = ((progress.total || 0) / (1024 * 1024)).toFixed(1);
    this.elements.downloadedSize.textContent = `Baixado: ${downloadedMB} MB de ${totalMB} MB`;
  }

  validateState() {
    console.log("Validando estado atual:", this.state);
    
    this.elements.checkUpdatesBtn.disabled = this.state.isChecking || this.state.isDownloading;
    
    if (this.state.isDownloading) {
      this.elements.downloadUpdatesBtn.classList.add('hidden');
      this.elements.installUpdatesBtn.classList.add('hidden');
    }
    
    if (this.state.updateDownloaded) {
      this.elements.installUpdatesBtn.classList.remove('hidden');
    }
    
    if (!this.state.updateAvailable) {
      this.elements.downloadUpdatesBtn.classList.add('hidden');
    }
  }

  formatTimeRemaining(seconds) {
    if (seconds <= 0) return "Calculando...";
    if (seconds < 60) {
      return `Tempo restante: ${Math.ceil(seconds)} segundos`;
    } else if (seconds < 3600) {
      return `Tempo restante: ${Math.ceil(seconds / 60)} minutos`;
    } else {
      return `Tempo restante: ${Math.ceil(seconds / 3600)} horas`;
    }
  }

  formatUpdateSize(bytes) {
    if (!bytes) return "Calculando...";
    
    const mb = bytes / (1024 * 1024);
    if (mb < 1024) {
      return `${mb.toFixed(1)} MB`;
    } else {
      return `${(mb / 1024).toFixed(1)} GB`;
    }
  }

  setState(newState) {
    console.log("Atualizando estado de:", this.state, "para:", newState);
    this.state = { ...this.state, ...newState };
    this.validateState();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  try {
    new WindowsUpdate();
  } catch (error) {
    console.error("Erro ao inicializar WindowsUpdate:", error);
    const statusElement = document.getElementById('status-message');
    if (statusElement) {
      statusElement.textContent = "Erro ao inicializar o sistema de atualização";
      statusElement.style.color = 'red';
    }
  }
});