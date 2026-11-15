import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Maximize2,
  Minimize2,
  Palette,
  Map as MapIcon,
  Trophy,
  Play,
  Volume2,
  VolumeX,
} from 'lucide-react';
import {
  EngineCallbacks,
  GamePhase,
  HudSnapshot,
  RTRunEngine,
  RunSummary,
} from './game/engine';
import { getMapById, getSkinById } from './game/catalog';
import { formatNoCoinTime } from './game/rules';
import { soundEngine } from './game/audio';
import {
  installAntiInspectProtection,
  toggleFullscreen,
} from './utils/antiInspect';
import {
  fetchMe,
  getStoredToken,
  PublicUser,
  savePreferences,
  setStoredToken,
  submitRun,
} from './utils/api';
import { TitleEmblem } from './components/TitleEmblem';
import { AuthPanel } from './components/AuthPanel';
import { CustomizeModal } from './components/CustomizeModal';
import { LeaderboardModal } from './components/LeaderboardModal';
import { AdminModal } from './components/AdminModal';
import { GameHud } from './components/GameHud';
import { StatusModal } from './components/StatusModal';

export default function App() {
  const canvasMountRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<RTRunEngine | null>(null);

  // High-frequency HUD refs (60Hz updates bypass React reconciliation)
  const scoreRef = useRef<HTMLSpanElement | null>(null);
  const distanceRef = useRef<HTMLSpanElement | null>(null);
  const coinsRef = useRef<HTMLSpanElement | null>(null);
  const noCoinTimerRef = useRef<HTMLSpanElement | null>(null);

  const [phase, setPhase] = useState<GamePhase>('title');
  const [selectedSkin, setSelectedSkin] = useState('rt-classic');
  const [selectedMap, setSelectedMap] = useState('metro-central');
  const [noCoinActive, setNoCoinActive] = useState(true);
  const [lockBannerMs, setLockBannerMs] = useState<number | null>(null);
  const [muted, setMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const [token, setToken] = useState<string | null>(() => getStoredToken());
  const [user, setUser] = useState<PublicUser | null>(null);

  const [customizeTab, setCustomizeTab] = useState<'skins' | 'maps' | null>(null);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);

  const [lastSummary, setLastSummary] = useState<RunSummary | null>(null);
  const [isNewNoCoinRecord, setIsNewNoCoinRecord] = useState(false);

  const tokenRef = useRef<string | null>(token);
  tokenRef.current = token;
  const phaseRef = useRef<GamePhase>(phase);
  phaseRef.current = phase;
  const modalOpenRef = useRef(false);
  modalOpenRef.current = Boolean(customizeTab || showLeaderboard || showAdmin);

  const lockBannerTimeoutRef = useRef<number>(0);

  // Anti-inspection & Fullscreen listener
  useEffect(() => {
    const cleanupAntiInspect = installAntiInspectProtection();
    const onFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => {
      cleanupAntiInspect();
      document.removeEventListener('fullscreenchange', onFsChange);
    };
  }, []);

  // Restore logged-in player session
  useEffect(() => {
    if (!token) return;
    fetchMe(token)
      .then((res) => {
        setUser(res.user);
        if (res.user.selectedSkin) {
          setSelectedSkin(res.user.selectedSkin);
          engineRef.current?.setSkin(res.user.selectedSkin);
        }
        if (res.user.selectedMap) {
          setSelectedMap(res.user.selectedMap);
          engineRef.current?.setMap(res.user.selectedMap);
        }
      })
      .catch(() => {
        setStoredToken(null);
        setToken(null);
        setUser(null);
      });
  }, [token]);

  const callbacksRef = useRef<EngineCallbacks>({
    onPhaseChange: () => {},
    onHudTick: () => {},
    onCoinLock: () => {},
    onGameOver: () => {},
  });

  callbacksRef.current = {
    onPhaseChange: (nextPhase: GamePhase) => {
      setPhase(nextPhase);
      if (nextPhase === 'playing') {
        setNoCoinActive(true);
        setLockBannerMs(null);
      }
    },
    onHudTick: (snap: HudSnapshot) => {
      if (scoreRef.current) {
        scoreRef.current.textContent = snap.score.toLocaleString('pt-BR');
      }
      if (distanceRef.current) {
        distanceRef.current.textContent = `${snap.distance}m`;
      }
      if (coinsRef.current) {
        coinsRef.current.textContent = String(snap.coins);
      }
      if (noCoinTimerRef.current) {
        noCoinTimerRef.current.textContent = formatNoCoinTime(snap.noCoinMs);
      }
      setNoCoinActive((prev) =>
        prev !== snap.noCoinActive ? snap.noCoinActive : prev
      );
    },
    onCoinLock: (lockedAtMs: number) => {
      setNoCoinActive(false);
      setLockBannerMs(lockedAtMs);
      window.clearTimeout(lockBannerTimeoutRef.current);
      lockBannerTimeoutRef.current = window.setTimeout(() => {
        setLockBannerMs(null);
      }, 2800);
    },
    onGameOver: async (summary: RunSummary) => {
      setLastSummary(summary);
      setIsNewNoCoinRecord(false);
      try {
        const res = await submitRun(tokenRef.current, summary);
        if (res.saved && res.user) {
          setUser(res.user);
          setIsNewNoCoinRecord(Boolean(res.isNewNoCoinRecord));
        }
      } catch {
        // non-blocking run save
      }
    },
  };

  // Initialize Three.js WebGL Engine once
  useEffect(() => {
    const mount = canvasMountRef.current;
    if (!mount) return;
    document.body.dataset.state = 'title';
    const engine = new RTRunEngine(
      mount,
      selectedSkin,
      selectedMap,
      callbacksRef
    );
    engineRef.current = engine;

    const params = new URLSearchParams(window.location.search);
    if (params.get('autostart') === '1') {
      engine.startRun();
    }

    return () => {
      window.clearTimeout(lockBannerTimeoutRef.current);
      engine.dispose();
      engineRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleStartGame = useCallback(() => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    setCustomizeTab(null);
    setShowLeaderboard(false);
    setShowAdmin(false);
    engineRef.current?.startRun();
  }, []);

  const handleToggleMute = useCallback(() => {
    soundEngine.muted = !soundEngine.muted;
    setMuted(soundEngine.muted);
  }, []);

  const handleToggleFullscreen = useCallback(async () => {
    const active = await toggleFullscreen();
    setIsFullscreen(active);
  }, []);

  // Global keyboard controls (WASD / Arrows / Space / P / Esc / M / F / Enter)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isTyping =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable);
      if (isTyping) return;

      const key = e.key.toLowerCase();
      const p = phaseRef.current;

      if (key === 'm') {
        handleToggleMute();
        return;
      }
      if (key === 'f') {
        handleToggleFullscreen();
        return;
      }

      if (p === 'title') {
        if (!modalOpenRef.current && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          handleStartGame();
        }
        return;
      }

      if (p === 'playing') {
        if (key === 'a' || e.key === 'ArrowLeft') {
          e.preventDefault();
          engineRef.current?.moveLane(-1);
        } else if (key === 'd' || e.key === 'ArrowRight') {
          e.preventDefault();
          engineRef.current?.moveLane(1);
        } else if (key === 'w' || e.key === 'ArrowUp' || e.key === ' ') {
          e.preventDefault();
          engineRef.current?.jump();
        } else if (key === 's' || e.key === 'ArrowDown') {
          e.preventDefault();
          engineRef.current?.slide();
        } else if (key === 'p' || e.key === 'escape') {
          e.preventDefault();
          engineRef.current?.pauseRun();
        }
        return;
      }

      if (p === 'paused') {
        if (key === 'p' || e.key === 'escape') {
          e.preventDefault();
          engineRef.current?.resumeRun();
        }
        return;
      }

      if (p === 'gameover') {
        if (!modalOpenRef.current && (e.key === 'Enter' || key === 'r')) {
          e.preventDefault();
          handleStartGame();
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleStartGame, handleToggleFullscreen, handleToggleMute]);

  // Touch swipe controls on gameplay viewport
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const handleTouchStart = (e: React.TouchEvent) => {
    if (phaseRef.current !== 'playing') return;
    const t = e.touches[0];
    if (t) touchStartRef.current = { x: t.clientX, y: t.clientY };
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (phaseRef.current !== 'playing' || !touchStartRef.current) return;
    const t = e.changedTouches[0];
    if (!t) return;
    const dx = t.clientX - touchStartRef.current.x;
    const dy = t.clientY - touchStartRef.current.y;
    touchStartRef.current = null;
    if (Math.abs(dx) < 24 && Math.abs(dy) < 24) return;
    if (Math.abs(dx) > Math.abs(dy)) {
      engineRef.current?.moveLane(dx < 0 ? -1 : 1);
    } else if (dy < 0) {
      engineRef.current?.jump();
    } else {
      engineRef.current?.slide();
    }
  };

  const handleSelectSkin = (skinId: string) => {
    setSelectedSkin(skinId);
    engineRef.current?.setSkin(skinId);
    if (token) {
      savePreferences(token, { selectedSkin: skinId })
        .then((res) => setUser(res.user))
        .catch(() => {});
    }
  };

  const handleSelectMap = (mapId: string) => {
    setSelectedMap(mapId);
    engineRef.current?.setMap(mapId);
    if (token) {
      savePreferences(token, { selectedMap: mapId })
        .then((res) => setUser(res.user))
        .catch(() => {});
    }
  };

  const handleAuthSuccess = (newToken: string, authedUser: PublicUser) => {
    setStoredToken(newToken);
    setToken(newToken);
    setUser(authedUser);
  };

  const handleLogout = () => {
    setStoredToken(null);
    setToken(null);
    setUser(null);
  };

  const refreshProfileAfterAdminChange = () => {
    if (!token) return;
    fetchMe(token)
      .then((res) => setUser(res.user))
      .catch(() => {
        // User may have been deleted by admin
        handleLogout();
      });
  };

  const activeSkin = getSkinById(selectedSkin);
  const activeMap = getMapById(selectedMap);

  return (
    <div
      className="relative w-screen h-screen overflow-hidden bg-neutral-950"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Dedicated isolated WebGL canvas container */}
      <div
        ref={canvasMountRef}
        data-testid="game-canvas-container"
        className="fixed inset-0 w-full h-full"
      />

      {/* TITLE SCREEN SHELL */}
      {phase === 'title' && (
        <div className="fixed inset-0 z-10 flex flex-col justify-between p-4 sm:p-7 pointer-events-none">
          {/* Top Bar: Utility Icons only */}
          <div className="flex items-center justify-end gap-2 pointer-events-auto">
            <button
              type="button"
              onClick={handleToggleMute}
              aria-label={muted ? 'Ativar Som' : 'Silenciar Som'}
              className="px-3 py-2 rounded-xl bg-[#090d1a]/88 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-slate-100 flex items-center gap-1.5 cursor-pointer"
            >
              {muted ? (
                <VolumeX className="w-4 h-4 text-rose-400" />
              ) : (
                <Volume2 className="w-4 h-4 text-emerald-300" />
              )}
              <span className="hidden sm:inline">
                {muted ? 'Mudo' : 'Som'}
              </span>
            </button>

            <button
              type="button"
              onClick={handleToggleFullscreen}
              aria-label={isFullscreen ? 'Sair da Tela Cheia' : 'Tela Cheia'}
              className="px-3.5 py-2 rounded-xl bg-[#090d1a]/88 hover:bg-slate-800 border border-amber-400/50 text-xs font-black text-amber-300 flex items-center gap-1.5 cursor-pointer"
            >
              {isFullscreen ? (
                <Minimize2 className="w-4 h-4" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
              <span>{isFullscreen ? 'Sair Tela Cheia' : 'Tela Cheia'}</span>
            </button>
          </div>

          {/* Main Asymmetric Split Leaving Center 3D Runner Unobstructed */}
          <div className="flex flex-col lg:flex-row items-center lg:items-end justify-between gap-6 my-auto">
            {/* Left Column: Brand Lockup & Primary Actions */}
            <div className="w-full max-w-sm flex flex-col items-start gap-4 pointer-events-auto">
              <TitleEmblem />

              <button
                type="button"
                data-start="true"
                onClick={handleStartGame}
                className="w-full sm:w-auto px-9 py-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-lg tracking-wide shadow-[0_10px_30px_rgba(245,158,11,0.4)] flex items-center justify-center gap-2.5 cursor-pointer transition-transform active:scale-95"
              >
                <Play className="w-5 h-5 fill-current" />
                CORRER AGORA
              </button>

              <div className="flex flex-wrap gap-2 w-full">
                <button
                  type="button"
                  onClick={() => setCustomizeTab('skins')}
                  className="px-3.5 py-2.5 rounded-xl bg-[#090d1a]/90 hover:bg-slate-800 border-2 border-slate-700 text-xs font-extrabold text-white flex items-center gap-2 cursor-pointer"
                >
                  <Palette className="w-4 h-4 text-amber-400" />
                  <span>Skin: {activeSkin.name}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCustomizeTab('maps')}
                  className="px-3.5 py-2.5 rounded-xl bg-[#090d1a]/90 hover:bg-slate-800 border-2 border-slate-700 text-xs font-extrabold text-white flex items-center gap-2 cursor-pointer"
                >
                  <MapIcon className="w-4 h-4 text-cyan-400" />
                  <span>Mapa: {activeMap.name}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowLeaderboard(true)}
                  className="px-3.5 py-2.5 rounded-xl bg-[#071a14]/92 hover:bg-emerald-950 border-2 border-emerald-500/60 text-xs font-black text-emerald-300 flex items-center gap-2 cursor-pointer"
                >
                  <Trophy className="w-4 h-4 text-emerald-400" />
                  <span>Top Global No Coin</span>
                </button>
              </div>
            </div>

            {/* Right Column: Login / Register + ADMIN Button */}
            <div className="pointer-events-auto w-full lg:w-auto flex justify-center lg:justify-end">
              <AuthPanel
                user={user}
                selectedSkin={selectedSkin}
                selectedMap={selectedMap}
                onAuthSuccess={handleAuthSuccess}
                onLogout={handleLogout}
                onOpenAdmin={() => setShowAdmin(true)}
              />
            </div>
          </div>

          {/* Bottom Flat Control Hint */}
          <div className="text-center">
            <p className="inline-block px-3 py-1 rounded-lg bg-[#090d1a]/80 text-[11px] sm:text-xs font-bold tracking-wide text-slate-200">
              A / D Mover · Espaço Pular · S Rolar · F Tela Cheia · P Pausar
            </p>
          </div>
        </div>
      )}

      {/* LIVE GAMEPLAY HUD */}
      {phase === 'playing' && (
        <GameHud
          scoreRef={scoreRef}
          distanceRef={distanceRef}
          coinsRef={coinsRef}
          noCoinTimerRef={noCoinTimerRef}
          noCoinActive={noCoinActive}
          lockBannerMs={lockBannerMs}
          muted={muted}
          isFullscreen={isFullscreen}
          onToggleMute={handleToggleMute}
          onPause={() => engineRef.current?.pauseRun()}
          onToggleFullscreen={handleToggleFullscreen}
          onSwipeAction={(action) => {
            if (action === 'left') engineRef.current?.moveLane(-1);
            else if (action === 'right') engineRef.current?.moveLane(1);
            else if (action === 'jump') engineRef.current?.jump();
            else if (action === 'slide') engineRef.current?.slide();
          }}
        />
      )}

      {/* PAUSE & GAME OVER MODALS */}
      {(phase === 'paused' || phase === 'gameover') && (
        <StatusModal
          mode={phase}
          summary={lastSummary}
          isNewNoCoinRecord={isNewNoCoinRecord}
          isGuest={!user}
          onResume={() => engineRef.current?.resumeRun()}
          onRestart={handleStartGame}
          onTitle={() => engineRef.current?.returnToTitle()}
          onOpenLeaderboard={() => setShowLeaderboard(true)}
        />
      )}

      {/* CUSTOMIZE SKINS & MAPS MODAL */}
      {customizeTab && (
        <CustomizeModal
          initialTab={customizeTab}
          selectedSkin={selectedSkin}
          selectedMap={selectedMap}
          onSelectSkin={handleSelectSkin}
          onSelectMap={handleSelectMap}
          onClose={() => setCustomizeTab(null)}
        />
      )}

      {/* GLOBAL TOP NO COIN MODAL */}
      {showLeaderboard && (
        <LeaderboardModal
          currentUserId={user?.id}
          onClose={() => setShowLeaderboard(false)}
        />
      )}

      {/* CONFIDENTIAL ADMIN PANEL MODAL */}
      {showAdmin && (
        <AdminModal
          onClose={() => setShowAdmin(false)}
          onDataChanged={refreshProfileAfterAdminChange}
        />
      )}
    </div>
  );
}
