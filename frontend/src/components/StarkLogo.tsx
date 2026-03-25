interface Props {
  size?: number;
  className?: string;
}

export default function StarkLogo({ size = 32, className = '' }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Outer ring */}
      <circle cx="20" cy="20" r="18.5" stroke="var(--accent)" strokeWidth="1.5" opacity="0.7" />
      {/* Middle ring */}
      <circle cx="20" cy="20" r="12" stroke="var(--accent)" strokeWidth="1" opacity="0.5" />
      {/* Inner glow circle */}
      <circle cx="20" cy="20" r="5" fill="var(--accent)" opacity="0.15" />
      <circle cx="20" cy="20" r="3.5" fill="var(--accent)" opacity="0.9" />
      {/* Cross lines */}
      <line x1="20" y1="1" x2="20" y2="7" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" />
      <line x1="20" y1="33" x2="20" y2="39" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" />
      <line x1="1" y1="20" x2="7" y2="20" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" />
      <line x1="33" y1="20" x2="39" y2="20" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" />
      {/* Diagonal ticks */}
      <line x1="6.5" y1="6.5" x2="9.5" y2="9.5" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
      <line x1="30.5" y1="30.5" x2="33.5" y2="33.5" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
      <line x1="33.5" y1="6.5" x2="30.5" y2="9.5" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
      <line x1="9.5" y1="30.5" x2="6.5" y2="33.5" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
    </svg>
  );
}
