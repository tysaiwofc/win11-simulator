document.addEventListener('DOMContentLoaded', () => {
    const videoElement = document.getElementById('video-element');
    const videoInfo = document.getElementById('video-info');
    
    // Receber o arquivo a ser aberto
    window.electronAPI.receiveFileToOpen((event, filePath) => {
      playVideo(filePath);
    });
    
    // Reproduzir vídeo
    function playVideo(filePath) {
      videoElement.src = `file://${filePath}`;
      videoInfo.textContent = filePath.split('/').pop();
      
      videoElement.addEventListener('loadedmetadata', () => {
        videoElement.play().catch(e => console.log('Autoplay prevented:', e));
      });
    }
    
    // Configuração básica da janela
    function setupWindowControls() {
      document.querySelector('.window-control.minimize').addEventListener('click', () => {
        window.electronAPI.minimizeWindow();
      });
      
      document.querySelector('.window-control.maximize').addEventListener('click', () => {
        window.electronAPI.maximizeWindow();
      });
      
      document.querySelector('.window-control.close').addEventListener('click', () => {
        window.electronAPI.closeWindow();
      });
    }
    
    setupWindowControls();
  });