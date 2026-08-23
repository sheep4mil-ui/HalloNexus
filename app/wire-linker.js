let selectedSourceSocket = null;
const establishedWires = [];

function initWireCanvas() {
  const canvasGrid = document.getElementById('canvas-grid-layer');
  if (!canvasGrid || document.getElementById('nexus-wire-svg')) return;

  const svgNS = "http://w3.org";
  const svgCanvas = document.createElementNS(svgNS, "svg");
  svgCanvas.setAttribute("id", "nexus-wire-svg");
  svgCanvas.style.position = "absolute";
  svgCanvas.style.top = "0";
  svgCanvas.style.left = "0";
  svgCanvas.style.width = "5000px"; 
  svgCanvas.style.height = "5000px";
  svgCanvas.style.pointerEvents = "none"; 
  svgCanvas.style.zIndex = "1"; 

  canvasGrid.appendChild(svgCanvas);
}

function handleSocketClick(clickedSocket) {
  const isOutPort = clickedSocket.classList.contains('socket-port-out');
  const parentCardId = clickedSocket.parentElement.id;

  // First Click: Must target an output port to start selection handshake
  if (!selectedSourceSocket) {
    if (!isOutPort) return;
    
    selectedSourceSocket = clickedSocket;
    selectedSourceSocket.style.backgroundColor = "#22c55e"; // Turn green to confirm active lock status
    return;
  }

  // Second Click processing
  if (isOutPort) {
    // If they hit a different output port, swap our source focus target safely
    selectedSourceSocket.style.backgroundColor = "#4f46e5"; // Restore standard indigo palette
    selectedSourceSocket = clickedSocket;
    selectedSourceSocket.style.backgroundColor = "#22c55e";
    return;
  }

  // Self-linking protection boundaries filter
  if (parentCardId === selectedSourceSocket.parentElement.id) {
    selectedSourceSocket.style.backgroundColor = "#4f46e5";
    selectedSourceSocket = null;
    return;
  }

  // Build out vector path rendering graphics elements
  const svgCanvas = document.getElementById('nexus-wire-svg');
  if (!svgCanvas) return;

  const svgNS = "http://w3.org";
  const path = document.createElementNS(svgNS, "path");
  path.setAttribute("stroke", "#22c55e"); 
  path.setAttribute("stroke-width", "3");
  path.setAttribute("fill", "none");
  svgCanvas.appendChild(path);

  const sourceCard = selectedSourceSocket.parentElement;
  const sX = parseInt(sourceCard.style.left) || 0;
  const sY = parseInt(sourceCard.style.top) || 0;
  const ox = sX + 240;
  const oy = sY + 18;

  const targetCard = clickedSocket.parentElement;
  const tX = parseInt(targetCard.style.left) || 0;
  const tY = parseInt(targetCard.style.top) || 0;
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

  // Restore output button color and reset state tracker variable
  selectedSourceSocket.style.backgroundColor = "#4f46e5";
  selectedSourceSocket = null;
}

window.HallowNexusWires = {
  initWireCanvas,
  handleSocketClick,
  establishedWires
};
