let selectedSourceSocket = null;
const establishedWires = [];

function initWireCanvas() {
  // Pure HTML div box tracer layout engine
}

function handleSocketClick(clickedSocket) {
  const isOutPort = clickedSocket.classList.contains('socket-port-out');
  const parentCardId = clickedSocket.parentElement.id;

  // Phase 1: First Click - Select output source origin pin
  if (!selectedSourceSocket) {
    if (!isOutPort) return;
    
    selectedSourceSocket = clickedSocket;
    selectedSourceSocket.style.backgroundColor = "#22c55e"; 
    return;
  }

  // Swap targets if clicking a different block's output port
  if (isOutPort) {
    selectedSourceSocket.style.backgroundColor = "#4f46e5"; 
    selectedSourceSocket = clickedSocket;
    selectedSourceSocket.style.backgroundColor = "#22c55e";
    return;
  }

  // Strict self-linking protection boundaries filter
  if (parentCardId === selectedSourceSocket.parentElement.id) {
    selectedSourceSocket.style.backgroundColor = "#4f46e5";
    selectedSourceSocket = null;
    return;
  }

  // Phase 2: Secure Link Connected - Trigger the 3x Green Flashing Handshake Animation
  const sourceSocket = selectedSourceSocket;
  const targetSocket = clickedSocket;

  sourceSocket.classList.add('socket-flash-confirm');
  targetSocket.classList.add('socket-flash-confirm');

  setTimeout(() => {
    sourceSocket.classList.remove('socket-flash-confirm');
    targetSocket.classList.remove('socket-flash-confirm');
    sourceSocket.style.backgroundColor = "#4f46e5"; 
    targetSocket.style.backgroundColor = "#38bdf8"; 
  }, 900); 

  // Phase 3: Draw the green wire link channel using a 2D Transformed Div Element Block
  const canvasGrid = document.getElementById('canvas-grid-layer');
  if (!canvasGrid) return;

  const sourceCard = sourceSocket.parentElement;
  const ox = (parseInt(sourceCard.style.left) || 0) + 240; 
  const oy = (parseInt(sourceCard.style.top) || 0) + 18;

  const targetCard = targetSocket.parentElement;
  const finalX = parseInt(targetCard.style.left) || 0; 
  const finalY = (parseInt(targetCard.style.top) || 0) + 18;

  const dx = finalX - ox;
  const dy = finalY - oy;
  const distance = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);

  const wireDiv = document.createElement('div');
  wireDiv.className = 'canvas-nexus-wire';
  wireDiv.style.position = 'absolute';
  wireDiv.style.left = `${ox}px`;
  wireDiv.style.top = `${oy}px`;
  wireDiv.style.width = `${distance}px`;
  wireDiv.style.height = '3px';
  wireDiv.style.backgroundColor = '#22c55e'; 
  wireDiv.style.transformOrigin = 'top left';
  wireDiv.style.transform = `rotate(${angle}deg)`;
  wireDiv.style.zIndex = '5'; 
  wireDiv.style.pointerEvents = 'none';

  wireDiv.dataset.sourceId = sourceCard.id;
  wireDiv.dataset.targetId = targetCard.id;

  canvasGrid.appendChild(wireDiv);

  establishedWires.push({
    element: wireDiv,
    sourceId: sourceCard.id,
    targetId: targetCard.id
  });

  selectedSourceSocket = null;
}

/**
 * Triggers an alignment loop pass to stretch and rotate wires live whenever a card is dragged
 */
function updateWiredConnectionsPositions() {
  const wires = document.querySelectorAll('.canvas-nexus-wire');
  wires.forEach(wireDiv => {
    const sourceCard = document.getElementById(wireDiv.dataset.sourceId);
    const targetCard = document.getElementById(wireDiv.dataset.targetId);
    if (!sourceCard || !targetCard) return;

    const ox = (parseInt(sourceCard.style.left) || 0) + 240;
    const oy = (parseInt(sourceCard.style.top) || 0) + 18;
    const finalX = parseInt(targetCard.style.left) || 0;
    const finalY = (parseInt(targetCard.style.top) || 0) + 18;

    const dx = finalX - ox;
    const dy = finalY - oy;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);

    wireDiv.style.left = `${ox}px`;
    wireDiv.style.top = `${oy}px`;
    wireDiv.style.width = `${distance}px`;
    wireDiv.style.transform = `rotate(${angle}deg)`;
  });
}

window.HallowNexusWires = {
  initWireCanvas,
  handleSocketClick,
  updateWiredConnectionsPositions,
  establishedWires
};
