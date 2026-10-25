import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { Volume2 } from 'lucide-react';
import {
  Sage3DAvatarState,
  SageCharacterId,
  SAGE_AVATAR_THEME,
  getSageCharacterById,
} from './useSageAvatarState';
import { SageCharacterSvg } from './SageAvatar';
import { SageThoughtBubble } from './SageThoughtBubble';
import { SAGE_THOUGHT_DATA } from './sageThoughtLines';

export type { Sage3DAvatarState };

export interface Sage3DAvatarProps {
  state: Sage3DAvatarState;
  /** Selected character ID (#1 sage-classic default + 5 additional characters) */
  characterId?: SageCharacterId;
  /** Shared canvas ref to mirror the live 3D head into the top-left header avatar */
  headerCanvasRef?: React.RefObject<HTMLCanvasElement | null>;
  /** Audio volume level 0..1 when speaking or recording */
  audioLevel?: number;
  /** Compact layout (76px docked at top of chat) once messages exist */
  compact?: boolean;
  /** Optional subtitle/status label */
  statusLabel?: string;
  /** Greeting title when shown large in empty/fresh chat */
  greetingTitle?: string;
  /** Triggered when the user taps or clicks the avatar */
  onPoke?: () => void;
  /** Incremented counter for tap reactions */
  pokeCount?: number;
  /** Live thought bubble props */
  thoughtText?: string | null;
  thoughtMode?: 'typing' | 'thinking' | 'streaming' | 'done' | 'idle' | null;
  isTypingTransition?: boolean;
  streamingSnippet?: string;
}

/**
 * Procedural velvet bump micro-texture
 */
function createPlushBumpTexture(): THREE.CanvasTexture | null {
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, 128, 128);

  for (let i = 0; i < 2200; i++) {
    const x = Math.random() * 128;
    const y = Math.random() * 128;
    const shade = 110 + Math.floor(Math.random() * 38);
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
 * Creates 3D star geometry for pins and sparkles
 */
function createStarGeometry(outerR = 0.08, innerR = 0.038, depth = 0.025): THREE.ExtrudeGeometry {
  const shape = new THREE.Shape();
  const points = 5;
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const angle = (i * Math.PI) / points - Math.PI / 2;
    const x = Math.cos(angle) * r;
    const y = Math.sin(angle) * r;
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  shape.closePath();

  return new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelSegments: 2,
    steps: 1,
    bevelSize: depth * 0.35,
    bevelThickness: depth * 0.35,
  });
}

/**
 * 2D Layered SVG/CSS Animated Character Fallback
 */
const Plush2DFallback: React.FC<{
  state: Sage3DAvatarState;
  characterId: SageCharacterId;
  compact: boolean;
  onPoke?: () => void;
}> = ({ state, characterId, compact, onPoke }) => {
  const charDef = getSageCharacterById(characterId);
  return (
    <div
      onClick={onPoke}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onPoke?.();
      }}
      className={`relative flex items-center justify-center select-none cursor-pointer transition-transform duration-300 ${
        compact ? 'w-16 h-16' : 'w-36 h-36'
      } ${state === 'poke' || state === 'success' ? 'animate-bounce' : ''}`}
      title={`Tap ${charDef.name} to say hello!`}
    >
      <SageCharacterSvg
        characterId={characterId}
        avatarState={state}
        svgSize={compact ? 64 : 140}
        uid={compact ? 'fb-sm' : 'fb-lg'}
      />
    </div>
  );
};

export const Sage3DAvatar: React.FC<Sage3DAvatarProps> = ({
  state,
  characterId = 'sage-classic',
  headerCanvasRef,
  audioLevel = 0,
  compact = false,
  statusLabel,
  greetingTitle = "Hi, I'm Sage",
  onPoke,
  pokeCount = 0,
  thoughtText,
  thoughtMode,
  isTypingTransition = false,
  streamingSnippet,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [webglSupported, setWebglSupported] = useState<boolean>(true);
  const [webglReady, setWebglReady] = useState<boolean>(false);
  const [isSwitchingChar, setIsSwitchingChar] = useState<boolean>(false);

  const stateRef = useRef<Sage3DAvatarState>(state);
  const characterIdRef = useRef<SageCharacterId>(characterId);
  const audioLevelRef = useRef<number>(audioLevel);
  const pokeCountRef = useRef<number>(pokeCount);
  const applyCharacterRef = useRef<((id: SageCharacterId, animateSwitch: boolean) => void) | null>(null);
  const syncSizeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    audioLevelRef.current = audioLevel;
  }, [audioLevel]);

  useEffect(() => {
    pokeCountRef.current = pokeCount;
  }, [pokeCount]);

  useEffect(() => {
    if (syncSizeRef.current) {
      syncSizeRef.current();
    }
  }, [compact]);

  useEffect(() => {
    const prev = characterIdRef.current;
    characterIdRef.current = characterId;
    if (applyCharacterRef.current) {
      applyCharacterRef.current(characterId, prev !== characterId);
    }
    if (prev !== characterId) {
      setIsSwitchingChar(true);
      const timer = window.setTimeout(() => setIsSwitchingChar(false), 260);
      return () => window.clearTimeout(timer);
    }
  }, [characterId]);

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

    const debugInfo = renderer.getContext().getExtension('WEBGL_debug_renderer_info');
    const rendererStr = debugInfo
      ? String(renderer.getContext().getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || '')
      : '';
    const isSoftware = /swiftshader|llvmpipe|software|microsoft basic render/i.test(rendererStr);
    let currentDpr = isSoftware ? 1 : Math.min(window.devicePixelRatio || 1, 2);

    const width = Math.max(container.clientWidth, 68);
    const height = Math.max(container.clientHeight, 68);
    renderer.setPixelRatio(currentDpr);
    renderer.setSize(width, height);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.18;

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

    const goldRimLight = new THREE.DirectionalLight(0xf4c430, 1.1);
    goldRimLight.position.set(0, 2.2, -3.5);
    scene.add(goldRimLight);

    const { colors, sizes } = SAGE_AVATAR_THEME;
    const plushBumpTex = createPlushBumpTexture();

    // ── Common Materials ──
    const goldMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(colors.goldPrimary),
      roughness: 0.35,
      metalness: 0.8,
      emissive: new THREE.Color(colors.goldDeep),
      emissiveIntensity: 0.15,
    });

    const goldStarMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#FFE066'),
      roughness: 0.2,
      metalness: 0.85,
      emissive: new THREE.Color(colors.goldPrimary),
      emissiveIntensity: 0.3,
    });

    const obsidianMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(colors.obsidianAccent),
      roughness: 0.42,
      metalness: 0.25,
    });

    const eyeDarkMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(colors.eyes),
      roughness: 0.12,
      metalness: 0.05,
      clearcoat: 1.0,
      clearcoatRoughness: 0.08,
    });

    const catchlightMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(colors.eyeCatchlight),
    });

    const blushMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(colors.blush),
      transparent: true,
      opacity: 0.52,
      depthWrite: false,
    });

    const mouthDarkMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(colors.mouth),
      roughness: 0.5,
      metalness: 0.05,
    });

    const mouthInnerMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(colors.mouthInner),
    });

    const whiteMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#F8FAFC'),
      roughness: 0.55,
      metalness: 0.05,
    });

    // ── Hierarchy Root ──
    const avatarRoot = new THREE.Group();
    avatarRoot.scale.setScalar(sizes.bodyScale);
    scene.add(avatarRoot);

    const characterGroup = new THREE.Group();
    avatarRoot.add(characterGroup);

    // ═══════════════════════════════════════════════════════════════════════
    // RIG 1: SAGE CLASSIC (Cream plush marshmallow, mortarboard cap, gold scarf)
    // ═══════════════════════════════════════════════════════════════════════
    const sageRig = new THREE.Group();
    characterGroup.add(sageRig);

    const sagePlushMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(colors.plushBody),
      roughness: 0.78,
      metalness: 0.01,
      sheen: 1.0,
      sheenRoughness: 0.8,
      sheenColor: new THREE.Color('#FFFFFF'),
      bumpMap: plushBumpTex || undefined,
      bumpScale: 0.014,
    });

    const sageEarInnerMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(colors.earInner),
      roughness: 0.85,
    });

    // Sage Head + Body (Classic Marshmallow)
    const sageHeadGeo = new THREE.SphereGeometry(0.92, 48, 48);
    const sagePosAttr = sageHeadGeo.attributes.position;
    for (let i = 0; i < sagePosAttr.count; i++) {
      const x = sagePosAttr.getX(i);
      const y = sagePosAttr.getY(i);
      const z = sagePosAttr.getZ(i);
      const cheekFactor = y < 0.2 ? 1.06 - y * 0.06 : 1.0 - (y - 0.2) * 0.05;
      sagePosAttr.setXYZ(i, x * cheekFactor * 1.04, y * 0.96, z * cheekFactor * 0.95);
    }
    sageHeadGeo.computeVertexNormals();
    const sageHeadMesh = new THREE.Mesh(sageHeadGeo, sagePlushMat);
    sageRig.add(sageHeadMesh);

    // Sage Ears
    const sageLeftEar = new THREE.Group();
    sageLeftEar.position.set(-0.62, 0.68, -0.02);
    sageLeftEar.rotation.z = 0.38;
    sageRig.add(sageLeftEar);
    const earOuterGeo = new THREE.SphereGeometry(0.26, 24, 20);
    earOuterGeo.scale(0.95, 1.22, 0.65);
    const sageLeftEarOuter = new THREE.Mesh(earOuterGeo, sagePlushMat);
    sageLeftEar.add(sageLeftEarOuter);
    const earInnerGeo = new THREE.SphereGeometry(0.16, 20, 16);
    earInnerGeo.scale(0.9, 1.15, 0.45);
    const sageLeftEarInner = new THREE.Mesh(earInnerGeo, sageEarInnerMat);
    sageLeftEarInner.position.set(0, 0.08, 0.1);
    sageLeftEar.add(sageLeftEarInner);

    const sageRightEar = new THREE.Group();
    sageRightEar.position.set(0.62, 0.68, -0.02);
    sageRightEar.rotation.z = -0.38;
    sageRig.add(sageRightEar);
    const sageRightEarOuter = new THREE.Mesh(earOuterGeo, sagePlushMat);
    sageRightEar.add(sageRightEarOuter);
    const sageRightEarInner = new THREE.Mesh(earInnerGeo, sageEarInnerMat);
    sageRightEarInner.position.set(0, 0.08, 0.1);
    sageRightEar.add(sageRightEarInner);

    // Sage Graduation Cap
    const capGroup = new THREE.Group();
    capGroup.position.set(0.08, 0.86, 0.04);
    capGroup.rotation.set(0.08, 0.12, -0.14);
    sageRig.add(capGroup);

    const capSkullGeo = new THREE.CylinderGeometry(0.32, 0.36, 0.16, 24);
    const capSkull = new THREE.Mesh(capSkullGeo, obsidianMat);
    capGroup.add(capSkull);
    const capBoardGeo = new THREE.BoxGeometry(0.84, 0.036, 0.84);
    const capBoard = new THREE.Mesh(capBoardGeo, obsidianMat);
    capBoard.position.y = 0.11;
    capBoard.rotation.y = Math.PI / 4;
    capGroup.add(capBoard);
    const capButton = new THREE.Mesh(new THREE.SphereGeometry(0.045, 16, 16), goldStarMat);
    capButton.position.y = 0.14;
    capGroup.add(capButton);

    const tasselPivot = new THREE.Group();
    tasselPivot.position.set(0.38, 0.12, 0.12);
    capGroup.add(tasselPivot);
    const tasselCord = new THREE.Mesh(new THREE.CapsuleGeometry(0.018, 0.22, 8, 12), goldStarMat);
    tasselCord.position.y = -0.12;
    tasselPivot.add(tasselCord);
    const tasselDrop = new THREE.Mesh(new THREE.ConeGeometry(0.048, 0.12, 16), goldStarMat);
    tasselDrop.position.y = -0.24;
    tasselPivot.add(tasselDrop);

    // Sage Gold Scarf
    const scarfGroup = new THREE.Group();
    scarfGroup.position.set(0, -0.68, 0.02);
    sageRig.add(scarfGroup);
    const scarfRingGeo = new THREE.TorusGeometry(0.66, 0.135, 20, 48);
    scarfRingGeo.scale(1.06, 0.85, 1.02);
    const scarfRing = new THREE.Mesh(scarfRingGeo, goldMat);
    scarfRing.rotation.x = Math.PI / 2 + 0.08;
    scarfGroup.add(scarfRing);

    const starGeo = createStarGeometry(0.085, 0.04, 0.024);
    const scarfStarPin = new THREE.Mesh(starGeo, goldStarMat);
    scarfStarPin.position.set(0.28, -0.04, 0.72);
    scarfStarPin.rotation.y = 0.35;
    scarfGroup.add(scarfStarPin);

    // Sage Feet
    const footGeo = new THREE.SphereGeometry(0.19, 20, 16);
    footGeo.scale(1.15, 0.58, 1.3);
    const sageLeftFoot = new THREE.Mesh(footGeo, sagePlushMat);
    sageLeftFoot.position.set(-0.34, -0.92, 0.12);
    sageLeftFoot.rotation.y = 0.18;
    sageRig.add(sageLeftFoot);
    const sageRightFoot = new THREE.Mesh(footGeo, sagePlushMat);
    sageRightFoot.position.set(0.34, -0.92, 0.12);
    sageRightFoot.rotation.y = -0.18;
    sageRig.add(sageRightFoot);

    // ═══════════════════════════════════════════════════════════════════════
    // RIG 2: AYAN (Taller oval head, deep brown skin, dark hair, gold glasses, blazer with tie)
    // ═══════════════════════════════════════════════════════════════════════
    const ayanRig = new THREE.Group();
    ayanRig.visible = false;
    characterGroup.add(ayanRig);

    const ayanSkinMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#8D5524'),
      roughness: 0.65,
      metalness: 0.02,
      clearcoat: 0.05,
    });

    const darkHairMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#111827'),
      roughness: 0.8,
    });

    const navyBlazerMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#1E3A8A'),
      roughness: 0.72,
    });

    const tieMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#DC2626'),
      roughness: 0.45,
    });

    // Taller Oval Head
    const ayanHeadGeo = new THREE.SphereGeometry(0.88, 48, 48);
    ayanHeadGeo.scale(0.88, 1.14, 0.92);
    const ayanHeadMesh = new THREE.Mesh(ayanHeadGeo, ayanSkinMat);
    ayanRig.add(ayanHeadMesh);

    // Ayan Short Dark Hair Cap with Side Part & Front Bangs
    const ayanHairCapGeo = new THREE.SphereGeometry(0.91, 32, 24, 0, Math.PI * 2, 0, Math.PI * 0.46);
    ayanHairCapGeo.scale(0.89, 1.15, 0.93);
    const ayanHairCap = new THREE.Mesh(ayanHairCapGeo, darkHairMat);
    ayanHairCap.position.set(0, 0.05, -0.02);
    ayanHairCap.rotation.x = -0.16;
    ayanRig.add(ayanHairCap);

    const ayanBangGeo = new THREE.CapsuleGeometry(0.1, 0.32, 10, 14);
    const ayanBang = new THREE.Mesh(ayanBangGeo, darkHairMat);
    ayanBang.position.set(-0.2, 0.68, 0.65);
    ayanBang.rotation.set(0.35, 0.2, 1.1);
    ayanRig.add(ayanBang);

    // Ayan Round Gold Glasses
    const ayanGlassesGroup = new THREE.Group();
    ayanGlassesGroup.position.set(0, 0.14, 0.86);
    ayanRig.add(ayanGlassesGroup);

    const ayanLensRimGeo = new THREE.TorusGeometry(0.2, 0.022, 16, 36);
    const ayanLeftRim = new THREE.Mesh(ayanLensRimGeo, goldStarMat);
    ayanLeftRim.position.set(-0.29, 0, 0);
    ayanGlassesGroup.add(ayanLeftRim);
    const ayanRightRim = new THREE.Mesh(ayanLensRimGeo, goldStarMat);
    ayanRightRim.position.set(0.29, 0, 0);
    ayanGlassesGroup.add(ayanRightRim);

    const ayanBridgeGeo = new THREE.CylinderGeometry(0.016, 0.016, 0.2, 10);
    ayanBridgeGeo.rotateZ(Math.PI / 2);
    const ayanBridge = new THREE.Mesh(ayanBridgeGeo, goldStarMat);
    ayanBridge.position.set(0, 0.02, 0);
    ayanGlassesGroup.add(ayanBridge);

    // Ayan Navy-and-Gold School Blazer with Structured Lapels & Tie
    const ayanBlazerGroup = new THREE.Group();
    ayanBlazerGroup.position.set(0, -0.68, 0.02);
    ayanRig.add(ayanBlazerGroup);

    const ayanCollarGeo = new THREE.TorusGeometry(0.62, 0.14, 20, 48);
    ayanCollarGeo.scale(0.96, 0.85, 0.95);
    const ayanCollar = new THREE.Mesh(ayanCollarGeo, navyBlazerMat);
    ayanCollar.rotation.x = Math.PI / 2 + 0.08;
    ayanBlazerGroup.add(ayanCollar);

    const ayanTieGeo = new THREE.BoxGeometry(0.12, 0.32, 0.04);
    const ayanTie = new THREE.Mesh(ayanTieGeo, tieMat);
    ayanTie.position.set(0, -0.12, 0.62);
    ayanTie.rotation.x = 0.22;
    ayanBlazerGroup.add(ayanTie);

    const ayanTieKnotGeo = new THREE.ConeGeometry(0.065, 0.08, 12);
    const ayanTieKnot = new THREE.Mesh(ayanTieKnotGeo, goldStarMat);
    ayanTieKnot.position.set(0, 0.04, 0.61);
    ayanTieKnot.rotation.x = Math.PI;
    ayanBlazerGroup.add(ayanTieKnot);

    // Ayan Neat Boy Shoes
    const ayanLeftShoe = new THREE.Mesh(footGeo, obsidianMat);
    ayanLeftShoe.position.set(-0.3, -0.92, 0.1);
    ayanLeftShoe.rotation.y = 0.12;
    ayanRig.add(ayanLeftShoe);
    const ayanRightShoe = new THREE.Mesh(footGeo, obsidianMat);
    ayanRightShoe.position.set(0.3, -0.92, 0.1);
    ayanRightShoe.rotation.y = -0.12;
    ayanRig.add(ayanRightShoe);

    // ═══════════════════════════════════════════════════════════════════════
    // RIG 3: ZAIN (Wide round head, warm tan skin, orange beanie with pom-pom, backpack)
    // ═══════════════════════════════════════════════════════════════════════
    const zainRig = new THREE.Group();
    zainRig.visible = false;
    characterGroup.add(zainRig);

    const zainSkinMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#C68642'),
      roughness: 0.68,
      metalness: 0.02,
    });

    const orangeBeanieMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#EA580C'),
      roughness: 0.75,
    });

    const orangeBrimMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#F97316'),
      roughness: 0.72,
    });

    // Wide Rounder Head + Stocky Body
    const zainHeadGeo = new THREE.SphereGeometry(0.92, 48, 48);
    zainHeadGeo.scale(1.14, 0.92, 1.05);
    const zainHeadMesh = new THREE.Mesh(zainHeadGeo, zainSkinMat);
    zainRig.add(zainHeadMesh);

    // Orange Beanie Dome + Brim + Pom-Pom
    const beanieDomeGeo = new THREE.SphereGeometry(0.86, 32, 24, 0, Math.PI * 2, 0, Math.PI * 0.48);
    beanieDomeGeo.scale(1.16, 0.88, 1.06);
    const beanieDome = new THREE.Mesh(beanieDomeGeo, orangeBeanieMat);
    beanieDome.position.set(0, 0.28, -0.02);
    beanieDome.rotation.x = -0.14;
    zainRig.add(beanieDome);

    const beanieBrimGeo = new THREE.TorusGeometry(0.84, 0.12, 16, 48);
    beanieBrimGeo.scale(1.15, 0.9, 1.05);
    const beanieBrim = new THREE.Mesh(beanieBrimGeo, orangeBrimMat);
    beanieBrim.position.set(0, 0.52, 0.02);
    beanieBrim.rotation.x = Math.PI / 2 - 0.14;
    zainRig.add(beanieBrim);

    const pomPom = new THREE.Mesh(new THREE.SphereGeometry(0.18, 20, 20), goldStarMat);
    pomPom.position.set(0, 1.05, -0.14);
    zainRig.add(pomPom);

    // Messy curly dark curls under beanie
    const zainCurlGeo = new THREE.CapsuleGeometry(0.08, 0.22, 8, 12);
    const zainCurl1 = new THREE.Mesh(zainCurlGeo, darkHairMat);
    zainCurl1.position.set(-0.28, 0.44, 0.78);
    zainCurl1.rotation.set(0.3, 0.2, 1.2);
    zainRig.add(zainCurl1);
    const zainCurl2 = new THREE.Mesh(zainCurlGeo, darkHairMat);
    zainCurl2.position.set(0.24, 0.44, 0.78);
    zainCurl2.rotation.set(0.3, -0.2, -1.1);
    zainRig.add(zainCurl2);

    // Backpack (Back Pack + Shoulder Straps + Gold Buckles)
    const backpackGeo = new THREE.BoxGeometry(0.72, 0.76, 0.38);
    const backpackMesh = new THREE.Mesh(backpackGeo, orangeBeanieMat);
    backpackMesh.position.set(0, -0.32, -0.72);
    backpackMesh.rotation.x = 0.12;
    zainRig.add(backpackMesh);

    const strapGeo = new THREE.TorusGeometry(0.58, 0.07, 12, 36, Math.PI * 0.85);
    const zainLeftStrap = new THREE.Mesh(strapGeo, orangeBrimMat);
    zainLeftStrap.position.set(-0.44, -0.42, 0.36);
    zainLeftStrap.rotation.set(0.3, 1.25, -0.3);
    zainRig.add(zainLeftStrap);

    const zainRightStrap = new THREE.Mesh(strapGeo, orangeBrimMat);
    zainRightStrap.position.set(0.44, -0.42, 0.36);
    zainRightStrap.rotation.set(0.3, -1.25, 0.3);
    zainRig.add(zainRightStrap);

    const buckleGeo = new THREE.BoxGeometry(0.14, 0.09, 0.05);
    const zainLeftBuckle = new THREE.Mesh(buckleGeo, goldStarMat);
    zainLeftBuckle.position.set(-0.48, -0.44, 0.82);
    zainLeftBuckle.rotation.y = -0.35;
    zainRig.add(zainLeftBuckle);

    const zainRightBuckle = new THREE.Mesh(buckleGeo, goldStarMat);
    zainRightBuckle.position.set(0.48, -0.44, 0.82);
    zainRightBuckle.rotation.y = 0.35;
    zainRig.add(zainRightBuckle);

    const zainLeftShoe = new THREE.Mesh(footGeo, orangeBeanieMat);
    zainLeftShoe.position.set(-0.36, -0.9, 0.14);
    zainLeftShoe.rotation.y = 0.22;
    zainRig.add(zainLeftShoe);
    const zainRightShoe = new THREE.Mesh(footGeo, orangeBeanieMat);
    zainRightShoe.position.set(0.36, -0.9, 0.14);
    zainRightShoe.rotation.y = -0.22;
    zainRig.add(zainRightShoe);

    // ═══════════════════════════════════════════════════════════════════════
    // RIG 4: HAMZA (Square-ish soft head, light brown skin, beard shadow, white kurta with gold button, prayer topi)
    // ═══════════════════════════════════════════════════════════════════════
    const hamzaRig = new THREE.Group();
    hamzaRig.visible = false;
    characterGroup.add(hamzaRig);

    const hamzaSkinMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#D89B62'),
      roughness: 0.7,
      metalness: 0.02,
    });

    // Square-ish Soft Head
    const hamzaHeadGeo = new THREE.SphereGeometry(0.92, 48, 48);
    hamzaHeadGeo.scale(1.04, 0.98, 0.96);
    const hamzaHeadMesh = new THREE.Mesh(hamzaHeadGeo, hamzaSkinMat);
    hamzaRig.add(hamzaHeadMesh);

    // Beard Shadow Along Jawline
    const beardGeo = new THREE.TorusGeometry(0.72, 0.16, 16, 48, Math.PI * 0.9);
    beardGeo.scale(1.04, 0.95, 0.75);
    const beardMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#38220F'),
      roughness: 0.9,
      transparent: true,
      opacity: 0.42,
    });
    const hamzaBeard = new THREE.Mesh(beardGeo, beardMat);
    hamzaBeard.position.set(0, -0.26, 0.42);
    hamzaBeard.rotation.x = 0.45;
    hamzaRig.add(hamzaBeard);

    // White Prayer-Cap Style Topi with Gold Trim
    const topiDomeGeo = new THREE.CylinderGeometry(0.48, 0.54, 0.22, 24);
    const topiDome = new THREE.Mesh(topiDomeGeo, whiteMat);
    topiDome.position.set(0, 0.92, 0.02);
    topiDome.rotation.x = -0.06;
    hamzaRig.add(topiDome);

    const topiTrimGeo = new THREE.TorusGeometry(0.53, 0.03, 12, 36);
    const topiTrim = new THREE.Mesh(topiTrimGeo, goldStarMat);
    topiTrim.position.set(0, 0.82, 0.02);
    topiTrim.rotation.x = Math.PI / 2 - 0.06;
    hamzaRig.add(topiTrim);

    // White Pakistani Kurta Mandarin Collar & 3 Gold Buttons
    const kurtaCollarGeo = new THREE.TorusGeometry(0.64, 0.14, 20, 48);
    kurtaCollarGeo.scale(1.04, 0.85, 0.98);
    const kurtaCollar = new THREE.Mesh(kurtaCollarGeo, whiteMat);
    kurtaCollar.position.set(0, -0.68, 0.02);
    kurtaCollar.rotation.x = Math.PI / 2 + 0.08;
    hamzaRig.add(kurtaCollar);

    const kurtaPlacketGeo = new THREE.BoxGeometry(0.16, 0.42, 0.06);
    const kurtaPlacket = new THREE.Mesh(kurtaPlacketGeo, whiteMat);
    kurtaPlacket.position.set(0, -0.68, 0.72);
    kurtaPlacket.rotation.x = 0.25;
    hamzaRig.add(kurtaPlacket);

    [-0.56, -0.68, -0.8].forEach((py, idx) => {
      const btn = new THREE.Mesh(new THREE.SphereGeometry(0.036, 14, 14), goldStarMat);
      btn.position.set(0, py, 0.76 - idx * 0.03);
      hamzaRig.add(btn);
    });

    const hamzaLeftShoe = new THREE.Mesh(footGeo, whiteMat);
    hamzaLeftShoe.position.set(-0.32, -0.92, 0.12);
    hamzaLeftShoe.rotation.y = 0.14;
    hamzaRig.add(hamzaLeftShoe);
    const hamzaRightShoe = new THREE.Mesh(footGeo, whiteMat);
    hamzaRightShoe.position.set(0.32, -0.92, 0.12);
    hamzaRightShoe.rotation.y = -0.14;
    hamzaRig.add(hamzaRightShoe);

    // ═══════════════════════════════════════════════════════════════════════
    // RIG 5: NOVA BOT (Rounded-rectangle head, dark visor screen, cyan/gold display, hover thruster, antenna)
    // ═══════════════════════════════════════════════════════════════════════
    const novaRig = new THREE.Group();
    novaRig.visible = false;
    characterGroup.add(novaRig);

    const botPorcelainMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#F8FAFC'),
      roughness: 0.18,
      metalness: 0.12,
      clearcoat: 1.0,
      clearcoatRoughness: 0.08,
    });

    const botVisorMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#0F172A'),
      roughness: 0.08,
      metalness: 0.3,
      clearcoat: 1.0,
    });

    const cyberCyanMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color('#38BDF8'),
    });

    // Rounded-Rectangle Mechanical Head Casing
    const botHeadGeo = new THREE.BoxGeometry(1.68, 1.48, 1.25);
    const botHeadMesh = new THREE.Mesh(botHeadGeo, botPorcelainMat);
    botHeadMesh.position.set(0, 0.05, 0);
    novaRig.add(botHeadMesh);

    // Beveled Dark Visor Screen in Front
    const botVisorGeo = new THREE.BoxGeometry(1.42, 0.88, 0.18);
    const botVisor = new THREE.Mesh(botVisorGeo, botVisorMat);
    botVisor.position.set(0, 0.08, 0.62);
    novaRig.add(botVisor);

    // Glowing Golden Antenna on Top with Sphere Bulb
    const botAntennaStem = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 0.38, 16), goldMat);
    botAntennaStem.position.set(0, 0.98, 0);
    novaRig.add(botAntennaStem);

    const botAntennaBulb = new THREE.Mesh(new THREE.SphereGeometry(0.12, 20, 20), goldStarMat);
    botAntennaBulb.position.set(0, 1.2, 0);
    novaRig.add(botAntennaBulb);

    // Brushed Gold Side Ear-Cups
    const earCupGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.18, 24);
    earCupGeo.rotateZ(Math.PI / 2);
    const botLeftEar = new THREE.Mesh(earCupGeo, goldMat);
    botLeftEar.position.set(-0.92, 0.08, 0);
    novaRig.add(botLeftEar);
    const botRightEar = new THREE.Mesh(earCupGeo, goldMat);
    botRightEar.position.set(0.92, 0.08, 0);
    novaRig.add(botRightEar);

    // Floating Hover Pod with NO legs + Soft Exhaust Glow
    const hoverPodGeo = new THREE.ConeGeometry(0.58, 0.52, 24);
    hoverPodGeo.rotateX(Math.PI);
    const hoverPod = new THREE.Mesh(hoverPodGeo, botPorcelainMat);
    hoverPod.position.set(0, -0.85, 0);
    novaRig.add(hoverPod);

    const hoverRingGeo = new THREE.TorusGeometry(0.48, 0.06, 16, 36);
    const hoverRingMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color('#38BDF8'),
      transparent: true,
      opacity: 0.85,
    });
    const hoverRing = new THREE.Mesh(hoverRingGeo, hoverRingMat);
    hoverRing.rotation.x = Math.PI / 2;
    hoverRing.position.set(0, -1.02, 0);
    novaRig.add(hoverRing);

    // Dynamic Visor Eye Displays for Nova
    const novaVisorEyes = new THREE.Group();
    novaVisorEyes.position.set(0, 0.08, 0.72);
    novaRig.add(novaVisorEyes);

    // Neutral glowing cyber eyes
    const novaLeftEyeMesh = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.32, 0.02), cyberCyanMat);
    novaLeftEyeMesh.position.set(-0.32, 0, 0);
    novaVisorEyes.add(novaLeftEyeMesh);
    const novaRightEyeMesh = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.32, 0.02), cyberCyanMat);
    novaRightEyeMesh.position.set(0.32, 0, 0);
    novaVisorEyes.add(novaRightEyeMesh);

    // Happy cyber arcs `^ ^`
    const novaHappyLeft = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.03, 12, 24, Math.PI * 0.8), cyberCyanMat);
    novaHappyLeft.position.set(-0.32, -0.04, 0.02);
    novaHappyLeft.rotation.z = Math.PI * 0.1;
    novaHappyLeft.visible = false;
    novaVisorEyes.add(novaHappyLeft);

    const novaHappyRight = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.03, 12, 24, Math.PI * 0.8), cyberCyanMat);
    novaHappyRight.position.set(0.32, -0.04, 0.02);
    novaHappyRight.rotation.z = Math.PI * 0.1;
    novaHappyRight.visible = false;
    novaVisorEyes.add(novaHappyRight);

    // ═══════════════════════════════════════════════════════════════════════
    // RIG 6: MILO OWL (Round fluffy owl body, ear tufts, reading glasses, flapping wings, book)
    // ═══════════════════════════════════════════════════════════════════════
    const miloRig = new THREE.Group();
    miloRig.visible = false;
    characterGroup.add(miloRig);

    const miloPlumageMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#E6D2B5'),
      roughness: 0.82,
      metalness: 0.01,
      sheen: 0.8,
      bumpMap: plushBumpTex || undefined,
      bumpScale: 0.015,
    });

    const miloWingMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#78350F'),
      roughness: 0.75,
    });

    // Round Fluffy Body
    const miloBodyGeo = new THREE.SphereGeometry(0.94, 48, 48);
    miloBodyGeo.scale(1.02, 1.08, 0.98);
    const miloBodyMesh = new THREE.Mesh(miloBodyGeo, miloPlumageMat);
    miloRig.add(miloBodyMesh);

    // Large Feather Ear-Tufts on top corners
    const earTuftGeo = new THREE.ConeGeometry(0.24, 0.58, 16);
    const miloLeftTuft = new THREE.Mesh(earTuftGeo, miloWingMat);
    miloLeftTuft.position.set(-0.58, 0.88, 0.08);
    miloLeftTuft.rotation.set(-0.18, 0, 0.45);
    miloRig.add(miloLeftTuft);

    const miloRightTuft = new THREE.Mesh(earTuftGeo, miloWingMat);
    miloRightTuft.position.set(0.58, 0.88, 0.08);
    miloRightTuft.rotation.set(-0.18, 0, -0.45);
    miloRig.add(miloRightTuft);

    // Soft Cream Belly Patch
    const miloBelly = new THREE.Mesh(new THREE.CircleGeometry(0.48, 24), whiteMat);
    miloBelly.scale.set(1.1, 0.85, 1);
    miloBelly.position.set(0, -0.42, 0.88);
    miloBelly.rotation.x = 0.28;
    miloRig.add(miloBelly);

    // Golden Curved Owl Beak
    const beakGeo = new THREE.ConeGeometry(0.088, 0.18, 16);
    const owlBeak = new THREE.Mesh(beakGeo, goldStarMat);
    owlBeak.position.set(0, 0.02, 0.96);
    owlBeak.rotation.x = Math.PI * 0.85;
    miloRig.add(owlBeak);

    // Tiny Reading Glasses perched over beak
    const owlGlasses = new THREE.Group();
    owlGlasses.position.set(0, 0.08, 0.92);
    miloRig.add(owlGlasses);
    const owlLensGeo = new THREE.TorusGeometry(0.19, 0.02, 12, 32);
    const owlLeftLens = new THREE.Mesh(owlLensGeo, goldStarMat);
    owlLeftLens.position.set(-0.28, 0, 0);
    owlGlasses.add(owlLeftLens);
    const owlRightLens = new THREE.Mesh(owlLensGeo, goldStarMat);
    owlRightLens.position.set(0.28, 0, 0);
    owlGlasses.add(owlRightLens);
    const owlBridge = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.18, 8), goldStarMat);
    owlBridge.rotateZ(Math.PI / 2);
    owlGlasses.add(owlBridge);

    // Flapping Wings (Pivots for flapping animations)
    const miloLeftWingPivot = new THREE.Group();
    miloLeftWingPivot.position.set(-0.88, -0.15, 0.05);
    miloRig.add(miloLeftWingPivot);
    const wingGeo = new THREE.CapsuleGeometry(0.18, 0.48, 10, 16);
    wingGeo.scale(0.55, 1.0, 1.15);
    const miloLeftWing = new THREE.Mesh(wingGeo, miloWingMat);
    miloLeftWing.position.set(0, -0.22, 0);
    miloLeftWingPivot.add(miloLeftWing);

    const miloRightWingPivot = new THREE.Group();
    miloRightWingPivot.position.set(0.88, -0.15, 0.05);
    miloRig.add(miloRightWingPivot);
    const miloRightWing = new THREE.Mesh(wingGeo, miloWingMat);
    miloRightWing.position.set(0, -0.22, 0);
    miloRightWingPivot.add(miloRightWing);

    // Open Miniature Study Book held in front
    const bookGroup = new THREE.Group();
    bookGroup.position.set(0, -0.58, 0.86);
    bookGroup.rotation.set(-0.35, 0, 0);
    miloRig.add(bookGroup);

    const bookPageGeo = new THREE.BoxGeometry(0.36, 0.26, 0.04);
    const leftCover = new THREE.Mesh(bookPageGeo, obsidianMat);
    leftCover.position.set(-0.17, 0, 0);
    leftCover.rotation.y = 0.28;
    bookGroup.add(leftCover);

    const rightCover = new THREE.Mesh(bookPageGeo, obsidianMat);
    rightCover.position.set(0.17, 0, 0);
    rightCover.rotation.y = -0.28;
    bookGroup.add(rightCover);

    const bookSpine = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.27, 12), goldStarMat);
    bookGroup.add(bookSpine);

    const miloLeftClaw = new THREE.Mesh(footGeo, goldStarMat);
    miloLeftClaw.position.set(-0.32, -0.92, 0.12);
    miloLeftClaw.rotation.y = 0.15;
    miloRig.add(miloLeftClaw);
    const miloRightClaw = new THREE.Mesh(footGeo, goldStarMat);
    miloRightClaw.position.set(0.32, -0.92, 0.12);
    miloRightClaw.rotation.y = -0.15;
    miloRig.add(miloRightClaw);

    // ═══════════════════════════════════════════════════════════════════════
    // COMMON FACE FEATURES (For Sage, Ayan, Zain, Hamza, Milo)
    // ═══════════════════════════════════════════════════════════════════════
    const commonFaceGroup = new THREE.Group();
    commonFaceGroup.position.set(0, 0.03, 0.87);
    characterGroup.add(commonFaceGroup);

    const eyeGeo = new THREE.SphereGeometry(0.135, 24, 24);
    eyeGeo.scale(0.92, 1.08, 0.42);

    const leftEyeGroup = new THREE.Group();
    leftEyeGroup.position.set(-0.31, 0.08, 0);
    commonFaceGroup.add(leftEyeGroup);
    const leftEyeMesh = new THREE.Mesh(eyeGeo, eyeDarkMat);
    leftEyeGroup.add(leftEyeMesh);
    const bigGlintGeo = new THREE.SphereGeometry(0.038, 12, 12);
    const leftBigGlint = new THREE.Mesh(bigGlintGeo, catchlightMat);
    leftBigGlint.position.set(-0.036, 0.048, 0.052);
    leftEyeGroup.add(leftBigGlint);

    const rightEyeGroup = new THREE.Group();
    rightEyeGroup.position.set(0.31, 0.08, 0);
    commonFaceGroup.add(rightEyeGroup);
    const rightEyeMesh = new THREE.Mesh(eyeGeo, eyeDarkMat);
    rightEyeGroup.add(rightEyeMesh);
    const rightBigGlint = new THREE.Mesh(bigGlintGeo, catchlightMat);
    rightBigGlint.position.set(-0.036, 0.048, 0.052);
    rightEyeGroup.add(rightBigGlint);

    // Happy Eyes (^ ^)
    const happyArcGeo = new THREE.TorusGeometry(0.105, 0.026, 12, 24, Math.PI * 0.85);
    const leftHappyEye = new THREE.Mesh(happyArcGeo, mouthDarkMat);
    leftHappyEye.position.set(-0.31, 0.05, 0.03);
    leftHappyEye.rotation.z = Math.PI * 0.075;
    leftHappyEye.visible = false;
    commonFaceGroup.add(leftHappyEye);

    const rightHappyEye = new THREE.Mesh(happyArcGeo, mouthDarkMat);
    rightHappyEye.position.set(0.31, 0.05, 0.03);
    rightHappyEye.rotation.z = Math.PI * 0.075;
    rightHappyEye.visible = false;
    commonFaceGroup.add(rightHappyEye);

    // Cheek Blush
    const blushGeo = new THREE.CircleGeometry(0.145, 24);
    blushGeo.scale(1.35, 0.78, 1);
    const leftBlush = new THREE.Mesh(blushGeo, blushMat);
    leftBlush.position.set(-0.46, -0.1, -0.02);
    leftBlush.rotation.y = -0.35;
    commonFaceGroup.add(leftBlush);

    const rightBlush = new THREE.Mesh(blushGeo, blushMat);
    rightBlush.position.set(0.46, -0.1, -0.02);
    rightBlush.rotation.y = 0.35;
    commonFaceGroup.add(rightBlush);

    // Mouth
    const smileArcGeo = new THREE.TorusGeometry(0.078, 0.018, 12, 24, Math.PI * 0.82);
    const smileArcMesh = new THREE.Mesh(smileArcGeo, mouthDarkMat);
    smileArcMesh.position.set(0, -0.06, 0.03);
    smileArcMesh.rotation.z = Math.PI * 1.09;
    commonFaceGroup.add(smileArcMesh);

    const openMouthGroup = new THREE.Group();
    openMouthGroup.position.set(0, -0.11, 0.03);
    openMouthGroup.visible = false;
    commonFaceGroup.add(openMouthGroup);

    const openMouthOuterGeo = new THREE.SphereGeometry(0.075, 16, 16);
    openMouthOuterGeo.scale(1.1, 0.85, 0.3);
    const openMouthOuter = new THREE.Mesh(openMouthOuterGeo, mouthDarkMat);
    openMouthGroup.add(openMouthOuter);

    const openMouthTongueGeo = new THREE.SphereGeometry(0.048, 12, 12);
    openMouthTongueGeo.scale(1.05, 0.65, 0.32);
    const openMouthTongue = new THREE.Mesh(openMouthTongueGeo, mouthInnerMat);
    openMouthTongue.position.set(0, -0.018, 0.008);
    openMouthGroup.add(openMouthTongue);

    // Arms for humanoid/creature rigs
    const armGeo = new THREE.CapsuleGeometry(0.14, 0.24, 12, 16);
    const leftArmPivot = new THREE.Group();
    leftArmPivot.position.set(-0.84, -0.18, 0.12);
    leftArmPivot.rotation.z = 0.42;
    const leftArmMesh: THREE.Mesh<THREE.CapsuleGeometry, THREE.Material> = new THREE.Mesh(armGeo, sagePlushMat);
    leftArmMesh.position.y = -0.14;
    leftArmPivot.add(leftArmMesh);

    const rightArmPivot = new THREE.Group();
    rightArmPivot.position.set(0.84, -0.18, 0.12);
    rightArmPivot.rotation.z = -0.42;
    characterGroup.add(rightArmPivot);
    const rightArmMesh: THREE.Mesh<THREE.CapsuleGeometry, THREE.Material> = new THREE.Mesh(armGeo, sagePlushMat);
    rightArmMesh.position.y = -0.14;
    rightArmPivot.add(rightArmMesh);

    // ═══════════════════════════════════════════════════════════════════════
    // TYPING PROP: STUDY TABLET / NOTEPAD / DESK IN FRONT
    // ═══════════════════════════════════════════════════════════════════════
    const typingDeskGroup = new THREE.Group();
    typingDeskGroup.position.set(0, -0.62, 0.76);
    typingDeskGroup.rotation.x = -0.28;
    typingDeskGroup.scale.setScalar(0);
    characterGroup.add(typingDeskGroup);

    const deskTabletGeo = new THREE.BoxGeometry(0.68, 0.44, 0.04);
    const deskTabletMesh = new THREE.Mesh(deskTabletGeo, obsidianMat);
    typingDeskGroup.add(deskTabletMesh);

    const deskScreenGeo = new THREE.BoxGeometry(0.62, 0.38, 0.01);
    const deskScreenMat = new THREE.MeshBasicMaterial({ color: new THREE.Color('#FEF9C3') });
    const deskScreenMesh = new THREE.Mesh(deskScreenGeo, deskScreenMat);
    deskScreenMesh.position.z = 0.022;
    typingDeskGroup.add(deskScreenMesh);

    // Golden stylus pen on tablet
    const stylusGeo = new THREE.CylinderGeometry(0.016, 0.016, 0.36, 12);
    stylusGeo.rotateZ(Math.PI / 4);
    const stylusMesh = new THREE.Mesh(stylusGeo, goldStarMat);
    stylusMesh.position.set(0.12, -0.05, 0.04);
    typingDeskGroup.add(stylusMesh);

    // ── Character Switch Function ──
    let switchScaleDip = 0;

    const applyCharacterToRig = (id: SageCharacterId, animateSwitch: boolean) => {
      const def = getSageCharacterById(id);
      const persona = SAGE_THOUGHT_DATA[id] || SAGE_THOUGHT_DATA['sage-classic'];

      // Toggle active rig
      sageRig.visible = id === 'sage-classic';
      ayanRig.visible = id === 'ayan-scholar';
      zainRig.visible = id === 'zain-explorer';
      hamzaRig.visible = id === 'hamza-kurta';
      novaRig.visible = id === 'nova-bot';
      miloRig.visible = id === 'milo-owl';

      // Hide common face on Nova Bot (she has full cyber visor)
      commonFaceGroup.visible = id !== 'nova-bot';

      // Update arm materials to match character skin/coat
      if (id === 'ayan-scholar') {
        leftArmMesh.material = navyBlazerMat;
        rightArmMesh.material = navyBlazerMat;
        leftArmPivot.visible = true;
        rightArmPivot.visible = true;
      } else if (id === 'zain-explorer') {
        leftArmMesh.material = zainSkinMat;
        rightArmMesh.material = zainSkinMat;
        leftArmPivot.visible = true;
        rightArmPivot.visible = true;
      } else if (id === 'hamza-kurta') {
        leftArmMesh.material = whiteMat;
        rightArmMesh.material = whiteMat;
        leftArmPivot.visible = true;
        rightArmPivot.visible = true;
      } else if (id === 'milo-owl') {
        // Milo uses wings on left/right instead of humanoid arms
        leftArmPivot.visible = false;
        rightArmPivot.visible = false;
      } else if (id === 'nova-bot') {
        leftArmMesh.material = botPorcelainMat;
        rightArmMesh.material = botPorcelainMat;
        leftArmPivot.visible = true;
        rightArmPivot.visible = true;
      } else {
        leftArmMesh.material = sagePlushMat;
        rightArmMesh.material = sagePlushMat;
        leftArmPivot.visible = true;
        rightArmPivot.visible = true;
      }

      // Tint rim and screen to avatar's unique accent color
      goldRimLight.color.set(persona.accentColor);
      deskScreenMat.color.set(persona.accentBg);

      if (animateSwitch) {
        switchScaleDip = 1.0;
      }
    };

    applyCharacterRef.current = applyCharacterToRig;
    applyCharacterToRig(characterIdRef.current, false);

    // Pointer Tracking
    const targetPointer = { x: 0, y: 0 };
    const currentPointer = { x: 0, y: 0 };
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const handlePointerMove = (e: PointerEvent) => {
      if (prefersReducedMotion) return;
      const nx = (e.clientX / Math.max(window.innerWidth, 1)) * 2 - 1;
      const ny = -(e.clientY / Math.max(window.innerHeight, 1)) * 2 + 1;
      targetPointer.x = Math.max(-1, Math.min(1, nx));
      targetPointer.y = Math.max(-1, Math.min(1, ny));
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });

    let rafId: number | null = null;
    let isVisible = true;
    let isDocumentVisible = !document.hidden;
    const clock = new THREE.Clock();

    let nextBlinkTime = 2.2 + Math.random() * 2.5;
    let blinkStart = -1;
    const blinkDuration = 0.17;

    const smoothHeadRot = { x: 0, y: 0, z: 0 };
    const smoothBodyPos = { x: 0, y: 0 };
    const smoothBodyScale = { x: 1, y: 1, z: 1 };
    let smoothMouthOpen = 0.08;
    let spinAngle = 0;
    let lastHandledPokeCount = pokeCountRef.current;
    let deskScaleSmooth = 0;

    let frameSampleCount = 0;
    let frameDeltaSum = 0;
    let qualityReduced = false;

    const animate = () => {
      if (!isVisible || !isDocumentVisible) {
        rafId = null;
        return;
      }
      rafId = requestAnimationFrame(animate);

      const delta = Math.min(clock.getDelta(), 0.1);
      const t = clock.getElapsedTime();
      const curState = stateRef.current;
      const curCharId = characterIdRef.current;
      const curLevel = Math.max(0, Math.min(1, audioLevelRef.current));

      // Auto-lower quality if FPS drops
      if (!qualityReduced && currentDpr > 1) {
        frameSampleCount++;
        frameDeltaSum += delta;
        if (frameSampleCount >= 45) {
          const avgDelta = frameDeltaSum / frameSampleCount;
          if (avgDelta > 0.026) {
            currentDpr = 1;
            renderer.setPixelRatio(1);
            qualityReduced = true;
          }
          frameSampleCount = 0;
          frameDeltaSum = 0;
        }
      }

      if (pokeCountRef.current !== lastHandledPokeCount) {
        lastHandledPokeCount = pokeCountRef.current;
        if (lastHandledPokeCount % 2 === 0 && !prefersReducedMotion) {
          spinAngle = Math.PI * 2;
        }
      }
      if (spinAngle > 0.001) {
        spinAngle *= Math.pow(0.04, delta * 1.4);
        if (spinAngle < 0.01) spinAngle = 0;
      }

      if (switchScaleDip > 0.005) {
        switchScaleDip *= Math.pow(0.01, delta * 2.4);
        if (switchScaleDip < 0.01) switchScaleDip = 0;
      }

      currentPointer.x += (targetPointer.x - currentPointer.x) * Math.min(1, delta * 6);
      currentPointer.y += (targetPointer.y - currentPointer.y) * Math.min(1, delta * 6);

      // Target Pose computation taking character personalities into account!
      let targetRotX = -currentPointer.y * 0.14;
      let targetRotY = currentPointer.x * 0.24;
      let targetRotZ = -currentPointer.x * 0.05;
      let targetPosY = Math.sin(t * 2.1) * 0.045;
      let targetScaleX = 1 + Math.sin(t * 2.1) * 0.012;
      let targetScaleY = 1 - Math.sin(t * 2.1) * 0.012;

      // Character-specific movement quirks
      if (curCharId === 'zain-explorer') {
        // Zain is hyper and bouncy: faster bobbing
        targetPosY = Math.sin(t * 3.8) * 0.06;
      } else if (curCharId === 'nova-bot') {
        // Nova floats with smooth hovering thruster motion
        targetPosY = Math.sin(t * 2.4) * 0.075 + Math.cos(t * 1.2) * 0.02;
        targetRotZ += Math.sin(t * 1.8) * 0.04;
      } else if (curCharId === 'hamza-kurta') {
        // Hamza has calm, dignified, slower movements
        targetPosY = Math.sin(t * 1.5) * 0.035;
      }

      if (prefersReducedMotion) {
        targetRotX = 0;
        targetRotY = 0;
        targetRotZ = 0;
        targetPosY = 0;
        targetScaleX = 1;
        targetScaleY = 1;
      } else {
        switch (curState) {
          case 'idle': {
            const slowLook = Math.sin(t * 0.55) * 0.08;
            targetRotY += slowLook;
            targetRotZ += Math.sin(t * 0.8) * 0.035;
            break;
          }
          case 'typing': {
            targetRotX = 0.22;
            targetRotY = currentPointer.x * 0.12 + Math.sin(t * 2.4) * 0.03;
            targetPosY = -0.04 + Math.sin(t * 3.2) * 0.025;
            break;
          }
          case 'listening': {
            targetRotX = -0.05;
            targetRotZ = 0.06 * Math.sin(t * 2.8);
            targetPosY = 0.05 + curLevel * 0.05;
            targetScaleX = 1 + curLevel * 0.035;
            targetScaleY = 1 + curLevel * 0.035;
            break;
          }
          case 'nod': {
            const nodSpeed = curCharId === 'ayan-scholar' ? 10 : curCharId === 'zain-explorer' ? 18 : 13;
            targetRotX = Math.sin(t * nodSpeed) * 0.2 + 0.08;
            targetPosY = Math.abs(Math.sin(t * (nodSpeed / 2))) * 0.05;
            break;
          }
          case 'thinking': {
            targetRotX = -0.12 + Math.sin(t * 1.9) * 0.04;
            targetRotY = 0.18 + Math.cos(t * 1.3) * 0.08;
            targetRotZ = -0.14 + Math.sin(t * 1.5) * 0.04;
            targetPosY = Math.sin(t * 2.4) * 0.05;
            break;
          }
          case 'speaking': {
            const speakEnergy = curLevel > 0.03 ? curLevel : 0.45;
            targetRotX = Math.sin(t * 7.5) * 0.06 * speakEnergy;
            targetRotY = currentPointer.x * 0.16 + Math.sin(t * 2.4) * 0.08;
            targetRotZ = Math.cos(t * 3.8) * 0.045;
            targetPosY = Math.abs(Math.sin(t * 5.2)) * 0.055 * speakEnergy;
            break;
          }
          case 'success':
          case 'poke': {
            const bounceAmp = curCharId === 'zain-explorer' ? 0.22 : 0.15;
            const bounce = Math.abs(Math.sin(t * 7.5));
            targetPosY = bounce * bounceAmp;
            targetScaleX = 1 + (0.5 - bounce) * 0.06;
            targetScaleY = 1 + (bounce - 0.5) * 0.07;
            targetRotZ = Math.sin(t * 6) * 0.09;
            break;
          }
          case 'error': {
            targetRotX = 0.12;
            targetRotZ = 0.22 + Math.sin(t * 3) * 0.03;
            targetPosY = -0.04;
            break;
          }
          case 'sleepy': {
            targetRotX = 0.16 + Math.sin(t * 1.1) * 0.04;
            targetRotZ = 0.08;
            targetPosY = -0.04 + Math.sin(t * 1.1) * 0.03;
            break;
          }
        }
      }

      const damp = Math.min(1, delta * 8.5);
      smoothHeadRot.x += (targetRotX - smoothHeadRot.x) * damp;
      smoothHeadRot.y += (targetRotY - smoothHeadRot.y) * damp;
      smoothHeadRot.z += (targetRotZ - smoothHeadRot.z) * damp;
      smoothBodyPos.y += (targetPosY - smoothBodyPos.y) * damp;
      smoothBodyScale.x += (targetScaleX - smoothBodyScale.x) * damp;
      smoothBodyScale.y += (targetScaleY - smoothBodyScale.y) * damp;

      const switchFactor = 1 - switchScaleDip * 0.18;
      characterGroup.position.y = smoothBodyPos.y;
      characterGroup.rotation.y = spinAngle + switchScaleDip * 0.5;
      characterGroup.rotation.x = smoothHeadRot.x;
      characterGroup.rotation.z = smoothHeadRot.z;
      characterGroup.scale.set(
        smoothBodyScale.x * switchFactor,
        smoothBodyScale.y * switchFactor,
        smoothBodyScale.x * switchFactor
      );

      // Typing Desk Prop Transition & Arm Tapping Rhythm
      const isTypingActive = curState === 'typing';
      const targetDeskScale = isTypingActive ? 1.0 : 0.0;
      deskScaleSmooth += (targetDeskScale - deskScaleSmooth) * Math.min(1, delta * 12);
      typingDeskGroup.scale.setScalar(deskScaleSmooth);

      if (curCharId === 'milo-owl') {
        // Milo flaps wings during success, speaking, and poking
        if (curState === 'success' || curState === 'poke') {
          const flap = Math.sin(t * 16) * 0.45;
          miloLeftWingPivot.rotation.z = 0.35 + flap;
          miloRightWingPivot.rotation.z = -0.35 - flap;
        } else if (curState === 'speaking') {
          const flap = Math.sin(t * 8) * 0.18;
          miloLeftWingPivot.rotation.z = 0.2 + flap;
          miloRightWingPivot.rotation.z = -0.2 - flap;
        } else {
          miloLeftWingPivot.rotation.z = 0.15 + Math.sin(t * 1.8) * 0.03;
          miloRightWingPivot.rotation.z = -0.15 - Math.sin(t * 1.8) * 0.03;
        }
      } else {
        // Humanoid / Plush arms
        if (isTypingActive) {
          // Tapping hands alternately on desk!
          const leftTap = Math.sin(t * 14) * 0.18;
          const rightTap = Math.cos(t * 14) * 0.18;
          leftArmPivot.rotation.set(0.65 + leftTap, 0.25, 0.32);
          rightArmPivot.rotation.set(0.65 + rightTap, -0.25, -0.32);
        } else if (curCharId === 'ayan-scholar' && curState === 'thinking') {
          // Ayan pushes his glasses up when thinking!
          rightArmPivot.position.set(0.48, 0.08, 0.45);
          rightArmPivot.rotation.set(-0.85, -0.4, -0.6);
          leftArmPivot.rotation.set(0, 0, 0.42);
        } else if (curState === 'success' || curState === 'poke') {
          leftArmPivot.position.set(-0.84, -0.18, 0.12);
          rightArmPivot.position.set(0.84, -0.18, 0.12);
          leftArmPivot.rotation.set(0, 0, 0.75 + Math.sin(t * 12) * 0.25);
          rightArmPivot.rotation.set(0, 0, -2.15 + Math.sin(t * 14) * 0.35);
        } else if (curState === 'speaking') {
          leftArmPivot.position.set(-0.84, -0.18, 0.12);
          rightArmPivot.position.set(0.84, -0.18, 0.12);
          leftArmPivot.rotation.set(0, 0, 0.48 + Math.sin(t * 5.5) * 0.14);
          rightArmPivot.rotation.set(0, 0, -0.48 - Math.cos(t * 5.5) * 0.14);
        } else {
          leftArmPivot.position.set(-0.84, -0.18, 0.12);
          rightArmPivot.position.set(0.84, -0.18, 0.12);
          leftArmPivot.rotation.set(0, 0, 0.42 + Math.sin(t * 2.1) * 0.05);
          rightArmPivot.rotation.set(0, 0, -0.42 - Math.sin(t * 2.1) * 0.05);
        }
      }

      // Graduation cap tassel swing for Sage Classic
      tasselPivot.rotation.z = -smoothHeadRot.z * 1.4 + Math.sin(t * 3.2) * 0.08;

      // Nova digital visor eyes transitions
      if (curCharId === 'nova-bot') {
        const isNovaHappy = curState === 'success' || curState === 'poke';
        novaHappyLeft.visible = isNovaHappy;
        novaHappyRight.visible = isNovaHappy;
        novaLeftEyeMesh.visible = !isNovaHappy;
        novaRightEyeMesh.visible = !isNovaHappy;

        if (curState === 'thinking') {
          novaLeftEyeMesh.scale.set(0.8 + Math.sin(t * 8) * 0.3, 0.8 + Math.sin(t * 8) * 0.3, 1);
          novaRightEyeMesh.scale.set(0.8 - Math.sin(t * 8) * 0.3, 0.8 - Math.sin(t * 8) * 0.3, 1);
        } else {
          novaLeftEyeMesh.scale.set(1, 1, 1);
          novaRightEyeMesh.scale.set(1, 1, 1);
        }
      } else {
        // Natural blinking for other characters
        const showHappyArcs = curState === 'success' || curState === 'poke';
        leftHappyEye.visible = showHappyArcs;
        rightHappyEye.visible = showHappyArcs;
        leftEyeGroup.visible = !showHappyArcs;
        rightEyeGroup.visible = !showHappyArcs;

        if (!showHappyArcs) {
          if (blinkStart < 0 && t >= nextBlinkTime) {
            blinkStart = t;
          }
          let eyeScaleY = curState === 'sleepy' ? 0.32 : 1.0;
          if (blinkStart >= 0) {
            const progress = (t - blinkStart) / blinkDuration;
            if (progress >= 1) {
              blinkStart = -1;
              nextBlinkTime = t + (Math.random() < 0.22 ? 0.25 : 2.6 + Math.random() * 3.2);
            } else {
              const closeFactor = Math.sin(progress * Math.PI);
              eyeScaleY = Math.max(0.08, eyeScaleY * (1 - closeFactor * 0.94));
            }
          }

          const eyeOffsetX = currentPointer.x * 0.04;
          const eyeOffsetY =
            curState === 'typing'
              ? -0.035
              : curState === 'thinking'
              ? 0.035
              : currentPointer.y * 0.03;

          leftEyeGroup.position.set(-0.31 + eyeOffsetX, 0.08 + eyeOffsetY, 0);
          rightEyeGroup.position.set(0.31 + eyeOffsetX, 0.08 + eyeOffsetY, 0);
          leftEyeGroup.scale.set(1, eyeScaleY, 1);
          rightEyeGroup.scale.set(1, eyeScaleY, 1);
        }

        // Mouth Expression
        const useOpenMouth =
          curState === 'speaking' ||
          curState === 'thinking' ||
          curState === 'sleepy' ||
          curState === 'success' ||
          curState === 'poke';

        smileArcMesh.visible = !useOpenMouth;
        openMouthGroup.visible = useOpenMouth;

        if (useOpenMouth) {
          let targetMouthY = 0.5;
          let targetMouthX = 0.85;
          if (curState === 'speaking') {
            const syllabicWave =
              Math.abs(Math.sin(t * 13.5)) * 0.55 + Math.abs(Math.cos(t * 21.0)) * 0.45;
            const levelDrive = curLevel > 0.03 ? curLevel * 1.45 : syllabicWave * 0.75;
            targetMouthY = 0.35 + Math.min(1.35, levelDrive * 1.15);
            targetMouthX = 0.9 + Math.min(0.45, levelDrive * 0.35);
          } else if (curState === 'thinking') {
            targetMouthY = 0.42;
            targetMouthX = 0.55;
          } else if (curState === 'sleepy') {
            const yawnWave = Math.max(0, Math.sin(t * 0.9));
            targetMouthY = 0.32 + yawnWave * 0.75;
            targetMouthX = 0.6 + yawnWave * 0.35;
          } else if (curState === 'success' || curState === 'poke') {
            targetMouthY = 0.95;
            targetMouthX = 1.25;
          }
          smoothMouthOpen += (targetMouthY - smoothMouthOpen) * Math.min(1, delta * 18);
          openMouthGroup.scale.set(targetMouthX, smoothMouthOpen, 1);
        }
      }

      renderer.render(scene, camera);
      if (!hasMarkedReady) {
        hasMarkedReady = true;
        setWebglReady(true);
      }

      // Live mirror close-up of avatar head into header canvas
      const headerCanvas = headerCanvasRef?.current;
      if (headerCanvas) {
        const ctx = headerCanvas.getContext('2d');
        const srcCanvas = renderer.domElement;
        if (ctx && srcCanvas.width > 0 && srcCanvas.height > 0) {
          const cw = headerCanvas.width;
          const ch = headerCanvas.height;
          const minDim = Math.min(srcCanvas.width, srcCanvas.height);
          const cropSize = minDim * 0.78;
          const sx = (srcCanvas.width - cropSize) * 0.5;
          const sy = (srcCanvas.height - cropSize) * 0.42;
          ctx.clearRect(0, 0, cw, ch);
          ctx.drawImage(srcCanvas, sx, sy, cropSize, cropSize, 0, 0, cw, ch);
        }
      }
    };

    let hasMarkedReady = false;

    const syncContainerSize = () => {
      const w = Math.max(container.clientWidth || (compact ? 76 : 180), 68);
      const h = Math.max(container.clientHeight || (compact ? 76 : 180), 68);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    syncSizeRef.current = syncContainerSize;

    const startLoop = () => {
      if (rafId === null && isVisible && isDocumentVisible) {
        clock.getDelta();
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
      isDocumentVisible = !document.hidden;
      if (isDocumentVisible) startLoop();
      else stopLoop();
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    let observer: IntersectionObserver | null = null;
    if (typeof IntersectionObserver !== 'undefined') {
      observer = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          isVisible = Boolean(entry?.isIntersecting);
          if (isVisible) startLoop();
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
        const w = Math.max(entry.contentRect.width, 68);
        const h = Math.max(entry.contentRect.height, 68);
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
      setWebglReady(false);
    };
    renderer.domElement.addEventListener('webglcontextlost', handleContextLost, false);

    syncContainerSize();
    startLoop();

    return () => {
      stopLoop();
      applyCharacterRef.current = null;
      syncSizeRef.current = null;
      window.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      observer?.disconnect();
      resizeObserver?.disconnect();
      renderer.domElement.removeEventListener('webglcontextlost', handleContextLost);

      scene.traverse((obj: THREE.Object3D) => {
        if ((obj as THREE.Mesh).isMesh) {
          const mesh = obj as THREE.Mesh;
          mesh.geometry?.dispose();
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach((m: THREE.Material) => m.dispose());
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
  }, [headerCanvasRef]);

  const activeChar = getSageCharacterById(characterId);

  return (
    <div
      data-testid="sage-stage-avatar"
      data-compact={compact ? 'true' : 'false'}
      data-character={characterId}
      className={
        compact
          ? 'relative flex items-center justify-center gap-2.5 sm:gap-3 py-1 select-none transition-all duration-300 w-full max-w-2xl mx-auto'
          : 'relative flex flex-col items-center justify-center py-2 px-4 select-none transition-all duration-300 w-full max-w-md mx-auto'
      }
    >
      <div className="relative flex items-center justify-center">
        {/* Avatar Viewport (Pinned, Frameless, No Background Box) */}
        <div
          onClick={onPoke}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') onPoke?.();
          }}
          title={`Tap ${activeChar.name} to say hello!`}
          style={
            compact
              ? { width: '76px', height: '76px' }
              : { width: '180px', height: '180px' }
          }
          className={`relative flex items-center justify-center shrink-0 cursor-pointer transition-transform duration-200 ${
            isSwitchingChar ? 'scale-95 opacity-85' : 'scale-100 opacity-100'
          }`}
        >
          {/* Persistent WebGL Mount */}
          {webglSupported && (
            <div
              ref={mountRef}
              className={`w-full h-full relative z-10 transition-opacity duration-200 ${
                webglReady ? 'opacity-100' : 'opacity-0 pointer-events-none'
              }`}
            />
          )}

          {/* 2D Fallback */}
          {(!webglSupported || !webglReady) && (
            <div className="absolute inset-0 flex items-center justify-center z-0">
              <Plush2DFallback
                state={state}
                characterId={characterId}
                compact={compact}
                onPoke={onPoke}
              />
            </div>
          )}
        </div>

        {/* Thought Bubble in Empty Chat (Floats Beside Avatar) */}
        {!compact && (thoughtText || isTypingTransition) && (
          <div className="absolute left-[calc(50%+86px)] top-2 z-30 hidden sm:block">
            <SageThoughtBubble
              characterId={characterId}
              thoughtText={thoughtText}
              isTypingTransition={isTypingTransition}
              mode={thoughtMode}
              streamingSnippet={streamingSnippet}
              compact={false}
            />
          </div>
        )}
      </div>

      {compact ? (
        /* Thought Bubble in Compact Chat (Centered Beside 76px Avatar) */
        <div className="flex-1 min-w-0 max-w-[280px] sm:max-w-xs">
          <SageThoughtBubble
            characterId={characterId}
            thoughtText={
              thoughtText ||
              (state === 'speaking'
                ? 'Speaking step by step...'
                : state === 'listening'
                ? 'Listening to voice note...'
                : null)
            }
            isTypingTransition={isTypingTransition}
            mode={
              thoughtMode ||
              (state === 'speaking'
                ? 'streaming'
                : state === 'thinking'
                ? 'thinking'
                : state === 'listening'
                ? 'typing'
                : null)
            }
            streamingSnippet={streamingSnippet}
            compact={true}
          />
        </div>
      ) : (
        /* Empty Chat Greeting underneath Large Avatar */
        <div className="text-center mt-2 max-w-md bg-transparent">
          <h2 className="text-base sm:text-lg font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight">
            {greetingTitle}
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            {statusLabel || 'Your friendly AI study companion — ask a question below or tap me!'}
          </p>
        </div>
      )}
    </div>
  );
};

export default Sage3DAvatar;
