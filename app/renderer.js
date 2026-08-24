const btnSquish = document.getElementById('btn-squish');
const btnClean = document.getElementById('btn-clean'); 
const canvasViewport = document.getElementById('canvas-viewport');
const canvasGridLayer = document.getElementById('canvas-grid-layer');
const aiLogs = document.getElementById('ai-logs');
const toolboxPanel = document.getElementById('toolbox');
const ollamaInput = document.getElementById('ollama-input');

const btnSaveProject = document.getElementById('btn-save-project');
const btnReturnMenu = document.getElementById('btn-return-menu');
const mainMenuShell = document.getElementById('nexus-main-menu');
const menuBtnNew = document.getElementById('menu-btn-new');
const menuBtnLoad = document.getElementById('menu-btn-load');

const btnToggleDocs = document.getElementById('btn-toggle-docs');
const docsDrawerShell = document.getElementById('nexus-docs-drawer');
const languageSelectorInput = document.getElementById('nexus-language-selector');
const lblActiveFileDisplay = document.getElementById('lbl-active-file');

// ADVANCED LAYER & ASSET MODAL DOM HOOKS
const btnOpenAssetStudio = document.getElementById('btn-open-asset-studio');
const btnCloseAssetEditor = document.getElementById('btn-close-asset-editor');
const assetEditorModal = document.getElementById('nexus-asset-editor');
const pixelGridContainer = document.getElementById('pixel-canvas-grid-box');
const txtRasterPreview = document.getElementById('txt-raster-preview-box');
const paletteContainer = document.getElementById('palette-swatch-container');

// DYNAMIC GAME-MODE CORE ELEMENTS
const coreGamemodeSelector = document.getElementById('nexus-core-gamemode-selector');
const lblActiveCoreMode = document.getElementById('lbl-active-core-mode');

const itemLedgerContainer = document.getElementById('custom-items-list-container');
const txtItemName = document.getElementById('custom-item-name-input');
const numItemStat = document.getElementById('custom-item-stat-input');
const selAssetType = document.getElementById('custom-asset-type-select');
const numItemEffectBit = document.getElementById('custom-item-effect-bit');
const btnSaveAssetPayload = document.getElementById('btn-save-asset-payload');
const lblActiveLayerMode = document.getElementById('lbl-active-layer-mode');
const liveTilesTray = document.getElementById('live-painted-tiles-tray');

let libraryBlocksRegistry = [];
let paintedPixelsLookupMatrix = Array(256).fill(0);
let customGeneratedBlocksDatabase = [];
let activeSelectedPaletteColorIndex = 1;
let currentActiveEditorLayerIndex = 0; // 0=Visuals, 1=Collision, 2=Light, 3=Interaction
let activePaintBrushTileID = 0;
let currentGlobalGameModeSetting = 'arcade';

function logToTerminal(sender, message) {
  const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  if (aiLogs) {
    aiLogs.innerHTML += '<br><span style="color: #38bdf8;">[' + time + ']</span> <b>' + sender + ':</b> ' + message;
    aiLogs.scrollTop = aiLogs.scrollHeight;
  }
}
if (coreGamemodeSelector) {
  coreGamemodeSelector.addEventListener('change', () => {
    currentGlobalGameModeSetting = coreGamemodeSelector.value;
    const modeLabelsMap = {
      'arcade': 'PURE ARCADE OVERWORLD',
      'textbox': 'PURE TEXTBOX / VISUAL NOVEL',
      'hybrid': 'HYBRID INTERLOCKING ENGINE'
    };
    if (lblActiveCoreMode) lblActiveCoreMode.innerText = modeLabelsMap[currentGlobalGameModeSetting];
    logToTerminal('System', 'Engine core compilation architecture re-routed to: ' + modeLabelsMap[currentGlobalGameModeSetting]);
  });
}

// 4-PASS DESIGN WORKSPACE LAYER TAB BUTTONS
document.querySelectorAll('.layer-tab-btn').forEach(tabBtn => {
  tabBtn.addEventListener('click', () => {
    document.querySelectorAll('.layer-tab-btn').forEach(b => b.classList.remove('tab-active'));
    tabBtn.classList.add('tab-active');
    
    currentActiveEditorLayerIndex = parseInt(tabBtn.dataset.layer);
    const layerNames = ['VISUAL LOOKS', 'MICRO-OFFSET COLLISIONS', '1-BIT LIGHT MASKING', 'ENTITIES INTERACTION/CHUNKS'];
    if (lblActiveLayerMode) lblActiveLayerMode.innerText = layerNames[currentActiveEditorLayerIndex];
    logToTerminal('Workspace', `Switched map workspace focus to: ${layerNames[currentActiveEditorLayerIndex]}`);
  });
});

if (languageSelectorInput) {
  languageSelectorInput.addEventListener('change', () => {
    const selectedExtension = languageSelectorInput.value;
    let textMapping = 'build_output.py';
    if (selectedExtension === 'java') textMapping = 'HallowNexusGame.java';
    if (selectedExtension === 'cpp') textMapping = 'build_output.cpp';
    if (selectedExtension === 'asm') textMapping = 'build_output.asm';
    if (lblActiveFileDisplay) lblActiveFileDisplay.innerText = textMapping;
    logToTerminal('System', 'Switched cross-compilation pipeline to: ' + selectedExtension.toUpperCase());
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

if (btnReturnMenu) { btnReturnMenu.addEventListener('click', () => { mainMenuShell.style.display = 'flex'; }); }
if (btnToggleDocs) { btnToggleDocs.addEventListener('click', (e) => { docsDrawerShell.classList.toggle('drawer-active'); e.stopPropagation(); }); }

if (btnOpenAssetStudio) {
  btnOpenAssetStudio.addEventListener('click', () => {
    assetEditorModal.style.display = 'flex';
    generateHardwarePaletteSwatches();
    initializeAssetMatrixGridPainter();
  });
}

if (btnCloseAssetEditor) {
  btnCloseAssetEditor.addEventListener('click', () => {
    assetEditorModal.style.display = 'none';
  });
}
function generateHardwarePaletteSwatches() {
  if (!paletteContainer || paletteContainer.children.length > 0) return;
  
  for (let idx = 0; idx < 256; idx++) {
    const redChannel = Math.floor(((idx >> 5) & 0x07) * (255 / 7));
    const greenChannel = Math.floor(((idx >> 2) & 0x07) * (255 / 7));
    const blueChannel = Math.floor((idx & 0x03) * (255 / 3));
    
    const colorBlock = document.createElement('div');
    colorBlock.className = 'palette-color-block';
    colorBlock.style.backgroundColor = `rgb(${redChannel}, ${greenChannel}, ${blueChannel})`;
    colorBlock.dataset.colorIndex = idx;
    
    if (idx === activeSelectedPaletteColorIndex) colorBlock.classList.add('selected-swatch');
    
    colorBlock.addEventListener('click', () => {
      document.querySelectorAll('.palette-color-block').forEach(b => b.classList.remove('selected-swatch'));
      colorBlock.classList.add('selected-swatch');
      activeSelectedPaletteColorIndex = idx;
    });
    
    paletteContainer.appendChild(colorBlock);
  }
}

let isDrawingTexture = false;
window.addEventListener('mousedown', () => { isDrawingTexture = true; });
window.addEventListener('mouseup', () => { isDrawingTexture = false; });

function initializeAssetMatrixGridPainter() {
  if (!pixelGridContainer || pixelGridContainer.children.length > 0) return;
  
  for (let idx = 0; idx < 256; idx++) {
    const pixelCell = document.createElement('div');
    pixelCell.className = 'grid-pixel-cell-dot';
    pixelCell.dataset.index = idx;
    
    const handlePixelDrawAction = () => {
      const targetIdx = parseInt(pixelCell.dataset.index);
      paintedPixelsLookupMatrix[targetIdx] = activeSelectedPaletteColorIndex;
      
      const r = Math.floor(((activeSelectedPaletteColorIndex >> 5) & 0x07) * (255 / 7));
      const g = Math.floor(((activeSelectedPaletteColorIndex >> 2) & 0x07) * (255 / 7));
      const b = Math.floor((activeSelectedPaletteColorIndex & 0x03) * (255 / 3));
      
      pixelCell.style.backgroundColor = `rgb(${r}, ${g}, ${b})`;
      recomputeOneBitRasterMaskTable();
    };

    pixelCell.addEventListener('mousedown', (e) => { e.preventDefault(); handlePixelDrawAction(); });
    pixelCell.addEventListener('mouseenter', () => { if (isDrawingTexture) handlePixelDrawAction(); });
    
    pixelGridContainer.appendChild(pixelCell);
  }
  recomputeOneBitRasterMaskTable();
}

function recomputeOneBitRasterMaskTable() {
  let bitmaskBytesList = [];
  for (let row = 0; row < 16; row++) {
    let trackingRowByte = 0;
    for (let col = 0; col < 8; col++) {
      const linearIndex = (row * 16) + col;
      if (paintedPixelsLookupMatrix[linearIndex] > 0) {
        trackingRowByte |= (1 << (7 - col));
      }
    }
    bitmaskBytesList.push('0x' + trackingRowByte.toString(16).toUpperCase().padStart(2, '0'));
  }
  if (txtRasterPreview) txtRasterPreview.innerText = bitmaskBytesList.join(', ');
}
if (btnSaveAssetPayload) {
  btnSaveAssetPayload.addEventListener('click', () => {
    const blockNameRaw = txtItemName.value.trim().toUpperCase().replace(/\s+/g, '_');
    const chosenType = selAssetType.value;
    const initialFieldStat = parseInt(numItemStat.value) || 0;
    const bitmaskValue = parseInt(numItemEffectBit.value) || 0;
    
    if (!blockNameRaw) {
      alert('Please define a Unique Name Token ID for this pixel asset.');
      return;
    }
    
    const compiledCustomBlockNode = {
      blockName: blockNameRaw,
      category: chosenType === 'tile' ? 'SCENE' : 'SPRITES',
      tooltip: `Pixel asset node card. Status Effect matrix bit: ${bitmaskValue}. Stat scalar: ${initialFieldStat}`,
      sideMenuFields: [
        { label: "Magnitude Scalar", type: "number", default: initialFieldStat }
      ],
      ez80AssemblyTemplate: `; --- Pixel Art Card Node: [${blockNameRaw}] ---\nld a, ${bitmaskValue}\nld b, {MagnitudeScalar}\ncall _ExecutePixelStudioRuntimeCallback`
    };
    
    customGeneratedBlocksDatabase.push(compiledCustomBlockNode);
    libraryBlocksRegistry.push(compiledCustomBlockNode);
    
    if (chosenType === 'tile' && liveTilesTray) {
      const tileThumb = document.createElement('div');
      tileThumb.className = 'tile-palette-thumb-card';
      tileThumb.dataset.tileId = customGeneratedBlocksDatabase.length;
      tileThumb.innerText = blockNameRaw.substring(0, 4);
      tileThumb.style.borderLeft = '3px solid #4f46e5';
      
      tileThumb.addEventListener('click', () => {
        document.querySelectorAll('.tile-palette-thumb-card').forEach(t => t.classList.remove('active-paint-tile'));
        tileThumb.classList.add('active-paint-tile');
        activePaintBrushTileID = parseInt(tileThumb.dataset.tileId);
        logToTerminal('Painter', `Active tile brush swapped directly to: [${blockNameRaw}]`);
      });
      liveTilesTray.appendChild(tileThumb);
    }
    
    updateCustomGeneratedBlocksLedgerDisplay();
    logToTerminal('Studio Compiler', `Successfully registered pixel art asset: [${blockNameRaw}] as classification: ${chosenType.toUpperCase()}`);
    assetEditorModal.style.display = 'none';
  });
}

function updateCustomGeneratedBlocksLedgerDisplay() {
  if (!itemLedgerContainer) return;
  if (customGeneratedBlocksDatabase.length === 0) {
    itemLedgerContainer.innerHTML = `<div style="font-size:11px; color:#64748b; text-align:center; padding:10px;">No custom nodes injected yet. Open Art Studio to generate cards.</div>`;
    return;
  }
  itemLedgerContainer.innerHTML = '';
  customGeneratedBlocksDatabase.forEach(block => {
    const row = document.createElement('div');
    row.className = 'custom-item-card-row';
    row.innerHTML = `<div><span style="color:#a78bfa; font-weight:bold;">🎨 ${block.blockName}</span><br><span style="font-size:10px; color:#475569;">Internal Class: ${block.category}</span></div>`;
    itemLedgerContainer.appendChild(row);
  });
}

if (btnSaveProject) {
  btnSaveProject.addEventListener('click', async () => {
    await triggerAutoSavePass();
    logToTerminal('Workspace', 'Project snapshot file saved successfully.');
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
  logToTerminal('Compiler', `Initiating compilation pass targeting: [${chosenLangKey.toUpperCase()}] running mode frame: [${currentGlobalGameModeSetting.toUpperCase()}]`);
  
  try {
    const HallowNexusCompiler = require('../compiler.js');
    const projectCompiler = new HallowNexusCompiler(__dirname);
    const generatedPathResult = projectCompiler.transpileGraph(nodesToCompile, chosenLangKey, currentGlobalGameModeSetting);
    logToTerminal('Success', 'Transpilation complete! File written to: ' + generatedPathResult);
  } catch (err) { logToTerminal('Compiler Error', 'Pipeline exception caught: ' + err.message); }
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
      const serverResult = await window.electronAPI.saveProjectState(workspaceContext);
    }
  });
}

async function triggerAutoSavePass() {
  const stateSnapshot = {
    nodes: (window.HallowNexusCanvas && window.HallowNexusCanvas.activeGraphNodes) || [],
    wires: (window.HallowNexusWires && window.HallowNexusWires.establishedWires) || [],
    chatHistory: aiLogs.innerHTML,
    customBlocks: customGeneratedBlocksDatabase,
    globalGameMode: currentGlobalGameModeSetting
  };
  await window.electronAPI.saveProjectState(stateSnapshot);
}

async function loadSavedProjectData() {
  try {
    const result = await window.electronAPI.loadProjectState();
    if (result && result.success && result.data) {
      document.querySelectorAll('.node-card').forEach(node => node.remove());
      document.querySelectorAll('.canvas-nexus-wire').forEach(wire => wire.remove());
      if (window.HallowNexusCanvas && window.HallowNexusCanvas.activeGraphNodes) window.HallowNexusCanvas.activeGraphNodes.length = 0;
      if (window.HallowNexusWires && window.HallowNexusWires.establishedWires) window.HallowNexusWires.establishedWires.length = 0;
      if (result.data.chatHistory) aiLogs.innerHTML = result.data.chatHistory;
      if (result.data.globalGameMode) {
        currentGlobalGameModeSetting = result.data.globalGameMode;
        if(coreGamemodeSelector) coreGamemodeSelector.value = currentGlobalGameModeSetting;
      }
      if (result.data.customBlocks) {
        customGeneratedBlocksDatabase = result.data.customBlocks;
        updateCustomGeneratedBlocksLedgerDisplay();
        customGeneratedBlocksDatabase.forEach(bl => libraryBlocksRegistry.push(bl));
      }
    }
  } catch (err) {}
}
async function bootloadExtensions() {
  const activeFoldersDOMMap = {};
  const masterStudioBlocks = [
    { blockName: "START BLOCK", category: "LOGIC", tooltip: "The global execution entry point framework initialization root.", sideMenuFields: [] },
    { blockName: "LOOP BLOCK", category: "LOGIC", tooltip: "Continuous engine logic processing infinite loop.", sideMenuFields: [{label:"Target FPS",type:"number",default:60}] },
    { blockName: "CUSTOM CODE INJECTOR", category: "LOGIC", tooltip: "Inject raw handwritten target scripts templates straight into the flow.", sideMenuFields: [{label:"Lang",type:"text",default:"python"}] },
    { blockName: "SAVE GAME DATA", category: "LOGIC", tooltip: "Dumps highly compressed 32-Byte Save Block array into hardware partitions.", sideMenuFields: [{label:"Slot Number",type:"number",default:1}] },
    { blockName: "LOAD GAME DATA", category: "LOGIC", tooltip: "Validates verification magic header signature and restores entity metrics.", sideMenuFields: [{label:"Slot Number",type:"number",default:1}] },
    { blockName: "LAUNCH MINIGAME SUB-ROUTINE", category: "LOGIC", tooltip: "Swaps overworld state machine routines to launch interior games loop.", sideMenuFields: [] },
    { blockName: "EXIT TO MAIN OVERWORLD", category: "LOGIC", tooltip: "Restores frozen coordinates stacks registers and transfers highscore tracking bytes.", sideMenuFields: [] },
    
    { blockName: "CREATE PLAYER", category: "SPRITES", tooltip: "Spawns player graphics vectors.", sideMenuFields: [{label:"X",type:"number",default:160},{label:"Y",type:"number",default:120}] },
    { blockName: "CREATE ENEMY", category: "SPRITES", tooltip: "Spawns map enemy logic registers map.", sideMenuFields: [{label:"Slot ID",type:"number",default:1}] },
    { blockName: "MOVE WITH BUTTONS", category: "SPRITES", tooltip: "Arrow keys matrix input tracker loops speed adjustments.", sideMenuFields: [] },
    { blockName: "IF TOUCHING KIND", category: "SPRITES", tooltip: "4-byte micro-pixel offsets hitbox cross boundary collision analysis.", sideMenuFields: [] },
    
    { blockName: "WHEN BUTTON PRESSED", category: "CONTROLS", tooltip: "Hardware key scan pass controller flag detector lane.", sideMenuFields: [{label:"Target Key",type:"text",default:"sk_2nd"}] },
    { blockName: "PLAY MUSIC NOTE", category: "CONTROLS", tooltip: "Audio square wave pulse sound generator tone frequencies.", sideMenuFields: [{label:"Hz",type:"number",default:440}] },
    { blockName: "PLAY EXPLOSION SOUND", category: "CONTROLS", tooltip: "Zero floating math procedural white noise sweep data blocks.", sideMenuFields: [] },
    
    { blockName: "GO TO STAGE MAP", category: "SCENE", tooltip: "Loads base 9-chunk grid streaming coordinates sectors array matrix.", sideMenuFields: [{label:"Map Pointer Data",type:"text",default:"Stage1Data"}] },
    { blockName: "TURN ON TORCH MASK", category: "SCENE", tooltip: "Applies 1-bit raster look-up table shading flashlight cones shadows mask.", sideMenuFields: [] }
  ];
  
  const targetCategories = ['SPRITES', 'CONTROLS', 'LOGIC', 'SCENE', 'CUSTOM'];
  targetCategories.forEach(categoryName => {
    const headingBox = document.createElement('div');
    headingBox.style.color = '#cbd5e1'; headingBox.style.backgroundColor = '#1c1e27'; headingBox.style.padding = '10px'; headingBox.style.marginTop = '10px'; headingBox.style.borderRadius = '4px'; headingBox.style.cursor = 'pointer'; headingBox.style.fontSize = '12px'; headingBox.style.fontWeight = '600'; headingBox.style.border = '1px solid #2d3139'; headingBox.style.letterSpacing = '0.5px';
    headingBox.innerText = categoryName; toolboxPanel.appendChild(headingBox);
    const drawerBody = document.createElement('div');
    drawerBody.className = `nexus-toolbox-drawer nexus-toolbox-drawer-${categoryName}`; drawerBody.style.display = 'none'; drawerBody.style.flexDirection = 'column'; drawerBody.style.gap = '6px'; drawerBody.style.padding = '8px 5px 4px 5px'; toolboxPanel.appendChild(drawerBody);
    headingBox.addEventListener('click', () => {
      const allDrawersList = document.querySelectorAll('.nexus-toolbox-drawer');
      const isTargetCurrentlyClosed = (drawerBody.style.display === 'none');
      allDrawersList.forEach(d => d.style.display = 'none'); 
      drawerBody.style.display = isTargetCurrentlyClosed ? 'flex' : 'none'; 
    });
    activeFoldersDOMMap[categoryName] = drawerBody;
  });
  masterStudioBlocks.forEach(block => {
    libraryBlocksRegistry.push(block);
    const drawerBody = activeFoldersDOMMap[block.category] || activeFoldersDOMMap['CUSTOM'];
    const blockElement = document.createElement('div');
    blockElement.style.backgroundColor = '#2d3139'; blockElement.style.padding = '8px'; blockElement.style.borderRadius = '4px'; blockElement.style.fontSize = '12px'; blockElement.style.cursor = 'pointer'; blockElement.style.borderLeft = '4px solid #4f46e5'; blockElement.style.userSelect = 'none';
    blockElement.innerText = block.blockName;
    blockElement.addEventListener('click', () => { if (window.HallowNexusCanvas && window.HallowNexusCanvas.spawnNodeOnCanvas) window.HallowNexusCanvas.spawnNodeOnCanvas(block); });
    drawerBody.appendChild(blockElement);
  });

  try {
    const result = await window.electronAPI.loadExtensions();
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
}

bootloadExtensions();
if (window.HallowNexusWires) window.HallowNexusWires.initWireCanvas();
window.addEventListener('mouseup', () => { triggerAutoSavePass(); });
