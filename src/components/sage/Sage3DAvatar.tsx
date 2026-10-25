import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { ChevronDown, ChevronUp, Volume2 } from 'lucide-react';
import {
  Sage3DAvatarState,
  SAGE_AVATAR_THEME,
} from './useSageAvatarState';

export type { Sage3DAvatarState };

export interface Sage3DAvatarProps {
  state: Sage3DAvatarState;
  /** Audio volume level 0..1 when speaking or recording */
  audioLevel?: number;
  /** Compact layout (72px docked at top of chat) once messages exist */
  compact?: boolean;
  /** Optional subtitle/status label */
  statusLabel?: string;
  /** Greeting title when shown large in empty/fresh chat */
  greetingTitle?: string;
  /** Whether the avatar is collapsed by the user */
  collapsed?: boolean;
  onToggleCollapse?: () => void;
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
 * 2D Layered SVG/CSS Animated Plush Character Fallback
 * Used automatically if WebGL is unavailable on a device.
 */
const Plush2DFallback: React.FC<{
  state: Sage3DAvatarState;
  audioLevel: number;
  compact: boolean;
  onPoke?: () => void;
}> = ({ state, audioLevel, compact, onPoke }) => {
  const { colors, accessories } = SAGE_AVATAR_THEME;
  const isHappy = state === 'success' || state === 'poke';
  const isSpeaking = state === 'speaking';
  const isThinking = state === 'thinking';
  const isSleepy = state === 'sleepy';
  const isError = state === 'error';
  const mouthOpen = isSpeaking ? Math.max(0.25, Math.min(1, audioLevel * 1.5 + 0.3)) : 0;

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
      title="Tap Sage to say hello!"
    >
      {/* Warm ambient glow behind plush character */}
      <div
        className={`absolute inset-1 rounded-full blur-xl transition-opacity duration-500 pointer-events-none ${
          state === 'listening'
            ? 'bg-amber-300/40 opacity-100 scale-110'
            : state === 'thinking'
            ? 'bg-amber-200/35 opacity-90'
            : 'bg-amber-100/30 dark:bg-amber-400/15 opacity-75'
        }`}
      />
      <svg
        viewBox="0 0 120 120"
        className="w-full h-full drop-shadow-[0_8px_18px_rgba(212,160,23,0.16)]"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <radialGradient id="plush2DBody" cx="48%" cy="36%" r="58%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="65%" stopColor={colors.plushBody} />
            <stop offset="100%" stopColor={colors.plushShadow} />
          </radialGradient>
          <linearGradient id="plush2DGold" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFE066" />
            <stop offset="55%" stopColor={colors.goldPrimary} />
            <stop offset="100%" stopColor={colors.goldDeep} />
          </linearGradient>
        </defs>

        {/* Ears */}
        <g
          transform={
            isError || isSleepy
              ? 'translate(0, 3)'
              : state === 'listening'
              ? 'translate(0, -2)'
              : undefined
          }
        >
          <ellipse cx="31" cy="36" rx="12" ry="14" transform="rotate(-20 31 36)" fill="url(#plush2DBody)" stroke="#E6DAC2" strokeWidth="1.5" />
          <ellipse cx="32" cy="37" rx="6.5" ry="8" transform="rotate(-20 32 37)" fill={colors.earInner} opacity="0.8" />
          <ellipse cx="89" cy="36" rx="12" ry="14" transform="rotate(20 89 36)" fill="url(#plush2DBody)" stroke="#E6DAC2" strokeWidth="1.5" />
          <ellipse cx="88" cy="37" rx="6.5" ry="8" transform="rotate(20 88 37)" fill={colors.earInner} opacity="0.8" />
        </g>

        {/* Tiny Plush Feet */}
        <ellipse cx="44" cy="102" rx="9" ry="5.5" fill={colors.plushShadow} />
        <ellipse cx="76" cy="102" rx="9" ry="5.5" fill={colors.plushShadow} />

        {/* Chubby Marshmallow Plush Body */}
        <path
          d="M60 25C37 25 22 42 22 65C22 86 37 99 60 99C83 99 98 86 98 65C98 42 83 25 60 25Z"
          fill="url(#plush2DBody)"
          stroke="#E8DCC4"
          strokeWidth="1.5"
        />

        {/* Cute Stubby Arms */}
        <ellipse
          cx="21"
          cy={isHappy ? '58' : '68'}
          rx="7.5"
          ry="11"
          transform={isHappy ? 'rotate(-38 21 58)' : 'rotate(18 21 68)'}
          fill="url(#plush2DBody)"
          stroke="#E5D8BE"
          strokeWidth="1.3"
        />
        <ellipse
          cx="99"
          cy={isHappy ? '56' : '68'}
          rx="7.5"
          ry="11"
          transform={isHappy ? 'rotate(42 99 56)' : 'rotate(-18 99 68)'}
          fill="url(#plush2DBody)"
          stroke="#E5D8BE"
          strokeWidth="1.3"
        />

        {/* Gold & Obsidian Scarf */}
        {accessories.showGoldScarf && (
          <g>
            <path
              d="M31 84C40 90 50 92.5 60 92.5C70 92.5 80 90 89 84C91 89 88.5 95 82 97C69 101 51 101 38 97C31.5 95 29 89 31 84Z"
              fill="url(#plush2DGold)"
            />
            <path
              d="M35 89.5C50 94.5 70 94.5 85 89.5"
              stroke={colors.obsidianAccent}
              strokeWidth="2.8"
              strokeLinecap="round"
            />
            {/* Draped Scarf Tail + Star Pin */}
            <path
              d="M72 91L77 105L65 104L66 91Z"
              fill="url(#plush2DGold)"
              stroke={colors.obsidianAccent}
              strokeWidth="1.2"
            />
            {accessories.showStarPin && (
              <circle cx="75" cy="91" r="4" fill="#FFFDF5" stroke={colors.obsidianAccent} strokeWidth="1.2" />
            )}
          </g>
        )}

        {/* Rosy Blush Cheeks */}
        <ellipse cx="36" cy="66" rx="7.5" ry="4.4" fill={colors.blush} opacity={isHappy ? 0.8 : 0.55} />
        <ellipse cx="84" cy="66" rx="7.5" ry="4.4" fill={colors.blush} opacity={isHappy ? 0.8 : 0.55} />

        {/* Expressive Eyes */}
        {isHappy ? (
          <>
            <path d="M38 56C40.5 51 46.5 51 49 56" stroke={colors.eyes} strokeWidth="3.6" strokeLinecap="round" />
            <path d="M71 56C73.5 51 79.5 51 82 56" stroke={colors.eyes} strokeWidth="3.6" strokeLinecap="round" />
          </>
        ) : isSleepy ? (
          <>
            <path d="M38 57C40.5 60.5 46.5 60.5 49 57" stroke={colors.eyes} strokeWidth="3.2" strokeLinecap="round" />
            <path d="M71 57C73.5 60.5 79.5 60.5 82 57" stroke={colors.eyes} strokeWidth="3.2" strokeLinecap="round" />
          </>
        ) : (
          <>
            <ellipse cx="43.5" cy="56" rx="6" ry="6.8" fill={colors.eyes} />
            <circle cx="41.4" cy="53.6" r="2.2" fill={colors.eyeCatchlight} />
            <circle cx="45.6" cy="58" r="1.1" fill={colors.eyeCatchlight} opacity="0.85" />

            <ellipse cx="76.5" cy="56" rx="6" ry="6.8" fill={colors.eyes} />
            <circle cx="74.4" cy="53.6" r="2.2" fill={colors.eyeCatchlight} />
            <circle cx="78.6" cy="58" r="1.1" fill={colors.eyeCatchlight} opacity="0.85" />
          </>
        )}

        {/* Mouth */}
        {isSpeaking ? (
          <ellipse
            cx="60"
            cy="66.5"
            rx={3.8 + mouthOpen * 1.8}
            ry={2.2 + mouthOpen * 4.2}
            fill={colors.mouth}
          />
        ) : isThinking || isSleepy ? (
          <circle cx="60" cy="67" r="2.8" fill={colors.mouth} />
        ) : isError ? (
          <path d="M55.5 69C57.5 66.5 62.5 66.5 64.5 69" stroke={colors.mouth} strokeWidth="2.6" strokeLinecap="round" />
        ) : (
          <path d="M54.5 64.8C57 68.5 63 68.5 65.5 64.8" stroke={colors.mouth} strokeWidth="2.8" strokeLinecap="round" />
        )}

        {/* Tilted Scholario Graduation Cap */}
        {accessories.showGraduationCap && (
          <g transform="translate(60, 23) rotate(7)">
            <path d="M-14 1L0 5.5L14 1L11.5 8.5C5 11 -5 11 -11.5 8.5L-14 1Z" fill={colors.obsidianAccent} />
            <polygon points="0,-8 23,0 0,7.5 -23,0" fill="#232329" stroke={colors.goldPrimary} strokeWidth="1.4" />
            <circle cx="0" cy="-0.4" r="2.2" fill={colors.goldPrimary} />
            <path d="M0 -0.4Q12 2 16.5 11" stroke={colors.goldPrimary} strokeWidth="2.2" strokeLinecap="round" />
            <circle cx="16.5" cy="11.5" r="2.3" fill={colors.goldPrimary} />
          </g>
        )}

        {/* Thinking Dots */}
        {isThinking && (
          <g fill={colors.goldPrimary}>
            <circle cx="96" cy="34" r="2.5" opacity="0.7" />
            <circle cx="103" cy="26" r="3.5" opacity="0.85" />
            <circle cx="111" cy="17" r="4.8" />
          </g>
        )}
      </svg>
    </div>
  );
};

/**
 * 3D Plush Character for Sage AI (Muse AI-inspired soft cream character with Scholario gold accents).
 *
 * Procedurally sculpted in Three.js with velvet sheen shading, Fresnel rim glow,
 * expressive eyes + eyelids, blush cheeks, audio-reactive mouth, cozy gold-and-obsidian scarf,
 * and miniature tilted graduation cap.
 */
export const Sage3DAvatar: React.FC<Sage3DAvatarProps> = ({
  state,
  audioLevel = 0,
  compact = false,
  statusLabel,
  greetingTitle = "Hi, I'm Sage",
  collapsed = false,
  onToggleCollapse,
  onPoke,
  pokeCount = 0,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [webglSupported, setWebglSupported] = useState<boolean>(true);
  const stateRef = useRef<Sage3DAvatarState>(state);
  const audioLevelRef = useRef<number>(audioLevel);
  const pokeCountRef = useRef<number>(pokeCount);

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
    if (collapsed) return;
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

    const { colors, accessories, sizes } = SAGE_AVATAR_THEME;
    const plushBumpTex = createPlushBumpTexture();

    // ── Soft Plush Materials ──
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

    // Soft Fresnel-like warm rim aura around the plush body
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
      // Slight pear/chubby cheek fullness in lower-middle half
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

    // 5. Face Features Group (Eyes, Catchlights, Eyelids, Happy Arcs, Blush, Mouth)
    const faceGroup = new THREE.Group();
    faceGroup.position.set(0, 0.03, 0.87);
    headBodyGroup.add(faceGroup);

    // Left & Right Eyes
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

    // Mouth: Smile Arc (idle/typing/listening) + Rounded Open Mouth (speaking/thinking/sleepy/success)
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

    // 6. Scholario Cozy Gold & Obsidian Academic Scarf
    const scarfGroup = new THREE.Group();
    scarfGroup.position.set(0, -0.68, 0.02);
    scarfGroup.visible = accessories.showGoldScarf;
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

    // Draped Scarf Tail + Gleaming Gold Star Pin
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
    scarfStarPin.visible = accessories.showStarPin;
    scarfGroup.add(scarfStarPin);

    // 7. Miniature Tilted Scholario Graduation Cap (Mortarboard + Gold Tassel)
    const capGroup = new THREE.Group();
    capGroup.position.set(0.08, 0.86, 0.04);
    capGroup.rotation.set(0.08, 0.12, -0.14);
    capGroup.visible = accessories.showGraduationCap;
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

    // Swinging Gold Tassel
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

    // Celebration Sparkle Stars (for 'success' and 'poke')
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

    // Soft Listening Ripple Ring (for 'listening')
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

    // Smooth damped spring targets
    const smoothHeadRot = { x: 0, y: 0, z: 0 };
    const smoothBodyPos = { x: 0, y: 0 };
    const smoothBodyScale = { x: 1, y: 1, z: 1 };
    let smoothMouthOpen = 0.08;
    let spinAngle = 0;
    let lastHandledPokeCount = pokeCountRef.current;

    // Frame-rate guard for mid-range Android WebViews
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

      // Auto-adapt pixel ratio if frame rate drops below ~38fps on mobile
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

      // Trigger cute spin on every 2nd tap
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

      // Smooth pointer damping
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
            // Gentle breathing, floating, and occasional curious head tilt
            const slowLook = Math.sin(t * 0.55) * 0.08;
            targetRotY += slowLook;
            targetRotZ += Math.sin(t * 0.8) * 0.035;
            break;
          }
          case 'typing': {
            // Lean forward slightly & look down toward the input box
            targetRotX = 0.22;
            targetRotY = currentPointer.x * 0.15 + Math.sin(t * 1.8) * 0.04;
            targetPosY = -0.03 + Math.sin(t * 2.6) * 0.025;
            break;
          }
          case 'listening': {
            // Perk up attentively toward user
            targetRotX = -0.05;
            targetRotZ = 0.06 * Math.sin(t * 2.8);
            targetPosY = 0.05 + curLevel * 0.05;
            targetScaleX = 1 + curLevel * 0.035;
            targetScaleY = 1 + curLevel * 0.035;
            break;
          }
          case 'nod': {
            // Affirmative double head nod when message is sent
            targetRotX = Math.sin(t * 14) * 0.22 + 0.08;
            targetPosY = Math.abs(Math.sin(t * 7)) * 0.05;
            break;
          }
          case 'thinking': {
            // Thoughtful head tilt + glance up-right toward thought bubbles
            targetRotX = -0.12 + Math.sin(t * 1.9) * 0.04;
            targetRotY = 0.18 + Math.cos(t * 1.3) * 0.08;
            targetRotZ = -0.14 + Math.sin(t * 1.5) * 0.04;
            targetPosY = Math.sin(t * 2.4) * 0.05;
            break;
          }
          case 'speaking': {
            // Lively talking head bobbing
            const speakEnergy = curLevel > 0.03 ? curLevel : 0.45;
            targetRotX = Math.sin(t * 7.5) * 0.06 * speakEnergy;
            targetRotY = currentPointer.x * 0.16 + Math.sin(t * 2.4) * 0.08;
            targetRotZ = Math.cos(t * 3.8) * 0.045;
            targetPosY = Math.abs(Math.sin(t * 5.2)) * 0.055 * speakEnergy;
            break;
          }
          case 'success':
          case 'poke': {
            // Happy celebratory bounce + squash-and-stretch
            const bounce = Math.abs(Math.sin(t * 7.5));
            targetPosY = bounce * 0.16;
            targetScaleX = 1 + (0.5 - bounce) * 0.06;
            targetScaleY = 1 + (bounce - 0.5) * 0.07;
            targetRotZ = Math.sin(t * 6) * 0.09;
            break;
          }
          case 'error': {
            // Apologetic confused head tilt
            targetRotX = 0.12;
            targetRotZ = 0.22 + Math.sin(t * 3) * 0.03;
            targetPosY = -0.04;
            break;
          }
          case 'sleepy': {
            // Slow snooze bobbing
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

      characterGroup.position.y = smoothBodyPos.y;
      characterGroup.rotation.y = spinAngle;
      headBodyGroup.rotation.set(smoothHeadRot.x, smoothHeadRot.y, smoothHeadRot.z);
      headBodyGroup.scale.set(smoothBodyScale.x, smoothBodyScale.y, smoothBodyScale.x);

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
        // Enthusiastic cute paw wave!
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
            // Occasional natural double-blink
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
        // Gentle sad/confused mouth flip
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
          // Periodic cute yawn
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
    };

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
        const w = Math.max(entry.contentRect.width, 64);
        const h = Math.max(entry.contentRect.height, 64);
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
  }, [collapsed]);

  // ── Collapsed Slim Pill View ──
  if (collapsed) {
    return (
      <div className="flex items-center justify-between px-4 py-1.5 bg-amber-50/40 dark:bg-zinc-900/50 border-b border-zinc-200/60 dark:border-zinc-800/70 text-xs">
        <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-300">
          <span className="w-2 h-2 rounded-full bg-[#F4C430]" />
          <span className="font-semibold text-zinc-800 dark:text-zinc-100">Sage Companion</span>
          <span className="text-zinc-400">·</span>
          <span className="text-[11px] text-zinc-500 dark:text-zinc-400">{statusLabel || 'Ready to help'}</span>
        </div>
        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200/50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <span>Show Sage</span>
            <ChevronDown size={13} />
          </button>
        )}
      </div>
    );
  }

  // ── Compact Docked Top Stage (72px tall once conversation has started) ──
  if (compact) {
    return (
      <div className="relative flex items-center justify-between px-4 sm:px-6 h-[72px] bg-gradient-to-b from-[#FFFDF9]/90 to-transparent dark:from-[#16161B]/90 dark:to-transparent border-b border-zinc-200/50 dark:border-zinc-800/60 shrink-0 select-none transition-all duration-300">
        <div className="flex items-center gap-3 min-w-0">
          {/* Interactive 72px 3D Plush Stage */}
          <div
            onClick={onPoke}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') onPoke?.();
            }}
            title="Tap Sage for a cute reaction!"
            className="relative w-[72px] h-[68px] flex items-center justify-center shrink-0 cursor-pointer group"
          >
            <div className="absolute inset-1.5 rounded-full bg-amber-300/15 dark:bg-amber-400/10 blur-md pointer-events-none group-hover:bg-amber-300/25 transition-colors" />
            {webglSupported ? (
              <div ref={mountRef} className="w-full h-full" />
            ) : (
              <Plush2DFallback state={state} audioLevel={audioLevel} compact={true} onPoke={onPoke} />
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-zinc-800 dark:text-zinc-100">Sage</span>
              {state === 'speaking' && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 dark:text-amber-300">
                  <Volume2 size={12} className="animate-pulse" />
                  <span>Speaking</span>
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate max-w-[230px] sm:max-w-md">
              {statusLabel || 'Ask a follow-up question or tap Sage to say hi'}
            </p>
          </div>
        </div>

        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800/70 transition-colors cursor-pointer shrink-0"
            title="Hide avatar"
          >
            <span className="hidden sm:inline">Hide</span>
            <ChevronUp size={14} />
          </button>
        )}
      </div>
    );
  }

  // ── Full Center Stage (When Chat is Fresh / Empty) ──
  return (
    <div className="relative flex flex-col items-center justify-center py-3 px-4 select-none transition-all duration-300">
      {/* Subtle Collapse Button in Top-Right */}
      {onToggleCollapse && (
        <button
          type="button"
          onClick={onToggleCollapse}
          className="absolute top-2 right-3 flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 transition-colors cursor-pointer z-10"
          title="Minimize Sage avatar"
        >
          <span>Minimize</span>
          <ChevronUp size={13} />
        </button>
      )}

      {/* Soft Frameless Stage with Gentle Warm Radial Glow */}
      <div
        onClick={onPoke}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') onPoke?.();
        }}
        title="Tap Sage to say hello!"
        style={{ height: `${SAGE_AVATAR_THEME.sizes.heroHeightPx}px` }}
        className="relative w-full max-w-[260px] flex items-center justify-center cursor-pointer group"
      >
        <div
          className={`absolute w-40 h-40 rounded-full blur-2xl pointer-events-none transition-all duration-500 ${
            state === 'listening'
              ? 'bg-amber-300/35 dark:bg-amber-400/25 scale-110'
              : state === 'speaking'
              ? 'bg-amber-200/35 dark:bg-amber-400/20 scale-105'
              : 'bg-amber-100/45 dark:bg-amber-500/10 group-hover:bg-amber-200/45'
          }`}
        />
        {webglSupported ? (
          <div ref={mountRef} className="w-full h-full relative z-10" />
        ) : (
          <Plush2DFallback state={state} audioLevel={audioLevel} compact={false} onPoke={onPoke} />
        )}
      </div>

      {/* Greeting & Live Status Caption */}
      <div className="text-center mt-1 max-w-md">
        <h2 className="text-base sm:text-lg font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight">
          {greetingTitle}
        </h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
          {statusLabel || 'Your friendly AI study companion — ask a question below or tap me!'}
        </p>
      </div>
    </div>
  );
};

export default Sage3DAvatar;
