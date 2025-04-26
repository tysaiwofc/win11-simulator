document.querySelector('.window-control.minimize').addEventListener('click', () => {
  window.electronAPI.minimizeWindow();  // Minimize a janela
});

document.querySelector('.window-control.close').addEventListener('click', () => {
  window.electronAPI.closeWindow();  // Fechar a janela
});

document.addEventListener('DOMContentLoaded', () => {
  // Elementos da UI
  const filesContainer = document.getElementById('files-container');
  const currentPathElement = document.getElementById('current-path');
  const addressBar = document.getElementById('address-bar');
  const backButton = document.getElementById('back-button');
  const forwardButton = document.getElementById('forward-button');
  const upButton = document.getElementById('up-button');
  const sidebarItems = document.querySelectorAll('.sidebar-item');
  
  // Estado
  let currentPath = 'desktop';
  let navigationHistory = ['desktop'];
  let currentHistoryIndex = 0;
  
  // Inicialização
  loadDirectory(currentPath);
  
  // Event Listeners
  backButton.addEventListener('click', goBack);
  forwardButton.addEventListener('click', goForward);
  upButton.addEventListener('click', goUp);
  
  addressBar.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      navigateTo(addressBar.value);
    }
  });
  
  sidebarItems.forEach(item => {
    item.addEventListener('click', () => {
      const path = item.dataset.path;
      navigateTo(path);
    });
  });
  
  // Funções principais
  async function loadDirectory(path) {
    try {
      
      const contents = await window.electronAPI.readDirectory(path);
      renderFiles(contents);
      currentPath = path;
      currentPathElement.textContent = path.charAt(0).toUpperCase() + path.slice(1);
      addressBar.value = path;
      
      // Atualizar histórico
      if (navigationHistory[currentHistoryIndex] !== path) {
        navigationHistory = navigationHistory.slice(0, currentHistoryIndex + 1);
        navigationHistory.push(path);
        currentHistoryIndex++;
      }
      
      updateNavigationButtons();
    } catch (error) {
      console.error('Error loading directory:', error);
      alert(`Unable to access directory: ${path}`);
      alert(error)
    }
  }
  
  function renderFiles(files) {
    filesContainer.innerHTML = '';
    
    files.forEach(async file => {
      const fileItem = document.createElement('div');
      fileItem.className = 'file-item';
      const assetsFolder = await window.electronAPI.getAssetsPath();

fileItem.innerHTML = `
  <img src="${file.isDirectory ? `${assetsFolder.replace('src', '')}` + '/icons/folder.png' : `${assetsFolder.replace('src', '')}/icons/${getFileIcon(file.name)}.png`}" alt="${file.name}">
  <span>${file.name}</span>
`;

      
      fileItem.addEventListener('click', (e) => {
        if (e.ctrlKey) {
          fileItem.classList.toggle('selected');
        } else {
          document.querySelectorAll('.file-item').forEach(item => {
            item.classList.remove('selected');
          });
          fileItem.classList.add('selected');
        }
      });
      
      fileItem.addEventListener('dblclick', () => {
        if (file.isDirectory) {
          navigateTo(file.path);
        } else {
          openFile(file);
        }
      });
      
      filesContainer.appendChild(fileItem);
    });
  }
  
  async function openFile(file) {
    try {
      await window.electronAPI.openFile(file.path);
    } catch (error) {
      console.error('Error opening file:', error);
      alert(`Unable to open file: ${file.name}`);
      alert(error)
    }
  }
  
  function navigateTo(path) {
    loadDirectory(path);
  }
  
  function goBack() {
    if (currentHistoryIndex > 0) {
      currentHistoryIndex--;
      loadDirectory(navigationHistory[currentHistoryIndex]);
    }
  }
  
  function goForward() {
    if (currentHistoryIndex < navigationHistory.length - 1) {
      currentHistoryIndex++;
      loadDirectory(navigationHistory[currentHistoryIndex]);
    }
  }
  
  function goUp() {
    if (currentPath.includes('/')) {
      const parentPath = currentPath.split('/').slice(0, -1).join('/');
      navigateTo(parentPath || 'desktop');
    } else if (currentPath !== 'desktop') {
      navigateTo('desktop');
    }
  }
  
  function updateNavigationButtons() {
    backButton.disabled = currentHistoryIndex <= 0;
    forwardButton.disabled = currentHistoryIndex >= navigationHistory.length - 1;
  }
  
  function getFileIcon(filename) {
    const extension = filename.split('.').pop().toLowerCase();
    const iconMap = {
      // Images
      png: 'image', jpg: 'image', jpeg: 'image', gif: 'image', bmp: 'image', webp: 'image',
      // Videos
      mp4: 'video', mov: 'video', avi: 'video', mkv: 'video', webm: 'video',
      // Documents
      pdf: 'pdf', doc: 'word', docx: 'word', xls: 'excel', xlsx: 'excel', ppt: 'powerpoint', pptx: 'powerpoint',
      // Audio
      mp3: 'audio', wav: 'audio', ogg: 'audio',
      // Archives
      zip: 'zip', rar: 'zip', '7z': 'zip', tar: 'zip', gz: 'zip',
      // Code
      js: 'script', html: 'script', css: 'script', json: 'script', xml: 'script',
      // Text
      txt: 'text', log: 'text', md: 'text',
      // Executables
      exe: 'application', msi: 'application', bat: 'application'
    };
    
    return iconMap[extension] || 'file';
  }
});