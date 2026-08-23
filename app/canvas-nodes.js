// Array to track every spawned card block instance floating on the infinite grid
const activeGraphNodes = [];
let nodeIdCounter = 0;

/**
 * Dynamically spawns an interactive block node card onto Panel 2's canvas grid layer
 * @param {Object} blockData - The raw definition template parsed from our extensions JSON
 */
function spawnNodeOnCanvas(blockData) {
  nodeIdCounter++;
  const canvasGrid = document.getElementById('canvas-grid-layer');

  // Create the primary card frame structure
  const nodeCard = document.createElement('div');
  nodeCard.className = 'node-card';
  nodeCard.id = `node-${nodeIdCounter}`;
  nodeCard.style.position = 'absolute';
  nodeCard.style.left = '150px'; // Set a default initial viewport layout position
  nodeCard.style.top = '150px';
  nodeCard.style.width = '240px';
  nodeCard.style.backgroundColor = '#1a1c23';
  nodeCard.style.border = '2px solid #2d3139';
  nodeCard.style.borderRadius = '6px';
  nodeCard.style.padding = '10px';
  nodeCard.style.boxSizing = 'border-box';
  nodeCard.style.zIndex = '20';

  // Inner structural record tracking values
  const nodeRecord = {
    id: nodeCard.id,
    blockName: blockData.blockName,
    ez80AssemblyTemplate: blockData.ez80AssemblyTemplate,
    values: {}
  };

  // 1. Header Row (Block Title text layout)
  const header = document.createElement('div');
  header.style.color = '#e2e8f0';
  header.style.fontSize = '13px';
  header.style.fontWeight = 'bold';
  header.style.borderBottom = '1px solid #2d3139';
  header.style.paddingBottom = '5px';
  header.style.marginBottom = '8px';
  header.innerText = blockData.blockName;
  nodeCard.appendChild(header);

  // 2. Circular Wire Sockets (Universal Omni-Wire Ports layout)
  // Left Input Node Port
  const inputSocket = document.createElement('div');
  inputSocket.style.position = 'absolute';
  inputSocket.style.left = '-8px';
  inputSocket.style.top = '12px';
  inputSocket.style.width = '12px';
  inputSocket.style.height = '12px';
  inputSocket.style.borderRadius = '50%';
  inputSocket.style.backgroundColor = '#38bdf8';
  inputSocket.style.border = '2px solid #0b0c10';
  inputSocket.title = 'Input Execution Socket';
  nodeCard.appendChild(inputSocket);

  // Right Output Node Port
  const outputSocket = document.createElement('div');
  outputSocket.style.position = 'absolute';
  outputSocket.style.right = '-8px';
  outputSocket.style.top = '12px';
  outputSocket.style.width = '12px';
  outputSocket.style.height = '12px';
  outputSocket.style.borderRadius = '50%';
  outputSocket.style.backgroundColor = '#4f46e5';
  outputSocket.style.border = '2px solid #0b0c10';
  outputSocket.title = 'Output Multi-Wire Socket';
  nodeCard.appendChild(outputSocket);

  // 3. Dynamic Side-Drawer Context Fields Generator
  if (blockData.sideMenuFields) {
    blockData.sideMenuFields.forEach(field => {
      const fieldWrapper = document.createElement('div');
      fieldWrapper.style.marginBottom = '6px';
      fieldWrapper.style.display = 'flex';
      fieldWrapper.style.flexDirection = 'column';
      fieldWrapper.style.gap = '2px';

      const label = document.createElement('label');
      label.style.fontSize = '11px';
      label.style.color = '#94a3b8';
      label.innerText = field.label;

      const input = document.createElement('input');
      input.type = field.type === 'number' ? 'number' : 'text';
      input.value = field.default;
      input.style.backgroundColor = '#0b0c10';
      input.style.border = '1px solid #2d3139';
      input.style.color = '#e2e8f0';
      input.style.padding = '4px';
      input.style.borderRadius = '4px';
      input.style.fontSize = '12px';

      // Clean string parameter key formatting
      const paramKey = field.label.replace(/\s+/g, '');
      nodeRecord.values[paramKey] = input.value;

      // Update parameters live in memory matrix whenever input text wiggles
      input.addEventListener('input', () => {
        nodeRecord.values[paramKey] = input.value;
      });

      fieldWrapper.appendChild(label);
      fieldWrapper.appendChild(input);
      nodeCard.appendChild(fieldWrapper);
    });
  }

  // 4. Basic Desktop Mouse Drag-and-Drop Coordinates logic
  let isDraggingNode = false;
  let offsetX = 0, offsetY = 0;

  header.addEventListener('mousedown', (e) => {
    isDraggingNode = true;
    // Calculate precise mouse bounding offsets inside panel
    const rect = nodeCard.getBoundingClientRect();
    const parentRect = canvasGrid.getBoundingClientRect();
    offsetX = e.clientX - rect.left;
    offsetY = e.clientY - rect.top;
    nodeCard.style.cursor = 'grabbing';
    e.stopPropagation(); // Stop grid panning matrix from firing simultaneously
  });

  window.addEventListener('mousemove', (e) => {
    if (!isDraggingNode) return;
    const parentRect = canvasGrid.getBoundingClientRect();
    const targetX = e.clientX - parentRect.left - offsetX;
    const targetY = e.clientY - parentRect.top - offsetY;
    nodeCard.style.left = `${targetX}px`;
    nodeCard.style.top = `${targetY}px`;
  });

  window.addEventListener('mouseup', () => {
    if (isDraggingNode) {
      isDraggingNode = false;
      nodeCard.style.cursor = 'default';
    }
  });

  // Load final elements onto grid viewport and push to tracking registers
  canvasGrid.appendChild(nodeCard);
  activeGraphNodes.push(nodeRecord);
}

// Hook canvas nodes management directly onto global namespace for panel communication
window.HallowNexusCanvas = {
  spawnNodeOnCanvas,
  activeGraphNodes
};
