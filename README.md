# HalloNexus
An open-source visual node editor that compiles directly to hyper-performant eZ80 Assembly for the TI-84 Plus CE calculator line.
### Contributing to HallowNexus

Thank you for checking out HallowNexus! We are excited to open this project to the community to help expand what is possible with visual retro development on eZ80 hardware. 

# HallowNexus IDE

HallowNexus is an open-source visual node editor that compiles directly to pure eZ80 Assembly for the TI-84 Plus CE calculator. Born out of the optimization challenges faced during development of the indie game *Hallowire*, this studio replaces restrictive puzzle-block chains with an open dependency graph where every block operates as a connected logic node.

## Core Features

* **Universal Node Porting:** Every block features dedicated input and output pins supporting infinite branching connections. These compile down to zero-overhead hardware jumps (`call` and `jp`) without slowing down runtime loops.
* **Sub-Full Block Collisions:** Bypasses basic 16x16 grid limitations by implementing 4-byte micro-pixel boundary offsets (`Top`, `Bottom`, `Left`, `Right`) for fine-grained environmental hitboxes.
* **Low-Cost Lighting & Darkness Engines:** Uses 1-bit raster masking tables to handle moving torches, directional flashlight cones, and sweeping lighthouse beams at a locked 60 FPS—eliminating slow floating-point math.
* **Asynchronous Time and Pause Filters:** A hardware clock interrupt bus allows the engine to selectively freeze active physics and AI threads while keeping interface navigation, animation frames, and file saves running at top performance.
* **Multi-Game App Launcher:** A secure execution wrapper that encrypts separate sequel binaries to prevent standalone launcher errors, supporting a centralized `AppVar` file to share global variables and persistent progression data across games.
* **Local Ollama Pipeline Integration:** Connects seamlessly to a local AI assistant to trace broken wire paths, clean up logic deadlocks, and automatically generate pixel-matched edge/shoreline tiles directly inside the asset drawer.

## Desktop Panel Layout

* **Left Panel (Toolbox):** Expandable folders (`Sprites`, `Scene`, `Camera`, `Text & Screens`, `Triggers`, `Math`, `Companion Core`, `Launcher`) housing flat, plain-English logic blocks.
* **Center Canvas:** A multi-tab development matrix that supports standard top-to-bottom block nesting alongside free-floating wired nodes. Right-clicking or hold-clicking any block pulls out a clean parameter drawer from the side margin to modify settings without cluttering the screen.
* **Right Panel (Debugger & AI Desk):** Integrates the local Ollama terminal directly above a live hardware monitor tracking active CPU usage, RAM allocations, and memory maps. A master toggle switch pushes the playtest emulator window into primary focus on the far left edge of the desktop window when needed.

## Contributing

Because HallowNexus relies on a modular JSON extension pattern, you do not need to modify the Electron UI codebase to create new game features. To contribute new movement loops, AI behaviors, or combat routines, check out our formatting examples inside the `/extensions` directory and open a Pull Request.
