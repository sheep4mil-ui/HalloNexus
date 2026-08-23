const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const http = require('http');

let mainWindow;
const saveFilePath = path.join(__dirname, 'workspace-save.json');

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

// REAL PERSISTENT LOCAL STORAGE ENGINE CHANNELS
ipcMain.handle('save-project-state', async (event, stateData) => {
  try {
    fs.writeFileSync(saveFilePath, JSON.stringify(stateData, null, 2), 'utf8');
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('load-project-state', async () => {
  try {
    if (fs.existsSync(saveFilePath)) {
      const rawData = fs.readFileSync(saveFilePath, 'utf8');
      return { success: true, data: JSON.parse(rawData) };
    }
    return { success: true, data: null };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// INTELLIGENT AGENT CONTEXT ROUTER INTERFACE WITH AUTOMATED WIRING ENGINE PERMISSIONS
ipcMain.handle('ollama-chat', async (event, { userPrompt, currentWorkspaceContext }) => {
  return new Promise((resolve) => {
    
    const systemInstruction = `You are the HallowNexus IDE Automation Engine. You have access to the user's current visual code workspace.
Current Workspace JSON: ${JSON.stringify(currentWorkspaceContext)}

You can modify the canvas by outputting a strict JSON action configuration layout.
If the user asks to create or spawn a block, respond exactly in this format:
{"action": "spawn", "blockName": "Initialize Player Sprite", "message": "I have spawned that block for you."}

If the user asks to connect or wire two blocks together (or implies execution flow), look at the blockNames currently on the canvas inside the current workspace JSON, and respond exactly in this format:
{"action": "link", "sourceName": "Initialize Player Sprite", "targetName": "Trigger High-Juice Screen Shake", "message": "I have connected those two blocks for you."}

Available block names you can spawn or link: "Initialize Player Sprite", "Trigger High-Juice Screen Shake", "Emit Object-Pooled Projectile", "Set Day-Night Cycle Timer", "Spawn Dithered Lantern", "Cast Lighthouse Beam".

If they are just asking a general question, explaining logic, or chatting, respond with your actual answer inside the JSON structure like this:
{"action": "none", "message": "Write your actual detailed development response or answer here based on the user's request."}

Respond ONLY with valid, raw, un-escaped JSON string blocks. No conversational preambles or markdown wrappers outside the JSON block structure.`;

    const postData = JSON.stringify({
      model: 'llama3.2',
      prompt: `${systemInstruction}\n\nUser Request: ${userPrompt}`,
      stream: false
    });

    const options = {
      hostname: '127.0.0.1',
      port: 11434,
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
          resolve({ success: true, rawPayload: parsed.response });
        } catch (e) {
          resolve({ success: false, rawPayload: '{"action":"none","message":"Ollama returned bad token packets."}' });
        }
      });
    });

    req.on('error', () => {
      resolve({ 
        success: false, 
        rawPayload: '{"action":"none","message":"Could not connect to local Ollama server. Check background taskbar app execution tray!"}' 
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
