document.querySelector('.window-control.minimize').addEventListener('click', () => {
  window.electronAPI.minimizeWindow();  // Minimize a janela
});

document.querySelector('.window-control.close').addEventListener('click', () => {
  window.electronAPI.closeWindow();  // Fechar a janela
});

let currentPath = '/';


// Arquivos de interatividade e comandos
const cmdInput = document.getElementById('cmdInput');
const output = document.getElementById('output');
const prompt = () => `${currentPath}> `;  // Atualizando o prompt para refletir o diretório atual


// Função para mostrar a mensagem de início
function showWelcomeMessage() {
  const welcomeMessage = `
    Bem-vindo ao terminal interativo.
    Digite seus comandos abaixo e pressione Enter para executá-los.
    Para ver uma lista de comandos disponíveis, digite 'help'.
  `;
  output.innerHTML += `<div>${welcomeMessage}</div>`;
  output.scrollTop = output.scrollHeight;
}

// Chama a função ao carregar a página
window.onload = () => {
  showWelcomeMessage();
  output.innerHTML += `<div>${prompt()}</div>`; // Exibe o prompt após a mensagem de boas-vindas
};

cmdInput.addEventListener('keydown', async (event) => {
  if (event.key === 'Enter') {
    const command = cmdInput.value.trim();
    cmdInput.value = ''; // Limpar input

    const commandParts = command.split(' ');
    const cmd = commandParts[0].toLowerCase();

    // Exibir o comando digitado com o prompt atualizado
    output.innerHTML += `<div>${prompt()}${command}</div>`; 
    output.scrollTop = output.scrollHeight;

    switch (cmd) {
      case 'dir':
        // Comando 'dir' para listar arquivos e diretórios
        const path = commandParts[1] || currentPath;
        const files = await window.electronAPI.readDirectory(path);
        files.forEach(file => {
          output.innerHTML += `<div>${file.name || file.path}</div>`;
        });
        break;

      case 'cd':
        // Comando 'cd' para navegar entre diretórios
        const newPath = commandParts[1];
        if (newPath) {
          currentPath = newPath;
          output.innerHTML += `<div>Alterando para o diretório ${newPath}</div>`;
        } else {
          output.innerHTML += `<div>Erro: O comando 'cd' requer um diretório.</div>`;
        }
        break;

      case 'open':
        // Comando 'open' para abrir um arquivo
        const filePath = commandParts[1];
        try {
          const fileContent = await window.electronAPI.readFile(filePath);
          output.innerHTML += `<div>Conteúdo do arquivo:</div><pre>${fileContent}</pre>`;
        } catch (e) {
          output.innerHTML += `<div>Erro ao abrir o arquivo: ${e.message}</div>`;
        }
        break;

      case 'notify':
        // Enviar notificação
        const title = commandParts[1];
        const message = commandParts.slice(2).join(' ');
        window.electronAPI.sendNotification(title, message);
        output.innerHTML += `<div>Notificação enviada: ${title} - ${message}</div>`;
        break;

      case 'notifications':
        // Listar notificações
        const notifications = await window.electronAPI.getNotifications();
        notifications.forEach(notification => {
          output.innerHTML += `<div>${notification.unread ? '[Novo]' : '[Lido]'} ${notification.title}: ${notification.message}</div>`;
        });
        break;

      case 'clear-notifications':
        // Limpar notificações
        await window.electronAPI.clearNotifications();
        output.innerHTML += `<div>Notificações limpas.</div>`;
        break;

      case 'fullscreen':
        // Alternar para tela cheia
        window.electronAPI.toggleFullScreen();
        output.innerHTML += `<div>Modo de tela cheia alternado.</div>`;
        break;

      case 'minimize':
        // Minimizar a janela
        await window.electronAPI.minimizeWindow();
        output.innerHTML += `<div>Janela minimizada.</div>`;
        break;

      case 'maximize':
        // Maximizar a janela
        await window.electronAPI.maximizeWindow();
        output.innerHTML += `<div>Janela maximizada.</div>`;
        break;

      case 'close':
        // Fechar a janela
        await window.electronAPI.closeWindow();
        output.innerHTML += `<div>Janela fechada.</div>`;
        break;

      case 'restart':
        // Reiniciar o app
        window.electronAPI.restartApp();
        output.innerHTML += `<div>Reiniciando o app...</div>`;
        break;

      case 'get-config':
        // Obter configuração
        const configKey = commandParts[1];
        const configValue = await window.electronAPI.getConfig(configKey);
        output.innerHTML += `<div>Configuração de ${configKey}: ${configValue}</div>`;
        break;

      case 'set-config':
        // Definir configuração
        const key = commandParts[1];
        const value = commandParts.slice(2).join(' ');
        await window.electronAPI.setConfig(key, value);
        output.innerHTML += `<div>Configuração ${key} definida como: ${value}</div>`;
        break;

        case 'help':
          // Comando 'help' para mostrar ajuda
          output.innerHTML += `<div>Comandos disponíveis:</div>`;
          output.innerHTML += `<div>dir - Listar arquivos e diretórios</div>`;
          output.innerHTML += `<div>cd [diretório] - Navegar entre diretórios</div>`;
          output.innerHTML += `<div>open [arquivo] - Abrir arquivo</div>`;
          output.innerHTML += `<div>notify [título] [mensagem] - Enviar notificação</div>`;
          output.innerHTML += `<div>notifications - Listar notificações</div>`;
          output.innerHTML += `<div>clear-notifications - Limpar notificações</div>`;
          output.innerHTML += `<div>fullscreen - Alternar para tela cheia</div>`;
          output.innerHTML += `<div>minimize - Minimizar janela</div>`;
          output.innerHTML += `<div>maximize - Maximizar janela</div>`;
          output.innerHTML += `<div>close - Fechar janela</div>`;
          output.innerHTML += `<div>restart - Reiniciar o app</div>`;
          output.innerHTML += `<div>get-config [chave] - Obter valor de configuração</div>`;
          output.innerHTML += `<div>set-config [chave] [valor] - Definir valor de configuração</div>`;
          output.innerHTML += `<div>get-apps - Obter aplicativos instalados</div>`;
          output.innerHTML += `<div>get-desktop-items - Obter itens da área de trabalho</div>`;
          output.innerHTML += `<div>open-app [nome] - Abrir um aplicativo</div>`;
          output.innerHTML += `<div>get-version - Obter versão do aplicativo</div>`;
          output.innerHTML += `<div>ping [URL] - Realizar ping em uma URL</div>`;
          output.innerHTML += `<div>get-ip - Obter IP público</div>`;
          output.innerHTML += `<div>check-url [URL] - Verificar se uma URL está acessível</div>`;
          break;
        

      case 'get-apps':
        // Obter aplicativos instalados
        const apps = await window.electronAPI.getApps();
        apps.forEach(app => {
          output.innerHTML += `<div>Aplicativo: ${app}</div>`;
        });
        break;

      case 'get-desktop-items':
        // Obter itens da área de trabalho
        const desktopItems = await window.electronAPI.getDesktopItems();
        desktopItems.forEach(item => {
          output.innerHTML += `<div>Item na área de trabalho: ${item}</div>`;
        });
        break;

      case 'open-app':
        // Abrir um aplicativo
        const appName = commandParts[1];
        if (appName) {
          await window.electronAPI.openApp(appName);
          output.innerHTML += `<div>Abrindo o aplicativo: ${appName}</div>`;
        } else {
          output.innerHTML += `<div>Erro: O comando 'open-app' requer um nome de aplicativo.</div>`;
        }
        break;

      case 'get-version':
        // Obter versão do app
        const version = await window.electronAPI.getAppVersion();
        output.innerHTML += `<div>Versão do aplicativo: ${version}</div>`;
        break;
        case 'ping':
          const urlToPing = commandParts[1];
          if (urlToPing) {
            try {
              const pingResult = await pingURL(urlToPing);
              output.innerHTML += `<div>Resultado do Ping para ${urlToPing}: ${pingResult}</div>`;
            } catch (e) {
              output.innerHTML += `<div>Erro ao tentar fazer Ping: ${e.message}</div>`;
            }
          } else {
            output.innerHTML += `<div>Erro: O comando 'ping' requer uma URL.</div>`;
          }
          break;
  
        // Comando 'get-ip' para obter o IP público
        case 'get-ip':
          try {
            const ipAddress = await getPublicIP();
            output.innerHTML += `<div>Seu IP público é: ${ipAddress}</div>`;
          } catch (e) {
            output.innerHTML += `<div>Erro ao obter IP público: ${e.message}</div>`;
          }
          break;
  
        // Comando 'check-url' para verificar se uma URL está acessível
        case 'check-url':
          const urlToCheck = commandParts[1];
          if (urlToCheck) {
            try {
              const status = await checkURLStatus(urlToCheck);
              output.innerHTML += `<div>Status da URL ${urlToCheck}: ${status}</div>`;
            } catch (e) {
              output.innerHTML += `<div>Erro ao verificar URL: ${e.message}</div>`;
            }
          } else {
            output.innerHTML += `<div>Erro: O comando 'check-url' requer uma URL.</div>`;
          }
          break;
  
        // Outros comandos (como 'help', 'get-apps', etc.) já mostrados
  
        default:
          output.innerHTML += `<div>Comando não reconhecido: ${command}</div>`;
    }

    // Scroll até o final
    output.scrollTop = output.scrollHeight;
  }
});

async function pingURL(url) {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    if (response.ok) {
      return 'Servidor respondendo!';
    } else {
      return `Erro ao acessar o servidor. Status: ${response.status}`;
    }
  } catch (error) {
    throw new Error('Falha na conexão. Não foi possível acessar o servidor.');
  }
}

// Função para obter o IP público usando uma API externa
async function getPublicIP() {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch (error) {
    throw new Error('Não foi possível obter o IP público');
  }
}

// Função para verificar se uma URL está acessível
async function checkURLStatus(url) {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    if (response.ok) {
      return `A URL está acessível. Status: ${response.status}`;
    } else {
      return `Erro ao acessar a URL. Status: ${response.status}`;
    }
  } catch (error) {
    throw new Error(`Erro ao verificar URL: ${error.message}`);
  }
}