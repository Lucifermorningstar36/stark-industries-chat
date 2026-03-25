interface Props {
  label: string
  value: string | number
  sub?: string
  icon: React.ReactNode
  restricted?: boolean
}

export default function StatCard({ label, value, sub, icon, restricted }: Props) {
  return (
    <div className="si-panel rounded-lg relative overflow-hidden group hover:si-panel-bright transition-all duration-200 p-5">
      <div className="absolute top-0 left-0 w-3 h-3 bracket-tl" />
      <div className="absolute top-0 right-0 w-3 h-3 bracket-tr" />

      <div className="flex items-start justify-between mb-3">
        <div className="text-teal-600/70">{icon}</div>
        {restricted && (
          <span className="restricted text-[8px] tracking-widest px-1.5 py-0.5">RESTRICTED</span>
        )}
      </div>
      <div className="text-3xl font-bold text-slate-700 mb-1 tracking-tight">{value}</div>
      <div className="text-[10px] text-slate-500 tracking-widest uppercase font-medium">{label}</div>
      {sub && <div className="text-[9px] text-slate-400 mt-0.5 tracking-wider">{sub}</div>}

      <div className="absolute bottom-0 left-0 right-0 h-px bg-teal-500/0 group-hover:bg-teal-500/30 transition-all" />
    </div>
  )
}
