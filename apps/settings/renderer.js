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