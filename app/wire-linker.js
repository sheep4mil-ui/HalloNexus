let selectedSourceSocket = null;
const establishedWires = [];

function initWireCanvas() {
  // Target the top-level viewport shell container to prevent grid background burying bugs
  const canvasViewport = document.getElementById('canvas-viewport');
  if (!canvasViewport || document.getElementById('nexus-wire-svg')) return;

  const svgNS = "http://w3.org";
  const svgCanvas = document.createElementNS(svgNS, "svg");
  svgCanvas.setAttribute("id", "nexus-wire-svg");
  svgCanvas.style.position = "absolute";
  svgCanvas.style.top = "0";
  svgCanvas.style.left = "0";
  
  // FIXED: Expand canvas container bounding box size variables to prevent clipping lines off-screen
  svgCanvas.setAttribute("width", "5000");
  svgCanvas.setAttribute("height", "5000");
  svgCanvas.style.width = "5000px";
  svgCanvas.style.height = "5000px";
  
  svgCanvas.style.pointerEvents = "none"; // Lets you drag card nodes directly underneath wire lanes
  svgCanvas.style.zIndex = "5"; // Layered safely right between the grid mesh background and card blocks

  canvasViewport.appendChild(svgCanvas);
}

function handleSocketClick(clickedSocket) {
  const isOutPort = clickedSocket.classList.contains('socket-port-out');
  const parentCardId = clickedSocket.parentElement.id;

  // Phase 1: First Click - Select output source logic origin pin
  if (!selectedSourceSocket) {
    if (!isOutPort) return;
    
    selectedSourceSocket = clickedSocket;
    selectedSourceSocket.style.backgroundColor = "#22c55e"; // Turn green to track active draft selection
    return;
  }

  // Swap targets if clicking a different block's output port
  if (isOutPort) {
    selectedSourceSocket.style.backgroundColor = "#4f46e5"; // Restore deep purple layout palette
    selectedSourceSocket = clickedSocket;
    selectedSourceSocket.style.backgroundColor = "#22c55e";
    return;
  }

  // Self-linking protection boundaries filter loop
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
    sourceSocket.style.backgroundColor = "#4f46e5"; // Reset output back to standard Purple
    targetSocket.style.backgroundColor = "#38bdf8"; // Reset input back to standard Light Blue
  }, 900); // 900ms matches the precise duration of 3 clean, crisp flashes

  // Phase 3: Draw the green curved wire connection path vector
  const svgCanvas = document.getElementById('nexus-wire-svg');
  if (!svgCanvas) return;

  const svgNS = "http://w3.org";
  const path = document.createElementNS(svgNS, "path");
  path.setAttribute("stroke", "#22c55e"); // Green trace wire links the cards together
  path.setAttribute("stroke-width", "3");
  path.setAttribute("fill", "none");
  svgCanvas.appendChild(path);

  // FIXED: Track relative grid coordinates and map coordinates straight to the expanded SVG map
  const canvasGrid = document.getElementById('canvas-grid-layer');
  const style = window.getComputedStyle(canvasGrid);
  const matrix = new WebKitCSSMatrix(style.transform);
  const panX = matrix.m41;
  const panY = matrix.m42;

  const sourceCard = sourceSocket.parentElement;
  const sX = (parseInt(sourceCard.style.left) || 0) + panX;
  const sY = (parseInt(sourceCard.style.top) || 0) + panY;
  const ox = sX + 240;
  const oy = sY + 18;

  const targetCard = targetSocket.parentElement;
  const tX = (parseInt(targetCard.style.left) || 0) + panX;
  const tY = (parseInt(targetCard.style.top) || 0) + panY;
  const finalX = tX;
  const finalY = tY + 18;

  const controlOffset = Math.abs(finalX - ox) * 0.5;
  const dStr = `M ${ox} ${oy} C ${ox + controlOffset} ${oy}, ${finalX - controlOffset} ${finalY}, ${finalX} ${finalY}`;
  path.setAttribute("d", dStr);

  establishedWires.push({
    path: path,
    sourceId: sourceCard.id,
    targetId: targetCard.id
  });

  // Clear tracking variable reference to open the slot for building the next wire chain link
  selectedSourceSocket = null;
}

window.HallowNexusWires = {
  initWireCanvas,
  handleSocketClick,
  establishedWires
};
