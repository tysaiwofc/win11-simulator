# Documentação da API do Windows 11 Simulator

## Visão Geral
Esta documentação descreve a API exposta pelo Electron para o renderer process do Windows 11 Simulator. A API está dividida em vários namespaces para organização lógica.

## Namespace `electronAPI`

### 🗂️ Operações de Arquivos

#### `fileExists(path)`
- **Descrição**: Verifica se um arquivo existe
- **Parâmetros**:
  - `path` (String): Caminho completo do arquivo
- **Retorno**: Promise<Boolean>

#### `getFileUrl(path)`
- **Descrição**: Converte um caminho de arquivo para URL file://
- **Parâmetros**:
  - `path` (String): Caminho do arquivo
- **Retorno**: Promise<String> (URL formatada)

#### `readFile(filePath)`
- **Descrição**: Lê o conteúdo de um arquivo
- **Parâmetros**:
  - `filePath` (String): Caminho do arquivo
- **Retorno**: Promise<String> (Conteúdo do arquivo)

#### `writeFile(filePath, content)`
- **Descrição**: Escreve conteúdo em um arquivo
- **Parâmetros**:
  - `filePath` (String): Caminho do arquivo
  - `content` (String): Conteúdo a ser escrito
- **Retorno**: Promise<Boolean> (true se sucesso)

#### `readDirectory(subPath = '')`
- **Descrição**: Lista arquivos de um diretório
- **Parâmetros**:
  - `subPath` (String) [opcional]: Subdiretório
- **Retorno**: Promise<Array> (Lista de arquivos com metadados)

#### `openFile(filePath)`
- **Descrição**: Abre um arquivo com o aplicativo padrão ou aplicativo registrado
- **Parâmetros**:
  - `filePath` (String): Caminho do arquivo
- **Retorno**: Promise<Boolean>

#### `getFileInfo(filePath)`
- **Descrição**: Obtém metadados de um arquivo
- **Parâmetros**:
  - `filePath` (String): Caminho do arquivo
- **Retorno**: Promise<Object> (size, modified, isDirectory, etc)

#### `getDirectoryFromFile(filePath)`
- **Descrição**: Obtém o diretório contendo um arquivo
- **Parâmetros**:
  - `filePath` (String): Caminho do arquivo
- **Retorno**: Promise<Object> (directory path e lista de arquivos)

#### `isImageFile(filename)`
- **Descrição**: Verifica se um arquivo é uma imagem
- **Parâmetros**:
  - `filename` (String): Nome do arquivo
- **Retorno**: Promise<Boolean>

#### `isVideoFile(filename)`
- **Descrição**: Verifica se um arquivo é um vídeo
- **Parâmetros**:
  - `filename` (String): Nome do arquivo
- **Retorno**: Promise<Boolean>

### 💬 Diálogos do Sistema

#### `showOpenDialog(options)`
- **Descrição**: Mostra diálogo de abrir arquivo
- **Parâmetros**:
  - `options` (Object): Opções do diálogo
- **Retorno**: Promise<Object> (resultado do diálogo)

#### `showSaveDialog(options)`
- **Descrição**: Mostra diálogo de salvar arquivo
- **Parâmetros**:
  - `options` (Object): Opções do diálogo
- **Retorno**: Promise<Object> (resultado do diálogo)

#### `openFileDialog()`
- **Descrição**: Diálogo simplificado para abrir arquivo
- **Retorno**: Promise<String> (caminho do arquivo selecionado)

#### `saveFileDialog()`
- **Descrição**: Diálogo simplificado para salvar arquivo
- **Retorno**: Promise<String> (caminho do arquivo selecionado)

### 📁 Diretórios e Caminhos

#### `getAssetsPath()`
- **Descrição**: Obtém caminho da pasta de assets
- **Retorno**: Promise<String>

#### `getDirPath()`
- **Descrição**: Obtém caminho base do aplicativo
- **Retorno**: Promise<String>

### 📦 Dados do Aplicativo

#### `getAppData(appName)`
- **Descrição**: Obtém dados de um aplicativo
- **Parâmetros**:
  - `appName` (String): Nome do aplicativo
- **Retorno**: Promise<Object>

#### `saveAppData(appName, data)`
- **Descrição**: Salva dados de um aplicativo
- **Parâmetros**:
  - `appName` (String): Nome do aplicativo
  - `data` (Object): Dados a serem salvos
- **Retorno**: Promise<Boolean>

#### `checkFirstRun()`
- **Descrição**: Verifica se é a primeira execução
- **Retorno**: Promise<Boolean>

### 🚀 Aplicativos

#### `openApp(appName)`
- **Descrição**: Abre um aplicativo
- **Parâmetros**:
  - `appName` (String): Nome do aplicativo
- **Retorno**: Promise<Boolean>

#### `getApps()`
- **Descrição**: Lista todos os aplicativos disponíveis
- **Retorno**: Promise<Array>

### 🖥️ Desktop

#### `getDesktopItems()`
- **Descrição**: Obtém itens do desktop
- **Retorno**: Promise<Array>

#### `pasteToDesktop()`
- **Descrição**: Cola conteúdo da área de transferência no desktop
- **Retorno**: Promise<Boolean>

#### `hasClipboardItems()`
- **Descrição**: Verifica se há itens na área de transferência
- **Retorno**: Promise<Boolean>

### 🪟 Controle de Janela

#### `minimizeWindow()`
- **Descrição**: Minimiza a janela atual
- **Retorno**: void

#### `maximizeWindow()`
- **Descrição**: Maximiza/Restaura a janela atual
- **Retorno**: void

#### `closeWindow()`
- **Descrição**: Fecha a janela atual
- **Retorno**: void

### 🌐 Links Externos

#### `openExternal(url)`
- **Descrição**: Abre URL no navegador padrão
- **Parâmetros**:
  - `url` (String): URL a ser aberta
- **Retorno**: void

### 🔄 Atualizações

#### `checkForUpdates()`
- **Descrição**: Verifica atualizações disponíveis
- **Retorno**: Promise<Object>

#### `downloadUpdate(url)`
- **Descrição**: Baixa uma atualização
- **Parâmetros**:
  - `url` (String): URL do pacote de atualização
- **Retorno**: Promise<void>

#### `installUpdate()`
- **Descrição**: Instala a atualização baixada
- **Retorno**: Promise<Object>

#### `restartApp()`
- **Descrição**: Reinicia o aplicativo
- **Retorno**: void

#### `onExtractProgress(callback)`
- **Descrição**: Evento de progresso de extração
- **Parâmetros**:
  - `callback` (Function): Função chamada com progresso (0-100)

#### `downloadAndExtract()`
- **Descrição**: Baixa e extrai recursos
- **Retorno**: Promise<Object>

#### `onDownloadProgress(callback)`
- **Descrição**: Evento de progresso de download
- **Parâmetros**:
  - `callback` (Function): Função chamada com progresso (0-100)

#### `onInstallProgress(callback)`
- **Descrição**: Evento de progresso de instalação
- **Parâmetros**:
  - `callback` (Function): Função chamada com progresso (0-100)

#### `receiveFileToOpen(callback)`
- **Descrição**: Recebe arquivo para abrir em um app
- **Parâmetros**:
  - `callback` (Function): Função chamada com o caminho do arquivo

## Namespace `versions`

### `node()`
- **Descrição**: Obtém versão do Node.js
- **Retorno**: String

### `chrome()`
- **Descrição**: Obtém versão do Chrome
- **Retorno**: String

### `electron()`
- **Descrição**: Obtém versão do Electron
- **Retorno**: String

## Namespace `appAPI`

### `getConfig()`
- **Descrição**: Obtém configuração do app atual
- **Retorno**: Promise<Object>

### `saveConfig(data)`
- **Descrição**: Salva configuração do app atual
- **Parâmetros**:
  - `data` (Object): Dados de configuração
- **Retorno**: Promise<Boolean>

### `openFile(filePath)`
- **Descrição**: Abre arquivo no app atual
- **Parâmetros**:
  - `filePath` (String): Caminho do arquivo
- **Retorno**: Promise<Boolean>