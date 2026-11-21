import * as THREE from 'three';
import railTrackUrl from '../assets/images/rail_track_tex_1794751242842.jpg';
import trainPanelUrl from '../assets/images/train_panel_tex_1794751242601.jpg';
import urbanWallUrl from '../assets/images/urban_wall_tex_1794751243594.jpg';
import runnerGearUrl from '../assets/images/runner_gear_tex_1794751245949.jpg';
import skinStreetwearUrl from '../assets/images/skin_streetwear_tex_1794752018690.jpg';
import skinCyberMechaUrl from '../assets/images/skin_cyber_mecha_tex_1794752018427.jpg';
import skinRoyalGoldUrl from '../assets/images/skin_royal_gold_tex_1794752018874.jpg';
import skinShinobiMagmaUrl from '../assets/images/skin_shinobi_magma_tex_1794752019635.jpg';
import { SkinTextureVariant } from './catalog';

export interface GameTextureSet {
  railTrack: THREE.CanvasTexture;
  trainPanel: THREE.CanvasTexture;
  urbanWall: THREE.CanvasTexture;
  runnerGear: THREE.CanvasTexture;
  skinStreetwear: THREE.CanvasTexture;
  skinCyberMecha: THREE.CanvasTexture;
  skinRoyalGold: THREE.CanvasTexture;
  skinShinobiMagma: THREE.CanvasTexture;
  gravelBump: THREE.CanvasTexture;
  hazardStripes: THREE.CanvasTexture;
  contactShadow: THREE.CanvasTexture;
  cityWindows: THREE.CanvasTexture;
  auroraRibbon: THREE.CanvasTexture;
  planetSurface: THREE.CanvasTexture;
  getSkinTexture: (variant: SkinTextureVariant) => THREE.CanvasTexture;
  dispose: () => void;
}

function configureVoxelFilter(
  tex: THREE.CanvasTexture,
  isColor: boolean,
  aniso = 1
): THREE.CanvasTexture {
  if (isColor) {
    tex.colorSpace = THREE.SRGBColorSpace;
  }
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.generateMipmaps = false;
  tex.anisotropy = aniso;
  return tex;
}

/**
 * Downsamples a generated image texture onto a low-res grid with NearestFilter
 * so every surface renders with crisp voxel-pixel blocks.
 */
function createVoxelImageTexture(
  url: string,
  gridSize: number,
  repX: number,
  repY: number,
  fallbackHex: string
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = gridSize;
  canvas.height = gridSize;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;

  // Immediate voxel grid fallback before async decode finishes
  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      const alt = ((x + y) & 1) === 0 ? 0.96 : 0.88;
      ctx.fillStyle = fallbackHex;
      ctx.globalAlpha = alt;
      ctx.fillRect(x, y, 1, 1);
    }
  }
  ctx.globalAlpha = 1;

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repX, repY);
  configureVoxelFilter(tex, true);

  const img = new Image();
  img.onload = () => {
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, gridSize, gridSize);
    ctx.drawImage(img, 0, 0, gridSize, gridSize);
    tex.needsUpdate = true;
  };
  img.src = url;

  return tex;
}

function createVoxelGravelBumpTexture(): THREE.CanvasTexture {
  const size = 32;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const v = 90 + (((x * 37 + y * 73) ^ (x * y)) % 130);
      ctx.fillStyle = `rgb(${v},${v},${v})`;
      ctx.fillRect(x, y, 1, 1);
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 8);
  return configureVoxelFilter(tex, false);
}

function createVoxelHazardStripeTexture(): THREE.CanvasTexture {
  const size = 16;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const diag = (x + y) % 8 < 4;
      ctx.fillStyle = diag ? '#facc15' : '#18181b';
      ctx.fillRect(x, y, 1, 1);
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return configureVoxelFilter(tex, true);
}

function createVoxelContactShadowTexture(): THREE.CanvasTexture {
  const size = 16;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, size, size);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = Math.abs(x + 0.5 - size / 2) / (size / 2);
      const dy = Math.abs(y + 0.5 - size / 2) / (size / 2);
      const d = Math.max(dx, dy);
      if (d < 0.9) {
        const alpha = d < 0.45 ? 0.65 : d < 0.72 ? 0.35 : 0.15;
        ctx.fillStyle = `rgba(0,0,0,${alpha})`;
        ctx.fillRect(x, y, 1, 1);
      }
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  return configureVoxelFilter(tex, true);
}

function createVoxelCityWindowsTexture(): THREE.CanvasTexture {
  const size = 16;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, size, size);

  const colors = ['#38bdf8', '#f472b6', '#fde047', '#22d3ee', '#1e293b', '#1e293b'];
  for (let y = 1; y < size; y += 2) {
    for (let x = 1; x < size; x += 2) {
      ctx.fillStyle = colors[(x * 5 + y * 11) % colors.length];
      ctx.fillRect(x, y, 1, 1);
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return configureVoxelFilter(tex, true);
}

function createVoxelAuroraTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 8;
  const ctx = canvas.getContext('2d')!;
  const palette = [
    'rgba(16, 185, 129, 0.0)',
    'rgba(52, 211, 153, 0.85)',
    'rgba(34, 211, 238, 0.85)',
    'rgba(168, 85, 247, 0.65)',
    'rgba(52, 211, 153, 0.45)',
    'rgba(16, 185, 129, 0.0)',
  ];
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 32; x++) {
      const idx = Math.min(
        palette.length - 1,
        Math.max(0, Math.floor((y + ((x % 4) === 0 ? 1 : 0)) * 0.75))
      );
      ctx.fillStyle = palette[idx];
      ctx.fillRect(x, y, 1, 1);
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  return configureVoxelFilter(tex, true);
}

function createVoxelPlanetTexture(): THREE.CanvasTexture {
  const size = 16;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const bands = [
    '#1e3a8a',
    '#2563eb',
    '#3b82f6',
    '#06b6d4',
    '#60a5fa',
    '#312e81',
    '#1d4ed8',
    '#0f172a',
  ];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const band = bands[(Math.floor(y / 2) + ((x + y) % 3 === 0 ? 1 : 0)) % bands.length];
      ctx.fillStyle = band;
      ctx.fillRect(x, y, 1, 1);
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  return configureVoxelFilter(tex, true);
}

export function createSkyGradientTexture(
  topHex: string,
  bottomHex: string
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 2;
  canvas.height = 16;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createLinearGradient(0, 0, 0, 16);
  grad.addColorStop(0, topHex);
  grad.addColorStop(0.75, bottomHex);
  grad.addColorStop(1, bottomHex);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 2, 16);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  return tex;
}

export function loadGameTextures(renderer: THREE.WebGLRenderer): GameTextureSet {
  const maxAniso = Math.min(4, renderer.capabilities.getMaxAnisotropy() || 1);

  const railTrack = createVoxelImageTexture(railTrackUrl, 32, 3, 6, '#94a3b8');
  railTrack.anisotropy = maxAniso;
  const trainPanel = createVoxelImageTexture(trainPanelUrl, 32, 2, 1, '#cbd5e1');
  trainPanel.anisotropy = maxAniso;
  const urbanWall = createVoxelImageTexture(urbanWallUrl, 24, 2, 2, '#cbd5e1');
  urbanWall.anisotropy = maxAniso;
  const runnerGear = createVoxelImageTexture(runnerGearUrl, 24, 1, 1, '#e2e8f0');

  const skinStreetwear = createVoxelImageTexture(skinStreetwearUrl, 24, 1, 1, '#e2e8f0');
  const skinCyberMecha = createVoxelImageTexture(skinCyberMechaUrl, 24, 1, 1, '#e2e8f0');
  const skinRoyalGold = createVoxelImageTexture(skinRoyalGoldUrl, 24, 1, 1, '#fef08a');
  const skinShinobiMagma = createVoxelImageTexture(skinShinobiMagmaUrl, 24, 1, 1, '#d4d4d8');

  const gravelBump = createVoxelGravelBumpTexture();
  gravelBump.anisotropy = maxAniso;

  const hazardStripes = createVoxelHazardStripeTexture();
  hazardStripes.anisotropy = maxAniso;

  const contactShadow = createVoxelContactShadowTexture();
  const cityWindows = createVoxelCityWindowsTexture();
  cityWindows.anisotropy = maxAniso;
  const auroraRibbon = createVoxelAuroraTexture();
  const planetSurface = createVoxelPlanetTexture();

  const getSkinTexture = (variant: SkinTextureVariant): THREE.CanvasTexture => {
    switch (variant) {
      case 'streetwear':
        return skinStreetwear;
      case 'cyber-mecha':
        return skinCyberMecha;
      case 'royal-gold':
        return skinRoyalGold;
      case 'shinobi-magma':
        return skinShinobiMagma;
      default:
        return runnerGear;
    }
  };

  return {
    railTrack,
    trainPanel,
    urbanWall,
    runnerGear,
    skinStreetwear,
    skinCyberMecha,
    skinRoyalGold,
    skinShinobiMagma,
    gravelBump,
    hazardStripes,
    contactShadow,
    cityWindows,
    auroraRibbon,
    planetSurface,
    getSkinTexture,
    dispose: () => {
      railTrack.dispose();
      trainPanel.dispose();
      urbanWall.dispose();
      runnerGear.dispose();
      skinStreetwear.dispose();
      skinCyberMecha.dispose();
      skinRoyalGold.dispose();
      skinShinobiMagma.dispose();
      gravelBump.dispose();
      hazardStripes.dispose();
      contactShadow.dispose();
      cityWindows.dispose();
      auroraRibbon.dispose();
      planetSurface.dispose();
    },
  };
}
