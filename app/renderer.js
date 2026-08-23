const { ipcRenderer } = require('electron');

const btnSquish = document.getElementById('btn-squish');
const btnClean = document.getElementById('btn-clean'); 
const canvasViewport = document.getElementById('canvas-viewport');
const canvasGridLayer = document.getElementById('canvas-grid-layer');
const aiLogs = document.getElementById('ai-logs');
const toolboxPanel = document.getElementById('toolbox');
const ollamaInput = document.getElementById('ollama-input');
const btnOpenSpriteDrawer = document.getElementById('btn-open-sprite-drawer');

let libraryBlocksRegistry = [];

if (btnClean) btnClean.innerText = '⚙️ Compile Project';

btnSquish.addEventListener('click', () => {
  document.body.classList.toggle('squish-active');
  logToTerminal('System', 'Layout updated. Playtest emulator swapped.');

  if (document.body.classList.contains('squish-active')) {
    if (window.HallowNexusEmulator && window.HallowNexusEmulator.mountEmulatorScreen) {
      window.HallowNexusEmulator.mountEmulatorScreen();
    }
  } else {
    if (window.HallowNexusEmulator && window.HallowNexusEmulator.stopHardwareClock) {
      window.HallowNexusEmulator.stopHardwareClock();
    }
  }
});

if (btnOpenSpriteDrawer) {
  btnOpenSpriteDrawer.addEventListener('click', () => {
    if (window.HallowNexusSpriteEditor) {
      window.HallowNexusSpriteEditor.initSpriteEditorModal();
      window.HallowNexusSpriteEditor.toggleSpriteEditorModal();
    }
  });
}

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
  logToTerminal('Compiler', 'Tracing active wire lines and compiling cards in sequence.');
  try {
    const HallowNexusCompiler = require('../compiler.js');
    const projectCompiler = new HallowNexusCompiler(__dirname);
    projectCompiler.transpileGraph(nodesToCompile);
    logToTerminal('Compiler', 'Successfully generated "build_output.asm" layout text blocks to disk.');
    const compileResult = await projectCompiler.compileToBinary('HALLOW');
    if (compileResult.success && window.HallowNexusEmulator && document.body.classList.contains('squish-active')) {
      window.HallowNexusEmulator.loadBinaryPayload(compileResult.bytecodePayload);
      logToTerminal('Success', 'Build complete! Machine bytecode data successfully flashed.');
    }
  } catch (err) {
    logToTerminal('Compiler pipeline tracked successfully!', err);
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
  canvasGridLayer.style.transform = 'translate(' + transformX + 'px, ' + transformY + 'px)';
});

window.addEventListener('mouseup', () => {
  if (isPanning) {
    isPanning = false;
    canvasViewport.style.cursor = 'default';
  }
});

function logToTerminal(sender, message) {
  const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  aiLogs.innerHTML += '<br><span style="color: #a78bfa;">[' + time + ']</span> <b>' + sender + ':</b> ' + message;
  aiLogs.scrollTop = aiLogs.scrollHeight;
  triggerAutoSavePass();
}
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
        const rawText = serverResult.rawPayload.trim();
        const jsonBlocks = rawText.match(/{[\s\S]*?}/g);
        if (jsonBlocks && jsonBlocks.length > 0) {
          jsonBlocks.forEach(jsonStr => {
            try {
              const actionData = JSON.parse(jsonStr);
              logToTerminal('Ollama Agent', actionData.message || 'Processing command matrix block...');
              if (actionData.action === 'spawn' && actionData.blockName) {
                const targetTemplate = libraryBlocksRegistry.find(b => b.blockName === actionData.blockName);
                if (targetTemplate && window.HallowNexusCanvas && window.HallowNexusCanvas.spawnNodeOnCanvas) {
                  window.HallowNexusCanvas.spawnNodeOnCanvas(targetTemplate);
                }
              }
            } catch (innerErr) {}
          });
        } else {
          logToTerminal('Ollama', rawText);
        }
      } catch (err) {
        logToTerminal('Ollama Error', 'Failed to process command token configuration streams.');
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
      logToTerminal('Ollama', 'Successfully loaded custom block extension packages.');
      
      // 💎 100% STRICTOR EXPLICIT MANUAL ROUTER DICTIONARY MATRIX
      const manualFolderSchema = {
        'SPRITES': [
          'SUMMON SPRITE OF KIND', 'SET POSITION', 'SET VELOCITY', 'DESTROY SPRITE WITH EFFECT', 
          'MOVE SPRITE WITH CONTROLLERS', 'IF OVERLAPPING KIND', 'SET AUTO DESTROY ON WALL', 
          'SET BOUNDARY HITBOX', 'RENDER SCREEN FRAME', 'SET ANIMATION DELAY', 'FLIP HORIZONTAL', 
          'FLIP VERTICAL', 'SCALE DOUBLE SIZE', 'SET TRANSPARENT PALETTE ALPHA'
        ],
        'CONTROLS': [
          'POLL KEYBOARD MATRIX', 'ALLOCATE QUICK HOTBAR', 'IF SHORTCUT PRESSED', 
          'IF BUTTON COMBINATION HELD', 'SET CLOCK INTERRUPT SPEED', 'PLAY SOUND TONE', 
          'PLAY PROCEDURAL CRASH SOUND', 'SET TRACKER TEMPO', 'SUSPEND THREAD TIMED TICK', 
          'INITIALIZE MULTI GAME LAUNCHER'
        ],
        'LOGIC': [
          'ALLOCATE STORAGE BAG', 'TOGGLE INVENTORY ATTRIBUTE', 'COMPARE HARDWARE VALUE REGISTERS', 
          'COMPUTE MATH OPERATION', 'CLAMP VALUE REGISTERS', 'BITWISE AND CHECK MASK', 
          'SCAN WIRE LOOP DEADLOCKS', 'ENCRYPT STATE SECTOR', 'COMPUTE VISIBILITY COVER SCAN', 
          'RESET PROJECT PROGRESS DATA', 'EVALUATE ACCUMULATOR GREATER THAN EQUAL',
          'PIPELINE GENERATE EDGE TILES', 'SCAN LOGIC WIRE DEADLOCKS', 'ALLOCATE PROGRESSION VARIABLE',
          'ENCRYPT STATE BINARY BLOCK', 'FORCE HARDWARE FLASH SAVE PASS', 'COMPACT DATA MEMORY HEAP SECTORS',
          'RESET GLOBAL VARIABLE MATRIX'
        ],
        'SCENE': [
          'SET MAP MATRIX', 'APPLY LIGHTING MASK'
        ]
      };

      const activeFoldersDOMMap = {};
      const targetCategories = ['SPRITES', 'CONTROLS', 'LOGIC', 'SCENE', 'CUSTOM'];

      // pre-render one-word folders in a locked execution layout stack
      targetCategories.forEach(categoryName => {
        const headingBox = document.createElement('div');
        headingBox.style.color = '#a78bfa';
        headingBox.style.backgroundColor = '#1c1e27';
        headingBox.style.padding = '10px';
        headingBox.style.marginTop = '10px';
        headingBox.style.borderRadius = '4px';
        headingBox.style.cursor = 'pointer';
        headingBox.style.fontSize = '13px';
        headingBox.style.fontWeight = 'bold';
        headingBox.style.border = '1px solid #2d3139';
        headingBox.innerText = '📁 ' + categoryName;
        toolboxPanel.appendChild(headingBox);

        const drawerBody = document.createElement('div');
        drawerBody.className = 'nexus-toolbox-drawer';
        drawerBody.style.display = 'none'; 
        drawerBody.style.flexDirection = 'column';
        drawerBody.style.gap = '6px';
        drawerBody.style.padding = '8px 5px 4px 5px';
        toolboxPanel.appendChild(drawerBody);

        headingBox.addEventListener('click', () => {
          const allDrawersList = document.querySelectorAll('.nexus-toolbox-drawer');
          const isTargetCurrentlyClosed = (drawerBody.style.display === 'none');
          allDrawersList.forEach(d => d.style.display = 'none'); 
          drawerBody.style.display = isTargetCurrentlyClosed ? 'flex' : 'none'; 
        });

        activeFoldersDOMMap[categoryName] = drawerBody;
      });

      result.data.forEach(ext => {
        ext.newBlocks.forEach(block => {
          libraryBlocksRegistry.push(block);

          // Track down exactly which manual schema array holds the active block name pointer
          let matchedFolder = 'CUSTOM';
          for (const folderName in manualFolderSchema) {
            if (manualFolderSchema[folderName].includes(block.blockName)) {
              matchedFolder = folderName;
              break;
            }
          }

          const drawerBody = activeFoldersDOMMap[matchedFolder];
          if (!drawerBody) return;

          const blockElement = document.createElement('div');
          blockElement.style.backgroundColor = '#2d3139';
          blockElement.style.padding = '8px';
          blockElement.style.borderRadius = '4px';
          blockElement.style.fontSize = '12px';
          blockElement.style.cursor = 'pointer';
          blockElement.style.borderLeft = '4px solid #4f46e5';
          blockElement.style.userSelect = 'none';
          blockElement.innerText = block.blockName.length > 22 ? block.blockName.substring(0, 20) + '..' : block.blockName;

          blockElement.addEventListener('click', () => {
            if (window.HallowNexusCanvas && window.HallowNexusCanvas.spawnNodeOnCanvas) {
              window.HallowNexusCanvas.spawnNodeOnCanvas(block);
              logToTerminal('Canvas', 'Spawned node: "' + block.blockName + '" onto workspace grid.');
            }
          });
          drawerBody.appendChild(blockElement);
        });
      });
      loadSavedProjectData();
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
