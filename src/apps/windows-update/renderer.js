class WindowsUpdate {
  constructor() {
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
    for (const [key, element] of Object.entries(this.elements)) {
      if (!element) {
        console.error(`Elemento com ID '${key}' não encontrado no DOM`);
        throw new Error(`Elemento '${key}' não encontrado`);
      }
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

    this.setupListeners();
    this.setupElectronListeners();
    this.initialize();
  }

  initialize() {
    // Carrega configurações salvas
    this.loadSettings();
    
    // Verifica atualizações ao iniciar se auto-download estiver ativado
    if (this.elements.autoDownload.checked) {
      this.checkForUpdates();
    } else {
      this.updateStatus("Pronto para verificar atualizações");
      this.updateLastChecked();
    }
  }

  loadSettings() {
    // Carregar configurações usando electronAPI.saveAppData
    window.electronAPI.getAppData('windows-update').then(data => {
      if (data) {
        this.elements.autoDownload.checked = data.autoDownload || true;
        this.elements.autoInstall.checked = data.autoInstall || false;
      } else {
        this.elements.autoDownload.checked = true;
        this.elements.autoInstall.checked = false;
      }
    }).catch(err => {
      console.error('Erro ao carregar configurações:', err);
    });
  }

  saveSettings() {
    // Salvar configurações usando electronAPI.saveAppData
    const settings = {
      autoDownload: this.elements.autoDownload.checked,
      autoInstall: this.elements.autoInstall.checked
    };
    window.electronAPI.saveAppData('windows-update', settings).catch(err => {
      console.error('Erro ao salvar configurações:', err);
    });
  }

  setupListeners() {
    this.elements.checkUpdatesBtn.addEventListener('click', () => this.checkForUpdates());
    this.elements.downloadUpdatesBtn.addEventListener('click', () => this.downloadUpdates());
    this.elements.installUpdatesBtn.addEventListener('click', () => this.installUpdates());
    
    this.elements.helpLink.addEventListener('click', (e) => {
      e.preventDefault();
      this.showHelp();
    });
    
    this.elements.autoDownload.addEventListener('change', () => this.saveSettings());
    this.elements.autoInstall.addEventListener('change', () => this.saveSettings());
  }

  setupElectronListeners() {
    // Verificar se electronAPI está definido
    if (!window.electronAPI) {
      console.error('electronAPI não está definido. Verifique o preload.js.');
      this.updateStatus('Erro: Comunicação com o aplicativo não configurada');
      return;
    }

    // Listeners disponíveis no preload.js
    window.electronAPI.onUpdateStatus((_, message) => this.updateStatus(message));
    window.electronAPI.onDownloadProgress((_, progress) => this.updateDownloadProgress(progress));
  }

  async checkForUpdates() {
    if (this.state.isChecking) return;
    
    this.setState({
      isChecking: true,
      updateAvailable: false,
      updateDownloaded: false
    });
  
    this.updateStatus("Verificando atualizações...");
    this.elements.checkUpdatesBtn.disabled = true;
    this.elements.downloadUpdatesBtn.classList.add('hidden');
    this.elements.installUpdatesBtn.classList.add('hidden');
    this.elements.updateDetails.classList.add('hidden');
    this.elements.progressContainer.classList.add('hidden');
  
    try {
      const updateAvailable = await window.electronAPI.checkForUpdates();
      
      if (!updateAvailable) {
        this.updateStatus("Você está atualizado");
        this.showNoUpdatesAvailable();
        this.elements.checkUpdatesBtn.disabled = false;
      } else {
        const mockUpdateInfo = {
          title: "Atualização do OS Simulator",
          description: "Inclui melhorias de desempenho e correções de segurança.",
          version: "1.0.1",
          size: 100 * 1024 * 1024, // 100 MB
          releaseDate: Date.now()
        };
        this.setState({ updateAvailable: true }); // Garantir que updateAvailable seja true
        this.showUpdateAvailable(mockUpdateInfo);
        this.elements.downloadUpdatesBtn.classList.remove('hidden');
        
      }
    } catch (error) {
      this.updateStatus(`Erro ao verificar atualizações: ${error.message || "Ocorreu um problema"}`);
      console.error("Erro na verificação de atualizações:", error);
    } finally {
      this.updateLastChecked();
      this.elements.checkUpdatesBtn.disabled = false;
      this.setState({ isChecking: false });
    }
  }
  
  showUpdateAvailable(info) {
    this.setState({ 
      updateAvailable: true,
      updateInfo: info
    });
  
    this.updateStatus("Atualizações disponíveis");
    this.updateLastChecked();
    
    this.elements.updateTitle.textContent = info.title || "Atualização do Windows 11 Simulator";
    this.elements.updateDescription.textContent = info.description || "Esta atualização inclui melhorias de desempenho e correções de segurança.";
    this.elements.updateVersion.textContent = `Versão: ${info.version}`;
    this.elements.updateSize.textContent = `Tamanho: ${this.formatUpdateSize(info.size)}`;
    this.elements.updateDate.textContent = `Disponível desde: ${new Date(info.releaseDate || Date.now()).toLocaleDateString('pt-BR')}`;
    
    this.elements.updateDetails.classList.remove('hidden');
    this.elements.downloadUpdatesBtn.classList.remove('hidden');
    
    // Só baixar automaticamente se updateAvailable for true
    if (this.elements.autoDownload.checked && this.state.updateAvailable) {
      this.downloadUpdates();
    }
  }
  async downloadUpdates() {
    if (this.state.isDownloading) return;
    
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
      // Assumir que download concluído implica atualização pronta
      this.showUpdateDownloaded(this.state.updateInfo);
    } catch (error) {
      this.updateStatus(`Erro ao baixar atualizações: ${error.message || "Ocorreu um problema"}`);
      console.error("Erro no download:", error);
      this.elements.downloadUpdatesBtn.classList.remove('hidden');
      this.setState({ isDownloading: false });
    }
  }

  async installUpdates() {
    try {
      const shouldInstall = await window.electronAPI.showReadyDialog({
        version: this.state.updateInfo?.version || "Desconhecida"
      });

      if (shouldInstall) {
        this.updateStatus("Preparando para instalar...");
        await window.electronAPI.installUpdate();
      }
    } catch (error) {
      this.updateStatus(`Erro ao instalar atualizações: ${error.message || "Ocorreu um problema"}`);
      console.error("Erro na instalação:", error);
    }
  }

  showHelp() {
    window.electronAPI.openExternal("https://support.microsoft.com/windows");
  }

  updateStatus(message) {
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
    
    const bytesPerSecond = progress.bytesPerSecond;
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
      const remainingBytes = progress.total - progress.transferred;
      const secondsRemaining = remainingBytes / bytesPerSecond;
      this.elements.timeRemaining.textContent = this.formatTimeRemaining(secondsRemaining);
    }
    
    const downloadedMB = (progress.transferred / (1024 * 1024)).toFixed(1);
    const totalMB = (progress.total / (1024 * 1024)).toFixed(1);
    this.elements.downloadedSize.textContent = `Baixado: ${downloadedMB} MB de ${totalMB} MB`;
  }

  formatTimeRemaining(seconds) {
    if (seconds < 60) {
      return `Tempo restante: ${Math.ceil(seconds)} segundos`;
    } else if (seconds < 3600) {
      return `Tempo restante: ${Math.ceil(seconds / 60)} minutos`;
    } else {
      return `Tempo restante: ${Math.ceil(seconds / 3600)} horas`;
    }
  }



  showUpdateDownloaded(info) {
    this.setState({ 
      updateDownloaded: true,
      isDownloading: false
    });

    this.updateStatus("Atualizações prontas para instalar");
    this.elements.progressFill.style.width = "100%";
    this.elements.downloadPercent.textContent = "100%";
    this.elements.downloadUpdatesBtn.classList.add('hidden');
    this.elements.installUpdatesBtn.classList.remove('hidden');
    
    if (this.elements.autoInstall.checked) {
      this.installUpdates();
    }
  }

  showNoUpdatesAvailable() {
    this.updateStatus("Você está atualizado");
    this.elements.updateDetails.classList.add('hidden');
    this.elements.downloadUpdatesBtn.classList.add('hidden');
    this.elements.installUpdatesBtn.classList.add('hidden');
    this.elements.progressContainer.classList.add('hidden');
  }

  formatUpdateSize(bytes) {
    if (!bytes) return "-";
    
    const mb = bytes / (1024 * 1024);
    if (mb < 1024) {
      return `${mb.toFixed(1)} MB`;
    } else {
      return `${(mb / 1024).toFixed(1)} GB`;
    }
  }

  setState(newState) {
    this.state = { ...this.state, ...newState };
  }
}

// Inicializa o aplicativo quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
  new WindowsUpdate();
});