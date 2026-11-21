import React, { useState } from 'react';
import {
  Tv,
  Play,
  Minimize2,
  Maximize2,
  Move,
  X,
  Link2,
} from 'lucide-react';
import { parseYouTubeSource, YouTubeSource } from '../utils/youtube';

interface YouTubeTelaoProps {
  open: boolean;
  onClose: () => void;
}

type TelaoCorner = 'bottom-right' | 'bottom-left' | 'top-left' | 'top-right';
type TelaoSize = 'sm' | 'md' | 'lg';

const CORNER_CLASSES: Record<TelaoCorner, string> = {
  'bottom-right': 'bottom-20 sm:bottom-4 right-3 sm:right-4',
  'bottom-left': 'bottom-20 sm:bottom-4 left-3 sm:left-4',
  'top-left': 'top-20 left-3 sm:left-4',
  'top-right': 'top-16 right-3 sm:right-4',
};

const SIZE_CLASSES: Record<TelaoSize, string> = {
  sm: 'w-64 sm:w-72',
  md: 'w-80 sm:w-96',
  lg: 'w-[92vw] sm:w-[460px]',
};

const CORNER_ORDER: TelaoCorner[] = [
  'bottom-right',
  'bottom-left',
  'top-left',
  'top-right',
];

export function YouTubeTelao({ open, onClose }: YouTubeTelaoProps) {
  const [urlInput, setUrlInput] = useState('');
  const [source, setSource] = useState<YouTubeSource | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [minimized, setMinimized] = useState(false);
  const [editingUrl, setEditingUrl] = useState(true);
  const [corner, setCorner] = useState<TelaoCorner>('bottom-right');
  const [size, setSize] = useState<TelaoSize>('md');

  if (!open) return null;

  const handleLoadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseYouTubeSource(urlInput);
    if (!parsed) {
      setErrorMsg(
        'Link inválido. Cole um link do YouTube (ex: youtube.com/watch?v=... ou youtu.be/...).'
      );
      return;
    }
    setErrorMsg(null);
    setSource(parsed);
    setEditingUrl(false);
    setMinimized(false);
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  };

  const handleCycleCorner = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.blur();
    const idx = CORNER_ORDER.indexOf(corner);
    setCorner(CORNER_ORDER[(idx + 1) % CORNER_ORDER.length]);
  };

  const handleSizeClick = (
    nextSize: TelaoSize,
    e: React.MouseEvent<HTMLButtonElement>
  ) => {
    e.currentTarget.blur();
    setSize(nextSize);
    setMinimized(false);
  };

  return (
    <section
      aria-label="Telão YouTube"
      data-testid="youtube-telao"
      onTouchStart={(e) => e.stopPropagation()}
      onTouchEnd={(e) => e.stopPropagation()}
      className={`fixed z-30 ${CORNER_CLASSES[corner]} ${
        minimized ? 'w-72' : SIZE_CLASSES[size]
      } rounded-2xl bg-[#090d1a]/95 border-2 border-rose-500/75 shadow-[0_14px_40px_rgba(0,0,0,0.65)] overflow-hidden pointer-events-auto`}
    >
      {/* Header Bar */}
      <div className="flex items-center justify-between gap-1.5 px-3 py-2 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center gap-1.5 min-w-0">
          <Tv className="w-4 h-4 text-rose-400 shrink-0" />
          <span className="text-xs font-black uppercase tracking-wider text-white truncate">
            Telão YouTube
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {source && (
            <button
              type="button"
              tabIndex={-1}
              onClick={(e) => {
                e.currentTarget.blur();
                setEditingUrl((v) => !v);
              }}
              aria-label="Trocar link do YouTube"
              title="Trocar link"
              className="px-1.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-[10px] font-black text-slate-200 flex items-center gap-1 cursor-pointer"
            >
              <Link2 className="w-3 h-3 text-rose-300" />
              Link
            </button>
          )}

          {(['sm', 'md', 'lg'] as TelaoSize[]).map((sz) => (
            <button
              key={sz}
              type="button"
              tabIndex={-1}
              onClick={(e) => handleSizeClick(sz, e)}
              aria-label={`Tamanho ${sz.toUpperCase()}`}
              className={`px-1.5 py-0.5 rounded text-[10px] font-black uppercase cursor-pointer ${
                !minimized && size === sz
                  ? 'bg-rose-500 text-white'
                  : 'bg-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              {sz === 'sm' ? 'P' : sz === 'md' ? 'M' : 'G'}
            </button>
          ))}

          <button
            type="button"
            tabIndex={-1}
            onClick={handleCycleCorner}
            aria-label="Mover canto do Telão"
            title="Mover canto"
            className="p-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer"
          >
            <Move className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            tabIndex={-1}
            onClick={(e) => {
              e.currentTarget.blur();
              setMinimized((v) => !v);
            }}
            aria-label={minimized ? 'Expandir Telão' : 'Minimizar Telão'}
            title={minimized ? 'Expandir (continua tocando)' : 'Minimizar (continua tocando)'}
            className="p-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer"
          >
            {minimized ? (
              <Maximize2 className="w-3.5 h-3.5" />
            ) : (
              <Minimize2 className="w-3.5 h-3.5" />
            )}
          </button>

          <button
            type="button"
            tabIndex={-1}
            onClick={(e) => {
              e.currentTarget.blur();
              onClose();
            }}
            aria-label="Fechar Telão YouTube"
            className="p-1 rounded-md bg-slate-800 hover:bg-rose-600 text-slate-200 hover:text-white cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Link Input Form */}
      {(editingUrl || !source) && !minimized && (
        <form
          onSubmit={handleLoadSubmit}
          className="p-2.5 bg-slate-950/90 border-b border-slate-800 space-y-1.5"
        >
          <div className="flex gap-1.5">
            <label htmlFor="youtube-telao-url" className="sr-only">
              Link do YouTube
            </label>
            <input
              id="youtube-telao-url"
              type="text"
              value={urlInput}
              onChange={(e) => {
                setUrlInput(e.target.value);
                if (errorMsg) setErrorMsg(null);
              }}
              placeholder="Cole o link do YouTube (vídeo ou música)..."
              className="flex-1 min-w-0 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-rose-400"
            />
            <button
              type="submit"
              className="px-3 py-1.5 rounded-lg bg-rose-500 hover:bg-rose-400 text-white text-xs font-black flex items-center gap-1 shrink-0 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              Tocar
            </button>
          </div>
          {errorMsg ? (
            <p className="text-[11px] font-semibold text-rose-400">{errorMsg}</p>
          ) : (
            <p className="text-[10px] text-slate-400">
              Funciona com links youtube.com, youtu.be, Shorts ou Music enquanto você joga.
            </p>
          )}
        </form>
      )}

      {/* Keep iframe mounted while minimized so audio/music keeps playing */}
      {source && (
        <div
          className={`w-full bg-black transition-all ${
            minimized ? 'h-0 overflow-hidden' : 'aspect-video'
          }`}
        >
          <iframe
            key={source.videoId}
            src={source.embedUrl}
            title="Telão YouTube RT Run"
            className="w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        </div>
      )}

      {minimized && source && (
        <div className="px-3 py-1.5 text-[11px] font-bold text-emerald-300 flex items-center justify-between">
          <span>Reproduzindo em segundo plano</span>
          <button
            type="button"
            tabIndex={-1}
            onClick={(e) => {
              e.currentTarget.blur();
              setMinimized(false);
            }}
            className="text-rose-300 hover:underline font-black cursor-pointer"
          >
            Mostrar vídeo
          </button>
        </div>
      )}
    </section>
  );
}
