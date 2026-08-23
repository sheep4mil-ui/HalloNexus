let selectedSourceSocket = null;
const establishedWires = [];

function initWireCanvas() {
  // FIXED: Appends the SVG directly INSIDE the grid layer so it moves natively with your cards
  const canvasGrid = document.getElementById('canvas-grid-layer');
  if (!canvasGrid || document.getElementById('nexus-wire-svg')) return;

  const svgNS = "http://w3.org";
  const svgCanvas = document.createElementNS(svgNS, "svg");
  svgCanvas.setAttribute("id", "nexus-wire-svg");
  svgCanvas.style.position = "absolute";
  svgCanvas.style.top = "0";
  svgCanvas.style.left = "0";
  svgCanvas.setAttribute("width", "5000");
  svgCanvas.setAttribute("height", "5000");
  svgCanvas.style.width = "5000px";
  svgCanvas.style.height = "5000px";
  svgCanvas.style.pointerEvents = "none"; 
  svgCanvas.style.zIndex = "1"; // Sandwiched cleanly right below the text layers of your card blocks

  canvasGrid.appendChild(svgCanvas);
}

function handleSocketClick(clickedSocket) {
  const isOutPort = clickedSocket.classList.contains('socket-port-out');
  const parentCardId = clickedSocket.parentElement.id;

  // Phase 1: First Click - Select output source origin pin
  if (!selectedSourceSocket) {
    if (!isOutPort) return;
    
    selectedSourceSocket = clickedSocket;
    selectedSourceSocket.style.backgroundColor = "#22c55e"; // Turn green to confirm active lock status
    return;
  }

  // Swap targets if clicking a different block's output port
  if (isOutPort) {
    selectedSourceSocket.style.backgroundColor = "#4f46e5"; // Restore standard purple layout
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
    sourceSocket.style.backgroundColor = "#4f46e5"; // Reset output back to standard Purple
    targetSocket.style.backgroundColor = "#38bdf8"; // Reset input back to standard Light Blue
  }, 900); // 900ms matches the precise duration of 3 flashes

  // Phase 3: Draw the green curved wire connection path vector
  const svgCanvas = document.getElementById('nexus-wire-svg');
  if (!svgCanvas) return;

  const svgNS = "http://w3.org";
  const path = document.createElementNS(svgNS, "path");
  path.setAttribute("stroke", "#22c55e"); // Green trace wire links the cards together
  path.setAttribute("stroke-width", "3");
  path.setAttribute("fill", "none");
  svgCanvas.appendChild(path);

  // FIXED: Simple, absolute direct coordinate matching (Bypasses complex viewport/transform math entirely)
  const sourceCard = sourceSocket.parentElement;
  const ox = (parseInt(sourceCard.style.left) || 0) + 240; // Pin precisely to the right edge of Card 1
  const oy = (parseInt(sourceCard.style.top) || 0) + 18;

  const targetCard = targetSocket.parentElement;
  const finalX = parseInt(targetCard.style.left) || 0; // Pin precisely to the left edge of Card 2
  const finalY = (parseInt(targetCard.style.top) || 0) + 18;

  const controlOffset = Math.abs(finalX - ox) * 0.5;
  const dStr = `M ${ox} ${oy} C ${ox + controlOffset} ${oy}, ${finalX - controlOffset} ${finalY}, ${finalX} ${finalY}`;
  path.setAttribute("d", dStr);

  establishedWires.push({
    path: path,
    sourceId: sourceCard.id,
    targetId: targetCard.id
  });

  // Clear tracking variable reference for the next link building run
  selectedSourceSocket = null;
}

window.HallowNexusWires = {
  initWireCanvas,
  handleSocketClick,
  establishedWires
};
