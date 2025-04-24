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
    return new Promise((resolve, reject) => {
      const file = fsSync.createWriteStream(path.join(app.getPath('temp'), 'update.zip'));
      
      https.get(url, (response) => {
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          resolve();
        });
      }).on('error', (err) => {
        fs.unlink(file.path, () => reject(err));
      });
    });
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
    const zipPath = path.join(app.getPath('temp'), 'update.zip');
    const extractTo = path.join(app.getPath('temp'), 'update-temp');
    const downloadsPath = app.getPath('downloads');

    if (!fsSync.existsSync(zipPath)) {
      return { error: 'Arquivo ZIP não encontrado.' };
    }

    try {
      if (fsSync.existsSync(extractTo)) {
        await fsSync.promises.rm(extractTo, { recursive: true, force: true });
      }
      await fsSync.promises.mkdir(extractTo, { recursive: true });

      const extractCommand = `powershell -Command "Expand-Archive -Path '${zipPath}' -DestinationPath '${extractTo}' -Force"`;
      await this.execAsync(extractCommand);

      const exePath = this.findExe(extractTo);
      if (!exePath) throw new Error('Nenhum .exe encontrado no ZIP.');

      const exeName = path.basename(exePath);
      const finalPath = path.join(downloadsPath, exeName);

      await fsSync.promises.copyFile(exePath, finalPath);
      shell.openPath(downloadsPath);

      await fsSync.promises.unlink(zipPath);
      await fsSync.promises.rm(extractTo, { recursive: true, force: true });

      setTimeout(() => {
        app.exit(0);
      }, 2000);

      return { success: true };
    } catch (err) {
      return { error: err.message, details: err.stack };
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