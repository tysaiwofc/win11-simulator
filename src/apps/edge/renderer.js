document.addEventListener('DOMContentLoaded', () => {
    // Controles básicos
    const addressBar = document.getElementById('address-bar');
    const webview = document.getElementById('tab-1');
    const tabsContainer = document.getElementById('tabs-container');
    const newTabButton = document.getElementById('new-tab');
    const settingsButton = document.getElementById('open-settings');
    const settingsPanel = document.getElementById('settings');
    
    // Navegação
    addressBar.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        let url = addressBar.value;
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
          url = 'https://' + url;
        }
        webview.src = url;
      }
    });
    
    // Atualizar barra de endereço quando a página muda
    webview.addEventListener('did-navigate', (e) => {
      addressBar.value = e.url;
      updateTabTitle('tab-1', getPageTitle(e.url));
    });
    
    // Nova aba
    newTabButton.addEventListener('click', () => {
      const tabId = 'tab-' + Date.now();
      const tab = document.createElement('div');
      tab.className = 'tab';
      tab.dataset.id = tabId;
      tab.innerHTML = `
        <span>New Tab</span>
        <span class="tab-close">×</span>
      `;
      
      tabsContainer.appendChild(tab);
      
      // Criar novo webview (na implementação real, você precisaria gerenciar isso)
      console.log('Nova aba criada:', tabId);
    });
    
    // Alternar configurações
    settingsButton.addEventListener('click', () => {
      settingsPanel.classList.toggle('show');
    });
    
    // Fechar configurações ao clicar fora
    document.addEventListener('click', (e) => {
      if (!settingsPanel.contains(e.target) && e.target !== settingsButton) {
        settingsPanel.classList.remove('show');
      }
    });
    
    // Funções auxiliares
    function updateTabTitle(tabId, title) {
      const tab = document.querySelector(`.tab[data-id="${tabId}"] span:first-child`);
      if (tab) {
        tab.textContent = title || 'New Tab';
      }
    }
    
    function getPageTitle(url) {
      // Na implementação real, você obteria o título da página
      try {
        const domain = new URL(url).hostname.replace('www.', '');
        return domain.charAt(0).toUpperCase() + domain.slice(1);
      } catch {
        return 'New Tab';
      }
    }
  });