let activeDrawingWire = null;
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

function startWireDrag(originSocket) {
  const svgCanvas = document.getElementById('nexus-wire-svg');
  if (!svgCanvas) return;

  const svgNS = "http://w3.org";
  const path = document.createElementNS(svgNS, "path");
  path.setAttribute("stroke", "#4f46e5"); 
  path.setAttribute("stroke-width", "3");
  path.setAttribute("fill", "none");
  path.setAttribute("stroke-dasharray", "5,5");
  svgCanvas.appendChild(path);

  // FIX: Track the relative card offset layout instead of client bounds
  const nodeCard = originSocket.parentElement;
  const cardX = parseInt(nodeCard.style.left) || 0;
  const cardY = parseInt(nodeCard.style.top) || 0;

  // Pin coordinates to the socket's exact placement on the card frame
  const isOutSocket = originSocket.classList.contains('socket-port-out');
  const ox = cardX + (isOutSocket ? 240 : 0);
  const oy = cardY + 18; 

  activeDrawingWire = {
    pathElement: path,
    originX: ox,
    originY: oy,
    sourceNodeId: nodeCard.id
  };
}

function updateWireDrag(e) {
  if (!activeDrawingWire) return;

  const canvasGridLayer = document.getElementById('canvas-grid-layer');
  const viewportRect = document.getElementById('canvas-viewport').getBoundingClientRect();

  // FIX: Extract grid transforms to align wires directly with mouse cursor placements
  const style = window.getComputedStyle(canvasGridLayer);
  const matrix = new WebKitCSSMatrix(style.transform);
  
  const mouseX = e.clientX - viewportRect.left - matrix.m41;
  const mouseY = e.clientY - viewportRect.top - matrix.m42;

  const ox = activeDrawingWire.originX;
  const oy = activeDrawingWire.originY;
  const controlOffset = Math.abs(mouseX - ox) * 0.5;
  const dStr = `M ${ox} ${oy} C ${ox + controlOffset} ${oy}, ${mouseX - controlOffset} ${mouseY}, ${mouseX} ${mouseY}`;

  activeDrawingWire.pathElement.setAttribute("d", dStr);
}

function dropWire(targetSocket) {
  if (!activeDrawingWire) return;

  if (targetSocket && targetSocket.parentElement.id !== activeDrawingWire.sourceNodeId) {
    activeDrawingWire.pathElement.setAttribute("stroke", "#22c55e"); 
    activeDrawingWire.pathElement.removeAttribute("stroke-dasharray");

    // Correct line anchor coordinates permanently on link completion
    const targetCard = targetSocket.parentElement;
    const tcX = parseInt(targetCard.style.left) || 0;
    const tcY = parseInt(targetCard.style.top) || 0;
    const isInSocket = targetSocket.classList.contains('socket-port-in');
    
    const finalX = tcX + (isInSocket ? 0 : 240);
    const finalY = tcY + 18;

    const ox = activeDrawingWire.originX;
    const oy = activeDrawingWire.originY;
    const controlOffset = Math.abs(finalX - ox) * 0.5;
    const dStr = `M ${ox} ${oy} C ${ox + controlOffset} ${oy}, ${finalX - controlOffset} ${finalY}, ${finalX} ${finalY}`;
    activeDrawingWire.pathElement.setAttribute("d", dStr);

    establishedWires.push({
      path: activeDrawingWire.pathElement,
      sourceId: activeDrawingWire.sourceNodeId,
      targetId: targetSocket.parentElement.id
    });
  } else {
    activeDrawingWire.pathElement.remove();
  }
  activeDrawingWire = null;
}

window.HallowNexusWires = {
  initWireCanvas,
  startWireDrag,
  updateWireDrag,
  dropWire,
  establishedWires
};
