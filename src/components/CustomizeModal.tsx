import { useMemo, useState } from 'react';
import {
  X,
  Check,
  Palette,
  Map as MapIcon,
  Search,
  Shuffle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { MAP_THEMES, MapPropTheme, RUNNER_SKINS } from '../game/catalog';

interface CustomizeModalProps {
  initialTab: 'skins' | 'maps';
  selectedSkin: string;
  selectedMap: string;
  onSelectSkin: (skinId: string) => void;
  onSelectMap: (mapId: string) => void;
  onClose: () => void;
}

const PAGE_SIZE = 48;

const SKIN_CATEGORIES = ['Todos', 'Streetwear', 'Cyber', 'Real', 'Magma', 'Tech'];

const MAP_BIOMES: { id: 'all' | MapPropTheme; label: string }[] = [
  { id: 'all', label: 'Todos' },
  { id: 'subway', label: 'Metrô' },
  { id: 'neon-city', label: 'Neon' },
  { id: 'canyon', label: 'Cânion' },
  { id: 'arctic', label: 'Ártico' },
  { id: 'volcano', label: 'Vulcão' },
  { id: 'space', label: 'Espaço' },
];

export function CustomizeModal({
  initialTab,
  selectedSkin,
  selectedMap,
  onSelectSkin,
  onSelectMap,
  onClose,
}: CustomizeModalProps) {
  const [tab, setTab] = useState<'skins' | 'maps'>(initialTab);
  const [search, setSearch] = useState('');
  const [skinCategory, setSkinCategory] = useState('Todos');
  const [mapBiome, setMapBiome] = useState<'all' | MapPropTheme>('all');
  const [page, setPage] = useState(0);

  const filteredSkins = useMemo(() => {
    const q = search.trim().toLowerCase();
    return RUNNER_SKINS.filter((s) => {
      if (skinCategory !== 'Todos' && s.category !== skinCategory) return false;
      if (!q) return true;
      return (
        s.name.toLowerCase().includes(q) ||
        s.tagline.toLowerCase().includes(q) ||
        s.id.toLowerCase().includes(q)
      );
    });
  }, [search, skinCategory]);

  const filteredMaps = useMemo(() => {
    const q = search.trim().toLowerCase();
    return MAP_THEMES.filter((m) => {
      if (mapBiome !== 'all' && m.propTheme !== mapBiome) return false;
      if (!q) return true;
      return (
        m.name.toLowerCase().includes(q) ||
        m.tagline.toLowerCase().includes(q) ||
        m.id.toLowerCase().includes(q)
      );
    });
  }, [search, mapBiome]);

  const activeListLength = tab === 'skins' ? filteredSkins.length : filteredMaps.length;
  const totalPages = Math.max(1, Math.ceil(activeListLength / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);

  const pageSkins = useMemo(
    () =>
      filteredSkins.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE),
    [filteredSkins, safePage]
  );

  const pageMaps = useMemo(
    () =>
      filteredMaps.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE),
    [filteredMaps, safePage]
  );

  const handleSwitchTab = (nextTab: 'skins' | 'maps') => {
    setTab(nextTab);
    setPage(0);
    setSearch('');
  };

  const handleRandomPick = () => {
    if (tab === 'skins' && filteredSkins.length > 0) {
      const idx = Math.floor(Math.random() * filteredSkins.length);
      onSelectSkin(filteredSkins[idx].id);
      setPage(Math.floor(idx / PAGE_SIZE));
    } else if (tab === 'maps' && filteredMaps.length > 0) {
      const idx = Math.floor(Math.random() * filteredMaps.length);
      onSelectMap(filteredMaps[idx].id);
      setPage(Math.floor(idx / PAGE_SIZE));
    }
  };

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/75"
      role="dialog"
      aria-modal="true"
      aria-label="Personalizar Skin e Mapa"
    >
      <div className="w-full max-w-4xl max-h-[88vh] flex flex-col rounded-2xl bg-[#0c1222] border-2 border-slate-700 shadow-2xl overflow-hidden">
        {/* Header Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-3.5 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleSwitchTab('skins')}
              className={`px-4 py-2 rounded-xl text-sm font-black flex items-center gap-2 cursor-pointer transition-colors ${
                tab === 'skins'
                  ? 'bg-amber-500 text-slate-950'
                  : 'bg-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              <Palette className="w-4 h-4" />
              Skins ({RUNNER_SKINS.length})
            </button>
            <button
              type="button"
              onClick={() => handleSwitchTab('maps')}
              className={`px-4 py-2 rounded-xl text-sm font-black flex items-center gap-2 cursor-pointer transition-colors ${
                tab === 'maps'
                  ? 'bg-cyan-400 text-slate-950'
                  : 'bg-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              <MapIcon className="w-4 h-4" />
              Mapas ({MAP_THEMES.length})
            </button>
            <span className="hidden sm:inline-block px-2.5 py-1 rounded-lg bg-emerald-500/20 border border-emerald-400/50 text-[11px] font-black text-emerald-300 uppercase">
              Todos 100% Grátis
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar Personalização"
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search + Filter + Random Bar */}
        <div className="px-5 py-3 bg-slate-900/70 border-b border-slate-800 space-y-2.5">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(0);
                }}
                aria-label={
                  tab === 'skins' ? 'Buscar skins' : 'Buscar mapas'
                }
                placeholder={
                  tab === 'skins'
                    ? 'Buscar entre 800 skins (ex: Ninja, Ouro, #120)...'
                    : 'Buscar entre 800 mapas (ex: Neve, Vulcão, #450)...'
                }
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
              />
            </div>

            <button
              type="button"
              onClick={handleRandomPick}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
            >
              <Shuffle className="w-4 h-4" />
              Aleatório
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {tab === 'skins'
              ? SKIN_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      setSkinCategory(cat);
                      setPage(0);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-black cursor-pointer ${
                      skinCategory === cat
                        ? 'bg-amber-400 text-slate-950'
                        : 'bg-slate-800 text-slate-300 hover:text-white'
                    }`}
                  >
                    {cat}
                  </button>
                ))
              : MAP_BIOMES.map((biome) => (
                  <button
                    key={biome.id}
                    type="button"
                    onClick={() => {
                      setMapBiome(biome.id);
                      setPage(0);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-black cursor-pointer ${
                      mapBiome === biome.id
                        ? 'bg-cyan-400 text-slate-950'
                        : 'bg-slate-800 text-slate-300 hover:text-white'
                    }`}
                  >
                    {biome.label}
                  </button>
                ))}
          </div>
        </div>

        {/* Grid */}
        <div className="p-5 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 flex-1">
          {tab === 'skins' &&
            pageSkins.map((skin) => {
              const active = skin.id === selectedSkin;
              return (
                <button
                  key={skin.id}
                  type="button"
                  onClick={() => onSelectSkin(skin.id)}
                  className={`text-left p-3 rounded-xl border-2 flex items-center gap-3 cursor-pointer transition-colors ${
                    active
                      ? 'bg-amber-500/15 border-amber-400'
                      : 'bg-slate-900/90 border-slate-800 hover:border-slate-600'
                  }`}
                >
                  <div
                    className="w-11 h-11 rounded-lg border-2 shrink-0 flex items-center justify-center"
                    style={{
                      backgroundColor: skin.swatchHex,
                      borderColor: skin.accentHex,
                    }}
                  >
                    {active && <Check className="w-5 h-5 text-white drop-shadow" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1.5">
                      <p className="font-black text-white text-xs sm:text-sm truncate">
                        {skin.name}
                      </p>
                      <span
                        className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded shrink-0 ${
                          active
                            ? 'bg-amber-400 text-slate-950'
                            : 'bg-emerald-500/20 text-emerald-300'
                        }`}
                      >
                        {active ? 'Equipada' : 'Grátis'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                      {skin.tagline}
                    </p>
                  </div>
                </button>
              );
            })}

          {tab === 'maps' &&
            pageMaps.map((map) => {
              const active = map.id === selectedMap;
              return (
                <button
                  key={map.id}
                  type="button"
                  onClick={() => onSelectMap(map.id)}
                  className={`text-left p-3 rounded-xl border-2 flex items-center gap-3 cursor-pointer transition-colors ${
                    active
                      ? 'bg-cyan-500/15 border-cyan-400'
                      : 'bg-slate-900/90 border-slate-800 hover:border-slate-600'
                  }`}
                >
                  <div
                    className="w-11 h-11 rounded-lg border-2 shrink-0 flex items-center justify-center"
                    style={{
                      background: `linear-gradient(180deg, ${map.skyTopHex}, ${map.skyBottomHex})`,
                      borderColor: map.accentHex,
                    }}
                  >
                    {active && <Check className="w-5 h-5 text-white drop-shadow" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1.5">
                      <p className="font-black text-white text-xs sm:text-sm truncate">
                        {map.name}
                      </p>
                      <span
                        className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded shrink-0 ${
                          active
                            ? 'bg-cyan-400 text-slate-950'
                            : 'bg-emerald-500/20 text-emerald-300'
                        }`}
                      >
                        {active ? 'Ativo' : 'Grátis'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                      {map.tagline}
                    </p>
                  </div>
                </button>
              );
            })}

          {activeListLength === 0 && (
            <p className="col-span-full text-center text-sm text-slate-400 py-8">
              Nenhum resultado encontrado para "{search}".
            </p>
          )}
        </div>

        {/* Footer Pagination + Confirm */}
        <div className="px-5 py-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-950/60">
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={safePage <= 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              aria-label="Página anterior"
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold text-slate-300 tabular-nums">
              Página {safePage + 1} de {totalPages} ({activeListLength} itens)
            </span>
            <button
              type="button"
              disabled={safePage >= totalPages - 1}
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              aria-label="Próxima página"
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-sm font-black cursor-pointer"
          >
            Confirmar Escolha
          </button>
        </div>
      </div>
    </div>
  );
}
