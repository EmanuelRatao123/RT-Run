import { useState } from 'react';
import { X, Check, Palette, Map as MapIcon } from 'lucide-react';
import { MAP_THEMES, RUNNER_SKINS } from '../game/catalog';

interface CustomizeModalProps {
  initialTab: 'skins' | 'maps';
  selectedSkin: string;
  selectedMap: string;
  onSelectSkin: (skinId: string) => void;
  onSelectMap: (mapId: string) => void;
  onClose: () => void;
}

export function CustomizeModal({
  initialTab,
  selectedSkin,
  selectedMap,
  onSelectSkin,
  onSelectMap,
  onClose,
}: CustomizeModalProps) {
  const [tab, setTab] = useState<'skins' | 'maps'>(initialTab);

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/70"
      role="dialog"
      aria-modal="true"
      aria-label="Personalizar Skin e Mapa"
    >
      <div className="w-full max-w-3xl max-h-[86vh] flex flex-col rounded-2xl bg-[#0c1222] border-2 border-slate-700 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setTab('skins')}
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
              onClick={() => setTab('maps')}
              className={`px-4 py-2 rounded-xl text-sm font-black flex items-center gap-2 cursor-pointer transition-colors ${
                tab === 'maps'
                  ? 'bg-cyan-400 text-slate-950'
                  : 'bg-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              <MapIcon className="w-4 h-4" />
              Mapas ({MAP_THEMES.length})
            </button>
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

        <div className="p-5 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-3">
          {tab === 'skins' &&
            RUNNER_SKINS.map((skin) => {
              const active = skin.id === selectedSkin;
              return (
                <button
                  key={skin.id}
                  type="button"
                  onClick={() => onSelectSkin(skin.id)}
                  className={`text-left p-3.5 rounded-xl border-2 flex items-center gap-3.5 cursor-pointer transition-colors ${
                    active
                      ? 'bg-amber-500/15 border-amber-400'
                      : 'bg-slate-900/90 border-slate-800 hover:border-slate-600'
                  }`}
                >
                  <div
                    className="w-12 h-12 rounded-xl border-2 shrink-0 flex items-center justify-center"
                    style={{
                      backgroundColor: skin.swatchHex,
                      borderColor: skin.accentHex,
                    }}
                  >
                    {active && <Check className="w-6 h-6 text-white drop-shadow" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-black text-white text-sm truncate">
                        {skin.name}
                      </p>
                      {active && (
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-amber-400 text-slate-950">
                          Equipada
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">
                      {skin.tagline}
                    </p>
                  </div>
                </button>
              );
            })}

          {tab === 'maps' &&
            MAP_THEMES.map((map) => {
              const active = map.id === selectedMap;
              return (
                <button
                  key={map.id}
                  type="button"
                  onClick={() => onSelectMap(map.id)}
                  className={`text-left p-3.5 rounded-xl border-2 flex items-center gap-3.5 cursor-pointer transition-colors ${
                    active
                      ? 'bg-cyan-500/15 border-cyan-400'
                      : 'bg-slate-900/90 border-slate-800 hover:border-slate-600'
                  }`}
                >
                  <div
                    className="w-12 h-12 rounded-xl border-2 shrink-0 flex items-center justify-center"
                    style={{
                      background: `linear-gradient(180deg, ${map.skyTopHex}, ${map.skyBottomHex})`,
                      borderColor: map.accentHex,
                    }}
                  >
                    {active && <Check className="w-6 h-6 text-white drop-shadow" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-black text-white text-sm truncate">
                        {map.name}
                      </p>
                      {active && (
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-cyan-400 text-slate-950">
                          Selecionado
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">
                      {map.tagline}
                    </p>
                  </div>
                </button>
              );
            })}
        </div>

        <div className="px-5 py-3.5 border-t border-slate-800 flex justify-end">
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
