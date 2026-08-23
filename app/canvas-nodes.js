/**
 * HallowNexus Visual Wire Linker Engine
 * Handles dragging and rendering vector connection paths between node cards.
 */

let activeDrawingWire = null;
const establishedWires = [];

// Initialize an absolute vector canvas to handle our lines overlay
function initWireCanvas() {
  const canvasViewport = document.getElementById('canvas-viewport');
  const canvasGrid = document.getElementById('canvas-grid-layer');

  // Check if SVG overlay already exists to prevent duplicate generation
  if (document.getElementById('nexus-wire-svg')) return;

  const svgNS = "http://w3.org";
  const svgCanvas = document.createElementNS(svgNS, "svg");
  svgCanvas.setAttribute("id", "nexus-wire-svg");
  svgCanvas.style.position = "absolute";
  svgCanvas.style.top = "0";
  svgCanvas.style.left = "0";
  svgCanvas.style.width = "5000px";  // Stretch perfectly over our deep canvas grid
  svgCanvas.style.height = "5000px";
  svgCanvas.style.pointerEvents = "none"; // Let clicks pass straight through to cards
  svgCanvas.style.zIndex = "15"; // Sandwiched perfectly beneath header text layers

  canvasGrid.appendChild(svgCanvas);
}

/**
 * Commences drawing an interactive execution line straight out of a socket node
 * @param {HTMLElement} originSocket - Source circular button node
 */
function startWireDrag(originSocket) {
  const svgCanvas = document.getElementById('nexus-wire-svg');
  if (!svgCanvas) return;

  const svgNS = "http://w3.org";
  const path = document.createElementNS(svgNS, "path");
  
  path.setAttribute("stroke", "#4f46e5"); // Signature deep indigo trace light
  path.setAttribute("stroke-width", "3");
  path.setAttribute("fill", "none");
  path.setAttribute("stroke-dasharray", "5,5"); // Dash lines denote active drafting state
  
  svgCanvas.appendChild(path);

  const rect = originSocket.getBoundingClientRect();
  const parentRect = document.getElementById('canvas-grid-layer').getBoundingClientRect();

  activeDrawingWire = {
    pathElement: path,
    originX: rect.left + rect.width / 2 - parentRect.left,
    originY: rect.top + rect.height / 2 - parentRect.top,
    sourceNodeId: originSocket.parentElement.id
  };
}

/**
 * Continuously draws a curved bezier line following the mouse cursor across the grid
 * @param {MouseEvent} e 
 */
function updateWireDrag(e) {
  if (!activeDrawingWire) return;

  const parentRect = document.getElementById('canvas-grid-layer').getBoundingClientRect();
  const mouseX = e.clientX - parentRect.left;
  const mouseY = e.clientY - parentRect.top;

  const ox = activeDrawingWire.originX;
  const oy = activeDrawingWire.originY;

  // Compute horizontal curvature tension for premium visual flow
  const controlOffset = Math.abs(mouseX - ox) * 0.5;
  const dStr = `M ${ox} ${oy} C ${ox + controlOffset} ${oy}, ${mouseX - controlOffset} ${mouseY}, ${mouseX} ${mouseY}`;

  activeDrawingWire.pathElement.setAttribute("d", dStr);
}

/**
 * Finalizes wire connections or destroys fragments if dropped into open space
 * @param {HTMLElement} targetSocket - Target circle node socket intersected on drop
 */
function dropWire(targetSocket) {
  if (!activeDrawingWire) return;

  if (targetSocket && targetSocket.parentElement.id !== activeDrawingWire.sourceNodeId) {
    // Solidify tracing lines on successful logic linkage handshake
    activeDrawingWire.pathElement.setAttribute("stroke", "#22c55e"); // Green denotes active live connection
    activeDrawingWire.pathElement.removeAttribute("stroke-dasharray");

    establishedWires.push({
      path: activeDrawingWire.pathElement,
      sourceId: activeDrawingWire.sourceNodeId,
      targetId: targetSocket.parentElement.id
    });
  } else {
    // Trash dangling wires if drop fails
    activeDrawingWire.pathElement.remove();
  }

  activeDrawingWire = null;
}

// Global exposure layer for UI orchestration integration
window.HallowNexusWires = {
  initWireCanvas,
  startWireDrag,
  updateWireDrag,
  dropWire,
  establishedWires
};
