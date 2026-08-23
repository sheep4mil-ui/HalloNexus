const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const http = require('http'); // Used to route raw local server streaming network lines

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
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true
    }
  });

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

// REAL LOCAL OLLAMA CONNECTION BRIDGE PORT
ipcMain.handle('ollama-chat', async (event, userPrompt) => {
  return new Promise((resolve) => {
    const postData = JSON.stringify({
      model: 'llama3', // Default local model check profile loop
      prompt: userPrompt,
      stream: false
    });

    const options = {
      hostname: '127.0.0.1',
      port: 11434, // Standard global Ollama hardware port index
      path: '/api/generate',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ success: true, response: parsed.response });
        } catch (e) {
          resolve({ success: false, response: 'Ollama returned unparseable code chunks.' });
        }
      });
    });

    req.on('error', () => {
      resolve({ 
        success: false, 
        response: 'Could not connect to local Ollama server. Ensure the app is running locally on your computer!' 
      });
    });

    req.write(postData);
    req.end();
  });
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
