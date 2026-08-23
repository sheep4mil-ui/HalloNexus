const activeGraphNodes = [];
let nodeIdCounter = 0;

/**
 * Dynamically spawns an interactive block node card onto the canvas grid layer
 * @param {Object} blockData - The raw definition template parsed from our extensions JSON
 */
function spawnNodeOnCanvas(blockData) {
  nodeIdCounter++;
  const canvasGrid = document.getElementById('canvas-grid-layer');
  if (!canvasGrid) return;

  const nodeCard = document.createElement('div');
  nodeCard.className = 'node-card';
  nodeCard.id = `node-${nodeIdCounter}`;
  nodeCard.style.position = 'absolute';
  nodeCard.style.left = '150px'; 
  nodeCard.style.top = '150px';
  nodeCard.style.width = '240px';
  nodeCard.style.backgroundColor = '#1a1c23';
  nodeCard.style.border = '2px solid #2d3139';
  nodeCard.style.borderRadius = '6px';
  nodeCard.style.padding = '10px';
  nodeCard.style.boxSizing = 'border-box';
  nodeCard.style.zIndex = '20';

  const nodeRecord = {
    id: nodeCard.id,
    blockName: blockData.blockName,
    ez80AssemblyTemplate: blockData.ez80AssemblyTemplate,
    values: {},
    connections: [] 
  };

  // 1. Header Layout Row
  const header = document.createElement('div');
  header.style.color = '#e2e8f0';
  header.style.fontSize = '13px';
  header.style.fontWeight = 'bold';
  header.style.borderBottom = '1px solid #2d3139';
  header.style.paddingBottom = '5px';
  header.style.marginBottom = '8px';
  header.style.userSelect = 'none';
  header.style.cursor = 'grab';
  header.innerText = blockData.blockName;
  nodeCard.appendChild(header);

  // 2. Click-to-Link Circular Sockets Layout Setup
  const outputSocket = document.createElement('div');
  outputSocket.className = 'socket-port-out'; 
  outputSocket.style.position = 'absolute';
  outputSocket.style.right = '-8px';
  outputSocket.style.top = '12px';
  outputSocket.style.width = '12px';
  outputSocket.style.height = '12px';
  outputSocket.style.borderRadius = '50%';
  outputSocket.style.backgroundColor = '#4f46e5';
  outputSocket.style.border = '2px solid #0b0c10';
  outputSocket.style.cursor = 'pointer';
  outputSocket.title = 'Click to start data wire link';

  // Attach two-click management trigger logic
  outputSocket.addEventListener('click', (e) => {
    if (window.HallowNexusWires) window.HallowNexusWires.handleSocketClick(outputSocket);
    e.stopPropagation();
  });
  nodeCard.appendChild(outputSocket);

  const inputSocket = document.createElement('div');
  inputSocket.className = 'socket-port-in';
  inputSocket.style.position = 'absolute';
  inputSocket.style.left = '-8px';
  inputSocket.style.top = '12px';
  inputSocket.style.width = '12px';
  inputSocket.style.height = '12px';
  inputSocket.style.borderRadius = '50%';
  inputSocket.style.backgroundColor = '#38bdf8';
  inputSocket.style.border = '2px solid #0b0c10';
  inputSocket.style.cursor = 'pointer';
  inputSocket.title = 'Click to finish data wire link';

  inputSocket.addEventListener('click', (e) => {
    if (window.HallowNexusWires) window.HallowNexusWires.handleSocketClick(inputSocket);
    e.stopPropagation();
  });
  nodeCard.appendChild(inputSocket);

  // 3. Side-Drawer Settings Fields
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

      const paramKey = field.label.replace(/\s+/g, '');
      nodeRecord.values[paramKey] = input.value;

      input.addEventListener('input', () => {
        nodeRecord.values[paramKey] = input.value;
      });

      fieldWrapper.appendChild(label);
      fieldWrapper.appendChild(input);
      nodeCard.appendChild(fieldWrapper);
    });
  }

  // 4. Mouse Move Drag Handlers
  let isDraggingNode = false;
  let offsetX = 0, offsetY = 0;

  header.addEventListener('mousedown', (e) => {
    isDraggingNode = true;
    const rect = nodeCard.getBoundingClientRect();
    offsetX = e.clientX - rect.left;
    offsetY = e.clientY - rect.top;
    header.style.cursor = 'grabbing';
    e.stopPropagation(); 
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
      header.style.cursor = 'grab';
    }
  });

  canvasGrid.appendChild(nodeCard);
  activeGraphNodes.push(nodeRecord);
}

/**
 * Sweeps through our active vector wiring path and structures nodes in order of execution
 */
function getWiredExecutionOrder() {
  if (activeGraphNodes.length === 0) return [];
  
  const orderedNodes = [];
  const visitedNodeIds = new Set();
  const wiresList = (window.HallowNexusWires && window.HallowNexusWires.establishedWires) || [];
  
  activeGraphNodes.forEach(node => node.connections = []);

  wiresList.forEach(wire => {
    const parentNode = activeGraphNodes.find(n => n.id === wire.sourceId);
    if (parentNode && !parentNode.connections.includes(wire.targetId)) {
      parentNode.connections.push(wire.targetId);
    }
  });

  const targetedNodeIds = wiresList.map(w => w.targetId);
  const rootNodes = activeGraphNodes.filter(n => !targetedNodeIds.includes(n.id));
  const executionStarters = rootNodes.length > 0 ? rootNodes : [activeGraphNodes[0]];

  function traceWirePath(node) {
    if (!node || visitedNodeIds.has(node.id)) return;
    visitedNodeIds.add(node.id);
    orderedNodes.push(node);

    node.connections.forEach(childId => {
      const nextNode = activeGraphNodes.find(n => n.id === childId);
      traceWirePath(nextNode);
    });
  }

  executionStarters.forEach(startCard => traceWirePath(startCard));

  activeGraphNodes.forEach(node => {
    if (!visitedNodeIds.has(node.id)) orderedNodes.push(node);
  });

  return orderedNodes;
}

window.HallowNexusCanvas = {
  spawnNodeOnCanvas,
  activeGraphNodes,
  getWiredExecutionOrder
};
