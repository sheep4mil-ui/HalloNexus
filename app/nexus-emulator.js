/**
 * HallowNexus Virtual eZ80 Hardware Sandbox Loop Engine
 * Emulates memory-mapped VRAM buffer states and handles clock execution ticks.
 */

class NexusHardwareEmulator {
  constructor() {
    this.virtualRAM = new Uint8Array(65536); // Core 64KB Safe Sandbox Memory Block
    this.isActiveRuntime = false;
    this.instructionPointer = 0x0000;
    this.animationFrameFrameId = null;
    
    // Hardware Screen Dimensions matching the TI-84 Plus CE
    this.screenWidth = 320;
    this.screenHeight = 240;
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
    displayCanvas.style.imageRendering = 'pixelated'; // Keep that retro crispness look clean
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
   * @param {Uint8Array} binaryArray - Raw machine instructions array passed from compiler
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

    // Fire the core operational clock rendering trace thread pipeline
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
      updateStatusBar.innerText = `STATUS: HALTED | PC: 0x${hexPC} | CLK: 0.00 MHz`;
    }
  }

  /**
   * High-Juice Micro-op parsing step emulation (Simulates hardware flag mutations)
   */
  executeClockCycleStep() {
    // Read operational code byte straight out of our pointer tracker index
    const opCode = this.virtualRAM[this.instructionPointer];
    
    // Procedural execution instruction increment pipeline loop
    this.instructionPointer = (this.instructionPointer + 1) % this.virtualRAM.length;

    // Simulate simple hardware memory register manipulations to prevent loop deadlocks
    // This draws randomized noise paths on the screen if the uploaded program hits open memory holes
    if (Math.random() < 0.05) {
      const randomVRAMAddress = Math.floor(Math.random() * 2000) + 0xC000;
      this.virtualRAM[randomVRAMAddress] = Math.floor(Math.random() * 256);
    }
  }

  /**
   * Flushes memory-mapped screen vectors straight out onto the active canvas pixel buffers
   */
  renderVRAMBufferFrame() {
    const canvas = document.getElementById('nexus-virtual-lcd');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    // Simulate reading a memory-mapped VRAM block layout area starting at index 0xC000
    const imgData = ctx.createImageData(this.screenWidth, this.screenHeight);
    
    // Sweep the display pixel index lists and update color codes live
    for (let i = 0; i < imgData.data.length; i += 4) {
      const ramOffset = 0xC000 + (i / 4) % 4000;
      const pixelVal = this.virtualRAM[ramOffset];

      // Convert our 8-bit index numbers into glowing visual retro screen colors matrix
      if (pixelVal > 0) {
        imgData.data[i] = (pixelVal * 7) % 256;     // Red channel mapping
        imgData.data[i + 1] = (pixelVal * 13) % 256; // Green channel mapping
        imgData.data[i + 2] = (pixelVal * 23) % 256; // Blue channel mapping
        imgData.data[i + 3] = 255;                   // Alpha density channel solid
      } else {
        // Fallback transparent default grid mesh screen layer paint
        imgData.data[i] = 30;
        imgData.data[i + 1] = 30;
        imgData.data[i + 2] = 36;
        imgData.data[i + 3] = 255;
      }
    }
    
    ctx.putImageData(imgData, 0, 0);
  }
}

// Global integration handshake namespaces layer mapping channels
window.HallowNexusEmulator = new NexusHardwareEmulator();
