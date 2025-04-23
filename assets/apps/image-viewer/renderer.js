document.addEventListener('DOMContentLoaded', () => {
    const imageDisplay = document.getElementById('image-display');
    const imageInfo = document.getElementById('image-info');
    const prevButton = document.getElementById('prev-image');
    const nextButton = document.getElementById('next-image');
    
    let currentImagePath = '';
    let currentDirectory = '';
    let directoryFiles = [];
    let currentIndex = 0;
    
    // Receber o arquivo a ser aberto
    // No renderer.js do Image Viewer
window.electronAPI.receiveFileToOpen(async (filePath) => {
    try {
      if (!filePath || typeof filePath !== 'string') {
        throw new Error('Invalid file path received');
      }
  
      console.log('Received file to open:', filePath); // Debug
      
      const { directory, files } = await window.electronAPI.getDirectoryFromFile(filePath);
      const imageFiles = files.filter(file => 
        !file.isDirectory && window.electronAPI.isImageFile(file.name)
      );
  
      const currentIndex = imageFiles.findIndex(file => file.path === filePath);
      
      if (currentIndex !== -1) {
        document.getElementById('image-display').src = `file://${filePath}`;
        // Restante da sua lógica...
      } else {
        throw new Error('File not found in directory');
      }
    } catch (error) {
      console.error('Error loading image:', error);
      alert(`Failed to load image: ${error.message}`);
      window.close(); // Fecha o visualizador se não conseguir carregar
    }
  });
    
    // Carregar imagem
    async function loadImage(filePath) {
        alert(filePath)
      try {
        currentImagePath = filePath;
        const directoryInfo = await window.electronAPI.getDirectoryFromFile(filePath);
        currentDirectory = directoryInfo.directory;
        directoryFiles = directoryInfo.files.filter(file => 
          window.electronAPI.isImageFile(file.name)
        );
        
        currentIndex = directoryFiles.findIndex(file => file.path === filePath);
        
        imageDisplay.src = `file://${filePath}`;
        updateImageInfo();
      } catch (error) {
        alert(error)
        console.error('Error loading image:', error);
      }
    }
    
    // Navegação entre imagens
    prevButton.addEventListener('click', () => {
      if (currentIndex > 0) {
        currentIndex--;
        loadImage(directoryFiles[currentIndex].path);
      }
    });
    
    nextButton.addEventListener('click', () => {
      if (currentIndex < directoryFiles.length - 1) {
        currentIndex++;
        loadImage(directoryFiles[currentIndex].path);
      }
    });
    
    // Atualizar informações da imagem
    function updateImageInfo() {
      if (directoryFiles.length > 0) {
        imageInfo.textContent = `${currentIndex + 1}/${directoryFiles.length} - ${directoryFiles[currentIndex].name}`;
      }
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