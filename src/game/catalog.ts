export type HeadgearStyle =
  | 'cap'
  | 'visor-helmet'
  | 'rat-ears'
  | 'ninja-hood'
  | 'astro-dome'
  | 'kabuto'
  | 'headphones'
  | 'flame-horns';

export type BackpackStyle =
  | 'street-pack'
  | 'neon-thruster'
  | 'gold-capsule'
  | 'katana-sheath'
  | 'oxygen-tank'
  | 'mecha-wing'
  | 'skate-deck'
  | 'magma-core';

export type SkinTextureVariant =
  | 'streetwear'
  | 'cyber-mecha'
  | 'royal-gold'
  | 'shinobi-magma'
  | 'tech-hex';

export interface RunnerSkin {
  id: string;
  name: string;
  tagline: string;
  category: string;
  free: boolean;
  textureVariant: SkinTextureVariant;
  primaryColor: number;
  secondaryColor: number;
  accentColor: number;
  skinTone: number;
  visorColor: number;
  shoeColor: number;
  headgear: HeadgearStyle;
  backpack: BackpackStyle;
  emissiveAccent?: number;
  swatchHex: string;
  accentHex: string;
}

export type MapPropTheme =
  | 'subway'
  | 'neon-city'
  | 'canyon'
  | 'arctic'
  | 'volcano'
  | 'space';

export interface MapTheme {
  id: string;
  name: string;
  tagline: string;
  free: boolean;
  skyTopHex: string;
  skyBottomHex: string;
  fogColor: number;
  fogDensity: number;
  groundColor: number;
  trackTint: number;
  curbColor: number;
  railColor: number;
  buildingPalette: number[];
  keyLightColor: number;
  keyLightIntensity: number;
  hemiSkyColor: number;
  hemiGroundColor: number;
  hemiIntensity: number;
  accentGlowColor: number;
  particleColor: number;
  propTheme: MapPropTheme;
  swatchHex: string;
  accentHex: string;
}

export const TOTAL_SKIN_COUNT = 800;
export const TOTAL_MAP_COUNT = 800;

const FEATURED_SKINS: RunnerSkin[] = [
  {
    id: 'rt-classic',
    name: 'RT Clássico Voxel',
    tagline: 'Moletom voxel streetwear e tênis turbo cúbico',
    category: 'Streetwear',
    free: true,
    textureVariant: 'streetwear',
    primaryColor: 0xffffff,
    secondaryColor: 0x1d3557,
    accentColor: 0xffbe0b,
    skinTone: 0xe0ac69,
    visorColor: 0x111827,
    shoeColor: 0xf8fafc,
    headgear: 'cap',
    backpack: 'street-pack',
    emissiveAccent: 0xffbe0b,
    swatchHex: '#e63946',
    accentHex: '#ffbe0b',
  },
  {
    id: 'neon-cyber',
    name: 'Cyber Neon Voxel',
    tagline: 'Armadura cúbica titânio com circuitos ciano e propulsores',
    category: 'Cyber',
    free: true,
    textureVariant: 'cyber-mecha',
    primaryColor: 0xffffff,
    secondaryColor: 0x0f172a,
    accentColor: 0x00f5d4,
    skinTone: 0xd4a373,
    visorColor: 0x00f5d4,
    shoeColor: 0x06b6d4,
    headgear: 'visor-helmet',
    backpack: 'neon-thruster',
    emissiveAccent: 0x00f5d4,
    swatchHex: '#06b6d4',
    accentHex: '#00f5d4',
  },
  {
    id: 'golden-rat',
    name: 'Rato Dourado Voxel',
    tagline: 'Blocos ouro 24k com coroa pixel e cauda cúbica',
    category: 'Real',
    free: true,
    textureVariant: 'royal-gold',
    primaryColor: 0xffffff,
    secondaryColor: 0x78350f,
    accentColor: 0xfde047,
    skinTone: 0xe7e5e4,
    visorColor: 0x18181b,
    shoeColor: 0xfacc15,
    headgear: 'rat-ears',
    backpack: 'gold-capsule',
    emissiveAccent: 0xfbbf24,
    swatchHex: '#f59e0b',
    accentHex: '#fde047',
  },
  {
    id: 'shadow-ninja',
    name: 'Ninja Sombrio Voxel',
    tagline: 'Shinobi em blocos com cachecol pixel e katana',
    category: 'Magma',
    free: true,
    textureVariant: 'shinobi-magma',
    primaryColor: 0xd4d4d8,
    secondaryColor: 0x18181b,
    accentColor: 0xef4444,
    skinTone: 0xe5b887,
    visorColor: 0xef4444,
    shoeColor: 0x09090b,
    headgear: 'ninja-hood',
    backpack: 'katana-sheath',
    emissiveAccent: 0xef4444,
    swatchHex: '#27272a',
    accentHex: '#ef4444',
  },
  {
    id: 'astronauta',
    name: 'Astronauta EVA Voxel',
    tagline: 'Traje espacial cúbico com mini drone voxel orbital',
    category: 'Tech',
    free: true,
    textureVariant: 'tech-hex',
    primaryColor: 0xf8fafc,
    secondaryColor: 0x334155,
    accentColor: 0xf97316,
    skinTone: 0xf1c27d,
    visorColor: 0xf59e0b,
    shoeColor: 0xe2e8f0,
    headgear: 'astro-dome',
    backpack: 'oxygen-tank',
    emissiveAccent: 0x38bdf8,
    swatchHex: '#f1f5f9',
    accentHex: '#f97316',
  },
  {
    id: 'samurai-mecha',
    name: 'Samurai Mecha Voxel',
    tagline: 'Exoesqueleto voxel samurai com asas pixeladas',
    category: 'Cyber',
    free: true,
    textureVariant: 'cyber-mecha',
    primaryColor: 0xfca5a5,
    secondaryColor: 0x334155,
    accentColor: 0x38bdf8,
    skinTone: 0x64748b,
    visorColor: 0x38bdf8,
    shoeColor: 0x1e293b,
    headgear: 'kabuto',
    backpack: 'mecha-wing',
    emissiveAccent: 0x38bdf8,
    swatchHex: '#991b1b',
    accentHex: '#38bdf8',
  },
  {
    id: 'skatista-tropical',
    name: 'Skatista Solar Voxel',
    tagline: 'Estilo urbano cúbico com hover-skate voxel',
    category: 'Streetwear',
    free: true,
    textureVariant: 'streetwear',
    primaryColor: 0x99f6e4,
    secondaryColor: 0x0f766e,
    accentColor: 0xa3e635,
    skinTone: 0xc68642,
    visorColor: 0x1e293b,
    shoeColor: 0xa3e635,
    headgear: 'headphones',
    backpack: 'skate-deck',
    emissiveAccent: 0xa3e635,
    swatchHex: '#0d9488',
    accentHex: '#a3e635',
  },
  {
    id: 'fogo-infernal',
    name: 'Corredor Magma Voxel',
    tagline: 'Blocos vulcânicos incandescentes e chifres pixelados',
    category: 'Magma',
    free: true,
    textureVariant: 'shinobi-magma',
    primaryColor: 0xffffff,
    secondaryColor: 0x431407,
    accentColor: 0xf97316,
    skinTone: 0x44403c,
    visorColor: 0xfb923c,
    shoeColor: 0xea580c,
    headgear: 'flame-horns',
    backpack: 'magma-core',
    emissiveAccent: 0xff5500,
    swatchHex: '#7c2d12',
    accentHex: '#ff5500',
  },
];

const FEATURED_MAPS: MapTheme[] = [
  {
    id: 'metro-central',
    name: 'Metrô Central Voxel',
    tagline: 'Estação cúbica solar com prédios voxel e semáforos',
    free: true,
    skyTopHex: '#1d4ed8',
    skyBottomHex: '#bae6fd',
    fogColor: 0x93c5fd,
    fogDensity: 0.0068,
    groundColor: 0x334155,
    trackTint: 0xffffff,
    curbColor: 0x64748b,
    railColor: 0xe2e8f0,
    buildingPalette: [0xd4d4d8, 0xc2b2a3, 0x94a3b8, 0xb8866c],
    keyLightColor: 0xfff3db,
    keyLightIntensity: 2.2,
    hemiSkyColor: 0x93c5fd,
    hemiGroundColor: 0x475569,
    hemiIntensity: 1.05,
    accentGlowColor: 0xfbbf24,
    particleColor: 0xfef08a,
    propTheme: 'subway',
    swatchHex: '#3b82f6',
    accentHex: '#fbbf24',
  },
  {
    id: 'tokyo-neon',
    name: 'Tóquio Neon Voxel',
    tagline: 'Metrópole pixel noturna com cubos holográficos e chuva neon',
    free: true,
    skyTopHex: '#050816',
    skyBottomHex: '#3b0764',
    fogColor: 0x160c36,
    fogDensity: 0.0085,
    groundColor: 0x090d1a,
    trackTint: 0x94a3b8,
    curbColor: 0x1e1b4b,
    railColor: 0x38bdf8,
    buildingPalette: [0x1e293b, 0x172554, 0x3b0764, 0x0f172a],
    keyLightColor: 0xe0f2fe,
    keyLightIntensity: 1.55,
    hemiSkyColor: 0xa855f7,
    hemiGroundColor: 0x06b6d4,
    hemiIntensity: 1.0,
    accentGlowColor: 0x00f5d4,
    particleColor: 0x22d3ee,
    propTheme: 'neon-city',
    swatchHex: '#2e1065',
    accentHex: '#00f5d4',
  },
  {
    id: 'deserto-canion',
    name: 'Deserto Cânion Voxel',
    tagline: 'Mesas em degraus voxel, cactos cúbicos e turbinas eólicas',
    free: true,
    skyTopHex: '#c2410c',
    skyBottomHex: '#fde68a',
    fogColor: 0xf5b971,
    fogDensity: 0.0068,
    groundColor: 0xb45309,
    trackTint: 0xfde68a,
    curbColor: 0x92400e,
    railColor: 0xe7e5e4,
    buildingPalette: [0xc2410c, 0x9a3412, 0xd97706, 0xb45309],
    keyLightColor: 0xffedd5,
    keyLightIntensity: 2.35,
    hemiSkyColor: 0xfdba74,
    hemiGroundColor: 0x7c2d12,
    hemiIntensity: 1.0,
    accentGlowColor: 0x4ade80,
    particleColor: 0xfde047,
    propTheme: 'canyon',
    swatchHex: '#c2410c',
    accentHex: '#fde047',
  },
  {
    id: 'artico-polar',
    name: 'Ártico Polar Voxel',
    tagline: 'Pinheiros voxel nevados, cristais cúbicos e aurora pixelada',
    free: true,
    skyTopHex: '#082f49',
    skyBottomHex: '#67e8f9',
    fogColor: 0x7dd3fc,
    fogDensity: 0.0072,
    groundColor: 0xe0f2fe,
    trackTint: 0xdbeafe,
    curbColor: 0x7dd3fc,
    railColor: 0xf8fafc,
    buildingPalette: [0xbae6fd, 0xe0f2fe, 0x38bdf8, 0x94a3b8],
    keyLightColor: 0xf0f9ff,
    keyLightIntensity: 2.05,
    hemiSkyColor: 0x67e8f9,
    hemiGroundColor: 0x0284c7,
    hemiIntensity: 1.1,
    accentGlowColor: 0x34d399,
    particleColor: 0xffffff,
    propTheme: 'arctic',
    swatchHex: '#0284c7',
    accentHex: '#67e8f9',
  },
  {
    id: 'vulcao-magma',
    name: 'Forja Vulcânica Voxel',
    tagline: 'Vulcão em blocos no horizonte, lava cúbica e brasas no ar',
    free: true,
    skyTopHex: '#180604',
    skyBottomHex: '#9a3412',
    fogColor: 0x2a0c05,
    fogDensity: 0.0072,
    groundColor: 0x141110,
    trackTint: 0xa8a29e,
    curbColor: 0x44403c,
    railColor: 0xfb923c,
    buildingPalette: [0x292524, 0x44403c, 0x57534e, 0x1c1917],
    keyLightColor: 0xfdba74,
    keyLightIntensity: 1.95,
    hemiSkyColor: 0xea580c,
    hemiGroundColor: 0xff4500,
    hemiIntensity: 1.0,
    accentGlowColor: 0xff5500,
    particleColor: 0xff6b00,
    propTheme: 'volcano',
    swatchHex: '#7c2d12',
    accentHex: '#ff5500',
  },
  {
    id: 'espaco-orbital',
    name: 'Estação Orbital Voxel',
    tagline: 'Planeta cúbico com anel voxel, painéis e portais warp',
    free: true,
    skyTopHex: '#020617',
    skyBottomHex: '#1e3a8a',
    fogColor: 0x050b21,
    fogDensity: 0.0046,
    groundColor: 0x030712,
    trackTint: 0xcbd5e1,
    curbColor: 0x334155,
    railColor: 0x60a5fa,
    buildingPalette: [0x334155, 0x475569, 0x1e293b, 0x64748b],
    keyLightColor: 0xe0f2fe,
    keyLightIntensity: 2.1,
    hemiSkyColor: 0x60a5fa,
    hemiGroundColor: 0x1e1b4b,
    hemiIntensity: 1.0,
    accentGlowColor: 0x38bdf8,
    particleColor: 0x93c5fd,
    propTheme: 'space',
    swatchHex: '#0f172a',
    accentHex: '#60a5fa',
  },
];

function hslToHexNum(h: number, s: number, l: number): number {
  const hue = ((h % 360) + 360) % 360;
  const sat = Math.max(0, Math.min(1, s / 100));
  const lig = Math.max(0, Math.min(1, l / 100));
  const c = (1 - Math.abs(2 * lig - 1)) * sat;
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = lig - c / 2;
  let r = 0;
  let g = 0;
  let b = 0;
  if (hue < 60) {
    r = c;
    g = x;
  } else if (hue < 120) {
    r = x;
    g = c;
  } else if (hue < 180) {
    g = c;
    b = x;
  } else if (hue < 240) {
    g = x;
    b = c;
  } else if (hue < 300) {
    r = x;
    b = c;
  } else {
    r = c;
    b = x;
  }
  const ri = Math.round((r + m) * 255);
  const gi = Math.round((g + m) * 255);
  const bi = Math.round((b + m) * 255);
  return (ri << 16) | (gi << 8) | bi;
}

function numToHexStr(n: number): string {
  return `#${(n >>> 0).toString(16).padStart(6, '0')}`;
}

const HEADGEAR_CYCLE: HeadgearStyle[] = [
  'cap',
  'visor-helmet',
  'rat-ears',
  'ninja-hood',
  'astro-dome',
  'kabuto',
  'headphones',
  'flame-horns',
];

const BACKPACK_CYCLE: BackpackStyle[] = [
  'street-pack',
  'neon-thruster',
  'gold-capsule',
  'katana-sheath',
  'oxygen-tank',
  'mecha-wing',
  'skate-deck',
  'magma-core',
];

const TEXTURE_VARIANTS: { variant: SkinTextureVariant; category: string }[] = [
  { variant: 'streetwear', category: 'Streetwear' },
  { variant: 'cyber-mecha', category: 'Cyber' },
  { variant: 'royal-gold', category: 'Real' },
  { variant: 'shinobi-magma', category: 'Magma' },
  { variant: 'tech-hex', category: 'Tech' },
];

const SKIN_ARCHETYPES = [
  'Corredor',
  'Guardião',
  'Ninja',
  'Piloto',
  'Samurai',
  'Skatista',
  'Ciborgue',
  'Rato',
  'Titan',
  'Fantasma',
  'Gladiador',
  'Explorador',
  'Sentinel',
  'Mago',
  'Ranger',
  'Androide',
];

const SKIN_ADJECTIVES = [
  'Aurora',
  'Ciano',
  'Esmeralda',
  'Rubi',
  'Solar',
  'Ônix',
  'Safira',
  'Ártico',
  'Plasma',
  'Prisma',
  'Carmesim',
  'Dourado',
  'Cósmico',
  'Elétrico',
  'Ametista',
  'Jade',
  'Cobalto',
  'Titânio',
  'Estelar',
  'Vulcânico',
  'Glacial',
  'Turbo',
  'Pixel',
  'Supremo',
  'Sombrio',
];

const SKIN_TONES = [
  0xf1c27d,
  0xe0ac69,
  0xc68642,
  0x8d5524,
  0xf8fafc,
  0x94a3b8,
  0xa7f3d0,
  0xfde68a,
];

function generateExtraSkins(startIndex: number, total: number): RunnerSkin[] {
  const list: RunnerSkin[] = [];
  for (let i = startIndex; i < total; i++) {
    const num = i + 1;
    const arch = SKIN_ARCHETYPES[(i * 7 + 3) % SKIN_ARCHETYPES.length];
    const adj = SKIN_ADJECTIVES[(i * 11 + 5) % SKIN_ADJECTIVES.length];
    const texInfo = TEXTURE_VARIANTS[(i * 3 + 1) % TEXTURE_VARIANTS.length];
    const headgear = HEADGEAR_CYCLE[(i * 5 + 2) % HEADGEAR_CYCLE.length];
    const backpack = BACKPACK_CYCLE[(i * 3 + 7) % BACKPACK_CYCLE.length];

    const baseHue = (i * 137.508) % 360;
    const accentHue = (baseHue + 145 + (i % 5) * 20) % 360;
    const isLightPrimary = i % 3 !== 0;

    const primaryColor = hslToHexNum(
      baseHue,
      62 + (i % 4) * 9,
      isLightPrimary ? 62 + (i % 3) * 8 : 34 + (i % 3) * 7
    );
    const secondaryColor = hslToHexNum(
      (baseHue + 35) % 360,
      45 + (i % 5) * 8,
      16 + (i % 4) * 6
    );
    const accentColor = hslToHexNum(accentHue, 88, 58);
    const shoeColor = hslToHexNum(accentHue, 75, 72);
    const skinTone = SKIN_TONES[i % SKIN_TONES.length];
    const padded = String(num).padStart(3, '0');

    list.push({
      id: `voxel-skin-${padded}`,
      name: `${arch} ${adj} #${padded}`,
      tagline: `Skin Voxel ${texInfo.category} · Grátis`,
      category: texInfo.category,
      free: true,
      textureVariant: texInfo.variant,
      primaryColor,
      secondaryColor,
      accentColor,
      skinTone,
      visorColor: i % 2 === 0 ? accentColor : 0x0f172a,
      shoeColor,
      headgear,
      backpack,
      emissiveAccent: accentColor,
      swatchHex: numToHexStr(primaryColor),
      accentHex: numToHexStr(accentColor),
    });
  }
  return list;
}

const BIOME_CYCLE: {
  propTheme: MapPropTheme;
  label: string;
  prefixes: string[];
}[] = [
  {
    propTheme: 'subway',
    label: 'Metrô',
    prefixes: ['Estação', 'Viaduto', 'Terminal', 'Bulevar', 'Subúrbio'],
  },
  {
    propTheme: 'neon-city',
    label: 'Neon',
    prefixes: ['Distrito', 'Metrópole', 'Mega-Setor', 'Cyber-Rua', 'Avenida'],
  },
  {
    propTheme: 'canyon',
    label: 'Cânion',
    prefixes: ['Deserto', 'Cânion', 'Dunas', 'Vale Seco', 'Chapada'],
  },
  {
    propTheme: 'arctic',
    label: 'Ártico',
    prefixes: ['Geleira', 'Tundra', 'Pico Ártico', 'Fiorde', 'Neve'],
  },
  {
    propTheme: 'volcano',
    label: 'Vulcão',
    prefixes: ['Forja', 'Cratera', 'Abismo', 'Caldeira', 'Basalto'],
  },
  {
    propTheme: 'space',
    label: 'Espaço',
    prefixes: ['Órbita', 'Nebulosa', 'Estação Alfa', 'Setor Zero', 'Galáxia'],
  },
];

const MAP_SUFFIXES = [
  'Esmeralda',
  'Crepúsculo',
  'Safira',
  'Rubi',
  'Aurora',
  'Dourado',
  'Cobalto',
  'Prisma',
  'Ametista',
  'Obsidiana',
  'Jade',
  'Turquesa',
  'Âmbar',
  'Coral',
  'Polar',
  'Solar',
  'Noturno',
  'Cristal',
  'Índigo',
  'Bronze',
  'Platina',
  'Cobre',
  'Neon',
  'Estelar',
  'Cúbico',
];

function generateExtraMaps(startIndex: number, total: number): MapTheme[] {
  const list: MapTheme[] = [];
  for (let i = startIndex; i < total; i++) {
    const num = i + 1;
    const biome = BIOME_CYCLE[(i * 5 + 1) % BIOME_CYCLE.length];
    const prefix = biome.prefixes[(i * 3) % biome.prefixes.length];
    const suffix = MAP_SUFFIXES[(i * 7 + 2) % MAP_SUFFIXES.length];
    const hue = (i * 137.508 + 25) % 360;
    const accentHue = (hue + 150) % 360;
    const isNight =
      biome.propTheme === 'neon-city' ||
      biome.propTheme === 'space' ||
      biome.propTheme === 'volcano' ||
      i % 3 === 1;

    const skyTopNum = hslToHexNum(hue, isNight ? 68 : 65, isNight ? 12 : 42);
    const skyBotNum = hslToHexNum(
      (hue + 28) % 360,
      isNight ? 72 : 76,
      isNight ? 28 : 74
    );
    const fogColor = hslToHexNum(
      (hue + 24) % 360,
      isNight ? 58 : 62,
      isNight ? 20 : 66
    );
    const groundColor = hslToHexNum(
      hue,
      isNight ? 32 : 44,
      biome.propTheme === 'arctic' ? 84 : isNight ? 14 : 34
    );
    const trackTint = hslToHexNum(
      (hue + 10) % 360,
      20,
      isNight ? 68 : 92
    );
    const curbColor = hslToHexNum(hue, 38, isNight ? 24 : 46);
    const railColor = hslToHexNum(accentHue, 70, 82);
    const accentGlowColor = hslToHexNum(accentHue, 92, 58);
    const particleColor = hslToHexNum((accentHue + 20) % 360, 95, 72);
    const keyLightColor = hslToHexNum((hue + 40) % 360, 50, isNight ? 85 : 94);
    const hemiSkyColor = skyBotNum;
    const hemiGroundColor = curbColor;
    const buildingPalette = [
      hslToHexNum(hue, 38, isNight ? 22 : 58),
      hslToHexNum((hue + 18) % 360, 42, isNight ? 28 : 64),
      hslToHexNum((hue + 340) % 360, 34, isNight ? 18 : 50),
      hslToHexNum(accentHue, 44, isNight ? 26 : 54),
    ];
    const padded = String(num).padStart(3, '0');

    list.push({
      id: `voxel-map-${padded}`,
      name: `${prefix} ${suffix} #${padded}`,
      tagline: `Mapa Voxel ${biome.label} · 100% Grátis`,
      free: true,
      skyTopHex: numToHexStr(skyTopNum),
      skyBottomHex: numToHexStr(skyBotNum),
      fogColor,
      fogDensity: biome.propTheme === 'space' ? 0.0048 : 0.0068,
      groundColor,
      trackTint,
      curbColor,
      railColor,
      buildingPalette,
      keyLightColor,
      keyLightIntensity: isNight ? 1.85 : 2.15,
      hemiSkyColor,
      hemiGroundColor,
      hemiIntensity: 1.05,
      accentGlowColor,
      particleColor,
      propTheme: biome.propTheme,
      swatchHex: numToHexStr(skyTopNum),
      accentHex: numToHexStr(accentGlowColor),
    });
  }
  return list;
}

export const RUNNER_SKINS: RunnerSkin[] = [
  ...FEATURED_SKINS,
  ...generateExtraSkins(FEATURED_SKINS.length, TOTAL_SKIN_COUNT),
];

export const MAP_THEMES: MapTheme[] = [
  ...FEATURED_MAPS,
  ...generateExtraMaps(FEATURED_MAPS.length, TOTAL_MAP_COUNT),
];

const SKIN_BY_ID = new Map<string, RunnerSkin>(
  RUNNER_SKINS.map((s) => [s.id, s])
);
const MAP_BY_ID = new Map<string, MapTheme>(
  MAP_THEMES.map((m) => [m.id, m])
);

export function getSkinById(id: string): RunnerSkin {
  return SKIN_BY_ID.get(id) ?? RUNNER_SKINS[0];
}

export function getMapById(id: string): MapTheme {
  return MAP_BY_ID.get(id) ?? MAP_THEMES[0];
}
