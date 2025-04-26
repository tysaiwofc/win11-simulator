document.addEventListener('DOMContentLoaded', function() {
    // Configurações do repositório
    document.querySelector('.window-control.minimize').addEventListener('click', () => {
        window.electronAPI.minimizeWindow();  // Minimize a janela
      });
      
      document.querySelector('.window-control.close').addEventListener('click', () => {
        window.electronAPI.closeWindow();  // Fechar a janela
      });

    const repoOwner = 'tysaiwofc';
    const repoName = 'win11-simulator-apps';
    const appsPath = 'apps';
    const baseUrl = `https://raw.githubusercontent.com/${repoOwner}/${repoName}/main/${appsPath}`;
    const appsJsonUrl = `https://raw.githubusercontent.com/${repoOwner}/${repoName}/main/apps.json`;

    // Elementos da DOM
    const appGrid = document.getElementById('appGrid');
    const appDetailModal = document.getElementById('appDetailModal');
    const closeModalBtn = document.querySelector('.close-modal');
    const installBtn = document.getElementById('installBtn');
    const notification = document.getElementById('notification');
    const notificationText = document.getElementById('notificationText');
    const searchInput = document.querySelector('.search-bar input');
    const sidebarItems = document.querySelectorAll('.sidebar-item');
    const refreshBtn = document.querySelector('.btn-refresh');
    
    // Variáveis de estado
    let apps = [];
    let filteredApps = [];
    let currentCategory = 'all';
    let currentSearch = '';
    let currentApp = null;
    let installedApps = new Set(); // Para rastrear apps instalados
    
    // Inicialização
    fetchApps();
    setupEventListeners();
    loadInstalledApps(); // Nova função para carregar apps instalados

    // Função para carregar apps instalados (simulada ou via Electron API)
    async function loadInstalledApps() {
        try {
            if (window.electronAPI && window.electronAPI.getInstalledApps) {
                const installed = await window.electronAPI.getInstalledApps();
                installedApps = new Set(installed);
            }
        } catch (error) {
            console.error('Error loading installed apps:', error);
        }
    }
    
    // Função para buscar apps do repositório GitHub
    async function fetchApps() {
        try {
            showLoadingSkeletons();
            
            let appDirs = [];
        try {
            const response = await fetch(appsJsonUrl);
            if (!response.ok) throw new Error('Failed to fetch apps.json');
            appDirs = await response.json();
            if (!Array.isArray(appDirs)) throw new Error('apps.json is not an array');
        } catch (error) {
            console.error('Error fetching apps.json:', error);
            showNotification('Failed to load app list. Using fallback.', 'error');
            // Fallback para uma lista estática, se necessário
            appDirs = ['minecraft'];
        }
            const appsPromises = appDirs.map(async dir => {
                try {
                    const response = await fetch(`${baseUrl}/${dir}/data.json`);
                    if (!response.ok) throw new Error('App not found');
                    
                    const appData = await response.json();
                    return {
                        ...appData,
                        dir: dir,
                        icon: `${baseUrl}/${dir}/${appData.icon}`,
                        downloadUrl: `https://github.com/tysaiwofc/win11-simulator-apps/raw/refs/heads/main/apps/${dir}/${dir}.zip`
                    };
                } catch (error) {
                    console.error(`Error loading app ${dir}:`, error);
                    return null;
                }
            });
            
            const loadedApps = await Promise.all(appsPromises);
            apps = loadedApps.filter(app => app !== null);
            filteredApps = [...apps];
            renderApps();
            
        } catch (error) {
            console.error('Error fetching apps:', error);
            showNotification('Failed to load apps. Please try again.', 'error');
        }
    }
    
    function showLoadingSkeletons() {
        appGrid.innerHTML = '';
        for (let i = 0; i < 8; i++) {
            const skeleton = document.createElement('div');
            skeleton.className = 'app-skeleton';
            appGrid.appendChild(skeleton);
        }
    }
    
    function renderApps() {
        appGrid.innerHTML = '';
        
        if (filteredApps.length === 0) {
            const noResults = document.createElement('div');
            noResults.className = 'no-results';
            noResults.innerHTML = `
                <i class="fas fa-search"></i>
                <h3>No apps found</h3>
                <p>Try changing your search or category filter</p>
            `;
            appGrid.appendChild(noResults);
            return;
        }
        
        filteredApps.forEach(app => {
            const appCard = document.createElement('div');
            appCard.className = 'app-card';
            appCard.dataset.appDir = app.dir;
            const isInstalled = installedApps.has(app.dir);
            appCard.classList.toggle('installed', isInstalled);
            appCard.innerHTML = `
                <img src="${app.icon}" alt="${app.displayName}" class="app-icon">
                <h3 class="app-name">${app.displayName}</h3>
                <p class="app-description">${app.description}</p>

            `;
            // <button class="install-btn">${isInstalled ? 'Abrir' : 'Instalar'}</button>
            // appCard.querySelector('.install-btn').addEventListener('click', (e) => {
            //     e.stopPropagation();
            //     if (isInstalled) {
            //         openApp(app);
            //     } else {
            //         openAppDetail(app);
            //     }
            // });
            appCard.addEventListener('click', () => openAppDetail(app));
            appGrid.appendChild(appCard);
        });
    }
    
    function openAppDetail(app) {
        currentApp = app;
        document.getElementById('detailAppIcon').src = app.icon;
        document.getElementById('detailAppName').textContent = app.displayName;
        document.getElementById('detailAppCategory').textContent = app.category ? app.category : 'Utilities';
        document.getElementById('detailAppDescription').textContent = app.description;
        
        const isInstalled = installedApps.has(app.dir);
        installBtn.textContent = isInstalled ? 'Abrir' : 'Instalar';
        installBtn.style.backgroundColor = '#0FE165'
        installBtn.disabled = isInstalled;
        installBtn.onclick = function() {
            if (isInstalled) {
                openApp(app);
            } else {
                installApp(app);
            }
        };
        
        appDetailModal.classList.add('active');
    }
    
    async function installApp(app) {
        if (installedApps.has(app.dir)) {
            showNotification('Aplicativo já está instalado!');
            return;
        }
        
        try {
            document.getElementById('download-progress-container').style.display = 'block';
            
            const result = await window.electronAPI.downloadApp({
                name: app.displayName,
                dir: app.dir,
                downloadUrl: app.downloadUrl
            });
            
            if (result.error) throw new Error(result.error);
            
            installedApps.add(app.dir);
            showNotification(`${app.displayName} instalado com sucesso!`);
            installBtn.textContent = 'Abrir';
            installBtn.disabled = true;
            window.electronAPI.updateDesktop();
            updateAppStatus(app.dir);
            renderApps(); // Re-render para atualizar o botão
        } catch (error) {
            showNotification(`Erro ao instalar: ${error.message}`, 'error');
        }
    }
    
    function openApp(app) {
        showNotification(`Abrindo ${app.displayName}...`);
        // Implementar lógica para abrir o app via Electron API
        if (window.electronAPI.openApp) {
            window.electronAPI.openApp(app.dir);
        }
    }
    
    window.electronAPI.onDownloadProgress((progress) => {
        const progressBar = document.getElementById('progress-bar');
        const progressText = document.getElementById('progress-text');
        const phaseText = document.getElementById('phase-text');
        const progressContainer = document.getElementById('download-progress-container');
        
        progressBar.style.width = `${progress.percent}%`;
        progressText.textContent = `${progress.percent  || 0}%`;
        
        switch (progress.phase) {
            case 'download':
                phaseText.textContent = 'Baixando...';
                progressBar.style.backgroundColor = '#0078d7';
                break;
            case 'extract':
                phaseText.textContent = 'Instalando...';
                progressBar.style.backgroundColor = '#4CAF50';
                break;
            case 'complete':
                phaseText.textContent = 'Instalação completa!';
                progressBar.style.backgroundColor = '#4CAF50';
                setTimeout(() => {
                    progressContainer.style.display = 'none';
                    progressBar.style.width = '0%';
                    progressText.textContent = '0%';
                }, 1000);
                break;
            case 'error':
                phaseText.textContent = `Erro: ${progress.error}`;
                progressBar.style.backgroundColor = '#f44336';
                setTimeout(() => {
                    progressContainer.style.display = 'none';
                    progressBar.style.width = '0%';
                    progressText.textContent = '0%';
                }, 2000);
                break;
        }
    });
    
    function updateAppStatus(appDir) {
        const appCards = document.querySelectorAll('.app-card');
        appCards.forEach(card => {
            if (card.dataset.appDir === appDir) {
                card.classList.add('installed');
                const btn = card.querySelector('.install-btn');
                if (btn) btn.textContent = 'Abrir';
            }
        });
    }
    
    function showNotification(message, type = 'success') {
        notificationText.textContent = message;
        
        if (type === 'error') {
            notification.querySelector('i').className = 'fas fa-exclamation-circle';
            notification.style.background = '#e74c3c';
        } else {
            notification.querySelector('i').className = 'fas fa-check-circle';
            notification.style.background = 'var(--primary-color)';
        }
        
        notification.classList.add('active');
        
        setTimeout(() => {
            notification.classList.remove('active');
        }, 3000);
    }
    
    function closeModal() {
        appDetailModal.classList.remove('active');
        document.getElementById('download-progress-container').style.display = 'none';
    }
    
    function filterApps() {
        filteredApps = apps.filter(app => {
            const categoryMatch = currentCategory === 'all' || app.category === currentCategory;
            const searchMatch = app.displayName.toLowerCase().includes(currentSearch.toLowerCase()) || 
                              app.description.toLowerCase().includes(currentSearch.toLowerCase());
            return categoryMatch && searchMatch;
        });
        renderApps();
    }
    
    function setupEventListeners() {
        closeModalBtn.addEventListener('click', closeModal);
        appDetailModal.addEventListener('click', function(e) {
            if (e.target === appDetailModal) {
                closeModal();
            }
        });
        
        searchInput.addEventListener('input', function(e) {
            currentSearch = e.target.value;
            filterApps();
        });
        
        sidebarItems.forEach(item => {
            item.addEventListener('click', function() {
                sidebarItems.forEach(i => i.classList.remove('active'));
                item.classList.add('active');
                currentCategory = item.dataset.category;
                filterApps();
            });
        });
        
        refreshBtn.addEventListener('click', fetchApps);
    }
    
    if (!window.electronAPI) {
        window.electronAPI = {
            downloadApp: function(data) {
                console.log('Electron API not available. Simulation mode:');
                console.log('Would download app:', data);
                return new Promise(resolve => {
                    setTimeout(() => {
                        console.log('Download complete:', data.name);
                        resolve();
                    }, 2000);
                });
            },
            onDownloadProgress: function(callback) {
                // Simulação de progresso
                let percent = 0;
                const interval = setInterval(() => {
                    percent += 10;
                    callback({
                        percent,
                        phase: percent < 50 ? 'download' : percent < 100 ? 'extract' : 'complete'
                    });
                    if (percent >= 100) clearInterval(interval);
                }, 200);
            }
        };
    }
});