export function TitleEmblem() {
  return (
    <div className="select-none">
      <svg
        viewBox="0 0 420 130"
        className="w-full max-w-[360px] h-auto drop-shadow-[0_8px_20px_rgba(0,0,0,0.65)]"
        role="img"
        aria-label="RT Run"
      >
        <defs>
          <linearGradient id="rtGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fde047" />
            <stop offset="55%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#ea580c" />
          </linearGradient>
          <linearGradient id="rtCyanGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#22d3ee" />
          </linearGradient>
        </defs>

        {/* Speed Skew Backing Plate */}
        <polygon
          points="18,18 398,8 378,108 6,118"
          fill="#090d1a"
          stroke="#f59e0b"
          strokeWidth="5"
        />
        <polygon
          points="26,26 386,18 369,99 15,108"
          fill="#111827"
        />

        {/* Speed Slash Bars */}
        <polygon points="0,42 32,38 26,52 -4,56" fill="#22d3ee" />
        <polygon points="384,72 418,68 412,82 378,86" fill="#ef4444" />

        {/* RT Bold Emblem */}
        <text
          x="36"
          y="88"
          fill="url(#rtGoldGrad)"
          stroke="#090d1a"
          strokeWidth="6"
          paintOrder="stroke fill"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontWeight="900"
          fontStyle="italic"
          fontSize="68"
          letterSpacing="-2"
        >
          RT
        </text>

        {/* RUN Bold Emblem */}
        <text
          x="152"
          y="88"
          fill="#ffffff"
          stroke="#090d1a"
          strokeWidth="6"
          paintOrder="stroke fill"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontWeight="900"
          fontStyle="italic"
          fontSize="66"
          letterSpacing="1"
        >
          RUN
        </text>

        {/* Accent Rail Line */}
        <rect x="34" y="96" width="320" height="5" rx="2.5" fill="url(#rtCyanGrad)" />
      </svg>
    </div>
  );
}
