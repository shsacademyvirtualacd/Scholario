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

export type { Sage3DAvatarState };

export interface Sage3DAvatarProps {
  state: Sage3DAvatarState;
  /** Selected character ID (#1 sage-classic default + 5 additional characters) */
  characterId?: SageCharacterId;
  /** Shared canvas ref to mirror the live 3D head into the top-left header avatar */
  headerCanvasRef?: React.RefObject<HTMLCanvasElement | null>;
  /** Audio volume level 0..1 when speaking or recording */
  audioLevel?: number;
  /** Compact layout (72px docked at top of chat) once messages exist */
  compact?: boolean;
  /** Optional subtitle/status label */
  statusLabel?: string;
  /** Greeting title when shown large in empty/fresh chat */
  greetingTitle?: string;
  /** Triggered when the user taps or clicks the avatar */
  onPoke?: () => void;
  /** Incremented counter for tap reactions */
  pokeCount?: number;
}

/**
 * Generates a soft procedural fuzzy/velvet micro-grain canvas texture
 * so the plush character has a warm tactile surface with zero external assets.
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

  for (let i = 0; i < 2400; i++) {
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
 * Creates a cute 3D 5-pointed star geometry for the scarf badge and celebration sparkles.
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
 * Used automatically if WebGL is unavailable on a device.
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
        compact ? 'w-16 h-16' : 'w-40 h-40'
      } ${state === 'poke' || state === 'success' ? 'animate-bounce' : ''}`}
      title={`Tap ${charDef.name} to say hello!`}
    >
      <div
        className={`absolute inset-1 rounded-full blur-xl transition-opacity duration-500 pointer-events-none ${
          state === 'listening'
            ? 'bg-amber-300/40 opacity-100 scale-110'
            : state === 'thinking'
            ? 'bg-amber-200/35 opacity-90'
            : 'bg-amber-100/30 dark:bg-amber-400/15 opacity-75'
        }`}
      />
      <SageCharacterSvg
        characterId={characterId}
        avatarState={state}
        svgSize={compact ? 64 : 152}
        uid={compact ? 'fallback-sm' : 'fallback-lg'}
      />
    </div>
  );
};

/**
 * 3D Plush Character Rig for Sage AI supporting all 6 selectable characters:
 * 1. `sage-classic` — Classic cream character with tilted graduation cap & gold scarf (Default)
 * 2. `ayan-scholar` — Boy with short dark hair, round gold-rimmed glasses & gold-trimmed sweater
 * 3. `zain-explorer` — Boy with knit beanie cap & twin backpack straps with gold buckles
 * 4. `hamza-kurta` — Boy in traditional Pakistani kurta collar with gold button accents
 * 5. `nova-bot` — Cute soft porcelain-white & gold robot friend with glowing antenna
 * 6. `milo-owl` — Fluffy cocoa-cream owl companion holding a miniature study book
 *
 * Also mirrors a live close-up of the animated 3D character head into `headerCanvasRef`
 * inside the single `requestAnimationFrame` loop so the header profile thumbnail
 * animates in real time with zero extra WebGL contexts.
 */
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

    // 1. Verify WebGL support before creating renderer
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
    camera.position.set(0, 0.06, 4.45);

    // Warm studio environment + soft 3-point plush lighting
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

    // ── Shared & Character-Specific Soft Plush Materials ──
    const creamPlushMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(colors.plushBody),
      roughness: 0.78,
      metalness: 0.01,
      sheen: 1.0,
      sheenRoughness: 0.8,
      sheenColor: new THREE.Color('#FFFFFF'),
      clearcoat: 0.04,
      clearcoatRoughness: 0.9,
      bumpMap: plushBumpTex || undefined,
      bumpScale: 0.014,
      envMapIntensity: 0.45,
    });

    const rimAuraMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(colors.plushRimGlow),
      transparent: true,
      opacity: 0.18,
      side: THREE.BackSide,
      depthWrite: false,
    });

    const innerEarMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(colors.earInner),
      roughness: 0.85,
      metalness: 0.0,
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

    const goldScarfMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(colors.goldPrimary),
      roughness: 0.36,
      metalness: 0.55,
      emissive: new THREE.Color(colors.goldDeep),
      emissiveIntensity: 0.12,
      bumpMap: plushBumpTex || undefined,
      bumpScale: 0.008,
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

    const darkHairMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#1C1917'),
      roughness: 0.65,
      metalness: 0.04,
      sheen: 0.7,
      sheenColor: new THREE.Color('#44403C'),
      bumpMap: plushBumpTex || undefined,
      bumpScale: 0.01,
    });

    const navySweaterMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#1E293B'),
      roughness: 0.7,
      metalness: 0.08,
      bumpMap: plushBumpTex || undefined,
      bumpScale: 0.012,
    });

    const whiteClothMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#FFFDF9'),
      roughness: 0.6,
      metalness: 0.02,
    });

    const botVisorMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#141418'),
      roughness: 0.1,
      metalness: 0.2,
      clearcoat: 1.0,
      clearcoatRoughness: 0.06,
    });

    // ── Hierarchy Construction ──
    const avatarRoot = new THREE.Group();
    avatarRoot.scale.setScalar(sizes.bodyScale);
    scene.add(avatarRoot);

    // Character whole body group (floats, breathes, jumps, spins)
    const characterGroup = new THREE.Group();
    avatarRoot.add(characterGroup);

    // 1. Tiny Plush Feet (underneath body)
    const footGeo = new THREE.SphereGeometry(0.19, 24, 20);
    footGeo.scale(1.15, 0.58, 1.3);
    const leftFoot = new THREE.Mesh(footGeo, creamPlushMat);
    leftFoot.position.set(-0.34, -0.92, 0.12);
    leftFoot.rotation.y = 0.18;
    characterGroup.add(leftFoot);

    const rightFoot = new THREE.Mesh(footGeo, creamPlushMat);
    rightFoot.position.set(0.34, -0.92, 0.12);
    rightFoot.rotation.y = -0.18;
    characterGroup.add(rightFoot);

    // 2. Main Squishy Marshmallow Head + Body Group
    const headBodyGroup = new THREE.Group();
    headBodyGroup.position.set(0, 0.02, 0);
    characterGroup.add(headBodyGroup);

    // Sculpted chubby marshmallow sphere (wider cheeks, soft rounded top)
    const plushBodyGeo = new THREE.SphereGeometry(0.92, 64, 64);
    const posAttr = plushBodyGeo.attributes.position;
    for (let i = 0; i < posAttr.count; i++) {
      const x = posAttr.getX(i);
      const y = posAttr.getY(i);
      const z = posAttr.getZ(i);
      const cheekFactor = y < 0.2 ? 1.06 - y * 0.06 : 1.0 - (y - 0.2) * 0.05;
      posAttr.setXYZ(i, x * cheekFactor * 1.04, y * 0.96, z * cheekFactor * 0.95);
    }
    plushBodyGeo.computeVertexNormals();

    const plushBodyMesh = new THREE.Mesh(plushBodyGeo, creamPlushMat);
    headBodyGroup.add(plushBodyMesh);

    // Soft outer rim glow shell
    const rimShellMesh = new THREE.Mesh(plushBodyGeo, rimAuraMat);
    rimShellMesh.scale.setScalar(1.045);
    headBodyGroup.add(rimShellMesh);

    // 3. Cute Round Plush Ears (top-left & top-right)
    const leftEarPivot = new THREE.Group();
    leftEarPivot.position.set(-0.62, 0.68, -0.02);
    leftEarPivot.rotation.z = 0.38;
    headBodyGroup.add(leftEarPivot);

    const earOuterGeo = new THREE.SphereGeometry(0.27, 32, 24);
    earOuterGeo.scale(0.95, 1.22, 0.65);
    const leftEarOuter = new THREE.Mesh(earOuterGeo, creamPlushMat);
    leftEarOuter.position.y = 0.12;
    leftEarPivot.add(leftEarOuter);

    const earInnerGeo = new THREE.SphereGeometry(0.16, 24, 20);
    earInnerGeo.scale(0.9, 1.15, 0.45);
    const leftEarInner = new THREE.Mesh(earInnerGeo, innerEarMat);
    leftEarInner.position.set(0, 0.11, 0.1);
    leftEarPivot.add(leftEarInner);

    const rightEarPivot = new THREE.Group();
    rightEarPivot.position.set(0.62, 0.68, -0.02);
    rightEarPivot.rotation.z = -0.38;
    headBodyGroup.add(rightEarPivot);

    const rightEarOuter = new THREE.Mesh(earOuterGeo, creamPlushMat);
    rightEarOuter.position.y = 0.12;
    rightEarPivot.add(rightEarOuter);

    const rightEarInner = new THREE.Mesh(earInnerGeo, innerEarMat);
    rightEarInner.position.set(0, 0.11, 0.1);
    rightEarPivot.add(rightEarInner);

    // 4. Stubby Plush Arms / Paws
    const armGeo = new THREE.CapsuleGeometry(0.15, 0.24, 16, 24);
    const leftArmPivot = new THREE.Group();
    leftArmPivot.position.set(-0.86, -0.18, 0.12);
    leftArmPivot.rotation.z = 0.42;
    headBodyGroup.add(leftArmPivot);

    const leftArmMesh = new THREE.Mesh(armGeo, creamPlushMat);
    leftArmMesh.position.y = -0.14;
    leftArmPivot.add(leftArmMesh);

    const rightArmPivot = new THREE.Group();
    rightArmPivot.position.set(0.86, -0.18, 0.12);
    rightArmPivot.rotation.z = -0.42;
    headBodyGroup.add(rightArmPivot);

    const rightArmMesh = new THREE.Mesh(armGeo, creamPlushMat);
    rightArmMesh.position.y = -0.14;
    rightArmPivot.add(rightArmMesh);

    // 5. Face Features Group (Eyes, Catchlights, Happy Arcs, Blush, Mouth)
    const faceGroup = new THREE.Group();
    faceGroup.position.set(0, 0.03, 0.87);
    headBodyGroup.add(faceGroup);

    const eyeGeo = new THREE.SphereGeometry(0.135, 32, 32);
    eyeGeo.scale(0.92, 1.08, 0.42);

    const leftEyeGroup = new THREE.Group();
    leftEyeGroup.position.set(-0.31, 0.08, 0);
    faceGroup.add(leftEyeGroup);

    const leftEyeMesh = new THREE.Mesh(eyeGeo, eyeDarkMat);
    leftEyeGroup.add(leftEyeMesh);

    const bigGlintGeo = new THREE.SphereGeometry(0.038, 16, 16);
    const smallGlintGeo = new THREE.SphereGeometry(0.019, 12, 12);

    const leftBigGlint = new THREE.Mesh(bigGlintGeo, catchlightMat);
    leftBigGlint.position.set(-0.036, 0.048, 0.052);
    leftEyeGroup.add(leftBigGlint);

    const leftSmallGlint = new THREE.Mesh(smallGlintGeo, catchlightMat);
    leftSmallGlint.position.set(0.035, -0.042, 0.052);
    leftEyeGroup.add(leftSmallGlint);

    const rightEyeGroup = new THREE.Group();
    rightEyeGroup.position.set(0.31, 0.08, 0);
    faceGroup.add(rightEyeGroup);

    const rightEyeMesh = new THREE.Mesh(eyeGeo, eyeDarkMat);
    rightEyeGroup.add(rightEyeMesh);

    const rightBigGlint = new THREE.Mesh(bigGlintGeo, catchlightMat);
    rightBigGlint.position.set(-0.036, 0.048, 0.052);
    rightEyeGroup.add(rightBigGlint);

    const rightSmallGlint = new THREE.Mesh(smallGlintGeo, catchlightMat);
    rightSmallGlint.position.set(0.035, -0.042, 0.052);
    rightEyeGroup.add(rightSmallGlint);

    // Happy Curved Eye Arcs (^ ^) shown during 'success' and 'poke'
    const happyArcGeo = new THREE.TorusGeometry(0.105, 0.026, 16, 32, Math.PI * 0.85);
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

    // Soft Rosy Cheek Blush
    const blushGeo = new THREE.CircleGeometry(0.145, 32);
    blushGeo.scale(1.35, 0.78, 1);

    const leftBlush = new THREE.Mesh(blushGeo, blushMat);
    leftBlush.position.set(-0.46, -0.1, -0.02);
    leftBlush.rotation.y = -0.35;
    faceGroup.add(leftBlush);

    const rightBlush = new THREE.Mesh(blushGeo, blushMat);
    rightBlush.position.set(0.46, -0.1, -0.02);
    rightBlush.rotation.y = 0.35;
    faceGroup.add(rightBlush);

    // Mouth: Smile Arc + Rounded Open Mouth
    const smileArcGeo = new THREE.TorusGeometry(0.078, 0.018, 16, 32, Math.PI * 0.82);
    const smileArcMesh = new THREE.Mesh(smileArcGeo, mouthDarkMat);
    smileArcMesh.position.set(0, -0.06, 0.03);
    smileArcMesh.rotation.z = Math.PI * 1.09;
    faceGroup.add(smileArcMesh);

    const openMouthGroup = new THREE.Group();
    openMouthGroup.position.set(0, -0.11, 0.03);
    openMouthGroup.visible = false;
    faceGroup.add(openMouthGroup);

    const openMouthOuterGeo = new THREE.SphereGeometry(0.075, 24, 24);
    openMouthOuterGeo.scale(1.1, 0.85, 0.3);
    const openMouthOuter = new THREE.Mesh(openMouthOuterGeo, mouthDarkMat);
    openMouthGroup.add(openMouthOuter);

    const openMouthTongueGeo = new THREE.SphereGeometry(0.048, 20, 20);
    openMouthTongueGeo.scale(1.05, 0.65, 0.32);
    const openMouthTongue = new THREE.Mesh(openMouthTongueGeo, mouthInnerMat);
    openMouthTongue.position.set(0, -0.018, 0.008);
    openMouthGroup.add(openMouthTongue);

    // ═══════════════════════════════════════════════════════════════════════
    // CHARACTER #1 (`sage-classic`): Original Graduation Cap & Gold Scarf
    // ═══════════════════════════════════════════════════════════════════════
    const scarfGroup = new THREE.Group();
    scarfGroup.position.set(0, -0.68, 0.02);
    headBodyGroup.add(scarfGroup);

    const scarfRingGeo = new THREE.TorusGeometry(0.66, 0.135, 24, 64);
    scarfRingGeo.scale(1.06, 0.85, 1.02);
    const scarfRingMesh = new THREE.Mesh(scarfRingGeo, goldScarfMat);
    scarfRingMesh.rotation.x = Math.PI / 2 + 0.08;
    scarfGroup.add(scarfRingMesh);

    const scarfStripeGeo = new THREE.TorusGeometry(0.69, 0.032, 16, 64);
    scarfStripeGeo.scale(1.06, 0.85, 1.02);
    const scarfStripeMesh = new THREE.Mesh(scarfStripeGeo, obsidianMat);
    scarfStripeMesh.rotation.x = Math.PI / 2 + 0.08;
    scarfStripeMesh.position.y = -0.02;
    scarfGroup.add(scarfStripeMesh);

    const scarfTailGeo = new THREE.CapsuleGeometry(0.11, 0.22, 12, 20);
    scarfTailGeo.scale(1.0, 1.0, 0.45);
    const scarfTailMesh = new THREE.Mesh(scarfTailGeo, goldScarfMat);
    scarfTailMesh.position.set(0.32, -0.16, 0.62);
    scarfTailMesh.rotation.set(-0.18, 0.25, -0.18);
    scarfGroup.add(scarfTailMesh);

    const starGeo = createStarGeometry(0.085, 0.04, 0.024);
    const scarfStarPin = new THREE.Mesh(starGeo, goldStarMat);
    scarfStarPin.position.set(0.28, -0.04, 0.72);
    scarfStarPin.rotation.y = 0.35;
    scarfGroup.add(scarfStarPin);

    const capGroup = new THREE.Group();
    capGroup.position.set(0.08, 0.86, 0.04);
    capGroup.rotation.set(0.08, 0.12, -0.14);
    headBodyGroup.add(capGroup);

    const capSkullGeo = new THREE.CylinderGeometry(0.32, 0.36, 0.16, 32);
    const capSkullMesh = new THREE.Mesh(capSkullGeo, obsidianMat);
    capSkullMesh.position.y = 0.04;
    capGroup.add(capSkullMesh);

    const capGoldBandGeo = new THREE.TorusGeometry(0.355, 0.018, 12, 48);
    const capGoldBand = new THREE.Mesh(capGoldBandGeo, goldScarfMat);
    capGoldBand.rotation.x = Math.PI / 2;
    capGoldBand.position.y = -0.02;
    capGroup.add(capGoldBand);

    const capBoardGeo = new THREE.BoxGeometry(0.84, 0.036, 0.84);
    const capBoardMesh = new THREE.Mesh(capBoardGeo, obsidianMat);
    capBoardMesh.position.y = 0.13;
    capBoardMesh.rotation.y = Math.PI / 4;
    capGroup.add(capBoardMesh);

    const capButtonGeo = new THREE.SphereGeometry(0.045, 16, 16);
    const capButtonMesh = new THREE.Mesh(capButtonGeo, goldStarMat);
    capButtonMesh.position.y = 0.155;
    capGroup.add(capButtonMesh);

    const tasselPivot = new THREE.Group();
    tasselPivot.position.set(0.38, 0.13, 0.12);
    capGroup.add(tasselPivot);

    const tasselCordGeo = new THREE.CapsuleGeometry(0.018, 0.22, 8, 12);
    const tasselCord = new THREE.Mesh(tasselCordGeo, goldStarMat);
    tasselCord.position.y = -0.12;
    tasselPivot.add(tasselCord);

    const tasselDropGeo = new THREE.ConeGeometry(0.048, 0.12, 16);
    const tasselDrop = new THREE.Mesh(tasselDropGeo, goldStarMat);
    tasselDrop.position.y = -0.24;
    tasselPivot.add(tasselDrop);

    // ═══════════════════════════════════════════════════════════════════════
    // CHARACTER #2 (`ayan-scholar`): Boy with Short Dark Hair, Round Gold Glasses & School Sweater
    // ═══════════════════════════════════════════════════════════════════════
    const ayanGroup = new THREE.Group();
    ayanGroup.visible = false;
    headBodyGroup.add(ayanGroup);

    // Sculpted short dark boy hair cap + cute swept front bangs + top tuft
    const boyHairCapGeo = new THREE.SphereGeometry(0.935, 48, 32, 0, Math.PI * 2, 0, Math.PI * 0.46);
    boyHairCapGeo.scale(1.03, 0.96, 0.97);
    const boyHairCap = new THREE.Mesh(boyHairCapGeo, darkHairMat);
    boyHairCap.position.set(0, 0.03, -0.02);
    boyHairCap.rotation.x = -0.18;
    ayanGroup.add(boyHairCap);

    const bangGeo = new THREE.CapsuleGeometry(0.11, 0.36, 12, 16);
    const frontBangLeft = new THREE.Mesh(bangGeo, darkHairMat);
    frontBangLeft.position.set(-0.24, 0.56, 0.68);
    frontBangLeft.rotation.set(0.35, 0.2, 1.15);
    ayanGroup.add(frontBangLeft);

    const frontBangRight = new THREE.Mesh(bangGeo, darkHairMat);
    frontBangRight.position.set(0.22, 0.58, 0.68);
    frontBangRight.rotation.set(0.35, -0.2, -1.05);
    ayanGroup.add(frontBangRight);

    const hairTuftGeo = new THREE.ConeGeometry(0.11, 0.28, 16);
    const hairTuft = new THREE.Mesh(hairTuftGeo, darkHairMat);
    hairTuft.position.set(0.06, 0.96, 0.12);
    hairTuft.rotation.set(0.15, 0, -0.32);
    ayanGroup.add(hairTuft);

    // Round Gold-Rimmed Glasses on Face
    const glassesGroup = new THREE.Group();
    glassesGroup.position.set(0, 0.11, 0.91);
    ayanGroup.add(glassesGroup);

    const lensRimGeo = new THREE.TorusGeometry(0.21, 0.022, 16, 48);
    const leftLensRim = new THREE.Mesh(lensRimGeo, goldStarMat);
    leftLensRim.position.set(-0.31, 0, 0);
    glassesGroup.add(leftLensRim);

    const rightLensRim = new THREE.Mesh(lensRimGeo, goldStarMat);
    rightLensRim.position.set(0.31, 0, 0);
    glassesGroup.add(rightLensRim);

    const bridgeGeo = new THREE.CylinderGeometry(0.018, 0.018, 0.22, 12);
    bridgeGeo.rotateZ(Math.PI / 2);
    const glassesBridge = new THREE.Mesh(bridgeGeo, goldStarMat);
    glassesBridge.position.set(0, 0.02, 0);
    glassesGroup.add(glassesBridge);

    // School Sweater Collar with Gold V-Neck Trim
    const sweaterCollarGeo = new THREE.TorusGeometry(0.67, 0.14, 24, 64);
    sweaterCollarGeo.scale(1.05, 0.85, 1.0);
    const sweaterCollar = new THREE.Mesh(sweaterCollarGeo, navySweaterMat);
    sweaterCollar.position.set(0, -0.68, 0.02);
    sweaterCollar.rotation.x = Math.PI / 2 + 0.08;
    ayanGroup.add(sweaterCollar);

    const sweaterGoldTrimGeo = new THREE.TorusGeometry(0.70, 0.032, 16, 64);
    sweaterGoldTrimGeo.scale(1.05, 0.85, 1.0);
    const sweaterGoldTrim = new THREE.Mesh(sweaterGoldTrimGeo, goldStarMat);
    sweaterGoldTrim.position.set(0, -0.64, 0.03);
    sweaterGoldTrim.rotation.x = Math.PI / 2 + 0.08;
    ayanGroup.add(sweaterGoldTrim);

    // ═══════════════════════════════════════════════════════════════════════
    // CHARACTER #3 (`zain-explorer`): Boy with Knit Beanie Cap & Backpack Straps
    // ═══════════════════════════════════════════════════════════════════════
    const zainGroup = new THREE.Group();
    zainGroup.visible = false;
    headBodyGroup.add(zainGroup);

    // Knit Beanie Dome + Folded Gold Ribbed Cuff + Fluffy Gold Pom-Pom
    const beanieDomeGeo = new THREE.SphereGeometry(0.84, 48, 32, 0, Math.PI * 2, 0, Math.PI * 0.48);
    beanieDomeGeo.scale(1.04, 0.88, 1.0);
    const beanieDome = new THREE.Mesh(beanieDomeGeo, obsidianMat);
    beanieDome.position.set(0, 0.26, -0.02);
    beanieDome.rotation.x = -0.14;
    zainGroup.add(beanieDome);

    const beanieCuffGeo = new THREE.TorusGeometry(0.79, 0.115, 24, 64);
    beanieCuffGeo.scale(1.04, 0.9, 1.0);
    const beanieCuff = new THREE.Mesh(beanieCuffGeo, goldScarfMat);
    beanieCuff.position.set(0, 0.56, 0.02);
    beanieCuff.rotation.x = Math.PI / 2 - 0.14;
    zainGroup.add(beanieCuff);

    const pomPomGeo = new THREE.SphereGeometry(0.16, 24, 24);
    const beaniePomPom = new THREE.Mesh(pomPomGeo, goldStarMat);
    beaniePomPom.position.set(0, 1.02, -0.12);
    zainGroup.add(beaniePomPom);

    // Dark hair fringe peeking out under the front of the beanie
    const zainFringe = new THREE.Mesh(bangGeo, darkHairMat);
    zainFringe.position.set(-0.14, 0.46, 0.76);
    zainFringe.rotation.set(0.25, 0.1, 1.38);
    zainGroup.add(zainFringe);

    // Twin Backpack Straps & Gleaming Gold Buckles on Shoulders
    const strapGeo = new THREE.TorusGeometry(0.56, 0.068, 16, 48, Math.PI * 0.85);
    const leftStrap = new THREE.Mesh(strapGeo, obsidianMat);
    leftStrap.position.set(-0.42, -0.42, 0.34);
    leftStrap.rotation.set(0.3, 1.25, -0.3);
    zainGroup.add(leftStrap);

    const rightStrap = new THREE.Mesh(strapGeo, obsidianMat);
    rightStrap.position.set(0.42, -0.42, 0.34);
    rightStrap.rotation.set(0.3, -1.25, 0.3);
    zainGroup.add(rightStrap);

    const buckleGeo = new THREE.BoxGeometry(0.14, 0.09, 0.05);
    const leftBuckle = new THREE.Mesh(buckleGeo, goldStarMat);
    leftBuckle.position.set(-0.46, -0.44, 0.77);
    leftBuckle.rotation.y = -0.35;
    zainGroup.add(leftBuckle);

    const rightBuckle = new THREE.Mesh(buckleGeo, goldStarMat);
    rightBuckle.position.set(0.46, -0.44, 0.77);
    rightBuckle.rotation.y = 0.35;
    zainGroup.add(rightBuckle);

    // ═══════════════════════════════════════════════════════════════════════
    // CHARACTER #4 (`hamza-kurta`): Boy in Traditional Pakistani Kurta & Gold Buttons
    // ═══════════════════════════════════════════════════════════════════════
    const hamzaGroup = new THREE.Group();
    hamzaGroup.visible = false;
    headBodyGroup.add(hamzaGroup);

    // Neat side-parted dark boy hair
    const hamzaHairCap = new THREE.Mesh(boyHairCapGeo, darkHairMat);
    hamzaHairCap.position.set(0, 0.04, -0.02);
    hamzaHairCap.rotation.x = -0.16;
    hamzaGroup.add(hamzaHairCap);

    const partedSweepGeo = new THREE.CapsuleGeometry(0.12, 0.48, 12, 16);
    const partedSweep = new THREE.Mesh(partedSweepGeo, darkHairMat);
    partedSweep.position.set(0.12, 0.58, 0.68);
    partedSweep.rotation.set(0.32, -0.15, -1.28);
    hamzaGroup.add(partedSweep);

    // Traditional Pakistani Kurta Mandarin Collar + Placket + 3 Gleaming Gold Buttons
    const kurtaWaistcoatRing = new THREE.Mesh(sweaterCollarGeo, obsidianMat);
    kurtaWaistcoatRing.position.set(0, -0.68, 0.02);
    kurtaWaistcoatRing.rotation.x = Math.PI / 2 + 0.08;
    hamzaGroup.add(kurtaWaistcoatRing);

    const kurtaBandGeo = new THREE.TorusGeometry(0.64, 0.045, 16, 64);
    kurtaBandGeo.scale(1.04, 0.85, 1.0);
    const kurtaGoldBand = new THREE.Mesh(kurtaBandGeo, goldStarMat);
    kurtaGoldBand.position.set(0, -0.58, 0.04);
    kurtaGoldBand.rotation.x = Math.PI / 2 + 0.08;
    hamzaGroup.add(kurtaGoldBand);

    const placketGeo = new THREE.BoxGeometry(0.16, 0.42, 0.06);
    const kurtaPlacket = new THREE.Mesh(placketGeo, whiteClothMat);
    kurtaPlacket.position.set(0, -0.68, 0.72);
    kurtaPlacket.rotation.x = 0.25;
    hamzaGroup.add(kurtaPlacket);

    [-0.56, -0.68, -0.8].forEach((py, idx) => {
      const btnGeo = new THREE.SphereGeometry(0.036, 16, 16);
      const btn = new THREE.Mesh(btnGeo, goldStarMat);
      btn.position.set(0, py, 0.76 - idx * 0.03);
      hamzaGroup.add(btn);
    });

    // ═══════════════════════════════════════════════════════════════════════
    // CHARACTER #5 (`nova-bot`): Cute Soft White & Gold Robot Friend
    // ═══════════════════════════════════════════════════════════════════════
    const novaGroup = new THREE.Group();
    novaGroup.visible = false;
    headBodyGroup.add(novaGroup);

    // Glowing Golden Antenna on Top of Head
    const antennaStemGeo = new THREE.CylinderGeometry(0.03, 0.04, 0.34, 16);
    const antennaStem = new THREE.Mesh(antennaStemGeo, goldScarfMat);
    antennaStem.position.set(0, 0.98, 0);
    novaGroup.add(antennaStem);

    const antennaBulbGeo = new THREE.SphereGeometry(0.11, 24, 24);
    const antennaBulb = new THREE.Mesh(antennaBulbGeo, goldStarMat);
    antennaBulb.position.set(0, 1.18, 0);
    novaGroup.add(antennaBulb);

    // Brushed Gold Side Ear-Cups / Headphones
    const earCupGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.16, 32);
    earCupGeo.rotateZ(Math.PI / 2);
    const leftEarCup = new THREE.Mesh(earCupGeo, goldScarfMat);
    leftEarCup.position.set(-0.92, 0.06, 0.02);
    novaGroup.add(leftEarCup);

    const rightEarCup = new THREE.Mesh(earCupGeo, goldScarfMat);
    rightEarCup.position.set(0.92, 0.06, 0.02);
    novaGroup.add(rightEarCup);

    // Sleek Rounded Dark Face Visor Frame behind Eyes
    const visorGeo = new THREE.CapsuleGeometry(0.26, 0.48, 20, 32);
    visorGeo.rotateZ(Math.PI / 2);
    visorGeo.scale(1.0, 1.0, 0.22);
    const visorMesh = new THREE.Mesh(visorGeo, botVisorMat);
    visorMesh.position.set(0, 0.08, 0.82);
    novaGroup.add(visorMesh);

    const botCollarRing = new THREE.Mesh(sweaterGoldTrimGeo, goldScarfMat);
    botCollarRing.position.set(0, -0.66, 0.03);
    botCollarRing.rotation.x = Math.PI / 2 + 0.08;
    novaGroup.add(botCollarRing);

    // ═══════════════════════════════════════════════════════════════════════
    // CHARACTER #6 (`milo-owl`): Soft Fluffy Owl Companion Holding a Book
    // ═══════════════════════════════════════════════════════════════════════
    const miloGroup = new THREE.Group();
    miloGroup.visible = false;
    headBodyGroup.add(miloGroup);

    // Cute Golden Owl Beak right above the smile
    const beakGeo = new THREE.ConeGeometry(0.085, 0.16, 20);
    const owlBeak = new THREE.Mesh(beakGeo, goldStarMat);
    owlBeak.position.set(0, 0.02, 0.94);
    owlBeak.rotation.x = Math.PI * 0.85;
    miloGroup.add(owlBeak);

    // Soft Cream Owl Belly Patch
    const bellyGeo = new THREE.CircleGeometry(0.46, 32);
    bellyGeo.scale(1.15, 0.82, 1);
    const owlBelly = new THREE.Mesh(bellyGeo, whiteClothMat);
    owlBelly.position.set(0, -0.44, 0.84);
    owlBelly.rotation.x = 0.32;
    miloGroup.add(owlBelly);

    // Miniature Open Black & Gold Study Book held in front
    const bookGroup = new THREE.Group();
    bookGroup.position.set(0, -0.58, 0.84);
    bookGroup.rotation.set(-0.38, 0, 0);
    miloGroup.add(bookGroup);

    const bookPageGeo = new THREE.BoxGeometry(0.36, 0.26, 0.04);
    const leftCover = new THREE.Mesh(bookPageGeo, obsidianMat);
    leftCover.position.set(-0.17, 0, 0);
    leftCover.rotation.y = 0.28;
    bookGroup.add(leftCover);

    const rightCover = new THREE.Mesh(bookPageGeo, obsidianMat);
    rightCover.position.set(0.17, 0, 0);
    rightCover.rotation.y = -0.28;
    bookGroup.add(rightCover);

    const spineGeo = new THREE.CylinderGeometry(0.032, 0.032, 0.27, 16);
    const bookSpine = new THREE.Mesh(spineGeo, goldStarMat);
    bookGroup.add(bookSpine);

    // 8. Contextual Floating Props (Thinking Bubbles, Celebration Stars, Listening Halo)
    const thoughtBubblesGroup = new THREE.Group();
    thoughtBubblesGroup.position.set(0.92, 0.55, 0.2);
    thoughtBubblesGroup.visible = false;
    avatarRoot.add(thoughtBubblesGroup);

    const bubbleRadii = [0.055, 0.085, 0.125];
    const thoughtBubbles: THREE.Mesh[] = bubbleRadii.map((r, idx) => {
      const bGeo = new THREE.SphereGeometry(r, 20, 20);
      const bMesh = new THREE.Mesh(bGeo, idx === 2 ? goldStarMat : creamPlushMat);
      bMesh.position.set(idx * 0.16, idx * 0.19, 0);
      thoughtBubblesGroup.add(bMesh);
      return bMesh;
    });

    const sparkleGroup = new THREE.Group();
    sparkleGroup.visible = false;
    avatarRoot.add(sparkleGroup);

    const sparkleStars: THREE.Mesh[] = [-1, 1, 0].map((dir, idx) => {
      const sMesh = new THREE.Mesh(starGeo, goldStarMat);
      sMesh.position.set(dir * 1.05, 0.35 + idx * 0.25, 0.3);
      sMesh.scale.setScalar(1.2);
      sparkleGroup.add(sMesh);
      return sMesh;
    });

    const listenRingGeo = new THREE.TorusGeometry(1.12, 0.018, 16, 64);
    const listenRingMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(colors.goldPrimary),
      transparent: true,
      opacity: 0,
    });
    const listenRing = new THREE.Mesh(listenRingGeo, listenRingMat);
    listenRing.rotation.x = Math.PI / 2 - 0.25;
    listenRing.position.set(0, -0.75, 0);
    avatarRoot.add(listenRing);

    // ── Character Switching Function (Zero WebGL Rebuild, Smooth Pop Transition) ──
    let switchScaleDip = 0;

    const applyCharacterToRig = (id: SageCharacterId, animateSwitch: boolean) => {
      const def = getSageCharacterById(id);

      creamPlushMat.color.set(def.bodyColor);
      rimAuraMat.color.set(def.rimColor);
      innerEarMat.color.set(def.earInnerColor);

      // Toggle character-specific accessory groups
      const isClassic = id === 'sage-classic';
      scarfGroup.visible = isClassic;
      capGroup.visible = isClassic;

      ayanGroup.visible = id === 'ayan-scholar';
      zainGroup.visible = id === 'zain-explorer';
      hamzaGroup.visible = id === 'hamza-kurta';
      novaGroup.visible = id === 'nova-bot';
      miloGroup.visible = id === 'milo-owl';

      // Nova Bot hides plush animal ears (she has golden side ear-cups + top antenna)
      leftEarPivot.visible = id !== 'nova-bot';
      rightEarPivot.visible = id !== 'nova-bot';

      // Nova Bot has glowing golden visor eyes & mouth
      if (id === 'nova-bot') {
        eyeDarkMat.color.set('#FFE066');
        mouthDarkMat.color.set('#FFE066');
      } else {
        eyeDarkMat.color.set(colors.eyes);
        mouthDarkMat.color.set(colors.mouth);
      }

      if (animateSwitch) {
        switchScaleDip = 1.0;
      }
    };

    applyCharacterRef.current = applyCharacterToRig;
    applyCharacterToRig(characterIdRef.current, false);

    // ── Pointer / Touch Tracking & Reduced Motion ──
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

    // ── Animation State Machine Variables ──
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
      const curLevel = Math.max(0, Math.min(1, audioLevelRef.current));

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

      // ── Compute Target Pose per State ──
      let targetRotX = -currentPointer.y * 0.14;
      let targetRotY = currentPointer.x * 0.24;
      let targetRotZ = -currentPointer.x * 0.05;
      let targetPosY = Math.sin(t * 2.1) * 0.045;
      let targetScaleX = 1 + Math.sin(t * 2.1) * 0.012;
      let targetScaleY = 1 - Math.sin(t * 2.1) * 0.012;

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
            targetRotY = currentPointer.x * 0.15 + Math.sin(t * 1.8) * 0.04;
            targetPosY = -0.03 + Math.sin(t * 2.6) * 0.025;
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
            targetRotX = Math.sin(t * 14) * 0.22 + 0.08;
            targetPosY = Math.abs(Math.sin(t * 7)) * 0.05;
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
            const bounce = Math.abs(Math.sin(t * 7.5));
            targetPosY = bounce * 0.16;
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
      headBodyGroup.rotation.set(smoothHeadRot.x, smoothHeadRot.y, smoothHeadRot.z);
      headBodyGroup.scale.set(
        smoothBodyScale.x * switchFactor,
        smoothBodyScale.y * switchFactor,
        smoothBodyScale.x * switchFactor
      );

      // ── Ears & Arms Animation ──
      const earPerk =
        curState === 'listening'
          ? 0.25 + curLevel * 0.18
          : curState === 'error' || curState === 'sleepy'
          ? -0.25
          : curState === 'poke' || curState === 'success'
          ? 0.22 + Math.sin(t * 12) * 0.12
          : Math.sin(t * 1.7) * 0.04;

      leftEarPivot.rotation.z = 0.38 - earPerk;
      rightEarPivot.rotation.z = -0.38 + earPerk;

      if (curState === 'success' || curState === 'poke') {
        leftArmPivot.rotation.z = 0.75 + Math.sin(t * 12) * 0.25;
        rightArmPivot.rotation.z = -2.15 + Math.sin(t * 14) * 0.35;
      } else if (curState === 'speaking') {
        leftArmPivot.rotation.z = 0.48 + Math.sin(t * 5.5) * 0.14;
        rightArmPivot.rotation.z = -0.48 - Math.cos(t * 5.5) * 0.14;
      } else {
        leftArmPivot.rotation.z = 0.42 + Math.sin(t * 2.1) * 0.05;
        rightArmPivot.rotation.z = -0.42 - Math.sin(t * 2.1) * 0.05;
      }

      // Graduation cap tassel swing
      tasselPivot.rotation.z = -smoothHeadRot.z * 1.4 + Math.sin(t * 3.2) * 0.08;

      // ── Eyes, Blinking & Happy Arcs ──
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

      // Blush warmth boost
      const targetBlushOpacity =
        curState === 'success' || curState === 'poke'
          ? 0.78
          : curState === 'speaking'
          ? 0.62
          : 0.48;
      blushMat.opacity += (targetBlushOpacity - blushMat.opacity) * damp;

      // ── Mouth Expression & Audio Lip-Sync ──
      const useOpenMouth =
        curState === 'speaking' ||
        curState === 'thinking' ||
        curState === 'sleepy' ||
        curState === 'success' ||
        curState === 'poke';

      smileArcMesh.visible = !useOpenMouth;
      openMouthGroup.visible = useOpenMouth;

      if (curState === 'error') {
        smileArcMesh.rotation.z = Math.PI * 0.09;
        smileArcMesh.position.y = -0.13;
      } else {
        smileArcMesh.rotation.z = Math.PI * 1.09;
        smileArcMesh.position.y = -0.06;
      }

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

      // ── Contextual 3D Props (Thinking Bubbles, Sparkle Stars, Listening Halo) ──
      thoughtBubblesGroup.visible = curState === 'thinking';
      if (thoughtBubblesGroup.visible) {
        thoughtBubbles.forEach((b, idx) => {
          b.position.y = idx * 0.19 + Math.sin(t * 3.5 - idx * 0.9) * 0.035;
          const pulse = 0.85 + Math.sin(t * 4 - idx) * 0.18;
          b.scale.setScalar(pulse);
        });
      }

      sparkleGroup.visible = curState === 'success' || curState === 'poke';
      if (sparkleGroup.visible) {
        sparkleStars.forEach((s, idx) => {
          s.rotation.y = t * 3.2 + idx;
          s.rotation.z = Math.sin(t * 4 + idx) * 0.25;
          const pop = 0.9 + Math.sin(t * 8 + idx * 1.4) * 0.25;
          s.scale.setScalar(pop);
        });
      }

      if (curState === 'listening') {
        const pulseScale = 1 + ((t * 0.8) % 0.45);
        listenRing.scale.setScalar(pulseScale);
        listenRingMat.opacity = Math.max(0, (1.45 - pulseScale) * (0.55 + curLevel * 0.45));
      } else {
        listenRingMat.opacity = 0;
      }

      renderer.render(scene, camera);
      if (!hasMarkedReady) {
        hasMarkedReady = true;
        setWebglReady(true);
      }

      // ── Live-mirror the rendered 3D character into the top-left header profile picture ──
      const headerCanvas = headerCanvasRef?.current;
      if (headerCanvas) {
        const ctx = headerCanvas.getContext('2d');
        const srcCanvas = renderer.domElement;
        if (ctx && srcCanvas.width > 0 && srcCanvas.height > 0) {
          const cw = headerCanvas.width;
          const ch = headerCanvas.height;
          const minDim = Math.min(srcCanvas.width, srcCanvas.height);
          // Close-up square crop centered on the character's face & headwear
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
      const w = Math.max(container.clientWidth || (compact ? 72 : 196), 68);
      const h = Math.max(container.clientHeight || (compact ? 72 : 196), 68);
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

  // ── Unified Frameless Stage (never unmounts mountRef when transitioning between large & compact) ──
  return (
    <div
      data-testid="sage-stage-avatar"
      data-compact={compact ? 'true' : 'false'}
      data-character={characterId}
      className={
        compact
          ? 'relative flex items-center gap-3 px-4 sm:px-6 pt-2 pb-1 bg-transparent shrink-0 select-none transition-all duration-300'
          : 'relative flex flex-col items-center justify-center py-2 px-4 bg-transparent select-none transition-all duration-300'
      }
    >
      <div
        onClick={onPoke}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') onPoke?.();
        }}
        title={
          compact
            ? `Tap ${activeChar.name} for a cute reaction!`
            : `Tap ${activeChar.name} to say hello!`
        }
        style={
          compact
            ? { width: '76px', height: '76px' }
            : { width: '200px', height: `${SAGE_AVATAR_THEME.sizes.heroHeightPx}px` }
        }
        className={`relative flex items-center justify-center shrink-0 cursor-pointer transition-transform duration-200 ${
          isSwitchingChar ? 'scale-95 opacity-85' : 'scale-100 opacity-100'
        }`}
      >
        {/* Persistent WebGL mount container — never unmounted when compact changes */}
        {webglSupported && (
          <div
            ref={mountRef}
            className={`w-full h-full relative z-10 transition-opacity duration-200 ${
              webglReady ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
          />
        )}

        {/* Instant 2D Plush Character rendered whenever WebGL is unavailable or initializing */}
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

      {compact ? (
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-zinc-800 dark:text-zinc-100">
              {activeChar.name}
            </span>
            {state === 'speaking' && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 dark:text-amber-300">
                <Volume2 size={12} className="animate-pulse" />
                <span>Speaking</span>
              </span>
            )}
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate max-w-[240px] sm:max-w-md">
            {statusLabel || `Ask a follow-up question or tap ${activeChar.name} to say hi`}
          </p>
        </div>
      ) : (
        <div className="text-center mt-0.5 max-w-md bg-transparent">
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
