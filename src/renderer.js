


document.addEventListener('DOMContentLoaded', async () => {
  // Carregar apps
  const apps = await window.electronAPI.getApps();
  console.log(apps)
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


async function renderApps(apps) {
  const startMenu = document.getElementById('start-menu-apps');
  const assetsPath = await window.electronAPI.getDirPath();
  console.log(assetsPath)

  apps.forEach(app => {
    const appElement = document.createElement('div');
    appElement.className = 'start-menu-app';

    const iconUrl = new URL(`${app.dir}/${app.icon}`, `file://${assetsPath}/`).toString();

    appElement.innerHTML = `
      <img src="${iconUrl}" alt="${app.displayName}">
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
  
    const time = now.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  
    const date = now.toLocaleDateString([], {

      year: 'numeric',
      month: 'numeric',
      day: 'numeric'
    });
  
    clock.textContent = `${time} ${date}`;
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
  const desktopItems = await window.electronAPI.getDesktopItems();
  const assetsPath = await window.electronAPI.getAssetsPath();
  const assetsDirPath = await window.electronAPI.getDirPath();
  let gridSize = 90; // espaço entre ícones

  desktopItems.forEach((item, index) => {
    const icon = document.createElement('div');
    icon.className = 'desktop-icon';

    
    // Verifique se o item tem um displayName
    const iconUrl = `file:///${item.displayName ? `${item.dir}/${item.icon}` : `${assetsPath.replace('src', '')}/icons/${item.icon}.png`}`;
    // Use displayName se existir, senão usa o nome padrão
    const name = item.displayName || item.name;

    icon.innerHTML = `
      <img src="${iconUrl}" alt="${name}">
      <span>${name}</span>
    `;

    // Posição inicial em grade
    const col = index % 5;
    const row = Math.floor(index / 5);
    icon.style.left = `${col * gridSize}px`;
    icon.style.top = `${row * gridSize}px`;

    // Clique e duplo clique
    icon.addEventListener('click', (e) => {
      e.stopPropagation();
      if (e.ctrlKey) {
        icon.classList.toggle('selected');
      } else {
        document.querySelectorAll('.desktop-icon').forEach(i => i.classList.remove('selected'));
        icon.classList.add('selected');
      }
    });

    icon.addEventListener('dblclick', () => {
      if (item.type === 'app') {
        window.electronAPI.openApp(item.name);
      } else if (item.isDirectory) {
        window.electronAPI.openFolder(item.path); 
      } else if (item.type === 'file') {
        window.electronAPI.openFile(item.path);  // Abrir o arquivo
      }
    });

    // 👉 Drag and drop
    makeDraggable(icon);

    desktop.appendChild(icon);
  });
}

function makeDraggable(el) {
  const gridSize = 90;
  const desktop = document.getElementById('desktop');
  const taskbar = document.getElementById('taskbar'); // Seleciona a div da taskbar
  let isDragging = false;
  let startX, startY;
  let initialLeft, initialTop;

  // Função para verificar se o ícone está colidindo com outros ícones
  function checkCollision(newLeft, newTop) {
    const icons = document.querySelectorAll('.desktop-icon');
    for (let icon of icons) {
      if (icon === el) continue; // Ignorar o próprio ícone
      const rect = icon.getBoundingClientRect();
      if (
        newLeft < rect.right && newLeft + el.offsetWidth > rect.left &&
        newTop < rect.bottom && newTop + el.offsetHeight > rect.top
      ) {
        return true; // Colisão detectada
      }
    }
    return false; // Não há colisão
  }

  // Limitar o movimento para dentro da área do desktop, considerando a taskbar
  function limitPosition(newLeft, newTop) {
    const desktopRect = desktop.getBoundingClientRect();
    const taskbarHeight = taskbar.getBoundingClientRect().height; // Obtém a altura da taskbar dinamicamente
    const maxX = desktopRect.width - el.offsetWidth;
    const maxY = desktopRect.height - el.offsetHeight - taskbarHeight;  // Subtrai a altura da taskbar

    // Impedir que o ícone saia da tela ou vá para trás da taskbar
    newLeft = Math.max(0, Math.min(newLeft, maxX));
    newTop = Math.max(0, Math.min(newTop, maxY));

    return [newLeft, newTop];
  }

  const onMouseMove = (e) => {
    if (!isDragging) return;

    const deltaX = e.clientX - startX;
    const deltaY = e.clientY - startY;

    let newLeft = initialLeft + deltaX;
    let newTop = initialTop + deltaY;

    // Limitar a posição para dentro da tela e considerar a taskbar
    [newLeft, newTop] = limitPosition(newLeft, newTop);

    // Mover o ícone livremente sem checar colisões até o "mouseup"
    el.style.left = `${newLeft}px`;
    el.style.top = `${newTop}px`;
  };

  const onMouseUp = () => {
    if (isDragging) {
      // Encaixar na grade
      const snappedX = Math.round(el.offsetLeft / gridSize) * gridSize;
      const snappedY = Math.round(el.offsetTop / gridSize) * gridSize;

      // Verificar colisões após o "mouseup"
      let newLeft = snappedX;
      let newTop = snappedY;

      // Se houver colisão, tenta deslocar o ícone para o próximo espaço disponível
      if (checkCollision(newLeft, newTop)) {
        // Mover o ícone para uma posição livre na grade
        do {
          newLeft += gridSize; // Mover para a direita
        } while (checkCollision(newLeft, newTop)); // Continuar movendo até encontrar uma posição livre
      }

      // Limitar a posição para dentro da tela e considerar a taskbar
      [newLeft, newTop] = limitPosition(newLeft, newTop);

      el.style.left = `${newLeft}px`;
      el.style.top = `${newTop}px`;
    }

    isDragging = false;
    el.style.zIndex = '';
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
    document.body.style.userSelect = '';
  };

  el.addEventListener('mousedown', (e) => {
    e.preventDefault();

    isDragging = true;
    el.style.zIndex = 1000;
    document.body.style.userSelect = 'none';

    const rect = el.getBoundingClientRect();
    startX = e.clientX;
    startY = e.clientY;
    initialLeft = parseInt(el.style.left, 10) || 0;
    initialTop = parseInt(el.style.top, 10) || 0;

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
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
    window.electronAPI.openApp('settings');
  });
  
  document.getElementById('context-personalize').addEventListener('click', () => {
    window.electronAPI.openApp('settings');
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