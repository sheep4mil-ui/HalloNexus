const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    backgroundColor: '#0b0c10',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'app', 'index.html'));
}

app.whenReady().then(createWindow);

ipcMain.handle('load-extensions', async () => {
  try {
    const extDir = path.join(__dirname, 'extensions');
    if (!fs.existsSync(extDir)) return { success: true, data: [] };
    const files = fs.readdirSync(extDir).filter(f => f.endsWith('.json'));
    const data = files.map(f => JSON.parse(fs.readFileSync(path.join(extDir, f), 'utf8')));
    return { success: true, data };
  } catch (err) { return { success: false, error: err.message }; }
});

ipcMain.handle('save-project-state', async (event, snapshot) => {
  try {
    fs.writeFileSync(path.join(__dirname, 'workspace-save.json'), JSON.stringify(snapshot, null, 2), 'utf8');
    return { success: true };
  } catch (err) { return { success: false, error: err.message }; }
});

ipcMain.handle('load-project-state', async () => {
  try {
    const savePath = path.join(__dirname, 'workspace-save.json');
    if (!fs.existsSync(savePath)) return { success: false };
    const data = JSON.parse(fs.readFileSync(savePath, 'utf8'));
    return { success: true, data };
  } catch (err) { return { success: false, error: err.message }; }
});
