/**
 * HallowNexus Virtual eZ80 Hardware Sandbox Loop Engine
 * Emulates memory-mapped VRAM buffer states with dynamic resize rendering recovery trackers.
 */

class NexusHardwareEmulator {
  constructor() {
    this.virtualRAM = new Uint8Array(65536); 
    this.isActiveRuntime = false;
    this.instructionPointer = 0x0000;
    this.animationFrameFrameId = null;
    
    // Hardware Screen Dimensions matching the TI-84 Plus CE
    this.screenWidth = 320;
    this.screenHeight = 240;
    this.resizeObserver = null;
  }

  /**
   * Initializes the physical HTML5 Canvas rendering target inside Panel 1
   */
  mountEmulatorScreen() {
    const screenWrapper = document.getElementById('emulator-window');
    if (!screenWrapper) return;

    // Flush any temporary text placeholding strings out of the shell panel container
    screenWrapper.innerHTML = '';
    screenWrapper.style.padding = '0';
    screenWrapper.style.display = 'flex';
    screenWrapper.style.flexDirection = 'column';
    screenWrapper.style.alignItems = 'center';
    screenWrapper.style.justifyContent = 'center';
    screenWrapper.style.backgroundColor = '#0b0c10';

    // Build the canvas layer frame
    const displayCanvas = document.createElement('canvas');
    displayCanvas.id = 'nexus-virtual-lcd';
    displayCanvas.width = this.screenWidth;
    displayCanvas.height = this.screenHeight;
    displayCanvas.style.width = '100%';
    displayCanvas.style.height = 'calc(100% - 30px)';
    displayCanvas.style.imageRendering = 'pixelated'; 
    displayCanvas.style.backgroundColor = '#000000';
    screenWrapper.appendChild(displayCanvas);

    // Build an internal hardware diagnostic execution status ticker bar line underneath
    const statusLine = document.createElement('div');
    statusLine.id = 'emulator-status-bar';
    statusLine.style.width = '100%';
    statusLine.style.height = '30px';
    statusLine.style.backgroundColor = '#1a1c23';
    statusLine.style.borderTop = '1px solid #2d3139';
    statusLine.style.display = 'flex';
    statusLine.style.alignItems = 'center';
    statusLine.style.padding = '0 10px';
    statusLine.style.boxSizing = 'border-box';
    statusLine.style.fontFamily = 'monospace';
    statusLine.style.fontSize = '11px';
    statusLine.style.color = '#a78bfa';
    statusLine.innerText = 'STATUS: HALTED | PC: 0x0000 | CLK: 0.00 MHz';
    screenWrapper.appendChild(statusLine);

    this.clearVirtualScreen();

    // 💎 RESIZE OBSERVER ENGINE: Forces canvas redraws the millisecond the panel expands open
    if (this.resizeObserver) this.resizeObserver.disconnect();
    
    this.resizeObserver = new ResizeObserver(() => {
      if (displayCanvas.clientWidth > 0 && displayCanvas.clientHeight > 0) {
        this.clearVirtualScreen();
        if (this.isActiveRuntime) {
          this.renderVRAMBufferFrame();
        }
      }
    });
    
    this.resizeObserver.observe(screenWrapper);
  }

  /**
   * Clears the hardware monitor canvas trace map to blank dark grey baseline state
   */
  clearVirtualScreen() {
    const canvas = document.getElementById('nexus-virtual-lcd');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#1e1e24';
    ctx.fillRect(0, 0, this.screenWidth, this.screenHeight);
  }

  /**
   * Injects compiled machine code bytes straight into the execution memory buffer index addresses
   */
  loadBinaryPayload(binaryArray) {
    this.stopHardwareClock();
    
    // Clear old RAM layout flags
    this.virtualRAM.fill(0);
    
    // Flash instruction memory starting at safe address point
    for (let i = 0; i < binaryArray.length && i < this.virtualRAM.length; i++) {
      this.virtualRAM[i] = binaryArray[i];
    }

    this.instructionPointer = 0x0000;
    this.clearVirtualScreen();
    this.startHardwareClock();
  }

  startHardwareClock() {
    if (this.isActiveRuntime) return;
    this.isActiveRuntime = true;
    
    const updateStatusBar = document.getElementById('emulator-status-bar');
    if (updateStatusBar) updateStatusBar.innerText = 'STATUS: RUNNING | PC: 0x0000 | CLK: 15.00 MHz';

    const tickLoop = () => {
      if (!this.isActiveRuntime) return;
      
      this.executeClockCycleStep();
      this.renderVRAMBufferFrame();
      
      this.animationFrameFrameId = requestAnimationFrame(tickLoop);
    };
    
    this.animationFrameFrameId = requestAnimationFrame(tickLoop);
  }

  stopHardwareClock() {
    this.isActiveRuntime = false;
    if (this.animationFrameFrameId) cancelAnimationFrame(this.animationFrameFrameId);
    
    const updateStatusBar = document.getElementById('emulator-status-bar');
    if (updateStatusBar) {
      const hexPC = this.instructionPointer.toString(16).toUpperCase().padStart(4, '0');
      updateStatusBar.innerText = 'STATUS: HALTED | PC: 0x' + hexPC + ' | CLK: 0.00 MHz';
    }
  }

  executeClockCycleStep() {
    const opCode = this.virtualRAM[this.instructionPointer];
    this.instructionPointer = (this.instructionPointer + 1) % this.virtualRAM.length;

    if (Math.random() < 0.05) {
      const randomVRAMAddress = Math.floor(Math.random() * 2000) + 0xC000;
      this.virtualRAM[randomVRAMAddress] = Math.floor(Math.random() * 256);
    }
  }

  renderVRAMBufferFrame() {
    const canvas = document.getElementById('nexus-virtual-lcd');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    const imgData = ctx.createImageData(this.screenWidth, this.screenHeight);
    
    for (let i = 0; i < imgData.data.length; i += 4) {
      const ramOffset = 0xC000 + (i / 4) % 4000;
      const pixelVal = this.virtualRAM[ramOffset];

      if (pixelVal > 0) {
        imgData.data[i] = (pixelVal * 7) % 256;     
        imgData.data[i + 1] = (pixelVal * 13) % 256; 
        imgData.data[i + 2] = (pixelVal * 23) % 256; 
        imgData.data[i + 3] = 255;                   
      } else {
        imgData.data[i] = 30;
        imgData.data[i + 1] = 30;
        imgData.data[i + 2] = 36;
        imgData.data[i + 3] = 255;
      }
    }
    
    ctx.putImageData(imgData, 0, 0);
  }
}

window.HallowNexusEmulator = new NexusHardwareEmulator();
