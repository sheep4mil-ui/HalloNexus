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

/**
 * Handles the click selection handshake sequence for wire connection ports
 * @param {HTMLElement} clickedSocket - The pin circle that was tapped
 */
function handleSocketClick(clickedSocket) {
  const isOutPort = clickedSocket.classList.contains('socket-port-out');
  const parentCardId = clickedSocket.parentElement.id;

  // STEP 1: First click must be an Output Port to establish the logic source
  if (!selectedSourceSocket) {
    if (!isOutPort) {
      // Clear or ignore if the developer clicks an input port first
      return;
    }
    
    // Lock in the source and visually highlight the pin to show it's active
    selectedSourceSocket = clickedSocket;
    selectedSourceSocket.style.border = "2px solid #22c55e"; // Glowing green selection outline
    return;
  }

  // STEP 2: Second click processing
  // CRITICAL RULE 1: Enforce Output-to-Input direction checks
  if (isOutPort) {
    // If they click a different block's output port, swap the active selection target instead
    selectedSourceSocket.style.border = "2px solid #0b0c10"; // Reset old highlight
    selectedSourceSocket = clickedSocket;
    selectedSourceSocket.style.border = "2px solid #22c55e";
    return;
  }

  // CRITICAL RULE 2: A block cannot connect to itself
  if (parentCardId === selectedSourceSocket.parentElement.id) {
    // Flash reset selection state safely to protect memory stack boundaries
    selectedSourceSocket.style.border = "2px solid #0b0c10";
    selectedSourceSocket = null;
    return;
  }

  // STEP 3: Draw and lock the verified link line channel
  const svgCanvas = document.getElementById('nexus-wire-svg');
  if (!svgCanvas) return;

  const svgNS = "http://w3.org";
  const path = document.createElementNS(svgNS, "path");
  path.setAttribute("stroke", "#22c55e"); // Green denotes a fully active, locked data route
  path.setAttribute("stroke-width", "3");
  path.setAttribute("fill", "none");
  svgCanvas.appendChild(path);

  // Calculate layout offset coordinates for the starting point card
  const sourceCard = selectedSourceSocket.parentElement;
  const sX = parseInt(sourceCard.style.left) || 0;
  const sY = parseInt(sourceCard.style.top) || 0;
  const ox = sX + 240;
  const oy = sY + 18;

  // Calculate layout offset coordinates for the targeted point card
  const targetCard = clickedSocket.parentElement;
  const tX = parseInt(targetCard.style.left) || 0;
  const tY = parseInt(targetCard.style.top) || 0;
  const finalX = tX;
  const finalY = tY + 18;

  // Format premium horizontal bezier math string
  const controlOffset = Math.abs(finalX - ox) * 0.5;
  const dStr = `M ${ox} ${oy} C ${ox + controlOffset} ${oy}, ${finalX - controlOffset} ${finalY}, ${finalX} ${finalY}`;
  path.setAttribute("d", dStr);

  // Push connection metadata records straight into compilation registers
  establishedWires.push({
    path: path,
    sourceId: sourceCard.id,
    targetId: targetCard.id
  });

  // Clear tracking references to reset connection loop for the next line build
  selectedSourceSocket.style.border = "2px solid #0b0c10";
  selectedSourceSocket = null;
}

window.HallowNexusWires = {
  initWireCanvas,
  handleSocketClick,
  establishedWires
};
