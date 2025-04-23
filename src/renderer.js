
document.addEventListener('DOMContentLoaded', async () => {
  // Carregar apps
  const apps = await window.electronAPI.getApps();
  renderApps(apps);
  
  // Configurar taskbar
  setupTaskbar();
  
  // Configurar menu iniciar
  setupStartMenu();
  
  // Configurar desktop
  setupDesktop();
  
  // Configurar menu de contexto
  setupContextMenu();
  
  // Configurar seleção no desktop
  setupDesktopSelection();
});

function renderApps(apps) {
  const startMenu = document.getElementById('start-menu-apps');
  
  apps.forEach(app => {
    
    const appElement = document.createElement('div');
    appElement.className = 'start-menu-app';
    appElement.innerHTML = `
      <img src="../assets/icons/${app.icon}" alt="${app.displayName}">
      <span>${app.displayName}</span>
    `;
    appElement.addEventListener('click', () => window.electronAPI.openApp(app.name));
    startMenu.appendChild(appElement);
  });
}

function setupTaskbar() {
  const taskbar = document.getElementById('taskbar');
  const startButton = document.getElementById('start-button');
  const clock = document.getElementById('clock');
  
  // Atualizar relógio
  function updateClock() {
    const now = new Date();
    clock.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  
  setInterval(updateClock, 1000);
  updateClock();
  
  // Mostrar/ocultar menu iniciar
  startButton.addEventListener('click', (e) => {
    e.stopPropagation();
    const startMenu = document.getElementById('start-menu');
    startMenu.classList.toggle('visible');
  });
  
  // Fechar menu iniciar ao clicar fora
  document.addEventListener('click', () => {
    const startMenu = document.getElementById('start-menu');
    startMenu.classList.remove('visible');
  });
}

function setupStartMenu() {
  const startMenu = document.getElementById('start-menu');
  const searchInput = document.getElementById('start-menu-search');
  
  searchInput.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const apps = document.querySelectorAll('.start-menu-app');
    
    apps.forEach(app => {
      const appName = app.querySelector('span').textContent.toLowerCase();
      if (appName.includes(searchTerm)) {
        app.style.display = 'flex';
      } else {
        app.style.display = 'none';
      }
    });
  });
}

function setupDesktop() {
  const desktop = document.getElementById('desktop');
  
  // Fechar menu iniciar ao clicar no desktop
  desktop.addEventListener('click', () => {
    document.getElementById('start-menu').classList.remove('visible');
    
    // Desselecionar ícones ao clicar no desktop vazio
    document.querySelectorAll('.desktop-icon').forEach(icon => {
      icon.classList.remove('selected');
    });
  });
  
  // Carregar ícones do desktop
  loadDesktopIcons();
}

async function loadDesktopIcons() {
  const desktop = document.getElementById('desktop');
  
  // Obter itens do desktop do Electron
  const desktopItems = await window.electronAPI.getDesktopItems();
  
  desktopItems.forEach(item => {
    const icon = document.createElement('div');
    icon.className = 'desktop-icon';
    icon.innerHTML = `
      <img src="../assets/icons/${item.icon}.png" alt="${item.name}">
      <span>${item.name}</span>
    `;
    
    // Adicionar eventos de clique
    icon.addEventListener('click', (e) => {
      e.stopPropagation();
      
      // Selecionar/desselecionar com Ctrl
      if (e.ctrlKey) {
        icon.classList.toggle('selected');
      } else {
        // Desselecionar todos e selecionar apenas este
        document.querySelectorAll('.desktop-icon').forEach(i => {
          i.classList.remove('selected');
        });
        icon.classList.add('selected');
      }
    });
    
    // Duplo clique para abrir
    icon.addEventListener('dblclick', () => {
      if (item.type === 'app') {
        window.electronAPI.openApp(item.id);
      } else if (item.type === 'file') {
        window.electronAPI.openFile(item.path);
      } else if (item.type === 'folder') {
        window.electronAPI.openFolder(item.path);
      }
    });
    
    desktop.appendChild(icon);
  });
}

function setupContextMenu() {
  const desktop = document.getElementById('desktop');
  const contextMenu = document.getElementById('context-menu');
  
  // Mostrar menu de contexto
  desktop.addEventListener('contextmenu', async (e) => {
    e.preventDefault();
    
    // Posicionar menu
    contextMenu.style.display = 'block';
    contextMenu.style.left = `${e.clientX}px`;
    contextMenu.style.top = `${e.clientY}px`;
    
    // Verificar se há itens selecionados
    const hasSelection = document.querySelectorAll('.desktop-icon.selected').length > 0;
    
    // Ajustar itens do menu baseado na seleção
    document.getElementById('context-paste').style.display = 
      await window.electronAPI.hasClipboardItems() ? 'block' : 'none';
    document.getElementById('context-view').style.display = hasSelection ? 'none' : 'block';
    document.getElementById('context-sort').style.display = hasSelection ? 'none' : 'block';
  });
  
  // Fechar menu ao clicar em outro lugar
  document.addEventListener('click', () => {
    contextMenu.style.display = 'none';
  });
  
  // Ações do menu de contexto
  document.getElementById('context-refresh').addEventListener('click', () => {
    refreshDesktop();
  });
  
  document.getElementById('context-new').addEventListener('click', (e) => {
    showNewSubmenu(e);
  });
  
  document.getElementById('context-paste').addEventListener('click', () => {
    window.electronAPI.pasteToDesktop();
    refreshDesktop();
  });
  
  document.getElementById('context-display').addEventListener('click', () => {
    window.electronAPI.openApp('settings/display');
  });
  
  document.getElementById('context-personalize').addEventListener('click', () => {
    window.electronAPI.openApp('settings/personalization');
  });
}

function refreshDesktop() {
  const desktop = document.getElementById('desktop');
  document.querySelectorAll('.desktop-icon').forEach(icon => icon.remove());
  loadDesktopIcons();
}

function setupDesktopSelection() {
  const desktop = document.getElementById('desktop');
  const selectionBox = document.getElementById('selection-box');
  
  let isSelecting = false;
  let startX, startY;
  
  desktop.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return; // Apenas botão esquerdo
    
    const target = e.target.closest('.desktop-icon');
    if (target && !e.ctrlKey) {
      // Desselecionar todos se não estiver segurando Ctrl
      document.querySelectorAll('.desktop-icon').forEach(icon => {
        icon.classList.remove('selected');
      });
      target.classList.add('selected');
      return;
    }
    
    isSelecting = true;
    startX = e.clientX;
    startY = e.clientY;
    
    selectionBox.style.left = `${startX}px`;
    selectionBox.style.top = `${startY}px`;
    selectionBox.style.width = '0';
    selectionBox.style.height = '0';
    selectionBox.style.display = 'block';
    
    // Desselecionar todos ao começar uma nova seleção
    if (!e.ctrlKey) {
      document.querySelectorAll('.desktop-icon').forEach(icon => {
        icon.classList.remove('selected');
      });
    }
  });
  
  desktop.addEventListener('mousemove', (e) => {
    if (!isSelecting) return;
    
    const currentX = e.clientX;
    const currentY = e.clientY;
    
    // Atualizar posição da caixa de seleção
    const left = Math.min(startX, currentX);
    const top = Math.min(startY, currentY);
    const width = Math.abs(currentX - startX);
    const height = Math.abs(currentY - startY);
    
    selectionBox.style.left = `${left}px`;
    selectionBox.style.top = `${top}px`;
    selectionBox.style.width = `${width}px`;
    selectionBox.style.height = `${height}px`;
    
    // Selecionar ícones dentro da área
    document.querySelectorAll('.desktop-icon').forEach(icon => {
      const rect = icon.getBoundingClientRect();
      const iconCenterX = rect.left + rect.width / 2;
      const iconCenterY = rect.top + rect.height / 2;
      
      if (iconCenterX > left && iconCenterX < left + width &&
          iconCenterY > top && iconCenterY < top + height) {
        icon.classList.add('selected');
      } else if (!e.ctrlKey) {
        icon.classList.remove('selected');
      }
    });
  });
  
  desktop.addEventListener('mouseup', () => {
    if (isSelecting) {
      isSelecting = false;
      selectionBox.style.display = 'none';
    }
  });
}