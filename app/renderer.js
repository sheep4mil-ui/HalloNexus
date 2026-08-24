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
  logToTerminal('Compiler', 'Initiating cross-compilation conversion routines targeting: ' + chosenLangKey.toUpperCase());
  
  try {
    const HallowNexusCompiler = require('../compiler.js');
    const projectCompiler = new HallowNexusCompiler(__dirname);
    
    const generatedPathResult = projectCompiler.transpileGraph(nodesToCompile, chosenLangKey);
    logToTerminal('Success', 'Transpilation complete! Source script exported cleanly to: ' + generatedPathResult);
    
    const compileResult = await projectCompiler.compileToBinary('HALLOW');
    if (compileResult.success && window.HallowNexusEmulator && document.body.classList.contains('squish-active')) {
      window.HallowNexusEmulator.loadBinaryPayload(compileResult.bytecodePayload);
    }
  } catch (err) {
    logToTerminal('Compiler Error', 'Cross-compilation loop exception caught: ' + err.message);
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
