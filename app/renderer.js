const { ipcRenderer } = require('electron');

const btnSquish = document.getElementById('btn-squish');
const btnClean = document.getElementById('btn-clean'); 
const canvasViewport = document.getElementById('canvas-viewport');
const canvasGridLayer = document.getElementById('canvas-grid-layer');
const aiLogs = document.getElementById('ai-logs');
const toolboxPanel = document.getElementById('toolbox');
const ollamaInput = document.getElementById('ollama-input');
const btnOpenSpriteDrawer = document.getElementById('btn-open-sprite-drawer');

const btnSaveProject = document.getElementById('btn-save-project');
const btnReturnMenu = document.getElementById('btn-return-menu');
const mainMenuShell = document.getElementById('nexus-main-menu');
const menuBtnNew = document.getElementById('menu-btn-new');
const menuBtnLoad = document.getElementById('menu-btn-load');

const btnToggleDocs = document.getElementById('btn-toggle-docs');
const docsDrawerShell = document.getElementById('nexus-docs-drawer');
const languageSelectorInput = document.getElementById('nexus-language-selector');
const lblActiveFileDisplay = document.getElementById('lbl-active-file');

let libraryBlocksRegistry = [];

if (btnClean) btnClean.innerText = 'Transpile Project';

if (languageSelectorInput) {
  languageSelectorInput.addEventListener('change', () => {
    const selectedExtension = languageSelectorInput.value;
    let textMapping = 'build_output.py';
    if (selectedExtension === 'java') textMapping = 'HallowNexusGame.java';
    if (selectedExtension === 'cpp') textMapping = 'build_output.cpp';
    if (selectedExtension === 'asm') textMapping = 'build_output.asm';
    if (lblActiveFileDisplay) lblActiveFileDisplay.innerText = textMapping;
    logToTerminal('System', 'Switched cross-compilation target pipeline to: ' + selectedExtension.toUpperCase());
  });
}

if (menuBtnNew) {
  menuBtnNew.addEventListener('click', () => {
    mainMenuShell.style.display = 'none'; 
    document.querySelectorAll('.node-card').forEach(node => node.remove());
    document.querySelectorAll('.canvas-nexus-wire').forEach(wire => wire.remove());
    if (window.HallowNexusCanvas && window.HallowNexusCanvas.activeGraphNodes) window.HallowNexusCanvas.activeGraphNodes.length = 0;
    if (window.HallowNexusWires && window.HallowNexusWires.establishedWires) window.HallowNexusWires.establishedWires.length = 0;
    logToTerminal('System', 'Initialized a fresh workspace playground matrix.');
  });
}

if (menuBtnLoad) {
  menuBtnLoad.addEventListener('click', async () => {
    mainMenuShell.style.display = 'none';
    await loadSavedProjectData();
  });
}

if (btnReturnMenu) {
  btnReturnMenu.addEventListener('click', () => {
    mainMenuShell.style.display = 'flex'; 
  });
}

if (btnSaveProject) {
  btnSaveProject.addEventListener('click', async () => {
    logToTerminal('Workspace', 'Executing explicit file freeze state pass...');
    await triggerAutoSavePass();
    logToTerminal('Success', 'Project metrics written to: "workspace-save.json"!');
  });
}

if (btnToggleDocs) {
  btnToggleDocs.addEventListener('click', (e) => {
    docsDrawerShell.classList.toggle('drawer-active');
    e.stopPropagation();
  });
}
btnSquish.addEventListener('click', () => {
  document.body.classList.toggle('squish-active');
  logToTerminal('System', 'Layout updated. Playtest emulator swapped.');
  if (document.body.classList.contains('squish-active')) {
    if (window.HallowNexusEmulator && window.HallowNexusEmulator.mountEmulatorScreen) window.HallowNexusEmulator.mountEmulatorScreen();
  } else {
    if (window.HallowNexusEmulator && window.HallowNexusEmulator.stopHardwareClock) window.HallowNexusEmulator.stopHardwareClock();
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
  
  const chosenLangKey = languageSelectorInput ? languageSelectorInput.value : 'python';
  logToTerminal('Compiler', 'Initiating cross-compilation targeting: ' + chosenLangKey.toUpperCase());
  
  try {
    const HallowNexusCompiler = require('../compiler.js');
    const projectCompiler = new HallowNexusCompiler(__dirname);
    const generatedPathResult = projectCompiler.transpileGraph(nodesToCompile, chosenLangKey);
    logToTerminal('Success', 'Transpilation complete! File written to: ' + generatedPathResult);
    
    const compileResult = await projectCompiler.compileToBinary('HALLOW');
    if (compileResult.success && window.HallowNexusEmulator && document.body.classList.contains('squish-active')) {
      window.HallowNexusEmulator.loadBinaryPayload(compileResult.bytecodePayload);
    }
  } catch (err) {
    logToTerminal('Compiler Error', 'Pipeline exception caught: ' + err.message);
  }
});

let isPanning = false;
let startX = 0, startY = 0, transformX = 0, transformY = 0;
canvasViewport.addEventListener('mousedown', (e) => {
  if (e.button === 1 || e.target === canvasViewport || e.target === canvasGridLayer) {
    isPanning = true; startX = e.clientX - transformX; startY = e.clientY - transformY;
    canvasViewport.style.cursor = 'grabbing';
  }
});
window.addEventListener('mousemove', (e) => {
  if (!isPanning) return;
  transformX = e.clientX - startX; transformY = e.clientY - startY;
  canvasGridLayer.style.transform = `translate(${transformX}px, ${transformY}px)`;
});
window.addEventListener('mouseup', () => { if (isPanning) { isPanning = false; canvasViewport.style.cursor = 'default'; } });

if (ollamaInput) {
  ollamaInput.addEventListener('keydown', async (e) => {
    if (e.key === 'Enter' && ollamaInput.value.trim() !== '') {
      const userMessage = ollamaInput.value; logToTerminal('You', userMessage); ollamaInput.value = ''; 
      logToTerminal('Ollama', 'Analyzing wire graph matrix...');
      const workspaceContext = { nodes: (window.HallowNexusCanvas && window.HallowNexusCanvas.activeGraphNodes) || [], wires: (window.HallowNexusWires && window.HallowNexusWires.establishedWires) || [] };
      const serverResult = await ipcRenderer.invoke('ollama-chat', { userPrompt: userMessage, currentWorkspaceContext: workspaceContext });
      try {
        const rawText = serverResult.rawPayload.trim(); const jsonBlocks = rawText.match(/{[\s\S]*?}/g);
        if (jsonBlocks && jsonBlocks.length > 0) {
          jsonBlocks.forEach(jsonStr => {
            const actionData = JSON.parse(jsonStr); logToTerminal('Ollama Agent', actionData.message || 'Processing command matrix block...');
            if (actionData.action === 'spawn' && actionData.blockName) {
              const targetTemplate = libraryBlocksRegistry.find(b => b.blockName === actionData.blockName);
              if (targetTemplate && window.HallowNexusCanvas && window.HallowNexusCanvas.spawnNodeOnCanvas) window.HallowNexusCanvas.spawnNodeOnCanvas(targetTemplate);
            }
          });
        } else { logToTerminal('Ollama', rawText); }
      } catch (err) { logToTerminal('Ollama Error', 'Failed to process command token streams.'); }
    }
  });
}
async function loadSavedProjectData() {
  try {
    const result = await ipcRenderer.invoke('load-project-state');
    if (result && result.success && result.data) {
      document.querySelectorAll('.node-card').forEach(node => node.remove());
      document.querySelectorAll('.canvas-nexus-wire').forEach(wire => wire.remove());
      if (window.HallowNexusCanvas && window.HallowNexusCanvas.activeGraphNodes) window.HallowNexusCanvas.activeGraphNodes.length = 0;
      if (window.HallowNexusWires && window.HallowNexusWires.establishedWires) window.HallowNexusWires.establishedWires.length = 0;

      if (result.data.chatHistory) aiLogs.innerHTML = result.data.chatHistory;
      if (result.data.nodes && window.HallowNexusCanvas && window.HallowNexusCanvas.spawnNodeOnCanvas) {
        result.data.nodes.forEach(savedNode => {
          const matchingTemplate = libraryBlocksRegistry.find(b => b.blockName === savedNode.blockName);
          if (matchingTemplate) {
            const spawnedCard = window.HallowNexusCanvas.spawnNodeOnCanvas(matchingTemplate);
            if (spawnedCard && savedNode.values) {
              spawnedCard.values = { ...savedNode.values };
              Object.keys(savedNode.values).forEach(key => {
                const physicalInput = document.querySelector(`[data-node-id="${spawnedCard.id}"] [data-param-key="${key}"]`);
                if (physicalInput) physicalInput.value = savedNode.values[key];
              });
            }
          }
        });
      }
      if (result.data.wires && window.HallowNexusWires && window.HallowNexusWires.handleSocketClick) {
        setTimeout(() => {
          result.data.wires.forEach(wire => {
            const outPinDOM = document.querySelector(`[data-node-id="${wire.sourceId}"] .socket-port-out`);
            const inPinDOM = document.querySelector(`[data-node-id="${wire.targetId}"] .socket-port-in`);
            if (outPinDOM && inPinDOM) { window.HallowNexusWires.handleSocketClick(outPinDOM); window.HallowNexusWires.handleSocketClick(inPinDOM); }
          });
        }, 200);
      }
      logToTerminal('System', 'Successfully synchronized local drive project data.');
    }
  } catch (err) { logToTerminal('Workspace Error', 'Failed to synchronize sectors: ' + err.message); }
}

async function bootloadExtensions() {
  const activeFoldersDOMMap = {};
  
  // 💎 100% AUTOMATIC OVERRIDE: The system reads your JSON extensions and builds folder tags directly from their contents!
  const targetCategories = ['SPRITES', 'CONTROLS', 'LOGIC', 'SCENE', 'CUSTOM'];
  
  targetCategories.forEach(categoryName => {
    const headingBox = document.createElement('div');
    headingBox.style.color = '#cbd5e1'; headingBox.style.backgroundColor = '#1c1e27'; headingBox.style.padding = '10px'; headingBox.style.marginTop = '10px'; headingBox.style.borderRadius = '4px'; headingBox.style.cursor = 'pointer'; headingBox.style.fontSize = '12px'; headingBox.style.fontWeight = '600'; headingBox.style.border = '1px solid #2d3139'; headingBox.style.letterSpacing = '0.5px';
    headingBox.innerText = categoryName; toolboxPanel.appendChild(headingBox);

    const drawerBody = document.createElement('div');
    drawerBody.className = 'nexus-toolbox-drawer'; drawerBody.style.display = 'none'; drawerBody.style.flexDirection = 'column'; drawerBody.style.gap = '6px'; drawerBody.style.padding = '8px 5px 4px 5px'; toolboxPanel.appendChild(drawerBody);

    headingBox.addEventListener('click', () => {
      const allDrawersList = document.querySelectorAll('.nexus-toolbox-drawer');
      const isTargetCurrentlyClosed = (drawerBody.style.display === 'none');
      allDrawersList.forEach(d => d.style.display = 'none'); 
      drawerBody.style.display = isTargetCurrentlyClosed ? 'flex' : 'none'; 
    });
    activeFoldersDOMMap[categoryName] = drawerBody;
  });

  try {
    const result = await ipcRenderer.invoke('load-extensions');
    if (result && result.success && result.data.length > 0) {
      logToTerminal('Ollama', 'Successfully loaded extension packages.');
      
      result.data.forEach(ext => {
        // Read the "category" header direct out of the JSON file to sort blocks automatically
        let rawCategory = (ext.category || 'CUSTOM').trim().toUpperCase();
        if (rawCategory.includes('SPRITE')) rawCategory = 'SPRITES';
        if (rawCategory.includes('CONTROL')) rawCategory = 'CONTROLS';
        if (rawCategory.includes('LOGIC')) rawCategory = 'LOGIC';
        if (rawCategory.includes('SCENE')) rawCategory = 'SCENE';

        let drawerBody = activeFoldersDOMMap[rawCategory];
        if (!drawerBody) drawerBody = activeFoldersDOMMap['CUSTOM'];

        ext.newBlocks.forEach(block => {
          libraryBlocksRegistry.push(block);

          const blockElement = document.createElement('div');
          blockElement.style.backgroundColor = '#2d3139'; blockElement.style.padding = '8px'; blockElement.style.borderRadius = '4px'; blockElement.style.fontSize = '12px'; blockElement.style.cursor = 'pointer'; blockElement.style.borderLeft = '4px solid #4f46e5'; blockElement.style.userSelect = 'none';
          blockElement.innerText = block.blockName;
          
          blockElement.addEventListener('click', () => { 
            if (window.HallowNexusCanvas && window.HallowNexusCanvas.spawnNodeOnCanvas) {
              window.HallowNexusCanvas.spawnNodeOnCanvas(block); 
            }
          });
          drawerBody.appendChild(blockElement);
        });
      });
      ipcRenderer.invoke('load-project-state').then(res => { if(res && res.success && res.data && res.data.chatHistory) aiLogs.innerHTML = res.data.chatHistory; });
    } else {
      logToTerminal('System Error', 'Backend failed to read JSON files.');
    }
  } catch (err) { 
    logToTerminal('Runtime Error', 'Extension loader crashed: ' + err.message); 
  }
}

bootloadExtensions();
if (window.HallowNexusWires) window.HallowNexusWires.initWireCanvas();
window.addEventListener('mouseup', () => { triggerAutoSavePass(); });
