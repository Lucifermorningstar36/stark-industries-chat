interface Props { time: Date }

export default function StatusBar({ time }: Props) {
  const items = [
    'STARK INTEL v1.0',
    'ENCRYPTION: AES-256',
    'FEEDS: 12 ACTIVE',
    'LATENCY: 2ms',
    'UPTIME: 99.9%',
  ]

  return (
    <div className="shrink-0 flex items-center justify-between px-4 py-1.5 z-10"
      style={{ borderTop: '1px solid rgba(59,130,246,0.15)', background: 'rgba(2,4,9,0.95)' }}>
      <div className="flex items-center gap-6">
        {items.map((item, i) => (
          <span key={i} className="text-[8px] font-mono text-blue-400/30 tracking-wider">{item}</span>
        ))}
      </div>
      <div className="flex items-center gap-3">
        <span className="text-[8px] font-mono text-blue-400/20">
          {time.toISOString().replace('T', ' ').slice(0, 19)} UTC
        </span>
        <a href="https://discord.gg/kePRXWKDak" target="_blank" rel="noreferrer"
          className="text-[8px] font-mono tracking-wider transition-colors"
          style={{ color: 'rgba(96,165,250,0.4)' }}>
          DISCORD
        </a>
      </div>
    </div>
  )
}
