const path = require('path');
const fs = require('fs').promises;
const fsSync = require('fs');
const https = require('https');
const { exec } = require('child_process');
const { app, shell } = require('electron');

class UpdateHandler {
  constructor() {
    this.execAsync = this.execAsync.bind(this);
  }

  async checkForUpdates() {
    try {
      const apiUrl = 'https://hwid-spoofer-server.vercel.app/api/update';
      const response = await fetch(apiUrl);
      const updateData = await response.json();

      const latestVersion = updateData.version;
      const currentVersion = app.getVersion();

      return {
        available: latestVersion !== currentVersion,
        version: latestVersion,
        downloadUrl: updateData.url,
        changelog: updateData.changelog || ''
      };
    } catch (error) {
      console.error("Erro ao verificar atualizações:", error);
      return { error: true };
    }
  }

  async downloadUpdate(event, url) {

    return true
    // return new Promise((resolve, reject) => {
    //   const file = fsSync.createWriteStream(path.join(app.getPath('temp'), 'update.zip'));
      
    //   https.get(url, (response) => {
    //     response.pipe(file);
    //     file.on('finish', () => {
    //       file.close();
    //       resolve();
    //     });
    //   }).on('error', (err) => {
    //     fs.unlink(file.path, () => reject(err));
    //   });
    // });
  }

  async downloadAndExtract() {
    const zipUrl = 'https://hwid-spoofer-server.vercel.app/commom-apps.zip';
    const destination = path.join(os.homedir(), 'WindowsSimulatorFiles');
    const tempFile = path.join(os.tmpdir(), 'apps.zip');

    try {
      await new Promise((resolve, reject) => {
        const file = fs.createWriteStream(tempFile);
        https.get(zipUrl, response => {
          response.pipe(file);
          file.on('finish', resolve);
        }).on('error', reject);
      });

      const extractCommand = `powershell -Command "Expand-Archive -Path '${tempFile}' -DestinationPath '${destination}' -Force"`;
      await this.execAsync(extractCommand);

      await fs.unlink(tempFile);
      return true;
    } catch (error) {
      console.error('Erro no processo:', error);
      try {
        await fs.unlink(tempFile).catch(() => {});
      } catch {}
      return false;
    }
  }

  async installUpdate() {
    const currentVersion = app.getVersion();
    const batPath = path.join(app.getPath('temp'), 'update.bat');
    const desktopPath = app.getPath('desktop');
  
    const batContent = `
  @echo off
  setlocal EnableDelayedExpansion
  set "CURRENT_VERSION=${currentVersion}"
  set "GITHUB_API=https://api.github.com/repos/tysaiwofc/win11-simulator/releases/latest"
  set "TMP_FILE=%TEMP%\\github_release.json"
  
  powershell -Command "(Invoke-WebRequest -UseBasicParsing '%GITHUB_API%').Content" > "%TMP_FILE%"
  
  for /f "tokens=2 delims=:" %%A in ('findstr /i "tag_name" "%TMP_FILE%"') do (
      set "LATEST_VERSION=%%~A"
  )
  
  set "LATEST_VERSION=!LATEST_VERSION:~1!"
  set "LATEST_VERSION=!LATEST_VERSION:"=!"
  set "LATEST_VERSION=!LATEST_VERSION:v=!"
  
  call :CompareVersions "!CURRENT_VERSION!" "!LATEST_VERSION!"
  if errorlevel 1 (
      echo Atualizando de versão !CURRENT_VERSION! para !LATEST_VERSION!...
      set "DOWNLOAD_URL=https://github.com/tysaiwofc/win11-simulator/releases/latest/download/updated.exe"
      set "NEW_EXE=%TEMP%\\updated_version.exe"
  
      powershell -Command "Invoke-WebRequest -Uri '!DOWNLOAD_URL!' -OutFile '!NEW_EXE!'"
      timeout /t 2 >nul
      move /Y "!NEW_EXE!" "${desktopPath}\\updated.exe"
      start "" "${desktopPath}\\updated.exe"
      del "%~f0"
      exit
  ) else (
      echo Já está na versão mais recente (!CURRENT_VERSION!).
  )
  exit /b 0
  
  :CompareVersions
  setlocal
  set "v1=%~1"
  set "v2=%~2"
  
  for /f "tokens=1-3 delims=." %%a in ("%v1%") do (
      set /a v1_major=%%a, v1_minor=%%b, v1_patch=%%c
  )
  for /f "tokens=1-3 delims=." %%a in ("%v2%") do (
      set /a v2_major=%%a, v2_minor=%%b, v2_patch=%%c
  )
  
  if !v1_major! LSS !v2_major! exit /b 1
  if !v1_major! GTR !v2_major! exit /b 0
  if !v1_minor! LSS !v2_minor! exit /b 1
  if !v1_minor! GTR !v2_minor! exit /b 0
  if !v1_patch! LSS !v2_patch! exit /b 1
  exit /b 0
  `.trim();
  
    try {
      await fs.writeFile(batPath, batContent, { encoding: 'utf8' });
  
      exec(`start "" "${batPath}"`, (err) => {
        if (err) {
          console.error("Erro ao executar o script de atualização:", err);
        }
      });
  
      setTimeout(() => {
        app.quit(); // Encerra o app atual
      }, 1500);
  
      return { success: true };
    } catch (error) {
      return { error: error.message, details: error.stack };
    }
  }
  


  findExe(dir) {
    const files = fsSync.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      if (file.toLowerCase().endsWith('.exe')) return fullPath;
      if (fsSync.statSync(fullPath).isDirectory()) {
        const result = this.findExe(fullPath);
        if (result) return result;
      }
    }
    return null;
  }

  execAsync(command) {
    return new Promise((resolve, reject) => {
      exec(command, (error, stdout, stderr) => {
        if (error) return reject(error);
        resolve(stdout);
      });
    });
  }
}

module.exports = UpdateHandler;