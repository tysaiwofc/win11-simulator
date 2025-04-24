const path = require('path');
const fs = require('fs').promises;
const fsSync = require('fs');
const os = require('os');
const { shell, dialog } = require('electron');

class FileHandler {
  constructor() {
    this.baseDir = path.join(os.homedir(), 'WindowsSimulatorFiles');
  }

  async readDirectory(event, subPath = '') {
    try {
      const dirPath = path.join(this.baseDir, subPath);
      await fs.mkdir(dirPath, { recursive: true });

      const files = await fs.readdir(dirPath);
      const fileDetails = await Promise.all(files.map(async file => {
        const filePath = path.join(dirPath, file);
        const stats = await fs.stat(filePath);
        return {
          name: file,
          path: filePath,
          isDirectory: stats.isDirectory(),
          size: stats.size,
          modified: stats.mtime
        };
      }));

      return fileDetails;
    } catch (error) {
      console.error('Error reading directory:', error);
      throw error;
    }
  }

  async openFile(event, filePath) {
    try {
      await shell.openPath(filePath);
      return true;
    } catch (error) {
      console.error('Error opening file:', error);
      throw error;
    }
  }

  async getDirectoryFromFile(event, filePath) {
    try {
      const directory = path.dirname(filePath);
      const files = await fs.readdir(directory);
      
      const fileDetails = await Promise.all(files.map(async (file) => {
        const fullPath = path.join(directory, file);
        const stats = await fs.stat(fullPath);
        
        return {
          name: file,
          path: fullPath,
          isDirectory: stats.isDirectory(),
          size: stats.size,
          modified: stats.mtime
        };
      }));
      
      return {
        directory,
        files: fileDetails
      };
    } catch (error) {
      console.error('Error getting directory from file:', error);
      throw error;
    }
  }

  isImageFile(event, filename) {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
    return imageExtensions.some(ext => filename.toLowerCase().endsWith(ext));
  }

  isVideoFile(event, filename) {
    const videoExtensions = ['.mp4', '.mov', '.avi', '.mkv', '.webm'];
    return videoExtensions.some(ext => filename.toLowerCase().endsWith(ext));
  }

  async getFileInfo(event, filePath) {
    try {
      const stats = await fs.stat(filePath);
      return {
        path: filePath,
        size: stats.size,
        modified: stats.mtime,
        isDirectory: stats.isDirectory(),
        extension: path.extname(filePath).toLowerCase()
      };
    } catch (error) {
      console.error('Erro ao obter informações do arquivo:', error);
      throw error;
    }
  }

  async readFile(event, filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      return content;
    } catch (error) {
      console.error('Error reading file:', error);
      throw error;
    }
  }

  async writeFile(event, filePath, content) {
    try {
      await fs.writeFile(filePath, content, 'utf-8');
      return true;
    } catch (error) {
      console.error('Error writing file:', error);
      throw error;
    }
  }

  async showOpenDialog(event, options) {
    const result = await dialog.showOpenDialog(options);
    return result;
  }

  async showSaveDialog(event, options) {
    const result = await dialog.showSaveDialog(options);
    return result;
  }
}

module.exports = FileHandler;