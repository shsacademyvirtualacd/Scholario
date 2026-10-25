import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { ChevronDown, ChevronUp, Volume2 } from 'lucide-react';

export type Sage3DAvatarState = 'idle' | 'listening' | 'thinking' | 'speaking';

export interface Sage3DAvatarProps {
  state: Sage3DAvatarState;
  /** Audio volume level 0..1 when speaking or recording */
  audioLevel?: number;
  /** Compact layout for active conversation threads */
  compact?: boolean;
  /** Optional subtitle/status label */
  statusLabel?: string;
  /** Whether the avatar is collapsed by the user */
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

/**
 * 3D Procedural AI Tutor Avatar for Sage AI (Scholario Black & Gold Theme)
 *
 * Built with Three.js using a multi-part hierarchical THREE.Group:
 * 1. Sculpted obsidian-black cranium shell with gold crown trim
 * 2. High-gloss dark visor faceplate
 * 3. Expressive dual golden eyes with animated eyelids (blinking + gaze tracking)
 * 4. 5-bar audio-reactive golden voice visualizer mouth
 * 5. Dual acoustic side ear-pods with gold trim rings
 * 6. Dual tilted orbiting golden academic halo rings + floating knowledge nodes
 * 7. Academic collar/shoulder pedestal base
 */
export const Sage3DAvatar: React.FC<Sage3DAvatarProps> = ({
  state,
  audioLevel = 0,
  compact = false,
  statusLabel,
  collapsed = false,
  onToggleCollapse,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [webglSupported, setWebglSupported] = useState<boolean>(true);
  const stateRef = useRef<Sage3DAvatarState>(state);
  const audioLevelRef = useRef<number>(audioLevel);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    audioLevelRef.current = audioLevel;
  }, [audioLevel]);

  useEffect(() => {
    if (collapsed) return;
    const container = mountRef.current;
    if (!container) return;

    // Verify WebGL support before creating renderer
    let glTestCanvas: HTMLCanvasElement | null = document.createElement('canvas');
    const gl =
      glTestCanvas.getContext('webgl2') ||
      glTestCanvas.getContext('webgl') ||
      glTestCanvas.getContext('experimental-webgl');
    glTestCanvas = null;

    if (!gl) {
      setWebglSupported(false);
      return;
    }

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      });
    } catch {
      setWebglSupported(false);
      return;
    }

    // Check for software renderer to cap DPR conservatively
    const debugInfo = renderer.getContext().getExtension('WEBGL_debug_renderer_info');
    const rendererStr = debugInfo
      ? String(renderer.getContext().getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || '')
      : '';
    const isSoftware = /swiftshader|llvmpipe|software|microsoft basic render/i.test(rendererStr);
    const maxDpr = isSoftware ? 1 : Math.min(window.devicePixelRatio || 1, 2);

    const width = Math.max(container.clientWidth, 180);
    const height = Math.max(container.clientHeight, 140);
    renderer.setPixelRatio(maxDpr);
    renderer.setSize(width, height);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, width / height, 0.1, 50);
    camera.position.set(0, 0.08, 4.35);

    // Studio environment lighting via RoomEnvironment
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const envTarget = pmremGenerator.fromScene(new RoomEnvironment(), 0.04);
    scene.environment = envTarget.texture;

    // 3-point warm/cool accent lights
    const keyLight = new THREE.DirectionalLight(0xfff4d6, 2.2);
    keyLight.position.set(2.5, 3.5, 4.0);
    scene.add(keyLight);

    const fillLight = new THREE.PointLight(0xf4c430, 1.8, 10);
    fillLight.position.set(-2.5, 1.0, 2.5);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0x60a5fa, 1.1);
    rimLight.position.set(0, -2.5, -3.0);
    scene.add(rimLight);

    // Materials (Scholario Black & Gold PBR Palette)
    const obsidianShellMat = new THREE.MeshStandardMaterial({
      color: 0x15171e,
      metalness: 0.72,
      roughness: 0.28,
    });

    const brushedGoldMat = new THREE.MeshStandardMaterial({
      color: 0xf4c430,
      metalness: 0.88,
      roughness: 0.22,
      emissive: 0xd4a017,
      emissiveIntensity: 0.14,
    });

    const visorGlassMat = new THREE.MeshPhysicalMaterial({
      color: 0x07080c,
      metalness: 0.2,
      roughness: 0.12,
      clearcoat: 1.0,
      clearcoatRoughness: 0.08,
    });

    const eyeGlowMat = new THREE.MeshStandardMaterial({
      color: 0xffe066,
      emissive: 0xf4c430,
      emissiveIntensity: 1.8,
      roughness: 0.15,
      metalness: 0.1,
    });

    const mouthBarMat = new THREE.MeshStandardMaterial({
      color: 0xf4c430,
      emissive: 0xf4c430,
      emissiveIntensity: 1.5,
      roughness: 0.2,
      metalness: 0.3,
    });

    const haloMat = new THREE.MeshStandardMaterial({
      color: 0xf4c430,
      metalness: 0.9,
      roughness: 0.18,
      emissive: 0xd4a017,
      emissiveIntensity: 0.32,
    });

    // Root Avatar Group
    const avatarRoot = new THREE.Group();
    scene.add(avatarRoot);

    // 1. Academic Pedestal / Collar Base
    const pedestalGroup = new THREE.Group();
    pedestalGroup.position.set(0, -1.02, 0);
    avatarRoot.add(pedestalGroup);

    const collarGeo = new THREE.CylinderGeometry(0.46, 0.68, 0.32, 32);
    const collarMesh = new THREE.Mesh(collarGeo, obsidianShellMat);
    pedestalGroup.add(collarMesh);

    const collarRingGeo = new THREE.TorusGeometry(0.54, 0.032, 16, 48);
    const collarRingMesh = new THREE.Mesh(collarRingGeo, brushedGoldMat);
    collarRingMesh.rotation.x = Math.PI / 2;
    collarRingMesh.position.y = 0.06;
    pedestalGroup.add(collarRingMesh);

    // 2. Head Group (rotates to track pointer and nod/tilt)
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 0.08, 0);
    avatarRoot.add(headGroup);

    // Main sculpted cranium sphere
    const craniumGeo = new THREE.SphereGeometry(0.86, 48, 48);
    craniumGeo.scale(1.04, 0.96, 0.95);
    const craniumMesh = new THREE.Mesh(craniumGeo, obsidianShellMat);
    headGroup.add(craniumMesh);

    // Golden academic crest band across top of head
    const crestGeo = new THREE.TorusGeometry(0.84, 0.038, 16, 64, Math.PI * 1.15);
    const crestMesh = new THREE.Mesh(crestGeo, brushedGoldMat);
    crestMesh.rotation.set(-0.22, 0, -0.075 * Math.PI);
    crestMesh.position.set(0, 0.12, 0.04);
    headGroup.add(crestMesh);

    // 3. Visor Faceplate
    const visorGeo = new THREE.SphereGeometry(0.82, 40, 32, 0, Math.PI * 2, 0.32 * Math.PI, 0.36 * Math.PI);
    visorGeo.scale(1.02, 0.88, 0.52);
    const visorMesh = new THREE.Mesh(visorGeo, visorGlassMat);
    visorMesh.position.set(0, -0.02, 0.46);
    headGroup.add(visorMesh);

    // Golden visor bezel rim
    const bezelGeo = new THREE.TorusGeometry(0.62, 0.024, 16, 48);
    bezelGeo.scale(1.12, 0.68, 0.3);
    const bezelMesh = new THREE.Mesh(bezelGeo, brushedGoldMat);
    bezelMesh.position.set(0, -0.02, 0.78);
    headGroup.add(bezelMesh);

    // 4. Expressive Eyes + Eyelids (inside visor front)
    const eyesGroup = new THREE.Group();
    eyesGroup.position.set(0, 0.06, 0.83);
    headGroup.add(eyesGroup);

    const eyeGeo = new THREE.CapsuleGeometry(0.085, 0.09, 12, 20);
    const leftEye = new THREE.Mesh(eyeGeo, eyeGlowMat);
    leftEye.position.set(-0.26, 0, 0);
    eyesGroup.add(leftEye);

    const rightEye = new THREE.Mesh(eyeGeo, eyeGlowMat);
    rightEye.position.set(0.26, 0, 0);
    eyesGroup.add(rightEye);

    // Eye pupil specular highlights
    const glintGeo = new THREE.SphereGeometry(0.026, 12, 12);
    const glintMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const leftGlint = new THREE.Mesh(glintGeo, glintMat);
    leftGlint.position.set(-0.23, 0.04, 0.08);
    eyesGroup.add(leftGlint);

    const rightGlint = new THREE.Mesh(glintGeo, glintMat);
    rightGlint.position.set(0.29, 0.04, 0.08);
    eyesGroup.add(rightGlint);

    // 5. Multi-Bar Voice Equalizer Mouth (5 golden vertical bars)
    const mouthGroup = new THREE.Group();
    mouthGroup.position.set(0, -0.22, 0.82);
    headGroup.add(mouthGroup);

    const mouthBars: THREE.Mesh[] = [];
    const barGeo = new THREE.CapsuleGeometry(0.024, 0.05, 8, 12);
    const barOffsets = [-0.18, -0.09, 0, 0.09, 0.18];
    for (let i = 0; i < barOffsets.length; i++) {
      const bar = new THREE.Mesh(barGeo, mouthBarMat);
      bar.position.set(barOffsets[i], 0, 0);
      mouthGroup.add(bar);
      mouthBars.push(bar);
    }

    // 6. Side Acoustic Ear Pods
    const earGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.14, 24);
    earGeo.rotateZ(Math.PI / 2);
    const leftEar = new THREE.Mesh(earGeo, obsidianShellMat);
    leftEar.position.set(-0.9, 0, 0);
    headGroup.add(leftEar);

    const rightEar = new THREE.Mesh(earGeo, obsidianShellMat);
    rightEar.position.set(0.9, 0, 0);
    headGroup.add(rightEar);

    const earRingGeo = new THREE.TorusGeometry(0.18, 0.024, 12, 32);
    earRingGeo.rotateY(Math.PI / 2);
    const leftEarRing = new THREE.Mesh(earRingGeo, brushedGoldMat);
    leftEarRing.position.set(-0.97, 0, 0);
    headGroup.add(leftEarRing);

    const rightEarRing = new THREE.Mesh(earRingGeo, brushedGoldMat);
    rightEarRing.position.set(0.97, 0, 0);
    headGroup.add(rightEarRing);

    // 7. Orbiting Golden Academic Halo Rings + Knowledge Nodes
    const orbitGroup = new THREE.Group();
    orbitGroup.position.set(0, 0.08, 0);
    avatarRoot.add(orbitGroup);

    const outerHaloGeo = new THREE.TorusGeometry(1.26, 0.016, 12, 80);
    const outerHalo = new THREE.Mesh(outerHaloGeo, haloMat);
    outerHalo.rotation.set(Math.PI * 0.42, 0.25, 0);
    orbitGroup.add(outerHalo);

    const innerHaloGeo = new THREE.TorusGeometry(1.12, 0.012, 12, 64);
    const innerHalo = new THREE.Mesh(innerHaloGeo, haloMat);
    innerHalo.rotation.set(-Math.PI * 0.38, -0.3, 0.2);
    orbitGroup.add(innerHalo);

    // Orbiting golden sphere satellites
    const nodeGeo = new THREE.OctahedronGeometry(0.065, 0);
    const sat1 = new THREE.Mesh(nodeGeo, brushedGoldMat);
    sat1.position.set(1.26, 0, 0);
    outerHalo.add(sat1);

    const sat2 = new THREE.Mesh(nodeGeo, brushedGoldMat);
    sat2.position.set(-1.12, 0, 0);
    innerHalo.add(sat2);

    // Pointer / touch tracking state
    const pointerTarget = { x: 0, y: 0 };
    const handlePointerMove = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const nx = Math.max(-1, Math.min(1, (e.clientX - cx) / Math.max(window.innerWidth * 0.4, 180)));
      const ny = Math.max(-1, Math.min(1, (e.clientY - cy) / Math.max(window.innerHeight * 0.4, 180)));
      pointerTarget.x = nx;
      pointerTarget.y = ny;
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });

    // Blinking state
    let nextBlinkAt = 1.8 + Math.random() * 2.5;
    let blinkProgress = 0;
    let isBlinking = false;

    // Visibility & IntersectionObserver pause handling
    let isPageVisible = typeof document !== 'undefined' ? !document.hidden : true;
    let isInViewport = true;
    let rafId: number | null = null;
    let lastTime = performance.now();
    let elapsed = 0;

    const animate = (now: number) => {
      if (!isPageVisible || !isInViewport) {
        rafId = null;
        return;
      }
      rafId = requestAnimationFrame(animate);

      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;
      elapsed += dt;

      const curState = stateRef.current;
      const curVol = audioLevelRef.current;

      // 1. Floating / breathing motion
      const floatSpeed = curState === 'thinking' ? 3.0 : curState === 'speaking' ? 2.4 : 1.7;
      const floatAmp = curState === 'thinking' ? 0.07 : 0.045;
      avatarRoot.position.y = Math.sin(elapsed * floatSpeed) * floatAmp;

      // 2. Head & eye gaze tracking with smooth damping
      let targetYaw = pointerTarget.x * 0.36;
      let targetPitch = pointerTarget.y * 0.22;
      let targetRoll = -pointerTarget.x * 0.06;

      if (curState === 'listening') {
        targetPitch -= 0.06; // Attentive slight forward lean
        targetRoll += Math.sin(elapsed * 2.2) * 0.04;
      } else if (curState === 'thinking') {
        targetYaw += Math.sin(elapsed * 1.9) * 0.18;
        targetPitch += Math.cos(elapsed * 1.4) * 0.08;
      } else if (curState === 'speaking') {
        targetPitch += Math.sin(elapsed * 6.5) * (0.02 + curVol * 0.05);
      }

      headGroup.rotation.y = THREE.MathUtils.damp(headGroup.rotation.y, targetYaw, 6, dt);
      headGroup.rotation.x = THREE.MathUtils.damp(headGroup.rotation.x, targetPitch, 6, dt);
      headGroup.rotation.z = THREE.MathUtils.damp(headGroup.rotation.z, targetRoll, 6, dt);

      eyesGroup.position.x = THREE.MathUtils.damp(eyesGroup.position.x, pointerTarget.x * 0.06, 10, dt);
      eyesGroup.position.y = THREE.MathUtils.damp(
        eyesGroup.position.y,
        0.06 - pointerTarget.y * 0.04,
        10,
        dt
      );

      // 3. Periodic natural eye blinking
      if (!isBlinking && elapsed >= nextBlinkAt) {
        isBlinking = true;
        blinkProgress = 0;
      }
      let eyeScaleY = 1;
      if (isBlinking) {
        blinkProgress += dt * 9.5;
        if (blinkProgress >= Math.PI) {
          isBlinking = false;
          nextBlinkAt = elapsed + 2.4 + Math.random() * 3.2;
          eyeScaleY = 1;
        } else {
          eyeScaleY = Math.max(0.08, 1 - Math.sin(blinkProgress) * 0.94);
        }
      }
      if (curState === 'thinking') {
        eyeScaleY *= 0.78 + 0.15 * Math.sin(elapsed * 4.0);
      }
      leftEye.scale.y = eyeScaleY;
      rightEye.scale.y = eyeScaleY;

      // 4. Eye & Halo Emissive Intensity by State
      const targetEyeEmissive =
        curState === 'speaking'
          ? 2.1 + curVol * 1.2
          : curState === 'thinking'
          ? 1.6 + 0.7 * Math.sin(elapsed * 5.0)
          : curState === 'listening'
          ? 2.2
          : 1.7;
      eyeGlowMat.emissiveIntensity = THREE.MathUtils.damp(
        eyeGlowMat.emissiveIntensity,
        targetEyeEmissive,
        8,
        dt
      );

      // 5. Orbiting Halo Rings speed & tilt
      const orbitSpeed = curState === 'thinking' ? 2.6 : curState === 'speaking' ? 1.35 : 0.55;
      outerHalo.rotation.z += dt * orbitSpeed;
      innerHalo.rotation.z -= dt * orbitSpeed * 1.25;
      orbitGroup.rotation.y = Math.sin(elapsed * 0.7) * 0.25;

      // 6. Mouth Equalizer Bars Animation
      for (let i = 0; i < mouthBars.length; i++) {
        const bar = mouthBars[i];
        const centerWeight = i === 2 ? 1.35 : i === 1 || i === 3 ? 1.05 : 0.72;
        let targetBarScaleY = 0.25;

        if (curState === 'speaking') {
          const activeVol = curVol > 0.04 ? curVol : 0.45 + 0.35 * Math.abs(Math.sin(elapsed * 8.5 + i));
          const wave = 0.55 + 0.45 * Math.abs(Math.sin(elapsed * 14 + i * 1.3));
          targetBarScaleY = Math.max(0.28, (0.35 + activeVol * 2.4 * wave) * centerWeight);
        } else if (curState === 'listening') {
          const listenVol = curVol > 0.02 ? curVol * 1.8 : 0.22 + 0.18 * Math.sin(elapsed * 5 + i);
          targetBarScaleY = Math.max(0.25, (0.3 + listenVol) * centerWeight);
        } else if (curState === 'thinking') {
          targetBarScaleY = 0.28 + 0.22 * Math.max(0, Math.sin(elapsed * 6 - i * 0.7));
        } else {
          // Idle subtle smile curve
          targetBarScaleY = i === 2 ? 0.32 : 0.24;
        }

        bar.scale.y = THREE.MathUtils.damp(bar.scale.y, targetBarScaleY, 18, dt);
      }

      mouthBarMat.emissiveIntensity =
        curState === 'speaking' ? 1.8 + curVol * 1.5 : curState === 'listening' ? 1.5 : 0.9;

      renderer.render(scene, camera);
    };

    const startLoop = () => {
      if (rafId === null && isPageVisible && isInViewport) {
        lastTime = performance.now();
        rafId = requestAnimationFrame(animate);
      }
    };

    const stopLoop = () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    };

    const handleVisibilityChange = () => {
      isPageVisible = !document.hidden;
      if (isPageVisible) startLoop();
      else stopLoop();
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    let observer: IntersectionObserver | null = null;
    if (typeof IntersectionObserver !== 'undefined') {
      observer = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          isInViewport = Boolean(entry?.isIntersecting);
          if (isInViewport) startLoop();
          else stopLoop();
        },
        { threshold: 0.05 }
      );
      observer.observe(container);
    }

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver((entries) => {
        const entry = entries[0];
        if (!entry) return;
        const w = Math.max(entry.contentRect.width, 120);
        const h = Math.max(entry.contentRect.height, 100);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      });
      resizeObserver.observe(container);
    }

    const handleContextLost = (e: Event) => {
      e.preventDefault();
      stopLoop();
      setWebglSupported(false);
    };
    renderer.domElement.addEventListener('webglcontextlost', handleContextLost, false);

    startLoop();

    return () => {
      stopLoop();
      window.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      observer?.disconnect();
      resizeObserver?.disconnect();
      renderer.domElement.removeEventListener('webglcontextlost', handleContextLost);

      scene.traverse((obj) => {
        if ((obj as THREE.Mesh).isMesh) {
          const mesh = obj as THREE.Mesh;
          mesh.geometry?.dispose();
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach((m) => m.dispose());
          } else {
            mesh.material?.dispose();
          }
        }
      });

      envTarget.dispose();
      pmremGenerator.dispose();
      renderer.dispose();
    };
  }, [collapsed]);

  const badgeText =
    statusLabel ||
    (state === 'speaking'
      ? 'Sage is speaking...'
      : state === 'thinking'
      ? 'Sage is thinking...'
      : state === 'listening'
      ? 'Listening to you...'
      : 'Sage AI Tutor Ready');

  if (collapsed) {
    return (
      <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-[#111318] border border-[#D4A017]/25 text-white shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-full bg-[#F4C430]/15 border border-[#F4C430]/40 flex items-center justify-center text-[#F4C430] text-[11px] font-bold">
            S
          </div>
          <span className="text-xs font-semibold text-white/90">{badgeText}</span>
        </div>
        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="inline-flex items-center gap-1 text-[11px] font-medium text-[#F4C430] hover:text-[#FFE066] transition-colors px-2 py-1 rounded-lg hover:bg-white/5"
          >
            <span>Show 3D Tutor</span>
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      className={`relative w-full rounded-2xl overflow-hidden bg-gradient-to-b from-[#101217] via-[#151821] to-[#0D0F14] border border-[#D4A017]/30 shadow-md transition-all duration-300 ${
        compact ? 'h-36 sm:h-44' : 'h-48 sm:h-56'
      }`}
    >
      {/* Subtle radial gold studio backdrop glow */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            state === 'speaking'
              ? 'radial-gradient(circle at 50% 45%, rgba(244, 196, 48, 0.22), transparent 68%)'
              : state === 'thinking'
              ? 'radial-gradient(circle at 50% 45%, rgba(244, 196, 48, 0.18), transparent 65%)'
              : 'radial-gradient(circle at 50% 45%, rgba(244, 196, 48, 0.11), transparent 62%)',
        }}
      />

      {webglSupported ? (
        <div ref={mountRef} className="w-full h-full flex items-center justify-center" />
      ) : (
        /* Clean 2D Animated Fallback if WebGL is disabled or context lost */
        <div className="w-full h-full flex flex-col items-center justify-center p-4">
          <div className="relative w-20 h-20 rounded-full bg-[#181B24] border-2 border-[#F4C430] flex flex-col items-center justify-center shadow-lg">
            <div className="flex items-center gap-3 mb-2">
              <span className="w-2.5 h-3.5 rounded-full bg-[#F4C430]" />
              <span className="w-2.5 h-3.5 rounded-full bg-[#F4C430]" />
            </div>
            <div className="flex items-center gap-1 h-3">
              {[0, 1, 2, 3, 4].map((idx) => (
                <span
                  key={idx}
                  className="w-1 rounded-full bg-[#F4C430] transition-all duration-150"
                  style={{
                    height:
                      state === 'speaking'
                        ? `${Math.max(4, Math.min(14, (audioLevel || 0.6) * 14))}px`
                        : '4px',
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Status pill & Collapse toggle */}
      <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between pointer-events-none">
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-black/65 backdrop-blur-md border border-[#F4C430]/25 text-[11px] font-medium text-[#F9E27D]">
          {state === 'speaking' && <Volume2 className="w-3.5 h-3.5 text-[#F4C430] animate-pulse" />}
          <span>{badgeText}</span>
        </div>

        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="pointer-events-auto inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-black/65 hover:bg-black/85 backdrop-blur-md border border-white/10 text-[11px] font-medium text-gray-300 hover:text-white transition-colors"
            title="Minimize 3D Avatar"
          >
            <span>Minimize</span>
            <ChevronUp className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
};

export default Sage3DAvatar;
