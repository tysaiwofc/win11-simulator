document.addEventListener('DOMContentLoaded', () => {
  const videoElement = document.getElementById('video-element');
  const videoInfo = document.getElementById('video-info');
  
  // Elementos dos controles
  const playPauseBtn = document.getElementById('play-pause-btn');
  const skipBackwardBtn = document.getElementById('skip-backward');
  const skipForwardBtn = document.getElementById('skip-forward');
  const progressBar = document.getElementById('progress-bar');
  const progressContainer = document.querySelector('.progress-container');
  const currentTimeDisplay = document.getElementById('current-time');
  const durationDisplay = document.getElementById('duration');
  const volumeBtn = document.getElementById('volume-btn');
  const volumeLevel = document.getElementById('volume-level');
  const volumeSlider = document.querySelector('.volume-slider');
  const fullscreenBtn = document.getElementById('fullscreen-btn');
  
  // Receber o arquivo a ser aberto
  window.electronAPI.receiveFileToOpen((event, filePath) => {
    playVideo(filePath);
  });
  
  // Reproduzir vídeo
  function playVideo(filePath) {
    videoElement.src = `file://${filePath}`;
    videoInfo.textContent = filePath.split('/').pop();
    
    videoElement.addEventListener('loadedmetadata', () => {
      updateTimeDisplay();
      videoElement.play().catch(e => console.log('Autoplay prevented:', e));
    });
  }
  
  // Controles de vídeo
  function togglePlayPause() {
    if (videoElement.paused) {
      videoElement.play();
      playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
    } else {
      videoElement.pause();
      playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
    }
  }
  
  function skip(seconds) {
    videoElement.currentTime += seconds;
  }
  
  function updateProgressBar() {
    const percent = (videoElement.currentTime / videoElement.duration) * 100;
    progressBar.style.width = `${percent}%`;
    updateTimeDisplay();
  }
  
  function updateTimeDisplay() {
    currentTimeDisplay.textContent = formatTime(videoElement.currentTime);
    durationDisplay.textContent = formatTime(videoElement.duration);
  }
  
  function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  
  function setProgress(e) {
    const width = this.clientWidth;
    const clickX = e.offsetX;
    const duration = videoElement.duration;
    videoElement.currentTime = (clickX / width) * duration;
  }
  
  function toggleMute() {
    videoElement.muted = !videoElement.muted;
    volumeBtn.innerHTML = videoElement.muted 
      ? '<i class="fas fa-volume-mute"></i>' 
      : '<i class="fas fa-volume-up"></i>';
  }
  
  function setVolume(e) {
    const width = this.clientWidth;
    const clickX = e.offsetX;
    const volume = Math.min(1, Math.max(0, clickX / width));
    videoElement.volume = volume;
    volumeLevel.style.width = `${volume * 100}%`;
    
    // Atualizar ícone
    if (volume === 0) {
      volumeBtn.innerHTML = '<i class="fas fa-volume-mute"></i>';
    } else if (volume < 0.5) {
      volumeBtn.innerHTML = '<i class="fas fa-volume-down"></i>';
    } else {
      volumeBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
    }
  }
  
  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      videoElement.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
      fullscreenBtn.innerHTML = '<i class="fas fa-compress"></i>';
    } else {
      document.exitFullscreen();
      fullscreenBtn.innerHTML = '<i class="fas fa-expand"></i>';
    }
  }
  
  // Event Listeners
  playPauseBtn.addEventListener('click', togglePlayPause);
  videoElement.addEventListener('click', togglePlayPause);
  skipBackwardBtn.addEventListener('click', () => skip(-10));
  skipForwardBtn.addEventListener('click', () => skip(10));
  videoElement.addEventListener('timeupdate', updateProgressBar);
  progressContainer.addEventListener('click', setProgress);
  volumeBtn.addEventListener('click', toggleMute);
  volumeSlider.addEventListener('click', setVolume);
  fullscreenBtn.addEventListener('click', toggleFullscreen);
  
  // Configura volume inicial
  videoElement.volume = 0.7;
  volumeLevel.style.width = '70%';
  
  // Configuração da janela
  function setupWindowControls() {
    document.querySelector('.window-control.minimize').addEventListener('click', () => {
      window.electronAPI.minimizeWindow();
    });
    
    document.querySelector('.window-control.close').addEventListener('click', () => {
      window.electronAPI.closeWindow();
    });
  }
  
  setupWindowControls();
});