
document.addEventListener('DOMContentLoaded', async () => {
  // Carregar appsconst username = 'seu-usuario-no-github'; 
// Função para mostrar a janela About
function showAboutWindow() {
  const aboutWindow = document.getElementById('about-window');
  aboutWindow.style.display = 'block';
}
showAboutWindow()
// Função para esconder a janela About
function hideAboutWindow() {
  const aboutWindow = document.getElementById('about-window');
  if (aboutWindow) {
    aboutWindow.remove();  // Remove o elemento do DOM
  }
}


// Adicionar evento de clique ao botão OK
const okButton = document.getElementById('okbtn');
  const okButtonText = okButton.querySelector('div[data-allow="true"]'); // Seletor para o elemento correto dentro da div

  if (okButtonText) {
    okButtonText.addEventListener('click', hideAboutWindow);
  }

// Para mostrar a janela (chame esta função quando quiser exibir)
// showAboutWindow();
  const username = 'tysaiwofc'
  // Elemento onde os projetos serão exibidos
  const projectsList = document.getElementById('github-projects-list');

  // Função para buscar projetos no GitHub
  const fetchGitHubProjects = async () => {
    try {
      const response = await fetch(`https://api.github.com/users/${username}/repos`);
      const repos = await response.json();

      // Limpa a lista antes de adicionar os novos projetos
      projectsList.innerHTML = '';

      // Adiciona os repositórios à lista
      repos.slice(0, 4).forEach(repo => {
        const li = document.createElement('div');
        const link = document.createElement('a');

        link.href = repo.html_url;
        link.target = '_blank';
        link.textContent = repo.name;

        li.appendChild(link);
        
        projectsList.appendChild(li);
      });
    } catch (error) {
      console.error('Erro ao buscar projetos do GitHub:', error);
    }
  };

  // Chama a função para pegar os projetos assim que a página carregar
  fetchGitHubProjects();
  const apps = await window.electronAPI.getApps();
  renderApps(apps);
  
  // Configurar taskbar
  setupTaskbar();
  
  // Configurar menu iniciar
  setupStartMenu();
  setupNotificationCenter();

  // Configurar desktop
  setupDesktop();
  
  // Configurar menu de contexto
  setupContextMenu();
  
  // Configurar seleção no desktop
  setupDesktopSelection();

 
});


async function renderApps(apps) {
  const startMenu = document.getElementById('start-menu-apps');
  const assetsPath = await window.electronAPI.getAssetsPath();
  const dirPath = await window.electronAPI.getDirPath();

  for (const app of apps) {
    const appElement = document.createElement('div');
    appElement.className = 'start-menu-app';

    // Checa se o ícone existe em assetsPath
    const existsInAssets = await window.electronAPI.checkIconExists(assetsPath, app.icon);
    const basePath = existsInAssets ? assetsPath : dirPath;
    const iconUrl = new URL(`${app.dir}/${app.name}/${app.icon}`, `file://${basePath}/`)
    console.log(iconUrl)

    appElement.innerHTML = `
      <img src="${iconUrl}" alt="${app.displayName}">
      <span>${app.displayName}</span>
    `;

    appElement.addEventListener('click', () => window.electronAPI.openApp(app.name));
    startMenu.appendChild(appElement);
  }
}



const wifiImg = document.getElementById('wifi-status');

  function updateIcon(isOnline) {
    wifiImg.src = isOnline ? '../assets/icons/wifi.png' : '../assets/icons/no-wifi.png';
  }

  async function verifyRealConnection() {
    try {
      const res = await fetch('https://www.gstatic.com/generate_204', { method: 'HEAD', cache: 'no-cache' });
      return res.ok;
    } catch {
      return false;
    }
  }

  async function checkAndUpdate() {
    const isReallyOnline = await verifyRealConnection();
    updateIcon(isReallyOnline);
  }

  // Eventos nativos do navegador
  window.addEventListener('online', checkAndUpdate);
  window.addEventListener('offline', () => updateIcon(false));

  // Verificação inicial
  checkAndUpdate();

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
  
  const powerButton = document.getElementById("start-menu-power")

  const restartButton = document.getElementById('start-menu-restart')

  restartButton.addEventListener('click', e => {
    window.electronAPI.restartApp()
  })
  powerButton.addEventListener('click', (e) => {
    window.electronAPI.closeApp()
  })

  document.addEventListener('keydown', (event) => {
    if (event.key === 'F11') {
      event.preventDefault(); // Previne o comportamento padrão do F11 (entrar em modo de tela cheia)
      window.electronAPI.maximizeWindow(); // Chama a função do preload
    }
    if (event.key === 'F12') {
      event.preventDefault();  // Previne o comportamento padrão
      window.electronAPI.toggleFullScreen();  // Alterna para fullscreen ou desativa
    }
  });
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

async function setupDesktop() {
  const desktop = document.getElementById('desktop');

  const wallpaper = await window.electronAPI.getConfig("wallpaper")

  desktop.style.backgroundImage = `url('${wallpaper}')`
  
  window.electronAPI.onWallpaperChanged((newWallpaper) => {
    let fileUrl;
  
    if (newWallpaper.startsWith('http://') || newWallpaper.startsWith('https://')) {
      // Se for uma URL, apenas use diretamente
      fileUrl = newWallpaper;
    } else {
      // Se for um caminho de arquivo local
      const normalizedPath = newWallpaper.replace(/\\/g, '/'); // Substitui barras invertidas por barras normais
      fileUrl = `file:///${encodeURI(normalizedPath)}`; // Garante que o caminho do arquivo seja válido
    }
    
    // Aplicando o background no elemento
    desktop.style.backgroundImage = `url('${fileUrl}')`;
  });
  
  
  const version = document.getElementById("version");


  if(version) {
    version.innerText = `Windows 11 Simulator v${await window.electronAPI.getAppVersion()}`
  }
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
  const dirPath = await window.electronAPI.getDirPath();
  const gridSize = 90;

  for (let index = 0; index < desktopItems.length; index++) {
    const item = desktopItems[index];
    const icon = document.createElement('div');
    icon.className = 'desktop-icon';

    const name = item.displayName || item.name;
    let iconUrl;

    // Caminhos relativos para verificação
    const appIconRelativePath = `${item.dir}/${item.icon}`;
    const assetIconRelativePath = `icons/${item.icon}`;
    const assetIconDefaultRelativePath = `${item.dir}/${item.icon}`
    const appIconExists = await window.electronAPI.checkIconExists(dirPath, appIconRelativePath);
    const assetIconExists = await window.electronAPI.checkIconExists(assetsPath, assetIconRelativePath);
    const defaultAppExists = await window.electronAPI.checkIconExists(assetsPath.replace('assets', '').replace('src', ''), `src/apps/${assetIconDefaultRelativePath}`)
    
    console.log(item.dir , defaultAppExists, assetIconExists, appIconExists, `./src/apps/${assetIconDefaultRelativePath}`)
    if (appIconExists) {
      iconUrl = new URL(appIconRelativePath, `file://${dirPath.replace('apps', 'src/apps').replace(/\\/g, '/')}/`).toString();
    } else if (assetIconExists) {
      iconUrl = new URL(assetIconRelativePath, `file://${assetsPath.replace('src', '').replace(/\\/g, '/')}/`).toString();
    } else if(defaultAppExists) {
      iconUrl = defaultAppExists
    } else {
      // Ícone fallback
      iconUrl = new URL('icons/file.png', `file://${assetsPath.replace('src', '').replace(/\\/g, '/')}/`).toString();
    }

    icon.innerHTML = `
      <img src="${iconUrl}" alt="${name}">
      <span>${name}</span>
    `;

    const col = index % 5;
    const row = Math.floor(index / 5);
    icon.style.left = `${col * gridSize}px`;
    icon.style.top = `${row * gridSize}px`;

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
        window.electronAPI.openFile(item.path);
      }
    });

    makeDraggable(icon);
    desktop.appendChild(icon);
  }
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


window.electronAPI.onUpdateDesktop(async () => {

  // Limpar os itens antigos
  const startMenuApps = document.getElementById('start-menu-apps');
  startMenuApps.innerHTML = ''; // 🔥 Remove todos os filhos

  // Pegar os apps novos
  const apps = await window.electronAPI.getApps();

  // Renderizar os novos apps
  renderApps(apps);
});

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



// NOTIFICATIONS
function setupNotificationCenter() {

  const notificationIcon = document.getElementById('notification-icon');
  const notificationCenter = document.getElementById('notification-center');
  const clearButton = document.getElementById('clear-notifications');
  const settingsButton = document.getElementById('notification-settings');
  const notificationList = document.getElementById('notification-list');
  const notificationBadge = document.getElementById('notification-badge');
  
  let notifications = [];
  let unreadCount = 0;

  // Carregar notificações iniciais
  async function loadNotifications() {
    notifications = await window.electronAPI.getNotifications();
    unreadCount = notifications.filter(n => n.unread).length;
    updateNotificationList();
    updateBadge();
  }

  // Inicializar
  loadNotifications();

  // Ouvir novas notificações
  // Ouvir novas notificações e atualizar a central de notificações
  let lastNotificationTime = 0; // Para rastrear o tempo da última notificação
  let notificationSoundPlayed = false; // Flag para controlar o som
  
  window.electronAPI.onNotificationReceived((newNotification) => {
    const currentTime = Date.now();
    
    // Se a última notificação foi há mais de 10 segundos, toca o som
    if (currentTime - lastNotificationTime > 10000) {
      notificationSoundPlayed = false; // Permitir tocar som novamente
    }
    
    // Se ainda não tocou o som, toca o som para esta notificação
    if (!notificationSoundPlayed) {
      playNotificationSound();
      notificationSoundPlayed = true;
    }
  
    // Atualiza a última notificação recebida
    lastNotificationTime = currentTime;
    
    notifications.unshift(newNotification);
    unreadCount++;
    updateNotificationList();
    updateBadge();
    
    // if (!notificationCenter.classList.contains('visible')) {
    //   showToastNotification(newNotification.title, newNotification.message);
    // }
  });
  
  // Função para tocar o som da notificação
  function playNotificationSound() {
    const audio = new Audio('../assets/audio/notification.mp3'); // Substitua pelo caminho do áudio desejado
    audio.play();
  }
  



  
  // Alternar visibilidade da central
  notificationIcon.addEventListener('click', (e) => {
    e.stopPropagation();
    notificationCenter.classList.toggle('visible');
    
    if (notificationCenter.classList.contains('visible')) {
      //markAllAsRead();
    }
  });

  // Fechar ao clicar fora
  document.addEventListener('click', (e) => {
    if (!notificationCenter.contains(e.target) && e.target !== notificationIcon) {
      notificationCenter.classList.remove('visible');
    }
  });

  // Limpar notificações
  clearButton.addEventListener('click', async () => {
    await window.electronAPI.clearNotifications();
    await loadNotifications();
  });

  // Configurações
  settingsButton.addEventListener('click', () => {
    window.electronAPI.openApp('settings');
  });

  // Atualizar lista de notificações
  function updateNotificationList() {
    notificationList.innerHTML = '';  // Limpar a lista
  
    if (notifications.length === 0) {
      notificationList.innerHTML = '<div class="notification-list-empty">Nenhuma notificação</div>';
      return;
    }
  
    // Adicionar cada notificação à lista da central
    notifications.forEach(notif => {
      const notifElement = document.createElement('div');
      notifElement.className = `notification-item ${notif.unread ? 'unread' : ''}`;
      notifElement.innerHTML = `
        <div class="notification-title">${notif.title}</div>
        <div class="notification-message">${notif.message}</div>
        <div class="notification-time">${formatTime(notif.timestamp)}</div>
      `;
  
      // Ação ao clicar na notificação
      notifElement.addEventListener('click', async () => {
        if (notif.unread) {
          notif.unread = false;
          unreadCount--;
          updateBadge();
          notifElement.classList.remove('unread');
          await window.electronAPI.markNotificationAsRead(notif.id);
        }
  
        if (notif.options?.action) {
          notif.options.action();
        }
      });
  
      notificationList.appendChild(notifElement);  // Adicionar o item à lista
    });
  }
  

  // Atualizar contador no badge
  function updateBadge() {
    notificationBadge.textContent = unreadCount > 0 ? unreadCount : '';
    notificationBadge.style.display = unreadCount > 0 ? 'flex' : 'none';
  }

  // Formatar hora
  function formatTime(timestamp) {
    const now = new Date();
    const date = new Date(timestamp);
    const diff = now - date;
    
    if (diff < 60000) return 'Agora mesmo';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} min atrás`;
    if (diff < 86400000) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return date.toLocaleDateString([], { day: 'numeric', month: 'short' });
  }

  // Mostrar notificação toast
  function showToastNotification(title, message) {
    const toast = document.createElement('div');
  toast.className = 'notification-toast';
  toast.innerHTML = `
    <div class="toast-title">${title}</div>
    <div class="toast-message">${message}</div>
  `;
  
  document.body.appendChild(toast);  // Adicionar o toast à página
  
  // Mostrar o toast com animação
  setTimeout(() => {
    toast.classList.add('show');
  }, 10);

  // Remover o toast após 5 segundos
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 5000);

  // Ao clicar no toast, mostrar a central de notificações
  toast.addEventListener('click', () => {
    notificationCenter.classList.add('visible');
    markAllAsRead();
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  });
  }

  // Marcar todas como lidas
  async function markAllAsRead() {
    await window.electronAPI.markAllNotificationsAsRead();
    await loadNotifications();
  }
}

// API global para enviar notificações

// Inicializar a central de notificações
