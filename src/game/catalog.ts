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

export const RUNNER_SKINS: RunnerSkin[] = [
  {
    id: 'rt-classic',
    name: 'RT Clássico',
    tagline: 'Moletom streetwear texturizado e tênis turbo',
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
    name: 'Cyber Neon',
    tagline: 'Armadura titânio com circuitos ciano e propulsores',
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
    name: 'Rato Dourado',
    tagline: 'Armadura ouro 24k com filigrana real e coroa',
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
    name: 'Ninja Sombrio',
    tagline: 'Tecido shinobi tático com cachecol flutuante e katana',
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
    name: 'Astronauta EVA',
    tagline: 'Traje espacial com visor dourado e mini drone orbital',
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
    name: 'Samurai Mecha',
    tagline: 'Exoesqueleto cyber-samurai com asas energizadas',
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
    name: 'Skatista Solar',
    tagline: 'Estilo urbano vibrante com hover-skate nas costas',
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
    name: 'Corredor Magma',
    tagline: 'Escamas vulcânicas incandescentes e chifres flamejantes',
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

export const MAP_THEMES: MapTheme[] = [
  {
    id: 'metro-central',
    name: 'Metrô Central',
    tagline: 'Estação solar com janelas iluminadas e semáforos vivos',
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
    name: 'Tóquio Neon',
    tagline: 'Metrópole noturna com letreiros animados e chuva neon',
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
    name: 'Deserto Cânion',
    tagline: 'Pôr do sol dourado com turbinas eólicas giratórias',
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
    name: 'Ártico Polar',
    tagline: 'Neve caindo sob aurora boreal animada e cristais de gelo',
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
    name: 'Forja Vulcânica',
    tagline: 'Vulcão ativo no horizonte, lava pulsante e brasas no ar',
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
    name: 'Estação Orbital',
    tagline: 'Planeta com anéis, painéis solares giratórios e portais warp',
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

export function getSkinById(id: string): RunnerSkin {
  return RUNNER_SKINS.find((s) => s.id === id) ?? RUNNER_SKINS[0];
}

export function getMapById(id: string): MapTheme {
  return MAP_THEMES.find((m) => m.id === id) ?? MAP_THEMES[0];
}
