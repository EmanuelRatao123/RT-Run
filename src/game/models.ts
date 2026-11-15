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
    roughness: skin.textureVariant === 'royal-gold' ? 0.32 : 0.62,
    metalness:
      skin.textureVariant === 'cyber-mecha' || skin.textureVariant === 'royal-gold'
        ? 0.55
        : 0.15,
  });

  const pantsMat = new THREE.MeshStandardMaterial({
    color: skin.secondaryColor,
    map: skinTex,
    roughness: 0.72,
    metalness: 0.18,
  });

  const accentMat = new THREE.MeshStandardMaterial({
    color: skin.accentColor,
    emissive: skin.emissiveAccent ?? 0x000000,
    emissiveIntensity: skin.emissiveAccent ? 0.85 : 0,
    roughness: 0.22,
    metalness: 0.65,
  });

  const skinMat = new THREE.MeshStandardMaterial({
    color: skin.skinTone,
    roughness: 0.58,
    metalness: 0.05,
  });

  const visorMat = new THREE.MeshStandardMaterial({
    color: skin.visorColor,
    emissive: skin.emissiveAccent ?? 0x000000,
    emissiveIntensity: skin.emissiveAccent ? 0.72 : 0,
    roughness: 0.12,
    metalness: 0.88,
  });

  const shoeMat = new THREE.MeshStandardMaterial({
    color: skin.shoeColor,
    roughness: 0.35,
    metalness: 0.28,
  });

  // Sculpted Torso (pivoted at hips y = 0.88)
  const torsoGroup = new THREE.Group();
  torsoGroup.position.set(0, 0.88, 0);
  bodyPivot.add(torsoGroup);

  const chest = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.27, 0.32, 8, 16),
    jacketMat
  );
  chest.scale.set(1.12, 1.0, 0.78);
  chest.position.y = 0.34;
  chest.castShadow = true;
  torsoGroup.add(chest);

  // Shoulder pauldrons
  const pauldronGeo = new THREE.SphereGeometry(0.14, 12, 10);
  const lPauldron = new THREE.Mesh(pauldronGeo, accentMat);
  lPauldron.scale.set(1.1, 0.75, 1.0);
  lPauldron.position.set(-0.34, 0.54, 0);
  const rPauldron = new THREE.Mesh(pauldronGeo, accentMat);
  rPauldron.scale.set(1.1, 0.75, 1.0);
  rPauldron.position.set(0.34, 0.54, 0);
  torsoGroup.add(lPauldron, rPauldron);

  // Chest core / emblem & sculpted belt
  const coreBadge = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.09, 0),
    accentMat
  );
  coreBadge.position.set(0, 0.4, -0.21);
  coreBadge.scale.set(1, 1.2, 0.5);
  torsoGroup.add(coreBadge);

  const belt = new THREE.Mesh(
    new THREE.CylinderGeometry(0.24, 0.25, 0.12, 16),
    pantsMat
  );
  belt.scale.set(1.1, 1, 0.8);
  belt.position.y = 0.06;
  torsoGroup.add(belt);

  const buckle = new THREE.Mesh(
    new THREE.BoxGeometry(0.14, 0.09, 0.08),
    accentMat
  );
  buckle.position.set(0, 0.06, -0.2);
  torsoGroup.add(buckle);

  // Backpack / Animated Accessories per skin
  const packGroup = new THREE.Group();
  packGroup.position.set(0, 0.34, 0.22);
  torsoGroup.add(packGroup);

  const flameMat = new THREE.MeshBasicMaterial({
    color: skin.emissiveAccent ?? 0x38bdf8,
    transparent: true,
    opacity: 0.88,
  });

  if (skin.backpack === 'neon-thruster' || skin.backpack === 'oxygen-tank') {
    const cylGeo = new THREE.CylinderGeometry(0.085, 0.095, 0.44, 14);
    const leftTank = new THREE.Mesh(cylGeo, jacketMat);
    leftTank.position.x = -0.11;
    const rightTank = new THREE.Mesh(cylGeo, jacketMat);
    rightTank.position.x = 0.11;
    const nozzleGeo = new THREE.ConeGeometry(0.07, 0.26, 10);
    const lFlame = new THREE.Mesh(nozzleGeo, flameMat);
    lFlame.rotation.x = Math.PI;
    lFlame.position.set(-0.11, -0.32, 0);
    const rFlame = new THREE.Mesh(nozzleGeo, flameMat);
    rFlame.rotation.x = Math.PI;
    rFlame.position.set(0.11, -0.32, 0);
    packGroup.add(leftTank, rightTank, lFlame, rFlame);
    anim.thrusterFlames = [lFlame, rFlame];

    if (skin.backpack === 'oxygen-tank') {
      const orbitRing = new THREE.Group();
      const drone = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.08, 0),
        accentMat
      );
      drone.position.set(0.55, 0.45, 0);
      orbitRing.add(drone);
      torsoGroup.add(orbitRing);
      anim.orbitRing = orbitRing;
    }
  } else if (skin.backpack === 'katana-sheath') {
    const sheath = new THREE.Mesh(
      new THREE.CylinderGeometry(0.036, 0.028, 0.94, 10),
      pantsMat
    );
    sheath.rotation.z = -0.68;
    const hilt = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.045, 0.22, 10),
      accentMat
    );
    hilt.position.set(0.3, 0.36, 0);
    hilt.rotation.z = -0.68;
    packGroup.add(sheath, hilt);
  } else if (skin.backpack === 'skate-deck') {
    const deck = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.13, 0.56, 4, 12),
      accentMat
    );
    deck.scale.set(1.0, 1.0, 0.22);
    deck.rotation.z = 0.28;
    const wheelGeo = new THREE.CylinderGeometry(0.045, 0.045, 0.06, 10);
    const w1 = new THREE.Mesh(wheelGeo, shoeMat);
    w1.rotation.x = Math.PI / 2;
    w1.position.set(-0.08, 0.22, 0.06);
    const w2 = w1.clone();
    w2.position.set(0.08, -0.22, 0.06);
    packGroup.add(deck, w1, w2);
  } else if (skin.backpack === 'mecha-wing') {
    const wingShape = new THREE.Shape();
    wingShape.moveTo(0, 0);
    wingShape.lineTo(0.62, 0.28);
    wingShape.lineTo(0.48, -0.05);
    wingShape.lineTo(0.12, -0.18);
    wingShape.closePath();
    const wingGeo = new THREE.ExtrudeGeometry(wingShape, {
      depth: 0.035,
      bevelEnabled: true,
      bevelSize: 0.012,
      bevelThickness: 0.012,
    });
    const lWingPivot = new THREE.Group();
    lWingPivot.position.set(-0.1, 0.12, 0.02);
    const lWing = new THREE.Mesh(wingGeo, accentMat);
    lWing.scale.x = -1;
    lWingPivot.add(lWing);

    const rWingPivot = new THREE.Group();
    rWingPivot.position.set(0.1, 0.12, 0.02);
    const rWing = new THREE.Mesh(wingGeo, accentMat);
    rWingPivot.add(rWing);

    packGroup.add(lWingPivot, rWingPivot);
    anim.wings = { left: lWingPivot, right: rWingPivot };
  } else if (skin.backpack === 'magma-core') {
    const core = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.2, 0),
      flameMat
    );
    core.position.z = 0.06;
    const housing = new THREE.Mesh(
      new THREE.TorusGeometry(0.22, 0.045, 8, 16),
      pantsMat
    );
    const auraRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.32, 0.028, 8, 20),
      flameMat
    );
    packGroup.add(core, housing, auraRing);
    anim.orbitRing = auraRing;
  } else {
    const pack = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.16, 0.22, 6, 12),
      skin.backpack === 'gold-capsule' ? jacketMat : pantsMat
    );
    pack.scale.set(1.1, 1.0, 0.65);
    pack.castShadow = true;
    packGroup.add(pack);

    if (skin.backpack === 'gold-capsule') {
      const emblem = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.11, 0),
        accentMat
      );
      emblem.position.set(0, 0.02, 0.12);
      const tailPivot = new THREE.Group();
      tailPivot.position.set(0, -0.26, 0.05);
      const tail = new THREE.Mesh(
        new THREE.CylinderGeometry(0.032, 0.015, 0.58, 8),
        accentMat
      );
      tail.rotation.x = 1.1;
      tail.position.set(0, -0.1, 0.24);
      tailPivot.add(tail);
      packGroup.add(emblem, tailPivot);
      anim.tailPivot = tailPivot;
    }
  }

  // Flowing animated scarf for Ninja & RT Classic
  if (skin.headgear === 'ninja-hood' || skin.headgear === 'cap') {
    const segments: THREE.Mesh[] = [];
    const scarfGeo = new THREE.BoxGeometry(0.15, 0.05, 0.24);
    for (let i = 0; i < 3; i++) {
      const seg = new THREE.Mesh(scarfGeo, accentMat);
      seg.position.set(0, 0.64 - i * 0.03, 0.22 + i * 0.2);
      torsoGroup.add(seg);
      segments.push(seg);
    }
    anim.scarfSegments = segments;
  }

  // Head group
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 0.72, 0);
  torsoGroup.add(headGroup);

  const headMesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.245, 20, 18),
    skin.headgear === 'astro-dome' ||
      skin.headgear === 'visor-helmet' ||
      skin.headgear === 'kabuto' ||
      skin.headgear === 'rat-ears' ||
      skin.headgear === 'flame-horns'
      ? jacketMat
      : skinMat
  );
  headMesh.position.y = 0.16;
  headMesh.castShadow = true;
  headGroup.add(headMesh);

  // Curved wrap-around visor
  const visor = new THREE.Mesh(
    new THREE.CylinderGeometry(0.248, 0.248, 0.11, 18, 1, false, -Math.PI * 0.35, Math.PI * 0.7),
    visorMat
  );
  visor.rotation.y = Math.PI;
  visor.position.set(0, 0.17, -0.02);
  headGroup.add(visor);

  // Headgear
  if (skin.headgear === 'cap') {
    const crown = new THREE.Mesh(
      new THREE.SphereGeometry(0.26, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.56),
      accentMat
    );
    crown.position.y = 0.18;
    const brim = new THREE.Mesh(
      new THREE.CylinderGeometry(0.22, 0.25, 0.035, 14, 1, false, -0.7, 1.4),
      accentMat
    );
    brim.position.set(0, 0.24, 0.14);
    headGroup.add(crown, brim);
  } else if (skin.headgear === 'rat-ears') {
    const earGeo = new THREE.CylinderGeometry(0.13, 0.13, 0.05, 18);
    const lEar = new THREE.Mesh(earGeo, accentMat);
    lEar.rotation.x = Math.PI / 2;
    lEar.position.set(-0.21, 0.4, 0);
    const rEar = new THREE.Mesh(earGeo, accentMat);
    rEar.rotation.x = Math.PI / 2;
    rEar.position.set(0.21, 0.4, 0);
    const crownBand = new THREE.Mesh(
      new THREE.CylinderGeometry(0.13, 0.15, 0.11, 6),
      accentMat
    );
    crownBand.position.set(0, 0.43, 0);
    headGroup.add(lEar, rEar, crownBand);
  } else if (skin.headgear === 'ninja-hood') {
    const hood = new THREE.Mesh(
      new THREE.SphereGeometry(0.262, 18, 14),
      pantsMat
    );
    hood.position.y = 0.16;
    const headband = new THREE.Mesh(
      new THREE.TorusGeometry(0.255, 0.032, 8, 20),
      accentMat
    );
    headband.rotation.x = Math.PI / 2;
    headband.position.y = 0.26;
    headGroup.add(hood, headband);
  } else if (skin.headgear === 'kabuto') {
    const helmetRim = new THREE.Mesh(
      new THREE.CylinderGeometry(0.27, 0.31, 0.15, 16, 1, true),
      jacketMat
    );
    helmetRim.position.y = 0.22;
    const crestL = new THREE.Mesh(
      new THREE.ConeGeometry(0.05, 0.3, 4),
      accentMat
    );
    crestL.position.set(-0.1, 0.44, -0.14);
    crestL.rotation.set(0.3, 0, 0.45);
    const crestR = crestL.clone();
    crestR.position.x = 0.1;
    crestR.rotation.z = -0.45;
    headGroup.add(helmetRim, crestL, crestR);
  } else if (skin.headgear === 'headphones') {
    const band = new THREE.Mesh(
      new THREE.TorusGeometry(0.27, 0.032, 8, 20, Math.PI),
      accentMat
    );
    band.position.y = 0.18;
    const cupGeo = new THREE.CylinderGeometry(0.095, 0.095, 0.065, 14);
    const lCup = new THREE.Mesh(cupGeo, accentMat);
    lCup.rotation.z = Math.PI / 2;
    lCup.position.set(-0.265, 0.16, 0);
    const rCup = new THREE.Mesh(cupGeo, accentMat);
    rCup.rotation.z = Math.PI / 2;
    rCup.position.set(0.265, 0.16, 0);
    headGroup.add(band, lCup, rCup);
  } else if (skin.headgear === 'flame-horns') {
    const hornCurveL = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.14, 0.34, 0),
      new THREE.Vector3(-0.24, 0.48, 0.04),
      new THREE.Vector3(-0.18, 0.62, 0.1),
    ]);
    const hornCurveR = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.14, 0.34, 0),
      new THREE.Vector3(0.24, 0.48, 0.04),
      new THREE.Vector3(0.18, 0.62, 0.1),
    ]);
    const lHorn = new THREE.Mesh(
      new THREE.TubeGeometry(hornCurveL, 10, 0.045, 8, false),
      accentMat
    );
    const rHorn = new THREE.Mesh(
      new THREE.TubeGeometry(hornCurveR, 10, 0.045, 8, false),
      accentMat
    );
    const crest = new THREE.Mesh(
      new THREE.ConeGeometry(0.075, 0.24, 5),
      accentMat
    );
    crest.position.set(0, 0.36, 0.16);
    crest.rotation.x = -0.65;
    headGroup.add(lHorn, rHorn, crest);
  } else if (skin.headgear === 'astro-dome') {
    const antenna = new THREE.Mesh(
      new THREE.CylinderGeometry(0.015, 0.015, 0.22, 6),
      accentMat
    );
    antenna.position.set(0.2, 0.38, 0.05);
    const tip = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 8), visorMat);
    tip.position.set(0.2, 0.49, 0.05);
    headGroup.add(antenna, tip);
  }

  // Sculpted Arms (Capsules + Gauntlets + Hands)
  const armGeo = new THREE.CapsuleGeometry(0.08, 0.34, 6, 10);
  const cuffGeo = new THREE.CylinderGeometry(0.09, 0.085, 0.1, 10);
  const handGeo = new THREE.SphereGeometry(0.085, 10, 10);

  const leftArmPivot = new THREE.Group();
  leftArmPivot.position.set(-0.37, 0.54, 0);
  const leftArm = new THREE.Mesh(armGeo, jacketMat);
  leftArm.position.y = -0.22;
  leftArm.castShadow = true;
  const leftCuff = new THREE.Mesh(cuffGeo, accentMat);
  leftCuff.position.y = -0.38;
  const leftHand = new THREE.Mesh(handGeo, skinMat);
  leftHand.position.y = -0.49;
  leftArmPivot.add(leftArm, leftCuff, leftHand);
  torsoGroup.add(leftArmPivot);

  const rightArmPivot = new THREE.Group();
  rightArmPivot.position.set(0.37, 0.54, 0);
  const rightArm = new THREE.Mesh(armGeo, jacketMat);
  rightArm.position.y = -0.22;
  rightArm.castShadow = true;
  const rightCuff = new THREE.Mesh(cuffGeo, accentMat);
  rightCuff.position.y = -0.38;
  const rightHand = new THREE.Mesh(handGeo, skinMat);
  rightHand.position.y = -0.49;
  rightArmPivot.add(rightArm, rightCuff, rightHand);
  torsoGroup.add(rightArmPivot);

  // Sculpted Legs + Knee Pads + Multi-Part Sneakers
  const legGeo = new THREE.CapsuleGeometry(0.095, 0.46, 6, 10);
  const kneeGeo = new THREE.BoxGeometry(0.16, 0.14, 0.12);
  const shoeUpperGeo = new THREE.CapsuleGeometry(0.105, 0.16, 6, 10);
  const soleGeo = new THREE.BoxGeometry(0.22, 0.06, 0.38);

  const buildLeg = (offsetX: number): THREE.Group => {
    const pivot = new THREE.Group();
    pivot.position.set(offsetX, 0.88, 0);

    const leg = new THREE.Mesh(legGeo, pantsMat);
    leg.position.y = -0.34;
    leg.castShadow = true;

    const knee = new THREE.Mesh(kneeGeo, accentMat);
    knee.position.set(0, -0.36, -0.07);

    const shoeUpper = new THREE.Mesh(shoeUpperGeo, shoeMat);
    shoeUpper.rotation.x = Math.PI / 2;
    shoeUpper.position.set(0, -0.75, -0.05);
    shoeUpper.castShadow = true;

    const sole = new THREE.Mesh(soleGeo, accentMat);
    sole.position.set(0, -0.84, -0.06);

    pivot.add(leg, knee, shoeUpper, sole);
    return pivot;
  };

  const leftLegPivot = buildLeg(-0.155);
  const rightLegPivot = buildLeg(0.155);
  bodyPivot.add(leftLegPivot, rightLegPivot);

  // Contact shadow disc
  const shadowMat = new THREE.MeshBasicMaterial({
    map: textures.contactShadow,
    transparent: true,
    depthWrite: false,
    opacity: 0.62,
  });
  const shadowDisc = new THREE.Mesh(
    new THREE.PlaneGeometry(1.4, 1.4),
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
    roughness: 0.4,
    metalness: 0.3,
  });

  const chassisMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.45,
    metalness: 0.78,
  });

  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x090d1a,
    roughness: 0.1,
    metalness: 0.88,
  });

  const roofMat = new THREE.MeshStandardMaterial({
    color: 0x94a3b8,
    roughness: 0.6,
    metalness: 0.38,
  });

  const headlightMat = new THREE.MeshStandardMaterial({
    color: 0xfef9c3,
    emissive: map.accentGlowColor,
    emissiveIntensity: 1.6,
    roughness: 0.15,
  });

  const beamMat = new THREE.MeshBasicMaterial({
    color: map.accentGlowColor,
    transparent: true,
    opacity: 0.18,
    depthWrite: false,
  });

  // Main carriage hull
  const hull = new THREE.Mesh(
    new THREE.BoxGeometry(2.48, 2.52, 12.6),
    bodyMat
  );
  hull.position.set(0, 1.72, -0.1);
  hull.castShadow = true;
  hull.receiveShadow = true;
  group.add(hull);

  // Sloped aerodynamic nose cab at +Z
  const noseShape = new THREE.Shape();
  noseShape.moveTo(0, 0.45);
  noseShape.lineTo(1.2, 0.45);
  noseShape.lineTo(0.85, 2.5);
  noseShape.lineTo(0, 2.95);
  noseShape.closePath();
  const noseGeo = new THREE.ExtrudeGeometry(noseShape, {
    depth: 2.42,
    bevelEnabled: true,
    bevelSize: 0.04,
    bevelThickness: 0.04,
  });
  noseGeo.translate(0, 0, -1.21);
  noseGeo.rotateY(-Math.PI / 2);
  const nose = new THREE.Mesh(noseGeo, chassisMat);
  nose.position.set(0, 0, 6.2);
  nose.castShadow = true;
  group.add(nose);

  // Side illuminated window frames
  const sideWinGeo = new THREE.BoxGeometry(2.52, 0.65, 1.5);
  for (const wz of [-4.2, -1.4, 1.4, 4.2]) {
    const win = new THREE.Mesh(sideWinGeo, glassMat);
    win.position.set(0, 2.15, wz);
    group.add(win);
  }

  // Roof deck (runnable!)
  const roof = new THREE.Mesh(
    new THREE.BoxGeometry(2.38, 0.16, 13.0),
    roofMat
  );
  roof.position.y = 3.04;
  roof.receiveShadow = true;
  group.add(roof);

  // HVAC rooftop pods & Pantograph trim
  const hvacGeo = new THREE.BoxGeometry(1.45, 0.24, 1.9);
  const hvac1 = new THREE.Mesh(hvacGeo, chassisMat);
  hvac1.position.set(0, 3.18, -3.2);
  const hvac2 = new THREE.Mesh(hvacGeo, chassisMat);
  hvac2.position.set(0, 3.18, 3.0);
  const railTrim = new THREE.Mesh(
    new THREE.BoxGeometry(0.1, 0.14, 10.5),
    headlightMat
  );
  railTrim.position.set(0, 3.14, 0);
  group.add(hvac1, hvac2, railTrim);

  // Undercarriage & 4 rotating bogie wheels
  const chassis = new THREE.Mesh(
    new THREE.BoxGeometry(2.2, 0.42, 12.4),
    chassisMat
  );
  chassis.position.y = 0.45;
  group.add(chassis);

  const wheelGeo = new THREE.CylinderGeometry(0.34, 0.34, 0.2, 14);
  const wheelZPositions = [-4.6, -3.2, 3.2, 4.6];
  for (const wz of wheelZPositions) {
    const wl = new THREE.Mesh(wheelGeo, chassisMat);
    wl.rotation.z = Math.PI / 2;
    wl.position.set(-1.12, 0.34, wz);
    const wr = new THREE.Mesh(wheelGeo, chassisMat);
    wr.rotation.z = Math.PI / 2;
    wr.position.set(1.12, 0.34, wz);
    group.add(wl, wr);
    wheels.push(wl, wr);
  }

  // Front windshield + twin headlights + glow beams
  const windshield = new THREE.Mesh(
    new THREE.BoxGeometry(1.98, 0.78, 0.14),
    glassMat
  );
  windshield.position.set(0, 2.25, 6.82);
  windshield.rotation.x = -0.22;
  group.add(windshield);

  const lightGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.12, 12);
  const beamGeo = new THREE.ConeGeometry(0.55, 2.4, 12, 1, true);
  for (const sx of [-0.75, 0.75]) {
    const hl = new THREE.Mesh(lightGeo, headlightMat);
    hl.rotation.x = Math.PI / 2;
    hl.position.set(sx, 1.05, 7.15);
    const beam = new THREE.Mesh(beamGeo, beamMat);
    beam.rotation.x = -Math.PI / 2;
    beam.position.set(sx, 1.05, 8.35);
    group.add(hl, beam);
  }

  if (withRamp) {
    const rampMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: textures.hazardStripes,
      roughness: 0.55,
      metalness: 0.25,
    });
    const rampLen = 6.25;
    const ramp = new THREE.Mesh(
      new THREE.BoxGeometry(2.38, 0.2, rampLen),
      rampMat
    );
    ramp.position.set(0, 1.48, 9.25);
    ramp.rotation.x = Math.atan2(3.05, 5.5);
    ramp.receiveShadow = true;
    ramp.castShadow = true;
    group.add(ramp);
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
    roughness: 0.45,
    metalness: 0.25,
  });
  const metalMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    roughness: 0.4,
    metalness: 0.75,
  });
  const beaconMat = new THREE.MeshStandardMaterial({
    color: map.accentGlowColor,
    emissive: map.accentGlowColor,
    emissiveIntensity: 1.4,
    roughness: 0.2,
  });

  const crossbar = new THREE.Mesh(
    new THREE.BoxGeometry(2.42, 0.46, 0.24),
    stripeMat
  );
  crossbar.position.y = 0.76;
  crossbar.castShadow = true;
  group.add(crossbar);

  const postGeo = new THREE.CylinderGeometry(0.08, 0.1, 0.96, 10);
  const beaconGeo = new THREE.SphereGeometry(0.11, 10, 10);
  for (const sx of [-1.02, 1.02]) {
    const post = new THREE.Mesh(postGeo, metalMat);
    post.position.set(sx, 0.48, 0);
    const beacon = new THREE.Mesh(beaconGeo, beaconMat);
    beacon.position.set(sx, 1.04, 0);
    const base = new THREE.Mesh(
      new THREE.BoxGeometry(0.32, 0.12, 0.55),
      metalMat
    );
    base.position.set(sx, 0.06, 0);
    group.add(post, beacon, base);
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
    roughness: 0.4,
    metalness: 0.78,
  });
  const boardMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: textures.hazardStripes,
    roughness: 0.35,
    metalness: 0.25,
  });
  const glowMat = new THREE.MeshStandardMaterial({
    color: map.accentGlowColor,
    emissive: map.accentGlowColor,
    emissiveIntensity: 1.25,
    roughness: 0.25,
  });

  const postGeo = new THREE.CylinderGeometry(0.09, 0.11, 2.8, 10);
  const lPost = new THREE.Mesh(postGeo, postMat);
  lPost.position.set(-1.24, 1.4, 0);
  lPost.castShadow = true;
  const rPost = new THREE.Mesh(postGeo, postMat);
  rPost.position.set(1.24, 1.4, 0);
  rPost.castShadow = true;
  group.add(lPost, rPost);

  const signBoard = new THREE.Mesh(
    new THREE.BoxGeometry(2.65, 1.25, 0.28),
    boardMat
  );
  signBoard.position.y = 1.94;
  signBoard.castShadow = true;
  group.add(signBoard);

  const neonStrip = new THREE.Mesh(
    new THREE.BoxGeometry(2.55, 0.14, 0.34),
    glowMat
  );
  neonStrip.position.y = 1.32;
  const topStrip = neonStrip.clone();
  topStrip.position.y = 2.58;
  group.add(neonStrip, topStrip);

  return group;
}

export function buildCoinMesh(textures: GameTextureSet): THREE.Group {
  const group = new THREE.Group();
  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xfacc15,
    emissive: 0xd97706,
    emissiveIntensity: 0.55,
    roughness: 0.14,
    metalness: 0.92,
  });
  const rimMat = new THREE.MeshStandardMaterial({
    color: 0xfef08a,
    emissive: 0xf59e0b,
    emissiveIntensity: 0.65,
    roughness: 0.16,
    metalness: 0.94,
  });

  const disc = new THREE.Mesh(
    new THREE.CylinderGeometry(0.35, 0.35, 0.09, 20),
    goldMat
  );
  disc.rotation.x = Math.PI / 2;
  group.add(disc);

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.33, 0.048, 8, 22),
    rimMat
  );
  group.add(ring);

  const gem = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.13, 0),
    rimMat
  );
  gem.scale.set(1, 1, 0.5);
  group.add(gem);

  const shadowMat = new THREE.MeshBasicMaterial({
    map: textures.contactShadow,
    transparent: true,
    depthWrite: false,
    opacity: 0.35,
  });
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(0.75, 0.75), shadowMat);
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = -0.85;
  group.add(shadow);

  return group;
}

export function buildMapHorizonVista(
  map: MapTheme,
  textures: GameTextureSet
): { group: THREE.Group; animatedProps: AnimatedProp[] } {
  const group = new THREE.Group();
  const animatedProps: AnimatedProp[] = [];

  if (map.propTheme === 'subway') {
    const sun = new THREE.Mesh(
      new THREE.CircleGeometry(14, 32),
      new THREE.MeshBasicMaterial({ color: 0xfef08a, fog: false })
    );
    sun.position.set(18, 36, -125);
    group.add(sun);

    const skylineMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      emissive: 0x1e293b,
      emissiveIntensity: 0.35,
      roughness: 0.7,
    });
    for (let i = -5; i <= 5; i++) {
      if (Math.abs(i) < 2) continue;
      const h = 28 + ((Math.abs(i) * 13) % 26);
      const tower = new THREE.Mesh(new THREE.BoxGeometry(10, h, 10), skylineMat);
      tower.position.set(i * 15, h / 2 - 2, -110);
      group.add(tower);
    }
  } else if (map.propTheme === 'neon-city') {
    const moon = new THREE.Mesh(
      new THREE.CircleGeometry(15, 32),
      new THREE.MeshBasicMaterial({ color: 0xe879f9, fog: false })
    );
    moon.position.set(-16, 38, -128);
    group.add(moon);

    const halo = new THREE.Mesh(
      new THREE.TorusGeometry(20, 0.55, 8, 48),
      new THREE.MeshBasicMaterial({ color: 0x22d3ee, fog: false })
    );
    halo.position.set(0, 26, -108);
    group.add(halo);
    animatedProps.push({ obj: halo, kind: 'spinZ', speed: 0.35, phase: 0 });
  } else if (map.propTheme === 'canyon') {
    const sun = new THREE.Mesh(
      new THREE.CircleGeometry(22, 36),
      new THREE.MeshBasicMaterial({ color: 0xfde047, fog: false })
    );
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
      const ribbon = new THREE.Mesh(
        new THREE.PlaneGeometry(115, 22, 16, 1),
        auroraMat
      );
      ribbon.position.set((i - 1) * 20, 34 + i * 5, -112 - i * 6);
      ribbon.rotation.z = (i - 1) * 0.12;
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
    const volcano = new THREE.Mesh(
      new THREE.ConeGeometry(44, 46, 12, 1, true),
      new THREE.MeshStandardMaterial({ color: 0x1c1917, roughness: 0.95 })
    );
    volcano.position.set(0, 18, -122);
    const craterGlow = new THREE.Mesh(
      new THREE.CircleGeometry(15, 24),
      new THREE.MeshBasicMaterial({ color: 0xff5500, fog: false })
    );
    craterGlow.position.set(0, 41, -122);
    const lavaStreak = new THREE.Mesh(
      new THREE.ConeGeometry(7, 36, 6),
      new THREE.MeshBasicMaterial({ color: 0xff4500, fog: false })
    );
    lavaStreak.position.set(0, 18, -104);
    group.add(volcano, craterGlow, lavaStreak);
    animatedProps.push({
      obj: craterGlow,
      kind: 'pulseScale',
      speed: 2.8,
      phase: 0,
    });
  } else if (map.propTheme === 'space') {
    const planet = new THREE.Mesh(
      new THREE.SphereGeometry(22, 28, 24),
      new THREE.MeshStandardMaterial({
        map: textures.planetSurface,
        roughness: 0.6,
        emissive: 0x1d4ed8,
        emissiveIntensity: 0.3,
      })
    );
    planet.position.set(14, 30, -120);
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(27, 38, 48),
      new THREE.MeshBasicMaterial({
        color: 0x60a5fa,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.65,
        fog: false,
      })
    );
    ring.position.copy(planet.position);
    ring.rotation.set(Math.PI * 0.38, 0.2, 0.18);
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
    roughness: 0.9,
    metalness: 0.08,
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
    bumpScale: 0.055,
    roughness: map.propTheme === 'neon-city' || map.propTheme === 'arctic' ? 0.35 : 0.85,
    metalness: map.propTheme === 'neon-city' ? 0.38 : 0.14,
  });
  const trackBed = new THREE.Mesh(
    new THREE.BoxGeometry(10.8, 0.1, chunkLength),
    trackMat
  );
  trackBed.position.y = -0.05;
  trackBed.receiveShadow = true;
  chunk.add(trackBed);

  const curbMat = new THREE.MeshStandardMaterial({
    color: map.curbColor,
    roughness: 0.65,
    metalness: 0.25,
  });
  const curbGeo = new THREE.BoxGeometry(0.7, 0.24, chunkLength);
  const leftCurb = new THREE.Mesh(curbGeo, curbMat);
  leftCurb.position.set(-5.68, 0.1, 0);
  leftCurb.receiveShadow = true;
  const rightCurb = new THREE.Mesh(curbGeo, curbMat);
  rightCurb.position.set(5.68, 0.1, 0);
  rightCurb.receiveShadow = true;
  chunk.add(leftCurb, rightCurb);

  // Glowing curb trim strips
  const glowMat = new THREE.MeshStandardMaterial({
    color: map.accentGlowColor,
    emissive: map.accentGlowColor,
    emissiveIntensity: 1.15,
    roughness: 0.25,
  });
  const curbTrimGeo = new THREE.BoxGeometry(0.09, 0.06, chunkLength);
  const lTrim = new THREE.Mesh(curbTrimGeo, glowMat);
  lTrim.position.set(-5.32, 0.23, 0);
  const rTrim = new THREE.Mesh(curbTrimGeo, glowMat);
  rTrim.position.set(5.32, 0.23, 0);
  chunk.add(lTrim, rTrim);

  // 6 Steel rails
  const railMat = new THREE.MeshStandardMaterial({
    color: map.railColor,
    roughness: 0.24,
    metalness: 0.88,
  });
  const railGeo = new THREE.BoxGeometry(0.11, 0.07, chunkLength);
  for (const lane of [-1, 0, 1]) {
    const cx = lane * LANE_WIDTH;
    const rL = new THREE.Mesh(railGeo, railMat);
    rL.position.set(cx - 0.68, 0.035, 0);
    const rR = new THREE.Mesh(railGeo, railMat);
    rR.position.set(cx + 0.68, 0.035, 0);
    chunk.add(rL, rR);
  }

  // Overhead gantry arch
  const gantryMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    roughness: 0.4,
    metalness: 0.72,
  });
  const pillarGeo = new THREE.BoxGeometry(0.4, 6.8, 0.4);
  const pL = new THREE.Mesh(pillarGeo, gantryMat);
  pL.position.set(-5.7, 3.4, -chunkLength * 0.25);
  const pR = new THREE.Mesh(pillarGeo, gantryMat);
  pR.position.set(5.7, 3.4, -chunkLength * 0.25);
  const beam = new THREE.Mesh(
    new THREE.BoxGeometry(11.8, 0.36, 0.4),
    gantryMat
  );
  beam.position.set(0, 6.7, -chunkLength * 0.25);
  const lightBar = new THREE.Mesh(
    new THREE.BoxGeometry(4.6, 0.15, 0.44),
    glowMat
  );
  lightBar.position.set(0, 6.48, -chunkLength * 0.25);
  chunk.add(pL, pR, beam, lightBar);

  if (map.propTheme === 'space') {
    const warpRing = new THREE.Mesh(
      new THREE.TorusGeometry(6.2, 0.16, 8, 28, Math.PI),
      glowMat
    );
    warpRing.position.set(0, 1.0, chunkLength * 0.25);
    chunk.add(warpRing);
    animatedProps.push({
      obj: warpRing,
      kind: 'pulseScale',
      speed: 2.2,
      phase: Math.random() * 3,
    });
  }

  const wallMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: textures.urbanWall,
    roughness: 0.78,
    metalness: 0.1,
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
        const bldg = new THREE.Mesh(new THREE.BoxGeometry(6.5, h, 11.5), wallMat);
        bldg.position.set(baseX, h / 2 - 0.05, zOff);
        bldg.receiveShadow = true;
        chunk.add(bldg);

        // Roof cornice
        const roofCap = new THREE.Mesh(
          new THREE.BoxGeometry(6.9, 0.45, 11.9),
          gantryMat
        );
        roofCap.position.set(baseX, h + 0.15, zOff);
        chunk.add(roofCap);
      }
      // Animated railway semaphore beacon
      const sigPole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.1, 0.12, 4.2, 8),
        gantryMat
      );
      sigPole.position.set(side * 6.2, 2.1, 4);
      const sigBulb = new THREE.Mesh(
        new THREE.SphereGeometry(0.26, 12, 12),
        new THREE.MeshStandardMaterial({
          color: 0x22c55e,
          emissive: 0x22c55e,
          emissiveIntensity: 1.4,
        })
      );
      sigBulb.position.set(side * 6.2, 4.35, 4);
      chunk.add(sigPole, sigBulb);
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
        const bldg = new THREE.Mesh(
          new THREE.BoxGeometry(6.6, h, 11.5),
          windowMat
        );
        bldg.position.set(baseX, h / 2 - 0.05, zOff);
        chunk.add(bldg);

        // Floating animated holographic diamond sign
        const holoMat = new THREE.MeshStandardMaterial({
          color: i % 2 === 0 ? 0x00f5d4 : 0xf472b6,
          emissive: i % 2 === 0 ? 0x00f5d4 : 0xf472b6,
          emissiveIntensity: 1.6,
        });
        const holo = new THREE.Mesh(new THREE.OctahedronGeometry(0.75, 0), holoMat);
        holo.position.set(side * 6.8, 4.2 + i * 1.4, zOff);
        // Vertical neon kanji-style light blade
        const neonBar = new THREE.Mesh(
          new THREE.BoxGeometry(0.32, 7.2, 0.32),
          holoMat
        );
        neonBar.position.set(side * 6.9, 5.5, zOff + 3.2);
        chunk.add(holo, neonBar);
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
        roughness: 0.9,
      });
      const mesa = new THREE.Mesh(
        new THREE.CylinderGeometry(3.2, 5.4, 12.5, 7),
        rockMat
      );
      mesa.position.set(baseX + side * 2, 6.0, side * 4);
      chunk.add(mesa);

      // Animated Wind Turbine on ridge!
      const mast = new THREE.Mesh(
        new THREE.CylinderGeometry(0.14, 0.24, 9.5, 8),
        new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.4 })
      );
      mast.position.set(side * 8.2, 4.75, -side * 6);
      const rotor = new THREE.Group();
      rotor.position.set(side * 8.2, 9.4, -side * 5.7);
      const bladeGeo = new THREE.BoxGeometry(0.24, 3.2, 0.06);
      for (let b = 0; b < 3; b++) {
        const bladePivot = new THREE.Group();
        bladePivot.rotation.z = (b * Math.PI * 2) / 3;
        const blade = new THREE.Mesh(bladeGeo, mast.material);
        blade.position.y = 1.5;
        bladePivot.add(blade);
        rotor.add(bladePivot);
      }
      chunk.add(mast, rotor);
      animatedProps.push({
        obj: rotor,
        kind: 'spinZ',
        speed: 3.4,
        phase: side,
      });

      // Saguaro Cactus
      const cactusMat = new THREE.MeshStandardMaterial({
        color: 0x15803d,
        roughness: 0.75,
      });
      const trunk = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.26, 2.6, 6, 8),
        cactusMat
      );
      trunk.position.set(side * 6.8, 1.5, side * 6);
      const arm = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.16, 1.0, 4, 8),
        cactusMat
      );
      arm.position.set(side * 6.8 + side * 0.42, 1.9, side * 6);
      arm.rotation.z = side * 0.5;
      chunk.add(trunk, arm);
    } else if (map.propTheme === 'arctic') {
      const iceMat = new THREE.MeshStandardMaterial({
        color: 0xbae6fd,
        emissive: 0x0284c7,
        emissiveIntensity: 0.18,
        roughness: 0.16,
        metalness: 0.35,
      });
      const spire = new THREE.Mesh(new THREE.ConeGeometry(3.4, 13.5, 6), iceMat);
      spire.position.set(baseX + side * 1.5, 6.4, side * 3);
      chunk.add(spire);

      // Floating rotating crystal
      const crystal = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.85, 0),
        new THREE.MeshStandardMaterial({
          color: 0x67e8f9,
          emissive: 0x06b6d4,
          emissiveIntensity: 0.75,
          roughness: 0.15,
        })
      );
      crystal.position.set(side * 6.8, 3.2, -side * 4);
      chunk.add(crystal);
      animatedProps.push({
        obj: crystal,
        kind: 'spinY',
        speed: 1.8,
        phase: side,
      });
      animatedProps.push({
        obj: crystal,
        kind: 'bobY',
        speed: 2.2,
        baseY: 3.2,
        phase: side,
      });

      // Multi-tiered Snow Pine with snow cap
      const pineMat = new THREE.MeshStandardMaterial({
        color: 0x0f766e,
        roughness: 0.8,
      });
      const snowCapMat = new THREE.MeshStandardMaterial({
        color: 0xf8fafc,
        roughness: 0.65,
      });
      const tier1 = new THREE.Mesh(new THREE.ConeGeometry(1.5, 2.8, 7), pineMat);
      tier1.position.set(side * 7.2, 1.5, side * 6);
      const tier2 = new THREE.Mesh(new THREE.ConeGeometry(1.1, 2.4, 7), pineMat);
      tier2.position.set(side * 7.2, 3.0, side * 6);
      const snowCap = new THREE.Mesh(
        new THREE.ConeGeometry(0.68, 1.25, 7),
        snowCapMat
      );
      snowCap.position.set(side * 7.2, 3.8, side * 6);
      chunk.add(tier1, tier2, snowCap);
    } else if (map.propTheme === 'volcano') {
      const lavaMat = new THREE.MeshStandardMaterial({
        color: 0xff4500,
        emissive: 0xff3300,
        emissiveIntensity: 1.7,
        roughness: 0.3,
      });
      const lavaRiver = new THREE.Mesh(
        new THREE.PlaneGeometry(4.4, chunkLength),
        lavaMat
      );
      lavaRiver.rotation.x = -Math.PI / 2;
      lavaRiver.position.set(side * 8.2, -0.02, 0);
      chunk.add(lavaRiver);

      const basaltMat = new THREE.MeshStandardMaterial({
        color: 0x292524,
        roughness: 0.9,
      });
      const crag = new THREE.Mesh(
        new THREE.ConeGeometry(3.8, 13.5, 5),
        basaltMat
      );
      crag.position.set(baseX + side * 3.2, 6.2, side * 4);
      chunk.add(crag);

      // Oscillating glowing magma crystal / forge core
      const emberCore = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.8, 0),
        lavaMat
      );
      emberCore.position.set(side * 7.0, 2.8, -side * 5);
      chunk.add(emberCore);
      animatedProps.push({
        obj: emberCore,
        kind: 'bobY',
        speed: 2.6,
        baseY: 2.8,
        phase: side,
      });
      animatedProps.push({
        obj: emberCore,
        kind: 'spinY',
        speed: 2.1,
        phase: side,
      });
    } else if (map.propTheme === 'space') {
      const solarMat = new THREE.MeshStandardMaterial({
        color: 0x1d4ed8,
        emissive: 0x1e40af,
        emissiveIntensity: 0.45,
        roughness: 0.18,
        metalness: 0.88,
      });
      const deckStrip = new THREE.Mesh(
        new THREE.BoxGeometry(0.18, 0.08, chunkLength),
        glowMat
      );
      deckStrip.position.set(side * 8.2, 0.01, 0);
      const mast = new THREE.Mesh(
        new THREE.CylinderGeometry(0.25, 0.35, 8.5, 8),
        gantryMat
      );
      mast.position.set(baseX, 4.25, 0);
      const panelPivot = new THREE.Group();
      panelPivot.position.set(baseX, 6.6, 0);
      const panel = new THREE.Mesh(
        new THREE.BoxGeometry(0.16, 3.8, 8.8),
        solarMat
      );
      panelPivot.add(panel);
      const sat = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.95, 0),
        glowMat
      );
      sat.position.set(side * 7.2, 3.5, side * 6);
      chunk.add(deckStrip, mast, panelPivot, sat);
      animatedProps.push({
        obj: panelPivot,
        kind: 'swingZ',
        speed: 1.4,
        phase: side * 1.2,
      });
      animatedProps.push({
        obj: sat,
        kind: 'spinY',
        speed: 1.9,
        phase: side,
      });
    }
  }

  return { group: chunk, animatedProps };
}
