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
  /** Selected character ID (#1 sage-classic default + 8 additional characters) */
  characterId?: SageCharacterId;
  /** Custom user-assigned name for Sage */
  customName?: string;
  /** Shared canvas ref to mirror the live 3D head into the top-left header avatar */
  headerCanvasRef?: React.RefObject<HTMLCanvasElement | null>;
  /** Audio volume level 0..1 when speaking or recording */
  audioLevel?: number;
  /** Compact layout once messages exist */
  compact?: boolean;
  /** Optional custom size class override (used in Profile drawer or Roaming Cat guide) */
  sizeClassName?: string;
  /** Hide greeting and thought bubble (e.g., when used inside Profile drawer or Roaming guide) */
  chromeless?: boolean;
  /** Optional horizontal lean / direction hint (-1..1) for roaming movement */
  roamLeanX?: number;
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
  customName,
  headerCanvasRef,
  audioLevel = 0,
  compact = false,
  sizeClassName,
  chromeless = false,
  roamLeanX = 0,
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
  const roamLeanXRef = useRef<number>(roamLeanX);
  const applyCharacterRef = useRef<((id: SageCharacterId, animateSwitch: boolean) => void) | null>(null);
  const syncSizeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    roamLeanXRef.current = roamLeanX;
  }, [roamLeanX]);

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
    // RIG 7: TANGO CAT (Fluffy orange tabby cat, gold/obsidian scarf, pencil behind ear, swishing tail)
    // ═══════════════════════════════════════════════════════════════════════
    const tangoRig = new THREE.Group();
    tangoRig.visible = false;
    characterGroup.add(tangoRig);

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

    // Squishy Tabby Head + Chubby Body
    const tangoHeadGeo = new THREE.SphereGeometry(0.92, 48, 48);
    tangoHeadGeo.scale(1.08, 0.94, 0.98);
    const tangoHeadMesh = new THREE.Mesh(tangoHeadGeo, tangoOrangeMat);
    tangoRig.add(tangoHeadMesh);

    // Tabby Stripes on Forehead
    [-0.16, 0, 0.16].forEach((sx, idx) => {
      const stripe = new THREE.Mesh(new THREE.CapsuleGeometry(0.028, idx === 1 ? 0.24 : 0.18, 8, 12), tangoStripeMat);
      stripe.position.set(sx, 0.56, 0.74);
      stripe.rotation.set(0.52, 0, sx * -0.4);
      tangoRig.add(stripe);
    });

    // Pointed Cat Ears (Pivots for ear twitches)
    const tangoLeftEar = new THREE.Group();
    tangoLeftEar.position.set(-0.62, 0.72, 0.05);
    tangoLeftEar.rotation.set(0.08, 0, 0.35);
    tangoRig.add(tangoLeftEar);
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
    tangoRig.add(tangoRightEar);
    const tangoRightEarMesh = new THREE.Mesh(catEarConeGeo, tangoOrangeMat);
    tangoRig.add(tangoRightEar);
    tangoRightEar.add(tangoRightEarMesh);
    const tangoRightEarInner = new THREE.Mesh(catEarInnerConeGeo, tangoEarInnerMat);
    tangoRightEarInner.position.set(0, -0.02, 0.11);
    tangoRightEar.add(tangoRightEarInner);

    // Tiny Gold Pencil Tucked Behind Right Ear
    const pencilGroup = new THREE.Group();
    pencilGroup.position.set(0.76, 0.58, 0.16);
    pencilGroup.rotation.set(0.25, 0.15, -0.58);
    tangoRig.add(pencilGroup);
    const pencilShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.036, 0.46, 12), goldStarMat);
    pencilGroup.add(pencilShaft);
    const pencilTip = new THREE.Mesh(new THREE.ConeGeometry(0.036, 0.12, 12), obsidianMat);
    pencilTip.position.y = 0.29;
    pencilGroup.add(pencilTip);
    const pencilEraser = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.036, 0.08, 12), tangoEarInnerMat);
    pencilEraser.position.y = -0.26;
    pencilGroup.add(pencilEraser);

    // Pink Triangular Cat Nose & Whiskers
    const catNose = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.065, 12), tangoEarInnerMat);
    catNose.position.set(0, 0.01, 0.94);
    catNose.rotation.x = Math.PI;
    tangoRig.add(catNose);

    [-1, 1].forEach((side) => {
      [-0.04, 0.04].forEach((wy, wIdx) => {
        const whisker = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.34, 8), tangoStripeMat);
        whisker.rotation.z = Math.PI / 2 + side * (wIdx === 0 ? 0.14 : -0.1);
        whisker.position.set(side * 0.72, -0.04 + wy, 0.68);
        tangoRig.add(whisker);
      });
    });

    // Tango Gold & Obsidian Scarf
    const tangoScarf = new THREE.Group();
    tangoScarf.position.set(0, -0.66, 0.02);
    tangoRig.add(tangoScarf);
    const tangoScarfRing = new THREE.Mesh(scarfRingGeo, goldMat);
    tangoScarfRing.rotation.x = Math.PI / 2 + 0.08;
    tangoScarf.add(tangoScarfRing);
    const tangoScarfStripe = new THREE.Mesh(new THREE.TorusGeometry(0.68, 0.045, 12, 36), obsidianMat);
    tangoScarfStripe.rotation.x = Math.PI / 2 + 0.08;
    tangoScarfStripe.position.y = -0.03;
    tangoScarf.add(tangoScarfStripe);

    // Tango Swishing Tail Pivot
    const tangoTailPivot = new THREE.Group();
    tangoTailPivot.position.set(0.55, -0.58, -0.55);
    tangoRig.add(tangoTailPivot);
    const tailSeg1 = new THREE.Mesh(new THREE.CapsuleGeometry(0.11, 0.48, 12, 16), tangoOrangeMat);
    tailSeg1.position.set(0.28, 0.25, 0);
    tailSeg1.rotation.z = -0.65;
    tangoTailPivot.add(tailSeg1);
    const tailTip = new THREE.Mesh(new THREE.SphereGeometry(0.125, 16, 16), whiteMat);
    tailTip.position.set(0.45, 0.48, 0);
    tangoTailPivot.add(tailTip);

    // Tango Paws
    const tangoLeftPaw = new THREE.Mesh(footGeo, whiteMat);
    tangoLeftPaw.position.set(-0.34, -0.92, 0.14);
    tangoLeftPaw.rotation.y = 0.16;
    tangoRig.add(tangoLeftPaw);
    const tangoRightPaw = new THREE.Mesh(footGeo, whiteMat);
    tangoRightPaw.position.set(0.34, -0.92, 0.14);
    tangoRightPaw.rotation.y = -0.16;
    tangoRig.add(tangoRightPaw);

    // ═══════════════════════════════════════════════════════════════════════
    // RIG 8: GIGI GIRAFFE (Tall gentle giraffe, ossicones, spotted coat, bow tie, tiny book, bends neck when typing)
    // ═══════════════════════════════════════════════════════════════════════
    const gigiRig = new THREE.Group();
    gigiRig.visible = false;
    characterGroup.add(gigiRig);

    const gigiCoatMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#FBBF24'),
      roughness: 0.74,
      metalness: 0.01,
      sheen: 0.9,
      sheenColor: new THREE.Color('#FEF3C7'),
      bumpMap: plushBumpTex || undefined,
      bumpScale: 0.014,
    });

    const gigiSpotMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#92400E'),
      roughness: 0.82,
    });

    const gigiMuzzleMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#FFFBEB'),
      roughness: 0.78,
    });

    // Lower Spotted Giraffe Body + Tiny Book
    const gigiTorsoGeo = new THREE.SphereGeometry(0.68, 36, 36);
    gigiTorsoGeo.scale(1.02, 0.78, 0.94);
    const gigiTorsoMesh = new THREE.Mesh(gigiTorsoGeo, gigiCoatMat);
    gigiTorsoMesh.position.set(0, -0.58, -0.04);
    gigiRig.add(gigiTorsoMesh);

    // Gold & Obsidian Bow Tie on Neck Base
    const bowTieGroup = new THREE.Group();
    bowTieGroup.position.set(0, -0.32, 0.62);
    gigiRig.add(bowTieGroup);
    const bowWingGeo = new THREE.ConeGeometry(0.14, 0.24, 12);
    const bowLeft = new THREE.Mesh(bowWingGeo, goldStarMat);
    bowLeft.rotation.z = -Math.PI / 2;
    bowLeft.position.x = -0.12;
    bowTieGroup.add(bowLeft);
    const bowRight = new THREE.Mesh(bowWingGeo, goldStarMat);
    bowRight.rotation.z = Math.PI / 2;
    bowRight.position.x = 0.12;
    bowTieGroup.add(bowRight);
    const bowCenter = new THREE.Mesh(new THREE.SphereGeometry(0.065, 14, 14), obsidianMat);
    bowTieGroup.add(bowCenter);

    // Tiny Study Book held near Gigi's chest
    const gigiBook = bookGroup.clone();
    gigiBook.position.set(0, -0.68, 0.72);
    gigiBook.scale.setScalar(0.88);
    gigiRig.add(gigiBook);

    // Articulated Neck + Head Pivot (bends down when typing!)
    const gigiNeckPivot = new THREE.Group();
    gigiNeckPivot.position.set(0, -0.28, 0);
    gigiRig.add(gigiNeckPivot);

    const gigiNeckMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.42, 0.62, 24), gigiCoatMat);
    gigiNeckMesh.position.set(0, 0.2, 0);
    gigiNeckPivot.add(gigiNeckMesh);

    // Giraffe Spots on Neck
    [
      { x: -0.18, y: 0.18, z: 0.34, r: 0.075 },
      { x: 0.2, y: 0.28, z: 0.31, r: 0.085 },
      { x: -0.08, y: 0.35, z: 0.33, r: 0.065 },
    ].forEach((sp) => {
      const spot = new THREE.Mesh(new THREE.SphereGeometry(sp.r, 12, 12), gigiSpotMat);
      spot.scale.set(1, 1, 0.35);
      spot.position.set(sp.x, sp.y, sp.z);
      gigiNeckPivot.add(spot);
    });

    // Giraffe Plush Head atop Neck
    const gigiHeadGeo = new THREE.SphereGeometry(0.76, 42, 42);
    gigiHeadGeo.scale(1.04, 0.95, 1.02);
    const gigiHeadMesh = new THREE.Mesh(gigiHeadGeo, gigiCoatMat);
    gigiHeadMesh.position.set(0, 0.46, 0.06);
    gigiNeckPivot.add(gigiHeadMesh);

    // Soft Cream Muzzle
    const gigiMuzzle = new THREE.Mesh(new THREE.SphereGeometry(0.42, 24, 24), gigiMuzzleMat);
    gigiMuzzle.scale.set(1.22, 0.72, 0.75);
    gigiMuzzle.position.set(0, 0.32, 0.62);
    gigiNeckPivot.add(gigiMuzzle);

    // Cute Giraffe Ossicones (Horns) on Top
    [-0.24, 0.24].forEach((ox) => {
      const stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.055, 0.28, 12), gigiCoatMat);
      stalk.position.set(ox, 1.18, 0.04);
      stalk.rotation.z = ox < 0 ? 0.15 : -0.15;
      gigiNeckPivot.add(stalk);
      const tuft = new THREE.Mesh(new THREE.SphereGeometry(0.095, 16, 16), gigiSpotMat);
      tuft.position.set(ox * 1.12, 1.33, 0.04);
      gigiNeckPivot.add(tuft);
    });

    // Giraffe Leaf Ears
    [-0.68, 0.68].forEach((ex) => {
      const gEar = new THREE.Mesh(new THREE.SphereGeometry(0.18, 16, 16), gigiCoatMat);
      gEar.scale.set(1.35, 0.55, 0.5);
      gEar.position.set(ex, 0.78, 0.02);
      gigiNeckPivot.add(gEar);
    });

    const gigiLeftHoof = new THREE.Mesh(footGeo, gigiSpotMat);
    gigiLeftHoof.position.set(-0.32, -0.94, 0.12);
    gigiRig.add(gigiLeftHoof);
    const gigiRightHoof = new THREE.Mesh(footGeo, gigiSpotMat);
    gigiRightHoof.position.set(0.32, -0.94, 0.12);
    gigiRig.add(gigiRightHoof);

    // ═══════════════════════════════════════════════════════════════════════
    // RIG 9: LUMI LAMP (Emerald green shade, articulated metallic arm, warm base, glowing idea bulb)
    // ═══════════════════════════════════════════════════════════════════════
    const lumiRig = new THREE.Group();
    lumiRig.visible = false;
    characterGroup.add(lumiRig);

    const lumiEmeraldMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#10B981'),
      roughness: 0.28,
      metalness: 0.15,
      clearcoat: 0.85,
      clearcoatRoughness: 0.12,
    });

    const lumiArmMetalMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#CBD5E1'),
      roughness: 0.3,
      metalness: 0.78,
    });

    const lumiBulbMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#FEF08A'),
      emissive: new THREE.Color('#FACC15'),
      emissiveIntensity: 0.85,
      roughness: 0.15,
    });

    // Warm Circular Lamp Base
    const lumiBase = new THREE.Mesh(new THREE.CylinderGeometry(0.56, 0.64, 0.16, 32), goldMat);
    lumiBase.position.set(0, -0.88, 0);
    lumiRig.add(lumiBase);

    const lumiBaseTrim = new THREE.Mesh(new THREE.TorusGeometry(0.58, 0.04, 12, 36), obsidianMat);
    lumiBaseTrim.rotation.x = Math.PI / 2;
    lumiBaseTrim.position.set(0, -0.82, 0);
    lumiRig.add(lumiBaseTrim);

    // Articulated Metallic Lamp Arm with Gold Elbow Joint
    const lumiLowerArm = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.56, 16), lumiArmMetalMat);
    lumiLowerArm.position.set(-0.14, -0.62, -0.18);
    lumiLowerArm.rotation.z = 0.38;
    lumiRig.add(lumiLowerArm);

    const lumiElbowJoint = new THREE.Mesh(new THREE.SphereGeometry(0.1, 16, 16), goldStarMat);
    lumiElbowJoint.position.set(-0.24, -0.36, -0.18);
    lumiRig.add(lumiElbowJoint);

    const lumiUpperArm = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.56, 16), lumiArmMetalMat);
    lumiUpperArm.position.set(-0.12, -0.12, -0.08);
    lumiUpperArm.rotation.z = -0.42;
    lumiRig.add(lumiUpperArm);

    // Lumi Emerald Shade Head Pivot
    const lumiShadePivot = new THREE.Group();
    lumiShadePivot.position.set(0, 0.16, 0.06);
    lumiRig.add(lumiShadePivot);

    // Conical Emerald Lamp Shade (Open bottom)
    const lumiShadeGeo = new THREE.CylinderGeometry(0.46, 0.86, 0.88, 36, 1, false);
    const lumiShadeMesh = new THREE.Mesh(lumiShadeGeo, lumiEmeraldMat);
    lumiShadePivot.add(lumiShadeMesh);

    // Gold Rim along Bottom of Shade
    const lumiShadeRim = new THREE.Mesh(new THREE.TorusGeometry(0.86, 0.045, 16, 42), goldStarMat);
    lumiShadeRim.rotation.x = Math.PI / 2;
    lumiShadeRim.position.y = -0.43;
    lumiShadePivot.add(lumiShadeRim);

    // Top Gold Switch Knob
    const lumiTopKnob = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.16, 20), goldStarMat);
    lumiTopKnob.position.y = 0.5;
    lumiShadePivot.add(lumiTopKnob);

    // Glowing Warm Idea Bulb & Dynamic PointLight Inside Shade
    const lumiBulbMesh = new THREE.Mesh(new THREE.SphereGeometry(0.34, 24, 24), lumiBulbMat);
    lumiBulbMesh.position.set(0, -0.38, 0.06);
    lumiShadePivot.add(lumiBulbMesh);

    const lumiBulbLight = new THREE.PointLight(0xfef08a, 1.2, 6);
    lumiBulbLight.position.set(0, -0.45, 0.35);
    lumiShadePivot.add(lumiBulbLight);

    // ═══════════════════════════════════════════════════════════════════════
    // COMMON FACE FEATURES (For all characters except Nova Bot)
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
    characterGroup.add(leftArmPivot);
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
      const persona = SAGE_THOUGHT_DATA[id] || SAGE_THOUGHT_DATA['sage-classic'];

      // Toggle active rig among all 9 characters
      sageRig.visible = id === 'sage-classic';
      ayanRig.visible = id === 'ayan-scholar';
      zainRig.visible = id === 'zain-explorer';
      hamzaRig.visible = id === 'hamza-kurta';
      novaRig.visible = id === 'nova-bot';
      miloRig.visible = id === 'milo-owl';
      tangoRig.visible = id === 'tango-cat';
      gigiRig.visible = id === 'gigi-giraffe';
      lumiRig.visible = id === 'lumi-lamp';

      // Hide common face on Nova Bot (she has full cyber visor)
      commonFaceGroup.visible = id !== 'nova-bot';

      // Position commonFaceGroup accurately on each character's head/shade
      if (id === 'gigi-giraffe') {
        commonFaceGroup.position.set(0, 0.24, 0.78);
      } else if (id === 'lumi-lamp') {
        commonFaceGroup.position.set(0, 0.16, 0.74);
      } else {
        commonFaceGroup.position.set(0, 0.03, 0.87);
      }

      // Update arm materials & visibility to match character skin/coat
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
      } else if (id === 'tango-cat') {
        leftArmMesh.material = tangoOrangeMat;
        rightArmMesh.material = tangoOrangeMat;
        leftArmPivot.visible = true;
        rightArmPivot.visible = true;
      } else if (id === 'gigi-giraffe') {
        leftArmMesh.material = gigiCoatMat;
        rightArmMesh.material = gigiCoatMat;
        leftArmPivot.visible = true;
        rightArmPivot.visible = true;
      } else if (id === 'milo-owl' || id === 'lumi-lamp') {
        // Milo uses wings; Lumi is an articulated desk lamp
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

    // ═══════════════════════════════════════════════════════════════════════
    // ACCURATE POINTER / TOUCH / TILT TRACKING IN AVATAR COORDINATE SPACE
    // ═══════════════════════════════════════════════════════════════════════
    const targetPointer = { x: 0, y: 0 };
    const currentPointer = { x: 0, y: 0 };
    let cachedCanvasRect = renderer.domElement.getBoundingClientRect();
    let lastTouchOrPointerTime = 0;

    const updateCanvasRect = () => {
      if (renderer.domElement && renderer.domElement.isConnected) {
        cachedCanvasRect = renderer.domElement.getBoundingClientRect();
      }
    };

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const updateTargetFromClientXY = (clientX: number, clientY: number) => {
      if (prefersReducedMotion) return;
      if (cachedCanvasRect.width < 10 || cachedCanvasRect.height < 10) {
        updateCanvasRect();
      }
      const centerX = cachedCanvasRect.left + cachedCanvasRect.width * 0.5;
      const centerY = cachedCanvasRect.top + cachedCanvasRect.height * 0.5;
      const maxRadiusX = Math.max(cachedCanvasRect.width * 1.85, window.innerWidth * 0.42, 160);
      const maxRadiusY = Math.max(cachedCanvasRect.height * 1.85, window.innerHeight * 0.42, 160);

      const nx = (clientX - centerX) / maxRadiusX;
      const ny = -(clientY - centerY) / maxRadiusY;

      targetPointer.x = Math.max(-1, Math.min(1, nx));
      targetPointer.y = Math.max(-1, Math.min(1, ny));
      lastTouchOrPointerTime = performance.now();
    };

    const handlePointerMove = (e: PointerEvent) => {
      updateTargetFromClientXY(e.clientX, e.clientY);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches && e.touches.length > 0) {
        updateTargetFromClientXY(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    const handlePointerLeaveWindow = () => {
      targetPointer.x = 0;
      targetPointer.y = 0;
    };

    const handleDeviceOrientation = (e: DeviceOrientationEvent) => {
      if (prefersReducedMotion) return;
      // Only use device tilt if user hasn't touched/moved pointer in the last 2.5 seconds
      if (performance.now() - lastTouchOrPointerTime < 2500) return;
      if (e.gamma === null || e.beta === null) return;
      const tiltX = Math.max(-1, Math.min(1, e.gamma / 30));
      const tiltY = Math.max(-1, Math.min(1, -(e.beta - 45) / 30));
      targetPointer.x = tiltX * 0.75;
      targetPointer.y = tiltY * 0.75;
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchstart', handleTouchMove, { passive: true });
    window.addEventListener('resize', updateCanvasRect, { passive: true });
    window.addEventListener('scroll', updateCanvasRect, { passive: true, capture: true });
    document.addEventListener('mouseleave', handlePointerLeaveWindow);
    window.addEventListener('blur', handlePointerLeaveWindow);
    window.addEventListener('deviceorientation', handleDeviceOrientation, { passive: true });

    let rafId: number | null = null;
    let isVisible = true;
    let isDocumentVisible = !document.hidden;
    const clock = new THREE.Clock();

    let nextBlinkTime = 2.2 + Math.random() * 2.5;
    let blinkStart = -1;

    const smoothHeadRot = { x: 0, y: 0, z: 0 };
    const smoothBodyPos = { x: 0, y: 0 };
    const smoothBodyScale = { x: 1, y: 1, z: 1 };
    let smoothMouthOpen = 0.08;
    let spinAngle = 0;
    let lastHandledPokeCount = pokeCountRef.current;
    let deskScaleSmooth = 0;
    let gigiNeckBendSmooth = 0;

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
      const roamLean = roamLeanXRef.current || 0;

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

      // Smooth damped pointer interpolation
      const pointerDamp = Math.min(1, delta * 7.5);
      currentPointer.x += (targetPointer.x - currentPointer.x) * pointerDamp;
      currentPointer.y += (targetPointer.y - currentPointer.y) * pointerDamp;

      // Target Pose computation with accurate head turn + slight body lean toward cursor
      let targetRotX = -currentPointer.y * 0.22;
      let targetRotY = currentPointer.x * 0.34 + roamLean * 0.28;
      let targetRotZ = -currentPointer.x * 0.075 - roamLean * 0.12;
      let targetPosX = currentPointer.x * 0.045;
      let targetPosY = Math.sin(t * 2.1) * 0.045;
      let targetScaleX = 1 + Math.sin(t * 2.1) * 0.012;
      let targetScaleY = 1 - Math.sin(t * 2.1) * 0.012;

      // Character-specific movement quirks
      if (curCharId === 'zain-explorer') {
        targetPosY = Math.sin(t * 3.8) * 0.06;
      } else if (curCharId === 'nova-bot') {
        targetPosY = Math.sin(t * 2.4) * 0.075 + Math.cos(t * 1.2) * 0.02;
        targetRotZ += Math.sin(t * 1.8) * 0.04;
      } else if (curCharId === 'hamza-kurta') {
        targetPosY = Math.sin(t * 1.5) * 0.035;
      } else if (curCharId === 'tango-cat') {
        // Playful springy cat bobbing
        targetPosY = Math.sin(t * 2.6) * 0.05;
      } else if (curCharId === 'gigi-giraffe') {
        // Graceful gentle sway
        targetPosY = Math.sin(t * 1.7) * 0.04;
        targetRotZ += Math.sin(t * 1.4) * 0.03;
      } else if (curCharId === 'lumi-lamp') {
        // Tiny playful desk-lamp hops
        const hopWave = Math.max(0, Math.sin(t * 2.8));
        targetPosY = Math.pow(hopWave, 2) * 0.065;
      }

      if (prefersReducedMotion) {
        targetRotX = 0;
        targetRotY = 0;
        targetRotZ = 0;
        targetPosX = 0;
        targetPosY = 0;
        targetScaleX = 1;
        targetScaleY = 1;
      } else {
        switch (curState) {
          case 'idle': {
            const slowLook = Math.sin(t * 0.55) * 0.06;
            targetRotY += slowLook;
            targetRotZ += Math.sin(t * 0.8) * 0.03;
            break;
          }
          case 'typing': {
            targetRotX = 0.22;
            targetRotY = currentPointer.x * 0.14 + Math.sin(t * 2.4) * 0.03;
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
            targetRotY = currentPointer.x * 0.18 + Math.sin(t * 2.4) * 0.08;
            targetRotZ = Math.cos(t * 3.8) * 0.045;
            targetPosY = Math.abs(Math.sin(t * 5.2)) * 0.055 * speakEnergy;
            break;
          }
          case 'success':
          case 'poke': {
            const bounceAmp = curCharId === 'zain-explorer' || curCharId === 'lumi-lamp' ? 0.22 : 0.16;
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
      smoothBodyPos.x += (targetPosX - smoothBodyPos.x) * damp;
      smoothBodyPos.y += (targetPosY - smoothBodyPos.y) * damp;
      smoothBodyScale.x += (targetScaleX - smoothBodyScale.x) * damp;
      smoothBodyScale.y += (targetScaleY - smoothBodyScale.y) * damp;

      const switchFactor = 1 - switchScaleDip * 0.18;
      characterGroup.position.x = smoothBodyPos.x;
      characterGroup.position.y = smoothBodyPos.y;
      characterGroup.rotation.y = smoothHeadRot.y + spinAngle + switchScaleDip * 0.5;
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

      // ── Character-Specific Rig Animations (#7 Tango, #8 Gigi, #9 Lumi) ──
      if (curCharId === 'tango-cat') {
        // Swishing tail & ear twitches
        const swishSpeed = curState === 'success' || curState === 'poke' ? 9.5 : isTypingActive ? 6.0 : 3.2;
        tangoTailPivot.rotation.z = Math.sin(t * swishSpeed) * 0.35;
        tangoTailPivot.rotation.y = Math.cos(t * (swishSpeed * 0.7)) * 0.25;

        const earTwitchL = Math.sin(t * 7.3) > 0.92 ? 0.18 : 0;
        const earTwitchR = Math.cos(t * 6.1) > 0.92 ? -0.18 : 0;
        tangoLeftEar.rotation.z = 0.35 + earTwitchL;
        tangoRightEar.rotation.z = -0.35 + earTwitchR;
      } else if (curCharId === 'gigi-giraffe') {
        // Gigi bends its tall neck/head down toward the input box when typing!
        const targetNeckBend = isTypingActive ? 0.36 : curState === 'thinking' ? -0.08 : 0.0;
        gigiNeckBendSmooth += (targetNeckBend - gigiNeckBendSmooth) * Math.min(1, delta * 8);
        gigiNeckPivot.rotation.x = gigiNeckBendSmooth + Math.sin(t * 1.8) * 0.03;
        gigiNeckPivot.rotation.z = Math.cos(t * 1.4) * 0.04 - currentPointer.x * 0.08;
        commonFaceGroup.position.y = 0.24 - gigiNeckBendSmooth * 0.22;
        commonFaceGroup.position.z = 0.78 + gigiNeckBendSmooth * 0.18;
      } else if (curCharId === 'lumi-lamp') {
        // Lumi bulb glows brighter when thinking or when it has an idea (success / poke)
        const hasIdea = curState === 'thinking' || curState === 'success' || curState === 'poke';
        const pulseGlow = hasIdea ? 1.8 + Math.sin(t * 8) * 0.45 : isTypingActive ? 1.35 : 0.85;
        lumiBulbMat.emissiveIntensity = pulseGlow;
        lumiBulbLight.intensity = pulseGlow * 1.3;
        lumiShadePivot.rotation.z = Math.sin(t * 2.2) * 0.06 - currentPointer.x * 0.1;
        lumiShadePivot.rotation.x = isTypingActive ? 0.18 : Math.cos(t * 1.7) * 0.04;
      }

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
      } else if (curCharId !== 'lumi-lamp') {
        // Humanoid / Plush arms
        if (isTypingActive) {
          const leftTap = Math.sin(t * 14) * 0.18;
          const rightTap = Math.cos(t * 14) * 0.18;
          leftArmPivot.rotation.set(0.65 + leftTap, 0.25, 0.32);
          rightArmPivot.rotation.set(0.65 + rightTap, -0.25, -0.32);
        } else if (curCharId === 'ayan-scholar' && curState === 'thinking') {
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
        // Natural blinking for other characters (Tango does cozy slow cat blinks!)
        const showHappyArcs = curState === 'success' || curState === 'poke';
        leftHappyEye.visible = showHappyArcs;
        rightHappyEye.visible = showHappyArcs;
        leftEyeGroup.visible = !showHappyArcs;
        rightEyeGroup.visible = !showHappyArcs;

        if (!showHappyArcs) {
          const activeBlinkDuration = curCharId === 'tango-cat' ? 0.32 : 0.17;
          if (blinkStart < 0 && t >= nextBlinkTime) {
            blinkStart = t;
          }
          let eyeScaleY = curState === 'sleepy' ? 0.32 : 1.0;
          if (blinkStart >= 0) {
            const progress = (t - blinkStart) / activeBlinkDuration;
            if (progress >= 1) {
              blinkStart = -1;
              nextBlinkTime = t + (Math.random() < 0.22 ? 0.28 : 2.6 + Math.random() * 3.2);
            } else {
              const closeFactor = Math.sin(progress * Math.PI);
              eyeScaleY = Math.max(0.08, eyeScaleY * (1 - closeFactor * 0.94));
            }
          }

          // Accurate eye look offset toward cursor
          const eyeOffsetX = currentPointer.x * 0.055;
          const eyeOffsetY =
            curState === 'typing'
              ? -0.042
              : curState === 'thinking'
              ? 0.042
              : currentPointer.y * 0.045;

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
      const w = Math.max(container.clientWidth || (compact ? 104 : 216), 68);
      const h = Math.max(container.clientHeight || (compact ? 104 : 216), 68);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      updateCanvasRect();
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
        updateCanvasRect();
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
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchstart', handleTouchMove);
      window.removeEventListener('resize', updateCanvasRect);
      window.removeEventListener('scroll', updateCanvasRect, true);
      document.removeEventListener('mouseleave', handlePointerLeaveWindow);
      window.removeEventListener('blur', handlePointerLeaveWindow);
      window.removeEventListener('deviceorientation', handleDeviceOrientation);
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
  const effectiveLabel = customName?.trim() || activeChar.name;

  const resolvedThoughtText =
    thoughtText ||
    (state === 'speaking'
      ? 'Speaking step by step...'
      : state === 'listening'
      ? 'Listening to voice note...'
      : null);

  const resolvedThoughtMode =
    thoughtMode ||
    (state === 'speaking'
      ? 'streaming'
      : state === 'thinking'
      ? 'thinking'
      : state === 'listening'
      ? 'typing'
      : null);

  const hasActiveThought = Boolean(
    !chromeless && ((resolvedThoughtText && resolvedThoughtText.trim().length > 0) || isTypingTransition)
  );

  // Task 1: ~30% larger in both states (was 160/180 -> 208/234; was 80/88 -> 104/114)
  const resolvedSizeClasses =
    sizeClassName ||
    (compact
      ? 'w-[104px] h-[104px] sm:w-[114px] sm:h-[114px]'
      : 'w-[208px] h-[208px] sm:w-[234px] sm:h-[234px]');

  return (
    <div
      data-testid="sage-stage-avatar"
      data-compact={compact ? 'true' : 'false'}
      data-character={characterId}
      className="relative flex flex-col items-center justify-center w-full mx-auto bg-transparent border-0 shadow-none select-none pointer-events-none transition-all duration-300"
    >
      {/* Centered Frameless Avatar Viewport (Zero white background/border/shadow) */}
      <div
        onClick={onPoke}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') onPoke?.();
        }}
        title={`Tap ${effectiveLabel} to say hello!`}
        className={`pointer-events-auto relative flex items-center justify-center shrink-0 mx-auto cursor-pointer bg-transparent border-0 shadow-none transition-all duration-200 ${resolvedSizeClasses} ${
          isSwitchingChar ? 'scale-95 opacity-85' : 'scale-100 opacity-100'
        }`}
      >
        {/* Persistent Transparent WebGL Mount */}
        {webglSupported && (
          <div
            ref={mountRef}
            className={`w-full h-full relative z-10 bg-transparent border-0 shadow-none transition-opacity duration-200 ${
              webglReady ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
          />
        )}

        {/* 2D Fallback */}
        {(!webglSupported || !webglReady) && (
          <div className="absolute inset-0 flex items-center justify-center z-0 bg-transparent">
            <Plush2DFallback
              state={state}
              characterId={characterId}
              compact={compact}
              onPoke={onPoke}
            />
          </div>
        )}
      </div>

      {/* Empty Chat Greeting Centered Underneath Large Avatar (No Background) */}
      {!compact && !chromeless && (
        <div className="text-center mt-1 px-3 max-w-md mx-auto bg-transparent border-0 shadow-none pointer-events-none">
          <h2 className="text-base sm:text-lg font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight bg-transparent">
            {greetingTitle}
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 bg-transparent">
            {statusLabel || 'Your friendly AI study companion — ask a question below or tap me!'}
          </p>
        </div>
      )}

      {/* Centered Thought Bubble Directly Under Avatar (Never Shifts Avatar or Clips) */}
      {hasActiveThought && (
        <div className="mt-1 flex items-center justify-center w-full px-3 mx-auto bg-transparent pointer-events-none z-30">
          <SageThoughtBubble
            characterId={characterId}
            customName={customName}
            thoughtText={resolvedThoughtText}
            isTypingTransition={isTypingTransition}
            mode={resolvedThoughtMode}
            streamingSnippet={streamingSnippet}
            compact={compact}
          />
        </div>
      )}
    </div>
  );
};

export default Sage3DAvatar;
