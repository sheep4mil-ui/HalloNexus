const btnSquish = document.getElementById('btn-squish');
const btnClean = document.getElementById('btn-clean'); 
const canvasViewport = document.getElementById('canvas-viewport');
const canvasGridLayer = document.getElementById('canvas-grid-layer');
const aiLogs = document.getElementById('ai-logs');
const toolboxPanel = document.getElementById('toolbox');
const ollamaInput = document.getElementById('ollama-input');

const btnSaveProject = document.getElementById('btn-save-project');
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
const timelineDropzone = document.getElementById('nexus-timeline-dropzone');

let libraryBlocksRegistry = [];
let paintedPixelsLookupMatrix = Array(256).fill(0);
let customGeneratedBlocksDatabase = [];
let activeSelectedPaletteColorIndex = 1;
let currentActiveEditorLayerIndex = 0; // 0=Visuals, 1=Collision, 2=Light, 3=Interaction
let activePaintBrushTileID = 0;
let currentGlobalGameModeSetting = 'arcade';
let compiledAnimationSequenceTimeline = [];
let activeStudioPaintToolSetting = 'pen';
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
    const modeLabelsMap = { 'arcade': 'PURE ARCADE OVERWORLD', 'textbox': 'PURE TEXTBOX / VISUAL NOVEL', 'hybrid': 'HYBRID INTERLOCKING ENGINE' };
    if (lblActiveCoreMode) lblActiveCoreMode.innerText = modeLabelsMap[currentGlobalGameModeSetting];
    logToTerminal('System', 'Engine core compilation architecture re-routed to: ' + modeLabelsMap[currentGlobalGameModeSetting]);
  });
}
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
setTimeout(() => {
  const dBtnNew = document.getElementById('drop-btn-new');
  const dBtnLoad = document.getElementById('drop-btn-load');
  const dBtnSave = document.getElementById('drop-btn-save');
  if (dBtnNew) dBtnNew.addEventListener('click', () => { document.querySelectorAll('.node-card').forEach(n => n.remove()); logToTerminal('System', 'Reset Canvas Grid.'); });
  if (dBtnLoad) dBtnLoad.addEventListener('click', () => { loadSavedProjectData(); });
  if (dBtnSave) dBtnSave.addEventListener('click', () => { triggerAutoSavePass(); logToTerminal('Workspace', 'Snapshot saved.'); });
}, 500);

if (btnOpenAssetStudio) {
  btnOpenAssetStudio.addEventListener('click', () => {
    if (assetEditorModal) {
      assetEditorModal.style.display = 'flex';
      generateHardwarePaletteSwatches();
      initializeAssetMatrixGridPainter();
      initializeToolBeltButtonListeners();
      logToTerminal('System', 'Unified Multi-Tab Studio Center mounted.');
    }
  });
}
if (btnCloseAssetEditor) { btnCloseAssetEditor.addEventListener('click', () => { if (assetEditorModal) assetEditorModal.style.display = 'none'; }); }
document.querySelectorAll('.studio-tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.studio-tab-btn').forEach(t => t.classList.remove('active-sub-tab'));
    document.querySelectorAll('.studio-panel-content-pane').forEach(p => p.classList.remove('pane-visible'));
    btn.classList.add('active-sub-tab');
    const targetPaneId = btn.dataset.targetPane;
    const targetPaneDOM = document.getElementById(targetPaneId);
    if (targetPaneDOM) targetPaneDOM.classList.add('pane-visible');
  });
});

function initializeToolBeltButtonListeners() {
  const tPen = document.getElementById('tool-btn-pen');
  const tEraser = document.getElementById('tool-btn-eraser');
  const tBucket = document.getElementById('tool-btn-bucket');
  const tClear = document.getElementById('tool-btn-clear');
  const clearActiveToolState = () => { document.querySelectorAll('.tool-belt-btn').forEach(b => b.classList.remove('tool-active')); };
  if (tPen) tPen.onclick = () => { clearActiveToolState(); tPen.classList.add('tool-active'); activeStudioPaintToolSetting = 'pen'; };
  if (tEraser) tEraser.onclick = () => { clearActiveToolState(); tEraser.classList.add('tool-active'); activeStudioPaintToolSetting = 'eraser'; };
  if (tBucket) tBucket.onclick = () => { clearActiveToolState(); tBucket.classList.add('tool-active'); activeStudioPaintToolSetting = 'bucket'; };
  if (tClear) tClear.onclick = () => { paintedPixelsLookupMatrix.fill(0); document.querySelectorAll('.grid-pixel-cell-dot').forEach(d => d.style.backgroundColor = '#111216'); recomputeOneBitRasterMaskTable(); };
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
    colorBlock.addEventListener('click', () => { document.querySelectorAll('.palette-color-block').forEach(b => b.classList.remove('selected-swatch')); colorBlock.classList.add('selected-swatch'); activeSelectedPaletteColorIndex = idx; });
    paletteContainer.appendChild(colorBlock);
  }
}

let isPaintBrushActive = false;
if (pixelGridContainer) {
  pixelGridContainer.addEventListener('mousedown', (e) => { e.preventDefault(); isPaintBrushActive = true; });
  window.addEventListener('mouseup', () => { isPaintBrushActive = false; });
}

function initializeAssetMatrixGridPainter() {
  if (!pixelGridContainer || pixelGridContainer.children.length > 0) return;
  for (let idx = 0; idx < 256; idx++) {
    const pixelCell = document.createElement('div');
    pixelCell.className = 'grid-pixel-cell-dot';
    pixelCell.dataset.index = idx;
    const executePixelStampPass = () => {
      const targetIdx = parseInt(pixelCell.dataset.index);
      if (activeStudioPaintToolSetting === 'bucket') { executeStackFloodFillBucket(targetIdx); return; }
      const colorToApply = activeStudioPaintToolSetting === 'eraser' ? 0 : activeSelectedPaletteColorIndex;
      paintedPixelsLookupMatrix[targetIdx] = colorToApply;
      const r = Math.floor(((colorToApply >> 5) & 0x07) * (255 / 7));
      const g = Math.floor(((colorToApply >> 2) & 0x07) * (255 / 7));
      const b = Math.floor((colorToApply & 0x03) * (255 / 3));
      pixelCell.style.backgroundColor = colorToApply > 0 ? `rgb(${r}, ${g}, ${b})` : '#111216';
      recomputeOneBitRasterMaskTable();
    };
    pixelCell.addEventListener('mousedown', () => { executePixelStampPass(); });
    pixelCell.addEventListener('mouseenter', () => { if (isPaintBrushActive && activeStudioPaintToolSetting !== 'bucket') executePixelStampPass(); });
    pixelGridContainer.appendChild(pixelCell);
  }
  recomputeOneBitRasterMaskTable();
}
function executeStackFloodFillBucket(startingIndex) {
  const targetColor = paintedPixelsLookupMatrix[startingIndex];
  const fillStructuredColor = activeSelectedPaletteColorIndex;
  if (targetColor === fillStructuredColor) return;
  let indexProcessStack = [startingIndex];
  while (indexProcessStack.length > 0) {
    const currentIdx = indexProcessStack.pop();
    if (paintedPixelsLookupMatrix[currentIdx] !== targetColor) continue;
    paintedPixelsLookupMatrix[currentIdx] = fillStructuredColor;
    const cellDOM = document.querySelector(`.grid-pixel-cell-dot[data-index="${currentIdx}"]`);
    if (cellDOM) {
      const r = Math.floor(((fillStructuredColor >> 5) & 0x07) * (255 / 7));
      const g = Math.floor(((fillStructuredColor >> 2) & 0x07) * (255 / 7));
      const b = Math.floor((fillStructuredColor & 0x03) * (255 / 3));
      cellDOM.style.backgroundColor = `rgb(${r}, ${g}, ${b})`;
    }
    const row = Math.floor(currentIdx / 16);
    const col = currentIdx % 16;
    if (row > 0) indexProcessStack.push(currentIdx - 16);
    if (row < 15) indexProcessStack.push(currentIdx + 16);
    if (col > 0) indexProcessStack.push(currentIdx - 1);
    if (col < 15) indexProcessStack.push(currentIdx + 1);
  }
  recomputeOneBitRasterMaskTable();
}

function recomputeOneBitRasterMaskTable() {
  let bitmaskBytesList = [];
  for (let row = 0; row < 16; row++) {
    let trackingRowByte = 0;
    for (let col = 0; col < 8; col++) {
      const linearIndex = (row * 16) + col;
      if (paintedPixelsLookupMatrix[linearIndex] > 0) { trackingRowByte |= (1 << (7 - col)); }
    }
    bitmaskBytesList.push('0x' + trackingRowByte.toString(16).toUpperCase().padStart(2, '0'));
  }
  if (txtRasterPreview) txtRasterPreview.innerText = bitmaskBytesList.join(', ');
}
function attachDragAndDropToThumbCard(cardDOM, nameRaw) {
  cardDOM.draggable = true;
  cardDOM.addEventListener('dragstart', (e) => { e.dataTransfer.setData('text/plain', nameRaw); });
}

if (timelineDropzone) {
  timelineDropzone.addEventListener('dragover', (e) => { e.preventDefault(); });
  timelineDropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    const droppedAssetName = e.dataTransfer.getData('text/plain');
    if (!droppedAssetName) return;
    const notice = document.getElementById('timeline-empty-notice');
    if (notice) notice.remove();
    compiledAnimationSequenceTimeline.push(droppedAssetName);
    const frameStrip = document.createElement('div');
    frameStrip.className = 'timeline-frame-strip-item';
    frameStrip.innerText = droppedAssetName.substring(0, 3) + compiledAnimationSequenceTimeline.length;
    const deleteBadge = document.createElement('div');
    deleteBadge.className = 'frame-delete-node-badge'; deleteBadge.innerText = '×';
    deleteBadge.addEventListener('click', (ev) => { ev.stopPropagation(); frameStrip.remove(); compiledAnimationSequenceTimeline = compiledAnimationSequenceTimeline.filter(n => n !== droppedAssetName); });
    frameStrip.appendChild(deleteBadge); timelineDropzone.appendChild(frameStrip);
  });
}

if (btnSaveAssetPayload) {
  btnSaveAssetPayload.addEventListener('click', () => {
    const blockNameRaw = txtItemName.value.trim().toUpperCase().replace(/\s+/g, '_');
    const chosenType = selAssetType.value;
    const initialFieldStat = parseInt(numItemStat.value) || 0;
    const chosenDrawer = document.getElementById('custom-block-category-select').value;
    const customSnippet = document.getElementById('custom-block-code-snippet').value || "";
    if (!blockNameRaw) { alert('Please define a ID Token.'); return; }
    const compiledCustomBlockNode = { blockName: blockNameRaw, category: chosenDrawer, tooltip: `Timeline Frames: ${compiledAnimationSequenceTimeline.length}.`, sideMenuFields: [{ label: "Value", type: "number", default: initialFieldStat }], ez80AssemblyTemplate: `; --- Custom node ---\ncall _ExecuteCallback` };
    customGeneratedBlocksDatabase.push(compiledCustomBlockNode); libraryBlocksRegistry.push(compiledCustomBlockNode);
    if (liveTilesTray) {
      const tileThumb = document.createElement('div'); tileThumb.className = 'tile-palette-thumb-card'; tileThumb.innerText = blockNameRaw.substring(0, 4);
      tileThumb.addEventListener('click', () => { activePaintBrushTileID = customGeneratedBlocksDatabase.length; });
      attachDragAndDropToThumbCard(tileThumb, blockNameRaw); liveTilesTray.appendChild(tileThumb);
    }
    updateCustomGeneratedBlocksLedgerDisplay(); assetEditorModal.style.display = 'none';
  });
}
function updateCustomGeneratedBlocksLedgerDisplay() {
  if (!itemLedgerContainer) return;
  if (customGeneratedBlocksDatabase.length === 0) { itemLedgerContainer.innerHTML = `<div style="font-size:10px; color:#64748b; text-align:center; padding:10px;">No components built yet.</div>`; return; }
  itemLedgerContainer.innerHTML = '';
  customGeneratedBlocksDatabase.forEach(block => {
    const row = document.createElement('div'); row.className = 'custom-item-card-row';
    row.innerHTML = `<div><span style="color:#a78bfa; font-weight:bold;">⚙️ ${block.blockName}</span><br><span style="font-size:10px; color:#475569;">Internal Class: ${block.category}</span></div>`;
    itemLedgerContainer.appendChild(row);
  });
}

btnClean.addEventListener('click', async () => {
  if (!window.HallowNexusCanvas || !window.HallowNexusCanvas.getWiredExecutionOrder) return;
  const nodesToCompile = window.HallowNexusCanvas.getWiredExecutionOrder(); if (nodesToCompile.length === 0) return;
  const chosenLangKey = languageSelectorInput ? languageSelectorInput.value : 'python';
  try {
    const HallowNexusCompiler = require('../compiler.js');
    const projectCompiler = new HallowNexusCompiler(__dirname);
    projectCompiler.transpileGraph(nodesToCompile, chosenLangKey, currentGlobalGameModeSetting);
  } catch (err) {}
});

async function triggerAutoSavePass() {
  const stateSnapshot = { nodes: [], customBlocks: customGeneratedBlocksDatabase, globalGameMode: currentGlobalGameModeSetting };
  await window.electronAPI.saveProjectState(stateSnapshot);
}

async function loadSavedProjectData() {
  try {
    const result = await window.electronAPI.loadProjectState();
    if (result && result.success && result.data && result.data.customBlocks) { customGeneratedBlocksDatabase = result.data.customBlocks; updateCustomGeneratedBlocksLedgerDisplay(); }
  } catch (err) {}
}

async function bootloadExtensions() {
  const masterStudioBlocks = [
    { blockName: "START BLOCK", category: "LOGIC", sideMenuFields: [] },
    { blockName: "LOOP BLOCK", category: "LOGIC", sideMenuFields: [{label:"Target FPS",type:"number",default:60}] },
    { blockName: "SPRITE CONFIG MATRIX", category: "SPRITES", sideMenuFields: [{label:"Model Slot Type",type:"text",default:"ANIMATION_LOOP"}] }
  ];
  const targetCategories = ['SPRITES', 'CONTROLS', 'LOGIC', 'SCENE', 'CUSTOM'];
  const activeFoldersDOMMap = {};
  targetCategories.forEach(categoryName => {
    const headingBox = document.createElement('div'); headingBox.style.color = '#cbd5e1'; headingBox.style.backgroundColor = '#1c1e27'; headingBox.style.padding = '10px'; headingBox.style.marginTop = '10px'; headingBox.style.fontSize = '12px'; headingBox.style.fontWeight = '600'; headingBox.style.border = '1px solid #2d3139'; headingBox.innerText = categoryName; toolboxPanel.appendChild(headingBox);
    const drawerBody = document.createElement('div'); drawerBody.className = `nexus-toolbox-drawer nexus-toolbox-drawer-${categoryName}`; drawerBody.style.display = 'none'; drawerBody.style.flexDirection = 'column'; drawerBody.style.gap = '6px'; drawerBody.style.padding = '8px 5px'; toolboxPanel.appendChild(drawerBody);
    headingBox.onclick = () => { drawerBody.style.display = drawerBody.style.display === 'none' ? 'flex' : 'none'; };
    activeFoldersDOMMap[categoryName] = drawerBody;
  });
  masterStudioBlocks.forEach(block => {
    libraryBlocksRegistry.push(block);
    const drawerBody = activeFoldersDOMMap[block.category] || activeFoldersDOMMap['CUSTOM'];
    const blockElement = document.createElement('div'); blockElement.style.backgroundColor = '#2d3139'; blockElement.style.padding = '8px'; blockElement.style.borderRadius = '4px'; blockElement.style.fontSize = '12px'; blockElement.style.cursor = 'pointer'; blockElement.innerText = block.blockName;
    blockElement.onclick = () => { if (window.HallowNexusCanvas) window.HallowNexusCanvas.spawnNodeOnCanvas(block); }; drawerBody.appendChild(blockElement);
  });
}

let canvasViewportViewport = document.getElementById('canvas-viewport');
if(canvasViewportViewport){ canvasViewportViewport.addEventListener('mouseup', () => { document.querySelectorAll('.tile-palette-thumb-card').forEach(card => { if(card.dataset.tileId === "0") attachDragAndDropToThumbCard(card, "WIPE_TILE"); }); }); }
bootloadExtensions();
window.addEventListener('mouseup', () => { triggerAutoSavePass(); });
