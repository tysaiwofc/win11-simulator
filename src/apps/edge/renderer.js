// Configurações iniciais
const config = {
    homepage: "https://www.google.com",
    searchEngine: "google",
    theme: "light",
    rememberHistory: true,
    cookiePolicy: "allow-all",
    askWhereToSave: false
};

// Estado do navegador
const state = {
    tabs: [],
    activeTab: null,
    extensions: [],
    downloads: [],
    history: [],
    bookmarks: [],
    privateMode: false
};

// Elementos DOM
const elements = {
    browserContainer: document.querySelector('.browser-container'),
    titleBar: document.querySelector('.title-bar'),
    toolbar: document.querySelector('.toolbar'),
    tabBar: document.querySelector('.tab-bar'),
    tabList: document.querySelector('.tab-list'),
    contentArea: document.querySelector('.content-area'),
    statusBar: document.querySelector('.status-bar'),
    statusText: document.getElementById('status-text'),
    addressBar: document.getElementById('address-bar'),
    backBtn: document.getElementById('back-btn'),
    forwardBtn: document.getElementById('forward-btn'),
    refreshBtn: document.getElementById('refresh-btn'),
    homeBtn: document.getElementById('home-btn'),
    goBtn: document.getElementById('go-btn'),
    bookmarkBtn: document.getElementById('bookmark-btn'),
    newTabBtn: document.getElementById('new-tab-btn'),
    extensionsBtn: document.getElementById('extensions-btn'),
    downloadsBtn: document.getElementById('downloads-btn'),
    historyBtn: document.getElementById('history-btn'),
    menuBtn: document.getElementById('menu-btn'),
    settingsBtn: document.getElementById('settings-btn'),
    securityBtn: document.getElementById('security-btn'),
    zoomBtn: document.getElementById('zoom-btn'),
    extensionsPanel: document.getElementById('extensions-panel'),
    downloadsPanel: document.getElementById('downloads-panel'),
    settingsModal: document.getElementById('settings-modal'),
    contextMenu: document.getElementById('context-menu')
};

// Inicialização
function init() {
    // Carregar configurações salvas
    loadSettings();
    
    // Criar primeira aba
    createNewTab();
    
    // Configurar eventos
    setupEventListeners();
    
    // Carregar extensões padrão
    loadDefaultExtensions();
    
    // Aplicar tema
    applyTheme();
}

// Carregar configurações
function loadSettings() {
    const savedConfig = localStorage.getItem('browserConfig');
    if (savedConfig) {
        Object.assign(config, JSON.parse(savedConfig));
    }
    
    // Aplicar configurações carregadas
    if (config.theme === 'dark' || (config.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.getElementById('theme-style').disabled = false;
    }
}

// Salvar configurações
function saveSettings() {
    localStorage.setItem('browserConfig', JSON.stringify(config));
}

// Criar nova aba
function createNewTab(url, options = {}) {
    const tabId = Date.now().toString();
    const isPrivate = options.private || state.privateMode;
    
    // Criar elemento da aba
    const tabElement = document.createElement('div');
    tabElement.className = 'tab';
    tabElement.dataset.tabId = tabId;
    tabElement.innerHTML = `
        <span class="tab-title">Nova aba</span>
        <button class="tab-close"><i class="fas fa-times"></i></button>
    `;
    
    // Criar webview
    const webview = document.createElement('iframe');
    webview.className = 'webview';
    webview.dataset.tabId = tabId;
    webview.sandbox = "allow-same-origin allow-scripts allow-popups allow-forms";
    
    if (isPrivate) {
        webview.dataset.private = "true";
    }
    
    // Adicionar à DOM
    elements.tabList.insertBefore(tabElement, elements.newTabBtn);
    elements.contentArea.appendChild(webview);
    
    // Atualizar estado
    const tab = {
        id: tabId,
        title: 'Nova aba',
        url: url || '',
        favicon: '',
        private: isPrivate,
        element: tabElement,
        webview: webview
    };
    
    state.tabs.push(tab);
    setActiveTab(tabId);
    
    // Configurar eventos da aba
    setupTabEvents(tab);
    
    // Carregar URL se fornecido
    if (url) {
        navigateTo(url, tabId);
    } else if (state.tabs.length === 1) {
        // Primeira aba carrega a página inicial
        navigateTo(config.homepage, tabId);
    }
    
    return tabId;
}

// Configurar eventos da aba
function setupTabEvents(tab) {
    // Clique na aba
    tab.element.addEventListener('click', (e) => {
        if (!e.target.classList.contains('tab-close')) {
            setActiveTab(tab.id);
        }
    });
    
    // Fechar aba
    tab.element.querySelector('.tab-close').addEventListener('click', (e) => {
        e.stopPropagation();
        closeTab(tab.id);
    });
    
    // Eventos do webview
    tab.webview.addEventListener('load', () => {
        updateTabInfo(tab.id);
    });
    
    tab.webview.addEventListener('loadstart', () => {
        const tabElement = state.tabs.find(t => t.id === tab.id)?.element;
        if (tabElement) {
            tabElement.classList.add('loading');
        }
        elements.statusText.textContent = 'Carregando...';
    });
    
    tab.webview.addEventListener('loadend', () => {
        const tabElement = state.tabs.find(t => t.id === tab.id)?.element;
        if (tabElement) {
            tabElement.classList.remove('loading');
        }
        elements.statusText.textContent = 'Pronto';
    });
}

// Definir aba ativa
function setActiveTab(tabId) {
    // Desativar aba atual
    if (state.activeTab) {
        const currentTab = state.tabs.find(t => t.id === state.activeTab);
        if (currentTab) {
            currentTab.element.classList.remove('active');
            currentTab.webview.classList.remove('active');
        }
    }
    
    // Ativar nova aba
    const newTab = state.tabs.find(t => t.id === tabId);
    if (newTab) {
        newTab.element.classList.add('active');
        newTab.webview.classList.add('active');
        state.activeTab = tabId;
        
        // Atualizar barra de endereços
        updateAddressBar(newTab.url);
        
        // Atualizar botões de navegação
        updateNavButtons();
        
        // Atualizar título da janela
        document.title = `${newTab.title} - Navegador Avançado`;
    }
}

// Fechar aba
function closeTab(tabId) {
    const tabIndex = state.tabs.findIndex(t => t.id === tabId);
    if (tabIndex === -1) return;
    
    const tab = state.tabs[tabIndex];
    
    // Remover elementos DOM
    tab.element.remove();
    tab.webview.remove();
    
    // Remover do estado
    state.tabs.splice(tabIndex, 1);
    
    // Se era a aba ativa, definir nova aba ativa
    if (tabId === state.activeTab) {
        if (state.tabs.length > 0) {
            // Ativar a aba anterior ou a próxima
            const newActiveIndex = Math.min(tabIndex, state.tabs.length - 1);
            setActiveTab(state.tabs[newActiveIndex].id);
        } else {
            // Criar nova aba se fechou a última
            createNewTab();
        }
    }
}

// Atualizar informações da aba
function updateTabInfo(tabId) {
    const tab = state.tabs.find(t => t.id === tabId);
    if (!tab || !tab.webview) return;
    
    try {
        const doc = tab.webview.contentDocument || tab.webview.contentWindow.document;
        tab.title = doc.title || tab.webview.src;
        tab.url = tab.webview.src;
        
        // Atualizar elemento da aba
        const titleElement = tab.element.querySelector('.tab-title');
        if (titleElement) {
            titleElement.textContent = tab.title;
        }
        
        // Atualizar favicon
        updateFavicon(tab);
        
        // Adicionar ao histórico
        if (!tab.private && config.rememberHistory) {
            addToHistory(tab.url, tab.title);
        }
        
        // Se for a aba ativa, atualizar barra de endereços
        if (tabId === state.activeTab) {
            updateAddressBar(tab.url);
            document.title = `${tab.title} - Navegador Avançado`;
        }
    } catch (e) {
        console.error('Não foi possível acessar o conteúdo do webview:', e);
    }
}

// Atualizar favicon
function updateFavicon(tab) {
    try {
        const doc = tab.webview.contentDocument || tab.webview.contentWindow.document;
        const favicon = doc.querySelector('link[rel="icon"], link[rel="shortcut icon"]');
        
        if (favicon) {
            tab.favicon = favicon.href;
            // Aqui você poderia atualizar um ícone na aba se quisesse
        }
    } catch (e) {
        console.error('Não foi possível obter o favicon:', e);
    }
}

// Atualizar barra de endereços
function updateAddressBar(url) {
    elements.addressBar.value = url || '';
}

// Atualizar botões de navegação
function updateNavButtons() {
    const tab = state.tabs.find(t => t.id === state.activeTab);
    if (!tab || !tab.webview) return;
    
    try {
        elements.backBtn.disabled = !tab.webview.contentWindow.history || tab.webview.contentWindow.history.length <= 1;
        elements.forwardBtn.disabled = true; // Simplificação - poderia verificar o histórico
    } catch (e) {
        console.error('Não foi possível verificar o histórico:', e);
        elements.backBtn.disabled = true;
        elements.forwardBtn.disabled = true;
    }
}

// Navegar para URL
function navigateTo(url, tabId = state.activeTab) {
    const tab = state.tabs.find(t => t.id === tabId);
    if (!tab) return;
    
    let finalUrl = url;
    
    // Se não tem protocolo, tratar como pesquisa
    if (!/^https?:\/\//i.test(url) && !/^about:/i.test(url) && !/^file:\/\//i.test(url)) {
        finalUrl = getSearchUrl(url);
    }
    
    // Atualizar URL na aba
    tab.url = finalUrl;
    
    // Tentar navegar
    try {
        tab.webview.src = finalUrl;
        updateAddressBar(finalUrl);
    } catch (e) {
        console.error('Erro ao navegar:', e);
        elements.statusText.textContent = 'Erro ao carregar a página';
    }
}

// Obter URL de pesquisa
function getSearchUrl(query) {
    switch (config.searchEngine) {
        case 'bing':
            return `https://www.bing.com/search?q=${encodeURIComponent(query)}`;
        case 'duckduckgo':
            return `https://duckduckgo.com/?q=${encodeURIComponent(query)}`;
        case 'yahoo':
            return `https://search.yahoo.com/search?p=${encodeURIComponent(query)}`;
        case 'google':
        default:
            return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
    }
}

// Adicionar ao histórico
function addToHistory(url, title) {
    state.history.unshift({
        url,
        title,
        timestamp: new Date().toISOString()
    });
    
    // Manter histórico limitado (últimos 100 itens)
    if (state.history.length > 100) {
        state.history.pop();
    }
    
    // Salvar no localStorage
    localStorage.setItem('browserHistory', JSON.stringify(state.history));
}

// Configurar eventos
function setupEventListeners() {
    // Navegação
    elements.backBtn.addEventListener('click', () => {
        const tab = state.tabs.find(t => t.id === state.activeTab);
        if (tab && tab.webview) {
            try {
                tab.webview.contentWindow.history.back();
            } catch (e) {
                console.error('Erro ao voltar:', e);
            }
        }
    });
    
    elements.forwardBtn.addEventListener('click', () => {
        const tab = state.tabs.find(t => t.id === state.activeTab);
        if (tab && tab.webview) {
            try {
                tab.webview.contentWindow.history.forward();
            } catch (e) {
                console.error('Erro ao avançar:', e);
            }
        }
    });
    
    elements.refreshBtn.addEventListener('click', () => {
        const tab = state.tabs.find(t => t.id === state.activeTab);
        if (tab && tab.webview) {
            tab.webview.contentWindow.location.reload();
        }
    });
    
    elements.homeBtn.addEventListener('click', () => {
        navigateTo(config.homepage);
    });
    
    // Barra de endereços
    elements.addressBar.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            navigateTo(elements.addressBar.value);
        }
    });
    
    elements.goBtn.addEventListener('click', () => {
        navigateTo(elements.addressBar.value);
    });
    
    // Botões de ação
    elements.newTabBtn.addEventListener('click', () => {
        createNewTab();
    });
    
    elements.bookmarkBtn.addEventListener('click', () => {
        const tab = state.tabs.find(t => t.id === state.activeTab);
        if (tab && tab.url) {
            addBookmark(tab.url, tab.title);
        }
    });
    
    // Painéis laterais
    elements.extensionsBtn.addEventListener('click', () => {
        elements.extensionsPanel.classList.toggle('active');
        elements.downloadsPanel.classList.remove('active');
    });
    
    elements.downloadsBtn.addEventListener('click', () => {
        elements.downloadsPanel.classList.toggle('active');
        elements.extensionsPanel.classList.remove('active');
        updateDownloadsList();
    });
    
    document.querySelectorAll('.panel-close').forEach(btn => {
        btn.addEventListener('click', () => {
            btn.closest('.side-panel').classList.remove('active');
        });
    });
    
    // Configurações
    elements.settingsBtn.addEventListener('click', () => {
        openSettingsModal();
    });
    
    document.getElementById('save-settings-btn').addEventListener('click', () => {
        saveCurrentSettings();
        elements.settingsModal.classList.remove('active');
    });
    
    document.getElementById('cancel-settings-btn').addEventListener('click', () => {
        elements.settingsModal.classList.remove('active');
    });
    
    document.querySelector('.modal-close').addEventListener('click', () => {
        elements.settingsModal.classList.remove('active');
    });
    
    // Abas de configurações
    document.querySelectorAll('.settings-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.dataset.tab;
            switchSettingsTab(tabName);
        });
    });
    
    // Menu de contexto
    document.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        showContextMenu(e.clientX, e.clientY);
    });
    
    document.addEventListener('click', () => {
        hideContextMenu();
    });
    
    // Eventos globais
    window.addEventListener('resize', handleWindowResize);
}

// Adicionar favorito
function addBookmark(url, title) {
    state.bookmarks.push({
        url,
        title,
        timestamp: new Date().toISOString()
    });
    
    // Salvar no localStorage
    localStorage.setItem('browserBookmarks', JSON.stringify(state.bookmarks));
    
    // Feedback visual
    elements.bookmarkBtn.innerHTML = '<i class="fas fa-star"></i>';
    setTimeout(() => {
        elements.bookmarkBtn.innerHTML = '<i class="far fa-star"></i>';
    }, 1000);
}

// Abrir modal de configurações
function openSettingsModal() {
    // Preencher valores atuais
    document.getElementById('homepage-url').value = config.homepage;
    document.getElementById('search-engine').value = config.searchEngine;
    document.getElementById('ask-where-to-save').checked = config.askWhereToSave;
    document.getElementById('theme-selector').value = config.theme;
    document.getElementById('ui-density').value = 'normal';
    document.getElementById('cookie-policy').value = config.cookiePolicy;
    document.getElementById('remember-history').checked = config.rememberHistory;
    
    elements.settingsModal.classList.add('active');
}

// Alternar entre abas de configurações
function switchSettingsTab(tabName) {
    // Desativar todas as abas
    document.querySelectorAll('.settings-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    document.querySelectorAll('.settings-page').forEach(page => {
        page.classList.remove('active');
    });
    
    // Ativar aba selecionada
    document.querySelector(`.settings-tab[data-tab="${tabName}"]`).classList.add('active');
    document.querySelector(`.settings-page[data-page="${tabName}"]`).classList.add('active');
}

// Salvar configurações atuais
function saveCurrentSettings() {
    config.homepage = document.getElementById('homepage-url').value;
    config.searchEngine = document.getElementById('search-engine').value;
    config.askWhereToSave = document.getElementById('ask-where-to-save').checked;
    config.theme = document.getElementById('theme-selector').value;
    config.cookiePolicy = document.getElementById('cookie-policy').value;
    config.rememberHistory = document.getElementById('remember-history').checked;
    
    saveSettings();
    applyTheme();
}

// Aplicar tema
function applyTheme() {
    const themeStyle = document.getElementById('theme-style');
    
    if (config.theme === 'dark' || (config.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        themeStyle.disabled = false;
        document.documentElement.classList.add('dark-theme');
    } else {
        themeStyle.disabled = true;
        document.documentElement.classList.remove('dark-theme');
    }
}

// Mostrar menu de contexto
function showContextMenu(x, y) {
    elements.contextMenu.style.left = `${x}px`;
    elements.contextMenu.style.top = `${y}px`;
    elements.contextMenu.classList.add('active');
    
    // Configurar ações do menu
    const tab = state.tabs.find(t => t.id === state.activeTab);
    const canGoBack = tab && tab.webview && tab.webview.contentWindow.history.length > 1;
    
    elements.contextMenu.querySelector('[data-action="back"]').style.display = canGoBack ? 'block' : 'none';
    
    // Adicionar eventos
    elements.contextMenu.querySelectorAll('li').forEach(item => {
        if (item.dataset.action) {
            item.addEventListener('click', () => handleContextAction(item.dataset.action));
        }
    });
}

// Esconder menu de contexto
function hideContextMenu() {
    elements.contextMenu.classList.remove('active');
}

// Manipular ação do menu de contexto
function handleContextAction(action) {
    const tab = state.tabs.find(t => t.id === state.activeTab);
    if (!tab) return;
    
    switch (action) {
        case 'back':
            tab.webview.contentWindow.history.back();
            break;
        case 'forward':
            tab.webview.contentWindow.history.forward();
            break;
        case 'reload':
            tab.webview.contentWindow.location.reload();
            break;
        case 'save-as':
            // Implementar lógica de salvar
            break;
        case 'print':
            tab.webview.contentWindow.print();
            break;
        case 'inspect':
            // Implementar DevTools simplificado
            openDevTools(tab);
            break;
    }
    
    hideContextMenu();
}

// Abrir DevTools simplificado
function openDevTools(tab) {
    // Em um navegador real, isso abriria as ferramentas de desenvolvedor
    // Aqui é apenas uma simulação básica
    alert("Ferramentas do desenvolvedor abertas para esta página");
}

// Atualizar lista de downloads
function updateDownloadsList() {
    const downloadsList = elements.downloadsPanel.querySelector('.downloads-list');
    downloadsList.innerHTML = '';
    
    state.downloads.forEach(download => {
        const item = document.createElement('div');
        item.className = 'download-item';
        item.innerHTML = `
            <div class="download-icon">
                <i class="fas fa-file-download"></i>
            </div>
            <div class="download-info">
                <div class="download-name">${download.filename}</div>
                <div class="download-status">${download.status}</div>
            </div>
            <div class="download-actions">
                <button class="download-open"><i class="fas fa-folder"></i></button>
            </div>
        `;
        
        downloadsList.appendChild(item);
    });
}

// Carregar extensões padrão
function loadDefaultExtensions() {
    // Extensão de exemplo - bloqueador de anúncios
    const adBlocker = {
        id: 'adblocker',
        name: 'Ad Blocker',
        version: '1.0',
        description: 'Bloqueia anúncios em páginas web',
        enabled: true,
        run: function() {
            // Esta função seria chamada quando uma página é carregada
            console.log('Ad Blocker ativo');
        }
    };
    
    state.extensions.push(adBlocker);
    updateExtensionsList();
}

// Atualizar lista de extensões
function updateExtensionsList() {
    const extensionsList = elements.extensionsPanel.querySelector('.extensions-list');
    extensionsList.innerHTML = '';
    
    state.extensions.forEach(extension => {
        const item = document.createElement('div');
        item.className = 'extension-item';
        item.innerHTML = `
            <div class="extension-icon">
                <i class="fas fa-puzzle-piece"></i>
            </div>
            <div class="extension-info">
                <div class="extension-name">${extension.name}</div>
                <div class="extension-version">Versão ${extension.version}</div>
            </div>
            <div class="extension-actions">
                <button class="extension-toggle" data-extension-id="${extension.id}">
                    <i class="fas fa-power-off ${extension.enabled ? 'enabled' : ''}"></i>
                </button>
                <button class="extension-remove" data-extension-id="${extension.id}">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        
        extensionsList.appendChild(item);
    });
    
    // Configurar eventos dos botões
    document.querySelectorAll('.extension-toggle').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const extensionId = btn.dataset.extensionId;
            toggleExtension(extensionId);
            e.stopPropagation();
        });
    });
    
    document.querySelectorAll('.extension-remove').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const extensionId = btn.dataset.extensionId;
            removeExtension(extensionId);
            e.stopPropagation();
        });
    });
}

// Alternar extensão
function toggleExtension(extensionId) {
    const extension = state.extensions.find(ext => ext.id === extensionId);
    if (extension) {
        extension.enabled = !extension.enabled;
        updateExtensionsList();
    }
}

// Remover extensão
function removeExtension(extensionId) {
    state.extensions = state.extensions.filter(ext => ext.id !== extensionId);
    updateExtensionsList();
}

// Manipular redimensionamento da janela
function handleWindowResize() {
    // Ajustar tamanho dos webviews se necessário
    state.tabs.forEach(tab => {
        if (tab.webview) {
            // Pode adicionar lógica de ajuste aqui
        }
    });
}

// Carregar extensão externa
document.getElementById('load-extension-btn').addEventListener('click', () => {
    // Em um navegador real, isso carregaria um arquivo .crx ou similar
    // Aqui é apenas uma simulação
    alert("Funcionalidade de carregar extensão seria implementada aqui");
});

// Limpar histórico
document.getElementById('clear-history-btn').addEventListener('click', () => {
    state.history = [];
    localStorage.removeItem('browserHistory');
    alert("Histórico limpo com sucesso");
});

// Iniciar o navegador
document.addEventListener('DOMContentLoaded', init);