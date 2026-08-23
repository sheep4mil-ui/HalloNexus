const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

/**
 * HallowNexus Visual-to-Assembly Compiler Core
 * Traces visual wire graphs and transpiles them into compiled eZ80 binaries.
 */
class HallowNexusCompiler {
  constructor(projectDirectory) {
    this.projectDir = projectDirectory;
    this.outputAsmString = '';
  }

  /**
   * Translates a sequential array of connected visual node objects into a flat assembly string
   * @param {Array} connectedNodes - Ordered array of wire-linked block instances
   * @returns {string} Fully parsed eZ80 Assembly text
   */
  transpileGraph(connectedNodes) {
    // Inject core hardware header scaffolding for the TI-84 Plus CE
    let asmOutput = [
      '; ==============================================',
      '; HallowNexus Automated eZ80 Compilation Output',
      '; ==============================================',
      '#include "include/ti84pce.inc"',
      '.assume adl=1',
      '.org $D031F6',
      '    call _InitializeSystemDefaults',
      '    jp _MainGameLoop',
      ''
    ];

    // Process every connected card block in the graph wire chain
    connectedNodes.forEach(node => {
      asmOutput.push(`; --- Block Node: ${node.blockName} ---`);
      
      let blockTemplate = node.ez80AssemblyTemplate;
      
      // Look up and substitute custom side-drawer parameters directly into assembly lines
      if (node.values) {
        Object.keys(node.values).forEach(fieldKey => {
          const replacementTarget = `{${fieldKey}}`;
          blockTemplate = blockTemplate.split(replacementTarget).join(node.values[fieldKey]);
        });
      }
      
      asmOutput.push(blockTemplate);
      asmOutput.push(''); // Clean trailing spacing separator
    });

    // Append automated game loop closure instructions
    asmOutput.push('_MainGameLoop:');
    asmOutput.push('    call _UpdateSystemFrameBuffers');
    asmOutput.push('    jp _MainGameLoop');

    this.outputAsmString = asmOutput.join('\n');
    return this.outputAsmString;
  }

  /**
   * Writes assembly text to disk and spawns the SPASM-ng assembler to generate the final .8xp binary
   * @param {string} fileName - Destination title (e.g., "GAME")
   * @returns {Promise} Resolves on successful compilation handshake
   */
  compileToBinary(fileName = 'HALLOW') {
    return new Promise((resolve, reject) => {
      const sourceAsmPath = path.join(this.projectDir, 'build.asm');
      const outputBinaryPath = path.join(this.projectDir, `${fileName}.8xp`);
      
      // Save transpiled text directly to our background build scratchpad
      fs.writeFileSync(sourceAsmPath, this.outputAsmString, 'utf8');

      // Configure terminal execution command targeting our embedded SPASM compiler binary
      const spasmExecutable = process.platform === 'win32' ? 'spasm.exe' : './spasm';
      const compilerCommand = `${spasmExecutable} "${sourceAsmPath}" "${outputBinaryPath}"`;

      exec(compilerCommand, { cwd: path.join(__dirname, 'core-compiler', 'spasm-bin') }, (error, stdout, stderr) => {
        if (error) {
          reject(`Assembler Crash: ${stderr || error.message}`);
          return;
        }
        resolve({
          success: true,
          binaryPath: outputBinaryPath,
          logOutput: stdout
        });
      });
    });
  }
}

module.exports = HallowNexusCompiler;
