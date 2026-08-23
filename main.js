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
    frame: true, // Native title bar for profile management
    backgroundColor: '#111216', // Dark background to limit eye fatigue
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false, // Allows the React layer to read local extension JSONs directly
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // Load the primary UI layout entry point
  mainWindow.loadFile(path.join(__dirname, 'app/index.html'));

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Complete application environment readiness handshake
app.whenReady().then(() => {
  createMainWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// Inter-Process Communication (IPC) Handler for Extension Loading
ipcMain.handle('load-extensions', async () => {
  const extensionsDir = path.join(__dirname, 'extensions');
  try {
    if (!fs.existsSync(extensionsDir)) {
      fs.mkdirSync(extensionsDir);
    }
    const files = fs.readdirSync(extensionsDir);
    const extensions = files
      .filter(file => file.endsWith('.json'))
      .map(file => {
        const filePath = path.join(extensionsDir, file);
        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
      });
    return { success: true, data: extensions };
  } catch (error) {
    return { success: false, error: error.message };
  }
});
