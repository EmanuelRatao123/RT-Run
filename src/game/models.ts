import * as THREE from 'three';
import { MapTheme, RunnerSkin } from './catalog';
import { GameTextureSet } from './textures';
import { LANE_WIDTH } from './rules';

export interface AnimatedRigHandles {
  scarfSegments?: THREE.Mesh[];
  thrusterFlames?: THREE.Mesh[];
  wings?: { left: THREE.Object3D; right: THREE.Object3D };
  orbitRing?: THREE.Object3D;
  tailPivot?: THREE.Object3D;
}

export interface RunnerRig {
  root: THREE.Group;
  bodyPivot: THREE.Group;
  torsoGroup: THREE.Group;
  headGroup: THREE.Group;
  leftArmPivot: THREE.Group;
  rightArmPivot: THREE.Group;
  leftLegPivot: THREE.Group;
  rightLegPivot: THREE.Group;
  shadowDisc: THREE.Mesh;
  anim: AnimatedRigHandles;
}

export interface AnimatedProp {
  obj: THREE.Object3D;
  kind: 'spinY' | 'spinZ' | 'pulseScale' | 'bobY' | 'swingZ' | 'blinkColor';
  speed: number;
  baseY?: number;
  phase: number;
}

export interface SceneryChunkResult {
  group: THREE.Group;
  animatedProps: AnimatedProp[];
}

export interface TrainBuildResult {
  group: THREE.Group;
  wheels: THREE.Object3D[];
}

function vox(
  w: number,
  h: number,
  d: number,
  mat: THREE.Material,
  x: number,
  y: number,
  z: number,
  castShadow = false,
  receiveShadow = false
): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  m.castShadow = castShadow;
  m.receiveShadow = receiveShadow;
  return m;
}

export function buildRunnerRig(
  skin: RunnerSkin,
  textures: GameTextureSet
): RunnerRig {
  const root = new THREE.Group();
  const bodyPivot = new THREE.Group();
  root.add(bodyPivot);
  const anim: AnimatedRigHandles = {};

  const skinTex = textures.getSkinTexture(skin.textureVariant);

  const jacketMat = new THREE.MeshStandardMaterial({
    color: skin.primaryColor,
    map: skinTex,
    roughness: skin.textureVariant === 'royal-gold' ? 0.34 : 0.72,
    metalness:
      skin.textureVariant === 'cyber-mecha' || skin.textureVariant === 'royal-gold'
        ? 0.45
        : 0.1,
  });

  const pantsMat = new THREE.MeshStandardMaterial({
    color: skin.secondaryColor,
    map: skinTex,
    roughness: 0.78,
    metalness: 0.14,
  });

  const accentMat = new THREE.MeshStandardMaterial({
    color: skin.accentColor,
    emissive: skin.emissiveAccent ?? 0x000000,
    emissiveIntensity: skin.emissiveAccent ? 0.8 : 0,
    roughness: 0.25,
    metalness: 0.55,
  });

  const skinMat = new THREE.MeshStandardMaterial({
    color: skin.skinTone,
    roughness: 0.65,
    metalness: 0.04,
  });

  const visorMat = new THREE.MeshStandardMaterial({
    color: skin.visorColor,
    emissive: skin.emissiveAccent ?? 0x000000,
    emissiveIntensity: skin.emissiveAccent ? 0.75 : 0,
    roughness: 0.15,
    metalness: 0.8,
  });

  const shoeMat = new THREE.MeshStandardMaterial({
    color: skin.shoeColor,
    roughness: 0.4,
    metalness: 0.22,
  });

  // Voxel Torso (pivoted at hips y = 0.88)
  const torsoGroup = new THREE.Group();
  torsoGroup.position.set(0, 0.88, 0);
  bodyPivot.add(torsoGroup);

  // Blocky main chest + layered voxel jacket vest
  torsoGroup.add(vox(0.56, 0.62, 0.34, jacketMat, 0, 0.34, 0, true));
  torsoGroup.add(vox(0.6, 0.18, 0.38, accentMat, 0, 0.5, 0));
  torsoGroup.add(vox(0.58, 0.12, 0.36, pantsMat, 0, 0.06, 0));
  torsoGroup.add(vox(0.16, 0.1, 0.08, accentMat, 0, 0.06, -0.2));
  // Chest voxel emblem
  torsoGroup.add(vox(0.18, 0.18, 0.08, accentMat, 0, 0.38, -0.19));
  torsoGroup.add(vox(0.09, 0.09, 0.1, visorMat, 0, 0.38, -0.21));

  // Blocky voxel shoulder pauldrons
  torsoGroup.add(vox(0.22, 0.18, 0.34, accentMat, -0.37, 0.56, 0, true));
  torsoGroup.add(vox(0.22, 0.18, 0.34, accentMat, 0.37, 0.56, 0, true));

  // Voxel Backpacks & Animated Accessories
  const packGroup = new THREE.Group();
  packGroup.position.set(0, 0.34, 0.22);
  torsoGroup.add(packGroup);

  const flameMat = new THREE.MeshBasicMaterial({
    color: skin.emissiveAccent ?? 0x38bdf8,
    transparent: true,
    opacity: 0.9,
  });

  if (skin.backpack === 'neon-thruster' || skin.backpack === 'oxygen-tank') {
    packGroup.add(vox(0.14, 0.42, 0.16, jacketMat, -0.11, 0.02, 0, true));
    packGroup.add(vox(0.14, 0.42, 0.16, jacketMat, 0.11, 0.02, 0, true));
    packGroup.add(vox(0.18, 0.1, 0.18, pantsMat, 0, 0.14, -0.02));
    const lFlame = vox(0.12, 0.24, 0.12, flameMat, -0.11, -0.28, 0);
    const rFlame = vox(0.12, 0.24, 0.12, flameMat, 0.11, -0.28, 0);
    packGroup.add(lFlame, rFlame);
    anim.thrusterFlames = [lFlame, rFlame];

    if (skin.backpack === 'oxygen-tank') {
      const orbitRing = new THREE.Group();
      orbitRing.add(vox(0.14, 0.14, 0.14, accentMat, 0.54, 0.45, 0));
      orbitRing.add(vox(0.08, 0.08, 0.18, visorMat, 0.54, 0.45, 0));
      torsoGroup.add(orbitRing);
      anim.orbitRing = orbitRing;
    }
  } else if (skin.backpack === 'katana-sheath') {
    const sheath = vox(0.08, 0.88, 0.08, pantsMat, 0, 0.05, 0.02);
    sheath.rotation.z = -0.68;
    const guard = vox(0.16, 0.05, 0.14, accentMat, 0.22, 0.28, 0.02);
    guard.rotation.z = -0.68;
    const hilt = vox(0.09, 0.22, 0.09, accentMat, 0.3, 0.36, 0.02);
    hilt.rotation.z = -0.68;
    packGroup.add(sheath, guard, hilt);
  } else if (skin.backpack === 'skate-deck') {
    const deck = vox(0.24, 0.72, 0.07, accentMat, 0, 0, 0.02);
    deck.rotation.z = 0.26;
    const w1 = vox(0.16, 0.1, 0.08, shoeMat, -0.06, 0.2, 0.07);
    const w2 = vox(0.16, 0.1, 0.08, shoeMat, 0.06, -0.2, 0.07);
    packGroup.add(deck, w1, w2);
  } else if (skin.backpack === 'mecha-wing') {
    const lWingPivot = new THREE.Group();
    lWingPivot.position.set(-0.1, 0.14, 0.02);
    lWingPivot.add(vox(0.24, 0.14, 0.06, accentMat, -0.14, 0.06, 0));
    lWingPivot.add(vox(0.24, 0.14, 0.06, accentMat, -0.32, 0.16, 0));
    lWingPivot.add(vox(0.2, 0.12, 0.06, visorMat, -0.46, 0.26, 0));

    const rWingPivot = new THREE.Group();
    rWingPivot.position.set(0.1, 0.14, 0.02);
    rWingPivot.add(vox(0.24, 0.14, 0.06, accentMat, 0.14, 0.06, 0));
    rWingPivot.add(vox(0.24, 0.14, 0.06, accentMat, 0.32, 0.16, 0));
    rWingPivot.add(vox(0.2, 0.12, 0.06, visorMat, 0.46, 0.26, 0));

    packGroup.add(lWingPivot, rWingPivot);
    anim.wings = { left: lWingPivot, right: rWingPivot };
  } else if (skin.backpack === 'magma-core') {
    packGroup.add(vox(0.32, 0.32, 0.14, pantsMat, 0, 0, 0.02));
    packGroup.add(vox(0.2, 0.2, 0.2, flameMat, 0, 0, 0.06));
    const auraRing = new THREE.Group();
    auraRing.add(vox(0.1, 0.1, 0.1, flameMat, 0.28, 0.2, 0.06));
    auraRing.add(vox(0.1, 0.1, 0.1, flameMat, -0.28, -0.2, 0.06));
    packGroup.add(auraRing);
    anim.orbitRing = auraRing;
  } else {
    packGroup.add(
      vox(
        0.34,
        0.4,
        0.18,
        skin.backpack === 'gold-capsule' ? jacketMat : pantsMat,
        0,
        0,
        0,
        true
      )
    );
    packGroup.add(vox(0.24, 0.12, 0.2, accentMat, 0, 0.1, 0.02));

    if (skin.backpack === 'gold-capsule') {
      const tailPivot = new THREE.Group();
      tailPivot.position.set(0, -0.24, 0.06);
      tailPivot.add(vox(0.08, 0.08, 0.24, accentMat, 0, -0.02, 0.14));
      tailPivot.add(vox(0.07, 0.07, 0.22, accentMat, 0, 0.04, 0.32));
      packGroup.add(tailPivot);
      anim.tailPivot = tailPivot;
    }
  }

  // Flowing voxel scarf segments
  if (skin.headgear === 'ninja-hood' || skin.headgear === 'cap') {
    const segments: THREE.Mesh[] = [];
    for (let i = 0; i < 3; i++) {
      const seg = vox(0.16, 0.07, 0.22, accentMat, 0, 0.64 - i * 0.04, 0.22 + i * 0.2);
      torsoGroup.add(seg);
      segments.push(seg);
    }
    anim.scarfSegments = segments;
  }

  // Blocky Voxel Head Group
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 0.72, 0);
  torsoGroup.add(headGroup);

  const headMat =
    skin.headgear === 'astro-dome' ||
    skin.headgear === 'visor-helmet' ||
    skin.headgear === 'kabuto' ||
    skin.headgear === 'rat-ears' ||
    skin.headgear === 'flame-horns'
      ? jacketMat
      : skinMat;

  headGroup.add(vox(0.46, 0.46, 0.46, headMat, 0, 0.18, 0, true));
  // Voxel visor / pixel eyes strip on front (-Z)
  headGroup.add(vox(0.48, 0.14, 0.12, visorMat, 0, 0.2, -0.19));

  // Voxel Headgear
  if (skin.headgear === 'cap') {
    headGroup.add(vox(0.5, 0.18, 0.5, accentMat, 0, 0.36, 0));
    headGroup.add(vox(0.46, 0.06, 0.24, accentMat, 0, 0.29, 0.28));
  } else if (skin.headgear === 'rat-ears') {
    headGroup.add(vox(0.22, 0.22, 0.08, accentMat, -0.24, 0.46, 0));
    headGroup.add(vox(0.22, 0.22, 0.08, accentMat, 0.24, 0.46, 0));
    headGroup.add(vox(0.26, 0.12, 0.26, accentMat, 0, 0.45, 0));
    headGroup.add(vox(0.08, 0.08, 0.08, visorMat, 0, 0.54, 0));
  } else if (skin.headgear === 'ninja-hood') {
    headGroup.add(vox(0.5, 0.48, 0.5, pantsMat, 0, 0.18, 0.01));
    headGroup.add(vox(0.52, 0.1, 0.52, accentMat, 0, 0.3, 0));
  } else if (skin.headgear === 'kabuto') {
    headGroup.add(vox(0.56, 0.16, 0.56, jacketMat, 0, 0.34, 0.02));
    headGroup.add(vox(0.1, 0.22, 0.08, accentMat, -0.14, 0.48, -0.2));
    headGroup.add(vox(0.1, 0.22, 0.08, accentMat, 0.14, 0.48, -0.2));
    headGroup.add(vox(0.08, 0.1, 0.08, visorMat, 0, 0.44, -0.22));
  } else if (skin.headgear === 'headphones') {
    headGroup.add(vox(0.56, 0.08, 0.12, accentMat, 0, 0.44, 0));
    headGroup.add(vox(0.1, 0.22, 0.22, accentMat, -0.27, 0.2, 0));
    headGroup.add(vox(0.1, 0.22, 0.22, accentMat, 0.27, 0.2, 0));
  } else if (skin.headgear === 'flame-horns') {
    headGroup.add(vox(0.1, 0.14, 0.1, accentMat, -0.18, 0.46, 0));
    headGroup.add(vox(0.09, 0.14, 0.09, accentMat, -0.24, 0.58, 0.04));
    headGroup.add(vox(0.1, 0.14, 0.1, accentMat, 0.18, 0.46, 0));
    headGroup.add(vox(0.09, 0.14, 0.09, accentMat, 0.24, 0.58, 0.04));
    headGroup.add(vox(0.12, 0.18, 0.16, flameMat, 0, 0.46, 0.12));
  } else if (skin.headgear === 'astro-dome') {
    headGroup.add(vox(0.52, 0.5, 0.52, jacketMat, 0, 0.19, 0));
    headGroup.add(vox(0.42, 0.26, 0.1, visorMat, 0, 0.2, -0.24));
    headGroup.add(vox(0.06, 0.22, 0.06, accentMat, 0.2, 0.52, 0.06));
    headGroup.add(vox(0.1, 0.1, 0.1, flameMat, 0.2, 0.64, 0.06));
  }

  // Blocky Voxel Arms
  const buildArm = (xPos: number): THREE.Group => {
    const pivot = new THREE.Group();
    pivot.position.set(xPos, 0.54, 0);
    pivot.add(vox(0.18, 0.38, 0.18, jacketMat, 0, -0.22, 0, true));
    pivot.add(vox(0.2, 0.1, 0.2, accentMat, 0, -0.39, 0));
    pivot.add(vox(0.16, 0.14, 0.16, skinMat, 0, -0.49, 0));
    return pivot;
  };

  const leftArmPivot = buildArm(-0.38);
  const rightArmPivot = buildArm(0.38);
  torsoGroup.add(leftArmPivot, rightArmPivot);

  // Blocky Voxel Legs + Voxel Sneakers
  const buildLeg = (offsetX: number): THREE.Group => {
    const pivot = new THREE.Group();
    pivot.position.set(offsetX, 0.88, 0);
    pivot.add(vox(0.22, 0.54, 0.22, pantsMat, 0, -0.32, 0, true));
    pivot.add(vox(0.24, 0.12, 0.14, accentMat, 0, -0.35, -0.07));
    pivot.add(vox(0.24, 0.18, 0.34, shoeMat, 0, -0.73, -0.04, true));
    pivot.add(vox(0.26, 0.08, 0.38, accentMat, 0, -0.84, -0.05));
    return pivot;
  };

  const leftLegPivot = buildLeg(-0.155);
  const rightLegPivot = buildLeg(0.155);
  bodyPivot.add(leftLegPivot, rightLegPivot);

  // Pixelated square voxel contact shadow
  const shadowMat = new THREE.MeshBasicMaterial({
    map: textures.contactShadow,
    transparent: true,
    depthWrite: false,
    opacity: 0.62,
  });
  const shadowDisc = new THREE.Mesh(
    new THREE.PlaneGeometry(1.35, 1.35),
    shadowMat
  );
  shadowDisc.rotation.x = -Math.PI / 2;
  shadowDisc.position.y = 0.025;
  root.add(shadowDisc);

  return {
    root,
    bodyPivot,
    torsoGroup,
    headGroup,
    leftArmPivot,
    rightArmPivot,
    leftLegPivot,
    rightLegPivot,
    shadowDisc,
    anim,
  };
}

export function buildTrainModel(
  map: MapTheme,
  textures: GameTextureSet,
  withRamp: boolean
): TrainBuildResult {
  const group = new THREE.Group();
  const wheels: THREE.Object3D[] = [];

  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: textures.trainPanel,
    roughness: 0.52,
    metalness: 0.22,
  });

  const chassisMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.55,
    metalness: 0.65,
  });

  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x090d1a,
    roughness: 0.18,
    metalness: 0.78,
  });

  const roofMat = new THREE.MeshStandardMaterial({
    color: 0x94a3b8,
    roughness: 0.68,
    metalness: 0.28,
  });

  const headlightMat = new THREE.MeshStandardMaterial({
    color: 0xfef9c3,
    emissive: map.accentGlowColor,
    emissiveIntensity: 1.5,
    roughness: 0.2,
  });

  const beamMat = new THREE.MeshBasicMaterial({
    color: map.accentGlowColor,
    transparent: true,
    opacity: 0.16,
    depthWrite: false,
  });

  // Voxel main hull
  group.add(vox(2.48, 2.48, 12.6, bodyMat, 0, 1.7, -0.1, true, true));
  // Stepped Voxel locomotive nose at +Z
  group.add(vox(2.44, 1.65, 1.0, chassisMat, 0, 1.25, 6.45, true));
  group.add(vox(2.38, 0.9, 0.7, bodyMat, 0, 0.9, 7.1));
  group.add(vox(2.04, 0.78, 0.24, glassMat, 0, 2.3, 6.32));

  // Side voxel window frames
  for (const wz of [-4.2, -1.4, 1.4, 4.2]) {
    group.add(vox(2.54, 0.64, 1.44, glassMat, 0, 2.12, wz));
  }

  // Voxel roof deck + HVAC voxel blocks + glowing center stripe
  group.add(vox(2.4, 0.18, 13.0, roofMat, 0, 3.04, 0, false, true));
  group.add(vox(1.48, 0.24, 1.85, chassisMat, 0, 3.18, -3.2));
  group.add(vox(1.48, 0.24, 1.85, chassisMat, 0, 3.18, 3.0));
  group.add(vox(0.2, 0.14, 10.6, headlightMat, 0, 3.14, 0));

  // Voxel undercarriage & blocky rotating voxel wheels
  group.add(vox(2.2, 0.44, 12.4, chassisMat, 0, 0.44, 0));
  const wheelZPositions = [-4.6, -3.2, 3.2, 4.6];
  for (const wz of wheelZPositions) {
    const wl = vox(0.24, 0.64, 0.64, chassisMat, -1.14, 0.32, wz);
    const wr = vox(0.24, 0.64, 0.64, chassisMat, 1.14, 0.32, wz);
    group.add(wl, wr);
    wheels.push(wl, wr);
  }

  // Square pixel headlights & voxel beam blocks
  for (const sx of [-0.75, 0.75]) {
    group.add(vox(0.36, 0.36, 0.18, headlightMat, sx, 1.0, 7.42));
    group.add(vox(0.52, 0.52, 2.1, beamMat, sx, 1.0, 8.55));
  }

  // Stepped Voxel Ramp (6 chunky voxel stairs climbing smoothly to roof)
  if (withRamp) {
    const rampMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: textures.hazardStripes,
      roughness: 0.62,
      metalness: 0.2,
    });
    const steps = 6;
    const totalLen = 5.6;
    const stepLen = totalLen / steps + 0.12;
    for (let s = 0; s < steps; s++) {
      const frac = (s + 1) / steps;
      const stepH = frac * 3.04;
      const stepZ = 12.0 - (s + 0.5) * (totalLen / steps);
      group.add(
        vox(2.38, stepH, stepLen, s % 2 === 0 ? rampMat : chassisMat, 0, stepH / 2, stepZ, true, true)
      );
      group.add(vox(2.42, 0.14, stepLen, rampMat, 0, stepH - 0.05, stepZ));
    }
  }

  return { group, wheels };
}

export function buildLowBarrierModel(
  map: MapTheme,
  textures: GameTextureSet
): THREE.Group {
  const group = new THREE.Group();
  const stripeMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: textures.hazardStripes,
    roughness: 0.5,
    metalness: 0.2,
  });
  const metalMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    roughness: 0.5,
    metalness: 0.65,
  });
  const beaconMat = new THREE.MeshStandardMaterial({
    color: map.accentGlowColor,
    emissive: map.accentGlowColor,
    emissiveIntensity: 1.4,
    roughness: 0.25,
  });

  group.add(vox(2.4, 0.46, 0.28, stripeMat, 0, 0.74, 0, true));
  for (const sx of [-1.02, 1.02]) {
    group.add(vox(0.22, 0.96, 0.22, metalMat, sx, 0.48, 0, true));
    group.add(vox(0.22, 0.2, 0.22, beaconMat, sx, 1.05, 0));
    group.add(vox(0.36, 0.16, 0.52, metalMat, sx, 0.08, 0));
  }

  return group;
}

export function buildHighSignModel(
  map: MapTheme,
  textures: GameTextureSet
): THREE.Group {
  const group = new THREE.Group();
  const postMat = new THREE.MeshStandardMaterial({
    color: 0x475569,
    roughness: 0.48,
    metalness: 0.68,
  });
  const boardMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: textures.hazardStripes,
    roughness: 0.45,
    metalness: 0.2,
  });
  const glowMat = new THREE.MeshStandardMaterial({
    color: map.accentGlowColor,
    emissive: map.accentGlowColor,
    emissiveIntensity: 1.25,
    roughness: 0.25,
  });

  // Compact voxel overhead gate (slide under OR jump high over!)
  group.add(vox(0.22, 2.18, 0.22, postMat, -1.24, 1.09, 0, true));
  group.add(vox(0.22, 2.18, 0.22, postMat, 1.24, 1.09, 0, true));
  group.add(vox(0.36, 0.16, 0.44, postMat, -1.24, 0.08, 0));
  group.add(vox(0.36, 0.16, 0.44, postMat, 1.24, 0.08, 0));
  group.add(vox(2.64, 0.86, 0.3, boardMat, 0, 1.68, 0, true));
  group.add(vox(2.56, 0.12, 0.36, glowMat, 0, 1.26, 0));
  group.add(vox(2.56, 0.12, 0.36, glowMat, 0, 2.11, 0));

  return group;
}

export function buildCoinMesh(textures: GameTextureSet): THREE.Group {
  const group = new THREE.Group();
  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xfacc15,
    emissive: 0xd97706,
    emissiveIntensity: 0.55,
    roughness: 0.18,
    metalness: 0.88,
  });
  const rimMat = new THREE.MeshStandardMaterial({
    color: 0xfef08a,
    emissive: 0xf59e0b,
    emissiveIntensity: 0.65,
    roughness: 0.2,
    metalness: 0.9,
  });

  // Stepped Voxel Coin cross
  group.add(vox(0.46, 0.68, 0.16, goldMat, 0, 0, 0));
  group.add(vox(0.68, 0.46, 0.16, goldMat, 0, 0, 0));
  group.add(vox(0.24, 0.24, 0.24, rimMat, 0, 0, 0));

  const shadowMat = new THREE.MeshBasicMaterial({
    map: textures.contactShadow,
    transparent: true,
    depthWrite: false,
    opacity: 0.35,
  });
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(0.72, 0.72), shadowMat);
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = -0.85;
  group.add(shadow);

  return group;
}

function buildVoxelDisc(
  radius: number,
  depth: number,
  mat: THREE.Material
): THREE.Group {
  const g = new THREE.Group();
  const steps = 4;
  for (let i = -steps; i <= steps; i++) {
    const frac = i / steps;
    const width = Math.max(0.2, Math.sqrt(Math.max(0, 1 - frac * frac * 0.88))) * radius * 2;
    const bandH = (radius * 2) / (steps * 2 + 1);
    g.add(vox(width, bandH * 1.04, depth, mat, 0, frac * radius, 0));
  }
  return g;
}

export function buildMapHorizonVista(
  map: MapTheme,
  textures: GameTextureSet
): { group: THREE.Group; animatedProps: AnimatedProp[] } {
  const group = new THREE.Group();
  const animatedProps: AnimatedProp[] = [];

  if (map.propTheme === 'subway') {
    const sun = buildVoxelDisc(12, 2, new THREE.MeshBasicMaterial({ color: 0xfef08a, fog: false }));
    sun.position.set(18, 36, -125);
    group.add(sun);

    const skylineMat = new THREE.MeshStandardMaterial({
      color: map.buildingPalette[0],
      emissive: 0x1e293b,
      emissiveIntensity: 0.3,
      roughness: 0.78,
    });
    for (let i = -5; i <= 5; i++) {
      if (Math.abs(i) < 2) continue;
      const h = 26 + ((Math.abs(i) * 13) % 24);
      group.add(vox(10, h, 10, skylineMat, i * 15, h / 2 - 2, -110));
      group.add(vox(7, 4, 7, skylineMat, i * 15, h + 1, -110));
    }
  } else if (map.propTheme === 'neon-city') {
    const moon = buildVoxelDisc(13, 2, new THREE.MeshBasicMaterial({ color: 0xe879f9, fog: false }));
    moon.position.set(-16, 38, -128);
    group.add(moon);

    const haloGroup = new THREE.Group();
    haloGroup.position.set(0, 26, -108);
    const haloMat = new THREE.MeshBasicMaterial({ color: map.accentGlowColor, fog: false });
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      haloGroup.add(vox(3.2, 3.2, 2.0, haloMat, Math.cos(a) * 18, Math.sin(a) * 18, 0));
    }
    group.add(haloGroup);
    animatedProps.push({ obj: haloGroup, kind: 'spinZ', speed: 0.35, phase: 0 });
  } else if (map.propTheme === 'canyon') {
    const sun = buildVoxelDisc(18, 2, new THREE.MeshBasicMaterial({ color: 0xfde047, fog: false }));
    sun.position.set(0, 24, -130);
    group.add(sun);
  } else if (map.propTheme === 'arctic') {
    const auroraMat = new THREE.MeshBasicMaterial({
      map: textures.auroraRibbon,
      transparent: true,
      opacity: 0.9,
      side: THREE.DoubleSide,
      depthWrite: false,
      fog: false,
    });
    for (let i = 0; i < 3; i++) {
      const ribbon = vox(112, 16, 1.5, auroraMat, (i - 1) * 20, 34 + i * 5, -112 - i * 6);
      group.add(ribbon);
      animatedProps.push({
        obj: ribbon,
        kind: 'bobY',
        speed: 1.2 + i * 0.3,
        baseY: ribbon.position.y,
        phase: i * 1.4,
      });
    }
  } else if (map.propTheme === 'volcano') {
    const volcMat = new THREE.MeshStandardMaterial({ color: 0x1c1917, roughness: 0.95 });
    const lavaMat = new THREE.MeshBasicMaterial({ color: 0xff5500, fog: false });
    // Stepped voxel volcano pyramid
    for (let t = 0; t < 6; t++) {
      const w = 78 - t * 11;
      group.add(vox(w, 8, w * 0.7, volcMat, 0, 4 + t * 7.2, -122));
    }
    const craterGlow = vox(22, 5, 16, lavaMat, 0, 43, -122);
    group.add(craterGlow);
    group.add(vox(8, 36, 6, lavaMat, 0, 20, -96));
    animatedProps.push({ obj: craterGlow, kind: 'pulseScale', speed: 2.8, phase: 0 });
  } else if (map.propTheme === 'space') {
    const planetMat = new THREE.MeshStandardMaterial({
      map: textures.planetSurface,
      roughness: 0.7,
      emissive: 0x1d4ed8,
      emissiveIntensity: 0.35,
    });
    const planet = new THREE.Group();
    planet.position.set(14, 30, -120);
    planet.add(vox(28, 28, 28, planetMat, 0, 0, 0));
    planet.add(vox(34, 18, 18, planetMat, 0, 0, 0));
    planet.add(vox(18, 34, 18, planetMat, 0, 0, 0));
    planet.add(vox(18, 18, 34, planetMat, 0, 0, 0));

    const ring = new THREE.Group();
    ring.position.copy(planet.position);
    ring.rotation.set(Math.PI * 0.38, 0.2, 0.18);
    const ringMat = new THREE.MeshBasicMaterial({
      color: map.accentGlowColor,
      transparent: true,
      opacity: 0.72,
      fog: false,
    });
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      ring.add(vox(5, 5, 2.2, ringMat, Math.cos(a) * 32, Math.sin(a) * 32, 0));
    }
    group.add(planet, ring);
    animatedProps.push({ obj: planet, kind: 'spinY', speed: 0.18, phase: 0 });
    animatedProps.push({ obj: ring, kind: 'spinZ', speed: 0.12, phase: 0 });
  }

  return { group, animatedProps };
}

export function buildSceneryChunk(
  map: MapTheme,
  textures: GameTextureSet,
  chunkLength = 30
): SceneryChunkResult {
  const chunk = new THREE.Group();
  const animatedProps: AnimatedProp[] = [];

  const outerGroundMat = new THREE.MeshStandardMaterial({
    color: map.groundColor,
    roughness: 0.92,
    metalness: 0.06,
  });
  const outerGround = new THREE.Mesh(
    new THREE.PlaneGeometry(120, chunkLength),
    outerGroundMat
  );
  outerGround.rotation.x = -Math.PI / 2;
  outerGround.position.y = -0.06;
  outerGround.receiveShadow = true;
  chunk.add(outerGround);

  const trackMat = new THREE.MeshStandardMaterial({
    color: map.trackTint,
    map: textures.railTrack,
    bumpMap: textures.gravelBump,
    bumpScale: 0.06,
    roughness: map.propTheme === 'neon-city' || map.propTheme === 'arctic' ? 0.42 : 0.88,
    metalness: map.propTheme === 'neon-city' ? 0.32 : 0.12,
  });
  const trackBed = vox(10.8, 0.1, chunkLength, trackMat, 0, -0.05, 0, false, true);
  chunk.add(trackBed);

  // Voxel Curb blocks
  const curbMat = new THREE.MeshStandardMaterial({
    color: map.curbColor,
    roughness: 0.72,
    metalness: 0.2,
  });
  chunk.add(vox(0.75, 0.28, chunkLength, curbMat, -5.68, 0.12, 0, false, true));
  chunk.add(vox(0.75, 0.28, chunkLength, curbMat, 5.68, 0.12, 0, false, true));

  // Glowing voxel curb trim
  const glowMat = new THREE.MeshStandardMaterial({
    color: map.accentGlowColor,
    emissive: map.accentGlowColor,
    emissiveIntensity: 1.15,
    roughness: 0.28,
  });
  chunk.add(vox(0.14, 0.08, chunkLength, glowMat, -5.32, 0.27, 0));
  chunk.add(vox(0.14, 0.08, chunkLength, glowMat, 5.32, 0.27, 0));

  // 6 Voxel Steel Rails + Voxel Sleeper Ties
  const railMat = new THREE.MeshStandardMaterial({
    color: map.railColor,
    roughness: 0.28,
    metalness: 0.8,
  });
  const tieMat = new THREE.MeshStandardMaterial({
    color: map.curbColor,
    roughness: 0.85,
  });
  for (const lane of [-1, 0, 1]) {
    const cx = lane * LANE_WIDTH;
    chunk.add(vox(0.14, 0.08, chunkLength, railMat, cx - 0.68, 0.04, 0));
    chunk.add(vox(0.14, 0.08, chunkLength, railMat, cx + 0.68, 0.04, 0));
    for (let tz = -chunkLength * 0.45; tz <= chunkLength * 0.45; tz += 3.0) {
      chunk.add(vox(1.72, 0.04, 0.36, tieMat, cx, 0.02, tz));
    }
  }

  // Voxel Overhead Gantry Arch
  const gantryMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    roughness: 0.48,
    metalness: 0.62,
  });
  chunk.add(vox(0.48, 6.8, 0.48, gantryMat, -5.7, 3.4, -chunkLength * 0.25));
  chunk.add(vox(0.48, 6.8, 0.48, gantryMat, 5.7, 3.4, -chunkLength * 0.25));
  chunk.add(vox(11.9, 0.42, 0.48, gantryMat, 0, 6.7, -chunkLength * 0.25));
  chunk.add(vox(4.8, 0.18, 0.52, glowMat, 0, 6.46, -chunkLength * 0.25));

  if (map.propTheme === 'space') {
    const warpArch = new THREE.Group();
    warpArch.position.set(0, 0.4, chunkLength * 0.25);
    warpArch.add(vox(0.4, 5.2, 0.4, glowMat, -5.6, 2.6, 0));
    warpArch.add(vox(0.4, 5.2, 0.4, glowMat, 5.6, 2.6, 0));
    warpArch.add(vox(11.6, 0.4, 0.4, glowMat, 0, 5.2, 0));
    chunk.add(warpArch);
    animatedProps.push({
      obj: warpArch,
      kind: 'pulseScale',
      speed: 2.2,
      phase: Math.random() * 3,
    });
  }

  const wallMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: textures.urbanWall,
    roughness: 0.82,
    metalness: 0.08,
  });

  const windowMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: textures.cityWindows,
    emissive: 0x38bdf8,
    emissiveMap: textures.cityWindows,
    emissiveIntensity: map.propTheme === 'neon-city' ? 1.4 : 0.45,
    roughness: 0.35,
  });

  for (const side of [-1, 1]) {
    const baseX = side * 10.6;
    if (map.propTheme === 'subway') {
      for (let i = 0; i < 2; i++) {
        const zOff = (i === 0 ? -7.5 : 7.5) + (side === 1 ? 1.5 : -1.5);
        const h = 11 + ((i + (side > 0 ? 1 : 0)) % 3) * 4.5;
        const bldgColor = map.buildingPalette[(i + (side > 0 ? 1 : 0)) % map.buildingPalette.length];
        const bldgMat = new THREE.MeshStandardMaterial({
          color: bldgColor,
          map: textures.urbanWall,
          roughness: 0.82,
        });
        chunk.add(vox(6.5, h, 11.5, bldgMat, baseX, h / 2 - 0.05, zOff, false, true));
        chunk.add(vox(7.0, 0.55, 12.0, gantryMat, baseX, h + 0.15, zOff));
        chunk.add(vox(4.5, 1.8, 7.5, wallMat, baseX, h + 1.2, zOff));
      }
      // Voxel railway semaphore beacon
      chunk.add(vox(0.24, 4.2, 0.24, gantryMat, side * 6.2, 2.1, 4));
      const sigBulb = vox(
        0.52,
        0.52,
        0.52,
        new THREE.MeshStandardMaterial({
          color: 0x22c55e,
          emissive: 0x22c55e,
          emissiveIntensity: 1.4,
        }),
        side * 6.2,
        4.35,
        4
      );
      chunk.add(sigBulb);
      animatedProps.push({
        obj: sigBulb,
        kind: 'pulseScale',
        speed: 3.5,
        phase: side > 0 ? 0 : 1.5,
      });
    } else if (map.propTheme === 'neon-city') {
      for (let i = 0; i < 2; i++) {
        const zOff = (i === 0 ? -7.5 : 7.5) + (side === 1 ? 1.5 : -1.5);
        const h = 14 + ((i + (side > 0 ? 1 : 0)) % 3) * 5;
        chunk.add(vox(6.6, h, 11.5, windowMat, baseX, h / 2 - 0.05, zOff));
        chunk.add(vox(5.0, 2.2, 8.5, gantryMat, baseX, h + 1.1, zOff));

        const holoMat = new THREE.MeshStandardMaterial({
          color: i % 2 === 0 ? map.accentGlowColor : 0xf472b6,
          emissive: i % 2 === 0 ? map.accentGlowColor : 0xf472b6,
          emissiveIntensity: 1.6,
        });
        const holo = vox(1.1, 1.1, 1.1, holoMat, side * 6.8, 4.2 + i * 1.4, zOff);
        holo.rotation.set(Math.PI / 4, 0, Math.PI / 4);
        chunk.add(holo);
        chunk.add(vox(0.36, 7.2, 0.36, holoMat, side * 6.9, 5.5, zOff + 3.2));
        animatedProps.push({
          obj: holo,
          kind: 'spinY',
          speed: 2.2,
          phase: i + side,
        });
      }
    } else if (map.propTheme === 'canyon') {
      const rockMat = new THREE.MeshStandardMaterial({
        color: map.buildingPalette[0],
        roughness: 0.92,
      });
      const rockTopMat = new THREE.MeshStandardMaterial({
        color: map.buildingPalette[2 % map.buildingPalette.length],
        roughness: 0.9,
      });
      // Tiered Voxel Mesa
      chunk.add(vox(9.5, 5.5, 11.5, rockMat, baseX + side * 2, 2.75, side * 4));
      chunk.add(vox(7.2, 4.5, 8.5, rockTopMat, baseX + side * 2, 7.75, side * 4));
      chunk.add(vox(4.8, 3.0, 6.0, rockMat, baseX + side * 2, 11.5, side * 4));

      // Voxel Wind Turbine
      const mastMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.45 });
      chunk.add(vox(0.36, 9.5, 0.36, mastMat, side * 8.2, 4.75, -side * 6));
      const rotor = new THREE.Group();
      rotor.position.set(side * 8.2, 9.4, -side * 5.7);
      for (let b = 0; b < 3; b++) {
        const bladePivot = new THREE.Group();
        bladePivot.rotation.z = (b * Math.PI * 2) / 3;
        bladePivot.add(vox(0.32, 3.1, 0.14, mastMat, 0, 1.55, 0));
        rotor.add(bladePivot);
      }
      chunk.add(rotor);
      animatedProps.push({ obj: rotor, kind: 'spinZ', speed: 3.4, phase: side });

      // Blocky Voxel Saguaro Cactus
      const cactusMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.8 });
      chunk.add(vox(0.54, 3.0, 0.54, cactusMat, side * 6.8, 1.5, side * 6));
      chunk.add(vox(0.65, 0.4, 0.4, cactusMat, side * 6.8 + side * 0.48, 1.8, side * 6));
      chunk.add(vox(0.38, 1.0, 0.38, cactusMat, side * 6.8 + side * 0.72, 2.3, side * 6));
    } else if (map.propTheme === 'arctic') {
      const iceMat = new THREE.MeshStandardMaterial({
        color: map.buildingPalette[0],
        emissive: 0x0284c7,
        emissiveIntensity: 0.18,
        roughness: 0.22,
        metalness: 0.3,
      });
      // Stepped Voxel Iceberg Spire
      chunk.add(vox(7.2, 5.2, 8.2, iceMat, baseX + side * 1.5, 2.6, side * 3));
      chunk.add(vox(4.8, 4.8, 5.4, iceMat, baseX + side * 1.5, 7.6, side * 3));
      chunk.add(vox(2.6, 3.6, 3.0, iceMat, baseX + side * 1.5, 11.8, side * 3));

      // Floating rotating voxel crystal
      const crystal = vox(
        1.1,
        1.1,
        1.1,
        new THREE.MeshStandardMaterial({
          color: 0x67e8f9,
          emissive: 0x06b6d4,
          emissiveIntensity: 0.75,
          roughness: 0.18,
        }),
        side * 6.8,
        3.2,
        -side * 4
      );
      crystal.rotation.set(Math.PI / 4, 0, Math.PI / 4);
      chunk.add(crystal);
      animatedProps.push({ obj: crystal, kind: 'spinY', speed: 1.8, phase: side });
      animatedProps.push({
        obj: crystal,
        kind: 'bobY',
        speed: 2.2,
        baseY: 3.2,
        phase: side,
      });

      // Blocky Voxel Snow Pine Tree
      const pineMat = new THREE.MeshStandardMaterial({ color: 0x0f766e, roughness: 0.85 });
      const snowCapMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.7 });
      const trunkMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.9 });
      chunk.add(vox(0.55, 1.2, 0.55, trunkMat, side * 7.2, 0.6, side * 6));
      chunk.add(vox(2.6, 1.4, 2.6, pineMat, side * 7.2, 1.8, side * 6));
      chunk.add(vox(1.9, 1.3, 1.9, pineMat, side * 7.2, 3.0, side * 6));
      chunk.add(vox(1.2, 1.0, 1.2, snowCapMat, side * 7.2, 4.0, side * 6));
    } else if (map.propTheme === 'volcano') {
      const lavaMat = new THREE.MeshStandardMaterial({
        color: 0xff4500,
        emissive: 0xff3300,
        emissiveIntensity: 1.7,
        roughness: 0.3,
      });
      chunk.add(vox(4.4, 0.12, chunkLength, lavaMat, side * 8.2, -0.04, 0));

      const basaltMat = new THREE.MeshStandardMaterial({ color: 0x292524, roughness: 0.92 });
      // Stepped Voxel Basalt Crag
      chunk.add(vox(7.5, 5.0, 8.5, basaltMat, baseX + side * 3.2, 2.5, side * 4));
      chunk.add(vox(5.2, 4.5, 5.8, basaltMat, baseX + side * 3.2, 7.2, side * 4));
      chunk.add(vox(3.0, 3.5, 3.4, basaltMat, baseX + side * 3.2, 11.2, side * 4));

      const emberCore = vox(1.15, 1.15, 1.15, lavaMat, side * 7.0, 2.8, -side * 5);
      emberCore.rotation.set(Math.PI / 4, 0, Math.PI / 4);
      chunk.add(emberCore);
      animatedProps.push({ obj: emberCore, kind: 'bobY', speed: 2.6, baseY: 2.8, phase: side });
      animatedProps.push({ obj: emberCore, kind: 'spinY', speed: 2.1, phase: side });
    } else if (map.propTheme === 'space') {
      const solarMat = new THREE.MeshStandardMaterial({
        color: 0x1d4ed8,
        emissive: 0x1e40af,
        emissiveIntensity: 0.45,
        roughness: 0.22,
        metalness: 0.8,
      });
      chunk.add(vox(0.24, 0.1, chunkLength, glowMat, side * 8.2, 0.02, 0));
      chunk.add(vox(0.52, 8.5, 0.52, gantryMat, baseX, 4.25, 0));
      const panelPivot = new THREE.Group();
      panelPivot.position.set(baseX, 6.6, 0);
      panelPivot.add(vox(0.2, 3.6, 8.6, solarMat, 0, 0, 0));
      panelPivot.add(vox(0.28, 0.22, 8.8, gantryMat, 0, 0, 0));

      const sat = vox(1.3, 1.3, 1.3, glowMat, side * 7.2, 3.5, side * 6);
      sat.rotation.set(Math.PI / 4, 0, Math.PI / 4);
      chunk.add(panelPivot, sat);
      animatedProps.push({ obj: panelPivot, kind: 'swingZ', speed: 1.4, phase: side * 1.2 });
      animatedProps.push({ obj: sat, kind: 'spinY', speed: 1.9, phase: side });
    }
  }

  return { group: chunk, animatedProps };
}
