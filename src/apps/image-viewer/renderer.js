document.addEventListener('DOMContentLoaded', () => {
  // Elementos DOM
  const imageDisplay = document.getElementById('image-display');
  const imageInfo = document.getElementById('image-info');
  const prevButton = document.getElementById('prev-image');
  const nextButton = document.getElementById('next-image');
  const zoomInBtn = document.getElementById('zoom-in-btn');
  const zoomOutBtn = document.getElementById('zoom-out-btn');
  const zoomResetBtn = document.getElementById('zoom-reset-btn');
  const rotateLeftBtn = document.getElementById('rotate-left-btn');
  const rotateRightBtn = document.getElementById('rotate-right-btn');
  const fullscreenBtn = document.getElementById('fullscreen-btn');
  const slideshowBtn = document.getElementById('slideshow-btn');
  const loadingSpinner = document.getElementById('loading-spinner');
  const imageContainer = document.getElementById('image-container');
  const contextMenu = document.getElementById('context-menu');
  
  // Variáveis de estado
  let currentImagePath = '';
  let currentDirectory = '';
  let directoryFiles = [];
  let currentIndex = 0;
  let currentZoom = 1;
  let currentRotation = 0;
  let isDragging = false;
  let startX, startY, translateX = 0, translateY = 0;
  let isSlideshowActive = false;
  let slideshowInterval;

  // Receber o arquivo a ser aberto
  window.electronAPI.receiveFileToOpen(async (event, filePath) => {
    try {
      if (!filePath || typeof filePath !== 'string') {
        throw new Error('Caminho do arquivo inválido');
      }
      
      showLoading(true);
      await loadImage(filePath);
      showLoading(false);
    } catch (error) {
      console.error('Erro ao carregar imagem:', error);
      showLoading(false);
      window.electronAPI.showErrorDialog('Erro ao abrir imagem', error.message);
    }
  });

  // Carregar imagem
  async function loadImage(filePath) {
    try {
      currentImagePath = filePath;
      const directoryInfo = await window.electronAPI.getDirectoryFromFile(filePath);
      currentDirectory = directoryInfo.directory;
      
      // Filtrar apenas arquivos de imagem
      directoryFiles = directoryInfo.files.filter(file => 
        !file.isDirectory && window.electronAPI.isImageFile(file.name)
      );
      
      currentIndex = directoryFiles.findIndex(file => file.path === filePath);
      
      if (currentIndex === -1) {
        throw new Error('Arquivo não encontrado no diretório');
      }
      
      // Resetar zoom e rotação para nova imagem
      currentZoom = 1;
      currentRotation = 0;
      translateX = 0;
      translateY = 0;
      
      // Carregar imagem
      imageDisplay.src = `file://${filePath}`;
      
      // Atualizar UI
      updateImageInfo();
      updateNavigationButtons();
      applyImageTransform();
    } catch (error) {
      throw error;
    }
  }

  // Atualizar informações da imagem
  function updateImageInfo() {
    if (directoryFiles.length > 0 && currentIndex >= 0) {
      const file = directoryFiles[currentIndex];
      const fileSize = formatFileSize(file.size);
      
      imageInfo.textContent = `${file.name} • ${currentIndex + 1} de ${directoryFiles.length} • ${fileSize}`;
      
      // Atualizar título da janela
      document.title = `${file.name} - Visualizador de Fotos`;
      document.querySelector('.window-title').textContent = file.name;
    }
  }

  // Formatador de tamanho de arquivo
  function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  // Atualizar estado dos botões de navegação
  function updateNavigationButtons() {
    prevButton.disabled = currentIndex <= 0;
    nextButton.disabled = currentIndex >= directoryFiles.length - 1;
  }

  // Navegação entre imagens
  prevButton.addEventListener('click', () => navigateImage(-1));
  nextButton.addEventListener('click', () => navigateImage(1));

  function navigateImage(direction) {
    const newIndex = currentIndex + direction;
    if (newIndex >= 0 && newIndex < directoryFiles.length) {
      showLoading(true);
      currentIndex = newIndex;
      loadImage(directoryFiles[currentIndex].path)
        .finally(() => showLoading(false));
    }
  }

  // Controles de zoom
  zoomInBtn.addEventListener('click', () => zoomImage(0.1));
  zoomOutBtn.addEventListener('click', () => zoomImage(-0.1));
  zoomResetBtn.addEventListener('click', resetZoom);

  function zoomImage(amount) {
    currentZoom = Math.max(0.1, Math.min(5, currentZoom + amount));
    applyImageTransform();
  }

  function resetZoom() {
    currentZoom = 1;
    translateX = 0;
    translateY = 0;
    applyImageTransform();
  }

  // Controles de rotação
  rotateLeftBtn.addEventListener('click', () => rotateImage(-90));
  rotateRightBtn.addEventListener('click', () => rotateImage(90));

  function rotateImage(degrees) {
    currentRotation = (currentRotation + degrees) % 360;
    applyImageTransform();
  }

  // Aplicar transformações na imagem
  function applyImageTransform() {
    imageDisplay.style.transform = `translate(-50%, -50%) translate(${translateX}px, ${translateY}px) scale(${currentZoom}) rotate(${currentRotation}deg)`;
  }

  // Arrastar imagem (pan)
  imageDisplay.addEventListener('mousedown', startDrag);
  document.addEventListener('mousemove', dragImage);
  document.addEventListener('mouseup', endDrag);

  function startDrag(e) {
    if (currentZoom <= 1) return;
    
    isDragging = true;
    imageDisplay.classList.add('dragging');
    startX = e.clientX - translateX;
    startY = e.clientY - translateY;
  }

  function dragImage(e) {
    if (!isDragging) return;
    
    translateX = e.clientX - startX;
    translateY = e.clientY - startY;
    applyImageTransform();
  }

  function endDrag() {
    isDragging = false;
    imageDisplay.classList.remove('dragging');
  }

  // Tela cheia
  fullscreenBtn.addEventListener('click', toggleFullscreen);

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      imageContainer.requestFullscreen().catch(err => {
        console.error(`Erro ao entrar em tela cheia: ${err.message}`);
      });
      fullscreenBtn.innerHTML = '<i class="fas fa-compress"></i>';
    } else {
      document.exitFullscreen();
      fullscreenBtn.innerHTML = '<i class="fas fa-expand"></i>';
    }
  }

  // Apresentação de slides
  slideshowBtn.addEventListener('click', toggleSlideshow);

  function toggleSlideshow() {
    if (isSlideshowActive) {
      stopSlideshow();
    } else {
      startSlideshow();
    }
  }

  function startSlideshow() {
    if (directoryFiles.length <= 1) return;
    
    isSlideshowActive = true;
    slideshowBtn.classList.add('active');
    slideshowBtn.innerHTML = '<i class="fas fa-stop"></i>';
    
    slideshowInterval = setInterval(() => {
      if (currentIndex < directoryFiles.length - 1) {
        navigateImage(1);
      } else {
        navigateImage(-(directoryFiles.length - 1));
      }
    }, 3000); // 3 segundos por imagem
  }

  function stopSlideshow() {
    isSlideshowActive = false;
    slideshowBtn.classList.remove('active');
    slideshowBtn.innerHTML = '<i class="fas fa-play"></i>';
    clearInterval(slideshowInterval);
  }

  // Menu de contexto
  imageContainer.addEventListener('contextmenu', showContextMenu);
  document.addEventListener('click', hideContextMenu);

  function showContextMenu(e) {
    e.preventDefault();
    contextMenu.style.display = 'block';
    contextMenu.style.left = `${e.clientX}px`;
    contextMenu.style.top = `${e.clientY}px`;
  }

  function hideContextMenu() {
    contextMenu.style.display = 'none';
  }

  // Itens do menu de contexto
  document.getElementById('menu-open').addEventListener('click', () => {
    window.electronAPI.openImageDialog();
  });

  document.getElementById('menu-save').addEventListener('click', async () => {
    try {
      await window.electronAPI.saveImage(imageDisplay.src, currentRotation);
    } catch (error) {
      console.error('Erro ao salvar imagem:', error);
      window.electronAPI.showErrorDialog('Erro ao salvar imagem', error.message);
    }
  });

  document.getElementById('menu-copy').addEventListener('click', async () => {
    try {
      await window.electronAPI.copyImageToClipboard(imageDisplay.src);
    } catch (error) {
      console.error('Erro ao copiar imagem:', error);
      window.electronAPI.showErrorDialog('Erro ao copiar imagem', error.message);
    }
  });

  document.getElementById('menu-rotate-left').addEventListener('click', () => rotateImage(-90));
  document.getElementById('menu-rotate-right').addEventListener('click', () => rotateImage(90));

  // Atalhos de teclado
  document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    
    switch (e.key) {
      case 'ArrowLeft':
        if (currentIndex > 0) navigateImage(-1);
        break;
      case 'ArrowRight':
        if (currentIndex < directoryFiles.length - 1) navigateImage(1);
        break;
      case '+':
      case '=':
        if (e.ctrlKey) rotateImage(90);
        else zoomImage(0.1);
        break;
      case '-':
        if (e.ctrlKey) rotateImage(-90);
        else zoomImage(-0.1);
        break;
      case '0':
        resetZoom();
        break;
      case 'F5':
        toggleSlideshow();
        break;
      case 'F11':
        toggleFullscreen();
        break;
      case 'Escape':
        if (document.fullscreenElement) {
          document.exitFullscreen();
        }
        break;
    }
  });

  // Mostrar/ocultar spinner de carregamento
  function showLoading(show) {
    loadingSpinner.style.display = show ? 'block' : 'none';
    imageDisplay.style.opacity = show ? '0.5' : '1';
  }

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