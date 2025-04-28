document.querySelector('.window-control.minimize').addEventListener('click', () => {
    window.electronAPI.minimizeWindow();  // Minimize a janela
  });
  
  document.querySelector('.window-control.close').addEventListener('click', () => {
    window.electronAPI.closeWindow();  // Fechar a janela
  });

document.addEventListener('DOMContentLoaded', function() {
    // Configuração inicial
    const appData = {
        currentServer: 'win11-simulator',
        currentChannel: 'releases',
        user: {
            id: 'user',
            username: 'client',
            avatar: 'https://th.bing.com/th/id/OIP.XyU71HwAz9FJ9ab23aKrGAHaHa?rs=1&pid=ImgDetMain',
            status: 'online',
            activity: 'Playning on win11-simulator'
        },
        servers: {
            'home': {
                name: 'Home',
                icon: 'https://cdn-icons-png.flaticon.com/512/2111/2111370.png',
                channels: {
                    'general': {
                        name: 'general',
                        messages: []
                    }
                }
            },
            'win11-simulator': {
                name: 'Win11 Simulator',
                icon: 'https://github.com/tysaiwofc.png',
                channels: {
                    'releases': {
                        name: 'releases',
                        messages: [] // Será preenchido pela API
                    },
                    'general': {
                        name: 'general',
                        messages: [
                            {
                                id: '1',
                                author: 'tysaiwofc',
                                avatar: 'https://github.com/tysaiwofc.png',
                                content: 'Welcome to the win11-simulator server!',
                                timestamp: new Date().toISOString()
                            }
                        ]
                    }
                }
            }
        }
    };

    // Elementos DOM
    const messagesContainer = document.querySelector('.messages');
    const channelHeader = document.querySelector('.channel-info span');
    const serverHeader = document.querySelector('.server-header h2');
    const serverIcons = document.querySelectorAll('.server-icon');
    const channels = document.querySelectorAll('.channel');
    const messageInput = document.querySelector('.message-input input');

    // Buscar releases do GitHub com cache local
    async function fetchGitHubReleases() {
        const CACHE_KEY = 'gh-releases-win11-simulator';
        const CACHE_DURATION = 3600000; // 1 hora em milissegundos
        
        // Verificar cache primeiro
        const cachedData = localStorage.getItem(CACHE_KEY);
        if (cachedData) {
            const { data, timestamp } = JSON.parse(cachedData);
            if (Date.now() - timestamp < CACHE_DURATION) {
                processReleases(data);
                return;
            }
        }
        
        try {
            const response = await fetch('https://api.github.com/repos/tysaiwofc/win11-simulator/releases');
            
            if (!response.ok) {
                throw new Error(`GitHub API error: ${response.status}`);
            }
            
            const releases = await response.json();
    
            
            // Salvar no cache local
            localStorage.setItem(CACHE_KEY, JSON.stringify({
                data: releases,
                timestamp: Date.now()
            }));
            
            processReleases(releases);
        } catch (error) {
            console.error('Error fetching GitHub releases:', error);
            showErrorMessage();
        }
    }

    function processReleases(releases) {
        // Converter releases em mensagens
        const releaseMessages = releases.map(release => ({
            id: release.id.toString(),
            author: 'tysaiwofc',
            avatar: 'https://github.com/tysaiwofc.png',
            content: `${release.name || release.tag_name}`,
            timestamp: release.published_at || release.created_at,
            isRelease: true,
            releaseData: {
                version: release.tag_name,
                date: new Date(release.published_at || release.created_at).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                }),
                notes: release.body || 'No release notes provided',
                url: release.html_url
            }
        }))
        
        // Ordenar do mais antigo para o mais recente
releaseMessages.sort((a, b) => 
    new Date(a.timestamp) - new Date(b.timestamp));
        // Atualizar dados do app
        appData.servers['win11-simulator'].channels.releases.messages = releaseMessages;
        
        // Renderizar mensagens se estivermos no canal de releases
        if (appData.currentChannel === 'releases') {
            renderMessages();
        }
    }

    function showErrorMessage() {
        appData.servers['win11-simulator'].channels.releases.messages = [{
            id: 'error',
            author: 'System',
            avatar: 'https://cdn-icons-png.flaticon.com/512/1828/1828884.png',
            content: 'Failed to load releases from GitHub. Please check your connection or try again later.',
            timestamp: new Date().toISOString()
        }];
        
        renderMessages();
    }

    // Renderizar mensagens
    function renderMessages() {
        const server = appData.servers[appData.currentServer];
        const channel = server.channels[appData.currentChannel];
        
        messagesContainer.innerHTML = '';
        
        if (channel.messages.length === 0) {
            messagesContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-inbox"></i>
                    <p>No messages yet</p>
                </div>
            `;
            return;
        }
        
        channel.messages.forEach(message => {
            const messageElement = document.createElement('div');
            messageElement.className = 'message';
            
            const timestamp = new Date(message.timestamp);
            const timeString = timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const dateString = timestamp.toLocaleDateString();
            
            let messageContent = message.content;
            
            if (message.isRelease) {
                messageContent = `
                    <div class="release-message">
                        <div class="release-header">
                            <span class="release-version">${message.releaseData.version}</span>
                            <span class="release-date">${message.releaseData.date}</span>
                        </div>
                        <div class="release-notes">
                            ${formatReleaseNotes(message.releaseData.notes)}
                        </div>
                        <div class="release-footer">
                            <a class="btn-github" href="${message.releaseData.url}" target="_blank" rel="noopener noreferrer">
                                <i class="fab fa-github"></i> View on GitHub
                            </a>
                        </div>
                    </div>
                `;
            }
            
            messageElement.innerHTML = `
                <div class="message-avatar">
                    <img src="${message.avatar}" alt="${message.author}">
                    
                </div>
                <div class="message-content">
                    <div class="message-header">
                        <span class="message-author">${message.author}</span>
                        ${message.isRelease ? '<span class="app-badge">APP</span>' : ''}
                        <span class="message-timestamp">${dateString} at ${timeString}</span>
                    </div>
                    <div class="message-text">${messageContent}</div>
                </div>
                <div class="message-actions">
                    <span class="message-action"><i class="fas fa-reply"></i></span>
                    <span class="message-action"><i class="fas fa-ellipsis-h"></i></span>
                </div>
            `;
            
            messagesContainer.appendChild(messageElement);
        });
        
        // Scroll para baixo
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    // Formatador de release notes
    function formatReleaseNotes(notes) {
        if (!notes) return '<p>No release notes provided</p>';
        
        // Converter Markdown básico para HTML
        return notes
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Negrito
            .replace(/\*(.*?)\*/g, '<em>$1</em>') // Itálico
            .replace(/- (.*?)(\n|$)/g, '<li>$1</li>') // Listas
            .replace(/# (.*?)(\n|$)/g, '<h3>$1</h3>') // Headers
            .split('\n\n').map(para => 
                para.startsWith('<li>') ? `<ul>${para}</ul>` : `<p>${para}</p>`
            ).join('');
    }

    // Update channel view
    function updateChannelView() {
        const server = appData.servers[appData.currentServer];
        const channel = server.channels[appData.currentChannel];
        
        serverHeader.textContent = server.name;
        channelHeader.textContent = channel.name;
        
        renderMessages();
    }

    // Server icon click handler
    serverIcons.forEach(icon => {
        icon.addEventListener('click', function() {
            const serverId = this.getAttribute('data-server');
            appData.currentServer = serverId;
            
            // Update active states
            serverIcons.forEach(i => i.classList.remove('active'));
            this.classList.add('active');
            
            // Set first channel as active
            const firstChannel = Object.keys(appData.servers[serverId].channels)[0];
            appData.currentChannel = firstChannel;
            
            // Update channel active states
            channels.forEach(ch => ch.classList.remove('active'));
            document.querySelector(`.channel[data-channel="${firstChannel}"]`).classList.add('active');
            
            updateChannelView();
        });
    });

    // Channel click handler
    channels.forEach(channel => {
        channel.addEventListener('click', function() {
            const channelId = this.getAttribute('data-channel');
            appData.currentChannel = channelId;
            
            // Update active states
            channels.forEach(ch => ch.classList.remove('active'));
            this.classList.add('active');
            
            updateChannelView();
        });
    });

    // Message input handler
    messageInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && this.value.trim() !== '') {
            const newMessage = {
                id: Date.now().toString(),
                author: appData.user.username,
                avatar: appData.user.avatar,
                content: this.value.trim(),
                timestamp: new Date().toISOString()
            };
            
            const server = appData.servers[appData.currentServer];
            const channel = server.channels[appData.currentChannel];
            channel.messages.push(newMessage);
            
            this.value = '';
            renderMessages();
        }
    });

    // Add server button
    document.querySelector('.add-server').addEventListener('click', function() {
        const serverId = 'server-' + Date.now();
        const serverName = prompt('Enter server name:');
        
        if (serverName) {
            // Create new server
            appData.servers[serverId] = {
                name: serverName,
                icon: 'https://cdn-icons-png.flaticon.com/512/2111/2111370.png',
                channels: {
                    'general': {
                        name: 'general',
                        messages: [
                            {
                                id: '1',
                                author: appData.user.username,
                                avatar: appData.user.avatar,
                                content: `Welcome to the ${serverName} server!`,
                                timestamp: new Date().toISOString()
                            }
                        ]
                    }
                }
            };
            
            // Create new server icon
            const newServerIcon = document.createElement('div');
            newServerIcon.className = 'server-icon';
            newServerIcon.setAttribute('data-server', serverId);
            newServerIcon.innerHTML = `<img src="${appData.servers[serverId].icon}" alt="${serverName}">`;
            
            // Insert before add button
            this.parentNode.insertBefore(newServerIcon, this);
            
            // Add click handler
            newServerIcon.addEventListener('click', function() {
                const serverId = this.getAttribute('data-server');
                appData.currentServer = serverId;
                
                // Update active states
                serverIcons.forEach(i => i.classList.remove('active'));
                this.classList.add('active');
                
                // Set first channel as active
                const firstChannel = Object.keys(appData.servers[serverId].channels)[0];
                appData.currentChannel = firstChannel;
                
                // Update channel active states
                channels.forEach(ch => ch.classList.remove('active'));
                document.querySelector(`.channel[data-channel="${firstChannel}"]`).classList.add('active');
                
                updateChannelView();
            });
        }
    });
    
    // Add channel button
    document.querySelector('.add-channel').addEventListener('click', function() {
        const channelName = prompt('Enter channel name:');
        
        if (channelName) {
            const server = appData.servers[appData.currentServer];
            
            // Create new channel
            server.channels[channelName.toLowerCase()] = {
                name: channelName.toLowerCase(),
                messages: []
            };
            
            // Create new channel element
            const newChannel = document.createElement('div');
            newChannel.className = 'channel';
            newChannel.setAttribute('data-channel', channelName.toLowerCase());
            newChannel.innerHTML = `
                <i class="fas fa-hashtag"></i>
                <span>${channelName.toLowerCase()}</span>
            `;
            
            // Insert before add button
            this.parentNode.insertBefore(newChannel, this);
            
            // Add click handler
            newChannel.addEventListener('click', function() {
                const channelId = this.getAttribute('data-channel');
                appData.currentChannel = channelId;
                
                // Update active states
                channels.forEach(ch => ch.classList.remove('active'));
                this.classList.add('active');
                
                updateChannelView();
            });
        }
    });

    // Inicialização
    fetchGitHubReleases();
    updateChannelView();

    // Atualizar a cada hora
    setInterval(fetchGitHubReleases, 3600000);
});