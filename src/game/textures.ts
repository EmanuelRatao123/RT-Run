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
  railTrack: THREE.Texture;
  trainPanel: THREE.Texture;
  urbanWall: THREE.Texture;
  runnerGear: THREE.Texture;
  skinStreetwear: THREE.Texture;
  skinCyberMecha: THREE.Texture;
  skinRoyalGold: THREE.Texture;
  skinShinobiMagma: THREE.Texture;
  gravelBump: THREE.CanvasTexture;
  hazardStripes: THREE.CanvasTexture;
  contactShadow: THREE.CanvasTexture;
  cityWindows: THREE.CanvasTexture;
  auroraRibbon: THREE.CanvasTexture;
  planetSurface: THREE.CanvasTexture;
  getSkinTexture: (variant: SkinTextureVariant) => THREE.Texture;
  dispose: () => void;
}

function createGravelBumpTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, size, size);

  for (let i = 0; i < 2400; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const r = 1 + Math.random() * 2.5;
    const v = Math.floor(85 + Math.random() * 140);
    ctx.fillStyle = `rgb(${v},${v},${v})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 6);
  return tex;
}

function createHazardStripeTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#facc15';
  ctx.fillRect(0, 0, size, size);

  ctx.fillStyle = '#18181b';
  for (let i = -size; i < size * 2; i += 48) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i + 24, 0);
    ctx.lineTo(i - size + 24, size);
    ctx.lineTo(i - size, size);
    ctx.closePath();
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function createContactShadowTexture(): THREE.CanvasTexture {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createRadialGradient(
    size / 2,
    size / 2,
    size * 0.08,
    size / 2,
    size / 2,
    size * 0.48
  );
  grad.addColorStop(0, 'rgba(0,0,0,0.65)');
  grad.addColorStop(0.55, 'rgba(0,0,0,0.28)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createCityWindowsTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, size, size);

  const cols = 8;
  const rows = 12;
  const padX = 6;
  const padY = 5;
  const cellW = size / cols;
  const cellH = size / rows;
  const colors = ['#38bdf8', '#f472b6', '#fde047', '#22d3ee', '#1e293b', '#1e293b'];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      ctx.fillStyle = colors[(r * 7 + c * 13) % colors.length];
      ctx.fillRect(
        c * cellW + padX,
        r * cellH + padY,
        cellW - padX * 2,
        cellH - padY * 2
      );
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function createAuroraRibbonTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createLinearGradient(0, 128, 0, 0);
  grad.addColorStop(0, 'rgba(16, 185, 129, 0)');
  grad.addColorStop(0.25, 'rgba(52, 211, 153, 0.85)');
  grad.addColorStop(0.6, 'rgba(34, 211, 238, 0.65)');
  grad.addColorStop(0.85, 'rgba(168, 85, 247, 0.35)');
  grad.addColorStop(1, 'rgba(168, 85, 247, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 128);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createPlanetSurfaceTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, '#1e3a8a');
  grad.addColorStop(0.2, '#3b82f6');
  grad.addColorStop(0.35, '#06b6d4');
  grad.addColorStop(0.5, '#60a5fa');
  grad.addColorStop(0.68, '#312e81');
  grad.addColorStop(0.85, '#2563eb');
  grad.addColorStop(1, '#0f172a');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createSkyGradientTexture(
  topHex: string,
  bottomHex: string
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 4;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, topHex);
  grad.addColorStop(0.75, bottomHex);
  grad.addColorStop(1, bottomHex);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 4, 256);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function loadGameTextures(renderer: THREE.WebGLRenderer): GameTextureSet {
  const loader = new THREE.TextureLoader();
  const maxAniso = Math.min(8, renderer.capabilities.getMaxAnisotropy() || 1);

  const configureColorTex = (url: string, repX: number, repY: number) => {
    const tex = loader.load(url);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(repX, repY);
    tex.anisotropy = maxAniso;
    return tex;
  };

  const railTrack = configureColorTex(railTrackUrl, 3, 6);
  const trainPanel = configureColorTex(trainPanelUrl, 2, 1);
  const urbanWall = configureColorTex(urbanWallUrl, 2, 2);
  const runnerGear = configureColorTex(runnerGearUrl, 1, 1);

  const skinStreetwear = configureColorTex(skinStreetwearUrl, 1, 1);
  const skinCyberMecha = configureColorTex(skinCyberMechaUrl, 1, 1);
  const skinRoyalGold = configureColorTex(skinRoyalGoldUrl, 1, 1);
  const skinShinobiMagma = configureColorTex(skinShinobiMagmaUrl, 1, 1);

  const gravelBump = createGravelBumpTexture();
  gravelBump.anisotropy = maxAniso;

  const hazardStripes = createHazardStripeTexture();
  hazardStripes.anisotropy = maxAniso;

  const contactShadow = createContactShadowTexture();
  const cityWindows = createCityWindowsTexture();
  cityWindows.anisotropy = maxAniso;
  const auroraRibbon = createAuroraRibbonTexture();
  const planetSurface = createPlanetSurfaceTexture();

  const getSkinTexture = (variant: SkinTextureVariant): THREE.Texture => {
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
