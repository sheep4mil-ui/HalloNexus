const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 768,
    title: 'HallowNexus IDE',
    frame: true,
    backgroundColor: '#111216',
    webPreferences: {
      nodeIntegration: true,     // Authorizes local click scripting execution
      contextIsolation: false,   // Syncs window namespace channels
      enableRemoteModule: true
    }
  });

  // Direct, case-insensitive relative load track path
  mainWindow.loadFile('app/index.html');

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createMainWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

ipcMain.handle('load-extensions', async () => {
  const extensionsDir = path.join(__dirname, 'extensions');
  try {
    if (!fs.existsSync(extensionsDir)) fs.mkdirSync(extensionsDir);
    const files = fs.readdirSync(extensionsDir);
    const extensions = files
      .filter(file => file.endsWith('.json'))
      .map(file => JSON.parse(fs.readFileSync(path.join(extensionsDir, file), 'utf8')));
    return { success: true, data: extensions };
  } catch (error) {
    return { success: false, error: error.message };
  }
});
