document.querySelector('.window-control.minimize').addEventListener('click', () => {
  window.electronAPI.minimizeWindow();  // Minimize a janela
});

document.querySelector('.window-control.close').addEventListener('click', () => {
  window.electronAPI.closeWindow();  // Fechar a janela
});

document.addEventListener('DOMContentLoaded', () => {
    // Configuração básica da janela
    setupWindowControls();
    
    // Inicializar o Notepad
    initNotepad();
    
    // Configurar menu
    setupMenu();
    
    // Configurar abas
    setupTabs();
    
    // Configurar eventos do editor
    setupEditorEvents();
  });
  
  function setupWindowControls() {

    
    // Tornar a janela arrastável
    const header = document.querySelector('.window-header');
    header.style.webkitAppRegion = 'drag';
    
    // Tornar elementos dentro do cabeçalho não arrastáveis
    const nonDraggable = header.querySelectorAll('*');
    nonDraggable.forEach(el => {
      el.style.webkitAppRegion = 'no-drag';
    });
  }
  
  function initNotepad() {
    // Estado do aplicativo
    window.notepadState = {
      tabs: [
        {
          id: '1',
          title: 'Untitled',
          content: '',
          filePath: null,
          saved: false
        }
      ],
      activeTab: '1',
      nextTabId: 2
    };
  }
  
  function setupMenu() {
    // Menu File
    document.getElementById('new-file').addEventListener('click', newFile);
    document.getElementById('new-tab').addEventListener('click', newTab);
    document.getElementById('open-file').addEventListener('click', openFile);
    document.getElementById('save-file').addEventListener('click', saveFile);
    document.getElementById('save-as-file').addEventListener('click', saveAsFile);
    document.getElementById('exit').addEventListener('click', () => window.electronAPI.closeWindow());
    
    // Menu Edit
    document.getElementById('undo').addEventListener('click', () => {
      document.querySelector('.notepad-textarea.active').dispatchEvent(
        new Event('undo')
      );
    });
    
    document.getElementById('cut').addEventListener('click', () => {
      document.execCommand('cut');
    });
    
    document.getElementById('copy').addEventListener('click', () => {
      document.execCommand('copy');
    });
    
    document.getElementById('paste').addEventListener('click', () => {
      document.execCommand('paste');
    });
    
    document.getElementById('delete').addEventListener('click', () => {
      document.execCommand('delete');
    });
    
    document.getElementById('select-all').addEventListener('click', () => {
      document.querySelector('.notepad-textarea.active').select();
    });
    
    // Menu View
    document.getElementById('word-wrap').querySelector('input').addEventListener('change', (e) => {
      const textareas = document.querySelectorAll('.notepad-textarea');
      textareas.forEach(textarea => {
        textarea.style.whiteSpace = e.target.checked ? 'pre-wrap' : 'pre';
      });
    });
  }
  
  function setupTabs() {
    const tabsContainer = document.querySelector('.tabs-container');
    
    // Adicionar nova aba
    document.querySelector('.tabs-add').addEventListener('click', newTab);
    
    // Alternar entre abas
    tabsContainer.addEventListener('click', (e) => {
      const tab = e.target.closest('.tab');
      if (tab) {
        const tabId = tab.dataset.tabId;
        switchTab(tabId);
      }
      
      // Fechar aba
      if (e.target.classList.contains('tab-close')) {
        const tab = e.target.closest('.tab');
        const tabId = tab.dataset.tabId;
        closeTab(tabId);
      }
    });
  }
  
  function setupEditorEvents() {
    // Atualizar status bar
    document.addEventListener('keyup', updateStatusBar);
    document.addEventListener('mouseup', updateStatusBar);
    
    // Atualizar conteúdo na memória quando alterado
    document.querySelector('.notepad-textarea').addEventListener('input', (e) => {
      const activeTabId = window.notepadState.activeTab;
      const tab = window.notepadState.tabs.find(t => t.id === activeTabId);
      if (tab) {
        tab.content = e.target.value;
        tab.saved = false;
        updateTabTitle(tab.id, `${tab.title}*`);
      }
    });
  }
  
  function newFile() {
    const activeTabId = window.notepadState.activeTab;
    const tab = window.notepadState.tabs.find(t => t.id === activeTabId);
    
    if (tab && !tab.saved && tab.content.trim() !== '') {
      // Perguntar se deseja salvar antes de criar novo arquivo
      if (confirm('Do you want to save changes?')) {
        saveFile();
      }
    }
    
    // Limpar conteúdo
    const textarea = document.querySelector('.notepad-textarea.active');
    textarea.value = '';
    
    // Atualizar estado
    tab.content = '';
    tab.filePath = null;
    tab.title = 'Untitled';
    tab.saved = false;
    
    updateTabTitle(tab.id, tab.title);
    updateStatusBar();
  }
  
  function newTab() {
    const newTabId = window.notepadState.nextTabId.toString();
    window.notepadState.nextTabId++;
    
    const newTab = {
      id: newTabId,
      title: 'Untitled',
      content: '',
      filePath: null,
      saved: false
    };
    
    window.notepadState.tabs.push(newTab);
    
    // Criar elemento da aba
    const tabElement = document.createElement('div');
    tabElement.className = 'tab';
    tabElement.dataset.tabId = newTabId;
    tabElement.innerHTML = `
      <span>${newTab.title}</span>
      <div class="tab-close">×</div>
    `;
    
    // Inserir antes do botão de adicionar
    const tabsAdd = document.querySelector('.tabs-add');
    tabsAdd.before(tabElement);
    
    // Criar conteúdo da aba
    const contentElement = document.createElement('div');
    contentElement.className = 'notepad-content';
    contentElement.dataset.tabId = newTabId;
    contentElement.innerHTML = `
      <textarea class="notepad-textarea" spellcheck="false"></textarea>
    `;
    
    document.querySelector('.window-content').appendChild(contentElement);
    
    // Configurar eventos do textarea
    const textarea = contentElement.querySelector('.notepad-textarea');
    textarea.addEventListener('input', (e) => {
      const tab = window.notepadState.tabs.find(t => t.id === newTabId);
      if (tab) {
        tab.content = e.target.value;
        tab.saved = false;
        updateTabTitle(tab.id, `${tab.title}*`);
      }
    });
    
    // Ativar a nova aba
    switchTab(newTabId);
  }
  
  function switchTab(tabId) {
    // Desativar aba atual
    document.querySelectorAll('.tab.active, .notepad-content.active').forEach(el => {
      el.classList.remove('active');
    });
    
    // Ativar nova aba
    document.querySelectorAll(`.tab[data-tab-id="${tabId}"], .notepad-content[data-tab-id="${tabId}"]`).forEach(el => {
      el.classList.add('active');
    });
    
    // Ativar textarea
    document.querySelectorAll('.notepad-textarea').forEach(el => {
      el.classList.remove('active');
    });
    document.querySelector(`.notepad-content[data-tab-id="${tabId}"] .notepad-textarea`).classList.add('active');
    
    // Atualizar estado
    window.notepadState.activeTab = tabId;
    
    // Atualizar status bar
    updateStatusBar();
  }
  
  function closeTab(tabId) {
    if (window.notepadState.tabs.length <= 1) {
      // Última aba - criar uma nova antes de fechar
      newTab();
    }
    
    const tab = window.notepadState.tabs.find(t => t.id === tabId);
    
    // Verificar se há alterações não salvas
    if (tab && !tab.saved && tab.content.trim() !== '') {
      if (!confirm('Do you want to save changes?')) {
        // Não salvar - continuar com o fechamento
        removeTab(tabId);
        return;
      }
      
      saveFile(() => {
        removeTab(tabId);
      });
      return;
    }
    
    removeTab(tabId);
  }
  
  function removeTab(tabId) {
    // Remover do estado
    window.notepadState.tabs = window.notepadState.tabs.filter(t => t.id !== tabId);
    
    // Remover elementos do DOM
    document.querySelector(`.tab[data-tab-id="${tabId}"]`).remove();
    document.querySelector(`.notepad-content[data-tab-id="${tabId}"]`).remove();
    
    // Ativar a primeira aba disponível
    if (window.notepadState.tabs.length > 0) {
      switchTab(window.notepadState.tabs[0].id);
    }
  }
  
  function openFile() {
    // Usar a API do Electron para abrir diálogo de arquivo
    window.electronAPI.openFileDialog().then(result => {
      if (!result.canceled && result.filePaths.length > 0) {
        const filePath = result.filePaths[0];
        const fileName = filePath.split('/').pop().split('\\').pop();
        
        // Ler conteúdo do arquivo
        window.electronAPI.readFile(filePath).then(content => {
          const activeTabId = window.notepadState.activeTab;
          const tab = window.notepadState.tabs.find(t => t.id === activeTabId);
          
          if (tab) {
            // Atualizar conteúdo da aba atual
            tab.content = content;
            tab.filePath = filePath;
            tab.title = fileName;
            tab.saved = true;
            
            // Atualizar UI
            document.querySelector('.notepad-textarea.active').value = content;
            updateTabTitle(tab.id, tab.title);
            updateStatusBar();
          }
        }).catch(err => {
          alert('Error reading file: ' + err.message);
        });
      }
    });
  }
  
  function saveFile(callback) {
    const activeTabId = window.notepadState.activeTab;
    const tab = window.notepadState.tabs.find(t => t.id === activeTabId);
    
    if (!tab) return;
    
    if (tab.filePath) {
      // Arquivo já existe - sobrescrever
      const content = document.querySelector('.notepad-textarea.active').value;
      
      window.electronAPI.writeFile(tab.filePath, content).then(() => {
        tab.saved = true;
        tab.content = content;
        updateTabTitle(tab.id, tab.title);
        
        if (callback) callback();
      }).catch(err => {
        alert('Error saving file: ' + err.message);
      });
    } else {
      // Novo arquivo - usar "Salvar como"
      saveAsFile(callback);
    }
  }
  
  function saveAsFile(callback) {
    const activeTabId = window.notepadState.activeTab;
    const tab = window.notepadState.tabs.find(t => t.id === activeTabId);
    const content = document.querySelector('.notepad-textarea.active').value;
    
    window.electronAPI.saveFileDialog().then(result => {
      if (!result.canceled && result.filePath) {
        window.electronAPI.writeFile(result.filePath, content).then(() => {
          const fileName = result.filePath.split('/').pop().split('\\').pop();
          
          tab.filePath = result.filePath;
          tab.title = fileName;
          tab.saved = true;
          tab.content = content;
          
          updateTabTitle(tab.id, tab.title);
          
          if (callback) callback();
        }).catch(err => {
          alert('Error saving file: ' + err.message);
        });
      }
    });
  }
  
  function updateTabTitle(tabId, title) {
    const tabElement = document.querySelector(`.tab[data-tab-id="${tabId}"]`);
    if (tabElement) {
      tabElement.querySelector('span').textContent = title;
    }
  }
  
  function updateStatusBar() {
    const textarea = document.querySelector('.notepad-textarea.active');
    if (!textarea) return;
    
    const cursorPos = textarea.selectionStart;
    const text = textarea.value.substring(0, cursorPos);
    const lines = text.split('\n');
    const line = lines.length;
    const col = lines[lines.length - 1].length + 1;
    
    document.querySelector('.notepad-statusbar span').textContent = `Ln ${line}, Col ${col}`;
  }

  