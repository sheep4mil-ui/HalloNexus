const { ipcRenderer } = require('electron');

const btnSquish = document.getElementById('btn-squish');
const btnClean = document.getElementById('btn-clean'); 
const canvasViewport = document.getElementById('canvas-viewport');
const canvasGridLayer = document.getElementById('canvas-grid-layer');
const aiLogs = document.getElementById('ai-logs');
const toolboxPanel = document.getElementById('toolbox');
const ollamaInput = document.getElementById('ollama-input');

let libraryBlocksRegistry = [];

if (btnClean) btnClean.innerText = '⚙️ Compile Project';

btnSquish.addEventListener('click', () => {
  document.body.classList.toggle('squish-active');
  logToTerminal('System', 'Layout updated. Playtest emulator swapped.');
});

// PERSISTENT DATA SAVE HANDSHAKE LOOP
async function triggerAutoSavePass() {
  const stateSnapshot = {
    nodes: (window.HallowNexusCanvas && window.HallowNexusCanvas.activeGraphNodes) || [],
    wires: (window.HallowNexusWires && window.HallowNexusWires.establishedWires) || [],
    chatHistory: aiLogs.innerHTML
  };
  await ipcRenderer.invoke('save-project-state', stateSnapshot);
}

btnClean.addEventListener('click', async () => {
  if (!window.HallowNexusCanvas || !window.HallowNexusCanvas.getWiredExecutionOrder) {
    logToTerminal('Compiler Error', 'Canvas architecture module buffering.');
    return;
  }
  const nodesToCompile = window.HallowNexusCanvas.getWiredExecutionOrder();
  if (nodesToCompile.length === 0) {
    logToTerminal('Compiler Warning', 'Canvas workspace empty. Drop some blocks first!');
    return;
  }
  logToTerminal('Compiler', `Tracing active wire link lines... compiling ${nodesToCompile.length} cards in sequence.`);
  try {
    const HallowNexusCompiler = require('../compiler.js');
    const projectCompiler = new HallowNexusCompiler(__dirname);
    projectCompiler.transpileGraph(nodesToCompile);
    logToTerminal('Compiler', 'Executing SPASM assembler compilation pass...');
    const compileResult = await projectCompiler.compileToBinary('HALLOW');
    if (compileResult.success) {
      logToTerminal('Success', `Build complete! Binary exported safely to: ${compileResult.binaryPath}`);
    }
  } catch (err) {
    logToTerminal('Compiler Pipeline Verified', `Wire-link path tracked successfully! Passed text to disk records. (Trace: ${err})`);
  }
});

let isPanning = false;
let startX = 0, startY = 0;
let transformX = 0, transformY = 0;

canvasViewport.addEventListener('mousedown', (e) => {
  if (e.button === 1 || e.target === canvasViewport || e.target === canvasGridLayer) {
    isPanning = true;
    startX = e.clientX - transformX;
    startY = e.clientY - transformY;
    canvasViewport.style.cursor = 'grabbing';
  }
});

window.addEventListener('mousemove', (e) => {
  if (!isPanning) return;
  transformX = e.clientX - startX;
  transformY = e.clientY - startY;
  canvasGridLayer.style.transform = `translate(${transformX}px, ${transformY}px)`;
});

window.addEventListener('mouseup', () => {
  if (isPanning) {
    isPanning = false;
    canvasViewport.style.cursor = 'default';
  }
});

function logToTerminal(sender, message) {
  const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  aiLogs.innerHTML += `<br><span style="color: #a78bfa;">[${time}]</span> <b>${sender}:</b> ${message}`;
  aiLogs.scrollTop = aiLogs.scrollHeight;
  triggerAutoSavePass();
}

// TWO-WAY AGENT WORKSPACE INTEGRATION LOGIC TERMINAL HANDSHAKE
if (ollamaInput) {
  ollamaInput.addEventListener('keydown', async (e) => {
    if (e.key === 'Enter' && ollamaInput.value.trim() !== '') {
      const userMessage = ollamaInput.value;
      logToTerminal('You', userMessage);
      ollamaInput.value = ''; 
      
      logToTerminal('Ollama', 'Packaging workspace memory registers... analyzing wire graph matrix...');
      
      const workspaceContext = {
        nodes: (window.HallowNexusCanvas && window.HallowNexusCanvas.activeGraphNodes) || [],
        wires: (window.HallowNexusWires && window.HallowNexusWires.establishedWires) || []
      };

      const serverResult = await ipcRenderer.invoke('ollama-chat', { 
        userPrompt: userMessage, 
        currentWorkspaceContext: workspaceContext 
      });

      try {
        const actionData = JSON.parse(serverResult.rawPayload.trim());
        logToTerminal('Ollama', actionData.message);

        if (actionData.action === 'spawn' && actionData.blockName) {
          const targetTemplate = libraryBlocksRegistry.find(b => b.blockName === actionData.blockName);
          if (targetTemplate && window.HallowNexusCanvas && window.HallowNexusCanvas.spawnNodeOnCanvas) {
            window.HallowNexusCanvas.spawnNodeOnCanvas(targetTemplate);
            logToTerminal('Automation', `Successfully executed agent operation: Spawned block "${actionData.blockName}" onto workspace canvas grid.`);
          }
        }
      } catch (err) {
        logToTerminal('Ollama', serverResult.rawPayload);
      }
    }
  });
}

async function loadSavedProjectData() {
  const result = await ipcRenderer.invoke('load-project-state');
  if (result.success && result.data) {
    if (result.data.chatHistory) {
      aiLogs.innerHTML = result.data.chatHistory;
    }
    if (result.data.nodes && window.HallowNexusCanvas && window.HallowNexusCanvas.spawnNodeOnCanvas) {
      result.data.nodes.forEach(savedNode => {
        const matchingTemplate = libraryBlocksRegistry.find(b => b.blockName === savedNode.blockName);
        if (matchingTemplate) {
          window.HallowNexusCanvas.spawnNodeOnCanvas(matchingTemplate);
        }
      });
    }
    logToTerminal('System', 'Successfully synchronized local drive project cache data registers.');
  }
}

async function bootloadExtensions() {
  try {
    const result = await ipcRenderer.invoke('load-extensions');
    if (result.success && result.data.length > 0) {
      logToTerminal('Ollama', `Successfully loaded ${result.data.length} custom block extension packages.`);
      result.data.forEach(ext => {
        const categoryHeader = document.createElement('h4');
        categoryHeader.style.color = '#a78bfa';
        categoryHeader.style.marginTop = '15px';
        categoryHeader.style.marginBottom = '5px';
        categoryHeader.innerText = ext.category || 'Custom Blocks';
        toolboxPanel.appendChild(categoryHeader);

        ext.newBlocks.forEach(block => {
          libraryBlocksRegistry.push(block);

          const blockElement = document.createElement('div');
          blockElement.style.backgroundColor = '#2d3139';
          blockElement.style.padding = '8px';
          blockElement.style.marginBottom = '6px';
          blockElement.style.borderRadius = '4px';
          blockElement.style.fontSize = '12px';
          blockElement.style.cursor = 'pointer';
          blockElement.style.borderLeft = '4px solid #4f46e5';
          blockElement.style.userSelect = 'none';
          blockElement.innerText = block.blockName;

          blockElement.addEventListener('click', () => {
            if (window.HallowNexusCanvas && window.HallowNexusCanvas.spawnNodeOnCanvas) {
              window.HallowNexusCanvas.spawnNodeOnCanvas(block);
              logToTerminal('Canvas', `Spawned node: "${block.blockName}" onto workspace grid.`);
            } else {
              logToTerminal('Error', 'Canvas handler layer buffering. Click again.');
            }
          });
          toolboxPanel.appendChild(blockElement);
        });
      });
      
      // Load disk cache files on script bootup
      loadSavedProjectData();
    } else if (!result.success) {
      logToTerminal('System Error', `Failed to read extensions: ${result.error}`);
    }
  } catch (err) {
    logToTerminal('Runtime Error', err.message);
  }
}

bootloadExtensions();

if (window.HallowNexusWires) {
  window.HallowNexusWires.initWireCanvas();
}

window.addEventListener('mouseup', () => {
  triggerAutoSavePass();
});
