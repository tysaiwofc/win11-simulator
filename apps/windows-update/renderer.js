class WindowsUpdate {
    constructor() {
      // Elementos da UI
      this.elements = {
        statusMessage: document.getElementById('status-message'),
        lastChecked: document.getElementById('last-checked'),
        updateDetails: document.getElementById('update-details'),
        updateDescription: document.getElementById('update-description'),
        updateVersion: document.getElementById('update-version'),
        updateSize: document.getElementById('update-size'),
        progressContainer: document.getElementById('progress-container'),
        progressFill: document.getElementById('progress-fill'),
        progressText: document.getElementById('progress-text'),
        downloadSpeed: document.getElementById('download-speed'),
        checkUpdatesBtn: document.getElementById('check-updates'),
        downloadUpdatesBtn: document.getElementById('download-updates'),
        installUpdatesBtn: document.getElementById('install-updates'),
        pauseDownloadBtn: document.getElementById('pause-download'),
        updateHistory: document.getElementById('update-history'),
        viewHistoryLink: document.getElementById('view-history'),
        viewSettingsLink: document.getElementById('view-settings')
      };
  
      // Estado do aplicativo
      this.state = {
        isChecking: false,
        isDownloading: false,
        isPaused: false,
        updateAvailable: false,
        updateDownloaded: false
      };
  
      // Configura os listeners
      this.setupListeners();
      this.setupElectronListeners();
  
      // Verifica atualizações ao iniciar
      this.checkForUpdates();
    }
  
    setupListeners() {
      this.elements.checkUpdatesBtn.addEventListener('click', () => this.checkForUpdates());
      this.elements.downloadUpdatesBtn.addEventListener('click', () => this.downloadUpdates());
      this.elements.installUpdatesBtn.addEventListener('click', () => this.installUpdates());
      this.elements.pauseDownloadBtn.addEventListener('click', () => this.togglePauseDownload());
      this.elements.viewHistoryLink.addEventListener('click', (e) => {
        e.preventDefault();
        this.toggleHistory();
      });
      this.elements.viewSettingsLink.addEventListener('click', (e) => {
        e.preventDefault();
        this.showSettings();
      });
    }
  
    setupElectronListeners() {
      window.electronAPI.onUpdateStatus((event, message) => {
        this.updateStatus(message);
      });
  
      window.electronAPI.onDownloadProgress((event, progress) => {
        this.updateDownloadProgress(progress);
      });
    }
  
    async checkForUpdates() {
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
  
      try {
        const result = await window.electronAPI.checkForUpdates();
        if (!result) {
          this.updateStatus("Você está atualizado");
          this.updateLastChecked();
          this.elements.checkUpdatesBtn.disabled = false;
        }
      } catch (error) {
        this.updateStatus("Erro ao verificar atualizações");
        console.error("Update check error:", error);
        this.elements.checkUpdatesBtn.disabled = false;
      }
  
      this.setState({ isChecking: false });
    }
  
    async downloadUpdates() {
      this.setState({
        isDownloading: true,
        isPaused: false
      });
  
      this.updateStatus("Baixando atualizações...");
      this.elements.downloadUpdatesBtn.classList.add('hidden');
      this.elements.pauseDownloadBtn.classList.remove('hidden');
      this.elements.progressContainer.classList.remove('hidden');
  
      try {
        await window.electronAPI.downloadUpdate();
      } catch (error) {
        this.updateStatus("Erro ao baixar atualizações");
        console.error("Download error:", error);
        this.elements.downloadUpdatesBtn.classList.remove('hidden');
        this.elements.pauseDownloadBtn.classList.add('hidden');
      }
    }
  
    async installUpdates() {
      const shouldInstall = await window.electronAPI.showReadyDialog({
        version: this.state.updateInfo?.version
      });
  
      if (shouldInstall) {
        window.electronAPI.installUpdate();
      }
    }
  
    togglePauseDownload() {
      this.setState({ isPaused: !this.state.isPaused });
  
      if (this.state.isPaused) {
        this.updateStatus("Download pausado");
        this.elements.pauseDownloadBtn.textContent = "Continuar";
      } else {
        this.updateStatus("Baixando atualizações...");
        this.elements.pauseDownloadBtn.textContent = "Pausar";
        this.downloadUpdates();
      }
    }
  
    toggleHistory() {
      this.elements.updateHistory.classList.toggle('hidden');
    }
  
    showSettings() {
      // Implementar diálogo de configurações se necessário
      console.log("Mostrar configurações avançadas");
    }
  
    updateStatus(message) {
      this.elements.statusMessage.textContent = message;
    }
  
    updateLastChecked() {
      const now = new Date();
      const formattedDate = now.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      this.elements.lastChecked.textContent = `Última verificação: ${formattedDate}`;
    }
  
    updateDownloadProgress(progress) {
      const percent = Math.floor(progress.percent);
      this.elements.progressFill.style.width = `${percent}%`;
      this.elements.progressText.textContent = `${percent}% concluído`;
  
      // Calcular velocidade de download
      let speed = "Velocidade: ";
      if (progress.bytesPerSecond < 1024) {
        speed += `${progress.bytesPerSecond} B/s`;
      } else if (progress.bytesPerSecond < 1024 * 1024) {
        speed += `${(progress.bytesPerSecond / 1024).toFixed(1)} KB/s`;
      } else {
        speed += `${(progress.bytesPerSecond / (1024 * 1024)).toFixed(1)} MB/s`;
      }
      this.elements.downloadSpeed.textContent = speed;
    }
  
    showUpdateAvailable(info) {
      this.setState({
        updateAvailable: true,
        updateInfo: info
      });
  
      this.updateStatus("Atualizações disponíveis");
      this.updateLastChecked();
      
      this.elements.updateDescription.textContent = info.description || "Atualização de segurança e desempenho";
      this.elements.updateVersion.textContent = `Versão: ${info.version}`;
      
      // Simular tamanho de download (em uma implementação real, isso viria do servidor)
      const sizeInMB = Math.round(Math.random() * 300) + 50;
      this.elements.updateSize.textContent = `Tamanho: ${sizeInMB} MB`;
      
      this.elements.updateDetails.classList.remove('hidden');
      this.elements.downloadUpdatesBtn.classList.remove('hidden');
      this.elements.checkUpdatesBtn.disabled = false;
    }
  
    showUpdateDownloaded(info) {
      this.setState({
        updateDownloaded: true,
        isDownloading: false
      });
  
      this.updateStatus("Atualizações prontas para instalar");
      this.elements.progressFill.style.width = "100%";
      this.elements.progressText.textContent = "100% concluído";
      this.elements.downloadUpdatesBtn.classList.add('hidden');
      this.elements.pauseDownloadBtn.classList.add('hidden');
      this.elements.installUpdatesBtn.classList.remove('hidden');
    }
  
    setState(newState) {
      this.state = { ...this.state, ...newState };
    }
  }
  
  // Inicializa o aplicativo quando o DOM estiver pronto
  document.addEventListener('DOMContentLoaded', () => {
    new WindowsUpdate();
  });