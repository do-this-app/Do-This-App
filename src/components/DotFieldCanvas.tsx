import React, { useEffect, useRef } from 'react';

export type DotFieldState =
  | 'idle'
  | 'focus'
  | 'processing'
  | 'results'
  | 'history'
  | 'settings'
  | 'error';

export interface DotFieldCanvasProps {
  state: DotFieldState;
  processingPhase?: number; // 0: receive, 1: scan, 2: discover, 3: extract, 4: organize, 5: resolve, 6: reveal, 7: settle
  pulseTrigger?: number; // Increment to trigger an outward ripple/pulse (e.g. on completion or save)
  interactive?: boolean;
}

interface SpectralRip {
  startTime: number;
  angle: number;
  speed: number;
  width: number;
  surgeHue: number;
  maxDistance: number;
}

interface Dot {
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  gridX: number;
  gridY: number;
  radius: number;
  scale: number;
  targetScale: number;
  baseAlpha: number;
  alpha: number;
  clusterId: number;
  pulseSpeed: number;
  phase: number;
  hueOffset: number;
  tier: 'slow' | 'medium' | 'micro';
}

/**
 * Continuous, smooth spectral color interpolation function
 * Maps phase [0, 1) to:
 * Deep Indigo -> Electric Blue -> Cyan -> Emerald -> Lime -> Yellow -> Orange -> Magenta -> Violet -> Indigo
 */
function getSpectralHsla(
  phase: number,
  saturationBoost = 0,
  lightnessBoost = 0,
  alpha = 1.0
): string {
  // Normalize cyclic phase [0, 1)
  const p = ((phase % 1.0) + 1.0) % 1.0;

  let h: number;
  let s: number;
  let l: number;

  if (p < 0.2) {
    // 0.0 - 0.2: Deep Indigo (265) -> Electric Blue (225) -> Cyan (185)
    const t = p / 0.2;
    h = 265 - t * 80;
    s = 85 + t * 5;
    l = 50 - t * 5;
  } else if (p < 0.4) {
    // 0.2 - 0.4: Cyan (185) -> Emerald (155) -> Teal (140)
    const t = (p - 0.2) / 0.2;
    h = 185 - t * 45;
    s = 88;
    l = 42;
  } else if (p < 0.6) {
    // 0.4 - 0.6: Teal (140) -> Amber (38)
    const t = (p - 0.4) / 0.2;
    h = 140 - t * 102;
    s = 90;
    l = 44 + t * 4;
  } else if (p < 0.8) {
    // 0.6 - 0.8: Amber (38) -> Ruby/Magenta (330)
    const t = (p - 0.6) / 0.2;
    h = t < 0.3 ? 38 - t * 60 : 360 - (1 - (t - 0.3) / 0.7) * 30;
    s = 90;
    l = 46 + t * 4;
  } else {
    // 0.8 - 1.0: Ruby/Magenta (330) -> Violet (285) -> Indigo (265)
    const t = (p - 0.8) / 0.2;
    h = 330 - t * 65;
    s = 88;
    l = 48 - t * 2;
  }

  const finalS = Math.min(100, Math.max(10, s + saturationBoost));
  const finalL = Math.min(65, Math.max(22, l + lightnessBoost));
  const finalA = Math.min(0.85, Math.max(0.12, alpha));

  return `hsla(${Math.round(h)}, ${Math.round(finalS)}%, ${Math.round(finalL)}%, ${finalA.toFixed(2)})`;
}

export const DotFieldCanvas: React.FC<DotFieldCanvasProps> = ({
  state = 'idle',
  processingPhase = 0,
  pulseTrigger = 0,
  interactive = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const dotsRef = useRef<Dot[]>([]);
  const stateRef = useRef(state);
  const phaseRef = useRef(processingPhase);
  const timeRef = useRef<number>(0);
  const lastPulseTriggerRef = useRef(pulseTrigger);

  // Active spectral ripples from touch/clicks and reveal moments
  const pulseRipplesRef = useRef<
    Array<{ x: number; y: number; radius: number; maxRadius: number; speed: number; alpha: number; surgeHue: number }>
  >([]);

  // Active narrow "Spectral Rips" traveling through the field
  const spectralRipsRef = useRef<SpectralRip[]>([]);
  const nextRipTimeRef = useRef<number>(3.5);

  const mouseRef = useRef<{ x: number; y: number; active: boolean }>({ x: -1000, y: -1000, active: false });

  // Signature "Collective Inhale -> Hold -> Release" timer state
  const collectiveInhaleRef = useRef<{
    active: boolean;
    startTime: number;
    duration: number; // ~850ms
  }>({
    active: false,
    startTime: 0,
    duration: 850,
  });

  // Keep refs synchronized
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    const prevPhase = phaseRef.current;
    phaseRef.current = processingPhase;

    // Trigger signature Collective Inhale when entering Phase 6 (REVEAL)
    if (processingPhase === 6 && prevPhase !== 6) {
      collectiveInhaleRef.current = {
        active: true,
        startTime: performance.now(),
        duration: 900,
      };
    }
  }, [processingPhase]);

  // Handle pulse trigger changes (Aha moment or save confirmation)
  useEffect(() => {
    if (pulseTrigger !== lastPulseTriggerRef.current) {
      lastPulseTriggerRef.current = pulseTrigger;
      // Start collective inhale sequence followed by radial release
      collectiveInhaleRef.current = {
        active: true,
        startTime: performance.now(),
        duration: 850,
      };

      if (canvasRef.current) {
        const { width, height } = canvasRef.current;
        // Schedule outward radial release pulse after the inhale peak (~400ms)
        setTimeout(() => {
          pulseRipplesRef.current.push({
            x: width / 2,
            y: height * 0.35,
            radius: 14,
            maxRadius: Math.max(width, height) * 0.98,
            speed: 17,
            alpha: 1.0,
            surgeHue: Math.random(),
          });
        }, 390);
      }
    }
  }, [pulseTrigger]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Responsive sizing with devicePixelRatio capping
    const initCanvas = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = window.innerWidth;
      const height = window.innerHeight;

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);

      // Increased dot count for richer information density
      const isMobile = width < 768;
      const targetDotCount = isMobile ? 1050 : 2500;
      const cols = Math.ceil(Math.sqrt((targetDotCount * width) / height));
      const rows = Math.ceil(targetDotCount / cols);
      const cellW = width / cols;
      const cellH = height / rows;

      const newDots: Dot[] = [];
      const numClusters = 11;
      const clusterCenters = Array.from({ length: numClusters }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
      }));

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const gridX = (c + 0.5) * cellW;
          const gridY = (r + 0.5) * cellH;

          // Organic jitter around grid point
          const jitterX = (Math.random() - 0.5) * cellW * 0.88;
          const jitterY = (Math.random() - 0.5) * cellH * 0.88;
          const baseX = Math.max(4, Math.min(width - 4, gridX + jitterX));
          const baseY = Math.max(4, Math.min(height - 4, gridY + jitterY));

          // Closest cluster for localized synchronized breathing & regional spectrum
          let closestCluster = 0;
          let minDist = Infinity;
          for (let k = 0; k < numClusters; k++) {
            const d = Math.hypot(baseX - clusterCenters[k].x, baseY - clusterCenters[k].y);
            if (d < minDist) {
              minDist = d;
              closestCluster = k;
            }
          }

          // Varied base radius (1.05px to 2.2px)
          const radius = Math.random() < 0.22 ? 2.15 : Math.random() < 0.55 ? 1.6 : 1.1;

          // Base opacity hierarchy
          const baseAlpha = 0.22 + Math.random() * 0.38;

          // Multi-frequency breathing tiers (increased breathing speed):
          // SLOW: deep, long breathing cycle (~4.5–6s)
          // MEDIUM: steady moderate cycle (~2.5–3.5s)
          // MICRO: rapid subtle shimmer on top (~1.2–1.8s)
          const tierRand = Math.random();
          const tier: 'slow' | 'medium' | 'micro' =
            tierRand < 0.35 ? 'slow' : tierRand < 0.75 ? 'medium' : 'micro';

          const pulseSpeed =
            tier === 'slow'
              ? 1.2 + Math.random() * 0.5
              : tier === 'medium'
              ? 2.1 + Math.random() * 0.7
              : 3.2 + Math.random() * 1.0;

          // Micro hue offset so every dot has distinct individuality in the spectrum
          const hueOffset = Math.random() * 0.08 - 0.04;

          newDots.push({
            x: baseX,
            y: baseY,
            baseX,
            baseY,
            gridX,
            gridY,
            radius,
            scale: 1.0,
            targetScale: 1.0,
            baseAlpha,
            alpha: baseAlpha,
            clusterId: closestCluster,
            pulseSpeed,
            phase: Math.random() * Math.PI * 2,
            hueOffset,
            tier,
          });
        }
      }

      dotsRef.current = newDots;

      // If reduced motion, render one static tasteful spectral frame and do not loop
      if (prefersReducedMotion) {
        renderStatic(ctx, width, height, newDots);
      }
    };

    const renderStatic = (
      c: CanvasRenderingContext2D,
      w: number,
      h: number,
      dots: Dot[]
    ) => {
      c.clearRect(0, 0, w, h);
      const diagLength = Math.hypot(w, h);
      const cosA = Math.cos(0.61);
      const sinA = Math.sin(0.61);

      for (let i = 0; i < dots.length; i++) {
        const d = dots[i];
        const proj = (d.baseX * cosA + d.baseY * sinA) / diagLength;
        const color = getSpectralHsla(proj, 0, 0, d.baseAlpha);
        c.beginPath();
        c.arc(d.baseX, d.baseY, d.radius, 0, Math.PI * 2);
        c.fillStyle = color;
        c.fill();
      }
    };

    initCanvas();

    window.addEventListener('resize', initCanvas);

    // If reduced motion is requested, stop here
    if (prefersReducedMotion) {
      return () => {
        window.removeEventListener('resize', initCanvas);
      };
    }

    // Animation Loop
    let lastTime = performance.now();

    const loop = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;
      timeRef.current += dt;
      const t = timeRef.current;

      const currentState = stateRef.current;
      const phase = phaseRef.current;
      const w = window.innerWidth;
      const h = window.innerHeight;
      const dots = dotsRef.current;
      const mouse = mouseRef.current;

      // Clear transparently to preserve crisp light surface behind dots
      ctx.clearRect(0, 0, w, h);

      // =========================================================================
      // 1. MACRO SPECTRAL DRIFT & RIPS GENERATOR
      // =========================================================================
      const diagLength = Math.hypot(w, h);
      const waveAngle = 0.62; // ~35.5 degrees diagonal travel
      const cosA = Math.cos(waveAngle);
      const sinA = Math.sin(waveAngle);

      // Macro drift speed
      const macroDriftSpeed = currentState === 'processing' ? 0.14 : 0.055;
      const macroTime = t * macroDriftSpeed;

      // State specific phase offset
      const stateHueOffset =
        currentState === 'focus'
          ? 0.08
          : currentState === 'processing'
          ? 0.22 + phase * 0.08
          : currentState === 'results'
          ? 0.45
          : currentState === 'history'
          ? 0.72
          : currentState === 'error'
          ? 0.95
          : 0.0;

      // Trigger automatic Spectral Rips
      if (t > nextRipTimeRef.current) {
        const interval = currentState === 'processing' ? 2.8 : 7.0;
        nextRipTimeRef.current = t + interval + Math.random() * 2.0;

        spectralRipsRef.current.push({
          startTime: t,
          angle: waveAngle + (Math.random() - 0.5) * 0.4,
          speed: 380 + Math.random() * 120, // pixels per second
          width: 75,
          surgeHue: (macroTime + Math.random() * 0.5) % 1.0,
          maxDistance: diagLength + 150,
        });
      }

      // Update active spectral rips
      const rips = spectralRipsRef.current;
      for (let r = rips.length - 1; r >= 0; r--) {
        const rip = rips[r];
        const elapsed = t - rip.startTime;
        const currentDist = elapsed * rip.speed;
        if (currentDist > rip.maxDistance) {
          rips.splice(r, 1);
        }
      }

      // Update active touch/click spectral ripples
      const activeRipples = pulseRipplesRef.current;
      for (let r = activeRipples.length - 1; r >= 0; r--) {
        const rip = activeRipples[r];
        rip.radius += rip.speed;
        rip.alpha *= 0.965;
        if (rip.alpha < 0.01 || rip.radius > rip.maxRadius) {
          activeRipples.splice(r, 1);
        }
      }

      // Processing Scanning wave calculations
      const scanSpeed = currentState === 'processing' ? 1.6 : 0.45;
      const primaryScanY = ((t * 190 * scanSpeed) % (h + 350)) - 175;
      const secondaryScanX = ((t * 140 * scanSpeed) % (w + 400)) - 200;
      const gravityFocalX = w * 0.5;
      const gravityFocalY = h * 0.38;

      // Increased breathing base speed (more dynamic, responsive, alive)
      const breathBaseSpeed = currentState === 'processing' ? 3.2 : 2.0;
      const waveWavelength = 340;

      // Harmonic counter wave angle
      const counterAngle = waveAngle + 1.55;
      const cosC = Math.cos(counterAngle);
      const sinC = Math.sin(counterAngle);

      // Signature Collective Inhale sequence
      let collectiveInhaleBonus = 0;
      let collectiveAlphaBonus = 0;
      let collectiveHueSurge = 0;
      const inhaleData = collectiveInhaleRef.current;
      if (inhaleData.active) {
        const elapsed = now - inhaleData.startTime;
        if (elapsed < inhaleData.duration) {
          const p = elapsed / inhaleData.duration;
          if (p < 0.45) {
            // Stage 1: INHALE
            const easeInhale = Math.sin((p / 0.45) * (Math.PI / 2));
            collectiveInhaleBonus = easeInhale * 1.05;
            collectiveAlphaBonus = easeInhale * 0.5;
            collectiveHueSurge = easeInhale * 0.25;
          } else if (p < 0.65) {
            // Stage 2: HOLD
            collectiveInhaleBonus = 1.05;
            collectiveAlphaBonus = 0.5;
            collectiveHueSurge = 0.25;
          } else {
            // Stage 3: RELEASE
            const releaseP = (p - 0.65) / 0.35;
            const easeRelease = Math.cos(releaseP * (Math.PI / 2));
            collectiveInhaleBonus = easeRelease * 1.05;
            collectiveAlphaBonus = easeRelease * 0.5;
            collectiveHueSurge = easeRelease * 0.25;
          }
        } else {
          inhaleData.active = false;
        }
      }

      // =========================================================================
      // 2. PROCESS & RENDER EVERY SPECTRAL DOT
      // =========================================================================
      const totalDots = dots.length;
      for (let i = 0; i < totalDots; i++) {
        const d = dots[i];

        // 1. Traveling Wave Projection
        const projWave = d.baseX * cosA + d.baseY * sinA;
        const projCounter = d.baseX * cosC + d.baseY * sinC;

        // Primary rolling wave
        const wavePhase = t * breathBaseSpeed - projWave / waveWavelength;
        const waveVal = Math.sin(wavePhase);

        // Counter harmonic wave
        const counterPhase = t * (breathBaseSpeed * 0.72) - projCounter / 460;
        const counterVal = Math.sin(counterPhase);

        // Cluster breathing resonance
        const clusterRhythm = Math.sin(t * (breathBaseSpeed * 0.9) + d.clusterId * 1.4);

        // Individual micro-respiration
        const dotRespiration = Math.sin(t * d.pulseSpeed + d.phase);

        // Blended organic breathing crest (-1 to +1)
        const combinedCrest = waveVal * 0.52 + counterVal * 0.22 + clusterRhythm * 0.16 + dotRespiration * 0.1;
        const inhaleFactor = (combinedCrest + 1) * 0.5;

        // Physical wave motion & coordinated sway
        const swayAmplitude = currentState === 'processing' ? 9.5 : 6.5;
        const waveDisplacement = waveVal * swayAmplitude;
        const counterDisplacement = counterVal * (swayAmplitude * 0.35);

        let targetX = d.baseX + cosA * waveDisplacement + cosC * counterDisplacement;
        let targetY = d.baseY + sinA * waveDisplacement + sinC * counterDisplacement;

        // Base Target Scale (grows on inhale, shrinks on exhale)
        let targetScale = 0.75 + 0.85 * Math.pow(inhaleFactor, 1.25);

        // Synchronized Opacity (brightens on inhale, relaxes on exhale)
        let targetAlpha = d.baseAlpha * (0.7 + 0.85 * inhaleFactor);

        // Color saturation & lightness modulators
        let saturationBoost = inhaleFactor * 16;
        let lightnessBoost = inhaleFactor * 14;

        // =========================================================================
        // 3. SPECTRAL HUE COMPUTATION
        // =========================================================================
        // Normalized diagonal position across screen
        const diagPos = projWave / diagLength;

        // Regional spatial variation via cluster
        const regionalNoise = (d.clusterId * 0.08) + Math.sin(d.baseX * 0.002 + d.baseY * 0.002) * 0.05;

        // Base spectral phase
        let dotHuePhase = (diagPos * 0.95 + macroTime + regionalNoise + d.hueOffset + stateHueOffset) % 1.0;
        if (dotHuePhase < 0) dotHuePhase += 1.0;

        // Collective Inhale spectral intensification
        if (collectiveInhaleBonus > 0) {
          targetScale += collectiveInhaleBonus;
          targetAlpha += collectiveAlphaBonus;
          saturationBoost += collectiveHueSurge * 35;
          lightnessBoost += collectiveHueSurge * 25;
          targetX += (w * 0.5 - d.baseX) * 0.04 * collectiveInhaleBonus;
          targetY += (h * 0.38 - d.baseY) * 0.04 * collectiveInhaleBonus;
        }

        // =========================================================================
        // 4. SPECTRAL RIPS (NARROW HIGH-ENERGY WAVES OF VIBRANT COLOR)
        // =========================================================================
        for (let r = 0; r < rips.length; r++) {
          const rip = rips[r];
          const ripElapsed = t - rip.startTime;
          const ripFrontDist = ripElapsed * rip.speed;
          const projRip = d.baseX * Math.cos(rip.angle) + d.baseY * Math.sin(rip.angle);
          const distToRip = Math.abs(projRip - ripFrontDist);

          if (distToRip < rip.width) {
            const ripFactor = 1 - distToRip / rip.width;
            // 1. Temporarily increase saturation
            saturationBoost += 30 * ripFactor;
            // 2. Brighten slightly
            lightnessBoost += 28 * ripFactor;
            // 3. Expand breathing amplitude
            targetScale += 0.75 * ripFactor;
            targetAlpha += 0.35 * ripFactor;
            // 4. Shift toward passing surge hue
            dotHuePhase = (dotHuePhase * (1 - 0.5 * ripFactor) + rip.surgeHue * (0.5 * ripFactor)) % 1.0;
            // 5. Subtle physical surge displacement
            targetX += Math.cos(rip.angle) * 6 * ripFactor;
            targetY += Math.sin(rip.angle) * 6 * ripFactor;
          }
        }

        // =========================================================================
        // 5. APPLICATION STATE PERSONALITIES
        // =========================================================================
        // FOCUS / DOCUMENT SELECTED
        if (currentState === 'focus') {
          const distToCenter = Math.hypot(d.baseX - w * 0.5, d.baseY - h * 0.45);
          if (distToCenter < 260) {
            const pull = 1 - distToCenter / 260;
            targetX += (w * 0.5 - d.baseX) * 0.1 * pull;
            targetY += (h * 0.45 - d.baseY) * 0.1 * pull;
            targetScale += pull * 0.8;
            targetAlpha += pull * 0.4;
            saturationBoost += pull * 25;
            lightnessBoost += pull * 18;
          }
        }

        // PROCESSING PHASES: Active spectral movement, scanning waves & extraction
        if (currentState === 'processing') {
          const clusterPulse = Math.sin(t * 3.8 + d.clusterId * 1.8);
          if (clusterPulse > 0.25) {
            targetScale += (clusterPulse - 0.25) * 1.15;
            saturationBoost += 20;
            lightnessBoost += 18;
          }

          // Phase 1: SCAN wave
          if (phase === 1) {
            const distToScan = Math.abs(d.baseY - primaryScanY);
            if (distToScan < 95) {
              const scanFactor = 1 - distToScan / 95;
              targetScale += scanFactor * 1.4;
              targetAlpha += scanFactor * 0.65;
              saturationBoost += scanFactor * 35;
              lightnessBoost += scanFactor * 30;
              dotHuePhase = (dotHuePhase + scanFactor * 0.25) % 1.0;
              targetY += Math.sin(distToScan * 0.1) * 4;
            }
          }
          // Phase 2: DISCOVER
          else if (phase === 2) {
            const distY = Math.abs(d.baseY - primaryScanY);
            const distX = Math.abs(d.baseX - secondaryScanX);
            let waveFactor = 0;
            if (distY < 85) waveFactor += (1 - distY / 85) * 0.5;
            if (distX < 85) waveFactor += (1 - distX / 85) * 0.5;
            targetScale += waveFactor * 1.2;
            saturationBoost += waveFactor * 30;
            lightnessBoost += waveFactor * 25;
          }
          // Phase 3: EXTRACT (Information gravity)
          else if (phase === 3) {
            const distToGrav = Math.hypot(d.baseX - gravityFocalX, d.baseY - gravityFocalY);
            if (distToGrav < 300) {
              const gravStrength = Math.pow(1 - distToGrav / 300, 2);
              targetX += (gravityFocalX - d.baseX) * gravStrength * 0.28;
              targetY += (gravityFocalY - d.baseY) * gravStrength * 0.28;
              targetScale += gravStrength * 1.35;
              targetAlpha += gravStrength * 0.7;
              saturationBoost += gravStrength * 40;
              lightnessBoost += gravStrength * 30;
            }
          }
          // Phase 4: ORGANIZE
          else if (phase === 4) {
            const alignStrength = 0.6;
            targetX = d.baseX * (1 - alignStrength) + d.gridX * alignStrength;
            targetY = d.baseY * (1 - alignStrength) + d.gridY * alignStrength;
            targetScale *= 1.2;
            saturationBoost += 18;
          }
          // Phase 5: RESOLVE
          else if (phase >= 5) {
            const alignStrength = 0.72;
            targetX = d.baseX * (1 - alignStrength) + d.gridX * alignStrength;
            targetY = d.baseY * (1 - alignStrength) + d.gridY * alignStrength;
            targetAlpha = d.baseAlpha * 1.25 + 0.2;
          }
        }

        // RESULTS STATE
        if (currentState === 'results') {
          const gridWeight = 0.35;
          targetX = d.baseX * (1 - gridWeight) + d.gridX * gridWeight;
          targetY = d.baseY * (1 - gridWeight) + d.gridY * gridWeight;
          targetScale = 0.85 + 0.5 * inhaleFactor;
          targetAlpha = d.baseAlpha * 1.15;
          lightnessBoost += 8;
        }

        // ERROR STATE: Brief spectral disruption
        if (currentState === 'error') {
          const jitter = (Math.random() - 0.5) * 4;
          targetX += jitter;
          targetY += jitter;
          targetScale = 0.9;
          dotHuePhase = (dotHuePhase + (Math.random() - 0.5) * 0.15) % 1.0;
        }

        // =========================================================================
        // 6. TOUCH / CLICK SPECTRAL RIPPLE INTERACTION
        // =========================================================================
        for (let r = 0; r < activeRipples.length; r++) {
          const rip = activeRipples[r];
          const distToRipCenter = Math.hypot(d.x - rip.x, d.y - rip.y);
          const distFromWavefront = Math.abs(distToRipCenter - rip.radius);
          if (distFromWavefront < 65) {
            const factor = (1 - distFromWavefront / 65) * rip.alpha;
            targetScale += factor * 1.6;
            targetAlpha += factor * 0.75;
            saturationBoost += factor * 40;
            lightnessBoost += factor * 35;
            dotHuePhase = (dotHuePhase * (1 - factor * 0.6) + rip.surgeHue * (factor * 0.6)) % 1.0;
            const angle = Math.atan2(d.y - rip.y, d.x - rip.x);
            targetX += Math.cos(angle) * factor * 12;
            targetY += Math.sin(angle) * factor * 12;
          }
        }

        // Interactive mouse hover reaction
        if (interactive && mouse.active) {
          const distToMouse = Math.hypot(d.x - mouse.x, d.y - mouse.y);
          if (distToMouse < 120) {
            const factor = 1 - distToMouse / 120;
            const mouseForce = factor * 16;
            const angle = Math.atan2(d.y - mouse.y, d.x - mouse.x);
            targetX += Math.cos(angle) * mouseForce;
            targetY += Math.sin(angle) * mouseForce;
            targetScale += factor * 1.1;
            targetAlpha += factor * 0.45;
            saturationBoost += factor * 30;
            lightnessBoost += factor * 25;
          }
        }

        // =========================================================================
        // 7. SMOOTH INTERPOLATION FOR FLUID BREATHING & SPECTRAL GLOW
        // =========================================================================
        d.x += (targetX - d.x) * 0.14;
        d.y += (targetY - d.y) * 0.14;
        d.scale += (targetScale - d.scale) * 0.15;
        d.alpha += (targetAlpha - d.alpha) * 0.17;

        const clampedScale = Math.max(0.6, Math.min(d.scale, 3.4));
        const clampedAlpha = Math.max(0.08, Math.min(d.alpha, 0.98));
        const renderedRadius = d.radius * clampedScale;

        // Render spectral dot
        const dotColor = getSpectralHsla(dotHuePhase, saturationBoost, lightnessBoost, clampedAlpha);

        ctx.beginPath();
        ctx.arc(d.x, d.y, renderedRadius, 0, Math.PI * 2);
        ctx.fillStyle = dotColor;
        ctx.fill();

        // Subtle luminous halo on peak expanded dots
        if (clampedScale > 1.95 && clampedAlpha > 0.35) {
          ctx.beginPath();
          ctx.arc(d.x, d.y, renderedRadius * 1.5, 0, Math.PI * 2);
          ctx.fillStyle = getSpectralHsla(
            dotHuePhase,
            saturationBoost + 10,
            lightnessBoost + 10,
            clampedAlpha * 0.2
          );
          ctx.fill();
        }
      }

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);

    // Pointer event handlers
    const handlePointerMove = (e: PointerEvent) => {
      mouseRef.current = {
        x: e.clientX,
        y: e.clientY,
        active: true,
      };
    };

    const handlePointerLeave = () => {
      mouseRef.current.active = false;
    };

    const handlePointerDown = (e: PointerEvent) => {
      // Create local expanding spectral ripple on click/tap
      pulseRipplesRef.current.push({
        x: e.clientX,
        y: e.clientY,
        radius: 10,
        maxRadius: 240,
        speed: 12,
        alpha: 0.95,
        surgeHue: (timeRef.current * 0.08 + Math.random() * 0.3) % 1.0,
      });
    };

    if (interactive) {
      window.addEventListener('pointermove', handlePointerMove, { passive: true });
      window.addEventListener('pointerleave', handlePointerLeave, { passive: true });
      window.addEventListener('pointerdown', handlePointerDown, { passive: true });
    }

    return () => {
      window.removeEventListener('resize', initCanvas);
      if (interactive) {
        window.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('pointerleave', handlePointerLeave);
        window.removeEventListener('pointerdown', handlePointerDown);
      }
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [interactive]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-0 select-none transition-opacity duration-700"
      style={{
        opacity: state === 'processing' ? 1.0 : 0.92,
      }}
    />
  );
};
