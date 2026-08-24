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
  
  const masterStudioBlocks = [
    { blockName: "CREATE PLAYER", category: "SPRITES", tooltip: "Spawns main player.", sideMenuFields: [{label:"X",type:"number",default:160},{label:"Y",type:"number",default:120}] },
    { blockName: "CREATE ENEMY", category: "SPRITES", tooltip: "Spawns map enemy.", sideMenuFields: [{label:"Slot ID",type:"number",default:1},{label:"X",type:"number",default:80},{label:"Y",type:"number",default:60}] },
    { blockName: "MOVE WITH BUTTONS", category: "SPRITES", tooltip: "Enables keyboard arrows movement.", sideMenuFields: [{label:"Speed",type:"number",default:4}] },
    { blockName: "SET SPEED VECTOR", category: "SPRITES", tooltip: "Applies constant trajectory speeds.", sideMenuFields: [{label:"X Speed",type:"number",default:2},{label:"Y Speed",type:"number",default:0}] },
    { blockName: "IF TOUCHING KIND", category: "SPRITES", tooltip: "Proximity hit boundary scanner.", sideMenuFields: [{label:"Kind Alpha",type:"text",default:"Player"},{label:"Kind Beta",type:"text",default:"Enemy"}] },
    { blockName: "DESTROY CHAR", category: "SPRITES", tooltip: "De-allocates character entity from memory.", sideMenuFields: [{label:"Slot ID",type:"number",default:1}] },
    { blockName: "CAMERA FOLLOW CHAR", category: "SPRITES", tooltip: "Centers screen camera offsets.", sideMenuFields: [] },
    { blockName: "ANIMATE FRAME RATE", category: "SPRITES", tooltip: "Cycles dynamic layout frame arrays.", sideMenuFields: [{label:"Total Frames",type:"number",default:4}] },
    { blockName: "FLIP IMAGES", category: "SPRITES", tooltip: "Reverses drawing layout vectors orientations.", sideMenuFields: [{label:"Flip Left Right",type:"number",default:1}] },
    { blockName: "RESIZE IMAGE DOUBLE", category: "SPRITES", tooltip: "Pixel doubles the asset mapping context.", sideMenuFields: [] },
    
    { blockName: "WHEN BUTTON PRESSED", category: "CONTROLS", tooltip: "Hardware key bit scanner matrix switch.", sideMenuFields: [{label:"Target Key",type:"text",default:"sk_2nd"}] },
    { blockName: "WHEN BOTH BUTTONS HELD", category: "CONTROLS", tooltip: "Simultaneous dual input validation check.", sideMenuFields: [] },
    { blockName: "PLAY MUSIC NOTE", category: "CONTROLS", tooltip: "Generates link port audio square wave.", sideMenuFields: [{label:"Note Pitch Hz",type:"number",default:440}] },
    { blockName: "PLAY EXPLOSION SOUND", category: "CONTROLS", tooltip: "Generates noise frequency signals blocks.", sideMenuFields: [] },
    { blockName: "WAIT TIMER TICK", category: "CONTROLS", tooltip: "Halts current processing stream parameters.", sideMenuFields: [{label:"Ticks Delay",type:"number",default:30}] },
    { blockName: "LOAD NEXT SEQUEL", category: "CONTROLS", tooltip: "Saves records and executes sequel launcher program.", sideMenuFields: [] }
  ];
  const logicAndSceneBlueprints = [
    { blockName: "START BLOCK", category: "LOGIC", tooltip: "Execution map initial root entry point.", sideMenuFields: [] },
    { blockName: "LOOP BLOCK", category: "LOGIC", tooltip: "Continuous engine logic processing cycles loop.", sideMenuFields: [] },
    { blockName: "CUSTOM CODE INJECTOR", category: "LOGIC", tooltip: "Universal multi-language open text code module field.", sideMenuFields: [{label:"Target Lang",type:"text",default:"python"},{label:"Raw Input Snippet",type:"text",default:"print('Hello')"}] },
    { blockName: "ALLOCATE STORAGE BAG", category: "LOGIC", tooltip: "Carves out custom item database indices arrays.", sideMenuFields: [{label:"Max Capacity",type:"number",default:10}] },
    { blockName: "TOGGLE INVENTORY ATTRIBUTE", category: "LOGIC", tooltip: "Flips slot parameters configurations bytes.", sideMenuFields: [] },
    { blockName: "ALLOCATE QUICK HOTBAR", category: "LOGIC", tooltip: "Allocates selector menu shortcut variable address bounds.", sideMenuFields: [] },
    { blockName: "COMPUTE MINIMAP MATRIX", category: "LOGIC", tooltip: "Down-samples background tiles onto map panels.", sideMenuFields: [] },
    { blockName: "COMPARE HARDWARE VALUE REGISTERS", category: "LOGIC", tooltip: "Mathematical conditions validation check paths.", sideMenuFields: [] },
    { blockName: "COMPUTE MATH OPERATION", category: "LOGIC", tooltip: "Runs low-level numerical calculations.", sideMenuFields: [] },
    { blockName: "CLAMP VALUE REGISTERS", category: "LOGIC", tooltip: "Locks integers values floors limits fields.", sideMenuFields: [] },
    
    { blockName: "GO TO STAGE MAP", category: "SCENE", tooltip: "Loads active background layout map array parameters.", sideMenuFields: [{label:"Map Pointer Data",type:"text",default:"Stage1Data"}] },
    { blockName: "TURN ON TORCH MASK", category: "SCENE", tooltip: "Applies 1-bit hardware shadow masking cones layer.", sideMenuFields: [] }
  ];

  const fullBackupRegistry = masterStudioBlocks.concat(logicAndSceneBlueprints);
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

  fullBackupRegistry.forEach(block => {
    libraryBlocksRegistry.push(block);
    const drawerBody = activeFoldersDOMMap[block.category] || activeFoldersDOMMap['CUSTOM'];

    const blockElement = document.createElement('div');
    blockElement.style.backgroundColor = '#2d3139'; blockElement.style.padding = '8px'; blockElement.style.borderRadius = '4px'; blockElement.style.fontSize = '12px'; blockElement.style.cursor = 'pointer'; blockElement.style.borderLeft = '4px solid #4f46e5'; blockElement.style.userSelect = 'none';
    blockElement.innerText = block.blockName;
    blockElement.addEventListener('click', () => { if (window.HallowNexusCanvas && window.HallowNexusCanvas.spawnNodeOnCanvas) window.HallowNexusCanvas.spawnNodeOnCanvas(block); });
    drawerBody.appendChild(blockElement);
  });

  try {
    const result = await ipcRenderer.invoke('load-extensions');
    if (result && result.success && result.data && result.data.length > 0) {
      result.data.forEach(ext => {
        ext.newBlocks.forEach(block => {
          if (libraryBlocksRegistry.some(b => b.blockName === block.blockName)) return;
          libraryBlocksRegistry.push(block);
          let targetFolder = (ext.category || 'CUSTOM').trim().toUpperCase();
          if (targetFolder.includes('SPRITE')) targetFolder = 'SPRITES';
          if (targetFolder.includes('CONTROL')) targetFolder = 'CONTROLS';
          if (targetFolder.includes('LOGIC')) targetFolder = 'LOGIC';
          if (targetFolder.includes('SCENE')) targetFolder = 'SCENE';

          const drawerBody = activeFoldersDOMMap[targetFolder] || activeFoldersDOMMap['CUSTOM'];
          const blockElement = document.createElement('div');
          blockElement.style.backgroundColor = '#2d3139'; blockElement.style.padding = '8px'; blockElement.style.borderRadius = '4px'; blockElement.style.fontSize = '12px'; blockElement.style.cursor = 'pointer'; blockElement.style.borderLeft = '4px solid #4f46e5'; blockElement.style.userSelect = 'none';
          blockElement.innerText = block.blockName;
          blockElement.addEventListener('click', () => { if (window.HallowNexusCanvas && window.HallowNexusCanvas.spawnNodeOnCanvas) window.HallowNexusCanvas.spawnNodeOnCanvas(block); });
          drawerBody.appendChild(blockElement);
        });
      });
    }
  } catch (err) {}
  
  ipcRenderer.invoke('load-project-state').then(res => { if(res && res.success && res.data && res.data.chatHistory) aiLogs.innerHTML = res.data.chatHistory; });
}

bootloadExtensions();
if (window.HallowNexusWires) window.HallowNexusWires.initWireCanvas();
window.addEventListener('mouseup', () => { triggerAutoSavePass(); });
