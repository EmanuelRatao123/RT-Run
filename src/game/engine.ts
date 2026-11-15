import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { getMapById, getSkinById, MapTheme, RunnerSkin } from './catalog';
import {
  clampLane,
  computeSpeedForDistance,
  createNoCoinState,
  evaluatePlayerObstacle,
  FAST_FALL_VELOCITY,
  GRAVITY,
  JUMP_VELOCITY,
  LaneIndex,
  laneToX,
  lockNoCoinOnCoinPickup,
  NoCoinState,
  ObstacleColliderSpec,
  tickNoCoin,
} from './rules';
import {
  createSkyGradientTexture,
  GameTextureSet,
  loadGameTextures,
} from './textures';
import {
  AnimatedProp,
  buildCoinMesh,
  buildHighSignModel,
  buildLowBarrierModel,
  buildMapHorizonVista,
  buildRunnerRig,
  buildSceneryChunk,
  buildTrainModel,
  RunnerRig,
} from './models';
import { soundEngine } from './audio';

export type GamePhase = 'title' | 'playing' | 'paused' | 'gameover';

export interface HudSnapshot {
  score: number;
  distance: number;
  coins: number;
  speed: number;
  noCoinMs: number;
  noCoinActive: boolean;
}

export interface RunSummary {
  score: number;
  distance: number;
  coins: number;
  noCoinMs: number;
  durationMs: number;
  skinId: string;
  mapId: string;
}

export interface EngineCallbacks {
  onPhaseChange: (phase: GamePhase) => void;
  onHudTick: (snap: HudSnapshot) => void;
  onCoinLock: (lockedAtMs: number) => void;
  onGameOver: (summary: RunSummary) => void;
}

interface ActiveObstacle {
  mesh: THREE.Group;
  wheels: THREE.Object3D[];
  spec: ObstacleColliderSpec;
  speedZ: number;
}

interface ActiveCoin {
  mesh: THREE.Group;
  x: number;
  baseY: number;
  z: number;
  phase: number;
  collected: boolean;
}

interface ParticleSlot {
  active: boolean;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  maxLife: number;
  scale: number;
  color: THREE.Color;
}

interface AmbientMote {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  scale: number;
}

const CHUNK_LENGTH = 30;
const CHUNK_COUNT = 6;
const PARTICLE_COUNT = 80;
const AMBIENT_COUNT = 96;

// Pre-allocated scratch math helpers (Zero GC inside render loop)
const _mat4 = new THREE.Matrix4();
const _vec3 = new THREE.Vector3();
const _quat = new THREE.Quaternion();
const _scale = new THREE.Vector3();
const _camTarget = new THREE.Vector3();
const _lookTarget = new THREE.Vector3();

function detectSoftwareWebGL(): boolean {
  const gl = document.createElement('canvas').getContext('webgl2');
  if (!gl) return true;
  const ext = gl.getExtension('WEBGL_debug_renderer_info');
  const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
  const gpu = String(gl.getParameter(param));
  gl.getExtension('WEBGL_lose_context')?.loseContext();
  return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
}

export class RTRunEngine {
  private container: HTMLElement;
  private callbacksRef: { current: EngineCallbacks };
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private isSoftwareGl: boolean;
  private textures: GameTextureSet;

  private keyLight: THREE.DirectionalLight;
  private hemiLight: THREE.HemisphereLight;
  private skyTex: THREE.CanvasTexture | null = null;

  private currentSkin: RunnerSkin;
  private currentMap: MapTheme;
  private runnerRig: RunnerRig;

  private worldGroup = new THREE.Group();
  private horizonGroup: THREE.Group | null = null;
  private chunks: THREE.Group[] = [];
  private animatedProps: AnimatedProp[] = [];
  private obstacles: ActiveObstacle[] = [];
  private coins: ActiveCoin[] = [];
  private nextSpawnZ = -34;

  // Pooled burst particles
  private particleMesh: THREE.InstancedMesh;
  private particles: ParticleSlot[] = [];
  private particleCursor = 0;

  // Ambient weather/atmosphere particles per map (snow, embers, neon rain, stars)
  private ambientMesh: THREE.InstancedMesh;
  private ambientMat: THREE.MeshBasicMaterial;
  private ambientMotes: AmbientMote[] = [];

  // Gameplay state
  private phase: GamePhase = 'title';
  private lane: LaneIndex = 0;
  private playerX = 0;
  private playerY = 0;
  private velocityY = 0;
  private isGrounded = true;
  private coyoteTimer = 0;
  private jumpBufferTimer = 0;
  private slideTimer = 0;
  private squashX = 1;
  private squashY = 1;

  private distance = 0;
  private score = 0;
  private coinCount = 0;
  private runDurationMs = 0;
  private noCoinState: NoCoinState = createNoCoinState();
  private trauma = 0;
  private hitstopTimer = 0;
  private crashDelayTimer = 0;
  private pendingCrashSummary: RunSummary | null = null;
  private stridePhase = 0;
  private elapsedTime = 0;

  private frameId = 0;
  private lastTimeMs = 0;
  private destroyed = false;
  private resizeObserver: ResizeObserver;

  constructor(
    container: HTMLElement,
    initialSkinId: string,
    initialMapId: string,
    callbacksRef: { current: EngineCallbacks }
  ) {
    this.container = container;
    this.callbacksRef = callbacksRef;
    this.currentSkin = getSkinById(initialSkinId);
    this.currentMap = getMapById(initialMapId);
    this.isSoftwareGl = detectSoftwareWebGL();

    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: this.isSoftwareGl,
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.setPixelRatio(
      this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2)
    );
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.setSize(
      container.clientWidth || window.innerWidth,
      container.clientHeight || window.innerHeight
    );
    container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();

    const w = container.clientWidth || window.innerWidth;
    const h = container.clientHeight || window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(62, w / h, 0.1, 200);
    this.camera.position.set(0, 4.4, 7.6);
    this.camera.lookAt(0, 1.5, -14);

    this.hemiLight = new THREE.HemisphereLight(
      this.currentMap.hemiSkyColor,
      this.currentMap.hemiGroundColor,
      this.currentMap.hemiIntensity
    );
    this.scene.add(this.hemiLight);

    this.keyLight = new THREE.DirectionalLight(
      this.currentMap.keyLightColor,
      this.currentMap.keyLightIntensity
    );
    this.keyLight.position.set(12, 22, 10);
    this.keyLight.castShadow = !this.isSoftwareGl;
    this.keyLight.shadow.mapSize.set(1024, 1024);
    this.keyLight.shadow.camera.near = 2;
    this.keyLight.shadow.camera.far = 75;
    this.keyLight.shadow.camera.left = -16;
    this.keyLight.shadow.camera.right = 16;
    this.keyLight.shadow.camera.top = 24;
    this.keyLight.shadow.camera.bottom = -16;
    this.keyLight.shadow.bias = -0.0005;
    this.keyLight.shadow.normalBias = 0.02;
    this.scene.add(this.keyLight);

    this.textures = loadGameTextures(this.renderer);

    this.scene.add(this.worldGroup);
    this.runnerRig = buildRunnerRig(this.currentSkin, this.textures);
    this.scene.add(this.runnerRig.root);

    // Burst particle pool
    const pGeo = new THREE.BoxGeometry(0.16, 0.16, 0.16);
    const pMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    this.particleMesh = new THREE.InstancedMesh(pGeo, pMat, PARTICLE_COUNT);
    this.particleMesh.frustumCulled = false;
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      this.particles.push({
        active: false,
        x: 0,
        y: -100,
        z: 0,
        vx: 0,
        vy: 0,
        vz: 0,
        life: 0,
        maxLife: 1,
        scale: 0,
        color: new THREE.Color(0xfacc15),
      });
      _mat4.makeScale(0, 0, 0);
      this.particleMesh.setMatrixAt(i, _mat4);
      this.particleMesh.setColorAt(i, this.particles[i].color);
    }
    this.particleMesh.instanceMatrix.needsUpdate = true;
    this.scene.add(this.particleMesh);

    // Ambient atmosphere motes pool
    const aGeo = new THREE.OctahedronGeometry(0.12, 0);
    this.ambientMat = new THREE.MeshBasicMaterial({
      color: this.currentMap.particleColor,
      transparent: true,
      opacity: 0.85,
    });
    this.ambientMesh = new THREE.InstancedMesh(
      aGeo,
      this.ambientMat,
      AMBIENT_COUNT
    );
    this.ambientMesh.frustumCulled = false;
    for (let i = 0; i < AMBIENT_COUNT; i++) {
      this.ambientMotes.push({
        x: (Math.random() - 0.5) * 32,
        y: Math.random() * 14,
        z: -Math.random() * 75 + 8,
        vx: (Math.random() - 0.5) * 1.2,
        vy: 0,
        vz: 0,
        scale: 0.4 + Math.random() * 1.1,
      });
    }
    this.scene.add(this.ambientMesh);

    this.applyMapEnvironment();
    this.rebuildTrackChunks();

    if (!this.isSoftwareGl) {
      this.renderer.compile(this.scene, this.camera);
    }

    this.resizeObserver = new ResizeObserver(() => this.handleResize());
    this.resizeObserver.observe(container);
    window.addEventListener('resize', this.handleResize);

    this.lastTimeMs = performance.now();
    this.tick();
  }

  private handleResize = () => {
    if (this.destroyed) return;
    const w = this.container.clientWidth || window.innerWidth;
    const h = this.container.clientHeight || window.innerHeight;
    if (w <= 0 || h <= 0) return;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
    this.renderer.render(this.scene, this.camera);
  };

  private applyMapEnvironment() {
    if (this.skyTex) this.skyTex.dispose();
    this.skyTex = createSkyGradientTexture(
      this.currentMap.skyTopHex,
      this.currentMap.skyBottomHex
    );
    this.scene.background = this.skyTex;
    this.scene.fog = new THREE.FogExp2(
      this.currentMap.fogColor,
      this.currentMap.fogDensity
    );
    this.hemiLight.color.setHex(this.currentMap.hemiSkyColor);
    this.hemiLight.groundColor.setHex(this.currentMap.hemiGroundColor);
    this.hemiLight.intensity = this.currentMap.hemiIntensity;
    this.keyLight.color.setHex(this.currentMap.keyLightColor);
    this.keyLight.intensity = this.currentMap.keyLightIntensity;
    this.ambientMat.color.setHex(this.currentMap.particleColor);
  }

  private rebuildTrackChunks() {
    for (const c of this.chunks) {
      this.worldGroup.remove(c);
    }
    this.chunks = [];
    this.animatedProps = [];

    if (this.horizonGroup) {
      this.scene.remove(this.horizonGroup);
    }
    const vista = buildMapHorizonVista(this.currentMap, this.textures);
    this.horizonGroup = vista.group;
    this.scene.add(this.horizonGroup);
    this.animatedProps.push(...vista.animatedProps);

    for (let i = 0; i < CHUNK_COUNT; i++) {
      const built = buildSceneryChunk(
        this.currentMap,
        this.textures,
        CHUNK_LENGTH
      );
      built.group.position.z = 15 - i * CHUNK_LENGTH;
      this.worldGroup.add(built.group);
      this.chunks.push(built.group);
      this.animatedProps.push(...built.animatedProps);
    }
  }

  private clearDynamicEntities() {
    for (const obs of this.obstacles) {
      this.worldGroup.remove(obs.mesh);
    }
    this.obstacles = [];
    for (const c of this.coins) {
      this.worldGroup.remove(c.mesh);
    }
    this.coins = [];
  }

  public setSkin(skinId: string) {
    const next = getSkinById(skinId);
    if (next.id === this.currentSkin.id) return;
    this.currentSkin = next;
    const oldPos = this.runnerRig.root.position.clone();
    this.scene.remove(this.runnerRig.root);
    this.runnerRig = buildRunnerRig(this.currentSkin, this.textures);
    this.runnerRig.root.position.copy(oldPos);
    this.scene.add(this.runnerRig.root);
  }

  public setMap(mapId: string) {
    const next = getMapById(mapId);
    if (next.id === this.currentMap.id) return;
    this.currentMap = next;
    this.applyMapEnvironment();
    this.rebuildTrackChunks();
  }

  public startRun() {
    this.clearDynamicEntities();
    this.lane = 0;
    this.playerX = 0;
    this.playerY = 0;
    this.velocityY = 0;
    this.isGrounded = true;
    this.coyoteTimer = 0;
    this.jumpBufferTimer = 0;
    this.slideTimer = 0;
    this.squashX = 1;
    this.squashY = 1;

    this.distance = 0;
    this.score = 0;
    this.coinCount = 0;
    this.runDurationMs = 0;
    this.noCoinState = createNoCoinState();
    this.trauma = 0;
    this.hitstopTimer = 0;
    this.crashDelayTimer = 0;
    this.pendingCrashSummary = null;
    this.nextSpawnZ = -34;

    this.runnerRig.root.position.set(0, 0, 0);
    this.runnerRig.bodyPivot.rotation.set(0, 0, 0);
    this.runnerRig.bodyPivot.scale.set(1, 1, 1);

    for (let i = 0; i < 4; i++) {
      this.spawnWave();
    }

    this.phase = 'playing';
    document.body.dataset.state = 'playing';
    this.callbacksRef.current.onPhaseChange('playing');
    this.emitHud();
    soundEngine.playStart();
  }

  public pauseRun() {
    if (this.phase !== 'playing') return;
    this.phase = 'paused';
    document.body.dataset.state = 'paused';
    this.callbacksRef.current.onPhaseChange('paused');
  }

  public resumeRun() {
    if (this.phase !== 'paused') return;
    this.phase = 'playing';
    this.lastTimeMs = performance.now();
    document.body.dataset.state = 'playing';
    this.callbacksRef.current.onPhaseChange('playing');
  }

  public returnToTitle() {
    this.clearDynamicEntities();
    this.phase = 'title';
    this.lane = 0;
    this.playerX = 0;
    this.playerY = 0;
    this.velocityY = 0;
    this.slideTimer = 0;
    this.runnerRig.root.position.set(0, 0, 0);
    this.runnerRig.bodyPivot.rotation.set(0, 0, 0);
    this.runnerRig.bodyPivot.scale.set(1, 1, 1);
    document.body.dataset.state = 'title';
    this.callbacksRef.current.onPhaseChange('title');
  }

  public moveLane(delta: -1 | 1) {
    if (this.phase !== 'playing' || this.crashDelayTimer > 0) return;
    const next = clampLane(this.lane + delta);
    if (next !== this.lane) {
      this.lane = next;
      soundEngine.playLaneSwitch();
      this.spawnParticles(this.playerX, this.playerY + 0.3, 0, 4, 0x94a3b8);
    }
  }

  public jump() {
    if (this.phase !== 'playing' || this.crashDelayTimer > 0) return;
    this.jumpBufferTimer = 0.13;
  }

  public slide() {
    if (this.phase !== 'playing' || this.crashDelayTimer > 0) return;
    if (!this.isGrounded) {
      this.velocityY = Math.min(this.velocityY, FAST_FALL_VELOCITY);
    }
    this.slideTimer = 0.68;
    this.squashX = 1.24;
    this.squashY = 0.72;
    soundEngine.playSlide();
  }

  private spawnParticles(
    x: number,
    y: number,
    z: number,
    count: number,
    hexColor: number
  ) {
    for (let i = 0; i < count; i++) {
      const slot = this.particles[this.particleCursor];
      this.particleCursor = (this.particleCursor + 1) % PARTICLE_COUNT;
      slot.active = true;
      slot.x = x + (Math.random() - 0.5) * 0.4;
      slot.y = y + Math.random() * 0.3;
      slot.z = z + (Math.random() - 0.5) * 0.4;
      slot.vx = (Math.random() - 0.5) * 6;
      slot.vy = 2 + Math.random() * 5.5;
      slot.vz = (Math.random() - 0.5) * 6;
      slot.life = 0;
      slot.maxLife = 0.32 + Math.random() * 0.25;
      slot.scale = 0.7 + Math.random() * 0.7;
      slot.color.setHex(hexColor);
      this.particleMesh.setColorAt(
        (this.particleCursor - 1 + PARTICLE_COUNT) % PARTICLE_COUNT,
        slot.color
      );
    }
    if (this.particleMesh.instanceColor) {
      this.particleMesh.instanceColor.needsUpdate = true;
    }
  }

  private spawnWave() {
    const zBase = this.nextSpawnZ;
    const lanes: LaneIndex[] = [-1, 0, 1];
    const openLane = lanes[Math.floor(Math.random() * lanes.length)];
    const difficulty = Math.min(1, this.distance / 1100);

    for (const l of lanes) {
      const x = laneToX(l);
      if (l === openLane) {
        const roll = Math.random();
        if (roll < 0.52) {
          this.spawnCoinLine(x, zBase, 4, 2.2, 0.9);
        } else if (roll < 0.78) {
          this.spawnLowBarrier(x, zBase);
          this.spawnCoinArc(x, zBase, 0.9);
        } else {
          this.spawnHighSign(x, zBase);
          this.spawnCoinLine(x, zBase - 1, 3, 2.2, 0.7);
        }
        continue;
      }

      const roll = Math.random();
      if (roll < 0.44 + difficulty * 0.22) {
        const hasRamp = Math.random() < 0.35;
        this.spawnTrain(x, zBase, hasRamp);
        if (hasRamp || Math.random() < 0.5) {
          this.spawnCoinLine(x, zBase - 1.5, 4, 2.4, 3.85);
        }
      } else if (roll < 0.72) {
        this.spawnLowBarrier(x, zBase);
      } else if (roll < 0.9) {
        this.spawnHighSign(x, zBase);
      } else {
        this.spawnCoinLine(x, zBase, 3, 2.2, 0.9);
      }
    }

    const gap = 25 + Math.random() * 8;
    this.nextSpawnZ -= gap;
  }

  private spawnTrain(x: number, z: number, withRamp: boolean) {
    const built = buildTrainModel(this.currentMap, this.textures, withRamp);
    built.group.position.set(x, 0, z);
    this.worldGroup.add(built.group);

    const moving = !withRamp && Math.random() < 0.38;
    this.obstacles.push({
      mesh: built.group,
      wheels: built.wheels,
      speedZ: moving ? 9.5 : 0,
      spec: {
        kind: withRamp ? 'ramp-train' : 'train',
        x,
        z,
        length: 12.8,
        width: 2.38,
        minY: 0,
        maxY: 3.12,
        rampStartZ: withRamp ? z + 12.0 : undefined,
        rampEndZ: withRamp ? z + 6.5 : undefined,
        roofY: withRamp ? 3.12 : undefined,
      },
    });
  }

  private spawnLowBarrier(x: number, z: number) {
    const mesh = buildLowBarrierModel(this.currentMap, this.textures);
    mesh.position.set(x, 0, z);
    this.worldGroup.add(mesh);
    this.obstacles.push({
      mesh,
      wheels: [],
      speedZ: 0,
      spec: {
        kind: 'low-barrier',
        x,
        z,
        length: 0.55,
        width: 2.2,
        minY: 0,
        maxY: 1.02,
      },
    });
  }

  private spawnHighSign(x: number, z: number) {
    const mesh = buildHighSignModel(this.currentMap, this.textures);
    mesh.position.set(x, 0, z);
    this.worldGroup.add(mesh);
    this.obstacles.push({
      mesh,
      wheels: [],
      speedZ: 0,
      spec: {
        kind: 'high-sign',
        x,
        z,
        length: 0.5,
        width: 2.35,
        minY: 1.18,
        maxY: 2.75,
      },
    });
  }

  private spawnCoinLine(
    x: number,
    startZ: number,
    count: number,
    spacing: number,
    y: number
  ) {
    for (let i = 0; i < count; i++) {
      const z = startZ - i * spacing;
      const mesh = buildCoinMesh(this.textures);
      mesh.position.set(x, y, z);
      this.worldGroup.add(mesh);
      this.coins.push({
        mesh,
        x,
        baseY: y,
        z,
        phase: i * 0.6,
        collected: false,
      });
    }
  }

  private spawnCoinArc(x: number, centerZ: number, baseY: number) {
    const offsets = [-2.0, 0, 2.0];
    for (let i = 0; i < offsets.length; i++) {
      const y = baseY + (i === 1 ? 1.35 : 0.65);
      const z = centerZ + offsets[i];
      const mesh = buildCoinMesh(this.textures);
      mesh.position.set(x, y, z);
      this.worldGroup.add(mesh);
      this.coins.push({
        mesh,
        x,
        baseY: y,
        z,
        phase: i * 0.7,
        collected: false,
      });
    }
  }

  private emitHud() {
    this.callbacksRef.current.onHudTick({
      score: Math.round(this.score),
      distance: Math.round(this.distance),
      coins: this.coinCount,
      speed: Math.round(computeSpeedForDistance(this.distance)),
      noCoinMs: this.noCoinState.elapsedMs,
      noCoinActive: this.noCoinState.active,
    });
  }

  private tick = () => {
    if (this.destroyed) return;
    const now = performance.now();
    const rawDt = (now - this.lastTimeMs) / 1000;
    this.lastTimeMs = now;
    const dt = Math.min(Math.max(rawDt, 0.001), 0.05);
    this.elapsedTime += dt;

    this.updateParticles(dt);
    this.updateAmbientMotes(dt);
    this.updateAnimatedEnvironmentProps(dt);

    if (this.phase === 'title') {
      this.updateTitleShowcase(dt);
    } else if (this.phase === 'playing') {
      this.updatePlaying(dt);
    } else {
      this.trauma = Math.max(0, this.trauma - dt * 1.8);
    }

    this.renderer.render(this.scene, this.camera);

    if (this.isSoftwareGl) {
      this.afterDraw(this.tick);
    } else {
      this.frameId = requestAnimationFrame(this.tick);
    }
  };

  private afterDraw(cb: () => void) {
    const gl = this.renderer.getContext() as WebGL2RenderingContext;
    if (typeof gl.fenceSync === 'function') {
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (this.destroyed) {
          if (sync) gl.deleteSync(sync);
          return;
        }
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          this.frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          this.frameId = window.setTimeout(cb, 80);
        }
      };
      this.frameId = window.setTimeout(poll, 5);
    } else {
      this.frameId = window.setTimeout(cb, 80);
    }
  }

  private updateAnimatedEnvironmentProps(dt: number) {
    const t = this.elapsedTime;
    for (const prop of this.animatedProps) {
      if (prop.kind === 'spinY') {
        prop.obj.rotation.y += prop.speed * dt;
      } else if (prop.kind === 'spinZ') {
        prop.obj.rotation.z += prop.speed * dt;
      } else if (prop.kind === 'bobY' && prop.baseY !== undefined) {
        prop.obj.position.y =
          prop.baseY + Math.sin(t * prop.speed + prop.phase) * 0.45;
      } else if (prop.kind === 'pulseScale') {
        const s = 1 + Math.sin(t * prop.speed + prop.phase) * 0.14;
        prop.obj.scale.setScalar(s);
      } else if (prop.kind === 'swingZ') {
        prop.obj.rotation.z =
          Math.sin(t * prop.speed + prop.phase) * 0.45;
      }
    }
  }

  private updateAmbientMotes(dt: number) {
    const theme = this.currentMap.propTheme;
    const forward = this.phase === 'playing' ? computeSpeedForDistance(this.distance) * 0.65 : 7.5;

    for (let i = 0; i < AMBIENT_COUNT; i++) {
      const m = this.ambientMotes[i];
      if (theme === 'volcano') {
        m.y += (2.5 + m.scale * 1.4) * dt;
        m.x += Math.sin(this.elapsedTime * 2 + i) * 0.8 * dt;
        m.z += forward * dt;
        if (m.y > 14 || m.z > 12) {
          m.y = 0.2;
          m.x = (Math.random() - 0.5) * 28;
          m.z = -Math.random() * 70;
        }
      } else if (theme === 'arctic' || theme === 'neon-city') {
        const fallSpeed = theme === 'neon-city' ? 14 : 3.2;
        m.y -= fallSpeed * dt;
        m.x += Math.sin(this.elapsedTime * 1.5 + i) * 0.5 * dt;
        m.z += forward * dt;
        if (m.y < 0 || m.z > 12) {
          m.y = 14;
          m.x = (Math.random() - 0.5) * 32;
          m.z = -Math.random() * 70;
        }
      } else {
        m.z += (forward * 0.55) * dt;
        m.y += Math.sin(this.elapsedTime + i) * 0.35 * dt;
        if (m.z > 12) {
          m.z = -70 - Math.random() * 15;
          m.x = (Math.random() - 0.5) * 44;
          m.y = 1 + Math.random() * 14;
        }
      }

      _vec3.set(m.x, m.y, m.z);
      if (theme === 'neon-city') {
        _scale.set(m.scale * 0.35, m.scale * 2.2, m.scale * 0.35);
      } else {
        _scale.setScalar(m.scale);
      }
      _mat4.compose(_vec3, _quat, _scale);
      this.ambientMesh.setMatrixAt(i, _mat4);
    }
    this.ambientMesh.instanceMatrix.needsUpdate = true;
  }

  private updateTitleShowcase(dt: number) {
    const jogSpeed = 11;
    this.stridePhase += dt * jogSpeed;
    this.animateRunnerPose(dt, false);

    for (const chunk of this.chunks) {
      chunk.position.z += dt * 7.5;
      if (chunk.position.z > 25) {
        chunk.position.z -= CHUNK_COUNT * CHUNK_LENGTH;
      }
    }

    const angle = Math.sin(this.elapsedTime * 0.45) * 0.45;
    _camTarget.set(Math.sin(angle) * 3.8, 2.55, 5.1);
    const k = 1 - Math.exp(-4 * dt);
    this.camera.position.lerp(_camTarget, k);
    _lookTarget.set(0, 1.35, -3.5);
    this.camera.lookAt(_lookTarget);
  }

  private updatePlaying(dt: number) {
    if (this.crashDelayTimer > 0) {
      this.crashDelayTimer -= dt;
      this.trauma = Math.max(0, this.trauma - dt * 1.4);
      this.runnerRig.bodyPivot.rotation.x = THREE.MathUtils.damp(
        this.runnerRig.bodyPivot.rotation.x,
        -1.35,
        10,
        dt
      );
      this.applyGameplayCamera(dt, computeSpeedForDistance(this.distance));
      if (this.crashDelayTimer <= 0 && this.pendingCrashSummary) {
        const summary = this.pendingCrashSummary;
        this.pendingCrashSummary = null;
        this.phase = 'gameover';
        document.body.dataset.state = 'gameover';
        this.callbacksRef.current.onPhaseChange('gameover');
        this.callbacksRef.current.onGameOver(summary);
      }
      return;
    }

    if (this.hitstopTimer > 0) {
      this.hitstopTimer -= dt;
      this.applyGameplayCamera(dt, computeSpeedForDistance(this.distance));
      return;
    }

    const speed = computeSpeedForDistance(this.distance);
    const forwardStep = speed * dt;
    this.distance += forwardStep;
    this.score += forwardStep * 12;
    this.runDurationMs += dt * 1000;
    this.noCoinState = tickNoCoin(this.noCoinState, dt * 1000);

    const targetX = laneToX(this.lane);
    const prevX = this.playerX;
    this.playerX = THREE.MathUtils.damp(this.playerX, targetX, 16, dt);
    const leanZ = THREE.MathUtils.clamp((prevX - this.playerX) * 0.65, -0.35, 0.35);

    if (this.isGrounded) this.coyoteTimer = 0.085;
    else this.coyoteTimer = Math.max(0, this.coyoteTimer - dt);

    if (this.jumpBufferTimer > 0) {
      this.jumpBufferTimer -= dt;
      if (this.coyoteTimer > 0) {
        this.velocityY = JUMP_VELOCITY;
        this.isGrounded = false;
        this.coyoteTimer = 0;
        this.jumpBufferTimer = 0;
        this.slideTimer = 0;
        this.squashX = 0.84;
        this.squashY = 1.22;
        soundEngine.playJump();
        this.spawnParticles(this.playerX, this.playerY + 0.1, 0, 5, 0xe2e8f0);
      }
    }

    if (this.slideTimer > 0) {
      this.slideTimer = Math.max(0, this.slideTimer - dt);
    }

    for (const chunk of this.chunks) {
      chunk.position.z += forwardStep;
      if (chunk.position.z > 25) {
        chunk.position.z -= CHUNK_COUNT * CHUNK_LENGTH;
      }
    }

    this.nextSpawnZ += forwardStep;
    while (this.nextSpawnZ > -145) {
      this.spawnWave();
    }

    let supportFloorY = 0;
    let crashed = false;
    const isSliding = this.slideTimer > 0;

    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obs = this.obstacles[i];
      const dz = (speed + obs.speedZ) * dt;
      obs.spec.z += dz;
      if (obs.spec.rampStartZ !== undefined) obs.spec.rampStartZ += dz;
      if (obs.spec.rampEndZ !== undefined) obs.spec.rampEndZ += dz;
      obs.mesh.position.z = obs.spec.z;

      if (obs.wheels.length > 0 && obs.speedZ > 0) {
        for (const w of obs.wheels) {
          w.rotation.x += obs.speedZ * dt * 2.2;
        }
      }

      if (obs.spec.z > -16 && obs.spec.z < 16) {
        const res = evaluatePlayerObstacle(
          this.playerX,
          this.playerY,
          0,
          isSliding,
          obs.spec
        );
        if (res.floorSupportY !== null) {
          supportFloorY = Math.max(supportFloorY, res.floorSupportY);
        }
        if (res.crashed) {
          crashed = true;
        }
      }

      if (obs.spec.z > 24) {
        this.worldGroup.remove(obs.mesh);
        this.obstacles.splice(i, 1);
      }
    }

    this.velocityY += GRAVITY * dt;
    this.playerY += this.velocityY * dt;
    if (this.playerY <= supportFloorY) {
      if (!this.isGrounded && this.velocityY < -7) {
        this.squashX = 1.2;
        this.squashY = 0.8;
        soundEngine.playLand();
      }
      this.playerY = supportFloorY;
      this.velocityY = 0;
      this.isGrounded = true;
    } else {
      this.isGrounded = false;
    }

    for (let i = this.coins.length - 1; i >= 0; i--) {
      const coin = this.coins[i];
      coin.z += forwardStep;
      coin.mesh.position.z = coin.z;
      coin.mesh.position.y =
        coin.baseY + Math.sin(this.elapsedTime * 4.5 + coin.phase) * 0.14;
      coin.mesh.rotation.y += dt * 4.5;

      if (!coin.collected && Math.abs(coin.z) < 0.95) {
        const dx = Math.abs(this.playerX - coin.x);
        const playerMidY = this.playerY + (isSliding ? 0.45 : 0.95);
        const dy = Math.abs(playerMidY - coin.mesh.position.y);
        if (dx < 0.95 && dy < 1.15) {
          coin.collected = true;
          coin.mesh.visible = false;
          this.coinCount += 1;
          this.score += 50;
          const lockResult = lockNoCoinOnCoinPickup(this.noCoinState);
          this.noCoinState = lockResult.next;
          soundEngine.playCoin(lockResult.justLocked);
          this.spawnParticles(coin.x, coin.mesh.position.y, 0, 12, 0xfacc15);
          if (lockResult.justLocked && lockResult.next.lockedAtMs !== null) {
            this.callbacksRef.current.onCoinLock(lockResult.next.lockedAtMs);
          }
        }
      }

      if (coin.z > 14 || coin.collected) {
        if (coin.z > 14) {
          this.worldGroup.remove(coin.mesh);
          this.coins.splice(i, 1);
        }
      }
    }

    this.squashX = THREE.MathUtils.damp(this.squashX, 1, 14, dt);
    this.squashY = THREE.MathUtils.damp(this.squashY, 1, 14, dt);
    this.runnerRig.root.position.set(this.playerX, this.playerY, 0);
    this.runnerRig.bodyPivot.scale.set(this.squashX, this.squashY, this.squashX);
    this.runnerRig.bodyPivot.rotation.z = leanZ;
    this.runnerRig.shadowDisc.position.y = Math.max(
      0.025,
      supportFloorY - this.playerY + 0.025
    );

    this.stridePhase += forwardStep * 0.65;
    this.animateRunnerPose(dt, isSliding);

    if (crashed) {
      this.trauma = 1.0;
      this.hitstopTimer = 0.055;
      this.crashDelayTimer = 0.45;
      this.pendingCrashSummary = {
        score: Math.round(this.score),
        distance: Math.round(this.distance),
        coins: this.coinCount,
        noCoinMs: Math.round(this.noCoinState.elapsedMs),
        durationMs: Math.round(this.runDurationMs),
        skinId: this.currentSkin.id,
        mapId: this.currentMap.id,
      };
      this.spawnParticles(this.playerX, this.playerY + 0.9, 0, 24, 0xff5500);
      soundEngine.playCrash();
    }

    this.applyGameplayCamera(dt, speed);
    this.emitHud();
  }

  private animateRunnerPose(dt: number, isSliding: boolean) {
    const anim = this.runnerRig.anim;
    const t = this.elapsedTime;

    // Animate skin-specific dynamic accessories
    if (anim.scarfSegments) {
      for (let i = 0; i < anim.scarfSegments.length; i++) {
        const seg = anim.scarfSegments[i];
        seg.position.x = Math.sin(t * 10 - i * 0.9) * (0.04 + i * 0.03);
        seg.position.y = 0.64 - i * 0.02 + Math.cos(t * 11 - i) * 0.03;
      }
    }
    if (anim.thrusterFlames) {
      const flicker = 0.8 + Math.sin(t * 28) * 0.28;
      for (const f of anim.thrusterFlames) {
        f.scale.set(1, flicker, 1);
      }
    }
    if (anim.wings) {
      const flap = Math.sin(t * 7.5) * 0.22;
      anim.wings.left.rotation.y = 0.25 + flap;
      anim.wings.right.rotation.y = -0.25 - flap;
    }
    if (anim.orbitRing) {
      anim.orbitRing.rotation.y += dt * 3.2;
      anim.orbitRing.rotation.z += dt * 1.4;
    }
    if (anim.tailPivot) {
      anim.tailPivot.rotation.y = Math.sin(t * 11) * 0.45;
    }

    if (isSliding) {
      this.runnerRig.bodyPivot.position.y = THREE.MathUtils.damp(
        this.runnerRig.bodyPivot.position.y,
        -0.42,
        18,
        dt
      );
      this.runnerRig.bodyPivot.rotation.x = THREE.MathUtils.damp(
        this.runnerRig.bodyPivot.rotation.x,
        0.95,
        18,
        dt
      );
      this.runnerRig.leftLegPivot.rotation.x = 0.35;
      this.runnerRig.rightLegPivot.rotation.x = -0.35;
      this.runnerRig.leftArmPivot.rotation.x = -0.8;
      this.runnerRig.rightArmPivot.rotation.x = -0.8;
      return;
    }

    this.runnerRig.bodyPivot.position.y = THREE.MathUtils.damp(
      this.runnerRig.bodyPivot.position.y,
      this.isGrounded ? Math.abs(Math.sin(this.stridePhase)) * 0.1 : 0,
      18,
      dt
    );
    this.runnerRig.bodyPivot.rotation.x = THREE.MathUtils.damp(
      this.runnerRig.bodyPivot.rotation.x,
      this.isGrounded ? -0.14 : -0.05,
      14,
      dt
    );

    if (!this.isGrounded && this.phase === 'playing') {
      this.runnerRig.leftLegPivot.rotation.x = 0.55;
      this.runnerRig.rightLegPivot.rotation.x = -0.45;
      this.runnerRig.leftArmPivot.rotation.x = -0.9;
      this.runnerRig.rightArmPivot.rotation.x = 0.7;
    } else {
      const swing = Math.sin(this.stridePhase) * 0.95;
      this.runnerRig.leftLegPivot.rotation.x = swing;
      this.runnerRig.rightLegPivot.rotation.x = -swing;
      this.runnerRig.leftArmPivot.rotation.x = -swing * 0.85;
      this.runnerRig.rightArmPivot.rotation.x = swing * 0.85;
    }
  }

  private applyGameplayCamera(dt: number, speed: number) {
    this.trauma = Math.max(0, this.trauma - dt * 1.9);
    const shake = this.trauma * this.trauma;
    const shakeX = (Math.random() - 0.5) * 0.55 * shake;
    const shakeY = (Math.random() - 0.5) * 0.45 * shake;

    const targetFov = 60 + ((speed - 17) / 23) * 10;
    if (Math.abs(this.camera.fov - targetFov) > 0.05) {
      this.camera.fov = THREE.MathUtils.damp(this.camera.fov, targetFov, 5, dt);
      this.camera.updateProjectionMatrix();
    }

    _camTarget.set(
      this.playerX * 0.65 + shakeX,
      3.85 + this.playerY * 0.6 + shakeY,
      6.9
    );
    const k = 1 - Math.exp(-10 * dt);
    this.camera.position.lerp(_camTarget, k);

    _lookTarget.set(this.playerX * 0.45, 1.45 + this.playerY * 0.55, -14);
    this.camera.lookAt(_lookTarget);
  }

  private updateParticles(dt: number) {
    let anyChanged = false;
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const p = this.particles[i];
      if (!p.active) continue;
      anyChanged = true;
      p.life += dt;
      if (p.life >= p.maxLife) {
        p.active = false;
        _mat4.makeScale(0, 0, 0);
        this.particleMesh.setMatrixAt(i, _mat4);
        continue;
      }
      p.vy -= 18 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.z += p.vz * dt;
      const s = p.scale * (1 - p.life / p.maxLife);
      _vec3.set(p.x, p.y, p.z);
      _scale.set(s, s, s);
      _mat4.compose(_vec3, _quat, _scale);
      this.particleMesh.setMatrixAt(i, _mat4);
    }
    if (anyChanged) {
      this.particleMesh.instanceMatrix.needsUpdate = true;
    }
  }

  public dispose() {
    this.destroyed = true;
    cancelAnimationFrame(this.frameId);
    clearTimeout(this.frameId);
    this.resizeObserver.disconnect();
    window.removeEventListener('resize', this.handleResize);
    if (this.skyTex) this.skyTex.dispose();
    this.textures.dispose();
    this.renderer.dispose();
    if (this.renderer.domElement.parentNode === this.container) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
