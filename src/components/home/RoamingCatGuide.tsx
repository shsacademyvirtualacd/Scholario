import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import {
  X,
  Send,
  Volume2,
  VolumeX,
  Pin,
  PinOff,
  ArrowRight,
  Minimize2,
} from 'lucide-react';
import {
  PUBLIC_GUIDE_QUICK_CHIPS,
  ROAMING_TANGO_SECTION_BUBBLES,
  RoamingSectionBubble,
  getPublicGuideLocalAnswer,
  stripTangoStarsUnicode,
  truncateByCodePoints,
} from '../../data/academyKnowledge';

// ─── Tunable Turtle-Speed Roaming Constants ─────────────────────────────────
export const ROAM_SPEED_PX_PER_SEC = 20; // Desktop walking speed (15–25 px/sec range)
export const ROAM_SPEED_MOBILE_PX_PER_SEC = 14; // Mobile walking speed (10–18 px/sec range)
export const ROAM_IDLE_MIN_MS = 6000; // Minimum pause/idle duration after each move (6s)
export const ROAM_IDLE_MAX_MS = 12000; // Maximum pause/idle duration after each move (12s)
export const POINTER_HOP_DISTANCE_PX = 26; // Small, gentle pointer-avoidance step distance
export const POINTER_HOP_SPEED_PX_PER_SEC = 20; // Calm speed for pointer-avoidance hop

const TANGO_STAY_STORAGE_KEY = 'scholario_tango_stay_here_v1';
const TANGO_DISMISS_STORAGE_KEY = 'scholario_tango_minimized_v1';

export type TangoGuideState = 'idle' | 'walking' | 'thinking' | 'speaking' | 'poke';

export interface PublicTangoGuideProps {
  onNavigate?: (page: string) => void;
  /** Optional config flag if ever enabled outside home page */
  enabled?: boolean;
}

export type RoamingCatGuideProps = PublicTangoGuideProps;

interface TangoChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface TangoWalkSegment {
  active: boolean;
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  startTime: number;
  durationMs: number;
  arcOffset: number;
  nextIdleDoneTime: number;
}

function getRandomIdlePauseMs(): number {
  return ROAM_IDLE_MIN_MS + Math.random() * (ROAM_IDLE_MAX_MS - ROAM_IDLE_MIN_MS);
}

/**
 * Self-contained browser speech helper for Tango on the public home page.
 */
function stopTangoVoice(): void {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      // ignore
    }
  }
}

function speakTangoVoice(
  rawText: string,
  onStart?: () => void,
  onEnd?: () => void
): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    onEnd?.();
    return;
  }
  try {
    window.speechSynthesis.cancel();
    const cleanText = stripTangoStarsUnicode(rawText)
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/[*_#`~]/g, '')
      .replace(/[🐱🐾🎓👨‍👩‍👧🚀📚💡📱📧👋😊]/gu, '')
      .trim();
    if (!cleanText) {
      onEnd?.();
      return;
    }
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.02;
    utterance.pitch = 1.08;
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(
      (v) =>
        v.lang.startsWith('en') &&
        /samantha|moira|fiona|tessa|neerja|aria|natural|female/i.test(v.name)
    );
    if (preferred) utterance.voice = preferred;
    utterance.onstart = () => onStart?.();
    utterance.onend = () => onEnd?.();
    utterance.onerror = () => onEnd?.();
    window.speechSynthesis.speak(utterance);
  } catch {
    onEnd?.();
  }
}

/**
 * Procedural soft plush bump texture for Tango's 3D coat
 */
function createTangoPlushBumpTexture(): THREE.CanvasTexture | null {
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, 128, 128);

  for (let i = 0; i < 1800; i++) {
    const x = Math.random() * 128;
    const y = Math.random() * 128;
    const shade = 112 + Math.floor(Math.random() * 34);
    ctx.fillStyle = `rgb(${shade},${shade},${shade})`;
    ctx.beginPath();
    ctx.arc(x, y, 0.9 + Math.random() * 1.1, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(4, 4);
  return tex;
}

/**
 * 2D SVG Portrait of Tango the Orange Tabby Cat Guide (Zero stars, fully transparent)
 */
export const TangoGuideSvg: React.FC<{
  state?: TangoGuideState;
  svgSize?: number;
  uid?: string;
}> = ({ state = 'idle', svgSize = 36, uid = 'tango' }) => {
  const isThinking = state === 'thinking';
  const isHappy = state === 'poke';
  const isSpeaking = state === 'speaking';

  const gradBodyId = `tangoBody-${uid}`;
  const gradGoldId = `tangoGold-${uid}`;

  return (
    <svg
      width={svgSize}
      height={svgSize}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Tango the Academy Guide Cat"
      className="select-none pointer-events-none bg-transparent"
    >
      <defs>
        <radialGradient id={gradBodyId} cx="50%" cy="38%" r="58%">
          <stop offset="0%" stopColor="#FFF7ED" />
          <stop offset="68%" stopColor="#FB923C" />
          <stop offset="100%" stopColor="#EA580C" />
        </radialGradient>
        <linearGradient id={gradGoldId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFE066" />
          <stop offset="55%" stopColor="#F4C430" />
          <stop offset="100%" stopColor="#C69214" />
        </linearGradient>
      </defs>

      {/* Playful Orange Tabby Tail */}
      <path
        d="M47 46C55 44 59 35 55 28C53 25 50 27 51 31C52 35 49 41 44 43"
        stroke="#EA580C"
        strokeWidth="4.5"
        strokeLinecap="round"
        fill="none"
      />

      {/* Pointed Fluffy Cat Ears */}
      <path
        d="M13 26L10 9L25 16Z"
        fill={`url(#${gradBodyId})`}
        stroke="#C2410C"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <path d="M14.5 23L12.5 12.5L22 17Z" fill="#FDE047" opacity="0.85" />
      <path
        d="M51 26L54 9L39 16Z"
        fill={`url(#${gradBodyId})`}
        stroke="#C2410C"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <path d="M49.5 23L51.5 12.5L42 17Z" fill="#FDE047" opacity="0.85" />

      {/* Tiny Gold Pencil Tucked Behind Right Ear */}
      <g transform="translate(49, 16) rotate(32)">
        <rect
          x="-1.8"
          y="-9"
          width="3.6"
          height="14"
          rx="1"
          fill="#F4C430"
          stroke="#78350F"
          strokeWidth="0.7"
        />
        <polygon points="-1.8,-9 1.8,-9 0,-13" fill="#FDE68A" />
        <polygon points="-0.8,-11.2 0.8,-11.2 0,-13" fill="#18181B" />
        <rect x="-1.8" y="3.5" width="3.6" height="2.5" rx="0.6" fill="#FB7185" />
      </g>

      {/* Squishy Orange Tabby Head + Forehead Stripes + Whiskers */}
      <ellipse
        cx="32"
        cy="34"
        rx="20.5"
        ry="18.2"
        fill={`url(#${gradBodyId})`}
        stroke="#C2410C"
        strokeWidth="1.2"
      />
      <path d="M32 16.5V22.5" stroke="#9A3412" strokeWidth="2.2" strokeLinecap="round" opacity="0.7" />
      <path d="M27.5 17.5L29 22" stroke="#9A3412" strokeWidth="1.8" strokeLinecap="round" opacity="0.65" />
      <path d="M36.5 17.5L35 22" stroke="#9A3412" strokeWidth="1.8" strokeLinecap="round" opacity="0.65" />

      <line x1="8" y1="33" x2="15" y2="34.5" stroke="#7C2D12" strokeWidth="1.1" strokeLinecap="round" opacity="0.65" />
      <line x1="7.5" y1="37" x2="15" y2="37" stroke="#7C2D12" strokeWidth="1.1" strokeLinecap="round" opacity="0.65" />
      <line x1="56" y1="33" x2="49" y2="34.5" stroke="#7C2D12" strokeWidth="1.1" strokeLinecap="round" opacity="0.65" />
      <line x1="56.5" y1="37" x2="49" y2="37" stroke="#7C2D12" strokeWidth="1.1" strokeLinecap="round" opacity="0.65" />

      {/* Pink Cat Nose */}
      <polygon points="32,34.5 29.8,32.2 34.2,32.2" fill="#FB7185" />

      {/* Gold & Obsidian Scarf */}
      <path
        d="M17 47.5C21.2 50.8 26.4 52.2 32 52.2C37.6 52.2 42.8 50.8 47 47.5C48.2 50.2 46.8 53.5 43.2 54.6C36 56.8 28 56.8 20.8 54.6C17.2 53.5 15.8 50.2 17 47.5Z"
        fill={`url(#${gradGoldId})`}
      />
      <path
        d="M19.5 50.6C27.5 53.3 36.5 53.3 44.5 50.6"
        stroke="#18181B"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <circle cx="40.5" cy="51.5" r="2.3" fill="#FFFDF7" stroke="#18181B" strokeWidth="0.8" />

      {/* Soft Blush Cheeks */}
      <ellipse cx="19.5" cy="36.5" rx="3.8" ry="2.3" fill="#FF9EAA" opacity={isHappy ? 0.75 : 0.45} />
      <ellipse cx="44.5" cy="36.5" rx="3.8" ry="2.3" fill="#FF9EAA" opacity={isHappy ? 0.75 : 0.45} />

      {/* Expressive Eyes (Round Highlights Only — No Stars) */}
      {isHappy ? (
        <>
          <path d="M20.5 31.5C21.8 28.8 25.2 28.8 26.5 31.5" stroke="#1E1B18" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M37.5 31.5C38.8 28.8 42.2 28.8 43.5 31.5" stroke="#1E1B18" strokeWidth="2.5" strokeLinecap="round" />
        </>
      ) : (
        <>
          <ellipse cx="23.5" cy={isThinking ? 30.2 : 31.2} rx="3.9" ry="4.3" fill="#1E1B18" />
          <circle cx="22.3" cy={isThinking ? 28.8 : 29.8} r="1.35" fill="#FFFFFF" />
          <circle cx="24.7" cy={isThinking ? 31.3 : 32.3} r="0.65" fill="#FFFFFF" opacity="0.85" />

          <ellipse cx="40.5" cy={isThinking ? 30.2 : 31.2} rx="3.9" ry="4.3" fill="#1E1B18" />
          <circle cx="39.3" cy={isThinking ? 28.8 : 29.8} r="1.35" fill="#FFFFFF" />
          <circle cx="41.7" cy={isThinking ? 31.3 : 32.3} r="0.65" fill="#FFFFFF" opacity="0.85" />
        </>
      )}

      {/* Mouth */}
      {isSpeaking ? (
        <ellipse cx="32" cy="37" rx="2.6" ry="3.1" fill="#29221E" />
      ) : isThinking ? (
        <circle cx="32" cy="37" r="1.7" fill="#29221E" />
      ) : (
        <path
          d="M28.5 36.2C29.8 38 31.5 37.5 32 35.8C32.5 37.5 34.2 38 35.5 36.2"
          stroke="#29221E"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </svg>
  );
};

/**
 * Dedicated 3D WebGL Avatar for Tango on the public home page.
 * Features slow turtle-speed walk cycle (paws, body bob, tail, accessories)
 * synced to `walkIntensity`, calm idle breathing/blinking/looking around,
 * transparent alpha canvas (zero white sheet), and zero stars.
 */
const TangoGuide3DAvatar: React.FC<{
  state: TangoGuideState;
  walkIntensity: number;
  roamLeanX: number;
  pokeCount: number;
}> = ({ state, walkIntensity, roamLeanX, pokeCount }) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [webglSupported, setWebglSupported] = useState(true);
  const [webglReady, setWebglReady] = useState(false);

  const stateRef = useRef<TangoGuideState>(state);
  const walkIntensityRef = useRef<number>(walkIntensity);
  const roamLeanXRef = useRef<number>(roamLeanX);
  const pokeCountRef = useRef<number>(pokeCount);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    walkIntensityRef.current = walkIntensity;
  }, [walkIntensity]);

  useEffect(() => {
    roamLeanXRef.current = roamLeanX;
  }, [roamLeanX]);

  useEffect(() => {
    pokeCountRef.current = pokeCount;
  }, [pokeCount]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

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

    const currentDpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.max(container.clientWidth, 80);
    const height = Math.max(container.clientHeight, 80);

    renderer.setPixelRatio(currentDpr);
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 0);
    renderer.setClearAlpha(0);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.18;
    renderer.domElement.style.background = 'transparent';
    renderer.domElement.style.backgroundColor = 'transparent';
    renderer.domElement.style.display = 'block';

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(32, width / height, 0.1, 50);
    camera.position.set(0, 0.05, 4.45);

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const envTarget = pmremGenerator.fromScene(new RoomEnvironment(), 0.05);
    scene.environment = envTarget.texture;

    const hemiLight = new THREE.HemisphereLight(0xfffdf9, 0xf3e5c8, 1.35);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfffaf0, 1.65);
    keyLight.position.set(2.4, 3.6, 4.2);
    scene.add(keyLight);

    const warmFillLight = new THREE.PointLight(0xffefc2, 1.15, 12);
    warmFillLight.position.set(-2.6, 0.8, 3.0);
    scene.add(warmFillLight);

    const goldRimLight = new THREE.DirectionalLight(0xf59e0b, 1.1);
    goldRimLight.position.set(0, 2.2, -3.5);
    scene.add(goldRimLight);

    const plushBumpTex = createTangoPlushBumpTexture();

    // Materials (No star materials or geometries)
    const tangoOrangeMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#FB923C'),
      roughness: 0.76,
      metalness: 0.01,
      sheen: 1.0,
      sheenRoughness: 0.78,
      sheenColor: new THREE.Color('#FFEDD5'),
      bumpMap: plushBumpTex || undefined,
      bumpScale: 0.016,
    });

    const tangoStripeMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#9A3412'),
      roughness: 0.82,
    });

    const tangoEarInnerMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#FDA4AF'),
      roughness: 0.85,
    });

    const goldMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#F4C430'),
      roughness: 0.35,
      metalness: 0.8,
      emissive: new THREE.Color('#C69214'),
      emissiveIntensity: 0.15,
    });

    const goldBrightMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#FFE066'),
      roughness: 0.25,
      metalness: 0.82,
      emissive: new THREE.Color('#F4C430'),
      emissiveIntensity: 0.22,
    });

    const obsidianMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#18181B'),
      roughness: 0.42,
      metalness: 0.25,
    });

    const whiteMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#F8FAFC'),
      roughness: 0.55,
      metalness: 0.05,
    });

    const eyeDarkMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#1E1B18'),
      roughness: 0.12,
      metalness: 0.05,
      clearcoat: 1.0,
      clearcoatRoughness: 0.08,
    });

    const catchlightMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color('#FFFFFF'),
    });

    const blushMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color('#FF9EAA'),
      transparent: true,
      opacity: 0.52,
      depthWrite: false,
    });

    const mouthDarkMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#29221E'),
      roughness: 0.5,
      metalness: 0.05,
    });

    const mouthInnerMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color('#E56B6F'),
    });

    const tangoRoot = new THREE.Group();
    scene.add(tangoRoot);

    const tangoGroup = new THREE.Group();
    tangoRoot.add(tangoGroup);

    // Squishy Tabby Head + Body
    const tangoHeadGeo = new THREE.SphereGeometry(0.92, 48, 48);
    tangoHeadGeo.scale(1.08, 0.94, 0.98);
    const tangoHeadMesh = new THREE.Mesh(tangoHeadGeo, tangoOrangeMat);
    tangoGroup.add(tangoHeadMesh);

    // Tabby Stripes on Forehead
    [-0.16, 0, 0.16].forEach((sx, idx) => {
      const stripe = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.028, idx === 1 ? 0.24 : 0.18, 8, 12),
        tangoStripeMat
      );
      stripe.position.set(sx, 0.56, 0.74);
      stripe.rotation.set(0.52, 0, sx * -0.4);
      tangoGroup.add(stripe);
    });

    // Pointed Cat Ears
    const tangoLeftEar = new THREE.Group();
    tangoLeftEar.position.set(-0.62, 0.72, 0.05);
    tangoLeftEar.rotation.set(0.08, 0, 0.35);
    tangoGroup.add(tangoLeftEar);
    const catEarConeGeo = new THREE.ConeGeometry(0.28, 0.52, 24);
    const tangoLeftEarMesh = new THREE.Mesh(catEarConeGeo, tangoOrangeMat);
    tangoLeftEar.add(tangoLeftEarMesh);
    const catEarInnerConeGeo = new THREE.ConeGeometry(0.16, 0.34, 16);
    const tangoLeftEarInner = new THREE.Mesh(catEarInnerConeGeo, tangoEarInnerMat);
    tangoLeftEarInner.position.set(0, -0.02, 0.11);
    tangoLeftEar.add(tangoLeftEarInner);

    const tangoRightEar = new THREE.Group();
    tangoRightEar.position.set(0.62, 0.72, 0.05);
    tangoRightEar.rotation.set(0.08, 0, -0.35);
    tangoGroup.add(tangoRightEar);
    const tangoRightEarMesh = new THREE.Mesh(catEarConeGeo, tangoOrangeMat);
    tangoRightEar.add(tangoRightEarMesh);
    const tangoRightEarInner = new THREE.Mesh(catEarInnerConeGeo, tangoEarInnerMat);
    tangoRightEarInner.position.set(0, -0.02, 0.11);
    tangoRightEar.add(tangoRightEarInner);

    // Tiny Gold Pencil Tucked Behind Right Ear
    const pencilGroup = new THREE.Group();
    pencilGroup.position.set(0.76, 0.58, 0.16);
    pencilGroup.rotation.set(0.25, 0.15, -0.58);
    tangoGroup.add(pencilGroup);
    const pencilShaft = new THREE.Mesh(
      new THREE.CylinderGeometry(0.036, 0.036, 0.46, 12),
      goldBrightMat
    );
    pencilGroup.add(pencilShaft);
    const pencilTip = new THREE.Mesh(new THREE.ConeGeometry(0.036, 0.12, 12), obsidianMat);
    pencilTip.position.y = 0.29;
    pencilGroup.add(pencilTip);
    const pencilEraser = new THREE.Mesh(
      new THREE.CylinderGeometry(0.036, 0.036, 0.08, 12),
      tangoEarInnerMat
    );
    pencilEraser.position.y = -0.26;
    pencilGroup.add(pencilEraser);

    // Pink Triangular Cat Nose & Whiskers
    const catNose = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.065, 12), tangoEarInnerMat);
    catNose.position.set(0, 0.01, 0.94);
    catNose.rotation.x = Math.PI;
    tangoGroup.add(catNose);

    [-1, 1].forEach((side) => {
      [-0.04, 0.04].forEach((wy, wIdx) => {
        const whisker = new THREE.Mesh(
          new THREE.CylinderGeometry(0.008, 0.008, 0.34, 8),
          tangoStripeMat
        );
        whisker.rotation.z = Math.PI / 2 + side * (wIdx === 0 ? 0.14 : -0.1);
        whisker.position.set(side * 0.72, -0.04 + wy, 0.68);
        tangoGroup.add(whisker);
      });
    });

    // Tango Gold & Obsidian Scarf (Clean torus ring — no star pins)
    const tangoScarf = new THREE.Group();
    tangoScarf.position.set(0, -0.66, 0.02);
    tangoGroup.add(tangoScarf);
    const scarfRingGeo = new THREE.TorusGeometry(0.66, 0.135, 20, 48);
    scarfRingGeo.scale(1.06, 0.85, 1.02);
    const tangoScarfRing = new THREE.Mesh(scarfRingGeo, goldMat);
    tangoScarfRing.rotation.x = Math.PI / 2 + 0.08;
    tangoScarf.add(tangoScarfRing);
    const tangoScarfStripe = new THREE.Mesh(
      new THREE.TorusGeometry(0.68, 0.045, 12, 36),
      obsidianMat
    );
    tangoScarfStripe.rotation.x = Math.PI / 2 + 0.08;
    tangoScarfStripe.position.y = -0.03;
    tangoScarf.add(tangoScarfStripe);

    // Tango Swishing Tail Pivot
    const tangoTailPivot = new THREE.Group();
    tangoTailPivot.position.set(0.55, -0.58, -0.55);
    tangoGroup.add(tangoTailPivot);
    const tailSeg1 = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.11, 0.48, 12, 16),
      tangoOrangeMat
    );
    tailSeg1.position.set(0.28, 0.25, 0);
    tailSeg1.rotation.z = -0.65;
    tangoTailPivot.add(tailSeg1);
    const tailTip = new THREE.Mesh(new THREE.SphereGeometry(0.125, 16, 16), whiteMat);
    tailTip.position.set(0.45, 0.48, 0);
    tangoTailPivot.add(tailTip);

    // Tango Paws (Animated slowly during walking so feet never slide or run)
    const footGeo = new THREE.SphereGeometry(0.19, 20, 16);
    footGeo.scale(1.15, 0.58, 1.3);
    const tangoLeftPaw = new THREE.Mesh(footGeo, whiteMat);
    tangoLeftPaw.position.set(-0.34, -0.92, 0.14);
    tangoLeftPaw.rotation.y = 0.16;
    tangoGroup.add(tangoLeftPaw);
    const tangoRightPaw = new THREE.Mesh(footGeo, whiteMat);
    tangoRightPaw.position.set(0.34, -0.92, 0.14);
    tangoRightPaw.rotation.y = -0.16;
    tangoGroup.add(tangoRightPaw);

    // Tango Arms
    const armGeo = new THREE.CapsuleGeometry(0.14, 0.24, 12, 16);
    const leftArmPivot = new THREE.Group();
    leftArmPivot.position.set(-0.84, -0.18, 0.12);
    leftArmPivot.rotation.z = 0.42;
    tangoGroup.add(leftArmPivot);
    const leftArmMesh = new THREE.Mesh(armGeo, tangoOrangeMat);
    leftArmMesh.position.y = -0.14;
    leftArmPivot.add(leftArmMesh);

    const rightArmPivot = new THREE.Group();
    rightArmPivot.position.set(0.84, -0.18, 0.12);
    rightArmPivot.rotation.z = -0.42;
    tangoGroup.add(rightArmPivot);
    const rightArmMesh = new THREE.Mesh(armGeo, tangoOrangeMat);
    rightArmMesh.position.y = -0.14;
    rightArmPivot.add(rightArmMesh);

    // Face Features (Round Glossy Eyes with Spherical Highlights — No Stars)
    const faceGroup = new THREE.Group();
    faceGroup.position.set(0, 0.03, 0.87);
    tangoGroup.add(faceGroup);

    const eyeGeo = new THREE.SphereGeometry(0.135, 24, 24);
    eyeGeo.scale(0.92, 1.08, 0.42);
    const bigGlintGeo = new THREE.SphereGeometry(0.038, 12, 12);

    const leftEyeGroup = new THREE.Group();
    leftEyeGroup.position.set(-0.31, 0.08, 0);
    faceGroup.add(leftEyeGroup);
    leftEyeGroup.add(new THREE.Mesh(eyeGeo, eyeDarkMat));
    const leftGlint = new THREE.Mesh(bigGlintGeo, catchlightMat);
    leftGlint.position.set(-0.036, 0.048, 0.052);
    leftEyeGroup.add(leftGlint);

    const rightEyeGroup = new THREE.Group();
    rightEyeGroup.position.set(0.31, 0.08, 0);
    faceGroup.add(rightEyeGroup);
    rightEyeGroup.add(new THREE.Mesh(eyeGeo, eyeDarkMat));
    const rightGlint = new THREE.Mesh(bigGlintGeo, catchlightMat);
    rightGlint.position.set(-0.036, 0.048, 0.052);
    rightEyeGroup.add(rightGlint);

    // Happy Eye Arcs (^ ^)
    const happyArcGeo = new THREE.TorusGeometry(0.105, 0.026, 12, 24, Math.PI * 0.85);
    const leftHappyEye = new THREE.Mesh(happyArcGeo, mouthDarkMat);
    leftHappyEye.position.set(-0.31, 0.05, 0.03);
    leftHappyEye.rotation.z = Math.PI * 0.075;
    leftHappyEye.visible = false;
    faceGroup.add(leftHappyEye);

    const rightHappyEye = new THREE.Mesh(happyArcGeo, mouthDarkMat);
    rightHappyEye.position.set(0.31, 0.05, 0.03);
    rightHappyEye.rotation.z = Math.PI * 0.075;
    rightHappyEye.visible = false;
    faceGroup.add(rightHappyEye);

    // Cheek Blush
    const blushGeo = new THREE.CircleGeometry(0.145, 24);
    blushGeo.scale(1.35, 0.78, 1);
    const leftBlush = new THREE.Mesh(blushGeo, blushMat);
    leftBlush.position.set(-0.46, -0.1, -0.02);
    leftBlush.rotation.y = -0.35;
    faceGroup.add(leftBlush);

    const rightBlush = new THREE.Mesh(blushGeo, blushMat);
    rightBlush.position.set(0.46, -0.1, -0.02);
    rightBlush.rotation.y = 0.35;
    faceGroup.add(rightBlush);

    // Mouth
    const smileArcGeo = new THREE.TorusGeometry(0.078, 0.018, 12, 24, Math.PI * 0.82);
    const smileArcMesh = new THREE.Mesh(smileArcGeo, mouthDarkMat);
    smileArcMesh.position.set(0, -0.06, 0.03);
    smileArcMesh.rotation.z = Math.PI * 1.09;
    faceGroup.add(smileArcMesh);

    const openMouthGroup = new THREE.Group();
    openMouthGroup.position.set(0, -0.11, 0.03);
    openMouthGroup.visible = false;
    faceGroup.add(openMouthGroup);

    const openMouthOuterGeo = new THREE.SphereGeometry(0.075, 16, 16);
    openMouthOuterGeo.scale(1.1, 0.85, 0.3);
    openMouthGroup.add(new THREE.Mesh(openMouthOuterGeo, mouthDarkMat));

    const openMouthTongueGeo = new THREE.SphereGeometry(0.048, 12, 12);
    openMouthTongueGeo.scale(1.05, 0.65, 0.32);
    const openMouthTongue = new THREE.Mesh(openMouthTongueGeo, mouthInnerMat);
    openMouthTongue.position.set(0, -0.018, 0.008);
    openMouthGroup.add(openMouthTongue);

    // Subtle pointer tracking
    const targetPointer = { x: 0, y: 0 };
    const currentPointer = { x: 0, y: 0 };
    let cachedRect = renderer.domElement.getBoundingClientRect();

    const updateRect = () => {
      if (renderer.domElement && renderer.domElement.isConnected) {
        cachedRect = renderer.domElement.getBoundingClientRect();
      }
    };

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const handlePointerMove = (e: PointerEvent) => {
      if (prefersReducedMotion) return;
      if (cachedRect.width < 10) updateRect();
      const cx = cachedRect.left + cachedRect.width * 0.5;
      const cy = cachedRect.top + cachedRect.height * 0.5;
      const maxRx = Math.max(window.innerWidth * 0.5, 220);
      const maxRy = Math.max(window.innerHeight * 0.5, 220);
      targetPointer.x = Math.max(-1, Math.min(1, (e.clientX - cx) / maxRx));
      targetPointer.y = Math.max(-1, Math.min(1, -(e.clientY - cy) / maxRy));
    };

    const handlePointerLeave = () => {
      targetPointer.x = 0;
      targetPointer.y = 0;
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('resize', updateRect, { passive: true });
    document.addEventListener('mouseleave', handlePointerLeave);

    let rafId: number | null = null;
    const clock = new THREE.Clock();
    let nextBlinkTime = 2.6 + Math.random() * 3.0;
    let blinkStart = -1;
    let hasMarkedReady = false;

    const smoothRot = { x: 0, y: 0, z: 0 };
    const smoothPos = { x: 0, y: 0 };
    let smoothWalk = 0;

    const animate = () => {
      rafId = requestAnimationFrame(animate);
      const delta = Math.min(clock.getDelta(), 0.1);
      const t = clock.getElapsedTime();

      const curState = stateRef.current;
      const targetWalk = prefersReducedMotion ? 0 : Math.max(0, Math.min(1, walkIntensityRef.current));
      smoothWalk += (targetWalk - smoothWalk) * Math.min(1, delta * 5.0);
      const roamLean = roamLeanXRef.current || 0;

      const pDamp = Math.min(1, delta * 4.5);
      currentPointer.x += (targetPointer.x - currentPointer.x) * pDamp;
      currentPointer.y += (targetPointer.y - currentPointer.y) * pDamp;

      // Slow, calm walk phase (~0.33 steps/sec so feet never look like they are sliding or running)
      const walkPhase = t * 2.1;

      // Idle calm breathing + slow look around during the 6–12s pause
      const idleBreathY = Math.sin(t * 1.15) * 0.018;
      const idleLookY = Math.sin(t * 0.42) * 0.09 * (1 - smoothWalk * 0.7);
      const idleTiltZ = Math.sin(t * 0.55) * 0.022 * (1 - smoothWalk * 0.5);

      // Slow vertical walk bobbing matched to turtle speed
      const walkBobY = Math.abs(Math.sin(walkPhase)) * 0.022 * smoothWalk;
      const walkSwayZ = Math.sin(walkPhase) * 0.025 * smoothWalk;

      let targetRotX = -currentPointer.y * 0.16;
      let targetRotY = currentPointer.x * 0.24 + roamLean * 0.22 + idleLookY;
      let targetRotZ = -currentPointer.x * 0.05 - roamLean * 0.08 + idleTiltZ + walkSwayZ;
      let targetPosY = idleBreathY + walkBobY;

      if (prefersReducedMotion) {
        targetRotX = 0;
        targetRotY = 0;
        targetRotZ = 0;
        targetPosY = 0;
      } else if (curState === 'thinking') {
        targetRotX = -0.1 + Math.sin(t * 1.5) * 0.03;
        targetRotY = 0.15 + Math.cos(t * 1.1) * 0.06;
        targetRotZ = -0.1;
      } else if (curState === 'speaking') {
        targetRotX = Math.sin(t * 5.5) * 0.04;
        targetPosY += Math.abs(Math.sin(t * 4.2)) * 0.025;
      } else if (curState === 'poke') {
        targetPosY += Math.abs(Math.sin(t * 5.0)) * 0.08;
        targetRotZ += Math.sin(t * 4.5) * 0.06;
      }

      const poseDamp = Math.min(1, delta * 6.0);
      smoothRot.x += (targetRotX - smoothRot.x) * poseDamp;
      smoothRot.y += (targetRotY - smoothRot.y) * poseDamp;
      smoothRot.z += (targetRotZ - smoothRot.z) * poseDamp;
      smoothPos.y += (targetPosY - smoothPos.y) * poseDamp;

      tangoGroup.position.y = smoothPos.y;
      tangoGroup.rotation.set(smoothRot.x, smoothRot.y, smoothRot.z);

      // Slow paw stepping matched to walkIntensity (rests flat when idling)
      const leftStepLift = Math.max(0, Math.sin(walkPhase)) * 0.045 * smoothWalk;
      const leftStepFwd = Math.cos(walkPhase) * 0.048 * smoothWalk;
      const rightStepLift = Math.max(0, Math.sin(walkPhase + Math.PI)) * 0.045 * smoothWalk;
      const rightStepFwd = Math.cos(walkPhase + Math.PI) * 0.048 * smoothWalk;

      tangoLeftPaw.position.set(-0.34, -0.92 + leftStepLift, 0.14 + leftStepFwd);
      tangoRightPaw.position.set(0.34, -0.92 + rightStepLift, 0.14 + rightStepFwd);

      // Slow arm counter-swing & gentle idle rest
      const armWalkSwing = Math.sin(walkPhase) * 0.065 * smoothWalk;
      const armIdleBreath = Math.sin(t * 1.15) * 0.025;
      leftArmPivot.rotation.set(armWalkSwing, 0, 0.42 + armIdleBreath);
      rightArmPivot.rotation.set(-armWalkSwing, 0, -0.42 - armIdleBreath);

      // Slow, calm tail & ear movement (matched to turtle pace)
      const tailSpeed = curState === 'poke' ? 3.2 : 1.05 + smoothWalk * 0.35;
      tangoTailPivot.rotation.z = Math.sin(t * tailSpeed) * (0.14 + smoothWalk * 0.05);
      tangoTailPivot.rotation.y = Math.cos(t * (tailSpeed * 0.7)) * 0.11;

      const earTwitchL = Math.sin(t * 3.1) > 0.96 ? 0.1 : 0;
      const earTwitchR = Math.cos(t * 2.7) > 0.96 ? -0.1 : 0;
      tangoLeftEar.rotation.z = 0.35 + earTwitchL;
      tangoRightEar.rotation.z = -0.35 + earTwitchR;

      // Cozy slow cat blinking
      const showHappy = curState === 'poke';
      leftHappyEye.visible = showHappy;
      rightHappyEye.visible = showHappy;
      leftEyeGroup.visible = !showHappy;
      rightEyeGroup.visible = !showHappy;

      if (!showHappy) {
        const blinkDur = 0.34;
        if (blinkStart < 0 && t >= nextBlinkTime) {
          blinkStart = t;
        }
        let eyeScaleY = 1.0;
        if (blinkStart >= 0) {
          const prog = (t - blinkStart) / blinkDur;
          if (prog >= 1) {
            blinkStart = -1;
            nextBlinkTime = t + 3.2 + Math.random() * 3.6;
          } else {
            eyeScaleY = Math.max(0.08, 1 - Math.sin(prog * Math.PI) * 0.94);
          }
        }
        const eyeLookX = currentPointer.x * 0.045;
        const eyeLookY = currentPointer.y * 0.035;
        leftEyeGroup.position.set(-0.31 + eyeLookX, 0.08 + eyeLookY, 0);
        rightEyeGroup.position.set(0.31 + eyeLookX, 0.08 + eyeLookY, 0);
        leftEyeGroup.scale.set(1, eyeScaleY, 1);
        rightEyeGroup.scale.set(1, eyeScaleY, 1);
      }

      // Mouth state
      const useOpen = curState === 'speaking' || curState === 'thinking' || curState === 'poke';
      smileArcMesh.visible = !useOpen;
      openMouthGroup.visible = useOpen;
      if (useOpen) {
        const mouthY =
          curState === 'speaking'
            ? 0.4 + Math.abs(Math.sin(t * 11.0)) * 0.65
            : curState === 'poke'
            ? 0.85
            : 0.42;
        openMouthGroup.scale.set(0.95, mouthY, 1);
      }

      renderer.render(scene, camera);
      if (!hasMarkedReady) {
        hasMarkedReady = true;
        setWebglReady(true);
      }
    };

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver((entries) => {
        const entry = entries[0];
        if (!entry) return;
        const w = Math.max(entry.contentRect.width, 68);
        const h = Math.max(entry.contentRect.height, 68);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
        updateRect();
      });
      resizeObserver.observe(container);
    }

    rafId = requestAnimationFrame(animate);

    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('resize', updateRect);
      document.removeEventListener('mouseleave', handlePointerLeave);
      resizeObserver?.disconnect();

      scene.traverse((obj: THREE.Object3D) => {
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
      plushBumpTex?.dispose();
      envTarget.dispose();
      pmremGenerator.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div className="relative w-full h-full flex items-center justify-center bg-transparent border-0 shadow-none select-none">
      {webglSupported && (
        <div
          ref={mountRef}
          className={`w-full h-full relative z-10 bg-transparent border-0 shadow-none transition-opacity duration-200 ${
            webglReady ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        />
      )}
      {(!webglSupported || !webglReady) && (
        <div className="absolute inset-0 flex items-center justify-center z-0 bg-transparent">
          <TangoGuideSvg state={state} svgSize={130} uid="roaming-fallback-tango" />
        </div>
      )}
    </div>
  );
};

export const PublicTangoGuide: React.FC<PublicTangoGuideProps> = ({
  onNavigate,
  enabled = true,
}) => {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const chatPanelRef = useRef<HTMLDivElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const [isFrozen, setIsFrozen] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem(TANGO_STAY_STORAGE_KEY) === '1';
    } catch {
      return false;
    }
  });

  const [isMinimized, setIsMinimized] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem(TANGO_DISMISS_STORAGE_KEY) === '1';
    } catch {
      return false;
    }
  });

  const [chatOpen, setChatOpen] = useState(false);
  const [speakerEnabled, setSpeakerEnabled] = useState(false); // OFF by default, no autoplay
  const [tangoState, setTangoState] = useState<TangoGuideState>('idle');
  const [walkIntensity, setWalkIntensity] = useState(0);
  const [pokeCount, setPokeCount] = useState(0);
  const [roamLeanX, setRoamLeanX] = useState(0);
  const [bubbleFlipLeft, setBubbleFlipLeft] = useState(false);
  const [activeBubble, setActiveBubble] = useState<RoamingSectionBubble | null>(
    ROAMING_TANGO_SECTION_BUBBLES[0]
  );

  const [messages, setMessages] = useState<TangoChatMessage[]>([
    {
      id: 'welcome-tango',
      role: 'assistant',
      content:
        "Meow! I'm **Tango**, your SHS Virtual Academy guide 🐱🐾 Ask me anything about our boards (FBISE, Punjab, Sindh, KPK, O/A Levels, IELTS), fees, live classes, or how to join!",
    },
  ]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);

  const posRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const walkSegRef = useRef<TangoWalkSegment>({
    active: false,
    startX: 0,
    startY: 0,
    targetX: 0,
    targetY: 0,
    startTime: 0,
    durationMs: 0,
    arcOffset: 0,
    nextIdleDoneTime: 0,
  });
  const lastHopTimeRef = useRef<number>(0);
  const lastScrollTargetYRef = useRef<number | null>(null);
  const lastBubbleIndexRef = useRef<number>(0);
  const lastBubbleTimeRef = useRef<number>(Date.now());
  const isFrozenRef = useRef<boolean>(isFrozen);
  const chatOpenRef = useRef<boolean>(chatOpen);

  useEffect(() => {
    isFrozenRef.current = isFrozen;
    try {
      sessionStorage.setItem(TANGO_STAY_STORAGE_KEY, isFrozen ? '1' : '0');
    } catch {
      // ignore
    }
  }, [isFrozen]);

  useEffect(() => {
    chatOpenRef.current = chatOpen;
  }, [chatOpen]);

  useEffect(() => {
    try {
      sessionStorage.setItem(TANGO_DISMISS_STORAGE_KEY, isMinimized ? '1' : '0');
    } catch {
      // ignore
    }
  }, [isMinimized]);

  // Compute responsive avatar pixel size matching clamp(100px, 16vw, 220px)
  const getAvatarPixelSize = useCallback(() => {
    if (typeof window === 'undefined') return 150;
    return Math.round(Math.max(100, Math.min(220, window.innerWidth * 0.16)));
  }, []);

  // Return desktop (20 px/s) or mobile (14 px/s) walking speed
  const getCurrentRoamSpeedPxPerSec = useCallback(() => {
    if (typeof window === 'undefined') return ROAM_SPEED_PX_PER_SEC;
    return window.innerWidth < 768 ? ROAM_SPEED_MOBILE_PX_PER_SEC : ROAM_SPEED_PX_PER_SEC;
  }, []);

  // Compute safe waypoint that avoids no-go zones (navbar, primary buttons, inputs, open chat panel)
  const pickSafeWaypoint = useCallback(
    (preferSectionY?: number) => {
      if (typeof window === 'undefined') return { x: 40, y: 300 };
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const size = getAvatarPixelSize();

      const topSafe = 78; // below top navbar
      const bottomSafe = Math.max(24, vh - size - 32);
      const leftMargin = 16;
      const rightMargin = Math.max(leftMargin + 20, vw - size - 18);

      const noGoSelectors =
        'header, nav, [data-roam-nogo], input, textarea, select, button.bg-gold, a[href*="login"]';
      const noGoRects: DOMRect[] = [];
      try {
        document.querySelectorAll(noGoSelectors).forEach((el) => {
          const r = el.getBoundingClientRect();
          if (r.width > 20 && r.height > 20 && r.bottom > 0 && r.top < vh) {
            noGoRects.push(r);
          }
        });
      } catch {
        // ignore
      }

      for (let attempt = 0; attempt < 12; attempt++) {
        const useRightLane = attempt % 2 === 0 ? Math.random() > 0.35 : Math.random() <= 0.35;
        const laneWidth = Math.min(140, Math.max(36, vw * 0.14));
        const candidateX = useRightLane
          ? Math.max(leftMargin, rightMargin - Math.random() * laneWidth)
          : Math.min(rightMargin, leftMargin + Math.random() * laneWidth);

        const baseY =
          typeof preferSectionY === 'number'
            ? Math.max(topSafe, Math.min(bottomSafe, preferSectionY))
            : topSafe + Math.random() * Math.max(40, bottomSafe - topSafe);

        const catRect = {
          left: candidateX + 12,
          right: candidateX + size - 12,
          top: baseY + 12,
          bottom: baseY + size - 12,
        };

        const overlaps = noGoRects.some(
          (r) =>
            catRect.left < r.right &&
            catRect.right > r.left &&
            catRect.top < r.bottom &&
            catRect.bottom > r.top
        );

        if (!overlaps) {
          return { x: candidateX, y: baseY };
        }
      }

      return {
        x: rightMargin,
        y: Math.max(topSafe, bottomSafe - 16),
      };
    },
    [getAvatarPixelSize]
  );

  // Start a slow, calm walk segment whose duration is strictly distance / speed with ease-in-out
  const beginSlowWalkTo = useCallback(
    (targetX: number, targetY: number, customSpeedPxPerSec?: number) => {
      const now = performance.now();
      const startX = posRef.current.x;
      const startY = posRef.current.y;
      const distance = Math.hypot(targetX - startX, targetY - startY);

      if (distance < 3) {
        walkSegRef.current = {
          active: false,
          startX,
          startY,
          targetX,
          targetY,
          startTime: now,
          durationMs: 0,
          arcOffset: 0,
          nextIdleDoneTime: now + getRandomIdlePauseMs(),
        };
        return;
      }

      const speedPxPerSec = Math.max(
        5,
        customSpeedPxPerSec ?? getCurrentRoamSpeedPxPerSec()
      );
      const durationMs = (distance / speedPxPerSec) * 1000;
      const arcOffset = (Math.random() - 0.5) * Math.min(18, distance * 0.08);

      walkSegRef.current = {
        active: true,
        startX,
        startY,
        targetX,
        targetY,
        startTime: now,
        durationMs,
        arcOffset,
        nextIdleDoneTime: now + durationMs + getRandomIdlePauseMs(),
      };
    },
    [getCurrentRoamSpeedPxPerSec]
  );

  // Initialize starting position & turtle-speed roaming loop
  useEffect(() => {
    if (!enabled || isMinimized || typeof window === 'undefined') return;

    const prefersReducedMotion =
      window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const size = getAvatarPixelSize();

    const startX = Math.max(16, vw - size - 24);
    const startY = Math.max(88, vh - size - 42);

    posRef.current = { x: startX, y: startY };
    const nowInit = performance.now();
    // Initial 6–12 second calm idle pause before Tango takes its first slow walk
    walkSegRef.current = {
      active: false,
      startX,
      startY,
      targetX: startX,
      targetY: startY,
      startTime: nowInit,
      durationMs: 0,
      arcOffset: 0,
      nextIdleDoneTime: nowInit + getRandomIdlePauseMs(),
    };

    if (wrapperRef.current) {
      wrapperRef.current.style.transform = `translate3d(${Math.round(startX)}px, ${Math.round(startY)}px, 0)`;
    }
    setBubbleFlipLeft(startX > vw * 0.48);

    // Gentle pointer-avoidance hop: small, calm step away (never a fast dash)
    const handlePointerMove = (e: PointerEvent) => {
      if (prefersReducedMotion || isFrozenRef.current || chatOpenRef.current) return;
      const now = performance.now();
      if (now - lastHopTimeRef.current < 5500) return;

      const curSize = getAvatarPixelSize();
      const curVw = window.innerWidth;
      const curVh = window.innerHeight;
      const centerX = posRef.current.x + curSize * 0.5;
      const centerY = posRef.current.y + curSize * 0.5;
      const dist = Math.hypot(e.clientX - centerX, e.clientY - centerY);

      if (dist < curSize * 0.36 && dist > 10) {
        lastHopTimeRef.current = now;
        const pushAngle = Math.atan2(centerY - e.clientY, centerX - e.clientX);
        const hopX = Math.max(
          14,
          Math.min(
            curVw - curSize - 14,
            posRef.current.x + Math.cos(pushAngle) * POINTER_HOP_DISTANCE_PX
          )
        );
        const hopY = Math.max(
          76,
          Math.min(
            curVh - curSize - 28,
            posRef.current.y + Math.sin(pushAngle) * POINTER_HOP_DISTANCE_PX
          )
        );
        beginSlowWalkTo(hopX, hopY, POINTER_HOP_SPEED_PX_PER_SEC);
      }
    };
    window.addEventListener('pointermove', handlePointerMove, { passive: true });

    // Slow, smooth scroll-following (never jumps or teleports; walks at turtle speed toward new section)
    const handleScroll = () => {
      const scrollRatio =
        window.scrollY / Math.max(1, document.documentElement.scrollHeight - window.innerHeight);

      if (!prefersReducedMotion && !isFrozenRef.current && !chatOpenRef.current) {
        const targetY =
          96 + scrollRatio * Math.max(80, window.innerHeight - getAvatarPixelSize() - 140);
        if (
          lastScrollTargetYRef.current === null ||
          Math.abs(targetY - lastScrollTargetYRef.current) > 48
        ) {
          lastScrollTargetYRef.current = targetY;
          const nextWaypoint = pickSafeWaypoint(targetY);
          beginSlowWalkTo(nextWaypoint.x, nextWaypoint.y);
        }
      }

      const now = Date.now();
      if (now - lastBubbleTimeRef.current >= 10000 && !chatOpenRef.current) {
        lastBubbleTimeRef.current = now;
        let sectionHint: RoamingSectionBubble['sectionHint'] = 'hero';
        if (scrollRatio > 0.84) sectionHint = 'faq';
        else if (scrollRatio > 0.68) sectionHint = 'pricing';
        else if (scrollRatio > 0.52) sectionHint = 'comparison';
        else if (scrollRatio > 0.36) sectionHint = 'how-it-works';
        else if (scrollRatio > 0.2) sectionHint = 'features';
        else if (scrollRatio > 0.08) sectionHint = 'android';

        const matching = ROAMING_TANGO_SECTION_BUBBLES.filter((b) => b.sectionHint === sectionHint);
        const pool = matching.length > 0 ? matching : ROAMING_TANGO_SECTION_BUBBLES;
        const nextIdx = Math.floor(Math.random() * pool.length);
        let chosen = pool[nextIdx];
        if (
          ROAMING_TANGO_SECTION_BUBBLES.indexOf(chosen) === lastBubbleIndexRef.current &&
          ROAMING_TANGO_SECTION_BUBBLES.length > 1
        ) {
          chosen =
            ROAMING_TANGO_SECTION_BUBBLES[
              (lastBubbleIndexRef.current + 1) % ROAMING_TANGO_SECTION_BUBBLES.length
            ];
        }
        lastBubbleIndexRef.current = ROAMING_TANGO_SECTION_BUBBLES.indexOf(chosen);
        setActiveBubble(chosen);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });

    let rafId: number | null = null;
    let lastWalkState = false;

    const step = (now: number) => {
      rafId = requestAnimationFrame(step);

      const curSize = getAvatarPixelSize();
      const curVw = window.innerWidth;
      const curVh = window.innerHeight;

      if (prefersReducedMotion || (isFrozenRef.current && !chatOpenRef.current)) {
        walkSegRef.current.active = false;
        if (lastWalkState) {
          lastWalkState = false;
          setWalkIntensity(0);
          setRoamLeanX(0);
        }
        return;
      }

      // When chat panel is open, walk slowly toward parked position next to chat panel
      if (chatOpenRef.current) {
        const parkX =
          curVw < 640
            ? Math.max(12, curVw - curSize - 14)
            : Math.max(16, curVw - 380 - curSize - 12);
        const parkY =
          curVw < 640
            ? Math.max(68, curVh - 450 - curSize * 0.75)
            : Math.max(88, curVh - curSize - 42);
        const distToPark = Math.hypot(
          parkX - walkSegRef.current.targetX,
          parkY - walkSegRef.current.targetY
        );
        if (distToPark > 12) {
          beginSlowWalkTo(parkX, parkY);
        }
      }

      const seg = walkSegRef.current;

      if (seg.active) {
        const rawProgress =
          seg.durationMs > 0
            ? Math.min(1, Math.max(0, (now - seg.startTime) / seg.durationMs))
            : 1;

        // Gentle ease-in-out (starts and stops softly)
        const eased = 0.5 - 0.5 * Math.cos(Math.PI * rawProgress);
        const speedEnvelope = Math.sin(Math.PI * rawProgress); // 0 -> 1 -> 0

        const dx = seg.targetX - seg.startX;
        const dy = seg.targetY - seg.startY;
        const dist = Math.max(1, Math.hypot(dx, dy));
        const perpX = -dy / dist;
        const perpY = dx / dist;
        const arc = Math.sin(Math.PI * rawProgress) * seg.arcOffset;

        const nextX = seg.startX + dx * eased + perpX * arc;
        const nextY = seg.startY + dy * eased + perpY * arc;

        posRef.current.x = Math.max(10, Math.min(curVw - curSize - 10, nextX));
        posRef.current.y = Math.max(70, Math.min(curVh - curSize - 20, nextY));

        if (wrapperRef.current) {
          wrapperRef.current.style.transform = `translate3d(${posRef.current.x.toFixed(1)}px, ${posRef.current.y.toFixed(1)}px, 0)`;
        }

        const dirX = Math.abs(dx) > 4 ? Math.sign(dx) * 0.35 * speedEnvelope : 0;
        setRoamLeanX(dirX);
        setWalkIntensity(speedEnvelope);
        setBubbleFlipLeft(posRef.current.x > curVw * 0.45);
        lastWalkState = true;

        if (rawProgress >= 1) {
          seg.active = false;
          // Pause and idle for 6–12 seconds after finishing the move
          seg.nextIdleDoneTime = now + getRandomIdlePauseMs();
          setWalkIntensity(0);
          setRoamLeanX(0);
          lastWalkState = false;
        }
      } else {
        if (lastWalkState) {
          lastWalkState = false;
          setWalkIntensity(0);
          setRoamLeanX(0);
        }
        // Only choose the next waypoint after the 6–12 second idle pause finishes
        if (!chatOpenRef.current && now >= seg.nextIdleDoneTime) {
          const nextSpot = pickSafeWaypoint();
          beginSlowWalkTo(nextSpot.x, nextSpot.y);
        }
      }
    };

    rafId = requestAnimationFrame(step);

    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [enabled, isMinimized, getAvatarPixelSize, pickSafeWaypoint, beginSlowWalkTo]);

  // Rotate idle bubbles every 12 seconds if user hasn't scrolled
  useEffect(() => {
    if (chatOpen || isMinimized) return;
    const interval = window.setInterval(() => {
      if (Date.now() - lastBubbleTimeRef.current < 10000) return;
      lastBubbleTimeRef.current = Date.now();
      const nextIdx = (lastBubbleIndexRef.current + 1) % ROAMING_TANGO_SECTION_BUBBLES.length;
      lastBubbleIndexRef.current = nextIdx;
      setActiveBubble(ROAMING_TANGO_SECTION_BUBBLES[nextIdx]);
    }, 12000);
    return () => window.clearInterval(interval);
  }, [chatOpen, isMinimized]);

  useEffect(() => {
    if (chatOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, chatOpen]);

  // Cleanup speech when closing public chat or turning speaker off
  useEffect(() => {
    if (!speakerEnabled || !chatOpen) {
      stopTangoVoice();
    }
  }, [speakerEnabled, chatOpen]);

  // Safe React markdown renderer for Tango chat bubbles:
  // - Renders **bold** (and *bold*) as real <strong> text
  // - Renders "• " and "- " lines as a clean <ul><li> list
  // - Ensures no literal "*" or "**" characters are ever visible
  const renderTangoInline = (lineText: string, keyPrefix: string): React.ReactNode[] => {
    const cleaned = stripTangoStarsUnicode(lineText);
    const nodes: React.ReactNode[] = [];
    const boldRegex = /\*\*([^*]+)\*\*|\*([^*]+)\*/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    let partIdx = 0;

    while ((match = boldRegex.exec(cleaned)) !== null) {
      if (match.index > lastIndex) {
        const plainBefore = cleaned.slice(lastIndex, match.index).replace(/\*/g, '');
        if (plainBefore) {
          nodes.push(<React.Fragment key={`${keyPrefix}-t-${partIdx++}`}>{plainBefore}</React.Fragment>);
        }
      }
      const boldContent = (match[1] ?? match[2] ?? '').replace(/\*/g, '');
      if (boldContent) {
        nodes.push(
          <strong key={`${keyPrefix}-b-${partIdx++}`} className="font-extrabold">
            {boldContent}
          </strong>
        );
      }
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < cleaned.length) {
      const remaining = cleaned.slice(lastIndex).replace(/\*/g, '');
      if (remaining) {
        nodes.push(<React.Fragment key={`${keyPrefix}-t-${partIdx++}`}>{remaining}</React.Fragment>);
      }
    }

    return nodes.length > 0 ? nodes : [cleaned.replace(/\*/g, '')];
  };

  const renderTangoMessageContent = (rawContent: string): React.ReactNode => {
    const safeText = stripTangoStarsUnicode(rawContent || '');
    const lines = safeText.split(/\r?\n/);
    const blocks: React.ReactNode[] = [];
    let pendingBullets: string[] = [];

    const flushBullets = (keyIndex: number) => {
      if (pendingBullets.length === 0) return;
      blocks.push(
        <ul key={`ul-${keyIndex}`} className="list-disc pl-4 my-1 space-y-1">
          {pendingBullets.map((item, idx) => (
            <li key={`li-${keyIndex}-${idx}`} className="leading-relaxed">
              {renderTangoInline(item, `li-${keyIndex}-${idx}`)}
            </li>
          ))}
        </ul>
      );
      pendingBullets = [];
    };

    lines.forEach((rawLine, lineIdx) => {
      const trimmedLine = rawLine.trim();
      const bulletMatch = /^(?:[•\-]|\*(?!\*))\s+(.*)$/.exec(trimmedLine);
      if (bulletMatch) {
        pendingBullets.push(bulletMatch[1]);
        return;
      }

      flushBullets(lineIdx);

      if (!trimmedLine) {
        return;
      }

      blocks.push(
        <p key={`p-${lineIdx}`} className={blocks.length > 0 ? 'mt-1.5 leading-relaxed' : 'leading-relaxed'}>
          {renderTangoInline(trimmedLine, `p-${lineIdx}`)}
        </p>
      );
    });

    flushBullets(lines.length);

    return blocks.length > 0 ? blocks : renderTangoInline(safeText, 'fallback');
  };

  const sendPublicGuideQuestion = async (questionText: string) => {
    const trimmed = truncateByCodePoints(stripTangoStarsUnicode(questionText.trim()), 500);
    if (!trimmed || isSending) return;

    const recentHistory = messages.slice(-6).map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const userMsg: TangoChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: trimmed,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsSending(true);
    setTangoState('thinking');

    try {
      const res = await fetch('/api/public-guide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          history: recentHistory,
        }),
      });

      const data = (await res.json()) as { reply?: string };
      const replyText = stripTangoStarsUnicode(
        data?.reply?.trim() || getPublicGuideLocalAnswer(trimmed)
      );

      const botMsg: TangoChatMessage = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content: replyText,
      };
      setMessages((prev) => [...prev, botMsg]);
      setTangoState('poke');
      window.setTimeout(() => setTangoState('idle'), 1400);

      if (speakerEnabled) {
        speakTangoVoice(
          replyText,
          () => setTangoState('speaking'),
          () => setTangoState('idle')
        );
      }
    } catch {
      const fallbackReply = stripTangoStarsUnicode(getPublicGuideLocalAnswer(trimmed));
      const botMsg: TangoChatMessage = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content: fallbackReply,
      };
      setMessages((prev) => [...prev, botMsg]);
      setTangoState('idle');
    } finally {
      setIsSending(false);
    }
  };

  const handleOpenChatWithPrompt = (topicPrompt?: string) => {
    setChatOpen(true);
    setPokeCount((c) => c + 1);
    setTangoState('poke');
    window.setTimeout(() => setTangoState('idle'), 1100);
    if (topicPrompt) {
      sendPublicGuideQuestion(topicPrompt);
    }
  };

  if (!enabled) return null;

  // If visitor minimized Tango, show a small dark floating pill in bottom-right corner
  if (isMinimized) {
    return (
      <button
        type="button"
        data-testid="roaming-tango-restore-btn"
        onClick={() => setIsMinimized(false)}
        style={{ bottom: 'max(16px, env(safe-area-inset-bottom))' }}
        className="fixed right-4 z-40 flex items-center gap-2 px-3.5 py-2 rounded-full bg-[#141418]/95 hover:bg-[#1E1E24] text-white border border-[#F4C430]/50 shadow-xl transition-all cursor-pointer"
        title="Bring back Tango the Academy Guide"
        aria-label="Bring back Tango the Academy Guide"
      >
        <div className="w-7 h-7 flex items-center justify-center bg-transparent">
          <TangoGuideSvg svgSize={28} uid="restore-tango" />
        </div>
        <span className="text-xs font-extrabold text-[#F4C430]">Ask Tango 🐾</span>
      </button>
    );
  }

  return (
    <>
      {/* ── Single Fixed Roaming Tango Layer (Turtle Speed, Zero Stars, Zero White Sheet) ── */}
      <div
        ref={wrapperRef}
        data-testid="roaming-tango-guide-wrapper"
        style={{
          width: 'clamp(100px, 16vw, 220px)',
          height: 'clamp(100px, 16vw, 220px)',
          willChange: 'transform',
        }}
        className="fixed top-0 left-0 z-40 pointer-events-none select-none bg-transparent border-0 shadow-none"
      >
        {/* Dark Speech Bubble with Tail Pointing at Tango (No Star/Sparkle Icons) */}
        {activeBubble && !chatOpen && (
          <div
            data-testid="roaming-tango-speech-bubble"
            onClick={() => handleOpenChatWithPrompt(activeBubble.topicPrompt)}
            role="button"
            tabIndex={0}
            aria-label="Tango academy guide speech bubble — tap to ask"
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                handleOpenChatWithPrompt(activeBubble.topicPrompt);
              }
            }}
            className={`pointer-events-auto absolute -top-3 ${
              bubbleFlipLeft
                ? 'right-[86%] mr-1.5 origin-bottom-right'
                : 'left-[86%] ml-1.5 origin-bottom-left'
            } w-[195px] sm:w-[235px] rounded-2xl bg-[#141418]/95 text-zinc-100 border border-[#F4C430]/50 px-3 py-2 shadow-xl backdrop-blur-md cursor-pointer hover:border-[#F4C430] transition-all animate-in fade-in zoom-in-95 duration-200`}
          >
            <div className="flex items-center justify-between gap-1 mb-0.5">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#FB923C]">
                Tango • Academy Guide
              </span>
              <span className="text-[9px] text-zinc-400 font-semibold">Tap to ask</span>
            </div>
            <p className="text-[11px] leading-snug text-zinc-100 font-medium">
              {activeBubble.text}
            </p>
            {/* Speech Bubble Tail Pointing at Tango */}
            <div
              className={`absolute top-6 w-2.5 h-2.5 rotate-45 bg-[#141418] border-[#F4C430]/50 ${
                bubbleFlipLeft
                  ? '-right-1.5 border-t border-r'
                  : '-left-1.5 border-b border-l'
              }`}
            />
          </div>
        )}

        {/* Frameless Transparent Tango 3D Avatar */}
        <div
          data-testid="roaming-tango-avatar-trigger"
          onClick={() => {
            setChatOpen((o) => !o);
            setPokeCount((c) => c + 1);
            setTangoState('poke');
            window.setTimeout(() => setTangoState('idle'), 1100);
          }}
          role="button"
          tabIndex={0}
          aria-label="Tap Tango to ask about SHS Virtual Academy"
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              setChatOpen((o) => !o);
            }
          }}
          className="pointer-events-auto w-full h-full flex items-center justify-center bg-transparent border-0 shadow-none cursor-pointer"
          title="Tap Tango to ask about SHS Virtual Academy!"
        >
          <TangoGuide3DAvatar
            state={tangoState}
            walkIntensity={walkIntensity}
            roamLeanX={roamLeanX}
            pokeCount={pokeCount}
          />
        </div>

        {/* Tiny Floating Control Bar Under Tango ("Stay here" Freeze Toggle + Minimize) */}
        <div className="pointer-events-auto -mt-2 flex items-center justify-center gap-1">
          <button
            type="button"
            data-testid="roaming-tango-stay-btn"
            onClick={(e) => {
              e.stopPropagation();
              setIsFrozen((f) => !f);
            }}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#141418]/90 hover:bg-[#1F1F26] text-[10px] font-bold text-zinc-200 border border-zinc-700/80 shadow-md transition-colors cursor-pointer"
            title={isFrozen ? 'Let Tango roam slowly' : 'Freeze Tango in this spot'}
            aria-label={isFrozen ? 'Let Tango roam slowly' : 'Keep Tango staying here'}
          >
            {isFrozen ? (
              <>
                <PinOff size={10} className="text-[#F4C430]" />
                <span>Roam</span>
              </>
            ) : (
              <>
                <Pin size={10} className="text-[#F4C430]" />
                <span>Stay here</span>
              </>
            )}
          </button>

          <button
            type="button"
            data-testid="roaming-tango-minimize-btn"
            onClick={(e) => {
              e.stopPropagation();
              setChatOpen(false);
              setIsMinimized(true);
            }}
            className="p-1 rounded-full bg-[#141418]/90 hover:bg-[#1F1F26] text-zinc-400 hover:text-white border border-zinc-700/80 shadow-md transition-colors cursor-pointer"
            title="Minimize Tango guide"
            aria-label="Minimize Tango guide"
          >
            <Minimize2 size={10} />
          </button>
        </div>
      </div>

      {/* ── Public Tango Guide Chat Panel (Dark-Themed Bottom Sheet on Mobile, Floating Card on Desktop) ── */}
      {chatOpen && (
        <div
          ref={chatPanelRef}
          data-roam-nogo="true"
          data-testid="roaming-tango-chat-panel"
          role="dialog"
          aria-label="Tango Academy Guide Chat"
          style={{ bottom: 'max(12px, env(safe-area-inset-bottom))' }}
          className="fixed inset-x-3 sm:inset-x-auto sm:right-5 z-50 sm:w-[370px] max-h-[78dvh] sm:max-h-[540px] rounded-3xl bg-[#121216]/98 text-zinc-100 border border-[#2C2C35] shadow-2xl flex flex-col overflow-hidden backdrop-blur-xl animate-in slide-in-from-bottom-4 duration-200"
        >
          {/* Header */}
          <div className="px-4 py-3 bg-[#18181E] border-b border-zinc-800 flex items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 flex items-center justify-center bg-transparent shrink-0">
                <TangoGuideSvg svgSize={32} uid="chat-hdr-tango" />
              </div>
              <div className="min-w-0">
                <h3 className="text-xs sm:text-sm font-extrabold text-white truncate flex items-center gap-1.5">
                  <span>Tango • Academy Guide</span>
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-400" />
                </h3>
                <p className="text-[10px] text-zinc-400 truncate">
                  SHS Virtual Academy & Scholario Official Info
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {/* Speaker Toggle (OFF by default, no autoplay) */}
              <button
                type="button"
                data-testid="roaming-tango-speaker-toggle"
                onClick={() => setSpeakerEnabled((s) => !s)}
                className={`p-1.5 rounded-xl border text-xs font-bold transition-colors cursor-pointer ${
                  speakerEnabled
                    ? 'bg-[#F4C430]/20 border-[#F4C430]/60 text-[#F4C430]'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                }`}
                title={
                  speakerEnabled
                    ? 'Tango voice replies ON (Tap to mute)'
                    : 'Tango voice replies OFF (Tap to enable)'
                }
                aria-label={
                  speakerEnabled ? 'Mute Tango voice replies' : 'Enable Tango voice replies'
                }
              >
                {speakerEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
              </button>

              <button
                type="button"
                data-testid="roaming-tango-chat-close"
                onClick={() => setChatOpen(false)}
                className="p-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 transition-colors cursor-pointer"
                title="Close Tango chat"
                aria-label="Close Tango chat"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Quick-Reply Chips */}
          <div className="px-3.5 py-2 bg-[#15151B] border-b border-zinc-800/80 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
            {PUBLIC_GUIDE_QUICK_CHIPS.map((chip) => (
              <button
                key={chip.id}
                type="button"
                data-testid={`tango-guide-chip-${chip.id}`}
                onClick={() => sendPublicGuideQuestion(chip.prompt)}
                disabled={isSending}
                className="shrink-0 px-2.5 py-1 rounded-full bg-zinc-900 hover:bg-[#F4C430]/15 border border-zinc-700/90 hover:border-[#F4C430]/60 text-[11px] font-bold text-zinc-200 hover:text-[#F4C430] transition-colors disabled:opacity-50 cursor-pointer"
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* Messages Stream */}
          <div className="flex-1 overflow-y-auto px-3.5 py-3 space-y-2.5 text-xs">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-[#F4C430] text-black font-semibold rounded-br-xs'
                      : 'bg-zinc-900/95 text-zinc-100 border border-zinc-800 rounded-bl-xs'
                  }`}
                >
                  {renderTangoMessageContent(m.content)}
                </div>
              </div>
            ))}
            {isSending && (
              <div className="flex justify-start">
                <div className="rounded-2xl px-3.5 py-2 bg-zinc-900 border border-zinc-800 text-zinc-400 text-[11px] flex items-center gap-2">
                  <span>Tango is checking the academy guide</span>
                  <span className="inline-flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#F4C430] animate-bounce" />
                    <span className="w-1.5 h-1.5 rounded-full bg-[#F4C430] animate-bounce [animation-delay:150ms]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-[#F4C430] animate-bounce [animation-delay:300ms]" />
                  </span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input & Get Started CTA */}
          <div className="p-3 bg-[#18181E] border-t border-zinc-800 space-y-2 shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendPublicGuideQuestion(input);
              }}
              className="flex items-center gap-1.5"
            >
              <input
                type="text"
                data-testid="tango-guide-input"
                value={input}
                onChange={(e) => setInput(truncateByCodePoints(e.target.value, 500))}
                maxLength={500}
                placeholder="Ask Tango about boards, fees, live classes..."
                aria-label="Ask Tango a question about SHS Virtual Academy"
                className="flex-1 px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#F4C430]"
              />
              <button
                type="submit"
                data-testid="tango-guide-send-btn"
                disabled={!input.trim() || isSending}
                className="p-2 rounded-xl bg-[#F4C430] hover:bg-[#e5b625] text-black disabled:opacity-40 transition-colors cursor-pointer"
                title="Send question to Tango"
                aria-label="Send question to Tango"
              >
                <Send size={14} />
              </button>
            </form>

            {onNavigate && (
              <div className="flex items-center justify-between pt-0.5 text-[11px]">
                <span className="text-zinc-400">Ready to join SHS Virtual Academy?</span>
                <button
                  type="button"
                  onClick={() => {
                    setChatOpen(false);
                    onNavigate('login');
                  }}
                  className="inline-flex items-center gap-1 font-extrabold text-[#F4C430] hover:underline cursor-pointer"
                >
                  <span>Get Started / Sign In</span>
                  <ArrowRight size={11} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export const RoamingTangoGuide = PublicTangoGuide;
export const RoamingCatGuide = PublicTangoGuide;

export default PublicTangoGuide;
