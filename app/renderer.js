const { ipcRenderer } = require('electron');

const btnSquish = document.getElementById('btn-squish');
const canvasViewport = document.getElementById('canvas-viewport');
const canvasGridLayer = document.getElementById('canvas-grid-layer');
const aiLogs = document.getElementById('ai-logs');
const toolboxPanel = document.getElementById('toolbox');

// 1. Handle the Absolute-Left Emulator Animation
btnSquish.addEventListener('click', () => {
  document.body.classList.toggle('squish-active');
  logToTerminal('System', 'Layout updated. Playtest emulator swapped.');
});

// 2. Infinite Pan Movement Math logic for Panel 2 Canvas
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
}

// 3. Dynamic JSON Extension Bootloader Handshake
async function bootloadExtensions() {
  try {
    const result = await ipcRenderer.invoke('load-extensions');
    if (result.success && result.data.length > 0) {
      logToTerminal('Ollama', `Successfully loaded ${result.data.length} custom block extension packages.`);
      
      // Render the loaded blocks inside the far-left sidebar toolbox
      result.data.forEach(ext => {
        const categoryHeader = document.createElement('h4');
        categoryHeader.style.color = '#a78bfa';
        categoryHeader.style.marginTop = '15px';
        categoryHeader.style.marginBottom = '5px';
        categoryHeader.innerText = ext.category || 'Custom Blocks';
        toolboxPanel.appendChild(categoryHeader);

        ext.newBlocks.forEach(block => {
          const blockElement = document.createElement('div');
          blockElement.style.backgroundColor = '#2d3139';
          blockElement.style.padding = '8px';
          blockElement.style.marginHeight = '4px';
          blockElement.style.borderRadius = '4px';
          blockElement.style.fontSize = '12px';
          blockElement.style.cursor = 'pointer';
          blockElement.style.borderLeft = '4px solid #4f46e5';
          blockElement.title = block.tooltip;
          blockElement.innerText = block.blockName;
          toolboxPanel.appendChild(blockElement);
        });
      });
    } else if (!result.success) {
      logToTerminal('System Error', `Failed to read extensions: ${result.error}`);
    }
  } catch (err) {
    logToTerminal('Runtime Error', err.message);
  }
}

// Run layout initialization pass
bootloadExtensions();
