const path = require('path');
const fs = require('fs');
const { https } = require('follow-redirects');
const { BrowserWindow } = require('electron');
const { Transform } = require('stream');

class AppStoreHandler {
  constructor(getDirPath) {
    this.getDirPath = getDirPath;
    this.downloadProgress = {};
  }

  async downloadApp(event, appData) {
    const { name, dir, downloadUrl } = appData;
    const win = BrowserWindow.fromWebContents(event.sender);
    const windowId = win.id;

    try {
      const baseDir = this.getDirPath();
      const appDir = path.join(baseDir, dir);
      const zipPath = path.join(baseDir, `${dir}.temp.zip`);

      await this.ensureDirExists(baseDir);
      await this.ensureDirExists(appDir);

      this.updateProgress(windowId, win, 'download', 0);
      await this.downloadWithProgress(downloadUrl, zipPath, (percent) => {
        this.updateProgress(windowId, win, 'download', percent);
      });

      this.updateProgress(windowId, win, 'extract', 0);
      await this.extractZip(zipPath, appDir, (percent) => {
        this.updateProgress(windowId, win, 'extract', percent);
      });

      fs.unlinkSync(zipPath);

      this.updateProgress(windowId, win, 'complete', 100);
      return { success: true, installPath: appDir };
    } catch (error) {
      this.updateProgress(windowId, win, 'error', 0, error.message);
      return { error: error.message };
    }
  }

  updateProgress(windowId, win, phase, percent, error = null) {
    this.downloadProgress[windowId] = { phase, percent, error };
    win.webContents.send('download-progress', this.downloadProgress[windowId]);
  }

  ensureDirExists(dirPath) {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  downloadWithProgress(url, destination, progressCallback) {
    return new Promise((resolve, reject) => {
      const file = fs.createWriteStream(destination);
      let receivedBytes = 0;
      let totalBytes = 0;

      https.get(url, (response) => {
        if (response.statusCode !== 200) {
          reject(new Error(`Failed to download, status code: ${response.statusCode}`));
          return;
        }

        totalBytes = parseInt(response.headers['content-length'], 10) || 0;

        const progressStream = new Transform({
          transform(chunk, encoding, callback) {
            receivedBytes += chunk.length;
            const percent = totalBytes ? Math.round((receivedBytes / totalBytes) * 100) : 0;
            progressCallback(percent);
            this.push(chunk);
            callback();
          }
        });

        response.pipe(progressStream).pipe(file);
      }).on('error', (error) => {
        fs.unlink(destination, () => reject(error));
      });

      file.on('finish', () => resolve());
      file.on('error', (error) => {
        fs.unlink(destination, () => reject(error));
      });
    });
  }

  async extractZip(zipPath, targetDir, progressCallback) {
    const zipData = fs.readFileSync(zipPath);
    let position = 0;
    const entries = [];
    const MAX_ITERATIONS = 10000; // Prevenção contra loop infinito

    // Primeiro passagem: encontrar todos os arquivos
    for (let i = 0; i < MAX_ITERATIONS && position < zipData.length - 4; i++) {
      const signature = zipData.readUInt32LE(position);

      if (signature === 0x04034b50) { // Local file header
        const compressedSize = zipData.readUInt32LE(position + 18);
        const uncompressedSize = zipData.readUInt32LE(position + 22);
        const fileNameLength = zipData.readUInt16LE(position + 26);
        const extraFieldLength = zipData.readUInt16LE(position + 28);
        const compressionMethod = zipData.readUInt16LE(position + 8);

        // Verifica se é um método suportado (0 = store)
        if (compressionMethod !== 0) {
          throw new Error(`Unsupported compression method: ${compressionMethod}. Only 'store' (0) is supported without zlib.`);
        }

        position += 30;

        const fileName = zipData.toString('utf8', position, position + fileNameLength);
        const isDirectory = fileName.endsWith('/');

        position += fileNameLength + extraFieldLength;

        entries.push({
          name: fileName,
          isDirectory,
          dataStart: position,
          dataEnd: position + compressedSize,
          compressedSize,
          uncompressedSize
        });

        position += compressedSize;
      } else {
        position++;
      }
    }

    // Segunda passagem: extrair arquivos
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      const entryPath = path.join(targetDir, entry.name);

      if (entry.isDirectory) {
        this.ensureDirExists(entryPath);
      } else {
        this.ensureDirExists(path.dirname(entryPath));
        const fileData = zipData.slice(entry.dataStart, entry.dataEnd);
        fs.writeFileSync(entryPath, fileData);
      }

      progressCallback(Math.round(((i + 1) / entries.length) * 100));
    }
  }

  getInstalledApps() {
    const apps = [];
    const baseDir = this.getDirPath();

    if (fs.existsSync(baseDir)) {
      const appDirs = fs.readdirSync(baseDir);

      for (const dir of appDirs) {
        const dataPath = path.join(baseDir, dir, 'data.json');

        if (fs.existsSync(dataPath)) {
          try {
            const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
            apps.push({
              name: dir,
              displayName: data.displayName || dir,
              icon: path.join(baseDir, dir, data.icon),
              description: data.description || '',
              version: data.version || '1.0.0',
              dir: dir
            });
          } catch (error) {
            console.error(`Error reading ${dataPath}:`, error);
          }
        }
      }
    }

    return apps;
  }
}

module.exports = AppStoreHandler;