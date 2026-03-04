import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Power, RefreshCw, Volume2, VolumeX, Maximize, ChevronRight, ChevronLeft, Activity, Play, Square as SquareIcon, Github, Instagram } from 'lucide-react';

const resonances = [
  { f: 1, n: 1, m: 1 },
  { f: 50, n: 1, m: 1.5 },
  { f: 100, n: 1, m: 2 },
  { f: 200, n: 1, m: 3 },
  { f: 350, n: 2, m: 3 },
  { f: 500, n: 1, m: 4 },
  { f: 700, n: 2, m: 4 },
  { f: 900, n: 3, m: 4 },
  { f: 1100, n: 1, m: 5 },
  { f: 1300, n: 2, m: 5 },
  { f: 1500, n: 3, m: 5 },
  { f: 1700, n: 4, m: 5 },
  { f: 2000, n: 1, m: 6 },
  { f: 2300, n: 2, m: 6 },
  { f: 2600, n: 3, m: 6 },
  { f: 3000, n: 4, m: 6 },
  { f: 3300, n: 1, m: 7 },
  { f: 3600, n: 2, m: 7 },
  { f: 4000, n: 3, m: 7 },
  { f: 4500, n: 4, m: 7 },
  { f: 5000, n: 1, m: 8 },
  { f: 6000, n: 2, m: 8 },
  { f: 7000, n: 3, m: 8 },
  { f: 8000, n: 4, m: 8 },
  { f: 9000, n: 5, m: 8 },
  { f: 10000, n: 1, m: 9 },
  { f: 12000, n: 3, m: 9 },
  { f: 14000, n: 5, m: 9 },
  { f: 16000, n: 2, m: 10 },
  { f: 18000, n: 4, m: 10 },
  { f: 20000, n: 6, m: 10 },
];

const SHAPES = ['window', 'square', 'circle'];

const getInitialState = () => {
  const hash = window.location.hash.slice(1);
  if (hash) {
    try {
      return JSON.parse(atob(hash));
    } catch (e) {
      return {};
    }
  }
  return {};
};

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const initialState = useRef(getInitialState()).current;
  
  const [isOn, setIsOn] = useState(false);
  const [frequency, setFrequency] = useState(initialState.f ?? 350);
  const [maxFrequency, setMaxFrequency] = useState(4000);
  const [isLogarithmic, setIsLogarithmic] = useState(true);
  const [amplitude, setAmplitude] = useState(initialState.a ?? 0.5);
  
  const [kickStrength, setKickStrength] = useState(initialState.ks ?? 0.8);
  const [kickTempo, setKickTempo] = useState(initialState.kt ?? 120);
  const [isKickPlaying, setIsKickPlaying] = useState(false);
  
  const [soundEnabled, setSoundEnabled] = useState(initialState.se !== undefined ? !!initialState.se : true);
  
  const [resolution, setResolution] = useState(initialState.r ?? 600);
  const [darkMode, setDarkMode] = useState(initialState.dm !== undefined ? !!initialState.dm : false);
  const [plateColor, setPlateColor] = useState(initialState.pc ?? '#f5f5f4');
  const [sandColor, setSandColor] = useState(initialState.sc ?? '#0a0a0a');
  
  const [glowEffect, setGlowEffect] = useState(initialState.ge !== undefined ? !!initialState.ge : true);
  const [glowColor, setGlowColor] = useState(initialState.gc ?? '#f59e0b');
  const [motionBlur, setMotionBlur] = useState(initialState.mb !== undefined ? !!initialState.mb : false);
  
  const [plateShape, setPlateShape] = useState(initialState.ps ?? 'window');
  
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isPanelMinimized, setIsPanelMinimized] = useState(false);
  const [isPanelHidden, setIsPanelHidden] = useState(false);

  useEffect(() => {
    const stateToSync = {
      f: frequency,
      a: amplitude,
      ks: kickStrength,
      kt: kickTempo,
      se: soundEnabled ? 1 : 0,
      r: resolution,
      dm: darkMode ? 1 : 0,
      pc: plateColor,
      sc: sandColor,
      ge: glowEffect ? 1 : 0,
      gc: glowColor,
      mb: motionBlur ? 1 : 0,
      ps: plateShape,
    };
    const hash = btoa(JSON.stringify(stateToSync));
    window.history.replaceState(null, '', '#' + hash);
  }, [frequency, amplitude, kickStrength, kickTempo, soundEnabled, resolution, darkMode, plateColor, sandColor, glowEffect, glowColor, motionBlur, plateShape]);

  const simState = useRef({
    frequency: initialState.f ?? 350,
    amplitude: initialState.a ?? 0.5,
    kickValue: 0,
    kickStrength: initialState.ks ?? 0.8,
    kickTempo: initialState.kt ?? 120,
    isKickPlaying: false,
    nextKickTime: 0,
    isOn: false,
    soundEnabled: initialState.se !== undefined ? !!initialState.se : true,
    scatter: false,
    particles: null as Float32Array | null,
    velocities: null as Float32Array | null,
    audioCtx: null as AudioContext | null,
    oscillators: null as { osc: OscillatorNode; gain: GainNode }[] | null,
    continuousGain: null as GainNode | null,
    masterOutput: null as GainNode | null,
    resolution: initialState.r ?? 600,
    plateColor: initialState.pc ?? '#f5f5f4',
    sandColor: initialState.sc ?? '#0a0a0a',
    glowEffect: initialState.ge !== undefined ? !!initialState.ge : true,
    glowColor: initialState.gc ?? '#f59e0b',
    motionBlur: initialState.mb !== undefined ? !!initialState.mb : false,
    offscreenCanvas: null as HTMLCanvasElement | null,
    offscreenCtx: null as CanvasRenderingContext2D | null,
    plateShape: initialState.ps ?? 'window',
    canvasWidth: 0,
    canvasHeight: 0,
  });

  useEffect(() => {
    simState.current = {
      ...simState.current,
      frequency, amplitude, kickStrength, kickTempo, isKickPlaying, isOn, soundEnabled, resolution, plateColor, sandColor, glowEffect, glowColor, plateShape, motionBlur
    };
  }, [frequency, amplitude, kickStrength, kickTempo, isKickPlaying, isOn, soundEnabled, resolution, plateColor, sandColor, glowEffect, glowColor, plateShape, motionBlur]);

  useEffect(() => {
    simState.current.scatter = true;
  }, [plateShape]);

  const setupAudio = useCallback(() => {
    if (simState.current.audioCtx) return;
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const masterOutput = ctx.createGain();
    masterOutput.connect(ctx.destination);
    masterOutput.gain.value = 1;

    const continuousGain = ctx.createGain();
    continuousGain.connect(masterOutput);
    continuousGain.gain.value = 0;

    const createOsc = (mult: number, gainVal: number, detune = 0) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      const gain = ctx.createGain();
      gain.gain.value = gainVal;
      osc.detune.value = detune;
      osc.connect(gain);
      gain.connect(continuousGain);
      osc.start();
      return { osc, gain };
    };

    const oscs = [
      createOsc(1, 0.4),
      createOsc(2, 0.15, 2),
      createOsc(3, 0.08, -2),
      createOsc(4, 0.04, 1),
    ];

    simState.current.audioCtx = ctx;
    simState.current.oscillators = oscs;
    simState.current.continuousGain = continuousGain;
    simState.current.masterOutput = masterOutput;
  }, []);

  const togglePower = useCallback(() => {
    if (!simState.current.audioCtx) {
      setupAudio();
    } else if (simState.current.audioCtx.state === 'suspended') {
      simState.current.audioCtx.resume();
    }
    setIsOn(prev => !prev);
  }, [setupAudio]);

  const handleManualKick = useCallback(() => {
    simState.current.kickValue = kickStrength;
    if (!simState.current.audioCtx) setupAudio();
    const ctx = simState.current.audioCtx;
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume();

    if (soundEnabled) {
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(simState.current.masterOutput!);
      
      osc.frequency.setValueAtTime(150, t);
      osc.frequency.exponentialRampToValueAtTime(0.01, t + 0.5);
      
      gain.gain.setValueAtTime(kickStrength, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.5);
      
      osc.start(t);
      osc.stop(t + 0.5);
    }
  }, [kickStrength, soundEnabled, setupAudio]);

  const toggleAutoKick = useCallback(() => {
    if (!simState.current.audioCtx) setupAudio();
    if (simState.current.audioCtx?.state === 'suspended') simState.current.audioCtx.resume();
    
    if (!isKickPlaying && simState.current.audioCtx) {
      simState.current.nextKickTime = simState.current.audioCtx.currentTime;
    }
    setIsKickPlaying(prev => !prev);
  }, [isKickPlaying, setupAudio]);

  const toggleFullScreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`);
      });
      setIsFullScreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
      setIsFullScreen(false);
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.target instanceof HTMLInputElement && ['text', 'number', 'password', 'email', 'search'].includes(e.target.type)) ||
        e.target instanceof HTMLTextAreaElement
      ) return;

      switch (e.key.toLowerCase()) {
        case 'h':
          setIsPanelHidden(prev => !prev);
          break;
        case ' ':
          e.preventDefault();
          handleManualKick();
          break;
        case 'p':
          toggleAutoKick();
          break;
        case 'm':
          setSoundEnabled(prev => !prev);
          break;
        case 'a':
          togglePower();
          break;
        case '+':
        case '=':
          e.preventDefault();
          setFrequency(prev => Math.min(prev + (e.shiftKey ? 5 : 1), maxFrequency));
          break;
        case '-':
        case '_':
          e.preventDefault();
          setFrequency(prev => Math.max(prev - (e.shiftKey ? 5 : 1), 1));
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleManualKick, toggleAutoKick, togglePower, maxFrequency]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const invertHex = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return hex;
    const r = 255 - parseInt(result[1], 16);
    const g = 255 - parseInt(result[2], 16);
    const b = 255 - parseInt(result[3], 16);
    return `#${(1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1)}`;
  };

  const handleThemeToggle = (isDark: boolean) => {
    setDarkMode(isDark);
    setPlateColor(invertHex(plateColor));
    setSandColor(invertHex(sandColor));
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const maxParticles = 250000;
    if (!simState.current.particles) {
      simState.current.particles = new Float32Array(maxParticles * 2);
      simState.current.velocities = new Float32Array(maxParticles * 2);
      for (let i = 0; i < maxParticles * 2; i++) {
        simState.current.particles[i] = (Math.random() - 0.5) * 2;
      }
    }

    let animationFrameId: number;

    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : { r: 0, g: 0, b: 0 };
    };

    const loop = () => {
      animationFrameId = requestAnimationFrame(loop);

      const state = simState.current;
      const { particles, velocities, frequency, amplitude, isOn, resolution, plateColor, sandColor, plateShape, glowEffect, glowColor, motionBlur } = state;
      if (!particles || !velocities) return;

      const rect = container.getBoundingClientRect();
      const width = Math.floor(rect.width);
      const height = Math.floor(rect.height);
      
      if (width <= 0 || height <= 0) return;

      const aspect = width / height;
      
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        state.canvasWidth = width;
        state.canvasHeight = height;
        state.scatter = true;
        
        if (!state.offscreenCanvas) {
          state.offscreenCanvas = document.createElement('canvas');
          state.offscreenCtx = state.offscreenCanvas.getContext('2d', { alpha: true });
        }
        state.offscreenCanvas.width = width;
        state.offscreenCanvas.height = height;
      }

      const imgData = (motionBlur && state.offscreenCtx) 
        ? state.offscreenCtx.createImageData(width, height)
        : ctx.createImageData(width, height);
        
      const data32 = new Uint32Array(imgData.data.buffer);

      const bgRgb = hexToRgb(plateColor);
      
      if (!motionBlur) {
        const bgPixel = (255 << 24) | (bgRgb.b << 16) | (bgRgb.g << 8) | bgRgb.r;
        data32.fill(bgPixel);
      } else {
        ctx.fillStyle = `rgba(${bgRgb.r}, ${bgRgb.g}, ${bgRgb.b}, 0.15)`;
        ctx.fillRect(0, 0, width, height);
      }

      let currentNumParticles = resolution <= 600 ? 80000 : resolution <= 1000 ? 150000 : 250000;

      if (state.scatter) {
        for (let i = 0; i < currentNumParticles * 2; i++) {
          particles[i*2] = (Math.random() - 0.5) * 2 * (plateShape === 'window' ? aspect : 1);
          particles[i*2+1] = (Math.random() - 0.5) * 2;
          velocities[i*2] = (Math.random() - 0.5) * 0.1;
          velocities[i*2+1] = (Math.random() - 0.5) * 0.1;
        }
        state.scatter = false;
      }

      const noiseStrength = 0.08;
      const gradientStrength = 0.015;
      const friction = 0.85;

      const sandRgb = hexToRgb(sandColor);
      const glowRgb = hexToRgb(glowColor);

      const lut = new Uint32Array(256);
      for (let i = 0; i < 256; i++) {
        const t = i / 255;
        const easeT = 1 - Math.pow(1 - t, 3);
        const r = Math.floor(sandRgb.r * (1 - easeT) + glowRgb.r * easeT);
        const g = Math.floor(sandRgb.g * (1 - easeT) + glowRgb.g * easeT);
        const b = Math.floor(sandRgb.b * (1 - easeT) + glowRgb.b * easeT);
        lut[i] = (255 << 24) | (b << 16) | (g << 8) | r;
      }
      const defaultParticleColor = lut[0];

      let n = 1, m = 1;
      for (let i = 0; i < resonances.length - 1; i++) {
        if (frequency >= resonances[i].f && frequency <= resonances[i + 1].f) {
          let t = (frequency - resonances[i].f) / (resonances[i + 1].f - resonances[i].f);
          t = t * t * (3 - 2 * t);
          n = resonances[i].n * (1 - t) + resonances[i + 1].n * t;
          m = resonances[i].m * (1 - t) + resonances[i + 1].m * t;
          break;
        }
      }

      const activeAmplitude = isOn ? amplitude : 0;
      
      if (state.isKickPlaying && state.audioCtx) {
        const t = state.audioCtx.currentTime;
        if (t >= state.nextKickTime) {
          state.kickValue = state.kickStrength;
          
          if (state.soundEnabled && state.masterOutput) {
            const osc = state.audioCtx.createOscillator();
            const gain = state.audioCtx.createGain();
            osc.connect(gain);
            gain.connect(state.masterOutput);
            
            osc.frequency.setValueAtTime(150, t);
            osc.frequency.exponentialRampToValueAtTime(0.01, t + 0.5);
            
            gain.gain.setValueAtTime(state.kickStrength, t);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 0.5);
            
            osc.start(t);
            osc.stop(t + 0.5);
          }
          
          state.nextKickTime = t + (60 / state.kickTempo);
        }
      }

      const currentKick = state.kickValue;
      if (state.kickValue > 0) {
        state.kickValue *= 0.9;
        if (state.kickValue < 0.001) state.kickValue = 0;
      }

      for (let i = 0; i < currentNumParticles; i++) {
        let px = i * 2;
        let py = i * 2 + 1;
        let x = particles[px];
        let y = particles[py];

        velocities[px] += (Math.random() - 0.5) * 0.003;
        velocities[py] += (Math.random() - 0.5) * 0.003;

        if (currentKick > 0) {
          velocities[px] += (Math.random() - 0.5) * currentKick * 0.15;
          velocities[py] += (Math.random() - 0.5) * currentKick * 0.15;
        }

        if (activeAmplitude > 0) {
          let cx_n = Math.cos(n * Math.PI * x);
          let cy_m = Math.cos(m * Math.PI * y);
          let cx_m = Math.cos(m * Math.PI * x);
          let cy_n = Math.cos(n * Math.PI * y);
          
          let Z = 0, dx = 0, dy = 0;
          
          if (plateShape === 'circle') {
            let r = Math.sqrt(x*x + y*y);
            let theta = Math.atan2(y, x);
            let k = (n + m) * 1.5;
            Z = Math.cos(k * r) * Math.cos(m * theta);
            if (r > 0.001) {
              dx = -k * Math.sin(k * r) * Math.cos(m * theta) * (x/r) - Math.cos(k * r) * m * Math.sin(m * theta) * (-y/(r*r));
              dy = -k * Math.sin(k * r) * Math.cos(m * theta) * (y/r) - Math.cos(k * r) * m * Math.sin(m * theta) * (x/(r*r));
            }
          } else {
            Z = cx_n * cy_m - cx_m * cy_n;
            dx = -n * Math.PI * Math.sin(n * Math.PI * x) * cy_m + m * Math.PI * Math.sin(m * Math.PI * x) * cy_n;
            dy = -m * Math.PI * cx_n * Math.sin(m * Math.PI * y) + n * Math.PI * cx_m * Math.sin(n * Math.PI * y);
          }

          let v = Math.abs(Z);
          velocities[px] += (Math.random() - 0.5) * v * noiseStrength * activeAmplitude;
          velocities[py] += (Math.random() - 0.5) * v * noiseStrength * activeAmplitude;

          velocities[px] += -Z * dx * gradientStrength * activeAmplitude;
          velocities[py] += -Z * dy * gradientStrength * activeAmplitude;
        }

        velocities[px] *= friction;
        velocities[py] *= friction;

        x += velocities[px];
        y += velocities[py];

        if (plateShape === 'circle') {
          let d = Math.sqrt(x*x + y*y);
          if (d > 0.95) {
            x = (x / d) * 0.95; y = (y / d) * 0.95;
            let dot = velocities[px]*(x/0.95) + velocities[py]*(y/0.95);
            velocities[px] -= 2 * dot * (x/0.95);
            velocities[py] -= 2 * dot * (y/0.95);
            velocities[px] *= 0.5; velocities[py] *= 0.5;
          }
        } else if (plateShape === 'square') {
          if (x > 0.95) { x = 0.95; velocities[px] *= -0.5; }
          else if (x < -0.95) { x = -0.95; velocities[px] *= -0.5; }
          if (y > 0.95) { y = 0.95; velocities[py] *= -0.5; }
          else if (y < -0.95) { y = -0.95; velocities[py] *= -0.5; }
        } else if (plateShape === 'window') {
          if (x > aspect) { x = aspect; velocities[px] *= -0.5; }
          else if (x < -aspect) { x = -aspect; velocities[px] *= -0.5; }
          if (y > 1) { y = 1; velocities[py] *= -0.5; }
          else if (y < -1) { y = -1; velocities[py] *= -0.5; }
        }

        particles[px] = x;
        particles[py] = y;

        let pColor = defaultParticleColor;
        if (glowEffect) {
          const speed = Math.sqrt(velocities[px]*velocities[px] + velocities[py]*velocities[py]);
          let glowIdx = Math.floor(speed * 4000);
          if (glowIdx > 255) glowIdx = 255;
          pColor = lut[glowIdx];
        }

        let screenX, screenY;
        if (plateShape === 'window') {
          screenX = Math.floor((x / aspect + 1) / 2 * width);
          screenY = Math.floor((y + 1) / 2 * height);
        } else {
          const minDim = Math.min(width, height);
          const offsetX = (width - minDim) / 2;
          const offsetY = (height - minDim) / 2;
          screenX = Math.floor((x + 1) / 2 * minDim + offsetX);
          screenY = Math.floor((y + 1) / 2 * minDim + offsetY);
        }
        
        if (screenX >= 0 && screenX < width && screenY >= 0 && screenY < height) {
          data32[screenY * width + screenX] = pColor;
        }
      }

      if (motionBlur && state.offscreenCtx && state.offscreenCanvas) {
        state.offscreenCtx.putImageData(imgData, 0, 0);
        ctx.drawImage(state.offscreenCanvas, 0, 0);
      } else {
        ctx.putImageData(imgData, 0, 0);
      }

      if (state.audioCtx && state.oscillators && state.continuousGain) {
        const t = state.audioCtx.currentTime;
        if (state.isOn && state.soundEnabled) {
          state.oscillators.forEach((o, idx) => {
            o.osc.frequency.setTargetAtTime(frequency * (idx + 1), t, 0.05);
          });
          state.continuousGain.gain.setTargetAtTime(amplitude * 0.3, t, 0.05);
        } else {
          state.continuousGain.gain.setTargetAtTime(0, t, 0.05);
        }
      }
    };

    loop();
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  return (
    <>
      <style>{`
        input[type=range] {
          -webkit-appearance: none;
          width: 100%;
          background: transparent;
        }
        input[type=range]:focus {
          outline: none;
        }
        input[type=range]::-webkit-slider-thumb {
          -webkit-appearance: none;
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: #f59e0b;
          cursor: pointer;
          margin-top: -6px;
          box-shadow: 0 0 10px rgba(245, 158, 11, 0.5);
        }
        input[type=range]::-webkit-slider-runnable-track {
          width: 100%;
          height: 4px;
          cursor: pointer;
          background: #333;
          border-radius: 2px;
        }
        .light-mode input[type=range]::-webkit-slider-runnable-track {
          background: #ccc;
        }
        input[type=range]::-moz-range-thumb {
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: #f59e0b;
          cursor: pointer;
          border: none;
          box-shadow: 0 0 10px rgba(245, 158, 11, 0.5);
        }
        input[type=range]::-moz-range-track {
          width: 100%;
          height: 4px;
          cursor: pointer;
          background: #333;
          border-radius: 2px;
        }
        .light-mode input[type=range]::-moz-range-track {
          background: #ccc;
        }
      `}</style>
      <div className={`fixed inset-0 font-sans transition-colors duration-500 ${darkMode ? 'bg-[#0a0a0a] text-white dark-mode' : 'bg-[#f5f5f4] text-black light-mode'}`}>
        
        {/* Full Screen Canvas Container */}
        <div ref={containerRef} className="absolute inset-0 z-0 overflow-hidden bg-black">
          <canvas
            ref={canvasRef}
            className={`w-full h-full ${darkMode ? 'bg-black' : 'bg-white'}`}
            style={{ filter: resolution > 600 ? 'blur(0.5px) brightness(1.2)' : 'none' }}
          />
        </div>

        {/* Toggle Button (Visible when minimized) */}
        <button
          onClick={() => setIsPanelMinimized(false)}
          className={`absolute top-6 right-6 z-40 w-14 h-14 rounded-2xl border shadow-lg backdrop-blur-xl flex items-center justify-center transition-all duration-500 ${
            isPanelHidden ? 'opacity-0 pointer-events-none' : (isPanelMinimized ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8 pointer-events-none')
          } ${darkMode ? 'bg-[#111111]/80 border-[#333] text-white hover:bg-[#222]' : 'bg-white/80 border-gray-200 text-black hover:bg-gray-50'}`}
        >
          <ChevronLeft size={24} />
        </button>

        {/* Floating Controls Panel */}
        <div 
          className={`absolute top-6 right-6 z-40 w-full max-w-[400px] rounded-3xl border shadow-2xl overflow-hidden backdrop-blur-xl flex flex-col transition-all duration-500 origin-top-right ${
            isPanelHidden ? 'opacity-0 scale-95 pointer-events-none' : (isPanelMinimized ? 'opacity-0 scale-95 pointer-events-none translate-x-8' : 'opacity-100 scale-100 translate-x-0')
          } ${darkMode ? 'bg-[#111111]/80 border-[#333]' : 'bg-white/80 border-gray-200'}`}
          style={{ maxHeight: 'calc(100vh - 48px)' }}
        >
          <div className="p-6 sm:p-8 flex flex-col gap-6 overflow-y-auto custom-scrollbar w-full">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-bold tracking-tight mb-2">Resonance Lab</h1>
                <p className={`text-xs font-mono tracking-widest uppercase ${darkMode ? 'text-[#8E9299]' : 'text-gray-500'}`}>Chladni Plate Simulator</p>
              </div>
              <button onClick={() => setIsPanelMinimized(true)} className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-[#333] text-gray-400' : 'hover:bg-gray-200 text-gray-600'}`}>
                <ChevronRight size={20} />
              </button>
            </div>

                <div className="flex flex-col gap-6">
                  <button
                    onClick={togglePower}
                    className={`flex items-center justify-center gap-3 py-4 rounded-xl font-bold uppercase tracking-widest text-sm transition-all duration-300 ${
                      isOn 
                        ? 'bg-amber-500/10 text-amber-500 border border-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.15)]' 
                        : (darkMode ? 'bg-[#1a1a1a] text-[#8E9299] border border-[#444] hover:bg-[#222] hover:text-white' : 'bg-white text-gray-500 border border-gray-300 hover:bg-gray-100 hover:text-black')
                    }`}
                  >
                    <Power size={18} className={isOn ? 'animate-pulse' : ''} />
                    {isOn ? 'System Active' : 'Power On'}
                  </button>

                  <div className="space-y-4">
                    <div className="flex justify-between items-end">
                      <div className="flex items-center gap-2">
                        <label className={`text-[10px] font-mono uppercase tracking-widest ${darkMode ? 'text-[#8E9299]' : 'text-gray-500'}`}>Frequency</label>
                        <button 
                          onClick={() => {
                            const newMax = maxFrequency === 4000 ? 10000 : maxFrequency === 10000 ? 20000 : 4000;
                            setMaxFrequency(newMax);
                            if (frequency > newMax) setFrequency(newMax);
                          }}
                          className={`text-[10px] font-mono uppercase tracking-widest px-1.5 py-0.5 rounded transition-colors ${darkMode ? 'bg-[#222] text-amber-500/70 hover:text-amber-500 hover:bg-[#333]' : 'bg-gray-200 text-amber-600/70 hover:text-amber-600 hover:bg-gray-300'}`}
                          title="Toggle Maximum Frequency"
                        >
                          Max {maxFrequency / 1000}kHz
                        </button>
                        <button 
                          onClick={() => setIsLogarithmic(prev => !prev)}
                          className={`text-[10px] font-mono uppercase tracking-widest px-1.5 py-0.5 rounded transition-colors ${darkMode ? 'bg-[#222] text-amber-500/70 hover:text-amber-500 hover:bg-[#333]' : 'bg-gray-200 text-amber-600/70 hover:text-amber-600 hover:bg-gray-300'}`}
                          title="Toggle Logarithmic Scale"
                        >
                          {isLogarithmic ? 'LOG' : 'LIN'}
                        </button>
                      </div>
                      <span className="font-mono text-xl text-amber-500">{frequency.toFixed(0)} Hz</span>
                    </div>
                    <input
                      type="range"
                      min={isLogarithmic ? "0" : "1"}
                      max={isLogarithmic ? "1000" : maxFrequency}
                      step="1"
                      value={isLogarithmic ? Math.round(1000 * Math.log(Math.max(1, frequency)) / Math.log(maxFrequency)) : frequency}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        if (isLogarithmic) {
                          setFrequency(Math.max(1, Math.round(Math.exp(val / 1000 * Math.log(maxFrequency)))));
                        } else {
                          setFrequency(val);
                        }
                      }}
                    />
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-end">
                      <label className={`text-[10px] font-mono uppercase tracking-widest ${darkMode ? 'text-[#8E9299]' : 'text-gray-500'}`}>Amplitude</label>
                      <span className="font-mono text-xl text-amber-500">{Math.round(amplitude * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={amplitude}
                      onChange={(e) => setAmplitude(Number(e.target.value))}
                    />
                  </div>

                  <div className={`p-4 rounded-xl border ${darkMode ? 'bg-[#1a1a1a]/50 border-[#333]' : 'bg-white/50 border-gray-200'}`}>
                    <div className="flex flex-col gap-4">
                      <div className="flex gap-2">
                        <button
                          onClick={handleManualKick}
                          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-bold uppercase tracking-widest text-sm transition-all duration-100 active:scale-95 ${darkMode ? 'bg-amber-500/20 text-amber-500 border border-amber-500/50 hover:bg-amber-500/30' : 'bg-amber-500 text-white hover:bg-amber-600'}`}
                        >
                          <Activity size={18} />
                          Kick
                        </button>
                        <button
                          onClick={toggleAutoKick}
                          className={`w-12 flex items-center justify-center rounded-lg transition-all duration-100 ${isKickPlaying ? 'bg-amber-500 text-white shadow-[0_0_15px_rgba(245,158,11,0.4)]' : (darkMode ? 'bg-[#222] text-[#8E9299] border border-[#444] hover:bg-[#333]' : 'bg-gray-100 text-gray-500 border border-gray-300 hover:bg-gray-200')}`}
                        >
                          {isKickPlaying ? <SquareIcon size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" className="ml-1" />}
                        </button>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between items-end">
                          <label className={`text-[10px] font-mono uppercase tracking-widest ${darkMode ? 'text-[#8E9299]' : 'text-gray-500'}`}>Kick Strength</label>
                          <span className="font-mono text-xs text-amber-500">{Math.round(kickStrength * 100)}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.01"
                          value={kickStrength}
                          onChange={(e) => setKickStrength(Number(e.target.value))}
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between items-end">
                          <label className={`text-[10px] font-mono uppercase tracking-widest ${darkMode ? 'text-[#8E9299]' : 'text-gray-500'}`}>Auto Tempo</label>
                          <span className="font-mono text-xs text-amber-500">{kickTempo} BPM</span>
                        </div>
                        <input
                          type="range"
                          min="60"
                          max="240"
                          step="1"
                          value={kickTempo}
                          onChange={(e) => setKickTempo(Number(e.target.value))}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 pt-4 border-t border-[#333]">
                    <label className={`text-[10px] font-mono uppercase tracking-widest ${darkMode ? 'text-[#8E9299]' : 'text-gray-500'}`}>Plate Shape</label>
                    <div className="grid grid-cols-3 gap-2">
                      {SHAPES.map(s => (
                        <button
                          key={s}
                          onClick={() => setPlateShape(s)}
                          className={`py-2 text-[10px] font-mono uppercase tracking-wider rounded-lg border transition-colors ${plateShape === s ? 'bg-amber-500/10 border-amber-500/50 text-amber-500' : (darkMode ? 'bg-[#1a1a1a] border-[#444] text-[#8E9299] hover:bg-[#222]' : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-100')}`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className={`text-[10px] font-mono uppercase tracking-widest ${darkMode ? 'text-[#8E9299]' : 'text-gray-500'}`}>Resolution & Quality</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[600, 1000, 1400].map(res => (
                        <button
                          key={res}
                          onClick={() => setResolution(res)}
                          className={`py-2 text-[10px] font-mono uppercase tracking-wider rounded-lg border transition-colors ${resolution === res ? 'bg-amber-500/10 border-amber-500/50 text-amber-500' : (darkMode ? 'bg-[#1a1a1a] border-[#444] text-[#8E9299] hover:bg-[#222]' : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-100')}`}
                        >
                          {res === 600 ? 'Normal' : res === 1000 ? 'High' : 'Ultra'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <label className={`flex items-center gap-3 cursor-pointer text-xs font-mono uppercase tracking-wider ${darkMode ? 'text-[#8E9299]' : 'text-gray-600'}`}>
                      <input type="checkbox" checked={darkMode} onChange={(e) => handleThemeToggle(e.target.checked)} className="accent-amber-500 w-4 h-4" />
                      Dark Mode
                    </label>
                    <label className={`flex items-center gap-3 cursor-pointer text-xs font-mono uppercase tracking-wider ${darkMode ? 'text-[#8E9299]' : 'text-gray-600'}`}>
                      <input type="checkbox" checked={glowEffect} onChange={(e) => setGlowEffect(e.target.checked)} className="accent-amber-500 w-4 h-4" />
                      Velocity Glow
                    </label>
                    <label className={`flex items-center gap-3 cursor-pointer text-xs font-mono uppercase tracking-wider ${darkMode ? 'text-[#8E9299]' : 'text-gray-600'}`}>
                      <input type="checkbox" checked={motionBlur} onChange={(e) => setMotionBlur(e.target.checked)} className="accent-amber-500 w-4 h-4" />
                      Motion Blur
                    </label>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className={`text-[10px] font-mono uppercase tracking-widest ${darkMode ? 'text-[#8E9299]' : 'text-gray-500'}`}>Plate Color</label>
                      <div className="flex items-center gap-2">
                        <input type="color" value={plateColor} onChange={(e) => setPlateColor(e.target.value)} />
                        <span className={`text-[10px] font-mono uppercase ${darkMode ? 'text-[#8E9299]' : 'text-gray-600'}`}>{plateColor}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className={`text-[10px] font-mono uppercase tracking-widest ${darkMode ? 'text-[#8E9299]' : 'text-gray-500'}`}>Sand Color</label>
                      <div className="flex items-center gap-2">
                        <input type="color" value={sandColor} onChange={(e) => setSandColor(e.target.value)} />
                        <span className={`text-[10px] font-mono uppercase ${darkMode ? 'text-[#8E9299]' : 'text-gray-600'}`}>{sandColor}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className={`text-[10px] font-mono uppercase tracking-widest ${darkMode ? 'text-[#8E9299]' : 'text-gray-500'}`}>Glow Color</label>
                      <div className="flex items-center gap-2">
                        <input type="color" value={glowColor} onChange={(e) => setGlowColor(e.target.value)} />
                        <span className={`text-[10px] font-mono uppercase ${darkMode ? 'text-[#8E9299]' : 'text-gray-600'}`}>{glowColor}</span>
                      </div>
                    </div>
                  </div>

                  <div className={`grid grid-cols-3 gap-2 pt-4 border-t ${darkMode ? 'border-[#333]' : 'border-gray-200'}`}>
                    <button
                      onClick={() => { simState.current.scatter = true; }}
                      className={`flex items-center justify-center gap-2 py-3 rounded-xl border text-[10px] font-mono transition-colors uppercase tracking-wider ${darkMode ? 'bg-[#1a1a1a] border-[#444] text-[#8E9299] hover:bg-[#222] hover:text-white' : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-100 hover:text-black'}`}
                    >
                      <RefreshCw size={14} />
                      Scatter
                    </button>
                    <button
                      onClick={() => setSoundEnabled(!soundEnabled)}
                      className={`flex items-center justify-center gap-2 py-3 rounded-xl border text-[10px] font-mono transition-colors uppercase tracking-wider ${
                        soundEnabled 
                          ? 'bg-amber-400/10 border-amber-400/30 text-amber-500' 
                          : (darkMode ? 'bg-[#1a1a1a] border-[#444] text-[#8E9299] hover:bg-[#222] hover:text-white' : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-100 hover:text-black')
                      }`}
                    >
                      {soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
                      {soundEnabled ? 'Sound On' : 'Muted'}
                    </button>
                    <button
                      onClick={toggleFullScreen}
                      className={`flex items-center justify-center gap-2 py-3 rounded-xl border text-[10px] font-mono transition-colors uppercase tracking-wider ${darkMode ? 'bg-[#1a1a1a] border-[#444] text-[#8E9299] hover:bg-[#222] hover:text-white' : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-100 hover:text-black'}`}
                    >
                      <Maximize size={14} />
                      Full Screen
                    </button>
                  </div>

                  <div className={`pt-6 border-t flex flex-col gap-3 ${darkMode ? 'border-[#333]' : 'border-gray-200'}`}>
                    <div className="mb-2">
                      <h3 className={`text-[10px] font-mono uppercase tracking-widest mb-2 ${darkMode ? 'text-[#8E9299]' : 'text-gray-500'}`}>Shortcuts</h3>
                      <div className={`grid grid-cols-2 gap-y-1 text-[10px] font-mono ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        <div><span className={darkMode ? 'text-white' : 'text-black'}>H</span> - Hide panel</div>
                        <div><span className={darkMode ? 'text-white' : 'text-black'}>Space</span> - Kick</div>
                        <div><span className={darkMode ? 'text-white' : 'text-black'}>P</span> - Play kick</div>
                        <div><span className={darkMode ? 'text-white' : 'text-black'}>M</span> - Mute</div>
                        <div><span className={darkMode ? 'text-white' : 'text-black'}>A</span> - Activate</div>
                        <div><span className={darkMode ? 'text-white' : 'text-black'}>+/-</span> - Freq (Shift for 5Hz)</div>
                      </div>
                    </div>
                    <div className={`h-px w-full ${darkMode ? 'bg-[#333]' : 'bg-gray-200'}`} />
                    <a href="https://github.com/escaroda/resonancelab" target="_blank" rel="noopener noreferrer" className={`text-xs font-mono uppercase tracking-wider flex items-center gap-2 transition-colors ${darkMode ? 'text-[#8E9299] hover:text-white' : 'text-gray-500 hover:text-black'}`}>
                      <Github size={14} /> escaroda
                    </a>
                    <a href="https://www.instagram.com/callsomeoneyoulove/" target="_blank" rel="noopener noreferrer" className={`text-xs font-mono uppercase tracking-wider flex items-center gap-2 transition-colors ${darkMode ? 'text-[#8E9299] hover:text-white' : 'text-gray-500 hover:text-black'}`}>
                      <Instagram size={14} /> callsomeoneyoulove
                    </a>
                  </div>

                </div>
              </div>
        </div>
      </div>
    </>
  );
}
