document.addEventListener('DOMContentLoaded', () => {
    // Configurar controles da janela
    document.querySelector('.window-control.minimize').addEventListener('click', () => {
      window.electronAPI.minimizeWindow();
    });
    
    document.querySelector('.window-control.maximize').addEventListener('click', () => {
      window.electronAPI.maximizeWindow();
    });
    
    document.querySelector('.window-control.close').addEventListener('click', () => {
      window.electronAPI.closeWindow();
    });
    
    // Tornar a janela arrastável
    const header = document.querySelector('.window-header');
    header.style.webkitAppRegion = 'drag';
    
    // Tornar elementos dentro do cabeçalho não arrastáveis
    const nonDraggable = header.querySelectorAll('*');
    nonDraggable.forEach(el => {
      el.style.webkitAppRegion = 'no-drag';
    });
    
    // Configurar navegação das configurações
    setupSettingsNavigation();
    
    // Configurar controles das configurações
    setupSettingsControls();
  });
  
  function setupSettingsNavigation() {
    const categories = document.querySelectorAll('.settings-category');
    const sections = document.querySelectorAll('.settings-section');

        document.getElementById('system-section').style.display = 'block';
    categories.forEach(category => {
      category.addEventListener('click', () => {
        // Remover classe active de todas as categorias
        categories.forEach(c => c.classList.remove('active'));
        // Adicionar classe active à categoria clicada
        category.classList.add('active');
        
        // Ocultar todas as seções
        sections.forEach(section => {
          section.style.display = 'none';
        });
        
        // Mostrar a seção correspondente
        const sectionId = `${category.dataset.section}-section`;
        document.getElementById(sectionId).style.display = 'block';
      });
    });
  }
  
  const defaultWallpapers = [
    'https://i.imgur.com/ne4kFZd.jpeg',
    'https://i.imgur.com/CnW28i8.jpeg',
    'https://i.imgur.com/ILvEDSW.jpeg'
  ];
  
  const wallpaperOptionsContainer = document.getElementById('wallpaper-options');
  const selectWallpaperBtn = document.getElementById('select-wallpaper-btn');
  
  function createWallpaperOption(src, current) {
    const img = document.createElement('img');
    img.src = src;
    img.style.width = '100px';
    img.style.height = '60px';
    img.style.objectFit = 'cover';
    img.style.borderRadius = '6px';
    img.style.border = src === current ? '2px solid #0078d7' : '2px solid transparent';
    img.style.cursor = 'pointer';
    img.addEventListener('click', async () => {
      console.log("TESTE")
      await window.electronAPI.setConfig('wallpaper', src);
      loadCurrentWallpaper(); // Atualiza seleção
    });
    return img;
  }
  
  async function loadCurrentWallpaper() {
    const current = await window.electronAPI.getConfig('wallpaper');
  
    wallpaperOptionsContainer.innerHTML = '';
    defaultWallpapers.forEach(url => {
      wallpaperOptionsContainer.appendChild(createWallpaperOption(url, current));
    });
  
    if (current && !defaultWallpapers.includes(current)) {
      // Mostrar o wallpaper custom atual também
      wallpaperOptionsContainer.appendChild(createWallpaperOption(current, current));
    }
  }
  
  selectWallpaperBtn.addEventListener('click', async () => {
    const result = await window.electronAPI.showOpenDialog({
      properties: ['openFile'],
      filters: [{ name: 'Imagens', extensions: ['jpg', 'jpeg', 'png'] }]
    });
  
    if (result && result.filePaths && result.filePaths[0]) {
      const filePath = result.filePaths[0];
      console.log(filePath)
      await window.electronAPI.setConfig('wallpaper', filePath);
      loadCurrentWallpaper();
    }
  });
  
  document.addEventListener('DOMContentLoaded', () => {
    loadCurrentWallpaper();
  });
  

  function setupSettingsControls() {
    // Aqui você pode adicionar a lógica para salvar/configurações
    const displaySelect = document.getElementById('display-select');
    const themeColor = document.getElementById('theme-color');
    const wallpaperInput = document.getElementById('wallpaper-input');
    
    displaySelect.addEventListener('change', (e) => {
      console.log('Theme changed to:', e.target.value);
    });
    
    themeColor.addEventListener('change', (e) => {
      console.log('Theme color changed to:', e.target.value);
    });
    
    wallpaperInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        const reader = new FileReader();
        reader.onload = (event) => {
          console.log('New wallpaper:', event.target.result);
        };
        reader.readAsDataURL(e.target.files[0]);
      }
    });
  }

  document.querySelector('.window-control.minimize').addEventListener('click', () => {
    window.electronAPI.minimizeWindow();  // Minimize a janela
  });
  
  document.querySelector('.window-control.maximize').addEventListener('click', () => {
    window.electronAPI.maximizeWindow();  // Maximize a janela
  });
  
  document.querySelector('.window-control.close').addEventListener('click', () => {
    window.electronAPI.closeWindow();  // Fechar a janela
  });
  
  