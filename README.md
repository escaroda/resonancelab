# Resonance Lab

**Resonance Lab** is an interactive, real-time Chladni Plate Simulator that visualizes acoustic resonance patterns. By simulating the physics of sand particles on a vibrating plate, it creates mesmerizing, complex geometric patterns known as Chladni figures.

This project was vibe coded in March 2026 using Gemini 3.1 Pro Preview.

## Features

*   **Real-time Physics Simulation:** Accurately models the behavior of particles on a vibrating surface.
*   **Interactive Controls:** Adjust frequency, amplitude, and kick strength in real-time.
*   **Visual Effects:** Features like "Velocity Glow" and "Motion Blur" for stunning visual feedback.
*   **Audio Synthesis:** Generates synchronized audio tones based on the current frequency.
*   **Shareable States:** Settings are encoded in the URL, allowing you to easily share specific patterns with others.
*   **Keyboard Shortcuts:** Quick access to essential controls for a seamless experience.

## Keyboard Shortcuts

*   `A` - Activate/Deactivate system
*   `Spacebar` - Trigger a manual kick
*   `P` - Play/Pause automatic kick tempo
*   `M` - Mute/Unmute sound
*   `+` / `=` - Increase frequency
*   `-` / `_` - Decrease frequency
*   `H` - Hide/Show control panel

## How it Works

The simulation calculates the displacement of a 2D plate at a given frequency and amplitude. Particles (representing sand) are then moved according to the gradient of this displacement, causing them to collect at the nodal lines (areas of zero vibration).

## Development

This project is built using React, TypeScript, and the HTML5 Canvas API for high-performance rendering.

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Credits

Created by [@escaroda](https://github.com/escaroda) / [@callsomeoneyoulove](https://www.instagram.com/callsomeoneyoulove/).
