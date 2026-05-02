interface Props {
  size?: number;
  className?: string;
  showText?: boolean;
}

/**
 * StarkLogo — Unified logo component used across web, desktop, and mobile.
 * Hexagonal arc-reactor-inspired design with "STARK.NET" text option.
 * Uses CSS variables so it adapts to both light and dark themes.
 */
export default function StarkLogo({ size = 32, className = '', showText = false }: Props) {
  const textSize = size * 0.22;

  return (
    <svg
      width={showText ? size * 2.8 : size}
      height={size}
      viewBox={showText ? `0 0 ${112} 40` : '0 0 40 40'}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Stark Net Logo"
    >
      {/* ── Hexagon Shield ── */}
      {/* Outer hexagon */}
      <polygon
        points="20,1.5 36.5,10.75 36.5,29.25 20,38.5 3.5,29.25 3.5,10.75"
        stroke="var(--accent)"
        strokeWidth="1.5"
        fill="none"
        opacity="0.9"
      />
      {/* Inner hexagon */}
      <polygon
        points="20,7 31,13.5 31,26.5 20,33 9,26.5 9,13.5"
        stroke="var(--accent)"
        strokeWidth="0.8"
        fill="none"
        opacity="0.5"
      />

      {/* ── Arc Reactor Core ── */}
      {/* Outer glow ring */}
      <circle cx="20" cy="20" r="6.5" fill="var(--accent)" opacity="0.08" />
      {/* Middle ring */}
      <circle cx="20" cy="20" r="5" stroke="var(--accent)" strokeWidth="0.8" fill="none" opacity="0.6" />
      {/* Core */}
      <circle cx="20" cy="20" r="3" fill="var(--accent)" opacity="0.95" />
      {/* Core inner highlight */}
      <circle cx="18.5" cy="18.5" r="0.8" fill="white" opacity="0.7" />

      {/* ── Energy lines from core to hexagon edges ── */}
      <line x1="20" y1="1.5" x2="20" y2="15" stroke="var(--accent)" strokeWidth="1" opacity="0.5" />
      <line x1="20" y1="25" x2="20" y2="38.5" stroke="var(--accent)" strokeWidth="1" opacity="0.5" />
      <line x1="3.5" y1="10.75" x2="14.5" y2="17" stroke="var(--accent)" strokeWidth="1" opacity="0.4" />
      <line x1="25.5" y1="23" x2="36.5" y2="29.25" stroke="var(--accent)" strokeWidth="1" opacity="0.4" />
      <line x1="36.5" y1="10.75" x2="25.5" y2="17" stroke="var(--accent)" strokeWidth="1" opacity="0.4" />
      <line x1="14.5" y1="23" x2="3.5" y2="29.25" stroke="var(--accent)" strokeWidth="1" opacity="0.4" />

      {/* ── Corner accent dots ── */}
      <circle cx="20" cy="1.5" r="1.2" fill="var(--accent)" opacity="0.8" />
      <circle cx="36.5" cy="10.75" r="1" fill="var(--accent)" opacity="0.6" />
      <circle cx="36.5" cy="29.25" r="1" fill="var(--accent)" opacity="0.6" />
      <circle cx="20" cy="38.5" r="1.2" fill="var(--accent)" opacity="0.8" />
      <circle cx="3.5" cy="29.25" r="1" fill="var(--accent)" opacity="0.6" />
      <circle cx="3.5" cy="10.75" r="1" fill="var(--accent)" opacity="0.6" />

      {/* ── Optional STARK.NET text ── */}
      {showText && (
        <g transform="translate(44, 0)">
          <text
            x="0" y="22"
            fontFamily="'Segoe UI', 'SF Pro Display', -apple-system, sans-serif"
            fontWeight="900"
            fontSize="16"
            letterSpacing="3"
            fill="var(--text-accent)"
          >
            STARK
          </text>
          <text
            x="0" y="34"
            fontFamily="'Segoe UI', 'SF Pro Display', -apple-system, sans-serif"
            fontWeight="400"
            fontSize="9"
            letterSpacing="5"
            fill="var(--accent)"
            opacity="0.8"
          >
            .NET
          </text>
        </g>
      )}
    </svg>
  );
}
